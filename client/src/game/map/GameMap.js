import { Tile } from './Tile.js';
import { ItemDefs, createItemFromDef } from '../inventory/ItemDefs.js';
import { EquipmentSlot, ItemTrait, ItemCategory, Rarity } from '../inventory/traits.js';
import { TurnProcessingUtils } from '../utils/TurnProcessingUtils.js';
import { ScentTrail } from '../utils/ScentTrail.js';
import { EntityType } from '../entities/Entity.js';

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
    this.buildings = []; // Standardized building metadata
    this.lowSpots = []; // Phase 25: Designated tiles for water accumulation
    this.mapNumber = 1;

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
   * Get items on a tile without removing them (non-destructive)
   * @param {number} x - Tile X
   * @param {number} y - Tile Y
   * @returns {Array} - Array of item data
   */
  getItemsOnTile(x, y) {
    const tile = this.getTile(x, y);
    return tile ? (tile.inventoryItems || []) : [];
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
    
    // Update crop metadata based on new items
    this.updateCropMetadata(x, y);

    if (validItems.length > 0) {
      const proxyId = `ground-items-${x}-${y}`;
      const { subtype, renderFullTile } = this._getGroundProxyInfo(validItems);

      if (!this.entityMap.has(proxyId)) {
        // Create a proxy entity for visual representation
        const proxy = {
          id: proxyId,
          type: EntityType.ITEM,
          subtype,
          renderFullTile,
          x,
          y,
          blocksMovement: false,
          blocksSight: false,
          toJSON: () => ({
            id: proxyId,
            type: EntityType.ITEM,
            subtype,
            renderFullTile,
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
          proxy.subtype = subtype;
          proxy.renderFullTile = renderFullTile;
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

        if (entity.type === EntityType.PLAYER) {
          console.error(`[GameMap] 🚨🚨🚨 DUPLICATE PLAYER BEING ADDED TO MAP!`);
          console.error(`[GameMap] - This indicates multiple initialization managers are running!`);
        }
      }

      this.entityMap.set(entity.id, entity);
      
      // Force synchronization of coordinates to prevent 'ghosting' desyncs
      entity.x = x;
      entity.y = y;
      
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

    if (entity && newTile && newTile.isWalkable(entity)) {
      // Store old position for event
      const oldPosition = { x: entity.x, y: entity.y };

      console.log(`[GameMap] Moving entity ${entityId} from (${oldPosition.x}, ${oldPosition.y}) to (${newX}, ${newY})`);

      // Skip movement if already at target position
      if (oldPosition.x === newX && oldPosition.y === newY) {
        console.log(`[GameMap] Entity ${entityId} already at target position (${newX}, ${newY}), skipping move`);
        return true;
      }

      // Sanitize inputs to integers to prevent floating-point tile misses
      newX = Math.floor(newX);
      newY = Math.floor(newY);

      // Remove from old tile FIRST (while entity still has old coordinates)
      const oldTile = this.getTile(entity.x, entity.y);
      if (oldTile) {
        console.log(`[GameMap] Removing entity ${entityId} from old tile (${oldTile.x}, ${oldTile.y})`);
        const removedEntity = oldTile.removeEntity(entityId);
        if (!removedEntity) {
          console.warn(`[GameMap] ⚠️ Entity ${entityId} claimed to be at (${entity.x}, ${entity.y}) but was missing from that tile's contents. Proceeding with synchronization.`);
        }
      } else {
        console.warn(`[GameMap] No old tile found at (${entity.x}, ${entity.y}) during move. Force-syncing to new tile.`);
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
   * Process turn-based effects on the map (e.g. item expiration, snare catching)
   * @param {Player} player - Current player instance for distance checks
   * @param {boolean} isSleeping - Whether the player is currently sleeping
   */
  processTurn(player = null, isSleeping = false, turn = 1) {
    console.log('[GameMap] Processing turn-based effects...');
    
    // Decay scent trails
    ScentTrail.decayScents(this);

    // Phase 25: Environmental Conditions for Turn Processing
    const currentHour = (6 + (turn - 1)) % 24;
    const isDaylight = currentHour >= 6 && currentHour < 20;

    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const tile = this.getTile(x, y);
        if (tile && tile.inventoryItems && tile.inventoryItems.length > 0) {
          let itemsModified = false;

          // Determine if this tile is "outdoors"
          const isOutdoors = ['road', 'sidewalk', 'grass'].includes(tile.terrain);

          // --- SNARE CATCHING LOGIC ---
          // Check for deployed snares on grass tiles
          const deployedSnareIndex = tile.inventoryItems.findIndex(item => item.defId === 'tool.snare_deployed');
          if (deployedSnareIndex !== -1 && tile.terrain === 'grass') {
            const deployedSnare = tile.inventoryItems[deployedSnareIndex];
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
              
              // Remove deployed snare
              tile.inventoryItems.splice(deployedSnareIndex, 1);
              
              // Calculate new condition
              const currentCondition = deployedSnare.condition !== undefined ? deployedSnare.condition : 100;
              const newCondition = currentCondition - 25;
              
              // If snare still has life, return it to undeployed state
              if (newCondition > 0) {
                const undeployedSnare = createItemFromDef('tool.snare_undeployed');
                undeployedSnare.condition = newCondition;
                tile.inventoryItems.push(undeployedSnare);
              } else {
                console.log('[GameMap] Snare destroyed by rabbit catch (0 condition)');
              }

              // Always spawn raw meat
              const rawMeat = createItemFromDef('food.raw_meat');
              tile.inventoryItems.push(rawMeat);

              itemsModified = true;
            }
          }

          // --- STANDARD EXPIRATION LOGIC ---
          const isTilePowered = tile.inventoryItems.some(it => it.traits?.includes(ItemTrait.POWER_SOURCE) && it.isOn);
          const remainingItems = tile.inventoryItems.filter(itemData => {
            const turnResult = this._processItemDataTurn(itemData, isTilePowered, isOutdoors, isDaylight);
            if (turnResult.expired) {
              itemsModified = true;
              console.log(`[GameMap] Item ${itemData.name} (${itemData.instanceId}) expired at (${x}, ${y})`);
              return false;
            }

            if (turnResult.modified) {
              itemsModified = true;
            }

            // Even if the root item didn't expire, some of its contents might have
            if (itemData.attachments || itemData.containerGrid || itemData.pocketGrids) {
              itemsModified = true;
            }

            return true;
          });

          if (itemsModified) {
            this.setItemsOnTile(x, y, remainingItems);
          } else {
            // Even if items weren't added/removed, lifetimes changed, so update metadata
            this.updateCropMetadata(x, y);
          }
        }
      }
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
    
    // --- POWER SOURCE LOGIC ---
    if (itemData.traits?.includes(ItemTrait.POWER_SOURCE) && itemData.isOn) {
      if (TurnProcessingUtils.processPowerSource(itemData)) {
        itemModified = true;
      }
    }

    // --- BATTERY CHARGER LOGIC ---
    if (itemData.defId === 'tool.battery_charger') {
      if (isPowered) {
        TurnProcessingUtils.chargeBatteries(itemData.containerGrid?.items);
        itemModified = true;
      }
    }

    // --- SOLAR CHARGER LOGIC ---
    if (itemData.defId === 'tool.solar_charger') {
      if (isOutdoors && isDaylight) {
        TurnProcessingUtils.chargeBatteries(itemData.containerGrid?.items);
        itemModified = true;
      }
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
    const providesInternalPower = isPowered || (itemData.traits?.includes(ItemTrait.POWER_SOURCE) && itemData.isOn);

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
      const remainingNested = itemData.containerGrid.items.filter(nested => {
        const res = this._processItemDataTurn(nested, providesInternalPower, isOutdoors, isDaylight);
        if (res.modified) itemModified = true;
        return !res.expired;
      });
      if (remainingNested.length !== itemData.containerGrid.items.length) {
        itemData.containerGrid.items = remainingNested;
        itemModified = true;
      }
    }

    // Pocket grids
    if (itemData.pocketGrids) {
      itemData.pocketGrids.forEach(pocket => {
        if (pocket.items) {
          const remainingInPocket = pocket.items.filter(nested => {
            const res = this._processItemDataTurn(nested, providesInternalPower, isOutdoors, isDaylight);
            if (res.modified) itemModified = true;
            return !res.expired;
          });
          if (remainingInPocket.length !== pocket.items.length) {
            pocket.items = remainingInPocket;
            itemModified = true;
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
   * Serialize GameMap to JSON
   */
  toJSON() {
    return {
      width: this.width,
      height: this.height,
      tiles: this.tiles.map(row =>
        row.map(tile => tile ? tile.toJSON() : null)
      ),
      scentSequenceCounter: this.scentSequenceCounter,
      buildings: this.buildings,
      lowSpots: this.lowSpots
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
    gameMap.buildings = data.buildings || [];
    
    // Legacy support for specialBuildings (ensure it exists if systems still look for it)
    if (data.specialBuildings && gameMap.buildings.length === 0) {
      gameMap.buildings = data.specialBuildings;
    }
    gameMap.specialBuildings = gameMap.buildings;

    // Import required classes
    const { Tile } = await import('./Tile.js');
    const { Player } = await import('../entities/Player.js');
    const { Zombie } = await import('../entities/Zombie.js');
    const { TestEntity } = await import('../entities/TestEntity.js');
    const { Item } = await import('../inventory/Item.js');
    const { Door } = await import('../entities/Door.js');
    const { Window } = await import('../entities/Window.js');
    const { PlaceIcon } = await import('../entities/PlaceIcon.js');
    const { Rabbit } = await import('../entities/Rabbit.js');

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
                  type: 'item',
                  subtype: 'ground_pile',
                  toJSON: () => ({ ...entityData, type: 'item', subtype: 'ground_pile' })
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

  /**
   * Internal helper to charge batteries inside a charger POJO
   * @deprecated - Logic moved to TurnProcessingUtils.chargeBatteries
   */
  _chargeBatteries(chargerData) {
    if (!chargerData.containerGrid) return;
    TurnProcessingUtils.chargeBatteries(chargerData.containerGrid.items);
  }
}