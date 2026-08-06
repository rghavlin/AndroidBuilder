import { SafeEventEmitter } from './utils/SafeEventEmitter.js';
import { isIndoorFloor } from './map/TerrainTypes.js';
import { InventoryManager } from './inventory/InventoryManager.js';
import { LineOfSight } from './utils/LineOfSight.js';
import { ItemDefs } from './inventory/ItemDefs.js';
import { ItemTrait } from './inventory/traits.js';
import { WeatherManager } from './utils/WeatherManager.js';
import { QuestState } from './quest/QuestState.js';
import { FactionRegistry } from './ai/FactionRegistry.js';
import { getSightRangeForHour, getEffectiveHour, getLightMode, isNightHour, MAX_VISION_RANGE, FLASHLIGHT_RANGE } from './config/VisionConfig.js';
import { getHourFromTurn } from './utils/TimeUtils.js';
import * as DroneVision from './remote/DroneVision.js';
import { restoreOrders } from './remote/AutoWagonOrders.js';


import { gameRandom } from './utils/SeededRandom.js';
import Logger from './utils/Logger.js';

// Perf Phase 3: scoped logger for hot-path diagnostics. debug()/info() are
// no-ops in production and only fire in dev, so per-turn / per-frame logging
// no longer costs players anything.
const log = Logger.scope('GameEngine');
/**
 * GameEngine - The Central Source of Truth
 * 
 * This singleton class holds the master references to all core game entities.
 * It exists outside of the React lifecycle to prevent 'fragility' and 
 * synchronization issues during initialization and hot-reloads.
 */
class GameEngine extends SafeEventEmitter {
  constructor() {
    super();
    
    // Bind internal handlers
    this._handlePlayerStateChange = this._handlePlayerStateChange.bind(this);
    this._handleNpcDeath = this._handleNpcDeath.bind(this);
    this._handleInventoryChange = this._handleInventoryChange.bind(this);

    this.reset();

    // Register global event listeners that persist across game resets
    this.on('npcDied', this._handleNpcDeath);
    
    // Global accessibility for Dev Console and debugging
    if (typeof window !== 'undefined') {
      window.gameEngine = this;
    }
    if (typeof globalThis !== 'undefined') {
      globalThis.gameEngine = this;
    }
  }

  reset() {
    // Unsubscribe from old player
    if (this.player && this.player.off) {
      this.player.off('stateChanged', this._handlePlayerStateChange);
    }
    
    // Unsubscribe from old inventoryManager
    if (this.inventoryManager && this._handleInventoryChange) {
      this.inventoryManager.off('inventoryChanged', this._handleInventoryChange);
    }

    // Cleanup old worldManager
    if (this.worldManager && typeof this.worldManager.cleanup === 'function') {
      this.worldManager.cleanup();
    }

    if (this._heartbeatId) {
      cancelAnimationFrame(this._heartbeatId);
      this._heartbeatId = null;
    }

    // Release any in-flight visual actions BEFORE dropping them. TurnManager
    // awaits each SequencerAction.promise, which only resolves from the
    // heartbeat — discarding an unresolved action would leave processQueue
    // awaiting forever, isProcessing stuck true, and every future turn aborted
    // with "Already processing" (enemies frozen for the rest of the session).
    this.flushActiveActions();

    this.id = gameRandom.nextInt(0, 999999);
    console.log(`[GameEngine] 🚀 Initialized with ID: ${this.id}`);
    this.player = null;
    this.gameMap = null;
    this.worldManager = null;
    this.inventoryManager = new InventoryManager();
    this.inventoryManager.on('inventoryChanged', this._handleInventoryChange);
    this.camera = null;
    if (this.zombieTracker) {
      this.zombieTracker.clearAllTracking();
    }
    this.lootGenerator = null;
    this.isInitialized = false;
    this.initializationState = 'idle';
    this.lastUpdate = Date.now();
    this.updateCount = 0;
    this.isAutosaving = false;
    this.turn = 1;
    this.isFlashlightOn = false;
    // Remote-device camera/control focus (recon drone, later others). null =
    // the player is in control; otherwise the id of the Drone entity the
    // phone button last cycled to. See remote/RemoteDeviceRegistry.js.
    this.activeDeviceId = null;
    // True while a remote device is mid-flight tween. MapCanvas's gated render
    // loop has no React state for devices (unlike isAnimatingMovement for the
    // player), so this is what keeps it painting continuously during a flight.
    this.isDeviceAnimating = false;
    // How many remote-device tweens are in flight. Reference counted because
    // playback lanes run concurrently — see remote/RemoteTween.js.
    this._deviceTweenCount = 0;
    // Which verb a click on the map issues to the linked device: 'remote' drives
    // it here and now for player AP, 'auto' hands it a destination to reach on
    // its own turns. Transient and never saved — a control mode outliving the
    // session that set it would silently re-task a wagon on the next stray
    // click. See remote/AutoWagonOrders.js.
    this.deviceControlMode = 'remote';
    // Standing orders for autonomous wagons, keyed by item instanceId. A side
    // table rather than a field on each wagon because the on-map save path
    // serializes items through a whitelist that would drop it — see the module
    // header in remote/AutoWagonOrders.js for the full reasoning.
    this.autoWagonOrders = new Map();
    // Turn number the equipped phone last charged, so cycling devices or
    // toggling the phone off/on within the same turn never costs a second
    // charge (see remote/DronePower.consumePhoneChargeOncePerTurn).
    this._phoneChargeTurn = null;
    this.playerFieldOfView = []; // Phase 13: Atomic FOV
    this.playerFovSet = new Set(); // Perf Phase 2: cached "x,y" visibility Set for the renderer
    // Perf Phase 6: the player's interpolated position during a walk tween.
    // MUTATED IN PLACE (never reassigned) by PlayerContext's animation loop and
    // read straight off the engine by MapCanvas, so the tween drives the canvas
    // without a React state write — and therefore without a provider-wide
    // re-render — on every one of its ~90 frames. At rest it tracks the
    // player's logical tile.
    this.playerRenderPosition = { x: 0, y: 0 };
    this._fovOptions = { maxRange: MAX_VISION_RANGE, isNight: false, isFlashlightOn: false, flashlightRange: FLASHLIGHT_RANGE, isNightVision: false };
    this._lastFovOptionsHash = ''; // Cache hash to throttle redundant FOV updates
    this.renderDebugColors = false; 
    this.seeThroughWalls = false;

    // Phase 24: Interaction State (Silo Bridge)
    this.turnPhase = 'PLAYER_TURN'; // 'PLAYER_TURN', 'SIMULATING', 'ANIMATING', 'PAUSED_FOR_EVENT'
    // Quest system (Phase 4): gates click-to-move in GameMapContext.handleTileClick.
    // Set/cleared by EventRunner's lockMovement/unlockMovement steps.
    this.movementLocked = false;
    // Quest system: gates map interactions (door/window/npc menus, combat &
    // item targeting) in MapInterface.tsx's onCellClick/onCellRightClick.
    // Deliberately separate from turnPhase/isPlayerTurn so the End Turn button
    // stays enabled while this is set — the intended way out of a lockActions
    // gate is usually to end the turn (e.g. to refill AP). Set/cleared by
    // EventRunner's lockActions/unlockActions steps; also implies movementLocked.
    this.actionsLocked = false;
    this.isSleeping = false;
    this.sleepProgress = 0;
    this.sleepingInWagonInstanceId = null;
    this.targetingItemInstanceId = null;
    this.dragging = null; // Phase 25: Drag Mechanic
    this.riding = null;   // Scooter Riding Slot
    if (this.inventoryManager) {
      this.inventoryManager.draggedItem = null;
      this.inventoryManager.ridingItem = null;
    }
    
    // Weather System
    this.weather = { type: 'clear', intensity: 0 }; 
    this.weatherManager = new WeatherManager(this);

    // Phase: Book Tracking
    // Fresh-game defaults are derived from each READABLE book definition's
    // totalPages (single-sourced in ItemDefs). A loaded save overrides these
    // wholesale via GameSaveSystem (engine.bookStats = saveData.bookStats).
    this.bookStats = {};
    for (const [defId, def] of Object.entries(ItemDefs)) {
      if (def.traits?.includes(ItemTrait.READABLE)) {
        const isNomad = defId.startsWith('book.nomad_survivor_');
        this.bookStats[defId] = {
          pagesLeft: isNomad ? 0 : def.totalPages, // Track how many pages remain to be read
          milestonesReached: 0 // Track how many 100-page milestones were processed
        };
      }
    }

    // Phase: Crafting Queue (multi-turn crafting)
    // Fresh-game default is null (no item in progress). A loaded save overrides
    // this wholesale via GameSaveSystem (engine.craftingQueue = saveData.craftingQueue).
    this.craftingQueue = null;

    // Quest system: global flags/variables backing event preconditions and quest
    // progress. Fresh-game default is empty; a loaded save restores it wholesale
    // via GameSaveSystem (engine.questState.fromJSON(saveData.questState)).
    this.questState = new QuestState();

    // Faction stance table: back to built-ins on every reset. A loaded map layers
    // its authored factions on top via applyMapRegistries(); a loaded save layers
    // runtime stance deltas via FactionRegistry.fromJSON() (see GameSaveSystem).
    FactionRegistry.reset();

    // Global event cleanups (Removed this.removeAllListeners() to preserve React Provider context listeners on reset)

    // Phase 4: Master Heartbeat Infrastructure
    this.activeActions = new Set();
    this.lastFrameTime = performance.now();
    this.startHeartbeat();

    // UI dirty-flag tracking
    this._uiDirty = true;
    this._uiSnapshot = null;
  }

  /**
   * Start the Master Heartbeat loop using requestAnimationFrame.
   * This drives all time-dependent visual actions registered with the engine.
   */
  startHeartbeat() {
    if (typeof requestAnimationFrame === 'undefined') {
      console.log('[GameEngine] requestAnimationFrame is not defined (likely running in a non-browser/Node environment). Skipping heartbeat loop.');
      return;
    }

    if (this._heartbeatId) {
      cancelAnimationFrame(this._heartbeatId);
    }

    const loop = (now) => {
      const dt = now - this.lastFrameTime;
      this.lastFrameTime = now;

      // Update all active visual actions with delta time
      if (this.activeActions.size > 0) {
        for (const action of this.activeActions) {
          if (typeof action.update === 'function') {
            action.update(dt);
            if (action.isComplete) {
              this.activeActions.delete(action);
            }
          } else {
            // Safety cleanup for invalid actions
            this.activeActions.delete(action);
          }
        }
      }

      this._heartbeatId = requestAnimationFrame(loop);
    };
    this._heartbeatId = requestAnimationFrame(loop);
  }

  /**
   * Register a new visual action with the master ticker.
   * @param {Object} action - An object with update(dt) and isComplete property.
   */
  registerAction(action) {
    if (action && typeof action.update === 'function') {
      this.activeActions.add(action);
    }
  }

  /**
   * Resolve and drop all in-flight visual actions. MUST be used instead of
   * activeActions.clear(): awaiting callers (TurnManager.processQueue) hang
   * forever on actions that leave the heartbeat without resolving.
   */
  flushActiveActions() {
    if (!this.activeActions) return;
    for (const action of this.activeActions) {
      if (typeof action.resolve === 'function') {
        action.resolve();
      }
      action.isComplete = true;
    }
    this.activeActions.clear();
  }

  /**
   * Atomic synchronization of all game objects.
   * Called by the GameInitializationManager or GameContext when a map loads.
   */
  sync(gameObjects) {
    console.log('[GameEngine] 🔄 Synchronizing engine state:', Object.keys(gameObjects));

    // Resolve-and-clear any pending visual actions from the previous state
    // (plain clear() would strand TurnManager awaits — see flushActiveActions)
    this.flushActiveActions();
    
    if (gameObjects.player) {
       // Detach from old player if exists
       if (this.player && this.player.off) {
         this.player.off('stateChanged', this._handlePlayerStateChange);
       }
       
       this.player = gameObjects.player;
       
       // Attach to new player
       if (this.player && this.player.on) {
         this.player.on('stateChanged', this._handlePlayerStateChange);
       }
    }
    if (gameObjects.gameMap) this.gameMap = gameObjects.gameMap;
    if (gameObjects.worldManager) {
      if (this.worldManager && typeof this.worldManager.cleanup === 'function') {
        this.worldManager.cleanup();
      }
      this.worldManager = gameObjects.worldManager;
    }
    if (gameObjects.inventoryManager) {
      if (this.inventoryManager && this._handleInventoryChange) {
        this.inventoryManager.off('inventoryChanged', this._handleInventoryChange);
      }
      this.inventoryManager = gameObjects.inventoryManager;
      this.inventoryManager.on('inventoryChanged', this._handleInventoryChange);
    }
    if (gameObjects.camera) this.camera = gameObjects.camera;
    if (gameObjects.zombieTracker) {
      this.zombieTracker = gameObjects.zombieTracker;
    } else if (this.zombieTracker) {
      this.zombieTracker.clearAllTracking();
    }
    if (gameObjects.lootGenerator) this.lootGenerator = gameObjects.lootGenerator;
    if (gameObjects.turn !== undefined) this.turn = gameObjects.turn;
    
    // Restore Phase 24 interaction state if present
    if (gameObjects.interactionState) {
      this.turnPhase = gameObjects.interactionState.isPlayerTurn !== undefined 
        ? (gameObjects.interactionState.isPlayerTurn ? 'PLAYER_TURN' : 'SIMULATING')
        : 'PLAYER_TURN';
      this.isFlashlightOn = gameObjects.interactionState.isFlashlightOn ?? false;
      // Only restore the camera/control focus if the device actually survived
      // map restoration — otherwise fall back to the player rather than
      // pointing control at an id nothing answers to. Both of a device's homes
      // count: an RC wagon under the player's feet lives in the ground
      // container, not on the map. (inventoryManager is assigned above.)
      const savedDeviceId = gameObjects.interactionState.activeDeviceId ?? null;
      const deviceExists = !!savedDeviceId && (
        !!this.gameMap?.getEntity?.(savedDeviceId) ||
        (this.inventoryManager?.groundContainer?.getAllItems?.() || [])
          .some(it => it?.instanceId === savedDeviceId)
      );
      this.activeDeviceId = deviceExists ? savedDeviceId : null;
      // Same both-homes validation, applied per order: a marker for a wagon
      // that was scrapped three saves ago would sit on the map forever.
      this.deviceControlMode = 'remote';
      restoreOrders(this, gameObjects.interactionState.autoWagonOrders);
      this._phoneChargeTurn = gameObjects.interactionState.phoneChargeTurn ?? null;
      this.isSleeping = gameObjects.interactionState.isSleeping ?? false;
      this.sleepProgress = gameObjects.interactionState.sleepProgress ?? 0;
      this.sleepingInWagonInstanceId = gameObjects.interactionState.sleepingInWagonInstanceId ?? null;
      this.targetingItemInstanceId = gameObjects.interactionState.targetingItemInstanceId ?? null;
      
      // Phase 25: Restore dragging state
      if (gameObjects.interactionState.dragging && this.inventoryManager) {
        const draggingData = gameObjects.interactionState.dragging;
        const item = this.inventoryManager.groundContainer.getAllItems().find(it => it.instanceId === draggingData.itemInstanceId);
        if (item) {
          this.dragging = {
            item,
            tileX: draggingData.tileX,
            tileY: draggingData.tileY
          };
          this.inventoryManager.draggedItem = item;
        } else {
          this.dragging = null;
          this.inventoryManager.draggedItem = null;
        }
      } else {
        this.dragging = null;
        if (this.inventoryManager) this.inventoryManager.draggedItem = null;
      }

      // Restore Phase 25: Restore riding state
      if (gameObjects.interactionState.riding && this.inventoryManager) {
        const ridingData = gameObjects.interactionState.riding;
        const item = this.inventoryManager.groundContainer.getAllItems().find(it => it.instanceId === ridingData.itemInstanceId);
        if (item) {
          this.riding = {
            item,
            tileX: ridingData.tileX,
            tileY: ridingData.tileY
          };
          this.inventoryManager.ridingItem = item;
        } else {
          this.riding = null;
          this.inventoryManager.ridingItem = null;
        }
      } else {
        this.riding = null;
        if (this.inventoryManager) this.inventoryManager.ridingItem = null;
      }

      // Restore weatherManager state
      if (gameObjects.interactionState.weatherState) {
        this.weatherManager.fromJSON(gameObjects.interactionState.weatherState);
      }
    }

    this.isInitialized = true;
    this.initializationState = 'complete';
    
    // Immediate FOV update on sync
    this.invalidateFOV();
    this.recalculateFOV();

    this.lastUpdate = Date.now();
    this.updateCount++;
    console.log(`[GameEngine] 🔄 Synchronization Pulse #${this.updateCount} emitted`);
    
    this._uiDirty = true;
    this.emit('sync', this);
    this.emit('update', this);
  }

  /**
   * Update a specific property and notify sub-contexts.
   */
  updateProperty(key, value) {
    if (this[key] === value) return;
    
    this[key] = value;
    this._uiDirty = true;
    this.lastUpdate = Date.now();
    this.updateCount++;
    console.log(`[GameEngine] 📈 Property Update Pulse #${this.updateCount} emitted (key: ${key})`);
    this.emit('update', this);
    
    // Explicitly emit state changes for initialization
    if (key === 'initializationState') {
      this.emit('stateChanged', value);
    }
  }

  invalidateFOV() {
    this._lastFovOptionsHash = '';
  }

  /**
   * Signal a significant change in game state (e.g. turn end)
   */
  notifyUpdate() {
    this.invalidateFOV(); // Ensure FOV is recalculated on game state updates
    this.recalculateFOV(); // Ensure FOV matches position before pulse
    this.lastUpdate = Date.now();
    this.updateCount++;
    this._uiDirty = true;
    log.debug(`🔔 Pulse #${this.updateCount} emitted`);
    this.emit('update', this);
  }

  /**
   * Alias for notifyUpdate used during map transitions
   * Also emits 'sync' to force sub-context Ref updates
   */
  notifySync() {
    this._uiDirty = true;
    this.emit('sync', this);
    this.notifyUpdate();
  }

  /**
   * Update FOV options and trigger a pulse ONLY if values have changed.
   */
  setFOVOptions(options) {
    let changed = false;
    for (const key in options) {
      if (this._fovOptions[key] !== options[key]) {
        this._fovOptions[key] = options[key];
        changed = true;
      }
    }

    if (changed) {
      this.notifyUpdate();
    }
  }

  /**
   * Set global weather state
   * @param {string} type - 'clear', 'rain'
   * @param {number} intensity - 0.0 to 1.0
   */
  setWeather(type, intensity = 0.5) {
    this.weather = { type, intensity };
    console.log(`[GameEngine] 🌦️ Weather set to: ${type} (Intensity: ${intensity})`);
    this.notifyUpdate();
  }

   /**
    * Atomic FOV calculation
    * @param {Object} customPos - Optional {x, y} to calculate from (for movement sync)
    * @returns {boolean} True if recalculation occurred, false if skipped
    */
   recalculateFOV(customPos = null) {
     if (!this.gameMap || !this.player) return false;
 
     try {
       // Phase 13 & 19 Fix: LOS center MUST be integers for Bresenham's algorithm to function.
       // We allow passing a custom position (like playerRenderPosition) for smooth vision updates.
       const posX = customPos ? customPos.x : this.player.x;
       const posY = customPos ? customPos.y : this.player.y;

       const roundX = Math.round(posX);
       const roundY = Math.round(posY);
       // Lighting is driven entirely by the map's *effective* hour: the real
       // clock hour on a normal map, or the hour an always_light/always_dark map
       // is pinned to (noon / midnight). Both ambient sight range and isNight
       // fall out of that one number, so a powered interior behaves exactly like
       // a standard map at noon — see VisionConfig.getEffectiveHour.
       const lightMode = getLightMode(this.gameMap?.metadata);
       const effectiveHour = getEffectiveHour(this.gameMap?.metadata, getHourFromTurn(this.turn));
       const isNight = isNightHour(effectiveHour);
       // Base ambient sight range for that hour (15 at noon, before perception bonus)
       const baseRange = getSightRangeForHour(effectiveHour, this._fovOptions.maxRange);

       const { isFlashlightOn, flashlightRange, isAimingWithScope, isNightVision } = this._fovOptions;
       let range = isNight ? (isFlashlightOn ? Math.max(baseRange, flashlightRange) : baseRange) : baseRange;
       
       // Phase NVG: Night Vision range override
       if (isFlashlightOn && isNightVision) {
         if (isNight) {
           range = this._fovOptions.maxRange; // Full day range at night
         } else {
           range = 0.5; // Blindingly bright during day - only see own tile
         }
       }
       
       // Scope Visibility restriction
       if (isAimingWithScope) {
         const canSeeThroughScope = !isNight || (isFlashlightOn && isNightVision);
         if (canSeeThroughScope) {
           range = 20;
         }
       }

       // Apply Perception sight range bonus to final vision range (applies uniformly to day, night, flashlight, etc.)
       const perceptionBonus = this.player ? Math.floor((this.player.currentPerception || 0) / 20) : 0;
       range += perceptionBonus;

       // Weather reduction: reduce sight range by 15% when raining, 20% in heavy rain (intensity > 0.7)
       // Skip weather reduction if the player is inside (standing on floor or
       // tent_floor terrain). Both pinned light modes are interior facilities
       // (powered / unpowered), so weather never reaches the player there.
       const playerTile = this.gameMap.getTile(roundX, roundY);
       const isInside = (playerTile && isIndoorFloor(playerTile.terrain)) || lightMode !== 'time_dependent';
       if (!isInside && this.weather && this.weather.type === 'rain') {
         const isHeavyRain = this.weather.intensity > 0.7;
         const reduction = isHeavyRain ? 0.20 : 0.15;
         range = range * (1 - reduction);
       }

       if (typeof range !== 'number' || isNaN(range) || range <= 0) {
         range = 15;
       }
 
       // (Perf Phase 3: removed the per-frame [recalculateFOV] console.log here —
       // it fired 60x/sec during movement, before the dedupe early-return below.)

       // Compute FOV state hash to prevent redundant calculation on same tile / options.
       // Includes each airborne device's id/position/range so the dedupe below
       // can't swallow a repaint when only a drone moves and the player doesn't
       // — that gap was the sharpest trap in wiring devices into FOV.
       const optionsHash = `${roundX},${roundY},${range},${isNight},${isFlashlightOn},${isNightVision},${isAimingWithScope},${this.weather ? this.weather.type : 'clear'},${this.weather ? this.weather.intensity : 0},${this.turn},${DroneVision.deviceFovHashPart(this.gameMap, this)}`;
       if (optionsHash === this._lastFovOptionsHash) {
         return false; // Skip calculation
       }
       this._lastFovOptionsHash = optionsHash;
       this._uiDirty = true;

       const fovCenter = { 
         x: roundX, 
         y: roundY, 
         id: this.player.id 
       };
 
       const fovData = LineOfSight.calculateFieldOfView(this.gameMap, fovCenter, {
        maxRange: range,
        ignoreTerrain: [],
        ignoreEntities: [this.player.id]
      });

      this.playerFieldOfView = fovData.visibleTiles;

      // Phase 28: Add light from ground sources (Campfires, lit torches)
      if (isNight) {
        const finalVisibleTiles = [...fovData.visibleTiles];
        const visibleKeySet = new Set(finalVisibleTiles.map(t => `${t.x},${t.y}`));
        
        const roundPosX = roundX;
        const roundPosY = roundY;

        // Find lit items on the ground within player's maximum potential vision range (distance <= 25)
        const groundItems = this.gameMap.getEntitiesByType('item');
        for (const item of groundItems) {
          const itemX = item.logicalX !== undefined ? item.logicalX : item.x;
          const itemY = item.logicalY !== undefined ? item.logicalY : item.y;
          if (itemX === undefined || itemY === undefined) continue;

          const dx = itemX - roundPosX;
          const dy = itemY - roundPosY;
          if (dx * dx + dy * dy > 625) continue; // 25 squared

          const def = ItemDefs[item.defId];
          if (!def || !def.lightRange) continue;

          // Check if lit: campfires use lifetimeTurns, others use isLit / isOn
          const isLit = item.defId === 'placeable.campfire'
            ? (item.lifetimeTurns || 0) > 0
            : (item.defId === 'tool.battery_powered_hotplate' ? item.isOn : item.isLit);

          if (isLit) {
            const itemRange = def.lightRange;
            const itemFov = LineOfSight.getVisibleTiles(this.gameMap, itemX, itemY, { maxRange: itemRange });
            
            itemFov.forEach(illuminatedTile => {
              const key = `${illuminatedTile.x},${illuminatedTile.y}`;
              if (visibleKeySet.has(key)) return;

              const pDx = illuminatedTile.x - roundPosX;
              const pDy = illuminatedTile.y - roundPosY;
              if (pDx * pDx + pDy * pDy > 400) return; // 20 squared

              // Only reveal the illuminated tile if the player has LOS to it!
              const playerToTileLOS = LineOfSight.hasLineOfSight(this.gameMap, roundPosX, roundPosY, illuminatedTile.x, illuminatedTile.y, { maxRange: 20 });
              if (playerToTileLOS.hasLineOfSight) {
                finalVisibleTiles.push(illuminatedTile);
                visibleKeySet.add(key);
              }
            });
          }
        }
        
        // Phase 28B: Check items in the ground container (items at player's current tile)
        if (this.inventoryManager && this.inventoryManager.groundContainer) {
          const groundItems = this.inventoryManager.groundContainer.getAllItems();
          groundItems.forEach(item => {
            const def = ItemDefs[item.defId];
            if (!def || !def.lightRange) return;

            // Check if lit: campfires use lifetimeTurns, others use isLit
            const isLit = (item.defId === 'placeable.campfire' || item.defId === 'placeable.campfire_stone') 
              ? (item.lifetimeTurns || 0) > 0 
              : ((item.defId === 'tool.battery_powered_hotplate') ? item.isOn : item.isLit);

            if (isLit) {
              const itemRange = def.lightRange;
              // Ground items are at player's feet
              const itemFov = LineOfSight.getVisibleTiles(this.gameMap, roundPosX, roundPosY, { maxRange: itemRange });
              
              itemFov.forEach(illuminatedTile => {
                const key = `${illuminatedTile.x},${illuminatedTile.y}`;
                if (visibleKeySet.has(key)) return;

                const playerToTileLOS = LineOfSight.hasLineOfSight(this.gameMap, roundPosX, roundPosY, illuminatedTile.x, illuminatedTile.y, { maxRange: 20 });
                if (playerToTileLOS.hasLineOfSight) {
                  finalVisibleTiles.push(illuminatedTile);
                  visibleKeySet.add(key);
                }
              });
            }
          });
        }
        
        this.playerFieldOfView = finalVisibleTiles;
      }

      // Remote devices (recon drone, linked RC wagon) extend vision
      // independently of the player's own position — conceptually the rifle
      // scope's range extension, except the center is mobile. Tiles are only
      // ever ADDED here; the explored-flag pass right below applies to them
      // exactly like any player-seen tile, so no renderer changes are needed.
      const deviceTiles = DroneVision.collectDeviceFov(this.gameMap, range, this);
      if (deviceTiles.length > 0) {
        const seenKeys = new Set(this.playerFieldOfView.map(t => `${Math.round(t.x)},${Math.round(t.y)}`));
        const merged = [...this.playerFieldOfView];
        for (const tile of deviceTiles) {
          const key = `${Math.round(tile.x)},${Math.round(tile.y)}`;
          if (!seenKeys.has(key)) {
            merged.push(tile);
            seenKeys.add(key);
          }
        }
        this.playerFieldOfView = merged;
      }

      // Update explored flags (Silent mutation, will stay in sync with pulse)
      // and build the render-side visibility Set once here (Perf Phase 2), so
      // MapCanvas no longer rebuilds it from the FOV array every frame.
      const fovSet = new Set();
      this.playerFieldOfView.forEach(pos => {
        const rx = Math.round(pos.x);
        const ry = Math.round(pos.y);
        const tile = this.gameMap.getTile(rx, ry);
        if (tile) {
          if (!tile.flags) tile.flags = {};
          tile.flags.explored = true;
        }
        fovSet.add(`${rx},${ry}`);
      });
      this.playerFovSet = fovSet;
      return true;
    } catch (error) {
       console.error('[GameEngine] FOV Error:', error);
       return false;
    }
  }

  // Getters for common state to avoid null checks everywhere in the future
  isReady() {
    return this.isInitialized && this.player && this.gameMap;
  }

  /**
   * Internal handler for player state changes
   * Bridges standalone entity events to the global engine update signal
   */
  _handlePlayerStateChange() {
    log.debug('👤 Player state change detected -> triggering global pulse');
    this.notifyUpdate();
  }

  /**
   * Internal handler for NPC death events
   */
  _handleNpcDeath(eventData) {
    console.log(`[GameEngine] 💀 NPC Death detected at (${eventData.x}, ${eventData.y})`);
    if (!this.gameMap) return;

    const { x, y, items } = eventData;
    
    if (items && items.length > 0) {
      const existingItems = this.gameMap.getItemsOnTile(x, y) || [];
      this.gameMap.setItemsOnTile(x, y, [...existingItems, ...items]);
      console.log(`[GameEngine] Dropped ${items.length} items from NPC at (${x}, ${y})`);
      
      // If player is on the same tile, sync the ground container
      if (this.player && this.player.x === x && this.player.y === y && this.inventoryManager) {
        this.inventoryManager.refreshGroundItems(x, y, this.gameMap);
      }
    }
    
    this.notifyUpdate();
  }

  /**
   * External store subscription for React (Atomic Bridge)
   */
  subscribe(callback) {
    this.on('update', callback);
    return () => this.off('update', callback);
  }

  /**
   * External store snapshot for React (Atomic Bridge)
   */
  _handleInventoryChange() {
    log.debug('📦 Inventory change detected -> triggering global pulse');
    this._uiDirty = true;
    this.notifyUpdate();
  }

  getSnapshot() {
    if (!this._uiSnapshot || this._uiDirty) {
      this._uiSnapshot = {
        id: this.id,
        turn: this.turn,
        turnPhase: this.turnPhase,
        isFlashlightOn: this.isFlashlightOn,
        isSleeping: this.isSleeping,
        initializationState: this.initializationState,
        playerStats: this.player ? {
          hp: this.player.hp,
          maxHp: this.player.maxHp,
          ap: this.player.ap,
          maxAp: this.player.maxAp,
          isBleeding: this.player.isBleeding,
          condition: this.player.condition,
          sickness: this.player.sickness,
          woundInfection: this.player.woundInfection,
          drunkenness: this.player.drunkenness || 0,
          energy: this.player.energy,
          nutrition: this.player.nutrition,
          hydration: this.player.hydration,
          x: this.player.x,
          y: this.player.y
        } : null,
        inventoryUpdate: this.inventoryManager ? (this.inventoryManager._updateCount || 0) : 0,
        weather: { ...this.weather }
      };
      this._uiDirty = false;
    }
    return this._uiSnapshot;
  }
}

// Singleton instance
const engine = new GameEngine();
export default engine;
