import { SafeEventEmitter } from './utils/SafeEventEmitter.js';
import { InventoryManager } from './inventory/InventoryManager.js';
import { LineOfSight } from './utils/LineOfSight.js';


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
    
    // Global accessibility for Dev Console and debugging
    if (typeof window !== 'undefined') {
      window.gameEngine = this;
    }
  }

  reset() {
    this.player = null;
    this.gameMap = null;
    this.worldManager = null;
    this.inventoryManager = new InventoryManager();
    this.camera = null;
    this.zombieTracker = null;
    this.lootGenerator = null;
    this.isInitialized = false;
    this.initializationState = 'idle';
    this.lastUpdate = Date.now();
    this.updateCount = 0;
    this.playerFieldOfView = []; // Phase 13: Atomic FOV
    this._fovOptions = { maxRange: 15, isNight: false, isFlashlightOn: false, flashlightRange: 8, isNightVision: false };
    this.renderDebugColors = false; 

    // Phase 24: Interaction State (Silo Bridge)
    this.isSleeping = false;
    this.sleepProgress = 0;
    this.targetingItemInstanceId = null;
  }

  /**
   * Atomic synchronization of all game objects.
   * Called by the GameInitializationManager or GameContext when a map loads.
   */
  sync(gameObjects) {
    console.log('[GameEngine] 🔄 Synchronizing engine state:', Object.keys(gameObjects));
    
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
    if (gameObjects.zombieTracker) this.zombieTracker = gameObjects.zombieTracker;
    if (gameObjects.lootGenerator) this.lootGenerator = gameObjects.lootGenerator;
    
    // Restore Phase 24 interaction state if present
    if (gameObjects.interactionState) {
      this.isSleeping = gameObjects.interactionState.isSleeping || false;
      this.sleepProgress = gameObjects.interactionState.sleepProgress || 0;
      this.targetingItemInstanceId = gameObjects.interactionState.targetingItemInstanceId || null;
    }

    this.isInitialized = true;
    this.initializationState = 'complete';
    
    // Immediate FOV update on sync
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

  /**
   * Signal a significant change in game state (e.g. turn end)
   */
  notifyUpdate() {
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
    * Atomic FOV calculation
    * @param {Object} customPos - Optional {x, y} to calculate from (for movement sync)
    */
   recalculateFOV(customPos = null) {
     if (!this.gameMap || !this.player) return;
 
     try {
       const { maxRange, isNight, isFlashlightOn, flashlightRange, isAimingWithScope, isNightVision } = this._fovOptions;
       
       let range = isNight ? (isFlashlightOn ? flashlightRange : 1.5) : maxRange;
       
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
 
       // Phase 13 & 19 Fix: LOS center MUST be integers for Bresenham's algorithm to function.
       // We allow passing a custom position (like playerRenderPosition) for smooth vision updates.
       const posX = customPos ? customPos.x : this.player.x;
       const posY = customPos ? customPos.y : this.player.y;

       const fovCenter = { 
         x: Math.round(posX), 
         y: Math.round(posY), 
         id: this.player.id 
       };
 
       const fovData = LineOfSight.calculateFieldOfView(this.gameMap, fovCenter, {
        maxRange: range,
        ignoreTerrain: [],
        ignoreEntities: [this.player.id]
      });



      this.playerFieldOfView = fovData.visibleTiles;

      // Update explored flags (Silent mutation, will stay in sync with pulse)
      this.playerFieldOfView.forEach(pos => {
        const tile = this.gameMap.getTile(pos.x, pos.y);
        if (tile) tile.flags.explored = true;
      });
    } catch (error) {
       console.error('[GameEngine] FOV Error:', error);
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
