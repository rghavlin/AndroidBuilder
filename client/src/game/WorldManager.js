import Logger from './utils/Logger.js';
import { getProgressionForMap } from './config/ProgressionConfig.js';

const logger = Logger.scope('WorldManager');

/**
 * WorldManager - Handles multiple maps, transitions, and world state persistence
 * Follows UniversalGoals.md: modular, serializable, event-driven
 */
export class WorldManager {
  constructor() {
    this.maps = new Map(); // Map ID -> serialized map data
    this.currentMapId = null;
    this.mapCounter = 1;
    this.listeners = new Map();
    this.DEV_FORCE_LAB = false; // Set to true to test Lab map on Map 1

    this.firstEntryTurn = { map_001: 1 };
    this.completedMaps = [];
    this.zombiesKilled = {};
    this.zombiesSpawned = {};

    logger.info('Initialized');
  }

  /**
   * Add event listener for world events
   */
  addEventListener(eventType, callback) {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, []);
    }
    this.listeners.get(eventType).push(callback);
  }

  /**
   * Emit world events
   */
  emit(eventType, data = {}) {
    const eventData = {
      worldManager: { currentMapId: this.currentMapId, totalMaps: this.maps.size },
      timestamp: Date.now(),
      ...data
    };

    if (this.listeners.has(eventType)) {
      this.listeners.get(eventType).forEach(callback => callback(eventData));
    }
  }

  /**
   * Save current map to the world maps collection
   * @param {GameMap} gameMap - Current game map instance
   * @param {string} mapId - Map identifier (e.g., 'map_001')
   * @param {number} currentTurn - The current game turn count
   */
  saveCurrentMap(gameMap, mapId = null, currentTurn = 1, templateType = null) {
    try {
      if (!mapId) {
        mapId = this.generateMapId();
      }

      if (this.zombiesSpawned[mapId] === undefined) {
        const zombies = gameMap.getAllEntities().filter(e => e.type === 'zombie');
        this.zombiesSpawned[mapId] = zombies.length;
        this.zombiesKilled[mapId] = 0;
      }

      const serializedMap = gameMap.toJSON();
      const mapData = {
        id: mapId,
        serializedMap: serializedMap,
        timestamp: Date.now(),
        lastProcessedTurn: currentTurn, // Track when this map was last active
        type: templateType || gameMap.template || 'road',
        metadata: {
          width: gameMap.width,
          height: gameMap.height,
          entityCount: gameMap.getAllEntities().length
        }
      };


      this.maps.set(mapId, mapData);
      this.currentMapId = mapId;

      logger.info(`*** MAP SAVED: ${mapId} at Turn ${currentTurn} ***`);
      logger.info(`*** WORLD COLLECTION NOW HAS ${this.maps.size} MAPS ***`);

      this.emit('mapSaved', {
        mapId: mapId,
        mapData: mapData
      });

      return mapId;
    } catch (error) {
      console.error('[WorldManager] Failed to save map:', error);
      throw new Error('Failed to save map to world: ' + error.message);
    }
  }

  /**
   * Load a map from the world collection (full restoration for save/load)
   * @param {string} mapId - Map identifier to load
   * @param {number} currentTurn - The current game turn count (for catch-up)
   * @returns {Promise<Object>} - Deserialized map data
   */
  async loadMap(mapId, currentTurn = null) {
    try {
      if (!this.maps.has(mapId)) {
        throw new Error(`Map ${mapId} not found in world collection`);
      }

      const mapData = this.maps.get(mapId);
      logger.info(`Loading map ${mapId} from world collection (full restoration)`);

      // Import GameMap class and restore from JSON with all entities
      const { GameMap } = await import('./map/GameMap.js');
      const gameMap = await GameMap.fromJSON(mapData.serializedMap);

      // CATCH-UP TURN PROCESSING
      if (currentTurn !== null && mapData.lastProcessedTurn !== undefined) {
        const missedTurns = currentTurn - mapData.lastProcessedTurn;
        if (missedTurns > 0) {
          logger.info(`Map ${mapId} catching up on ${missedTurns} missed turns...`);
          for (let i = 0; i < missedTurns; i++) {
            gameMap.processTurn();
          }
        }
      }

      this.currentMapId = mapId;

      this.emit('mapLoaded', {
        mapId: mapId,
        gameMap: gameMap,
        metadata: mapData.metadata
      });

      logger.info(`Map ${mapId} loaded successfully with ${gameMap.getAllEntities().length} entities`);
      return {
        gameMap: gameMap,
        metadata: mapData.metadata
      };
    } catch (error) {
      console.error(`[WorldManager] Failed to load map ${mapId}:`, error);
      throw new Error(`Failed to load map ${mapId}: ` + error.message);
    }
  }

  /**
   * Load a map for transitions (excludes player to prevent duplicates)
   * @param {string} mapId - Map identifier to load
   * @param {number} currentTurn - The current game turn count (for catch-up)
   * @returns {Promise<Object>} - Deserialized map data without player entities
   */
  async loadMapForTransition(mapId, currentTurn = null) {
    try {
      if (!this.maps.has(mapId)) {
        throw new Error(`Map ${mapId} not found in world collection`);
      }

      const mapData = this.maps.get(mapId);
      logger.info(`Loading map ${mapId} for transition (excluding players)`);

      // Import GameMap class and restore selectively (exclude players)
      const { GameMap } = await import('./map/GameMap.js');
      const gameMap = await GameMap.fromJSONSelective(mapData.serializedMap, {
        excludeEntityTypes: ['player']
      });
      gameMap.mapNumber = this.extractMapNumber(mapId);

      // CATCH-UP TURN PROCESSING
      if (currentTurn !== null && mapData.lastProcessedTurn !== undefined) {
        const missedTurns = currentTurn - mapData.lastProcessedTurn;
        if (missedTurns > 0) {
          logger.info(`Map ${mapId} catching up on ${missedTurns} missed turns...`);
          for (let i = 0; i < missedTurns; i++) {
            gameMap.processTurn();
          }
        }
      }

      this.currentMapId = mapId;

      this.emit('mapLoadedForTransition', {
        mapId: mapId,
        gameMap: gameMap,
        metadata: mapData.metadata
      });

      logger.info(`Map ${mapId} loaded for transition with ${gameMap.getAllEntities().length} entities (no players)`);
      return {
        gameMap: gameMap,
        metadata: mapData.metadata
      };
    } catch (error) {
      console.error(`[WorldManager] Failed to load map ${mapId} for transition:`, error);
      throw new Error(`Failed to load map ${mapId} for transition: ` + error.message);
    }
  }

  /**
   * Generate next map and add to world collection
   * @param {string} mapType - Type of map to generate ('road', 'forest', 'alley')
   * @returns {Promise<Object>} - Generated map data
   */
  async generateNextMap(mapType = 'road', currentTurn = 1) {
    try {
      const nextMapId = this.generateMapId();
      const mapNumber = this.extractMapNumber(nextMapId);

      // Import required classes
      const { TemplateMapGenerator } = await import('./map/TemplateMapGenerator.js');
      const { GameMap } = await import('./map/GameMap.js');

      // Generate new map using template system
      const templateMapGenerator = new TemplateMapGenerator();
      let mapData;

      // Maps 1-3: Road, 4: Winding, 5: Mirrored Winding, 6: Split Road, 7+: Random
      let templateToUse = this.determineTemplateForMap(nextMapId);

      mapData = templateMapGenerator.generateFromTemplate(templateToUse, {
        randomWalls: 1,
        extraFloors: 2,
        mapNumber: mapNumber
      });

      // Create GameMap instance and apply template
      const gameMap = new GameMap(mapData.width, mapData.height);
      const mapNumberForGen = this.extractMapNumber(nextMapId);
      gameMap.mapNumber = mapNumberForGen;
      await templateMapGenerator.applyToGameMap(gameMap, mapData);

      // SPAWN LOOT: New procedural loot generation
      const { LootGenerator } = await import('./map/LootGenerator.js');
      const lootGenerator = new LootGenerator();
      lootGenerator.spawnLoot(gameMap, gameMap.mapNumber);

      // SPAWN ZOMBIES: Initial map population (Scaled by area)
      const { ZombieSpawner } = await import('./utils/ZombieSpawner.js');
      const progression = getProgressionForMap(gameMap.mapNumber || 1);
      
      let randomSwatCount = 0;
      let randomFirefighterCount = 0;
      let soldierCount = 0;

      if (gameMap.mapNumber > 3) {
        const { swatChance, firefighterChance, soldierChance } = progression.randomSpecialized || {};
        if (Math.random() < (swatChance || 0.15)) randomSwatCount = Math.floor(Math.random() * 2) + 1;
        if (Math.random() < (firefighterChance || 0.15)) randomFirefighterCount = Math.floor(Math.random() * 2) + 1;
        if (Math.random() < (soldierChance || 0.10)) soldierCount = 1;
      }

      const areaMultiplier = (gameMap.width * gameMap.height) / 5625;
      const scale = (v) => Math.floor(v * areaMultiplier);
      const scaleRange = (r) => ({ min: scale(r.min), max: scale(r.max) });

      ZombieSpawner.spawnZombies(gameMap, null, {
        basicCount: scale(progression.basicCount),
        crawlerRange: scaleRange(progression.crawlerRange),
        runnerCount: scale(progression.runnerCount),
        acidRange: scaleRange(progression.acidRange),
        fatRange: scaleRange(progression.fatRange),
        randomSwatCount: scale(randomSwatCount),
        randomFirefighterCount: scale(randomFirefighterCount),
        soldierCount: scale(soldierCount),
        spitterCount: scale(progression.spitterCount || 0),
        maxTotal: scale(progression.maxTotal),

        minDistance: 15,

      });

      
      // SPAWN ANIMALS: Procedural rabbit generation
      const { AnimalSpawner } = await import('./utils/AnimalSpawner.js');
      AnimalSpawner.spawnAnimals(gameMap, null, {
        rabbitRange: { min: 1, max: 2 }
      });

      // Save to world collection
      const savedMapId = this.saveCurrentMap(gameMap, nextMapId, currentTurn, templateToUse);

      this.emit('mapGenerated', {
        mapId: savedMapId,
        mapType: mapType,
        gameMap: gameMap
      });

      logger.info(`Generated and saved new ${mapType} map: ${savedMapId}`);
      return {
        mapId: savedMapId,
        gameMap: gameMap,
        mapType: templateToUse
      };
    } catch (error) {
      console.error('[WorldManager] Failed to generate next map:', error);
      throw new Error('Failed to generate next map: ' + error.message);
    }
  }

  /**
   * Check if player is at a transition point
   * @param {Player} player - Player entity
   * @param {GameMap} gameMap - Current game map
   * @returns {Object|null} - Transition info or null
   */
  checkTransitionPoint(player, gameMap) {
    if (!player || !gameMap) return null;

    const playerX = player.x;
    const playerY = player.y;
    const tile = gameMap.getTile(playerX, playerY);
    
    // Check for transition tile
    if (tile && tile.terrain === 'transition') {
        // NORTH transition at top edge (Entering NEXT map from SOUTH)
        if (playerY === 0) {
            const nextMapId = this.getNextMapId();
            let spawnX = 22; // Default for straight road
            let nextHeight = 125; // Default road height

            // If next map exists, get its actual exit point and height
            if (this.maps.has(nextMapId)) {
                const nextMapData = this.maps.get(nextMapId);
                const nextPoints = nextMapData.serializedMap?.metadata?.spawnZones?.transitionPoints;
                if (nextPoints?.south) spawnX = nextPoints.south.x;
                
                // Use actual height from metadata if available
                if (nextMapData.metadata?.height) {
                    nextHeight = nextMapData.metadata.height;
                } else if (nextMapData.serializedMap?.height) {
                    nextHeight = nextMapData.serializedMap.height;
                }
            } else {
                // Predict next template and its SOUTH entrance position
                const nextTemplate = this.determineTemplateForMap(nextMapId);
                
                if (nextTemplate === 'split_road') {
                    nextHeight = 150;
                } else if (nextTemplate === 'lab') {
                    nextHeight = 84;
                }
                
                if (nextTemplate === 'winding_road') {
                    spawnX = 22; // South entrance is roadXMin
                } else if (nextTemplate === 'mirrored_winding_road') {
                    spawnX = 62; // South entrance is roadXMax
                } else if (nextTemplate === 'split_road') {
                    spawnX = 30; // Center of 60-wide map
                } else if (nextTemplate === 'lab') {
                    spawnX = 35; // Center of 70-wide map
                } else {
                    spawnX = 22; // Standard road
                }
            }

            return {
                direction: 'north',
                position: { x: playerX, y: playerY },
                nextMapId: nextMapId,
                spawnPosition: { x: spawnX, y: nextHeight - 2 }
            };
        }


      // SOUTH transition at bottom edge (Entering PREVIOUS map from NORTH)
      if (playerY === gameMap.height - 1 && this.canGoSouth()) {
        const prevMapId = this.getPreviousMapId();
        let spawnX = 22; // Default for straight road

        if (this.maps.has(prevMapId)) {
          const prevMapData = this.maps.get(prevMapId);
          const prevPoints = prevMapData.serializedMap?.metadata?.spawnZones?.transitionPoints;
          if (prevPoints?.north) spawnX = prevPoints.north.x;
        } else {
          // Fallback prediction for NORTH exit of the previous map
          const prevTemplate = this.determineTemplateForMap(prevMapId);
          if (prevTemplate === 'winding_road') {
            spawnX = 62; // North exit is roadXMax
          } else if (prevTemplate === 'mirrored_winding_road') {
            spawnX = 22; // North exit is roadXMin
          } else if (prevTemplate === 'split_road') {
            spawnX = 30; // Center of 60-wide map
          } else if (prevTemplate === 'lab') {
            spawnX = 35; // Center of 70-wide map
          } else {
            spawnX = 22; // Standard road
          }
        }

        return {
          direction: 'south',
          position: { x: playerX, y: playerY },
          nextMapId: prevMapId,
          spawnPosition: { x: spawnX, y: 1 }
        };
      }
    }

    return null;
  }

  /**
   * Determine the template to use for a specific map ID
   */
  determineTemplateForMap(mapId) {
    const mapNumber = this.extractMapNumber(mapId);
    
    // Check if already assigned
    if (this.maps.has(mapId)) {
        return this.maps.get(mapId).type;
    }

    // Progression logic (Must match executeTransition)
    if (this.DEV_FORCE_LAB && mapNumber === 1) return 'lab';
    if (mapNumber <= 3) return 'road';
    if (mapNumber === 4) return 'winding_road';
    if (mapNumber === 5) return 'mirrored_winding_road';
    if (mapNumber === 6) return 'split_road';
    if (mapNumber === 10) return 'lab';
    
    // For random maps, we need a deterministic choice or a saved one
    // Using mapNumber as seed for pseudo-randomness
    const seed = (mapNumber * 12345) % 100;
    if (seed < 25) return 'road';
    if (seed < 50) return 'winding_road';
    if (seed < 75) return 'mirrored_winding_road';
    return 'split_road';
  }

  /**
   * Check if position is on the road (valid for transitions)
   */
  isOnRoad(x, y, gameMap) {
    const tile = gameMap.getTile(x, y);
    return tile && (tile.terrain === 'road' || tile.terrain === 'sidewalk');
  }

  /**
   * Check if player can go south (not on first map)
   */
  canGoSouth() {
    return this.currentMapId !== 'map_001';
  }

  /**
   * Get next map ID for transitions
   */
  getNextMapId() {
    const currentNum = this.extractMapNumber(this.currentMapId);
    return `map_${String(currentNum + 1).padStart(3, '0')}`;
  }

  /**
   * Get previous map ID for transitions
   */
  getPreviousMapId() {
    const currentNum = this.extractMapNumber(this.currentMapId);
    if (currentNum <= 1) return null;
    return `map_${String(currentNum - 1).padStart(3, '0')}`;
  }

  /**
   * Extract numeric part from map ID
   */
  extractMapNumber(mapId) {
    const match = mapId.match(/map_(\d+)/);
    return match ? parseInt(match[1], 10) : 1;
  }

  /**
   * Generate next sequential map ID
   */
  generateMapId() {
    const mapId = `map_${String(this.mapCounter).padStart(3, '0')}`;
    this.mapCounter++;
    return mapId;
  }

  /**
   * Get current map info
   */
  getCurrentMapInfo() {
    if (!this.currentMapId || !this.maps.has(this.currentMapId)) {
      return null;
    }

    const mapData = this.maps.get(this.currentMapId);
    return {
      id: this.currentMapId,
      type: mapData.type,
      metadata: mapData.metadata,
      timestamp: mapData.timestamp
    };
  }

  /**
   * List all available maps
   */
  listMaps() {
    return Array.from(this.maps.keys()).map(mapId => {
      const mapData = this.maps.get(mapId);
      return {
        id: mapId,
        type: mapData.type,
        metadata: mapData.metadata,
        timestamp: mapData.timestamp
      };
    });
  }

  recordZombieKill(mapId) {
    if (!mapId) return;
    if (this.zombiesKilled[mapId] === undefined) {
      this.zombiesKilled[mapId] = 0;
    }
    this.zombiesKilled[mapId]++;
    logger.info(`Recorded zombie kill on map ${mapId}. Total: ${this.zombiesKilled[mapId]}/${this.zombiesSpawned[mapId] || 0}`);
  }

  getZombieKillsPercentage(mapId) {
    const killed = this.zombiesKilled[mapId] || 0;
    const spawned = this.zombiesSpawned[mapId] || 0;
    if (spawned <= 0) return 100;
    return Math.min(100, Math.round((killed / spawned) * 100));
  }

  markMapCompleted(mapId) {
    if (!this.completedMaps) {
      this.completedMaps = [];
    }
    if (!this.completedMaps.includes(mapId)) {
      this.completedMaps.push(mapId);
    }
  }

  /**
   * Serialize world state to JSON
   */
  toJSON() {
    return {
      maps: Array.from(this.maps.entries()).map(([id, data]) => ({ id, ...data })),
      currentMapId: this.currentMapId,
      mapCounter: this.mapCounter,
      firstEntryTurn: this.firstEntryTurn,
      completedMaps: this.completedMaps,
      zombiesKilled: this.zombiesKilled,
      zombiesSpawned: this.zombiesSpawned
    };
  }

  /**
   * Stamp reciprocal transition on a map
   * @param {string} mapId - Map to stamp transition on
   * @param {string} direction - 'north' or 'south'
   */
  async stampReciprocalTransition(mapId, direction) {
    try {
      if (!this.maps.has(mapId)) {
        console.warn(`[WorldManager] Cannot stamp transition - map ${mapId} not found`);
        return false;
      }

      const mapData = this.maps.get(mapId);
      const { GameMap } = await import('./map/GameMap.js');
      const gameMap = await GameMap.fromJSON(mapData.serializedMap);

      const centerX = Math.floor(gameMap.width / 2);
      if (direction === 'south' && mapId !== 'map_001') {
        const southY = gameMap.height - 1;
        console.log(`[WorldManager] Stamping south transition at (${centerX}, ${southY}) on ${mapId}`);
        gameMap.setTerrain(centerX, southY, 'transition');
        this.saveCurrentMap(gameMap, mapId);
        return true;
      } else if (direction === 'north') {
        console.log(`[WorldManager] Stamping north transition at (${centerX}, 0) on ${mapId}`);
        gameMap.setTerrain(centerX, 0, 'transition');
        this.saveCurrentMap(gameMap, mapId);
        return true;
      }

      return false;
    } catch (error) {
      console.error(`[WorldManager] Failed to stamp reciprocal transition:`, error);
      return false;
    }
  }

  /**
   * Execute map transition
   * @param {string} targetMapId - ID of map to transition to
   * @param {Object} spawnPosition - Where to spawn player {x, y}
   * @param {number} currentTurn - The current game turn count
   * @returns {Promise<Object>} - Transition result
   */
  async executeTransition(targetMapId, spawnPosition, currentTurn = null) {
    try {
      // Check if target map exists, if not generate it
      let mapData;
      if (this.maps.has(targetMapId)) {
        console.log(`[WorldManager] Loading existing map for transition: ${targetMapId}`);
        mapData = await this.loadMapForTransition(targetMapId, currentTurn);
      } else {
        console.log(`[WorldManager] Generating new map: ${targetMapId}`);

        // Import required classes
        const { TemplateMapGenerator } = await import('./map/TemplateMapGenerator.js');
        const { GameMap } = await import('./map/GameMap.js');
        const { ZombieSpawner } = await import('./utils/ZombieSpawner.js');
        const { AnimalSpawner } = await import('./utils/AnimalSpawner.js');

        // Generate new map using template system with specific ID
        const templateMapGenerator = new TemplateMapGenerator();
        const mapNumber = this.extractMapNumber(targetMapId);
        let templateToUse = this.determineTemplateForMap(targetMapId);

        let generatedMapData = templateMapGenerator.generateFromTemplate(templateToUse, {
          randomWalls: 1,
          extraFloors: 2,
          mapNumber: mapNumber
        });

        // Create GameMap instance and apply template
        const gameMap = new GameMap(generatedMapData.width, generatedMapData.height);
        gameMap.mapNumber = mapNumber;
        await templateMapGenerator.applyToGameMap(gameMap, generatedMapData);

        // SPAWN LOOT: New procedural loot generation
        const { LootGenerator } = await import('./map/LootGenerator.js');
        const lootGenerator = new LootGenerator();
        lootGenerator.spawnLoot(gameMap, mapNumber);

        const progression = getProgressionForMap(mapNumber);
        console.log(`[WorldManager] Applying progression for Map ${mapNumber}:`, progression);
        
        let randomSwatCount = 0;
        let randomFirefighterCount = 0;
        let soldierCount = 0;

        if (mapNumber > 3) {
          const { swatChance, firefighterChance, soldierChance } = progression.randomSpecialized || {};
          if (Math.random() < (swatChance || 0.15)) randomSwatCount = Math.floor(Math.random() * 2) + 1;
          if (Math.random() < (firefighterChance || 0.15)) randomFirefighterCount = Math.floor(Math.random() * 2) + 1;
          if (Math.random() < (soldierChance || 0.10)) soldierCount = 1;
        }

        const areaMultiplier = (gameMap.width * gameMap.height) / 5625;
        const scale = (v) => Math.floor(v * areaMultiplier);
        const scaleRange = (r) => ({ min: scale(r.min), max: scale(r.max) });

        ZombieSpawner.spawnZombies(gameMap, spawnPosition, {
          basicCount: scale(progression.basicCount),
          crawlerRange: scaleRange(progression.crawlerRange),
          runnerCount: scale(progression.runnerCount),
          acidRange: scaleRange(progression.acidRange),
          fatRange: scaleRange(progression.fatRange),
          randomSwatCount: scale(randomSwatCount),
          randomFirefighterCount: scale(randomFirefighterCount),
          soldierCount: scale(soldierCount),
          spitterCount: scale(progression.spitterCount || 0),
          maxTotal: scale(progression.maxTotal)
        });
        
        // SPAWN ANIMALS: Procedural rabbit generation
        AnimalSpawner.spawnAnimals(gameMap, spawnPosition, {
          rabbitRange: { min: 1, max: 2 }
        });
        
        // SPAWN NPCs: Spawning disabled



        // Save to world collection with the correct target ID
        this.saveCurrentMap(gameMap, targetMapId, currentTurn, templateToUse);

        mapData = {
          mapId: targetMapId,
          gameMap: gameMap,
          mapType: templateToUse,
          metadata: generatedMapData.metadata
        };

        // UPDATE CURRENT MAP ID
        this.currentMapId = targetMapId;

        this.emit('mapGenerated', {
          mapId: targetMapId,
          mapType: templateToUse,
          gameMap: gameMap
        });

        console.log(`[WorldManager] Generated and saved new road map: ${targetMapId}`);
      }

      // Update current map ID for both paths (existing and new)
      this.currentMapId = targetMapId;

      this.emit('mapTransition', {
        fromMapId: this.currentMapId,
        toMapId: targetMapId,
        spawnPosition: spawnPosition
      });

      logger.info(`Map transition completed: ${this.currentMapId} -> ${targetMapId}`);
      logger.info(`Player will spawn at (${spawnPosition.x}, ${spawnPosition.y})`);

      if (this.firstEntryTurn[targetMapId] === undefined) {
        this.firstEntryTurn[targetMapId] = currentTurn !== null ? currentTurn : 1;
      }

      return {
        success: true,
        gameMap: mapData.gameMap,
        mapId: targetMapId,
        spawnPosition: spawnPosition,
        metadata: mapData.metadata
      };
    } catch (error) {
      console.error('[WorldManager] Map transition failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Restore world state from JSON
   */
  static fromJSON(data) {
    const worldManager = new WorldManager();

    if (data.maps) {
      data.maps.forEach(mapData => {
        const { id, ...mapInfo } = mapData;
        worldManager.maps.set(id, mapInfo);
      });
    }

    worldManager.currentMapId = data.currentMapId || null;
    worldManager.mapCounter = data.mapCounter || 1;
    worldManager.firstEntryTurn = data.firstEntryTurn || { map_001: 1 };
    worldManager.completedMaps = data.completedMaps || [];
    worldManager.zombiesKilled = data.zombiesKilled || {};
    worldManager.zombiesSpawned = data.zombiesSpawned || {};

    logger.info(`Restored from JSON with ${worldManager.maps.size} maps`);
    return worldManager;
  }

}
