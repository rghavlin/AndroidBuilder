import { Tile } from './Tile.js';
import { isFloor, isIndoorFloor } from './TerrainTypes.js';
import { ItemDefs, createItemFromDef } from '../inventory/ItemDefs.js';
import { EquipmentSlot, ItemTrait, ItemCategory, Rarity } from '../inventory/traits.js';
import { TurnProcessingUtils } from '../utils/TurnProcessingUtils.js';
import { ScentTrail } from '../utils/ScentTrail.js';
import { getHourFromTurn } from '../utils/TimeUtils.js';
import { ZombieReplenishmentSystem } from '../systems/ZombieReplenishmentSystem.js';
import { Entity, EntityType } from '../entities/Entity.js';
import { Pathfinding } from '../utils/Pathfinding.js';
import GameEvents, { GAME_EVENT } from '../utils/GameEvents.js';
import { Item as ECSItem } from '../components/Item.js';
import { Item } from '../inventory/Item.js';
import { gridItems } from '../inventory/gridUtils.js';
import { SafeEventEmitter } from '../utils/SafeEventEmitter.js';
import { Health } from '../components/Health.js';
import { Renderable } from '../components/Renderable.js';
import { MeleeWeapon } from '../components/MeleeWeapon.js';
import { Position } from '../components/Position.js';
import Logger from '../utils/Logger.js';

import { gameRandom } from '../utils/SeededRandom.js';
const log = Logger.scope('GameMap');

/**
 * Variable-size map container (width x height set at construction) with tile
 * management, an entity/type spatial index, per-turn simulation, and
 * serialization.
 */
export class GameMap extends SafeEventEmitter {
  static isSimulating = false;

  constructor(width = 20, height = 20) {
    super();
    this.width = width;
    this.height = height;
    this.tiles = [];
    this.entityMap = new Map(); // Track all entities by ID
    // Secondary index: entity.type -> Set<entity>, so getEntitiesByType is O(matches)
    // instead of scanning every entity. Maintained in addEntity/removeEntity and
    // rebuilt on deserialize. Safe because entity.type is set once at creation.
    this.entitiesByType = new Map();
    this.scentSequenceCounter = 0;
    // Sparse index of tiles that currently hold scent ("x,y" keys). Lets scent
    // decay cost scale with the number of active scent tiles instead of the whole
    // map area (critical for large maps). Rebuilt from tiles on deserialize.
    this.activeScents = new Set();
    this.buildings = []; // Standardized building metadata
    this.furniture = []; // Decorative floorplan furniture outlines: {type, x, y, w, h, rot}
    this.lowSpots = []; // Phase 25: Designated tiles for water accumulation
    this.mapNumber = 1;
    this.template = 'road'; // Template used to generate this map
    this.activeFires = new Set();

    // Initialize empty map
    this.initializeMap();
  }

  /**
   * Initialize map with default grass terrain
   */
  initializeMap() {
    this.tiles = [];
    for (let y = 0; y < this.height; y++) {
      const row = [];
      for (let x = 0; x < this.width; x++) {
        const tile = new Tile(x, y, 'grass');
        tile.gameMap = this;
        row.push(tile);
      }
      this.tiles.push(row);
    }

    console.log(`[GameMap] Initialized ${this.width}x${this.height} map`);
  }

  /**
   * Add event listener for map events. Alias for the SafeEventEmitter `on` API,
   * kept for backward compatibility with existing call sites.
   */
  addEventListener(eventType, callback) {
    return this.on(eventType, callback);
  }

  /**
   * Emit map events. Enriches the payload with map dimensions + a timestamp,
   * then dispatches through SafeEventEmitter (which guards handler errors).
   */
  emit(eventType, data = {}) {
    const eventData = {
      map: { width: this.width, height: this.height },
      timestamp: Date.now(),
      ...data
    };
    return super.emit(eventType, eventData);
  }

  /**
   * Emit a noise at a location that alerts nearby zombies
   * @param {number} x - X coordinate of noise
   * @param {number} y - Y coordinate of noise
   * @param {number} radius - Radius in which zombies hear the noise
   */
  emitNoise(x, y, radius) {
    console.log(`[GameMap] 📢 Noise emitted at (${x}, ${y}) with radius ${radius}`);
    let alertedCount = 0;

    this.getEntitiesByType(EntityType.ZOMBIE).forEach(zombie => {
      const zx = zombie.logicalX !== undefined ? zombie.logicalX : zombie.x;
      const zy = zombie.logicalY !== undefined ? zombie.logicalY : zombie.y;
      const dist = Math.sqrt(Math.pow(zx - x, 2) + Math.pow(zy - y, 2));
      if (dist <= radius) {
        if (typeof zombie.setNoiseHeard === 'function') {
          zombie.setNoiseHeard(x, y);
          alertedCount++;
        }
      }
    });

    if (alertedCount > 0) {
      console.log(`[GameMap] 🧟 ${alertedCount} zombies alerted by noise at (${x}, ${y})`);
    }

    // Alert NPCs of noise within radius
    let npcsAlerted = 0;
    this.getEntitiesByType(EntityType.NPC).forEach(npc => {
      const nx = npc.logicalX !== undefined ? npc.logicalX : npc.x;
      const ny = npc.logicalY !== undefined ? npc.logicalY : npc.y;
      const dist = Math.sqrt(Math.pow(nx - x, 2) + Math.pow(ny - y, 2));
      if (dist <= radius) {
        if (typeof npc.setNoiseHeard === 'function') {
          npc.setNoiseHeard(x, y);
          npcsAlerted++;
        }
      }
    });

    if (npcsAlerted > 0) {
      console.log(`[GameMap] 👤 ${npcsAlerted} NPCs alerted by noise at (${x}, ${y})`);
    }
  }

  /**
   * Clear the sheltered status cache
   */
  clearShelteredCache() {
    this._shelteredCache = null;
  }

  /**
   * Static Utility: Check if a position is sheltered (inside a building)
   * @param {GameMap} gameMap - The map to check
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   * @returns {boolean}
   */
  static isSheltered(gameMap, x, y) {
    if (!gameMap) return false;

    // Check cache
    if (!gameMap._shelteredCache) {
      gameMap._shelteredCache = new Map();
    } else {
      const cached = gameMap._shelteredCache.get(`${x},${y}`);
      if (cached !== undefined) return cached;
    }

    const startTile = gameMap.getTile(x, y);
    // PHASE 15: Support tent_floor and transition (doorways) as sheltered terrain
    const isIndoorTerrain = startTile && isIndoorFloor(startTile.terrain);
    if (!isIndoorTerrain) {
      gameMap._shelteredCache.set(`${x},${y}`, false);
      return false;
    }

    const queue = [{ x, y }];
    const visited = new Set([`${x},${y}`]);
    const maxCheckedTiles = 2000; 

    let head = 0;
    while (head < queue.length && queue.length < maxCheckedTiles) {
      const { x: curX, y: curY } = queue[head++];
      const neighbors = [{ x: curX + 1, y: curY }, { x: curX - 1, y: curY }, { x: curX, y: curY + 1 }, { x: curX, y: curY - 1 }];

      for (const next of neighbors) {
        const key = `${next.x},${next.y}`;
        if (visited.has(key)) continue;

        const tile = gameMap.getTile(next.x, next.y);
        if (!tile) continue;

        const door = tile.contents.find(e => e.type === EntityType.DOOR);
        const isClosedDoor = door && !door.isOpen;
        const window = tile.contents.find(e => e.type === EntityType.WINDOW);
        const isClosedWindow = window && !window.isOpen && !window.isBroken;

        const blocksBFS = (
          tile.terrain === 'wall' || 
          tile.terrain === 'building' || 
          tile.terrain === 'fence' || 
          (tile.terrain === 'window' && isClosedWindow) || 
          isClosedDoor
        );

        if (blocksBFS) {
          visited.add(key);
          continue;
        }

        const isIndoors = isIndoorFloor(tile.terrain);
        if (!isIndoors || (tile.terrain === 'window' && !isClosedWindow)) {
          gameMap._shelteredCache.set(`${x},${y}`, false);
          return false;
        }

        visited.add(key);
        queue.push(next);
      }
    }
    gameMap._shelteredCache.set(`${x},${y}`, true);
    return true;
  }

  /**
   * Static Utility: Check if two positions are in the same building shell
   * Used for noise propagation through indoor spaces.
   * @param {GameMap} gameMap - The map to check
   * @param {Object} posA - {x, y} start
   * @param {Object} posB - {x, y} end
   * @returns {boolean}
   */
  static isSameBuildingShell(gameMap, posA, posB) {
    if (!posA || !posB || !gameMap) return false;

    const startTile = gameMap.getTile(posA.x, posA.y);
    const isIndoors = (tile) => tile && (isIndoorFloor(tile.terrain) || tile.terrain === 'building' || tile.contents.some(e => e.type === EntityType.DOOR || e.type === EntityType.WINDOW || e.type === EntityType.GARAGE_DOOR));
    
    if (!isIndoors(startTile)) return false;

    const manhattanDist = Math.abs(posA.x - posB.x) + Math.abs(posA.y - posB.y);
    if (manhattanDist > 15) return false; 

    const queue = [{ x: posA.x, y: posA.y, dist: 0, closedDoors: 0 }];
    const visited = new Set([`${posA.x},${posA.y}`]);
    const maxDist = 30;

    // T4: index pointer instead of queue.shift() (O(n) per dequeue -> O(n^2)).
    let head = 0;
    while (head < queue.length) {
      const { x, y, dist, closedDoors } = queue[head++];

      if (x === posB.x && y === posB.y) {
          return closedDoors <= 1;
      }
      
      if (dist >= maxDist) continue;
      if (closedDoors > 1) continue; 

      const neighbors = [
        { x: x + 1, y: y }, { x: x - 1, y: y },
        { x: x, y: y + 1 }, { x: x, y: y - 1 }
      ];

      for (const next of neighbors) {
        const key = `${next.x},${next.y}`;
        if (visited.has(key)) continue;

        const tile = gameMap.getTile(next.x, next.y);
        const entity = tile?.contents.find(e => e.type === EntityType.DOOR || e.type === EntityType.WINDOW || e.type === EntityType.GARAGE_DOOR);
        const isWall = tile && tile.blocksMovement && !entity;
        const isTarget = next.x === posB.x && next.y === posB.y;
        
        if (isWall || (!isIndoors(tile) && !isTarget)) {
          visited.add(key);
          continue;
        }

        let nextClosedDoors = closedDoors;
        const door = tile.contents.find(e => e.type === EntityType.DOOR);
        if (door && !door.isOpen) {
            nextClosedDoors++;
        }

        visited.add(key);
        queue.push({ ...next, dist: dist + 1, closedDoors: nextClosedDoors });
      }
    }

    return false;
  }

  /**
   * Get items on a tile without removing them (non-destructive)
   * @param {number} x - Tile X
   * @param {number} y - Tile Y
   * @returns {Array} - Array of item entities
   */
  getItemsOnTile(x, y) {
    const tile = this.getTile(x, y);
    if (!tile) return [];
    return tile.contents.filter(e => e.type === 'item' && e.hasComponent && e.hasComponent('Item'));
  }

  /**
   * Get tile at coordinates
   */
  getTile(x, y) {
    // Floor fractional coords: callers occasionally pass interpolated/animation
    // positions (e.g. moveEntity checks walkability before it sanitizes with
    // Math.floor). Indexing this.tiles[2.5] yields undefined and then throws on
    // [x]; flooring returns the containing tile (or null) instead of crashing.
    // NaN floors to NaN, which fails the bounds check and returns null.
    x = Math.floor(x);
    y = Math.floor(y);
    if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
      return this.tiles[y][x];
    }
    return null;
  }

  /**
   * Set inventory items on a specific tile by converting them to ECS entities
   * @param {number} x - Tile X
   * @param {number} y - Tile Y
   * @param {Array} items - Array of Item instances or entity data
   */
  setItemsOnTile(x, y, items) {
    const tile = this.getTile(x, y);
    if (!tile) return;

    // Create a copy of the input items list to prevent reference issues if items === tile.inventoryItems
    const itemsToSet = [...(items || [])];

    // Remove any existing item entities on this tile
    const existingItems = tile.contents.filter(e => e.type === 'item' && e.hasComponent && e.hasComponent('Item'));
    existingItems.forEach(item => {
      this.removeEntity(item.id);
    });

    // Clear the tile's inventory items list before rebuilding it
    tile.inventoryItems = [];

    // Convert and add new items
    const validItems = itemsToSet.filter(Boolean);
    validItems.forEach(itemData => {
      let entity;
      // Check if it is already an ECS Entity instance
      if (itemData.components && typeof itemData.hasComponent === 'function') {
        entity = itemData;
      } else if (itemData.components) {
        // Serialized ECS Entity
        entity = Entity.fromJSON(itemData);
      } else {
        // Serialized legacy item or legacy Item instance
        entity = this.convertLegacyItemToECS(itemData);
      }

      if (entity) {
        // Ensure it has Position component and matching coordinate fields
        let pos = entity.getComponent('Position');
        if (!pos) {
          pos = new Position({ x, y, level: 0 });
          entity.addComponent(pos);
        } else {
          pos.x = x;
          pos.y = y;
        }
        entity.logicalX = x;
        entity.logicalY = y;
        entity.gridX = x;
        entity.gridY = y;
        entity.renderX = x;
        entity.renderY = y;
        entity.x = x;
        entity.y = y;

        this.addEntity(entity, x, y);
      }
    });

    // Update crop metadata based on new items
    this.updateCropMetadata(x, y);
  }

  /**
   * Determine the visual subtype (icon) for items on the ground
   * @private
   */
  _getGroundProxyInfo(items) {
    if (!items || items.length === 0) return { subtype: 'ground_pile', renderFullTile: false };

    const getDefId = (item) => (item.defId || (item.toJSON && item.toJSON().defId) || (item.id));

    // Priority ordered list of special icons (Legacy overrides)
    const checks = [
      { defId: 'placeable.campfire', subtype: 'campfire' },
      { defId: 'provision.hole', subtype: 'hole' },
      { defId: 'tool.snare_deployed', subtype: 'deployedsnare' },
      { defId: 'placeable.bed', subtype: 'bed' }
    ];

    for (const check of checks) {
      if (items.some(item => getDefId(item) === check.defId)) {
        return { subtype: check.subtype, renderFullTile: true };
      }
    }

    // PHASE 25: Generic full-tile item icon detection
    // If any item on this tile is marked as renderFullTile, use its imageId as the subtype
    const fullTileItem = items.find(item => {
      const defId = getDefId(item);
      const def = ItemDefs[defId];
      return def?.renderFullTile || item.renderFullTile;
    });

    if (fullTileItem) {
      const defId = getDefId(fullTileItem);
      const def = ItemDefs[defId];
      const subtype = fullTileItem.imageId || def?.imageId || defId;
      return { subtype, renderFullTile: true };
    }

    return { subtype: 'ground_pile', renderFullTile: false };
  }

  /**
   * Update crop growth metadata for a specific tile
   * Calculates the shortest time remaining until any plant on the tile is ready to harvest
   * @param {number} x - Tile X
   * @param {number} y - Tile Y
   */
  updateCropMetadata(x, y) {
    const tile = this.getTile(x, y);
    if (!tile) return;

    if (!tile.inventoryItems || tile.inventoryItems.length === 0) {
      tile.cropInfo = null;
      return;
    }

    let shortestTime = null;
    let hasWildCrop = false;

    // Inspect all items on the tile for plants
    tile.inventoryItems.forEach(item => {
      // Growing plants have lifetimeTurns and their defId ends in _plant
      if (item.lifetimeTurns !== undefined && item.lifetimeTurns !== null && item.defId?.endsWith('_plant')) {
        if (shortestTime === null || item.lifetimeTurns < shortestTime) {
          shortestTime = item.lifetimeTurns;
        }
      }
      
      // Wild crops are pre-harvestable items with isWild flag
      if (item.isWild) {
        hasWildCrop = true;
        
        // Wild crops are stationary and always ready
        if (shortestTime === null || 0 < shortestTime) {
          shortestTime = 0;
        }
      }
    });

    if (shortestTime !== null) {
      // Preserve existing discovery state if recalculating
      const wasDiscovered = tile.cropInfo?.discovered || false;
      
      // Discovery occurs if player is on the tile OR was already discovered
      const isPlayerHere = tile.contents.some(e => e.type === EntityType.PLAYER);
      const isDiscovered = wasDiscovered || isPlayerHere;

      tile.cropInfo = { 
        shortestTime,
        isWild: hasWildCrop,
        discovered: isDiscovered
      };
    } else {
      tile.cropInfo = null;
    }
  }

  /**
   * Add inventory items to a specific tile (appending to existing items)
   * @param {number} x - Tile X
   * @param {number} y - Tile Y
   * @param {Array} items - Array of Item instances
   */
  addItemsToTile(x, y, items) {
    const tile = this.getTile(x, y);
    if (!tile) return;

    const existingItems = this.getItemsOnTile(x, y);
    this.setItemsOnTile(x, y, [...existingItems, ...items]);
  }

  /**
   * Get items from a specific tile and remove them from tile contents (keeping them in entityMap)
   * @param {number} x - Tile X
   * @param {number} y - Tile Y
   * @returns {Array} - Array of item entities
   */
  getItemsFromTile(x, y) {
    const tile = this.getTile(x, y);
    if (!tile) return [];

    const items = tile.contents.filter(e => e.type === 'item' && e.hasComponent && e.hasComponent('Item'));
    items.forEach(item => {
      this.removeEntity(item.id);
    });

    return items;
  }

  setTerrain(x, y, terrain) {
    const tile = this.getTile(x, y);
    if (tile) {
      tile.terrain = terrain;
      this.clearShelteredCache();
      // Initialize water resource levels for new water tiles
      if (terrain === 'water') {
        tile.waterAmount = 100;
      } else {
        tile.waterAmount = 0;
      }

      if (terrain === 'transition') {
        const hasExit = tile.inventoryItems?.some(i => i.defId === 'placeable.exit');
        if (!hasExit) {
          const exitDef = createItemFromDef('placeable.exit');
          if (exitDef) {
            const exitItem = new Item(exitDef);
            exitItem.x = x;
            exitItem.y = y;
            if (!tile.inventoryItems) tile.inventoryItems = [];
            if (!tile.inventoryItems.some(i => i.defId === 'placeable.exit')) {
              tile.inventoryItems.push(exitItem);
              this.setItemsOnTile(x, y, tile.inventoryItems);
              console.debug(`[GameMap] Created placeable.exit on transition tile at (${x}, ${y})`);
            }
          }
        }
      } else {
        if (tile.inventoryItems) {
          const originalLength = tile.inventoryItems.length;
          tile.inventoryItems = tile.inventoryItems.filter(i => i.defId !== 'placeable.exit');
          if (tile.inventoryItems.length !== originalLength) {
            this.setItemsOnTile(x, y, tile.inventoryItems);
          }
        }
      }

      this.emit('terrainChanged', {
        position: { x, y },
        terrain,
        tile: { x: tile.x, y: tile.y, terrain: tile.terrain }
      });
    }
  }

  /**
   * Add entity to map at specific position
   */
  addEntity(entity, x, y) {
    const tile = this.getTile(x, y);
    if (tile) {
      // R8#3: duplicate ID — evict-then-add. The old behavior logged and then
      // overwrote entityMap, leaving the previous instance ghosted on its tile
      // and in the type index while entityMap pointed at the new one.
      if (this.entityMap.has(entity.id)) {
        const existingEntity = this.entityMap.get(entity.id);
        const sameInstance = existingEntity === entity;
        console.warn(
          `[GameMap] Duplicate entity ID "${entity.id}" (${entity.type}) at (${x}, ${y}) — ` +
          (sameInstance
            ? 'same instance re-added; moving it to the new position.'
            : `evicting previous ${existingEntity.type} instance at (${existingEntity.x}, ${existingEntity.y}).`)
        );
        if (entity.type === EntityType.PLAYER && !sameInstance) {
          console.error('[GameMap] 🚨 DUPLICATE PLAYER instance evicted — this indicates multiple initialization managers are running!');
        }

        // Quiet detach: deliberately no ENTITY_REMOVED / ZOMBIE_DIED events
        // for an anomalous duplicate — those would corrupt kill counters and
        // listener state. Just free the tile and the type index.
        const tx = existingEntity.logicalX !== undefined ? existingEntity.logicalX : (existingEntity.gridX !== undefined ? existingEntity.gridX : existingEntity.x);
        const ty = existingEntity.logicalY !== undefined ? existingEntity.logicalY : (existingEntity.gridY !== undefined ? existingEntity.gridY : existingEntity.y);
        const oldTile = this.getTile(tx, ty);
        if (oldTile) oldTile.removeEntity(existingEntity.id);
        this._unindexEntityByType(existingEntity);
        existingEntity.gameMap = null;
      }

      this.entityMap.set(entity.id, entity);
      this._indexEntityByType(entity);
      entity.gameMap = this;

      // Force synchronization of coordinates to prevent 'ghosting' desyncs
      // Phase 28 Fix: Absolute guard against visual coordinate leakage during simulation
      if (!GameMap.isSimulating) {
        entity.x = x;
        entity.y = y;
      } else {
        console.log(`[GameMap] 🛡️ Simulation lock: Skipping visual snap for ${entity.id} in addEntity`);
      }
      
      tile.addEntity(entity);
      
      // Update crop metadata to handle wild crop discovery if player enters
      if (entity.type === EntityType.PLAYER) {
        this.updateCropMetadata(x, y);
      }

      console.log(`[GameMap] ✅ Entity added: ${entity.id} (${entity.type}) at (${x}, ${y})`);
      if (entity.type === EntityType.PLAYER) {
        console.log(`[GameMap] 🎮 PLAYER ADDED TO MAP - Total players now: ${this.getEntitiesByType(EntityType.PLAYER).length}`);
      }

      this.emit('entityAdded', {
        entity: { id: entity.id, type: entity.type },
        position: { x, y }
      });

      return true;
    }
    return false;
  }

  /**
   * Remove entity from map
   */
  removeEntity(entityId) {
    const entity = this.entityMap.get(entityId);
    if (entity) {
      if (entity.type === 'zombie' && entity.hp <= 0) {
        GameEvents.emit(GAME_EVENT.ZOMBIE_DIED, { entity });
      }

      // Emit global event for decoupled systems
      GameEvents.emit(GAME_EVENT.ENTITY_REMOVED, {
        entity: { id: entity.id, type: entity.type },
        position: { x: entity.x, y: entity.y }
      });

      // PHASE 28 FIX: Always use logical coordinates to find the tile for removal.
      // Using visual coordinates (entity.x/y) can lead to 'ghost' entities on tiles
      // if the entity was removed while visually desynced (e.g. after sleep).
      const tx = entity.logicalX !== undefined ? entity.logicalX : (entity.gridX !== undefined ? entity.gridX : entity.x);
      const ty = entity.logicalY !== undefined ? entity.logicalY : (entity.gridY !== undefined ? entity.gridY : entity.y);
      
      const tile = this.getTile(tx, ty);
      if (tile) {
        tile.removeEntity(entityId);
      }
      this.entityMap.delete(entityId);
      this._unindexEntityByType(entity);
      entity.gameMap = null;

      this.emit('entityRemoved', {
        entity: { id: entity.id, type: entity.type },
        position: { x: entity.x, y: entity.y }
      });

      return entity;
    }
    return null;
  }

  /**
   * Calculate exploration percentage based on explored tiles
   */
  getExplorationPercentage() {
    let total = 0;
    let explored = 0;
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const tile = this.getTile(x, y);
        if (tile) {
          total++;
          if (tile.flags?.explored) {
            explored++;
          }
        }
      }
    }
    return total > 0 ? Math.round((explored / total) * 100) : 0;
  }

  /**
   * Move entity to new position
   */
  moveEntity(entityId, newX, newY, options = {}) {
    const entity = this.entityMap.get(entityId);
    const newTile = this.getTile(newX, newY);

    if (entity && newTile) {
      // Check base tile walkability
      if (!newTile.isWalkable(entity, options)) {
        console.warn(`[GameMap] moveEntity target tile (${newX}, ${newY}) is not walkable`);
        return false;
      }

      // Check edge wall collision if moving to an adjacent tile
      const oldX = entity.logicalX !== undefined ? entity.logicalX : entity.x;
      const oldY = entity.logicalY !== undefined ? entity.logicalY : entity.y;
      const dx = Math.abs(newX - oldX);
      const dy = Math.abs(newY - oldY);

      if (!options.skipEdgeCheck && dx <= 1 && dy <= 1 && (dx > 0 || dy > 0)) {
        if (dx === 0 || dy === 0) {
          if (Pathfinding.isEdgeBlocked(this, oldX, oldY, newX, newY, entity, options)) {
            console.warn(`[GameMap] moveEntity blocked by edge wall between (${oldX}, ${oldY}) and (${newX}, ${newY})`);
            return false;
          }
        } else {
          if (!Pathfinding.canMoveDiagonally(this, oldX, oldY, newX, newY, entity, options)) {
            log.warn(`moveEntity diagonal move blocked by edge walls between (${oldX}, ${oldY}) and (${newX}, ${newY})`);
            return false;
          }
        }
      }
      // Store old position for event
      const oldPosition = { 
        x: entity.logicalX !== undefined ? entity.logicalX : entity.x, 
        y: entity.logicalY !== undefined ? entity.logicalY : entity.y 
      };

      log.debug(`Moving entity ${entityId} from (${oldPosition.x}, ${oldPosition.y}) to (${newX}, ${newY})`);

      // Skip movement only if logically AND visually at target position, 
      // UNLESS a snap is explicitly requested and we aren't visually there yet.
      const isAtLogical = oldPosition.x === newX && oldPosition.y === newY;
      const isAtVisual = entity.x === newX && entity.y === newY;
      const snapRequested = options.snap !== false;

      if (isAtLogical && (isAtVisual || !snapRequested)) {
        log.debug(`Entity ${entityId} already at target position (${newX}, ${newY}), skipping move`);
        return true;
      }

      // Sanitize inputs to integers to prevent floating-point tile misses
      newX = Math.floor(newX);
      newY = Math.floor(newY);

      // Explicit remove from old tile
      const oldTile = this.getTile(oldPosition.x, oldPosition.y);
      if (oldTile) {
        oldTile.removeEntity(entityId);
      }

      // THEN update entity position via moveTo (updates gridX/Y)
      log.debug(`Updating logical position for entity ${entityId} to (${newX}, ${newY})`);
      
      const moveOptions = { ...options };
      
      if (typeof entity.moveTo === 'function') {
        entity.moveTo(newX, newY, moveOptions);
      } else {
        entity.gridX = newX;
        entity.gridY = newY;
        entity.logicalX = newX;
        entity.logicalY = newY;
        
        if (moveOptions.snap !== false) {
          entity.renderX = newX;
          entity.renderY = newY;
          entity.x = newX;
          entity.y = newY;
        }
      }

      // Finally add to new tile
      log.debug(`Adding entity ${entityId} to new tile (${newX}, ${newY})`);
      newTile.addEntity(entity);

      // Verify the move was successful
      const verifyTile = this.getTile(newX, newY);
      const entityFound = verifyTile.contents.find(e => e.id === entityId);
      if (!entityFound) {
        log.error(`Entity ${entityId} not found in new tile after move!`);
        return false;
      }

      this.emit('entityMoved', {
        entity: { id: entity.id, type: entity.type },
        oldPosition: oldPosition,
        newPosition: { x: newX, y: newY }
      });

      log.debug(`Entity ${entityId} movement completed successfully`);
      return true;
    } else {
      log.warn(`Movement failed for entity ${entityId}:`, {
        entityExists: !!entity,
        newTileExists: !!newTile,
        newTileWalkable: newTile ? newTile.isWalkable() : false
      });
    }
    return false;
  }



  /**
   * Get entity by ID
   * @param {string} entityId 
   * @returns {Entity|null}
   */
  getEntity(entityId) {
    return this.entityMap.get(entityId);
  }

  /**
   * Get all entities of a specific type. O(matching entities) via the type index.
   * Returns a fresh array, so callers may freely filter/sort/mutate the result.
   */
  getEntitiesByType(type) {
    const set = this.entitiesByType.get(type);
    return set ? Array.from(set) : [];
  }

  /** Add an entity to the by-type index. */
  _indexEntityByType(entity) {
    if (!entity || entity.type === undefined) return;
    let set = this.entitiesByType.get(entity.type);
    if (!set) {
      set = new Set();
      this.entitiesByType.set(entity.type, set);
    }
    set.add(entity);
  }

  /** Remove an entity from the by-type index. */
  _unindexEntityByType(entity) {
    if (!entity || entity.type === undefined) return;
    const set = this.entitiesByType.get(entity.type);
    if (set) set.delete(entity);
  }

  /**
   * Rebuild the by-type index from entityMap. Called after deserialization, where
   * entities are inserted directly into entityMap (bypassing addEntity).
   */
  rebuildEntityTypeIndex() {
    this.entitiesByType = new Map();
    for (const entity of this.entityMap.values()) {
      this._indexEntityByType(entity);
    }
  }

  /**
   * Process turn-based effects on the map (e.g. item expiration, snare catching)
   * @param {Player} player - Current player instance for distance checks
   * @param {boolean} isSleeping - Whether the player is currently sleeping
   */
  processTurn(player = null, isSleeping = false, turn = 1, playerCardinalPositions = [], lastSeenTaggedTiles = new Set()) {
    console.log('[GameMap] Processing turn-based effects...');
    this.clearShelteredCache();
    const actionQueue = [];
    
    // Decay scent trails
    ScentTrail.decayScents(this);

    
    // Phase 25: Environmental Conditions for Turn Processing
    const currentHour = getHourFromTurn(turn);
    const isDaylight = currentHour >= 6 && currentHour < 20;

    // Retrieve all items on the map
    const allItems = this.getEntitiesByType('item');
    
    // Group items by tile coordinate to process tile-wide effects (like power or snares)
    const itemsByTile = new Map();
    for (const item of allItems) {
      const x = item.logicalX !== undefined ? item.logicalX : item.x;
      const y = item.logicalY !== undefined ? item.logicalY : item.y;
      if (x === undefined || y === undefined) continue;
      
      const key = `${x},${y}`;
      if (!itemsByTile.has(key)) {
        itemsByTile.set(key, { x, y, items: [] });
      }
      itemsByTile.get(key).items.push(item);
    }

    for (const { x, y, items } of itemsByTile.values()) {
      const tile = this.getTile(x, y);
      if (!tile) continue;

      let itemsModified = false;

      // Determine if this tile is "outdoors"
      const isOutdoors = ['road', 'sidewalk', 'grass'].includes(tile.terrain);

      // --- SNARE CATCHING LOGIC ---
      const deployedSnareIndex = items.findIndex(item => item.defId === 'tool.snare_deployed');
      if (deployedSnareIndex !== -1 && tile.terrain === 'grass') {
        const deployedSnare = items[deployedSnareIndex];
        let catchChance = 0;

        if (isSleeping) {
          catchChance = 0.20;
        } else if (player) {
          const dx = x - player.x;
          const dy = y - player.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist >= 15 && dist <= 30) {
            catchChance = 0.10;
          } else if (dist > 30) {
            catchChance = 0.15;
          }
        }

        if (gameRandom.next() < catchChance) {
          console.log(`[GameMap] 🐰 Rabbit CAUGHT in snare at (${x}, ${y})!`);
          
          items.splice(deployedSnareIndex, 1);
          
          const currentCondition = deployedSnare.condition !== undefined ? deployedSnare.condition : 100;
          const newCondition = currentCondition - 25;
          
          if (newCondition > 0) {
            const undeployedSnare = createItemFromDef('tool.snare_undeployed');
            undeployedSnare.condition = newCondition;
            items.push(undeployedSnare);
          } else {
            console.log('[GameMap] Snare destroyed by rabbit catch (0 condition)');
          }

          const carcass = createItemFromDef('food.rabbit_carcass');
          items.push(carcass);

          itemsModified = true;
        }
      }

      // --- STANDARD EXPIRATION LOGIC ---
      const isTilePowered = items.some(it => it.traits?.includes(ItemTrait.POWER_SOURCE) && it.isOn);
      const remainingItems = items.filter(itemData => {
        const turnResult = this._processItemDataTurn(itemData, isTilePowered, isOutdoors, isDaylight);
        if (turnResult.expired) {
          itemsModified = true;
          console.log(`[GameMap] Item ${itemData.name} (${itemData.instanceId}) expired at (${x}, ${y})`);
          return false;
        }

        if (turnResult.modified) {
          itemsModified = true;
        }

        // NOTE: do NOT force itemsModified for every container/attachment item.
        // _processItemDataTurn already reports modified=true whenever a nested
        // item actually changed (drain, charge, spoil, expire), so an
        // unconditional flag here just forced a full setItemsOnTile rebuild of
        // the whole tile every single turn for any tile holding a backpack,
        // wagon, safe, or battery-powered tool — pure churn when nothing changed.

        return true;
      });

      if (itemsModified) {
        this.setItemsOnTile(x, y, remainingItems);
      } else {
        this.updateCropMetadata(x, y);
      }
    }

    // Zombie replenishment system check
    try {
      if (player) {
        ZombieReplenishmentSystem.processTurn(this, player, null, turn);
      }
    } catch (err) {
      console.error('[GameMap] Error in ZombieReplenishmentSystem:', err);
    }

    // Decay noise levels
    if (this.decayNoise) this.decayNoise();

    // Emit TURN_PROCESSING event for decoupled systems
    this.emit('TURN_PROCESSING', {
      player,
      isSleeping,
      turn,
      playerCardinalPositions,
      lastSeenTaggedTiles,
      actionQueue
    });



    return actionQueue;
  }

  /**
   * Transform an item-on-tile to its next growth/decay stage IN PLACE, preserving
   * its identity (instanceId/id, type, ECS components, position). Used for crop
   * growth (plant -> harvestable) during turn processing.
   *
   * The previous implementation deleted every own property and Object.assign'd raw
   * definition data over the entity. For ECS item entities that destroyed `type`,
   * `components` and rebound `id` to the defId, leaving a malformed entity in the
   * map (the "this.components is not iterable" save crash) and causing duplicate-id
   * collisions when setItemsOnTile rebuilt the tile. This mirrors Item.updateFromDef:
   * only definition-controlled fields are updated.
   *
   * @param {Object} itemData - Item entity (or plain item POJO) to mutate.
   * @param {string} nextDefId - Definition id to transform into.
   * @param {Object} def - The ItemDefs entry for nextDefId.
   */
  _transformItemInPlace(itemData, nextDefId, def) {
    itemData.defId = nextDefId;
    itemData.name = def.name || itemData.name;
    itemData.imageId = def.imageId || itemData.imageId;
    itemData.subtype = def.imageId || nextDefId.split('.').pop();
    if (def.width !== undefined) itemData.width = def.width;
    if (def.height !== undefined) itemData.height = def.height;
    itemData.renderFullTile = def.renderFullTile !== undefined ? def.renderFullTile : itemData.renderFullTile;
    itemData.traits = Array.isArray(def.traits) ? [...def.traits] : itemData.traits;
    itemData.categories = Array.isArray(def.categories) ? [...def.categories] : itemData.categories;

    // Growth / transform / produce state (next stage may clear these).
    itemData.lifetimeTurns = def.lifetimeTurns !== undefined ? def.lifetimeTurns : null;
    itemData.transformInto = def.transformInto !== undefined ? def.transformInto : null;
    itemData.produce = def.produce !== undefined ? def.produce : null;
    itemData.produceMin = def.produceMin;
    itemData.produceMax = def.produceMax;
    itemData.isCrop = !!((nextDefId.endsWith('_plant') || nextDefId.startsWith('provision.harvestable_')) || itemData.isWild || itemData.isHarvestable);

    // Keep ECS components in sync (only present on real entities, not nested POJOs).
    if (typeof itemData.getComponent === 'function') {
      const renderable = itemData.getComponent('Renderable');
      if (renderable) {
        renderable.spriteId = itemData.imageId || nextDefId.split('.').pop();
        if (def.backgroundColor) renderable.color = def.backgroundColor;
      }
      const itemComp = itemData.getComponent('Item');
      if (itemComp) itemComp.name = itemData.name;
    }
  }

  /**
   * Recursive helper to process turn effects on item POJOs (Plain Objects)
   * @param {Object} itemData - Item data object
   * @param {boolean} isPowered - Whether the item's location has power
   * @returns {Object} - result.expired, result.modified
   */
  _processItemDataTurn(itemData, isPowered = false, isOutdoors = false, isDaylight = true) {
    if (!itemData) return { expired: false, modified: false };

    let itemExpired = false;
    let itemModified = false;


    // --- POWER GENERATION (source / wired charger / solar) ---
    // Shared with InventoryManager's player-tile engine via TurnProcessingUtils.
    // Map-side items are never in the player's inventory, so isInPlayerInventory
    // is always false here; isPowered is threaded down from the tile/parent.
    if (TurnProcessingUtils.applyPowerGeneration(itemData, {
      isPowered,
      isOutdoors,
      isDaylight,
      isInPlayerInventory: false,
    })) {
      itemModified = true;
    }

    // --- HOTPLATE DRAINAGE LOGIC ---
    if (TurnProcessingUtils.processHotplateDrain(itemData)) {
      itemModified = true;
    }

    // --- AUTO TURRET DRAINAGE LOGIC ---
    if (TurnProcessingUtils.processAutoTurretDrain(itemData)) {
      itemModified = true;
    }

    // 1. Process own spoilage/lifetime
    const decay = TurnProcessingUtils.processDecay(itemData);
    if (decay.modified) itemModified = true;
    if (decay.expired) itemExpired = true;

    if (itemExpired) {
      if (itemData.transformInto) {
        const nextDefId = itemData.transformInto;
        const nextDef = ItemDefs[nextDefId];
        if (nextDef) {
          console.log(`[GameMap] Item ${itemData.name} (${itemData.instanceId}) transforming into ${nextDefId}`);
          // Mutate in place, preserving identity (instanceId/id, type, components,
          // position). See _transformItemInPlace for why the old gut-and-refill was
          // removed (malformed entities + duplicate ids).
          this._transformItemInPlace(itemData, nextDefId, nextDef);
          return { expired: false, modified: true };
        }
      }
      return { expired: true, modified: true };
    }

    // Determine if THIS item provides power to its contents (for nested recursion)
    // FIX: Also check if any sibling items inside this container provide power
    const providesInternalPower = isPowered || 
                                  (itemData.traits?.includes(ItemTrait.POWER_SOURCE) && itemData.isOn) ||
                                  (gridItems(itemData.containerGrid).some(it => it.traits?.includes(ItemTrait.POWER_SOURCE) && it.isOn));

    // --- RECURSION ---
    
    // Attachments
    if (itemData.attachments) {
      Object.keys(itemData.attachments).forEach(slotId => {
        const att = itemData.attachments[slotId];
        if (att) {
          const res = this._processItemDataTurn(att, providesInternalPower, isOutdoors, isDaylight);
          if (res.expired) {
            itemData.attachments[slotId] = null;
            itemModified = true;
          } else if (res.modified) {
            itemModified = true;
          }
        }
      });
    }

    // Container grid
    if (itemData.containerGrid && itemData.containerGrid.items) {
      if (itemData.containerGrid.items instanceof Map) {
        // Container instance
        const nestedItems = Array.from(itemData.containerGrid.items.values());
        for (const nested of nestedItems) {
          const res = this._processItemDataTurn(nested, providesInternalPower, isOutdoors, isDaylight);
          if (res.modified) itemModified = true;
          if (res.expired) {
            itemData.containerGrid.removeItem(nested.instanceId || nested.id);
            itemModified = true;
          }
        }
      } else {
        // Plain object array/Map POJO
        const itemsArray = Array.isArray(itemData.containerGrid.items) 
          ? itemData.containerGrid.items 
          : Object.values(itemData.containerGrid.items);
        const remainingNested = itemsArray.filter(nested => {
          const res = this._processItemDataTurn(nested, providesInternalPower, isOutdoors, isDaylight);
          if (res.modified) itemModified = true;
          return !res.expired;
        });
        if (remainingNested.length !== itemsArray.length) {
          if (Array.isArray(itemData.containerGrid.items)) {
            itemData.containerGrid.items = remainingNested;
          } else {
            const newItemsObj = {};
            remainingNested.forEach(nested => {
              const id = nested.instanceId || nested.id;
              newItemsObj[id] = nested;
            });
            itemData.containerGrid.items = newItemsObj;
          }
          itemModified = true;
        }
      }
    }

    // Pocket grids
    if (itemData.pocketGrids) {
      itemData.pocketGrids.forEach(pocket => {
        if (pocket && pocket.items) {
          if (pocket.items instanceof Map) {
            // Container instance
            const nestedItems = Array.from(pocket.items.values());
            for (const nested of nestedItems) {
              const res = this._processItemDataTurn(nested, providesInternalPower, isOutdoors, isDaylight);
              if (res.modified) itemModified = true;
              if (res.expired) {
                pocket.removeItem(nested.instanceId || nested.id);
                itemModified = true;
              }
            }
          } else {
            // Plain object
            const itemsArray = Array.isArray(pocket.items) 
              ? pocket.items 
              : Object.values(pocket.items);
            const remainingInPocket = itemsArray.filter(nested => {
              const res = this._processItemDataTurn(nested, providesInternalPower, isOutdoors, isDaylight);
              if (res.modified) itemModified = true;
              return !res.expired;
            });
            if (remainingInPocket.length !== itemsArray.length) {
              if (Array.isArray(pocket.items)) {
                pocket.items = remainingInPocket;
              } else {
                const newItemsObj = {};
                remainingInPocket.forEach(nested => {
                  const id = nested.instanceId || nested.id;
                  newItemsObj[id] = nested;
                });
                pocket.items = newItemsObj;
              }
              itemModified = true;
            }
          }
        }
      });
    }

    return { expired: false, modified: itemModified };
  }

  /**
   * Get all entities on the map
   */
  getAllEntities() {
    return Array.from(this.entityMap.values());
  }

  /**
   * Get the first walkable tile (used for player spawn)
   */
  getStartTile() {
    // Return the first walkable tile. Spawn positioning is owned by the
    // generators' getStartPosition(); this is only a generic fallback.
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const tile = this.getTile(x, y);
        if (tile && tile.isWalkable()) {
          return tile;
        }
      }
    }
    // Final fallback to first tile if no walkable tiles found
    return this.getTile(0, 0);
  }

  /**
   * Debug method to verify tile entity consistency
   */
  verifyTileStates() {
    console.log('[GameMap] Verifying tile states...');

    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const tile = this.getTile(x, y);
        if (tile.contents.length > 0) {
          console.log(`[GameMap] Tile (${x}, ${y}) contains:`, tile.contents.map(e => `${e.id}(${e.type}) at (${e.x}, ${e.y})`));

          // Verify entity positions match tile coordinates
          tile.contents.forEach(entity => {
            if (entity.x !== x || entity.y !== y) {
              console.error(`[GameMap] Position mismatch! Entity ${entity.id} at (${entity.x}, ${entity.y}) but on tile (${x}, ${y})`);
            }
          });
        }
      }
    }

    console.log('[GameMap] Entity map contains:', Array.from(this.entityMap.entries()).map(([id, entity]) => `${id} at (${entity.x}, ${entity.y})`));
  }

  /**
   * Process and decrement fire turns for all active fire tiles
   */
  processTileFires() {
    for (const fireKey of Array.from(this.activeFires)) {
      const [x, y] = fireKey.split(',').map(Number);
      const tile = this.getTile(x, y);
      if (tile && tile.fireTurns > 0) {
        tile.fireTurns--;
        if (tile.fireTurns <= 0) {
          this.activeFires.delete(fireKey);
        }
      } else {
        this.activeFires.delete(fireKey);
      }
    }
  }

  /**
   * Scan every entity (tile contents + entityMap) for a malformed `components`
   * field (anything that isn't a Map). Logs each offender once and self-heals
   * it so it can neither blank the render frame nor abort a save. Returns the
   * list of offenders found {id, type, kind} for diagnostics.
   *
   * See the long-standing "malformed entity" bug: a component-less entity has
   * thrown both in the render loop and in Entity.toJSON during save.
   */
  auditEntityComponents(context = 'audit') {
    const offenders = [];
    const inspect = (entity, where) => {
      if (!entity || entity.components instanceof Map) return;
      // Only care about ECS entities (those that use a components map).
      if (!('components' in entity)) return;
      const kind = Object.prototype.toString.call(entity.components);
      offenders.push({ id: entity.id, type: entity.type, where, kind });
      // Self-heal: preserve a plain-object map's contents, else start empty.
      if (entity.components && typeof entity.components === 'object') {
        entity.components = new Map(Object.entries(entity.components));
      } else {
        entity.components = new Map();
      }
    };

    if (Array.isArray(this.tiles)) {
      this.tiles.forEach(row => row && row.forEach(tile => {
        if (tile && tile.contents) tile.contents.forEach(e => inspect(e, 'tile'));
      }));
    }
    if (this.entityMap) {
      for (const entity of this.entityMap.values()) inspect(entity, 'entityMap');
    }

    if (offenders.length > 0) {
      console.warn(`[GameMap.auditEntityComponents:${context}] Found & healed ${offenders.length} entity(ies) with malformed components:`,
        offenders.map(o => `${o.type}#${o.id}(${o.where},${o.kind})`).join(', '));
    }
    return offenders;
  }

  /**
   * Serialize GameMap to JSON
   */
  toJSON() {
    // Defensive: heal any component-less entities before walking the tree so a
    // single bad entity can't abort the whole save (see Entity._serializeComponents).
    this.auditEntityComponents('toJSON');

    // Collect all entities in tile contents so we can identify detached ones
    const entitiesOnTiles = new Set();
    this.tiles.forEach(row => {
      row.forEach(tile => {
        if (tile && tile.contents) {
          tile.contents.forEach(entity => {
            entitiesOnTiles.add(entity.id);
          });
        }
      });
    });

    // Detached entities (items in inventories) are those in entityMap but not on any tile
    const detachedEntities = [];
    for (const [id, entity] of this.entityMap.entries()) {
      if (!entitiesOnTiles.has(id) && entity.type === 'item') {
        detachedEntities.push(typeof entity.toJSON === 'function' ? entity.toJSON() : entity);
      }
    }

    return {
      width: this.width,
      height: this.height,
      tiles: this.tiles.map(row =>
        row.map(tile => tile ? tile.toJSON() : null)
      ),
      detachedEntities,
      activeFires: Array.from(this.activeFires),
      scentSequenceCounter: this.scentSequenceCounter,
      buildings: this.buildings ? structuredClone(this.buildings) : [],
      // Clone so post-serialize gameplay can't mutate the pending save POJO
      // (T8 shared-reference sweep).
      furniture: this.furniture ? structuredClone(this.furniture) : [],
      lowSpots: this.lowSpots ? structuredClone(this.lowSpots) : [],
      mapNumber: this.mapNumber,
      template: this.template
    };
  }

  /**
   * Shared tile + entity restoration used by both fromJSON() and
   * fromJSONSelective(). Restores detached inventory entities, then every tile
   * and its contents (with the full entity-type switch), then legacy tile
   * inventory items. Header fields (buildings, crop metadata, etc.) remain the
   * responsibility of the calling method.
   * @param {GameMap} gameMap - Target map; header fields already populated.
   * @param {Object} data - Serialized map data.
   * @param {Object} [options]
   * @param {Array<string>} [options.excludeEntityTypes=[]] - Types to skip (e.g. ['player']).
   * @param {Array<string>|null} [options.includeEntityTypes=null] - If set, restore only these.
   */
  static async _restoreTilesAndEntities(gameMap, data, options = {}) {
    const { excludeEntityTypes = [], includeEntityTypes = null } = options;

    // Entity classes not already imported at module scope.
    const { TestEntity } = await import('../entities/TestEntity.js');
    const { Door } = await import('../entities/Door.js');
    const { Window } = await import('../entities/Window.js');
    const { PlaceIcon } = await import('../entities/PlaceIcon.js');
    const { Rabbit } = await import('../entities/Rabbit.js');
    const { GarageDoor } = await import('../entities/GarageDoor.js');

    // Sync an entity's coordinate fields + Position component to a tile.
    const syncEntityPosition = (entity, x, y) => {
      let pos = entity.getComponent('Position');
      if (!pos) {
        pos = new Position({ x, y, level: 0 });
        entity.addComponent(pos);
      }
      entity.logicalX = x;
      entity.logicalY = y;
      entity.gridX = x;
      entity.gridY = y;
      entity.renderX = x;
      entity.renderY = y;
      entity.x = x;
      entity.y = y;
    };

    // Restore detached entities first (items in inventories)
    if (data.detachedEntities) {
      for (const entityData of data.detachedEntities) {
        const entity = entityData.components
          ? Entity.fromJSON(entityData)
          : gameMap.convertLegacyItemToECS(entityData);
        if (entity) {
          gameMap.entityMap.set(entity.id, entity);
        }
      }
    }

    // Restore tiles and their contents
    for (let y = 0; y < data.height; y++) {
      for (let x = 0; x < data.width; x++) {
        const tileData = data.tiles[y][x];
        if (!tileData) continue;

        const tile = Tile.fromJSON(tileData);

        // Restore entities on this tile (with optional type filtering)
        if (tileData.contents) {
          for (const entityData of tileData.contents) {
            const entityType = entityData.type;

            if (excludeEntityTypes.includes(entityType)) continue;
            if (includeEntityTypes && !includeEntityTypes.includes(entityType)) continue;

            if (entityType === 'item' && (entityData.subtype === 'ground_pile' || entityData.isProxy)) {
              // Skip legacy ground proxies as items are now first-class ECS entities
              continue;
            }

            let entity;
            switch (entityType) {
              case 'player':
              case 'zombie':
              case 'npc':
                entity = Entity.fromJSON(entityData);
                break;
              case 'test':
                entity = TestEntity.fromJSON(entityData);
                break;
              case 'item':
                entity = entityData.components
                  ? Entity.fromJSON(entityData)
                  : gameMap.convertLegacyItemToECS(entityData);
                break;
              case 'door':
                entity = Door.fromJSON(entityData);
                break;
              case 'garage_door':
                entity = GarageDoor.fromJSON(entityData);
                break;
              case 'window':
                entity = Window.fromJSON(entityData);
                break;
              case 'place_icon':
                entity = PlaceIcon.fromJSON(entityData);
                break;
              case 'rabbit':
                entity = Rabbit.fromJSON(entityData);
                break;
              default:
                console.warn(`[GameMap] Unknown entity type during restoration: ${entityType}`);
                continue;
            }

            if (entity) {
              syncEntityPosition(entity, x, y);
              tile.addEntity(entity);
              gameMap.entityMap.set(entity.id, entity);
            }
          }
        }

        // Aggressive legacy migration of tile inventoryItems
        if (tileData.inventoryItems && tileData.inventoryItems.length > 0) {
          const rawLegacyItems = [...tileData.inventoryItems];
          tile.inventoryItems = []; // Clear it first so tile.addEntity can populate it without duplicates
          for (const itemData of rawLegacyItems) {
            // Skip if this item was already restored as an ECS entity from tile contents.
            // `_ref` is the id-only stub written by Tile.toJSON for items already
            // present in `contents` (see the double-serialization fix there).
            const entityId = itemData._ref || itemData.id || itemData.instanceId;
            if (entityId && gameMap.entityMap.has(entityId)) {
              const existingEntity = gameMap.entityMap.get(entityId);
              if (!tile.inventoryItems.includes(existingEntity)) {
                tile.inventoryItems.push(existingEntity);
              }
              continue;
            }
            // An id-only stub whose target wasn't in contents/entityMap is
            // unrecoverable — skip it rather than converting the bare {_ref} into
            // a malformed entity.
            if (itemData._ref) {
              console.warn(`[GameMap] inventoryItems _ref ${itemData._ref} at (${x}, ${y}) had no matching entity; dropping.`);
              continue;
            }
            const entity = gameMap.convertLegacyItemToECS(itemData);
            if (entity) {
              syncEntityPosition(entity, x, y);
              tile.addEntity(entity);
              gameMap.entityMap.set(entity.id, entity);
              console.log(`[GameMap] Migrated legacy inventory item ${itemData.name || itemData.id} to ECS entity at (${x}, ${y})`);
            }
          }
        }

        tile.gameMap = gameMap;
        gameMap.tiles[y][x] = tile;
      }
    }
  }

  /**
   * Create GameMap from JSON data with selective entity restoration
   * @param {Object} data - Serialized map data
   * @param {Object} options - Restoration options
   * @param {Array<string>} options.excludeEntityTypes - Entity types to exclude (e.g., ['player'])
   * @param {Array<string>} options.includeEntityTypes - Only include these entity types
   * @returns {Promise<GameMap>} - Restored GameMap instance
   */
  /**
   * Shared header-field restoration used by both fromJSON() and
   * fromJSONSelective(). Extracted so the two paths can't drift — the
   * selective path (used on EVERY map transition) previously skipped
   * buildings/specialBuildings and the crop metadata pass entirely, leaving
   * building-dependent logic running on an empty array (R8#2).
   * `??` so explicit falsy values from a save survive (T1 falsy-default sweep);
   * structuredClone so the live map never aliases the save POJO (T8 sweep).
   */
  static _restoreHeaderFields(gameMap, data) {
    gameMap.scentSequenceCounter = data.scentSequenceCounter ?? 0;
    gameMap.buildings = data.buildings ? structuredClone(data.buildings) : [];
    gameMap.furniture = data.furniture ? structuredClone(data.furniture) : [];
    gameMap.lowSpots = data.lowSpots ? structuredClone(data.lowSpots) : [];
    gameMap.mapNumber = data.mapNumber ?? 1;
    gameMap.template = data.template ?? 'road';
    gameMap.activeFires = new Set(data.activeFires ?? []);

    if (data.specialBuildings && gameMap.buildings.length === 0) {
      gameMap.buildings = structuredClone(data.specialBuildings);
    }
    gameMap.specialBuildings = gameMap.buildings;
  }

  /** Rebuild crop metadata for every tile (used by both restore paths). */
  static _restoreAllCropMetadata(gameMap) {
    for (let y = 0; y < gameMap.height; y++) {
      for (let x = 0; x < gameMap.width; x++) {
        gameMap.updateCropMetadata(x, y);
      }
    }
  }

  static async fromJSONSelective(data, options = {}) {
    const gameMap = new GameMap(data.width, data.height);
    GameMap._restoreHeaderFields(gameMap, data);

    const { excludeEntityTypes = [], includeEntityTypes = null } = options;
    console.log(`[GameMap] Selective restoration - excluding: [${excludeEntityTypes.join(', ')}], including: ${includeEntityTypes ? `[${includeEntityTypes.join(', ')}]` : 'all'}`);

    await GameMap._restoreTilesAndEntities(gameMap, data, options);

    GameMap._restoreAllCropMetadata(gameMap);

    console.log(`[GameMap] Selective restoration completed with ${gameMap.entityMap.size} entities`);
    gameMap.rebuildEntityTypeIndex();
    ScentTrail.rebuildIndex(gameMap);
    return gameMap;
  }

  static async fromJSON(data) {
    const gameMap = new GameMap(data.width, data.height);
    GameMap._restoreHeaderFields(gameMap, data);

    // Full restoration: no type filtering (restore every entity).
    await GameMap._restoreTilesAndEntities(gameMap, data);

    GameMap._restoreAllCropMetadata(gameMap);

    console.log('[GameMap] Restored from JSON with', gameMap.entityMap.size, 'entities');
    gameMap.rebuildEntityTypeIndex();
    ScentTrail.rebuildIndex(gameMap);
    return gameMap;
  }

  convertLegacyItemToECS(itemData) {
    if (!itemData) return null;

    // Create new ECS Entity - preserve instanceId if available
    const entityId = itemData.instanceId || null;
    const entity = new Entity(entityId, 'item');

    // Get item template fields
    const defId = itemData.defId || itemData.id;
    const name = itemData.name || (defId ? defId.split('.').pop() : 'Item');
    const description = itemData.description || '';

    // Determine weight
    let weight = itemData.weight;
    if (weight === undefined && defId && ItemDefs[defId]) {
      weight = ItemDefs[defId].weight;
    }
    if (weight === undefined) weight = 1;

    // Attach Item component
    entity.addComponent(new ECSItem({ name, weight, description }));

    // Determine renderable/sprite properties
    const spriteId = itemData.imageId || (defId ? defId.split('.').pop() : 'default');
    const color = itemData.backgroundColor || '#ffffff';
    
    // Attach Renderable component
    entity.addComponent(new Renderable({
      spriteId,
      color,
      backgroundColor: '#000000',
      zIndex: 0,
      isVisible: true
    }));

    // If it's a melee weapon, attach MeleeWeapon component
    if (defId && defId.startsWith('weapon.')) {
      let damage = 5;
      if (ItemDefs[defId]?.combat?.damage?.max) {
        damage = ItemDefs[defId].combat.damage.max;
      }
      entity.addComponent(new MeleeWeapon({ damage }));
    }

    // Set other properties for backwards compatibility with UI/renderer
    entity.defId = defId;
    entity.imageId = spriteId;
    entity.name = name;
    entity.subtype = defId ? defId.split('.').pop() : 'default';
    entity.condition = itemData.condition !== undefined ? itemData.condition : null;

    // Combat attributes (turrets). Entity exposes hp/maxHp/factionId as
    // getters/defaults (0 / null, not undefined), so the generic copy loop below
    // skips them. Transfer them explicitly so a deployed turret keeps its hp pool
    // (as a Health component) and its faction.
    if (itemData.maxHp !== undefined || itemData.hp !== undefined) {
      const max = itemData.maxHp !== undefined ? itemData.maxHp : itemData.hp;
      const current = itemData.hp !== undefined ? itemData.hp : max;
      entity.addComponent(new Health({ current, max }));
    }
    if (itemData.factionId !== undefined && itemData.factionId !== null) {
      entity.factionId = itemData.factionId;
    }
    if (itemData.hostileOverrides) {
      entity.hostileOverrides = itemData.hostileOverrides instanceof Set
        ? new Set(itemData.hostileOverrides)
        : new Set(Array.isArray(itemData.hostileOverrides) ? itemData.hostileOverrides : []);
    }

    // Copy all other fields from itemData to entity for backwards compatibility
    for (const [key, value] of Object.entries(itemData)) {
      if (key !== 'components' && key !== 'id' && entity[key] === undefined) {
        entity[key] = value;
      }
    }

    // Generate/ensure instanceId matches entity id
    entity.instanceId = entity.id;

    entity.precomputeItemFlags();

    return entity;
  }

  _chargeBatteries(chargerData) {
    if (!chargerData.containerGrid) return;
    TurnProcessingUtils.chargeBatteries(gridItems(chargerData.containerGrid));
  }
}