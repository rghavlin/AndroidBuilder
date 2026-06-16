import { Tile } from './Tile.js';
import { ItemDefs, createItemFromDef } from '../inventory/ItemDefs.js';
import { EquipmentSlot, ItemTrait, ItemCategory, Rarity } from '../inventory/traits.js';
import { TurnProcessingUtils } from '../utils/TurnProcessingUtils.js';
import { ScentTrail } from '../utils/ScentTrail.js';
import { Entity, EntityType } from '../entities/Entity.js';
import { Pathfinding } from '../utils/Pathfinding.js';
import GameEvents, { GAME_EVENT } from '../utils/GameEvents.js';
import { Item as ECSItem } from '../components/Item.js';
import { Renderable } from '../components/Renderable.js';
import { MeleeWeapon } from '../components/MeleeWeapon.js';
import { Position } from '../components/Position.js';
import Logger from '../utils/Logger.js';

const log = Logger.scope('GameMap');

/**
 * 20x20 map container with tile management and serialization
 */
export class GameMap {
  static isSimulating = false;

  constructor(width = 20, height = 20) {
    this.width = width;
    this.height = height;
    this.tiles = [];
    this.entityMap = new Map(); // Track all entities by ID
    this.listeners = new Map();
    this.scentSequenceCounter = 0;
    this.buildings = []; // Standardized building metadata
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

        // Set up tile event forwarding to map level
        tile.addEventListener('tileClicked', (data) => {
          this.emit('tileClicked', data);
        });

        tile.addEventListener('tileHovered', (data) => {
          this.emit('tileHovered', data);
        });

        row.push(tile);
      }
      this.tiles.push(row);
    }

    console.log(`[GameMap] Initialized ${this.width}x${this.height} map`);
  }

  /**
   * Add event listener for map events
   */
  addEventListener(eventType, callback) {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, []);
    }
    this.listeners.get(eventType).push(callback);
  }

  /**
   * Emit map events
   */
  emit(eventType, data = {}) {
    const eventData = {
      map: { width: this.width, height: this.height },
      timestamp: Date.now(),
      ...data
    };

    if (this.listeners.has(eventType)) {
      this.listeners.get(eventType).forEach(callback => callback(eventData));
    }
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
   * Static Utility: Check if a position is sheltered (inside a building)
   * @param {GameMap} gameMap - The map to check
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   * @returns {boolean}
   */
  static isSheltered(gameMap, x, y) {
    if (!gameMap) return false;

    const startTile = gameMap.getTile(x, y);
    // PHASE 15: Support tent_floor and transition (doorways) as sheltered terrain
    const isIndoorTerrain = startTile && (startTile.terrain === 'floor' || startTile.terrain === 'tent_floor');
    if (!isIndoorTerrain) return false;

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

        const isIndoors = tile.terrain === 'floor' || tile.terrain === 'tent_floor';
        if (!isIndoors || (tile.terrain === 'window' && !isClosedWindow)) {
          return false;
        }

        visited.add(key);
        queue.push(next);
      }
    }
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
    const isIndoors = (tile) => tile && (tile.terrain === 'floor' || tile.terrain === 'tent_floor' || tile.terrain === 'building' || tile.contents.some(e => e.type === EntityType.DOOR || e.type === EntityType.WINDOW));
    
    if (!isIndoors(startTile)) return false;

    const manhattanDist = Math.abs(posA.x - posB.x) + Math.abs(posA.y - posB.y);
    if (manhattanDist > 15) return false; 

    const queue = [{ x: posA.x, y: posA.y, dist: 0, closedDoors: 0 }];
    const visited = new Set([`${posA.x},${posA.y}`]);
    const maxDist = 30;

    while (queue.length > 0) {
      const { x, y, dist, closedDoors } = queue.shift();

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
        const entity = tile?.contents.find(e => e.type === EntityType.DOOR || e.type === EntityType.WINDOW);
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
            import('../inventory/Item.js').then(({ Item }) => {
              const exitItem = new Item(exitDef);
              exitItem.x = x;
              exitItem.y = y;
              if (!tile.inventoryItems) tile.inventoryItems = [];
              if (!tile.inventoryItems.some(i => i.defId === 'placeable.exit')) {
                tile.inventoryItems.push(exitItem);
                this.setItemsOnTile(x, y, tile.inventoryItems);
                console.debug(`[GameMap] Created placeable.exit on transition tile at (${x}, ${y})`);
              }
            }).catch(err => console.error('[GameMap] Failed to load Item for transition:', err));
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
      // Check for duplicate entity IDs
      if (this.entityMap.has(entity.id)) {
        const existingEntity = this.entityMap.get(entity.id);
        console.error(`[GameMap] 🚨 DUPLICATE ENTITY ID DETECTED: ${entity.id}`);
        console.error(`[GameMap] - Existing entity:`, `${existingEntity.id} at (${existingEntity.x}, ${existingEntity.y}), type: ${existingEntity.type}`);
        console.error(`[GameMap] - New entity:`, `${entity.id} at (${x}, ${y}), type: ${entity.type}`);
        console.error(`[GameMap] - Same instance?`, existingEntity === entity ? 'YES' : 'NO - DIFFERENT INSTANCES!');

        if (entity.type === EntityType.PLAYER) {
          console.error(`[GameMap] 🚨🚨🚨 DUPLICATE PLAYER BEING ADDED TO MAP!`);
          console.error(`[GameMap] - This indicates multiple initialization managers are running!`);
        }
      }

      this.entityMap.set(entity.id, entity);
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
   * Get all entities of a specific type
   */
  getEntitiesByType(type) {
    return Array.from(this.entityMap.values()).filter(entity => entity.type === type);
  }

  /**
   * Process turn-based effects on the map (e.g. item expiration, snare catching)
   * @param {Player} player - Current player instance for distance checks
   * @param {boolean} isSleeping - Whether the player is currently sleeping
   */
  processTurn(player = null, isSleeping = false, turn = 1, playerCardinalPositions = [], lastSeenTaggedTiles = new Set()) {
    console.log('[GameMap] Processing turn-based effects...');
    const actionQueue = [];
    
    // Decay scent trails
    ScentTrail.decayScents(this);

    
    // Phase 25: Environmental Conditions for Turn Processing
    const currentHour = (6 + (turn - 1)) % 24;
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

        if (Math.random() < catchChance) {
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

          const rawMeat = createItemFromDef('food.raw_meat');
          items.push(rawMeat);

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

        if (itemData.attachments || itemData.containerGrid || itemData.pocketGrids) {
          itemsModified = true;
        }

        return true;
      });

      if (itemsModified) {
        this.setItemsOnTile(x, y, remainingItems);
      } else {
        this.updateCropMetadata(x, y);
      }
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
   * Recursive helper to process turn effects on item POJOs (Plain Objects)
   * @param {Object} itemData - Item data object
   * @param {boolean} isPowered - Whether the item's location has power
   * @returns {Object} - result.expired, result.modified
   */
  _processItemDataTurn(itemData, isPowered = false, isOutdoors = false, isDaylight = true) {
    if (!itemData) return { expired: false, modified: false };

    let itemExpired = false;
    let itemModified = false;

    // Helper to get items array from a container grid/pocket
    const getGridItems = (grid) => {
      if (!grid || !grid.items) return [];
      if (grid.items instanceof Map) {
        return Array.from(grid.items.values());
      }
      if (Array.isArray(grid.items)) {
        return grid.items;
      }
      if (typeof grid.items === 'object' && grid.items !== null) {
        return Object.values(grid.items);
      }
      return [];
    };
    
    // --- POWER SOURCE LOGIC ---
    if (itemData.traits?.includes(ItemTrait.POWER_SOURCE) && itemData.isOn) {
      if (TurnProcessingUtils.processPowerSource(itemData)) {
        itemModified = true;
      }
    }

    // --- BATTERY CHARGER LOGIC ---
    if (itemData.defId === 'tool.battery_charger') {
      if (isPowered) {
        TurnProcessingUtils.chargeBatteries(getGridItems(itemData.containerGrid));
        itemModified = true;
      }
    }

    // --- SOLAR CHARGER LOGIC ---
    if (itemData.defId === 'tool.solar_charger') {
      if (isOutdoors && isDaylight) {
        TurnProcessingUtils.chargeBatteries(getGridItems(itemData.containerGrid));
        itemModified = true;
      }
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
          const instanceId = itemData.instanceId;
          const x = itemData.x;
          const y = itemData.y;
          const rotation = itemData.rotation;

          const newItemData = createItemFromDef(nextDefId);
          Object.keys(itemData).forEach(key => delete itemData[key]);
          Object.assign(itemData, newItemData);

          itemData.instanceId = instanceId;
          itemData.x = x;
          itemData.y = y;
          itemData.rotation = rotation;

          return { expired: false, modified: true };
        }
      }
      return { expired: true, modified: true };
    }

    // Determine if THIS item provides power to its contents (for nested recursion)
    // FIX: Also check if any sibling items inside this container provide power
    const providesInternalPower = isPowered || 
                                  (itemData.traits?.includes(ItemTrait.POWER_SOURCE) && itemData.isOn) ||
                                  (getGridItems(itemData.containerGrid).some(it => it.traits?.includes(ItemTrait.POWER_SOURCE) && it.isOn));

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
    // Try to get the specific starting position (17,123) for the road map
    const startTile = this.getTile(17, 123);
    if (startTile && startTile.isWalkable()) {
      return startTile;
    }

    // Fallback to searching for walkable tiles
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
   * Serialize GameMap to JSON
   */
  toJSON() {
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
      buildings: this.buildings,
      lowSpots: this.lowSpots,
      mapNumber: this.mapNumber,
      template: this.template
    };
  }

  /**
   * Create GameMap from JSON data with selective entity restoration
   * @param {Object} data - Serialized map data
   * @param {Object} options - Restoration options
   * @param {Array<string>} options.excludeEntityTypes - Entity types to exclude (e.g., ['player'])
   * @param {Array<string>} options.includeEntityTypes - Only include these entity types
   * @returns {Promise<GameMap>} - Restored GameMap instance
   */
  static async fromJSONSelective(data, options = {}) {
    const gameMap = new GameMap(data.width, data.height);
    gameMap.scentSequenceCounter = data.scentSequenceCounter || 0;
    gameMap.lowSpots = data.lowSpots || [];
    gameMap.mapNumber = data.mapNumber || 1;
    gameMap.template = data.template || 'road';
    gameMap.activeFires = new Set(data.activeFires || []);
    const { excludeEntityTypes = [], includeEntityTypes = null } = options;

    // Import required classes
    const { Entity } = await import('../entities/Entity.js');
    const { TestEntity } = await import('../entities/TestEntity.js');
    const { Item } = await import('../inventory/Item.js');
    const { Door } = await import('../entities/Door.js');
    const { Window } = await import('../entities/Window.js');

    console.log(`[GameMap] Selective restoration - excluding: [${excludeEntityTypes.join(', ')}], including: ${includeEntityTypes ? `[${includeEntityTypes.join(', ')}]` : 'all'}`);

    // Restore detached entities first (items in inventories)
    if (data.detachedEntities) {
      for (const entityData of data.detachedEntities) {
        let entity;
        if (entityData.components) {
          entity = Entity.fromJSON(entityData);
        } else {
          entity = gameMap.convertLegacyItemToECS(entityData);
        }
        if (entity) {
          gameMap.entityMap.set(entity.id, entity);
        }
      }
    }

    // Restore tiles
    for (let y = 0; y < data.height; y++) {
      for (let x = 0; x < data.width; x++) {
        const tileData = data.tiles[y][x];
        if (tileData) {
          const tile = Tile.fromJSON(tileData);

          // Restore entities on this tile with filtering
          if (tileData.contents) {
            for (const entityData of tileData.contents) {
              const entityType = entityData.type;

              // Skip if entity type is excluded
              if (excludeEntityTypes.includes(entityType)) {
                console.log(`[GameMap] Skipping excluded entity type: ${entityType} (${entityData.id})`);
                continue;
              }

              // Skip if includeEntityTypes is specified and this type is not included
              if (includeEntityTypes && !includeEntityTypes.includes(entityType)) {
                console.log(`[GameMap] Skipping non-included entity type: ${entityType} (${entityData.id})`);
                continue;
              }

              let entity;
              if (entityType === 'item' && (entityData.subtype === 'ground_pile' || entityData.isProxy)) {
                // Skip legacy ground proxies as items are now first-class ECS entities
                continue;
              } else {
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
                    if (entityData.components) {
                      entity = Entity.fromJSON(entityData);
                    } else {
                      entity = gameMap.convertLegacyItemToECS(entityData);
                    }
                    break;
                  case 'door':
                    entity = Door.fromJSON(entityData);
                    break;
                  case 'window':
                    entity = Window.fromJSON(entityData);
                    break;
                  default:
                    console.warn(`[GameMap] Unknown entity type during selective restoration: ${entityType}`);
                    continue;
                }
              }

              if (entity) {
                // Ensure coordinate fields and position component sync up
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

                tile.addEntity(entity);
                gameMap.entityMap.set(entity.id, entity);
                console.log(`[GameMap] Restored entity: ${entity.id} (${entity.type}) at (${x}, ${y})`);
              }
            }
          }

          // Aggressive legacy migration of tile inventoryItems
          if (tileData.inventoryItems && tileData.inventoryItems.length > 0) {
            const rawLegacyItems = [...tileData.inventoryItems];
            tile.inventoryItems = []; // Clear it first so tile.addEntity can populate it without duplicates
            for (const itemData of rawLegacyItems) {
              // Skip if this item was already restored as an ECS entity from tile contents
              const entityId = itemData.id || itemData.instanceId;
              if (entityId && gameMap.entityMap.has(entityId)) {
                const existingEntity = gameMap.entityMap.get(entityId);
                if (!tile.inventoryItems.includes(existingEntity)) {
                  tile.inventoryItems.push(existingEntity);
                }
                continue;
              }
              const entity = gameMap.convertLegacyItemToECS(itemData);
              if (entity) {
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

                tile.addEntity(entity);
                gameMap.entityMap.set(entity.id, entity);
                console.log(`[GameMap] Migrated legacy inventory item ${itemData.name || itemData.id} to ECS entity at (${x}, ${y})`);
              }
            }
          }

          gameMap.tiles[y][x] = tile;
        }
      }
    }

    console.log(`[GameMap] Selective restoration completed with ${gameMap.entityMap.size} entities`);
    return gameMap;
  }

  static async fromJSON(data) {
    const gameMap = new GameMap(data.width, data.height);
    gameMap.scentSequenceCounter = data.scentSequenceCounter || 0;
    gameMap.buildings = data.buildings || [];
    gameMap.lowSpots = data.lowSpots || [];
    gameMap.mapNumber = data.mapNumber || 1;
    gameMap.template = data.template || 'road';
    gameMap.activeFires = new Set(data.activeFires || []);
    
    if (data.specialBuildings && gameMap.buildings.length === 0) {
      gameMap.buildings = data.specialBuildings;
    }
    gameMap.specialBuildings = gameMap.buildings;

    // Import required classes
    const { Tile } = await import('./Tile.js');
    const { Entity } = await import('../entities/Entity.js');
    const { TestEntity } = await import('../entities/TestEntity.js');
    const { Item } = await import('../inventory/Item.js');
    const { Door } = await import('../entities/Door.js');
    const { Window } = await import('../entities/Window.js');
    const { PlaceIcon } = await import('../entities/PlaceIcon.js');
    const { Rabbit } = await import('../entities/Rabbit.js');

    // Restore detached entities first (items in inventories)
    if (data.detachedEntities) {
      for (const entityData of data.detachedEntities) {
        let entity;
        if (entityData.components) {
          entity = Entity.fromJSON(entityData);
        } else {
          entity = gameMap.convertLegacyItemToECS(entityData);
        }
        if (entity) {
          gameMap.entityMap.set(entity.id, entity);
        }
      }
    }

    // Restore tiles
    for (let y = 0; y < data.height; y++) {
      for (let x = 0; x < data.width; x++) {
        const tileData = data.tiles[y][x];
        if (tileData) {
          const tile = Tile.fromJSON(tileData);

          // Restore entities on this tile
          if (tileData.contents) {
            for (const entityData of tileData.contents) {
              let entity;
              if (entityData.type === 'item' && (entityData.subtype === 'ground_pile' || entityData.isProxy)) {
                // Skip legacy ground proxies as items are now first-class ECS entities
                continue;
              } else {
                switch (entityData.type) {
                  case 'player':
                  case 'zombie':
                  case 'npc':
                    entity = Entity.fromJSON(entityData);
                    break;
                  case 'test':
                    entity = TestEntity.fromJSON(entityData);
                    break;
                  case 'item':
                    if (entityData.components) {
                      entity = Entity.fromJSON(entityData);
                    } else {
                      entity = gameMap.convertLegacyItemToECS(entityData);
                    }
                    break;
                  case 'door':
                    entity = Door.fromJSON(entityData);
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
                    console.warn(`[GameMap] Unknown entity type during restoration: ${entityData.type}`);
                    continue;
                }
              }

              if (entity) {
                // Ensure coordinate fields and position component sync up
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
              // Skip if this item was already restored as an ECS entity from tile contents
              const entityId = itemData.id || itemData.instanceId;
              if (entityId && gameMap.entityMap.has(entityId)) {
                const existingEntity = gameMap.entityMap.get(entityId);
                if (!tile.inventoryItems.includes(existingEntity)) {
                  tile.inventoryItems.push(existingEntity);
                }
                continue;
              }
              const entity = gameMap.convertLegacyItemToECS(itemData);
              if (entity) {
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

                tile.addEntity(entity);
                gameMap.entityMap.set(entity.id, entity);
                console.log(`[GameMap] Migrated legacy inventory item ${itemData.name || itemData.id} to ECS entity at (${x}, ${y})`);
              }
            }
          }

          gameMap.tiles[y][x] = tile;
        }
      }
    }

    // Restore crop metadata for all tiles
    for (let y = 0; y < gameMap.height; y++) {
      for (let x = 0; x < gameMap.width; x++) {
        gameMap.updateCropMetadata(x, y);
      }
    }

    console.log('[GameMap] Restored from JSON with', gameMap.entityMap.size, 'entities');
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

    // Copy all other fields from itemData to entity for backwards compatibility
    for (const [key, value] of Object.entries(itemData)) {
      if (key !== 'components' && key !== 'id' && entity[key] === undefined) {
        entity[key] = value;
      }
    }

    // Generate/ensure instanceId matches entity id
    entity.instanceId = entity.id;

    return entity;
  }

  _chargeBatteries(chargerData) {
    if (!chargerData.containerGrid) return;
    const items = chargerData.containerGrid.items instanceof Map 
      ? Array.from(chargerData.containerGrid.items.values()) 
      : (Array.isArray(chargerData.containerGrid.items) 
          ? chargerData.containerGrid.items 
          : Object.values(chargerData.containerGrid.items || {}));
    TurnProcessingUtils.chargeBatteries(items);
  }
}