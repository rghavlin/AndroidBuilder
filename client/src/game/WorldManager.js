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
  saveCurrentMap(gameMap, mapId = null, currentTurn = 1) {
    try {
      if (!mapId) {
        mapId = this.generateMapId();
      }

      const serializedMap = gameMap.toJSON();
      const mapData = {
        id: mapId,
        serializedMap: serializedMap,
        timestamp: Date.now(),
        lastProcessedTurn: currentTurn, // Track when this map was last active
        type: 'road', // Default type, can be extended
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

      // Import required classes
      const { TemplateMapGenerator } = await import('./map/TemplateMapGenerator.js');
      const { GameMap } = await import('./map/GameMap.js');

      // Generate new map using template system
      const templateMapGenerator = new TemplateMapGenerator();
      let mapData;

      // Map 1 is always 'road', Map 2 is always 'winding_road', 3+ is random
      let templateToUse = 'road';
      if (this.mapCounter === 2) {
        templateToUse = 'winding_road';
      } else if (this.mapCounter > 2) {
        const rand = Math.random();
        if (rand < 0.33) templateToUse = 'road';
        else if (rand < 0.66) templateToUse = 'winding_road';
        else templateToUse = 'mirrored_winding_road';
      }

      mapData = templateMapGenerator.generateFromTemplate(templateToUse, {
        randomWalls: 1,
        extraFloors: 2,
        mapNumber: this.mapCounter
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
      
      const areaMultiplier = (gameMap.width * gameMap.height) / 5625;
      const scale = (v) => Math.floor(v * areaMultiplier);
      const scaleRange = (r) => ({ min: scale(r.min), max: scale(r.max) });

      ZombieSpawner.spawnZombies(gameMap, null, {
        basicCount: scale(progression.basicCount),
        crawlerRange: scaleRange(progression.crawlerRange),
        runnerCount: scale(progression.runnerCount),
        acidRange: scaleRange(progression.acidRange),
        fatRange: scaleRange(progression.fatRange),
        maxTotal: scale(progression.maxTotal),
        minDistance: 15,
      });

      // SPECIAL BUILDING SPAWNS: Army Tent Soldier Zombies, etc.
      await this._spawnSpecialBuildingZombies(gameMap);
      
      // SPAWN ANIMALS: Procedural rabbit generation
      const { AnimalSpawner } = await import('./utils/AnimalSpawner.js');
      AnimalSpawner.spawnAnimals(gameMap, null, {
        rabbitRange: { min: 1, max: 2 }
      });

      // Save to world collection
      const savedMapId = this.saveCurrentMap(gameMap, nextMapId, currentTurn);

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
    const centerX = Math.floor(gameMap.width / 2);
    const tile = gameMap.getTile(playerX, playerY);

    // If we have metadata with explicit transition points, use them
    const points = gameMap.metadata?.spawnZones?.transitionPoints;
    
    // Check for transition tile
    if (tile && tile.terrain === 'transition') {
      // NORTH transition at top edge
      if (playerY === 0) {
        // Only trigger if we are at the designated north point (if defined)
        if (!points || Math.abs(playerX - points.north.x) < 2) {
          return {
            direction: 'north',
            position: { x: playerX, y: playerY },
            nextMapId: this.getNextMapId(),
            // Spawn at the matching South entrance on the next map
            spawnPosition: { x: points?.south?.x ?? centerX, y: gameMap.height - 2 }
          };
        }
      }

      // SOUTH transition at bottom edge
      if (playerY === gameMap.height - 1 && this.canGoSouth()) {
        if (!points || Math.abs(playerX - points.south.x) < 2) {
          return {
            direction: 'south',
            position: { x: playerX, y: playerY },
            nextMapId: this.getPreviousMapId(),
            // Spawn at the matching North entrance on the previous map
            spawnPosition: { x: points?.north?.x ?? centerX, y: 1 }
          };
        }
      }
    }

    return null;
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

  /**
   * Serialize world state to JSON
   */
  toJSON() {
    return {
      maps: Array.from(this.maps.entries()).map(([id, data]) => ({ id, ...data })),
      currentMapId: this.currentMapId,
      mapCounter: this.mapCounter
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
        const { NPCSpawner } = await import('./utils/NPCSpawner.js');

        // Generate new map using template system with specific ID
        const templateMapGenerator = new TemplateMapGenerator();
        const mapNumber = this.extractMapNumber(targetMapId);
        // Map 1 is always 'road', Map 2 is always 'winding_road', 3+ is random
        let templateToUse = 'road';
        if (mapNumber === 2) {
          templateToUse = 'winding_road';
        } else if (mapNumber > 2) {
          const rand = Math.random();
          if (rand < 0.33) templateToUse = 'road';
          else if (rand < 0.66) templateToUse = 'winding_road';
          else templateToUse = 'mirrored_winding_road';
        }

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
          maxTotal: scale(progression.maxTotal)
        });
        
        // SPAWN ANIMALS: Procedural rabbit generation
        AnimalSpawner.spawnAnimals(gameMap, spawnPosition, {
          rabbitRange: { min: 1, max: 2 }
        });
        
        // SPAWN NPCs: 1 NPC per map
        NPCSpawner.spawnNPCs(gameMap, { count: 1, mapNumber });

        // SPECIAL SPAWNS: Army Tent Soldier Zombies, etc.
        await this._spawnSpecialBuildingZombies(gameMap);


        // Save to world collection with the correct target ID
        this.saveCurrentMap(gameMap, targetMapId, currentTurn);

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

    logger.info(`Restored from JSON with ${worldManager.maps.size} maps`);
    return worldManager;
  }

  /**
   * Spawn specialized zombies for special buildings (e.g. Army Tents)
   * @param {GameMap} gameMap - The map instance
   */
  async _spawnSpecialBuildingZombies(gameMap) {
    if (!gameMap.specialBuildings) {
      // Check metadata if class prop is missing
      if (gameMap.metadata && gameMap.metadata.specialBuildings) {
        gameMap.specialBuildings = gameMap.metadata.specialBuildings;
      } else {
        return;
      }
    }

    const { Zombie } = await import('./entities/Zombie.js');
    
    gameMap.specialBuildings.forEach(building => {
      if (building.type === 'army_tent') {
        console.log(`[WorldManager] Spawning soldier zombies for Army Tent at (${building.x}, ${building.y})`);
        
        // 1-2 Inside
        const insideCount = 1 + Math.floor(Math.random() * 2);
        for (let i = 0; i < insideCount; i++) {
          const rx = building.x + 1 + Math.floor(Math.random() * (building.width - 2));
          const ry = building.y + 1 + Math.floor(Math.random() * (building.height - 2));
          const z = new Zombie(`soldier-in-${rx}-${ry}-${Math.random()}`, rx, ry, 'soldier');
          gameMap.addEntity(z, rx, ry);
        }
        
        // 1-2 Outside
        const outsideCount = 1 + Math.floor(Math.random() * 2);
        for (let i = 0; i < outsideCount; i++) {
          let found = false;
          for (let attempt = 0; attempt < 15; attempt++) {
            const angle = Math.random() * Math.PI * 2;
            const dist = 5 + Math.random() * 3; // Increased range for 10x6 tent
            const rx = Math.max(0, Math.min(gameMap.width - 1, Math.floor(building.x + building.width / 2 + Math.cos(angle) * dist)));
            const ry = Math.max(0, Math.min(gameMap.height - 1, Math.floor(building.y + building.height / 2 + Math.sin(angle) * dist)));
            
            const tile = gameMap.getTile(rx, ry);
            if (tile && tile.isWalkable()) {
              const z = new Zombie(`soldier-out-${rx}-${ry}-${Math.random()}`, rx, ry, 'soldier');
              gameMap.addEntity(z, rx, ry);
              found = true;
              break;
            }
          }
        }
      }
    });
  }
}
