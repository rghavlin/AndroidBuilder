import { SafeEventEmitter } from './utils/SafeEventEmitter.js';
import { InventoryManager } from './inventory/InventoryManager.js';
import { LineOfSight } from './utils/LineOfSight.js';
import { ItemDefs } from './inventory/ItemDefs.js';
import { WeatherManager } from './utils/WeatherManager.js';
import { getSightRangeForHour } from './config/VisionConfig.js';


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
    this.reset();
    
    // Bind internal handlers
    this._handlePlayerStateChange = this._handlePlayerStateChange.bind(this);
    this._handleNpcDeath = this._handleNpcDeath.bind(this);
    
    // Global event listeners
    this.on('npcDied', this._handleNpcDeath);
    
    // Global accessibility for Dev Console and debugging
    if (typeof window !== 'undefined') {
      window.gameEngine = this;
    }
  }

  reset() {
    if (this._heartbeatId) {
      cancelAnimationFrame(this._heartbeatId);
      this._heartbeatId = null;
    }

    this.id = Math.floor(Math.random() * 1000000);
    console.log(`[GameEngine] 🚀 Initialized with ID: ${this.id}`);
    this.player = null;
    this.gameMap = null;
    this.worldManager = null;
    this.inventoryManager = new InventoryManager();
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
    this.playerFieldOfView = []; // Phase 13: Atomic FOV
    this._fovOptions = { maxRange: 15, isNight: false, isFlashlightOn: false, flashlightRange: 8, isNightVision: false };
    this._lastFovOptionsHash = ''; // Cache hash to throttle redundant FOV updates
    this.renderDebugColors = false; 
    this.seeThroughWalls = false;

    // Phase 24: Interaction State (Silo Bridge)
    this.turnPhase = 'PLAYER_TURN'; // 'PLAYER_TURN', 'SIMULATING', 'ANIMATING', 'PAUSED_FOR_EVENT'
    this.isSleeping = false;
    this.sleepProgress = 0;
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
    this.bookStats = {
      'book.life_in_motion': {
        pagesLeft: 500,
        milestonesReached: 0 // Track how many 100-page milestones were processed
      }
    };

    // Phase 4: Master Heartbeat Infrastructure
    this.activeActions = new Set();
    this.lastFrameTime = performance.now();
    this.startHeartbeat();
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
   * Atomic synchronization of all game objects.
   * Called by the GameInitializationManager or GameContext when a map loads.
   */
  sync(gameObjects) {
    console.log('[GameEngine] 🔄 Synchronizing engine state:', Object.keys(gameObjects));
    
    // Clear any pending visual actions from the previous state
    this.activeActions.clear();
    
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
    if (gameObjects.worldManager) this.worldManager = gameObjects.worldManager;
    if (gameObjects.inventoryManager) this.inventoryManager = gameObjects.inventoryManager;
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
      this.isFlashlightOn = gameObjects.interactionState.isFlashlightOn || false;
      this.isSleeping = gameObjects.interactionState.isSleeping || false;
      this.sleepProgress = gameObjects.interactionState.sleepProgress || 0;
      this.targetingItemInstanceId = gameObjects.interactionState.targetingItemInstanceId || null;
      
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
    
    this.emit('sync', this);
    this.emit('update', this);
  }

  /**
   * Update a specific property and notify sub-contexts.
   */
  updateProperty(key, value) {
    if (this[key] === value) return;
    
    this[key] = value;
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
    console.log(`[GameEngine] 🔔 Pulse #${this.updateCount} emitted at ${new Date(this.lastUpdate).toLocaleTimeString()}`);
    this.emit('update', this);
  }

  /**
   * Alias for notifyUpdate used during map transitions
   * Also emits 'sync' to force sub-context Ref updates
   */
  notifySync() {
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
       const { maxRange, isNight, isFlashlightOn, flashlightRange, isAimingWithScope, isNightVision } = this._fovOptions;
       
        // Calculate base ambient sight range based on hour of the day
        const hour = (6 + (this.turn - 1)) % 24;
        const baseRange = getSightRangeForHour(hour, maxRange);

        let range = isNight ? (isFlashlightOn ? Math.max(baseRange, flashlightRange) : baseRange) : baseRange;
       
       // Phase NVG: Night Vision range override
       if (isFlashlightOn && isNightVision) {
         if (isNight) {
           range = maxRange; // Full day range at night
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

       // Weather reduction: reduce sight range by 15% when raining, 20% in heavy rain (intensity > 0.7)
       if (this.weather && this.weather.type === 'rain') {
         const isHeavyRain = this.weather.intensity > 0.7;
         const reduction = isHeavyRain ? 0.20 : 0.15;
         range = range * (1 - reduction);
       }

       if (typeof range !== 'number' || isNaN(range) || range <= 0) {
         range = 15;
       }
 
       // Phase 13 & 19 Fix: LOS center MUST be integers for Bresenham's algorithm to function.
       // We allow passing a custom position (like playerRenderPosition) for smooth vision updates.
       const posX = customPos ? customPos.x : this.player.x;
       const posY = customPos ? customPos.y : this.player.y;

       const roundX = Math.round(posX);
       const roundY = Math.round(posY);

       console.log(`[recalculateFOV] Calculating FOV from (${posX}, ${posY}) -> round (${roundX}, ${roundY}) with range: ${range}`);

       // Compute FOV state hash to prevent redundant calculation on same tile / options
       const optionsHash = `${roundX},${roundY},${range},${isNight},${isFlashlightOn},${isNightVision},${isAimingWithScope},${this.weather ? this.weather.type : 'clear'},${this.weather ? this.weather.intensity : 0},${this.turn}`;
       if (optionsHash === this._lastFovOptionsHash) {
         return false; // Skip calculation
       }
       this._lastFovOptionsHash = optionsHash;

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
        
        // Find lit items on the ground within player's maximum potential vision range
        // scanRadius = Max potential vision (20) + Max light source range (5)
        const scanRadius = 25; 
        const centerX = roundX;
        const centerY = roundY;
        const roundPosX = roundX;
        const roundPosY = roundY;
        const minX = Math.max(0, centerX - scanRadius);
        const maxX = Math.min(this.gameMap.width - 1, centerX + scanRadius);
        const minY = Math.max(0, centerY - scanRadius);
        const maxY = Math.min(this.gameMap.height - 1, centerY + scanRadius);

        for (let y = minY; y <= maxY; y++) {
          for (let x = minX; x <= maxX; x++) {
            const tile = this.gameMap.getTile(x, y);
            if (!tile || !tile.inventoryItems || tile.inventoryItems.length === 0) continue;

            const litItem = tile.inventoryItems.find(item => {
              const def = ItemDefs[item.defId];
              if (!def || !def.lightRange) return false;
              if (item.defId === 'placeable.campfire') return (item.lifetimeTurns || 0) > 0;
              return item.isLit;
            });

            if (litItem) {
              const def = ItemDefs[litItem.defId];
              const itemRange = def.lightRange;
              const itemFov = LineOfSight.getVisibleTiles(this.gameMap, x, y, { maxRange: itemRange });
              
              itemFov.forEach(illuminatedTile => {
                const key = `${illuminatedTile.x},${illuminatedTile.y}`;
                if (visibleKeySet.has(key)) return;

                // Only reveal the illuminated tile if the player has LOS to it!
                // We use a fixed 20-tile range for "seeing a light in the distance"
                const playerToTileLOS = LineOfSight.hasLineOfSight(this.gameMap, roundPosX, roundPosY, illuminatedTile.x, illuminatedTile.y, { maxRange: 20 });
                if (playerToTileLOS.hasLineOfSight) {
                  finalVisibleTiles.push(illuminatedTile);
                  visibleKeySet.add(key);
                }
              });
            }
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
              : item.isLit;

            if (isLit) {
              const itemRange = def.lightRange;
              // Ground items are at player's feet
              const itemFov = LineOfSight.getVisibleTiles(this.gameMap, centerX, centerY, { maxRange: itemRange });
              
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

      // Update explored flags (Silent mutation, will stay in sync with pulse)
      this.playerFieldOfView.forEach(pos => {
        const tile = this.gameMap.getTile(pos.x, pos.y);
        if (tile) tile.flags.explored = true;
      });
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
    console.log('[GameEngine] 👤 Player state change detected -> triggering global pulse');
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
  getSnapshot() {
    return this.updateCount;
  }
}

// Singleton instance
const engine = new GameEngine();
export default engine;
