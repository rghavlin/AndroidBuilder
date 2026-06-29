import Logger from './utils/Logger.js';
import { getProgressionForMap, BASELINE_MAP_AREA } from './config/ProgressionConfig.js';
import GameEvents, { GAME_EVENT } from './utils/GameEvents.js';
import { compressString, decompressString } from './GameSaveSystem.js';
import { TEMPLATE_METADATA, getTemplateForMapNumber } from './config/TemplateConfig.js';
import { SafeEventEmitter } from './utils/SafeEventEmitter.js';

import { gameRandom } from './utils/SeededRandom.js';
const logger = Logger.scope('WorldManager');

/**
 * WorldManager - Handles multiple maps, transitions, and world state persistence
 * Follows UniversalGoals.md: modular, serializable, event-driven
 */
export class WorldManager extends SafeEventEmitter {
  constructor() {
    super();
    this.maps = new Map(); // Map ID -> serialized map data
    this.compressionLocks = new Map(); // Map ID -> Promise (in-progress compression)
    this.currentMapId = null;
    this.mapCounter = 1;
    this.DEV_FORCE_LAB = false; // Set to true to test Lab map on Map 1
    this.saveSlot = null; // Active save slot reference

    this.firstEntryTurn = { map_001: 1 };
    this.completedMaps = [];
    this.turnsFromEntryToExit = {};
    this.zombiesKilled = {};
    this.zombiesSpawned = {};
    this.zombiesInitialCount = {};
    this.lastReplenishSector = {};
    this.claimedPrizes = [];

    // Subscriptions
    this._onZombieDied = () => {
      this.recordZombieKill(this.currentMapId);
    };
    GameEvents.on(GAME_EVENT.ZOMBIE_DIED, this._onZombieDied);

    logger.info('Initialized');
  }

  cleanup() {
    console.log('[WorldManager] 🧼 Cleaning up event listeners and caches');
    GameEvents.off(GAME_EVENT.ZOMBIE_DIED, this._onZombieDied);
    this.maps.clear();
    this.compressionLocks.clear();
    this.removeAllListeners();
  }

  /**
   * Add event listener for world events. Alias for the SafeEventEmitter `on`
   * API, kept for backward compatibility with existing call sites.
   */
  addEventListener(eventType, callback) {
    return this.on(eventType, callback);
  }

  /**
   * Emit world events. Enriches the payload with world state + a timestamp,
   * then dispatches through SafeEventEmitter (which guards handler errors).
   */
  emit(eventType, data = {}) {
    const eventData = {
      worldManager: { currentMapId: this.currentMapId, totalMaps: this.maps.size },
      timestamp: Date.now(),
      ...data
    };
    return super.emit(eventType, eventData);
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

      if (this.zombiesInitialCount[mapId] === undefined) {
        const zombies = gameMap.getAllEntities().filter(e => e.type === 'zombie');
        this.zombiesInitialCount[mapId] = zombies.length;
      }

      const serializedMap = gameMap.toJSON();
      const isCurrentMap = (mapId === this.currentMapId || this.currentMapId === null);

      // Preserve persistent per-map metadata (e.g. the Earbucks shop catalog and
      // its purchased/stock state) that was attached to the existing map entry.
      const existingMetadata = this.maps.get(mapId)?.metadata || {};

      const mapData = {
        id: mapId,
        serializedMap: isCurrentMap ? serializedMap : null,
        compressedMap: null,
        timestamp: Date.now(),
        lastProcessedTurn: currentTurn, // Track when this map was last active
        type: templateType || gameMap.template || 'road',
        metadata: {
          ...existingMetadata,
          width: gameMap.width,
          height: gameMap.height,
          entityCount: gameMap.getAllEntities().length,
          transitionPoints: gameMap.metadata?.spawnZones?.transitionPoints || null
        }
      };

      this.maps.set(mapId, mapData);

      if (isCurrentMap) {
        this.currentMapId = mapId;
      }

      // Purge inactive maps' serialized data to keep only the active map in memory
      for (const [id, mData] of this.maps.entries()) {
        if (id !== this.currentMapId && mData.compressedMap) {
          mData.serializedMap = null;
        }
      }

      // Asynchronously compress the map
      const serializedStr = JSON.stringify(serializedMap);
      const compressionPromise = compressString(serializedStr).then(compressed => {
        mapData.compressedMap = compressed;
        // Purge raw JSON from memory if it is not the active map
        if (mapData.id !== this.currentMapId) {
          mapData.serializedMap = null;
        }
        this.compressionLocks.delete(mapId);
      }).catch(err => {
        console.error(`[WorldManager] Async compression failed for map ${mapId}:`, err);
        mapData.serializedMap = serializedMap; // Fallback
        this.compressionLocks.delete(mapId);
      });

      this.compressionLocks.set(mapId, compressionPromise);

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
   * Shared map-loading pipeline for loadMap() and loadMapForTransition().
   * The two only differ along the `forTransition` axis: transitions restore
   * selectively (excluding players to avoid duplicates), stamp the map number,
   * and emit a different event.
   * @param {string} mapId - Map identifier to load
   * @param {number|null} currentTurn - Current game turn (for catch-up)
   * @param {boolean} forTransition - Selective, player-excluding load when true
   * @returns {Promise<{gameMap: Object, metadata: Object}>}
   */
  async _loadMapInternal(mapId, currentTurn, forTransition) {
    const failCtx = forTransition ? ' for transition' : '';
    try {
      if (!this.maps.has(mapId)) {
        throw new Error(`Map ${mapId} not found in world collection`);
      }

      // Await active compression if one is running
      if (this.compressionLocks.has(mapId)) {
        logger.info(`Waiting for active compression of map ${mapId} to complete before loading...`);
        await this.compressionLocks.get(mapId);
      }

      const mapData = this.maps.get(mapId);
      logger.info(forTransition
        ? `Loading map ${mapId} for transition (excluding players)`
        : `Loading map ${mapId} from world collection (full restoration)`);

      // Decompress if serializedMap is null in memory
      let serializedMap = mapData.serializedMap;
      if (!serializedMap) {
        if (mapData.compressedMap) {
          const decompressed = await decompressString(mapData.compressedMap);
          serializedMap = JSON.parse(decompressed);
          mapData.serializedMap = serializedMap; // cache in memory while active
        } else if (this.saveSlot) {
          // Asynchronously load chunk from storage!
          const { GameSaveSystem } = await import('./GameSaveSystem.js');
          const chunk = await GameSaveSystem.loadChunkFromStorage(this.saveSlot, mapId);
          if (chunk) {
            mapData.compressedMap = chunk.compressedMap;
            serializedMap = chunk.serializedMap;
            if (!serializedMap && chunk.compressedMap) {
              const decompressed = await decompressString(chunk.compressedMap);
              serializedMap = JSON.parse(decompressed);
            }
            mapData.serializedMap = serializedMap;
          }
        }
      }

      if (!serializedMap) {
        throw new Error(`Map data for ${mapId} is empty and could not be loaded/decompressed`);
      }

      // Import GameMap class and restore. Transitions exclude players to prevent
      // duplicating the traveling player into the destination map.
      const { GameMap } = await import('./map/GameMap.js');
      let gameMap;
      if (forTransition) {
        gameMap = await GameMap.fromJSONSelective(serializedMap, { excludeEntityTypes: ['player'] });
        gameMap.mapNumber = this.extractMapNumber(mapId);
      } else {
        gameMap = await GameMap.fromJSON(serializedMap);
      }

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

      this.emit(forTransition ? 'mapLoadedForTransition' : 'mapLoaded', {
        mapId: mapId,
        gameMap: gameMap,
        metadata: mapData.metadata
      });

      logger.info(forTransition
        ? `Map ${mapId} loaded for transition with ${gameMap.getAllEntities().length} entities (no players)`
        : `Map ${mapId} loaded successfully with ${gameMap.getAllEntities().length} entities`);
      return {
        gameMap: gameMap,
        metadata: mapData.metadata
      };
    } catch (error) {
      console.error(`[WorldManager] Failed to load map ${mapId}${failCtx}:`, error);
      throw new Error(`Failed to load map ${mapId}${failCtx}: ` + error.message);
    }
  }

  /**
   * Load a map from the world collection (full restoration for save/load)
   * @param {string} mapId - Map identifier to load
   * @param {number} currentTurn - The current game turn count (for catch-up)
   * @returns {Promise<Object>} - Deserialized map data
   */
  async loadMap(mapId, currentTurn = null) {
    return this._loadMapInternal(mapId, currentTurn, false);
  }

  /**
   * Load a map for transitions (excludes player to prevent duplicates)
   * @param {string} mapId - Map identifier to load
   * @param {number} currentTurn - The current game turn count (for catch-up)
   * @returns {Promise<Object>} - Deserialized map data without player entities
   */
  async loadMapForTransition(mapId, currentTurn = null) {
    return this._loadMapInternal(mapId, currentTurn, true);
  }

  /**
   * Generate next map and add to world collection
   * @param {string} mapType - Type of map to generate ('road', 'forest', 'alley')
   * @returns {Promise<Object>} - Generated map data
   */
  /**
   * Generate, populate, and persist a brand-new map for the given id.
   * Single source of truth for the map-population pipeline shared by
   * generateNextMap() and the new-map branch of executeTransition().
   *
   * @param {string} mapId - Target map id to generate.
   * @param {number} currentTurn - Turn stamped onto the saved snapshot.
   * @param {{x:number,y:number}|null} [spawnPosition=null] - For transitions, the
   *   approach position. It is re-resolved against the freshly generated map's own
   *   exits (and used to keep zombies/animals clear of the entry), then returned.
   *   Pass null for standalone generation.
   * @returns {Promise<{gameMap, savedMapId, templateToUse, metadata, spawnPosition}>}
   */
  async _generateAndPopulateMap(mapId, currentTurn, spawnPosition = null) {
    const { TemplateMapGenerator } = await import('./map/TemplateMapGenerator.js');
    const { GameMap } = await import('./map/GameMap.js');

    const templateMapGenerator = new TemplateMapGenerator();
    const mapNumber = this.extractMapNumber(mapId);
    // Maps 1-3: Road, 4: Winding, 5: Mirrored Winding, 6: Split Road, 7+: Random
    const templateToUse = this.determineTemplateForMap(mapId);

    // Generate + apply through the connectivity gate (regenerates if unplayable)
    const { gameMap, mapData: generatedMapData } = await templateMapGenerator.generateValidatedMap(
      templateToUse,
      { randomWalls: 1, extraFloors: 2, mapNumber },
      GameMap
    );
    gameMap.mapNumber = mapNumber;

    // For transitions, finalize the spawn from the freshly generated map's own
    // exits rather than the pre-generation prediction in checkTransitionPoint().
    // This keeps the player on the actual road exit even if the map's size or exit
    // columns differ from the guess. spawnPosition.y encodes the approach edge:
    // y<=1 means we entered from the north (top).
    let resolvedSpawn = spawnPosition;
    if (spawnPosition) {
      const tp = generatedMapData.metadata?.spawnZones?.transitionPoints;
      if (tp) {
        const enteringTop = spawnPosition.y <= 1;
        if (enteringTop && tp.north) {
          resolvedSpawn = { x: tp.north.x, y: 1 };
        } else if (!enteringTop && tp.south) {
          resolvedSpawn = { x: tp.south.x, y: gameMap.height - 2 };
        }
      }
    }

    // SPAWN LOOT: New procedural loot generation
    const { LootGenerator } = await import('./map/LootGenerator.js');
    new LootGenerator().spawnLoot(gameMap, mapNumber);

    // SPAWN ZOMBIES: Initial map population (scaled by area)
    const { ZombieSpawner } = await import('./utils/ZombieSpawner.js');
    const progression = getProgressionForMap(mapNumber || 1);

    let randomSwatCount = 0;
    let randomFirefighterCount = 0;
    let soldierCount = 0;
    if (progression.randomSpecialized || mapNumber > 3) {
      const { swatChance, firefighterChance, soldierChance } = progression.randomSpecialized || {};
      if (gameRandom.next() < (swatChance || 0.15)) randomSwatCount = gameRandom.nextInt(0, 1) + 1;
      if (gameRandom.next() < (firefighterChance || 0.15)) randomFirefighterCount = gameRandom.nextInt(0, 1) + 1;
      if (gameRandom.next() < (soldierChance || 0.10)) soldierCount = 1;
    }

    const areaMultiplier = (gameMap.width * gameMap.height) / BASELINE_MAP_AREA;
    const scale = (v) => Math.floor(v * areaMultiplier);
    const scaleRange = (r) => ({ min: scale(r.min), max: scale(r.max) });

    ZombieSpawner.spawnZombies(gameMap, resolvedSpawn, {
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
    const { AnimalSpawner } = await import('./utils/AnimalSpawner.js');
    AnimalSpawner.spawnAnimals(gameMap, resolvedSpawn, {
      rabbitRange: { min: 1, max: 2 }
    });

    // SPAWN NPCs: Goal-directed travelers
    const { NPCSpawner } = await import('./utils/NPCSpawner.js');
    NPCSpawner.spawnNPCs(gameMap, {
      count: 1, // Start with 1 NPC per map
      mapNumber
    });

    // Spawn the shopkeeper/town turrets BEFORE saving so they're in the snapshot
    if (templateToUse === 'branching_road') {
      NPCSpawner.spawnShopkeeper(gameMap);
      NPCSpawner.spawnTownTurrets(gameMap);
      NPCSpawner.spawnTollGate(gameMap);
    }

    // Persist to the world collection
    const savedMapId = this.saveCurrentMap(gameMap, mapId, currentTurn, templateToUse);

    if (templateToUse === 'branching_road') {
      const { earbucksShopSystem } = await import('./systems/EarbucksShopSystem.js');
      earbucksShopSystem.initCatalog(savedMapId);
    }

    this.emit('mapGenerated', {
      mapId: savedMapId,
      mapType: templateToUse,
      gameMap
    });

    return {
      gameMap,
      savedMapId,
      templateToUse,
      metadata: generatedMapData.metadata,
      spawnPosition: resolvedSpawn
    };
  }

  async generateNextMap(mapType = 'road', currentTurn = 1) {
    try {
      const nextMapId = this.generateMapId();
      const { gameMap, savedMapId, templateToUse } = await this._generateAndPopulateMap(nextMapId, currentTurn, null);

      logger.info(`Generated and saved new ${mapType} map: ${savedMapId}`);
      return {
        mapId: savedMapId,
        gameMap,
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
      // 1. Check for custom scenario map transitions
      if (gameMap.metadata?.mapTransitions) {
        const customTransition = gameMap.metadata.mapTransitions.find(
          tr => tr.x === playerX && tr.y === playerY
        );
        if (customTransition) {
          return {
            direction: 'north', // Defaults to 'north' to trigger "Move on down the road?" prompt
            position: { x: playerX, y: playerY },
            nextMapId: customTransition.targetId,
            spawnPosition: { x: 22, y: 123 }, // high Y value indicates entering from bottom/south
            isCustom: true,
            targetType: customTransition.targetType,
            level: customTransition.level
          };
        }
      }
        // NORTH transition at top edge (Entering NEXT map from SOUTH)
        if (playerY === 0) {
            const nextMapId = this.getNextMapId();
            let spawnX = 22; // Default for straight road
            let nextHeight = 125; // Default road height

            // If next map exists, get its actual exit point and height
            if (this.maps.has(nextMapId)) {
                const nextMapData = this.maps.get(nextMapId);
                const nextPoints = nextMapData.metadata?.transitionPoints || nextMapData.serializedMap?.metadata?.spawnZones?.transitionPoints;
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
                const nextMeta = TEMPLATE_METADATA[nextTemplate];
                
                nextHeight = nextMeta?.size?.height ?? 125;
                spawnX = nextMeta?.southEntranceX ?? 22;
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
          const prevPoints = prevMapData.metadata?.transitionPoints || prevMapData.serializedMap?.metadata?.spawnZones?.transitionPoints;
          if (prevPoints?.north) spawnX = prevPoints.north.x;
        } else {
          // Fallback prediction for NORTH exit of the previous map
          const prevTemplate = this.determineTemplateForMap(prevMapId);
          const prevMeta = TEMPLATE_METADATA[prevTemplate];
          spawnX = prevMeta?.northExitX ?? 22;
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

    return getTemplateForMapNumber(mapNumber, this.DEV_FORCE_LAB);
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
    return false;
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

  recordZombieSpawn(mapId) {
    if (!mapId) return;
    if (this.zombiesSpawned[mapId] === undefined) {
      this.zombiesSpawned[mapId] = 0;
    }
    this.zombiesSpawned[mapId]++;
  }

  getZombieKillsPercentage(mapId) {
    const killed = this.zombiesKilled[mapId] || 0;
    const spawned = this.zombiesSpawned[mapId] || 0;
    if (spawned <= 0) return 100;
    return Math.min(100, Math.round((killed / spawned) * 100));
  }

  markMapCompleted(mapId, currentTurn = 1) {
    if (!this.completedMaps) {
      this.completedMaps = [];
    }
    if (!this.completedMaps.includes(mapId)) {
      this.completedMaps.push(mapId);
    }
    if (this.turnsFromEntryToExit[mapId] === undefined) {
      const entryTurn = this.firstEntryTurn[mapId] || 1;
      this.turnsFromEntryToExit[mapId] = Math.max(0, currentTurn - entryTurn);
    }
  }

  /**
   * Serialize world state to JSON
   */
  toJSON() {
    return {
      maps: Array.from(this.maps.entries()).map(([id, data]) => ({
        id,
        timestamp: data.timestamp,
        lastProcessedTurn: data.lastProcessedTurn,
        type: data.type,
        metadata: data.metadata
      })),
      currentMapId: this.currentMapId,
      mapCounter: this.mapCounter,
      firstEntryTurn: this.firstEntryTurn,
      completedMaps: this.completedMaps,
      turnsFromEntryToExit: this.turnsFromEntryToExit,
      zombiesKilled: this.zombiesKilled,
      zombiesSpawned: this.zombiesSpawned,
      zombiesInitialCount: this.zombiesInitialCount,
      lastReplenishSector: this.lastReplenishSector,
      claimedPrizes: this.claimedPrizes
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
      let serializedMap = mapData.serializedMap;
      if (!serializedMap) {
        if (mapData.compressedMap) {
          const decompressed = await decompressString(mapData.compressedMap);
          serializedMap = JSON.parse(decompressed);
        } else if (this.saveSlot) {
          const { GameSaveSystem } = await import('./GameSaveSystem.js');
          const chunk = await GameSaveSystem.loadChunkFromStorage(this.saveSlot, mapId);
          if (chunk) {
            mapData.compressedMap = chunk.compressedMap;
            serializedMap = chunk.serializedMap;
            if (!serializedMap && chunk.compressedMap) {
              const decompressed = await decompressString(chunk.compressedMap);
              serializedMap = JSON.parse(decompressed);
            }
          }
        }
      }

      if (!serializedMap) {
        console.warn(`[WorldManager] Cannot stamp transition - map ${mapId} data not loaded/decompressed`);
        return false;
      }

      const { GameMap } = await import('./map/GameMap.js');
      const gameMap = await GameMap.fromJSON(serializedMap);

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
   * @param {Object} customParams - Optional parameters for custom map generation
   * @returns {Promise<Object>} - Transition result
   */
  async executeTransition(targetMapId, spawnPosition, currentTurn = null, customParams = null) {
    const fromMapId = this.currentMapId;
    try {
      // Check if target map exists, if not generate it
      let mapData;
      if (this.maps.has(targetMapId)) {
        console.log(`[WorldManager] Loading existing map for transition: ${targetMapId}`);
        mapData = await this.loadMapForTransition(targetMapId, currentTurn);
      } else if (customParams) {
        console.log(`[WorldManager] Executing custom transition to:`, targetMapId, customParams);
        if (customParams.targetType === 'scenario') {
          // Load custom scenario
          const { ScenarioStorage } = await import('./ScenarioStorage.js');
          const scenarioData = await ScenarioStorage.load(targetMapId);
          if (!scenarioData) {
            throw new Error(`Custom scenario '${targetMapId}' not found`);
          }
          const { TemplateMapGenerator } = await import('./map/TemplateMapGenerator.js');
          const templateMapGenerator = new TemplateMapGenerator();
          
          // Generate mapData from scenario
          const generatedMapData = await templateMapGenerator.generateFromScenario(scenarioData);
          
          const { GameMap } = await import('./map/GameMap.js');
          const gameMap = new GameMap(generatedMapData.width, generatedMapData.height);
          await templateMapGenerator.applyToGameMap(gameMap, generatedMapData);
          
          // Set map number if any, default to 1
          gameMap.mapNumber = 1;
          
          // Resolve spawn position
          const scenarioSpawn = generatedMapData.metadata?.spawnZones?.playerStart?.[0];
          if (scenarioSpawn) {
            spawnPosition = { x: scenarioSpawn.x, y: scenarioSpawn.y };
          } else {
            spawnPosition = { x: Math.floor(gameMap.width / 2), y: Math.floor(gameMap.height * 0.9) };
          }
          
          const savedMapId = this.saveCurrentMap(gameMap, targetMapId, currentTurn, 'scenario');
          mapData = {
            mapId: savedMapId,
            gameMap,
            mapType: 'scenario',
            metadata: generatedMapData.metadata
          };
        } else if (customParams.targetType === 'generator') {
          // Procedural generation using a specific template/generator and level scaling
          const generatorToTemplate = {
            'BranchingRoadGenerator': 'branching_road',
            'LabMapGenerator': 'lab',
            'MirroredWindingRoadGenerator': 'mirrored_winding_road',
            'RoadGenerator': 'road',
            'SplitRoadGenerator': 'split_road',
            'StartingRoadGenerator': 'starting_road',
            'WindingRoadGenerator': 'winding_road'
          };
          const templateToUse = generatorToTemplate[customParams.targetId] || 'road';
          const mapNumber = customParams.level || 1;
          
          const { TemplateMapGenerator } = await import('./map/TemplateMapGenerator.js');
          const { GameMap } = await import('./map/GameMap.js');
          const templateMapGenerator = new TemplateMapGenerator();
          
          // Generate using the specific template & mapNumber (for loot/zombie scaling)
          const { gameMap, mapData: generatedMapData } = await templateMapGenerator.generateValidatedMap(
            templateToUse,
            { randomWalls: 1, extraFloors: 2, mapNumber },
            GameMap
          );
          gameMap.mapNumber = mapNumber;
          
          // SPAWN LOOT & ZOMBIES (same as normal map generation but with custom mapNumber)
          const { LootGenerator } = await import('./map/LootGenerator.js');
          new LootGenerator().spawnLoot(gameMap, mapNumber);
          
          const { ZombieSpawner } = await import('./utils/ZombieSpawner.js');
          const { getProgressionForMap, BASELINE_MAP_AREA } = await import('./config/ProgressionConfig.js');
          const progression = getProgressionForMap(mapNumber);
          
          // Determine specialized zombie counts
          const { gameRandom } = await import('./utils/SeededRandom.js');
          let randomSwatCount = 0;
          let randomFirefighterCount = 0;
          let soldierCount = 0;
          if (progression.randomSpecialized || mapNumber > 3) {
            const { swatChance, firefighterChance, soldierChance } = progression.randomSpecialized || {};
            if (gameRandom.next() < (swatChance || 0.15)) randomSwatCount = gameRandom.nextInt(0, 1) + 1;
            if (gameRandom.next() < (firefighterChance || 0.15)) randomFirefighterCount = gameRandom.nextInt(0, 1) + 1;
            if (gameRandom.next() < (soldierChance || 0.10)) soldierCount = 1;
          }
          
          const areaMultiplier = (gameMap.width * gameMap.height) / BASELINE_MAP_AREA;
          const scale = (v) => Math.floor(v * areaMultiplier);
          const scaleRange = (r) => ({ min: scale(r.min), max: scale(r.max) });
          
          // Use default spawn prediction or exit points if defined
          let resolvedSpawn = spawnPosition || { x: Math.floor(gameMap.width / 2), y: gameMap.height - 2 };
          const tp = generatedMapData.metadata?.spawnZones?.transitionPoints;
          const enteringTop = spawnPosition ? spawnPosition.y <= 1 : true;
          if (tp) {
            if (enteringTop && tp.north) {
              resolvedSpawn = { x: tp.north.x, y: 1 };
            } else if (!enteringTop && tp.south) {
              resolvedSpawn = { x: tp.south.x, y: gameMap.height - 2 };
            }
          } else {
            if (enteringTop) {
              resolvedSpawn = { x: Math.floor(gameMap.width / 2), y: 1 };
            } else {
              resolvedSpawn = { x: Math.floor(gameMap.width / 2), y: gameMap.height - 2 };
            }
          }
          spawnPosition = resolvedSpawn;
          
          ZombieSpawner.spawnZombies(gameMap, resolvedSpawn, {
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
          
          const { AnimalSpawner } = await import('./utils/AnimalSpawner.js');
          AnimalSpawner.spawnAnimals(gameMap, resolvedSpawn, {
            rabbitRange: { min: 1, max: 2 }
          });
          
          const { NPCSpawner } = await import('./utils/NPCSpawner.js');
          NPCSpawner.spawnNPCs(gameMap, { count: 1, mapNumber });
          
          if (templateToUse === 'branching_road') {
            NPCSpawner.spawnShopkeeper(gameMap);
            NPCSpawner.spawnTownTurrets(gameMap);
            NPCSpawner.spawnTollGate(gameMap);
          }

          const savedMapId = this.saveCurrentMap(gameMap, targetMapId, currentTurn, templateToUse);
          if (templateToUse === 'branching_road') {
            const { earbucksShopSystem } = await import('./systems/EarbucksShopSystem.js');
            earbucksShopSystem.initCatalog(savedMapId);
          }
          
          mapData = {
            mapId: savedMapId,
            gameMap,
            mapType: templateToUse,
            metadata: generatedMapData.metadata
          };
        }
      } else {
        console.log(`[WorldManager] Generating new map: ${targetMapId}`);

        // Generate + populate + persist via the shared pipeline. It also re-resolves
        // the spawn position against the freshly generated map's exits.
        const populated = await this._generateAndPopulateMap(targetMapId, currentTurn, spawnPosition);
        spawnPosition = populated.spawnPosition;

        mapData = {
          mapId: targetMapId,
          gameMap: populated.gameMap,
          mapType: populated.templateToUse,
          metadata: populated.metadata
        };

        // UPDATE CURRENT MAP ID
        this.currentMapId = targetMapId;

        console.log(`[WorldManager] Generated and saved new road map: ${targetMapId}`);
      }

      // Update current map ID for both paths (existing and new)
      this.currentMapId = targetMapId;

      this.emit('mapTransition', {
        fromMapId: fromMapId,
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

  claimPrize(mapId) {
    if (!this.claimedPrizes) {
      this.claimedPrizes = [];
    }
    if (!this.claimedPrizes.includes(mapId)) {
      this.claimedPrizes.push(mapId);
    }
  }

  isPrizeClaimed(mapId) {
    return this.claimedPrizes && this.claimedPrizes.includes(mapId);
  }

  /**
   * Restore world state from JSON
   */
  static fromJSON(data) {
    const worldManager = new WorldManager();

    if (data.maps) {
      data.maps.forEach(mapData => {
        const { id, ...mapInfo } = mapData;
        worldManager.maps.set(id, {
          id,
          serializedMap: null,
          compressedMap: null,
          ...mapInfo
        });
      });
    }

    worldManager.currentMapId = data.currentMapId || null;
    worldManager.mapCounter = data.mapCounter || 1;
    worldManager.firstEntryTurn = data.firstEntryTurn || { map_001: 1 };
    worldManager.completedMaps = data.completedMaps || [];
    worldManager.turnsFromEntryToExit = data.turnsFromEntryToExit || {};
    worldManager.zombiesKilled = data.zombiesKilled || {};
    worldManager.zombiesSpawned = data.zombiesSpawned || {};
    worldManager.zombiesInitialCount = data.zombiesInitialCount || {};
    worldManager.lastReplenishSector = data.lastReplenishSector || {};
    worldManager.claimedPrizes = data.claimedPrizes || [];

    logger.info(`Restored from JSON with ${worldManager.maps.size} maps`);
    return worldManager;
  }

}
