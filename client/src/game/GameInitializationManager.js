import { EventEmitter } from './utils/EventEmitter.js';
import { getProgressionForMap } from './config/ProgressionConfig.js';
import { WorldManager } from './WorldManager.js';
import { TemplateMapGenerator } from './map/TemplateMapGenerator.js';
import { GameMap } from './map/GameMap.js';
import { EntityFactory } from './EntityFactory.js';
import { Camera } from './Camera.js';
import { ZombieSpawner } from './utils/ZombieSpawner.js';
import { LootGenerator } from './map/LootGenerator.js';
import engine from './GameEngine.js';
import tradingSystem from './systems/TradingSystem.js';

const INIT_STATES = {
  IDLE: 'idle',
  PRELOADING: 'preloading',
  CORE_SETUP: 'core_setup',
  WORLD_POPULATION: 'world_population',
  COMPLETE: 'complete',
  ERROR: 'error'
};

const isDev = typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.DEV;

class GameInitializationManager extends EventEmitter {
  constructor() {
    super();
    this.state = INIT_STATES.IDLE;
    this.gameObjects = {};
    this.error = null;
    this.preloadData = null;

    // Add unique instance tracking to detect duplicates
    this.instanceId = `GameInitManager_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    if (isDev) {
      console.log(`[GameInitializationManager] 🆔 NEW INSTANCE CREATED: ${this.instanceId}`);
    }

    // Track all instances globally to detect duplicates
    if (!window.gameInitInstances) {
      window.gameInitInstances = new Set();
    }
    window.gameInitInstances.add(this.instanceId);
    if (isDev) {
      console.log(`[GameInitializationManager] 📊 TOTAL INSTANCES NOW ACTIVE: ${window.gameInitInstances.size}`);
      if (window.gameInitInstances.size > 1) {
        console.error(`[GameInitializationManager] 🚨🚨🚨 MULTIPLE INITIALIZATION MANAGERS DETECTED!`);
        console.error(`[GameInitializationManager] Active instances:`, Array.from(window.gameInitInstances));
      }
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

  async startInitialization(postInitCallback = null, customConfig = null) {
    if (this.state !== INIT_STATES.IDLE) {
      console.warn('[GameInitializationManager] Cannot start - not in IDLE state');
      return false;
    }

    this.customConfig = customConfig;

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
      
      // SYNC with GameEngine (Unified Singleton Refactor)
      engine.sync(this.gameObjects);
      
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
    
    // Mirror to GameEngine (Unified Refactor Phase 2)
    engine.updateProperty('initializationState', newState);
    
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
    const templateToRequest = worldManager.determineTemplateForMap('map_001');
    console.log(`[GameInitializationManager] 🗺️ REQUESTING INITIAL MAP TEMPLATE: "${templateToRequest}" (Timestamp: ${Date.now()})`);
    
    const mapData = templateMapGenerator.generateFromTemplate(templateToRequest, {
      randomWalls: 1,
      extraFloors: 2
    });
    console.log('[GameInitializationManager] Template map generated:', mapData.template, mapData.width, 'x', mapData.height);

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
      let startX = Math.floor(gameMap.width / 2), startY = Math.floor(gameMap.height * 0.9);
      try {
        const templateStartPos = templateMapGenerator.getStartPosition(mapData.template);
        if (templateStartPos) {
          startX = templateStartPos.x;
          startY = templateStartPos.y;
        }
      } catch (error) {
        if (isDev) {
          console.warn('[GameInitializationManager] Could not get template start position, using default');
        }
      }

      // Validate start position
      if (startX >= gameMap.width) startX = Math.floor(gameMap.width / 2);
      if (startY >= gameMap.height) startY = Math.floor(gameMap.height / 2);

      console.log('[GameInitializationManager] Final start position:', startX, startY);

      // Create player with detailed tracking
      const player = EntityFactory.createPlayer(startX, startY);
      player.id = 'player-1';
      if (isDev) {
        console.log(`[GameInitializationManager] 🎮 PLAYER CREATED by instance ${this.instanceId}:`);
        console.log(`[GameInitializationManager] - Player ID: ${player.id}`);
        console.log(`[GameInitializationManager] - Position: (${player.x}, ${player.y})`);
        console.log(`[GameInitializationManager] - Constructor: ${player.constructor.name}`);
        console.log(`[GameInitializationManager] - Instance hash: ${player.constructor.name}_${player.id}_${Date.now()}`);
      }
      console.log(`[GameInitializationManager] - HP/AP: ${player.hp}/${player.maxHp} HP, ${player.ap}/${player.maxAp} AP`);
      
      // Apply Custom Player Stats if provided (Dev Console)
      if (this.customConfig && this.customConfig.playerConfig) {
        const pc = this.customConfig.playerConfig;
        if (pc.meleeKills !== undefined) {
          player.meleeKills = pc.meleeKills;
          // Calculate melee level: 0-4: L0, 5-9: L1, 10-19: L2, 20-39: L3, 40-79: L4, 80+: L5
          let level = 0;
          while (player.meleeKills >= 5 * Math.pow(2, level)) {
            level++;
          }
          player.meleeLvl = level;
          console.log(`[GameInitializationManager] Dev: Set Melee Skill to Lvl ${level} (${player.meleeKills} kills)`);
        }
        if (pc.rangedKills !== undefined) {
          player.rangedKills = pc.rangedKills;
          let level = 0;
          while (player.rangedKills >= 5 * Math.pow(2, level)) {
            level++;
          }
          player.rangedLvl = level;
          console.log(`[GameInitializationManager] Dev: Set Ranged Skill to Lvl ${level} (${player.rangedKills} kills)`);
        }
      }

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

        // Check if easyStart is chosen
        const isEasyStart = this.customConfig && this.customConfig.easyStart === true;

        if (isEasyStart) {
          // Easy Start starting equipment:
          // 1. Create Pocket T-shirt
          const shirtDef = createItemFromDef('clothing.pocket_t');
          if (shirtDef) {
            const shirt = new Item(shirtDef);
            inventoryManager.equipItem(shirt);
            console.log('[GameInitializationManager] Easy Start: Equipped starting shirt:', shirt.name);
          }

          // 2. Create Sweatpants
          const pantsDef = createItemFromDef('clothing.sweatpants');
          if (pantsDef) {
            const pants = new Item(pantsDef);
            inventoryManager.equipItem(pants);
            console.log('[GameInitializationManager] Easy Start: Equipped starting pants:', pants.name);
          }

          // 3. Create Book Bag / school backpack
          const backpackDef = createItemFromDef('backpack.school');
          if (backpackDef) {
            const backpack = new Item(backpackDef);
            inventoryManager.equipItem(backpack);
            console.log('[GameInitializationManager] Easy Start: Equipped starting backpack:', backpack.name);

            // Now put items inside the backpack
            const backpackContainer = backpack.getContainerGrid();
            if (backpackContainer) {
              // 3 canned beans
              const beans = new Item(createItemFromDef('food.beans', { stackCount: 3 }));
              backpackContainer.addItem(beans);

              // 2 granola bars
              const granolas = new Item(createItemFromDef('food.granolabar', { stackCount: 2 }));
              backpackContainer.addItem(granolas);

              // 2 water bottles
              const waterBottles = new Item(createItemFromDef('food.waterbottle', { stackCount: 2 }));
              backpackContainer.addItem(waterBottles);

              // 1 lighter with full charges (10 charges)
              const lighter = new Item(createItemFromDef('tool.lighter', { ammoCount: 10 }));
              backpackContainer.addItem(lighter);

              console.log('[GameInitializationManager] Easy Start: Added starting items to backpack');
            }
          }

          // 4. Create Crowbar and equip in melee slot
          const crowbarDef = createItemFromDef('weapon.crowbar');
          if (crowbarDef) {
            const crowbar = new Item(crowbarDef);
            inventoryManager.equipItem(crowbar);
            console.log('[GameInitializationManager] Easy Start: Equipped starting crowbar in melee slot');
          }

        } else {
          // Normal start starting equipment:
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

      if (worldManager) {
        worldManager.zombiesSpawned['map_001'] = spawnCount;
        worldManager.zombiesKilled['map_001'] = 0;
      }


      
      // SPAWN ANIMALS: Initial procedural rabbit generation
      const { AnimalSpawner } = await import('./utils/AnimalSpawner.js');
      AnimalSpawner.spawnAnimals(gameMap, player, {
        rabbitRange: { min: 1, max: 2 }
      });
      console.log('[GameInitializationManager] Spawned initial rabbits');

      // SPAWN LOOT: Initial procedural loot generation
      const lootGenerator = new LootGenerator();
      this.gameObjects.lootGenerator = lootGenerator;
      lootGenerator.spawnLoot(gameMap, 1, this.customConfig);

      // SPAWN SHOPKEEPER: Stationary Town Merchant at the town square gate (branching_road maps)
      const { NPCSpawner } = await import('./utils/NPCSpawner.js');
      const shopkeeper = NPCSpawner.spawnShopkeeper(gameMap);
      if (shopkeeper) {
        NPCSpawner.spawnTownTurrets(gameMap);
        const { earbucksShopSystem } = await import('./systems/EarbucksShopSystem.js');
        earbucksShopSystem.initCatalog('map_001');
        console.log('[GameInitializationManager] Spawned shopkeeper, town turrets, and initialized Earbucks catalog');
      }

      // Clean up south transition tile for first map
      try {
        const points = gameMap.metadata?.spawnZones?.transitionPoints;
        const centerX = Math.floor(gameMap.width / 2);
        const southX = points?.south?.x ?? centerX;
        const southY = gameMap.height - 1;
        const southTile = gameMap.getTile(southX, southY);
        if (southTile && southTile.terrain === 'transition') {
          gameMap.setTerrain(southX, southY, 'road');
          console.log('[GameInitializationManager] Removed south transition tile for first map at', southX, southY);
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
    
    // Use custom zombie distribution if provided (Dev Console)
    if (this.customConfig && this.customConfig.zombieConfig) {
      console.log('[GameInitializationManager] Using CUSTOM spawn configuration:', this.customConfig.zombieConfig);
      return ZombieSpawner.spawnZombies(gameMap, player, this.customConfig.zombieConfig);
    }

    // Initial map typically has more zombies or specific distribution
    const progression = getProgressionForMap(1); // Explicitly use Map 1

    // Scale by area relative to standard 45x125 map (5625 tiles)
    const areaMultiplier = (gameMap.width * gameMap.height) / 5625;
    const scale = (v) => Math.floor(v * areaMultiplier);
    const scaleRange = (r) => ({ min: scale(r.min), max: scale(r.max) });

    return ZombieSpawner.spawnZombies(gameMap, player, {
      basicCount: scale(progression.basicCount),
      crawlerRange: scaleRange(progression.crawlerRange),
      runnerCount: scale(progression.runnerCount),
      acidRange: scaleRange(progression.acidRange),
      fatRange: scaleRange(progression.fatRange),
      spitterCount: progression.spitterCount || 0, // Absolute count as per user requirements
      maxTotal: scale(progression.maxTotal),
      minDistance: 15 // Ensure distance for Map 1 start
    });
  }

  reset() {
    this.state = INIT_STATES.IDLE;
    this.gameObjects = {};
    this.error = null;
    this.preloadData = null;
    this.customConfig = null;
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