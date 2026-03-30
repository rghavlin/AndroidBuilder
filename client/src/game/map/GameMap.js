import { Tile } from './Tile.js';
import { ItemDefs, createItemFromDef } from '../inventory/ItemDefs.js';
import { ScentTrail } from '../utils/ScentTrail.js';

/**
 * 20x20 map container with tile management and serialization
 */
export class GameMap {
  constructor(width = 20, height = 20) {
    this.width = width;
    this.height = height;
    this.tiles = [];
    this.entityMap = new Map(); // Track all entities by ID
    this.listeners = new Map();
    this.scentSequenceCounter = 0;

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

    this.getEntitiesByType('zombie').forEach(zombie => {
      const dist = Math.sqrt(Math.pow(zombie.x - x, 2) + Math.pow(zombie.y - y, 2));
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

    this.emit('noiseEmitted', { x, y, radius, alertedCount });
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
   * Set inventory items on a specific tile and spawn a proxy entity
   * @param {number} x - Tile X
   * @param {number} y - Tile Y
   * @param {Array} items - Array of Item instances
   */
  setItemsOnTile(x, y, items) {
    const tile = this.getTile(x, y);
    if (!tile) return;

    // Filter out nulls/undefined and serialize
    const validItems = items.filter(Boolean);
    tile.inventoryItems = validItems.map(item => typeof item.toJSON === 'function' ? item.toJSON() : item);

    if (validItems.length > 0) {
      const proxyId = `ground-items-${x}-${y}`;

      // Check if there is a hole or campfire in the items to use a special icon
      const containsCampfire = validItems.some(item =>
        item.defId === 'placeable.campfire' ||
        (typeof item.toJSON === 'function' && item.defId === 'placeable.campfire')
      );
      const containsHole = validItems.some(item =>
        item.defId === 'provision.hole' ||
        (item.toJSON && item.toJSON().defId === 'provision.hole')
      );
      const containsCornPlant = validItems.some(item =>
        item.defId === 'provision.corn_plant' ||
        (item.toJSON && item.toJSON().defId === 'provision.corn_plant')
      );
      const containsHarvestableCorn = validItems.some(item =>
        item.defId === 'provision.harvestable_corn' ||
        (item.toJSON && item.toJSON().defId === 'provision.harvestable_corn')
      );

      let subtype = 'ground_pile';
      if (containsCampfire) subtype = 'campfire';
      else if (containsHole) subtype = 'hole';
      else if (containsCornPlant) subtype = 'cornplant';
      else if (containsHarvestableCorn) subtype = 'harvestablecorn';

      if (!this.entityMap.has(proxyId)) {
        // Create a proxy entity for visual representation
        const proxy = {
          id: proxyId,
          type: 'item',
          subtype,
          x,
          y,
          blocksMovement: false,
          blocksSight: false,
          toJSON: () => ({
            id: proxyId,
            type: 'item',
            subtype: containsCampfire ? 'campfire' : 'ground_pile',
            x,
            y,
            blocksMovement: false,
            blocksSight: false
          })
        };
        this.addEntity(proxy, x, y);
      } else {
        // Update existing proxy subtype in case items changed
        const proxy = this.entityMap.get(proxyId);
        if (proxy) {
          const containsCampfire = validItems.some(item =>
            item.defId === 'placeable.campfire' ||
            (item.toJSON && item.toJSON().defId === 'placeable.campfire')
          );
          const containsHole = validItems.some(item =>
            item.defId === 'provision.hole' ||
            (item.toJSON && item.toJSON().defId === 'provision.hole')
          );
          const containsCornPlant = validItems.some(item =>
            item.defId === 'provision.corn_plant' ||
            (item.toJSON && item.toJSON().defId === 'provision.corn_plant')
          );
          const containsHarvestableCorn = validItems.some(item =>
            item.defId === 'provision.harvestable_corn' ||
            (item.toJSON && item.toJSON().defId === 'provision.harvestable_corn')
          );

          if (containsCampfire) proxy.subtype = 'campfire';
          else if (containsHole) proxy.subtype = 'hole';
          else if (containsCornPlant) proxy.subtype = 'cornplant';
          else if (containsHarvestableCorn) proxy.subtype = 'harvestablecorn';
          else proxy.subtype = 'ground_pile';
        }
      }
    } else {
      // Clear proxy if no items left
      const proxyId = `ground-items-${x}-${y}`;
      if (this.entityMap.has(proxyId)) {
        this.removeEntity(proxyId);
      }
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

    const existingItems = tile.inventoryItems || [];
    this.setItemsOnTile(x, y, [...existingItems, ...items]);
  }

  /**
   * Get items from a specific tile and remove proxy entity
   * @param {number} x - Tile X
   * @param {number} y - Tile Y
   * @returns {Array} - Array of serialized item data
   */
  getItemsFromTile(x, y) {
    const tile = this.getTile(x, y);
    if (!tile) return [];

    const items = [...tile.inventoryItems];
    tile.inventoryItems = [];

    // Remove proxy entity
    const proxyId = `ground-items-${x}-${y}`;
    if (this.entityMap.has(proxyId)) {
      this.removeEntity(proxyId);
    }

    return items;
  }

  /**
   * Set terrain type for a tile
   */
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

        if (entity.type === 'player') {
          console.error(`[GameMap] 🚨🚨🚨 DUPLICATE PLAYER BEING ADDED TO MAP!`);
          console.error(`[GameMap] - This indicates multiple initialization managers are running!`);
        }
      }

      this.entityMap.set(entity.id, entity);
      tile.addEntity(entity);

      console.log(`[GameMap] ✅ Entity added: ${entity.id} (${entity.type}) at (${x}, ${y})`);
      if (entity.type === 'player') {
        console.log(`[GameMap] 🎮 PLAYER ADDED TO MAP - Total players now: ${this.getEntitiesByType('player').length}`);
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
      const tile = this.getTile(entity.x, entity.y);
      if (tile) {
        tile.removeEntity(entityId);
      }
      this.entityMap.delete(entityId);

      this.emit('entityRemoved', {
        entity: { id: entity.id, type: entity.type },
        position: { x: entity.x, y: entity.y }
      });

      return entity;
    }
    return null;
  }

  /**
   * Move entity to new position
   */
  moveEntity(entityId, newX, newY) {
    const entity = this.entityMap.get(entityId);
    const newTile = this.getTile(newX, newY);

    if (entity && newTile && newTile.isWalkable()) {
      // Store old position for event
      const oldPosition = { x: entity.x, y: entity.y };

      console.log(`[GameMap] Moving entity ${entityId} from (${oldPosition.x}, ${oldPosition.y}) to (${newX}, ${newY})`);

      // Skip movement if already at target position
      if (oldPosition.x === newX && oldPosition.y === newY) {
        console.log(`[GameMap] Entity ${entityId} already at target position (${newX}, ${newY}), skipping move`);
        return true;
      }

      // Remove from old tile FIRST (while entity still has old coordinates)
      const oldTile = this.getTile(entity.x, entity.y);
      if (oldTile) {
        console.log(`[GameMap] Removing entity ${entityId} from old tile (${oldTile.x}, ${oldTile.y})`);
        const removedEntity = oldTile.removeEntity(entityId);
        if (!removedEntity) {
          console.error(`[GameMap] Failed to remove entity ${entityId} from old tile`);
          return false; // Abort if removal failed
        }
      } else {
        console.warn(`[GameMap] No old tile found at (${entity.x}, ${entity.y})`);
      }

      // THEN update entity position via moveTo to trigger events
      console.log(`[GameMap] Updating position for entity ${entityId} to (${newX}, ${newY})`);
      if (typeof entity.moveTo === 'function') {
        entity.moveTo(newX, newY);
      } else {
        entity.x = newX;
        entity.y = newY;
      }

      // Finally add to new tile
      console.log(`[GameMap] Adding entity ${entityId} to new tile (${newX}, ${newY})`);
      newTile.addEntity(entity);

      // Verify the move was successful
      const verifyTile = this.getTile(newX, newY);
      const entityFound = verifyTile.contents.find(e => e.id === entityId);
      if (!entityFound) {
        console.error(`[GameMap] Entity ${entityId} not found in new tile after move!`);
        return false;
      }

      this.emit('entityMoved', {
        entity: { id: entity.id, type: entity.type },
        oldPosition: oldPosition,
        newPosition: { x: newX, y: newY }
      });

      console.log(`[GameMap] Entity ${entityId} movement completed successfully`);
      return true;
    } else {
      console.warn(`[GameMap] Movement failed for entity ${entityId}:`, {
        entityExists: !!entity,
        newTileExists: !!newTile,
        newTileWalkable: newTile ? newTile.isWalkable() : false
      });
    }
    return false;
  }



  /**
   * Get all entities of a specific type
   */
  getEntitiesByType(type) {
    return Array.from(this.entityMap.values()).filter(entity => entity.type === type);
  }

  /**
   * Process turn-based effects on the map (e.g. item expiration)
   */
  processTurn() {
    console.log('[GameMap] Processing turn-based effects...');
    
    // Decay scent trails
    ScentTrail.decayScents(this);

    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const tile = this.tiles[y][x];
        if (tile.inventoryItems && tile.inventoryItems.length > 0) {
          let itemsModified = false;

          // Use recursive helper to process each item and its contents
          const remainingItems = tile.inventoryItems.filter(itemData => {
            const wasModified = this._processItemDataTurn(itemData);
            if (wasModified) {
              itemsModified = true;
              // If _processItemDataTurn returns true, the root item itself expired
              console.log(`[GameMap] Item ${itemData.name} (${itemData.instanceId}) expired at (${x}, ${y})`);
              return false;
            }

            // Even if the root item didn't expire, some of its contents might have (recurse handles this inside)
            // We need a way to detect if INSIDE was modified to trigger setItemsOnTile
            // For now, we assume if it has recursion it might have changed.
            if (itemData.attachments || itemData.containerGrid || itemData.pocketGrids) {
              itemsModified = true;
            }

            return true;
          });

          if (itemsModified) {
            this.setItemsOnTile(x, y, remainingItems);
          }
        }
      }
    }
  }

  /**
   * Recursive helper to process turn effects on item POJOs (Plain Objects)
   * @param {Object} itemData - Item data object
   * @returns {boolean} - Whether the item itself has expired and should be removed
   */
  _processItemDataTurn(itemData) {
    if (!itemData) return false;

    let itemExpired = false;

    // 1. Process own spoilage/lifetime
    // We check both shelfLife and lifetimeTurns. 
    // shelfLife usually for food (spoilable), lifetimeTurns for things like campfires (vanishing).

    // Check shelfLife first
    if (itemData.shelfLife !== undefined && itemData.shelfLife !== null) {
      itemData.shelfLife -= 1;

      // Handle Expiration (Vanishing)
      const traits = itemData.traits || [];
      const isSpoilable = traits.includes('spoilable');

      // If it's NOT spoilable and reaches 0, it vanishes
      if (itemData.shelfLife <= 0 && !isSpoilable) {
        itemExpired = true;
      }
    }

    // Process lifetimeTurns (e.g. for campfires)
    if (itemData.lifetimeTurns !== undefined && itemData.lifetimeTurns !== null) {
      itemData.lifetimeTurns = Math.max(0, itemData.lifetimeTurns - 1);
      if (itemData.lifetimeTurns <= 0) {
        itemExpired = true;
      }
    }

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

          // Replace data contents with new definition
          const newItemData = createItemFromDef(nextDefId);
          Object.keys(itemData).forEach(key => delete itemData[key]);
          Object.assign(itemData, newItemData);

          // Restore identity and position
          itemData.instanceId = instanceId;
          itemData.x = x;
          itemData.y = y;
          itemData.rotation = rotation;

          return false; // Item transformed, do not remove
        }
      }
      return true;
    }

    // 2. Recurse into attachments
    if (itemData.attachments) {
      for (const slotId in itemData.attachments) {
        const attachmentExpired = this._processItemDataTurn(itemData.attachments[slotId]);
        if (attachmentExpired) {
          console.log(`[GameMap] Nested attachment ${itemData.attachments[slotId].name} expired inside ${itemData.name}`);
          delete itemData.attachments[slotId];
        }
      }
    }

    // 3. Recurse into container grid
    if (itemData.containerGrid && itemData.containerGrid.items) {
      const initialCount = itemData.containerGrid.items.length;
      itemData.containerGrid.items = itemData.containerGrid.items.filter(nestedItem => {
        const expired = this._processItemDataTurn(nestedItem);
        if (expired) {
          console.log(`[GameMap] Nested item ${nestedItem.name} expired inside ${itemData.name} container`);
        }
        return !expired;
      });
    }

    // 4. Recurse into pockets
    if (itemData.pocketGrids) {
      itemData.pocketGrids.forEach(pocket => {
        if (pocket.items) {
          pocket.items = pocket.items.filter(pocketItem => {
            const expired = this._processItemDataTurn(pocketItem);
            if (expired) {
              console.log(`[GameMap] Nested item ${pocketItem.name} expired inside ${itemData.name} pocket`);
            }
            return !expired;
          });
        }
      });
    }

    return false;
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
   * Serialize GameMap to JSON
   */
  toJSON() {
    return {
      width: this.width,
      height: this.height,
      tiles: this.tiles.map(row =>
        row.map(tile => tile ? tile.toJSON() : null)
      ),
      scentSequenceCounter: this.scentSequenceCounter
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
    const { excludeEntityTypes = [], includeEntityTypes = null } = options;

    // Import required classes
    const { Player } = await import('../entities/Player.js');
    const { Zombie } = await import('../entities/Zombie.js');
    const { TestEntity } = await import('../entities/TestEntity.js');
    const { Item } = await import('../inventory/Item.js');
    const { Door } = await import('../entities/Door.js');
    const { Window } = await import('../entities/Window.js');

    console.log(`[GameMap] Selective restoration - excluding: [${excludeEntityTypes.join(', ')}], including: ${includeEntityTypes ? `[${includeEntityTypes.join(', ')}]` : 'all'}`);

    // Restore tiles
    for (let y = 0; y < data.height; y++) {
      for (let x = 0; x < data.width; x++) {
        const tileData = data.tiles[y][x];
        if (tileData) {
          const tile = Tile.fromJSON(tileData);

          // Restore entities on this tile with filtering
          if (tileData.contents) {
            for (const entityData of tileData.contents) {
              // Apply entity type filtering
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
              if (entityType === 'item' && entityData.subtype === 'ground_pile') {
                entity = {
                  ...entityData,
                  toJSON: () => ({ ...entityData })
                };
              } else {
                switch (entityType) {
                  case 'player':
                    entity = Player.fromJSON(entityData);
                    break;
                  case 'zombie':
                    entity = Zombie.fromJSON(entityData);
                    break;
                  case 'test':
                    entity = TestEntity.fromJSON(entityData);
                    break;
                  case 'item':
                    entity = Item.fromJSON(entityData);
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
                tile.addEntity(entity);
                gameMap.entityMap.set(entity.id, entity);
                console.log(`[GameMap] Restored entity: ${entity.id} (${entity.type}) at (${x}, ${y})`);
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

  /**
   * Create GameMap from JSON data (full restoration for save/load)
   */
  static async fromJSON(data) {
    const gameMap = new GameMap(data.width, data.height);
    gameMap.scentSequenceCounter = data.scentSequenceCounter || 0;

    // Import required classes
    const { Tile } = await import('./Tile.js');
    const { Player } = await import('../entities/Player.js');
    const { Zombie } = await import('../entities/Zombie.js');
    const { TestEntity } = await import('../entities/TestEntity.js');
    const { Item } = await import('../inventory/Item.js');
    const { Door } = await import('../entities/Door.js');
    const { Window } = await import('../entities/Window.js');

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
              if (entityData.type === 'item' && entityData.subtype === 'ground_pile') {
                entity = {
                  ...entityData,
                  toJSON: () => ({ ...entityData })
                };
              } else {
                switch (entityData.type) {
                  case 'player':
                    entity = Player.fromJSON(entityData);
                    break;
                  case 'zombie':
                    entity = Zombie.fromJSON(entityData);
                    break;
                  case 'test':
                    entity = TestEntity.fromJSON(entityData);
                    break;
                  case 'item':
                    entity = Item.fromJSON(entityData);
                    break;
                  case 'door':
                    entity = Door.fromJSON(entityData);
                    break;
                  case 'window':
                    entity = Window.fromJSON(entityData);
                    break;
                  default:
                    console.warn(`[GameMap] Unknown entity type during restoration: ${entityData.type}`);
                    continue;
                }
              }

              if (entity) {
                tile.addEntity(entity);
                gameMap.entityMap.set(entity.id, entity);
              }
            }
          }

          gameMap.tiles[y][x] = tile;
        }
      }
    }

    console.log('[GameMap] Restored from JSON with', gameMap.entityMap.size, 'entities');
    return gameMap;
  }
}