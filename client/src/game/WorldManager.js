
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

    console.log('[WorldManager] Initialized');
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
   */
  saveCurrentMap(gameMap, mapId = null) {
    try {
      if (!mapId) {
        mapId = this.generateMapId();
      }

      const serializedMap = gameMap.toJSON();
      const mapData = {
        id: mapId,
        serializedMap: serializedMap,
        timestamp: Date.now(),
        type: 'road', // Default type, can be extended
        metadata: {
          width: gameMap.width,
          height: gameMap.height,
          entityCount: gameMap.getAllEntities().length
        }
      };

      this.maps.set(mapId, mapData);
      this.currentMapId = mapId;

      console.log(`[WorldManager] *** MAP SAVED: ${mapId} ***`);
      console.log(`[WorldManager] *** WORLD COLLECTION NOW HAS ${this.maps.size} MAPS ***`);
      console.log(`[WorldManager] Map metadata:`, {
        width: mapData.metadata.width,
        height: mapData.metadata.height,
        entities: mapData.metadata.entityCount,
        type: mapData.type
      });

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
   * @returns {Promise<Object>} - Deserialized map data
   */
  async loadMap(mapId) {
    try {
      if (!this.maps.has(mapId)) {
        throw new Error(`Map ${mapId} not found in world collection`);
      }

      const mapData = this.maps.get(mapId);
      console.log(`[WorldManager] Loading map ${mapId} from world collection (full restoration)`);

      // Import GameMap class and restore from JSON with all entities
      const { GameMap } = await import('./map/GameMap.js');
      const gameMap = await GameMap.fromJSON(mapData.serializedMap);

      this.currentMapId = mapId;

      this.emit('mapLoaded', {
        mapId: mapId,
        gameMap: gameMap,
        metadata: mapData.metadata
      });

      console.log(`[WorldManager] Map ${mapId} loaded successfully with ${gameMap.getAllEntities().length} entities`);
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
   * @returns {Promise<Object>} - Deserialized map data without player entities
   */
  async loadMapForTransition(mapId) {
    try {
      if (!this.maps.has(mapId)) {
        throw new Error(`Map ${mapId} not found in world collection`);
      }

      const mapData = this.maps.get(mapId);
      console.log(`[WorldManager] Loading map ${mapId} for transition (excluding players)`);

      // Import GameMap class and restore selectively (exclude players)
      const { GameMap } = await import('./map/GameMap.js');
      const gameMap = await GameMap.fromJSONSelective(mapData.serializedMap, {
        excludeEntityTypes: ['player']
      });

      this.currentMapId = mapId;

      this.emit('mapLoadedForTransition', {
        mapId: mapId,
        gameMap: gameMap,
        metadata: mapData.metadata
      });

      console.log(`[WorldManager] Map ${mapId} loaded for transition with ${gameMap.getAllEntities().length} entities (no players)`);
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
  async generateNextMap(mapType = 'road') {
    try {
      const nextMapId = this.generateMapId();

      // Import required classes
      const { TemplateMapGenerator } = await import('./map/TemplateMapGenerator.js');
      const { GameMap } = await import('./map/GameMap.js');

      // Generate new map using template system
      const templateMapGenerator = new TemplateMapGenerator();
      let mapData;

      if (mapType === 'road') {
        mapData = templateMapGenerator.generateFromTemplate('road', {
          randomWalls: 1,
          extraFloors: 2
        });
      } else {
        // Future: handle other map types like 'forest', 'alley'
        throw new Error(`Map type ${mapType} not yet implemented`);
      }

      // Create GameMap instance and apply template
      const gameMap = new GameMap(mapData.width, mapData.height);
      await templateMapGenerator.applyToGameMap(gameMap, mapData);

      // SPAWN LOOT: New procedural loot generation
      const { LootGenerator } = await import('./map/LootGenerator.js');
      const lootGenerator = new LootGenerator();
      lootGenerator.spawnLoot(gameMap);

      // Save to world collection
      const savedMapId = this.saveCurrentMap(gameMap, nextMapId);

      this.emit('mapGenerated', {
        mapId: savedMapId,
        mapType: mapType,
        gameMap: gameMap
      });

      console.log(`[WorldManager] Generated and saved new ${mapType} map: ${savedMapId}`);
      return {
        mapId: savedMapId,
        gameMap: gameMap,
        mapType: mapType
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

    // Check for transition tile at (17,0) - north transition
    if (playerX === 17 && playerY === 0 && tile && tile.terrain === 'transition') {
      return {
        direction: 'north',
        position: { x: playerX, y: playerY },
        nextMapId: this.getNextMapId(),
        spawnPosition: { x: 17, y: 123 } // Bottom of next map
      };
    }

    // Check for south transition at (17,124) - only if not first map
    if (playerX === 17 && playerY === 124 && this.canGoSouth() && tile && tile.terrain === 'transition') {
      return {
        direction: 'south',
        position: { x: playerX, y: playerY },
        nextMapId: this.getPreviousMapId(),
        spawnPosition: { x: 17, y: 1 } // Top of previous map
      };
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

      if (direction === 'south' && mapId !== 'map_001') {
        console.log(`[WorldManager] Stamping south transition at (17, 124) on ${mapId}`);
        gameMap.setTerrain(17, 124, 'transition');
        this.saveCurrentMap(gameMap, mapId);
        return true;
      } else if (direction === 'north') {
        console.log(`[WorldManager] Stamping north transition at (17, 0) on ${mapId}`);
        gameMap.setTerrain(17, 0, 'transition');
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
   * @returns {Promise<Object>} - Transition result
   */
  async executeTransition(targetMapId, spawnPosition) {
    try {
      // Check if target map exists, if not generate it
      let mapData;
      if (this.maps.has(targetMapId)) {
        console.log(`[WorldManager] Loading existing map for transition: ${targetMapId}`);
        mapData = await this.loadMapForTransition(targetMapId);
      } else {
        console.log(`[WorldManager] Generating new map: ${targetMapId}`);

        // Import required classes
        const { TemplateMapGenerator } = await import('./map/TemplateMapGenerator.js');
        const { GameMap } = await import('./map/GameMap.js');

        // Generate new map using template system with specific ID
        const templateMapGenerator = new TemplateMapGenerator();
        let generatedMapData = templateMapGenerator.generateFromTemplate('road', {
          randomWalls: 1,
          extraFloors: 2
        });

        // Create GameMap instance and apply template
        const gameMap = new GameMap(generatedMapData.width, generatedMapData.height);
        await templateMapGenerator.applyToGameMap(gameMap, generatedMapData);

        // SPAWN LOOT: New procedural loot generation
        const { LootGenerator } = await import('./map/LootGenerator.js');
        const lootGenerator = new LootGenerator();
        lootGenerator.spawnLoot(gameMap);

        // Stamp south transition on new maps (except map_001)
        if (targetMapId !== 'map_001') {
          console.log(`[WorldManager] Stamping south transition at (17, 124) on new map ${targetMapId}`);
          gameMap.setTerrain(17, 124, 'transition');
        }

        // Save to world collection with the correct target ID
        this.saveCurrentMap(gameMap, targetMapId);

        mapData = {
          mapId: targetMapId,
          gameMap: gameMap,
          mapType: 'road'
        };

        this.emit('mapGenerated', {
          mapId: targetMapId,
          mapType: 'road',
          gameMap: gameMap
        });

        console.log(`[WorldManager] Generated and saved new road map: ${targetMapId}`);
      }

      this.emit('mapTransition', {
        fromMapId: this.currentMapId,
        toMapId: targetMapId,
        spawnPosition: spawnPosition
      });

      console.log(`[WorldManager] Map transition completed: ${this.currentMapId} -> ${targetMapId}`);
      console.log(`[WorldManager] Player will spawn at (${spawnPosition.x}, ${spawnPosition.y})`);

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

    console.log(`[WorldManager] Restored from JSON with ${worldManager.maps.size} maps`);
    return worldManager;
  }
}
