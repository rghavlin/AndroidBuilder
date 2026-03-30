import { EventEmitter } from './utils/EventEmitter.js';
import { WorldManager } from './WorldManager.js';
import { TemplateMapGenerator } from './map/TemplateMapGenerator.js';
import { GameMap } from './map/GameMap.js';
import { Player } from './entities/Player.js';
import { Camera } from './Camera.js';
import { Zombie } from './entities/Zombie.js';
import { ZombieSpawner } from './utils/ZombieSpawner.js';
import { LootGenerator } from './map/LootGenerator.js';

const INIT_STATES = {
  IDLE: 'idle',
  PRELOADING: 'preloading',
  CORE_SETUP: 'core_setup',
  WORLD_POPULATION: 'world_population',
  COMPLETE: 'complete',
  ERROR: 'error'
};

class GameInitializationManager extends EventEmitter {
  constructor() {
    super();
    this.state = INIT_STATES.IDLE;
    this.gameObjects = {};
    this.error = null;
    this.preloadData = null;

    // Add unique instance tracking to detect duplicates
    this.instanceId = `GameInitManager_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    console.log(`[GameInitializationManager] 🆔 NEW INSTANCE CREATED: ${this.instanceId}`);

    // Track all instances globally to detect duplicates
    if (!window.gameInitInstances) {
      window.gameInitInstances = new Set();
    }
    window.gameInitInstances.add(this.instanceId);
    console.log(`[GameInitializationManager] 📊 TOTAL INSTANCES NOW ACTIVE: ${window.gameInitInstances.size}`);
    if (window.gameInitInstances.size > 1) {
      console.error(`[GameInitializationManager] 🚨🚨🚨 MULTIPLE INITIALIZATION MANAGERS DETECTED!`);
      console.error(`[GameInitializationManager] Active instances:`, Array.from(window.gameInitInstances));
    }
  }

  getCurrentState() {
    return this.state;
  }

  getGameObjects() {
    return { ...this.gameObjects };
  }

  getError() {
    return this.error;
  }

  async startInitialization(postInitCallback = null) {
    if (this.state !== INIT_STATES.IDLE) {
      console.warn('[GameInitializationManager] Cannot start - not in IDLE state');
      return false;
    }

    try {
      console.log('[GameInitializationManager] Starting initialization sequence...');

      // Phase 1: Preloading
      await this._transitionToState(INIT_STATES.PRELOADING);
      const preloadSuccess = await this._executePreloading();
      if (!preloadSuccess) return false;

      // Phase 2: Core Setup
      await this._transitionToState(INIT_STATES.CORE_SETUP);
      const coreSuccess = await this._executeCoreSetup();
      if (!coreSuccess) return false;

      // Phase 3: World Population
      await this._transitionToState(INIT_STATES.WORLD_POPULATION);
      const populationSuccess = await this._executeWorldPopulation();
      if (!populationSuccess) return false;

      // Complete
      await this._transitionToState(INIT_STATES.COMPLETE);
      this.emit('initializationComplete', this.gameObjects);
      console.log('[GameInitializationManager] Initialization completed successfully');

      // Execute post-initialization callback if provided
      if (postInitCallback) {
        console.log('[GameInitializationManager] Executing post-initialization callback...');
        try {
          await postInitCallback(this.gameObjects);
          console.log('[GameInitializationManager] Post-initialization callback completed');
        } catch (callbackError) {
          console.error('[GameInitializationManager] Post-initialization callback failed:', callbackError);
          // Don't fail the entire initialization - just log the error
        }
      }

      return true;

    } catch (error) {
      console.error('[GameInitializationManager] Initialization failed:', error);
      this.error = error.message;
      await this._transitionToState(INIT_STATES.ERROR);
      this.emit('initializationError', error);
      return false;
    }
  }

  async _transitionToState(newState) {
    const oldState = this.state;
    this.state = newState;
    console.log(`[GameInitializationManager] State transition: ${oldState} → ${newState}`);
    this.emit('stateChanged', { from: oldState, to: newState, current: newState });

    // Small delay to allow event listeners to process
    await new Promise(resolve => setTimeout(resolve, 10));
  }

  async _executePreloading() {
    console.log('[GameInitializationManager] 📋 PRELOADING phase starting...');

    // Load item catalog
    try {
      const { ItemDefs } = await import('./inventory/ItemDefs.js');
      const defCount = Object.keys(ItemDefs).length;
      console.log(`[GameInitializationManager] ✅ Loaded ${defCount} item definitions`);
    } catch (error) {
      console.error('[GameInitializationManager] ❌ Failed to load item catalog:', error);
    }

    // Create InventoryManager (Phase 5A: single source of truth)
    const { InventoryManager } = await import('./inventory/InventoryManager.js');
    const inventoryManager = new InventoryManager();
    console.log('[GameInitializationManager] InventoryManager created:', inventoryManager);

    // Create WorldManager
    const worldManager = new WorldManager();
    console.log('[GameInitializationManager] WorldManager created');

    // Create TemplateMapGenerator and generate initial map
    const templateMapGenerator = new TemplateMapGenerator();
    const mapData = templateMapGenerator.generateFromTemplate('road', {
      randomWalls: 1,
      extraFloors: 2
    });
    console.log('[GameInitializationManager] Template map generated:', mapData.width, 'x', mapData.height);

    // Store preload data for next phase
    this.preloadData = {
      inventoryManager,
      worldManager,
      templateMapGenerator,
      mapData
    };

    console.log('[GameInitializationManager] ✅ PRELOADING complete');
    return true;
  }

  async _executeCoreSetup() {
    console.log('[GameInitializationManager] Executing CORE_SETUP phase...');

    try {
      const { inventoryManager, worldManager, templateMapGenerator, mapData } = this.preloadData;

      // Create GameMap with template dimensions
      const gameMap = new GameMap(mapData.width, mapData.height);
      console.log('[GameInitializationManager] GameMap created:', gameMap.width, 'x', gameMap.height);

      // Apply template to map
      try {
        await templateMapGenerator.applyToGameMap(gameMap, mapData);
        console.log('[GameInitializationManager] Template applied to GameMap');
      } catch (error) {
        console.warn('[GameInitializationManager] Template application failed:', error);
        // Continue with basic map
      }

      // Determine start position
      let startX = Math.floor(gameMap.width / 2), startY = 123;
      try {
        const templateStartPos = templateMapGenerator.getStartPosition();
        if (templateStartPos) {
          startX = templateStartPos.x;
          startY = templateStartPos.y;
        }
      } catch (error) {
        console.warn('[GameInitializationManager] Could not get template start position, using default');
      }

      // Validate start position
      if (startX >= gameMap.width) startX = Math.floor(gameMap.width / 2);
      if (startY >= gameMap.height) startY = Math.floor(gameMap.height / 2);

      console.log('[GameInitializationManager] Final start position:', startX, startY);

      // Create player with detailed tracking
      const player = new Player('player-1', 'Player', startX, startY);
      console.log(`[GameInitializationManager] 🎮 PLAYER CREATED by instance ${this.instanceId}:`);
      console.log(`[GameInitializationManager] - Player ID: ${player.id}`);
      console.log(`[GameInitializationManager] - Position: (${player.x}, ${player.y})`);
      console.log(`[GameInitializationManager] - Constructor: ${player.constructor.name}`);
      console.log(`[GameInitializationManager] - Instance hash: ${player.constructor.name}_${player.id}_${Date.now()}`);
      console.log(`[GameInitializationManager] - HP/AP: ${player.hp}/${player.maxHp} HP, ${player.ap}/${player.maxAp} AP`);

      // Create camera with proper bounds
      const camera = new Camera(20, 20);
      camera.setWorldBounds(gameMap.width, gameMap.height);
      camera.centerOn(player.x, player.y);
      console.log('[GameInitializationManager] Camera initialized - bounds:', camera.worldWidth, 'x', camera.worldHeight);

      // Add player to map with detailed tracking
      try {
        const addResult = gameMap.addEntity(player, player.x, player.y);
        console.log(`[GameInitializationManager] 🗺️ Player added to map: ${addResult ? 'SUCCESS' : 'FAILED'}`);
        console.log(`[GameInitializationManager] - Map dimensions: ${gameMap.width}x${gameMap.height}`);
        console.log(`[GameInitializationManager] - Total entities on map: ${gameMap.getAllEntities().length}`);
        console.log(`[GameInitializationManager] - Player entities on map: ${gameMap.getEntitiesByType('player').length}`);

        // Verify player is actually on the map
        const tileAtPlayerPos = gameMap.getTile(player.x, player.y);
        if (tileAtPlayerPos) {
          const playerOnTile = tileAtPlayerPos.contents.find(e => e.id === player.id);
          console.log(`[GameInitializationManager] - Player found on tile (${player.x}, ${player.y}):`, playerOnTile ? '✅ YES' : '❌ NO');
        }
      } catch (error) {
        console.error('[GameInitializationManager] 🚨 Failed to add player to map:', error);
        // Continue anyway, player position is tracked separately
      }

      // Save initial map to world
      const mapId = worldManager.saveCurrentMap(gameMap, 'map_001');
      console.log('[GameInitializationManager] Initial map saved as:', mapId);

      // Phase 10: Starting Equipment
      try {
        const { createItemFromDef } = await import('./inventory/ItemDefs.js');
        const { Item } = await import('./inventory/Item.js');

        // 1. Create Pocket T-shirt
        const shirtDef = createItemFromDef('clothing.pocket_t');
        if (shirtDef) {
          const shirt = new Item(shirtDef);
          inventoryManager.equipItem(shirt);
          console.log('[GameInitializationManager] Equipped starting shirt:', shirt.name);
        }

        // 2. Create Sweatpants
        const pantsDef = createItemFromDef('clothing.sweatpants');
        if (pantsDef) {
          const pants = new Item(pantsDef);
          inventoryManager.equipItem(pants);
          console.log('[GameInitializationManager] Equipped starting pants:', pants.name);
        }
      } catch (err) {
        console.error('[GameInitializationManager] Failed to provide starting equipment:', err);
      }

      // Store core game objects
      this.gameObjects = {
        inventoryManager,
        worldManager,
        gameMap,
        player,
        camera,
        templateMapGenerator
      };

      console.log('[GameInitializationManager] CORE_SETUP phase completed');
      return true;

    } catch (error) {
      console.error('[GameInitializationManager] CORE_SETUP phase failed:', error);
      throw error;
    }
  }

  async _executeWorldPopulation() {
    console.log('[GameInitializationManager] Executing WORLD_POPULATION phase...');

    try {
      const { gameMap, player, worldManager } = this.gameObjects;

      // Spawn initial zombies
      const spawnCount = this._spawnInitialZombies(gameMap, player);
      console.log('[GameInitializationManager] Spawned', spawnCount, 'initial zombies');

      // SPECIAL BUILDING SPAWNS: Army Tent Soldier Zombies, etc.
      if (worldManager) {
        await worldManager._spawnSpecialBuildingZombies(gameMap);
        console.log('[GameInitializationManager] Spawned special building zombies');
      }

      // SPAWN LOOT: Initial procedural loot generation
      const lootGenerator = new LootGenerator();
      this.gameObjects.lootGenerator = lootGenerator;
      lootGenerator.spawnLoot(gameMap);

      // Clean up south transition tile for first map
      try {
        const centerX = Math.floor(gameMap.width / 2);
        const southY = gameMap.height - 1;
        const southTile = gameMap.getTile(centerX, southY);
        if (southTile && southTile.terrain === 'transition') {
          gameMap.setTerrain(centerX, southY, 'road');
          console.log('[GameInitializationManager] Removed south transition tile for first map at', centerX, southY);
        }
      } catch (error) {
        console.warn('[GameInitializationManager] Could not clean up transition tile:', error);
      }

      console.log('[GameInitializationManager] WORLD_POPULATION phase completed');
      return true;

    } catch (error) {
      console.error('[GameInitializationManager] WORLD_POPULATION phase failed:', error);
      throw error;
    }
  }

  _spawnInitialZombies(gameMap, player) {
    console.log('[GameInitializationManager] Spawning initial zombies using ZombieSpawner');
    
    // Initial map typically has more zombies or specific distribution
    return ZombieSpawner.spawnZombies(gameMap, player, {
      basicCount: 15,
      crawlerRange: { min: 2, max: 4 },
      runnerCount: 1, // Only 1 runner on first map
      acidRange: { min: 0, max: 0 },
      fatRange: { min: 0, max: 0 }
    });
  }

  reset() {
    this.state = INIT_STATES.IDLE;
    this.gameObjects = {};
    this.error = null;
    this.preloadData = null;
    this.removeAllListeners();

    // Clean up global tracking
    if (window.gameInitInstances && this.instanceId) {
      window.gameInitInstances.delete(this.instanceId);
      console.log(`[GameInitializationManager] Removed instance ${this.instanceId} from global tracking`);
    }
  }

  destroy() {
    console.log(`[GameInitializationManager] 🗑️ DESTROYING INSTANCE: ${this.instanceId}`);
    this.reset();
  }
}

export default GameInitializationManager;