/**
 * Tiles are the core building blocks - they know their state and emit events
 */
import { EntityType } from '../entities/Entity.js';
import { isTurretPassableBy, TURRET_DEF_ID } from '../ai/TurretCombat.js';
import { isTerrainWalkable } from './TerrainTypes.js';
import engine from '../GameEngine.js';


export class Tile {
  constructor(x, y, terrain = 'grass') {
    this.x = x;
    this.y = y;
    this.terrain = terrain; // 'grass', 'wall', 'floor', 'road', 'sidewalk', 'fence', 'building'
    this.contents = []; // Array of entities on this tile
    this.inventoryItems = []; // Array of serialized items on this tile
    this.flags = {}; // Tile-specific flags (e.g., for fog of war)
    this.scent = 0; // Current scent intensity (turns remaining)
    this.scentSequence = 0; // Global sequence number for trail following
    this.waterAmount = terrain === 'water' ? 100 : 0; // Units of water in this tile
    this.decoration = null; // Visual decoration (e.g. 'outdoordecor1')
    
    // Thin-walled structures (Option A edge-based collision)
    // Indicates if an unwalkable wall exists on the border of this tile
    this.edgeWalls = { n: false, e: false, s: false, w: false };
    this.fireTurns = 0;
  }

  /**
   * No-op event listener registration kept for potential third-party/test compatibility.
   */
  addEventListener(eventType, callback) {
    // Left empty since events are now bubbled directly to gameMap.
  }

  /**
   * Emit events directly on the parent gameMap to reduce per-tile event listener overhead.
   */
  emit(eventType, data = {}) {
    if (this.gameMap) {
      const eventData = {
        tile: { x: this.x, y: this.y, terrain: this.terrain },
        contents: this.contents.map(entity => ({
          id: entity.id,
          type: entity.type,
          position: { x: entity.x, y: entity.y }
        })),
        timestamp: Date.now(),
        ...data
      };
      this.gameMap.emit(eventType, eventData);
    }
  }

  /**
   * Check if tile is walkable based on terrain and contents
   */
  isWalkable(entity = null, options = {}) {
    // 1. Content Check (Dynamic obstacles) - Check entries first
    let hasEntry = false;
    
    // Determine if the entity is the player
    const isZombie = options.isZombie || (entity && entity.type === EntityType.ZOMBIE);
    const isNPC = entity && entity.type === EntityType.NPC;
    const isPlayer = !isZombie && !isNPC;

    // If the player is riding a golf cart, floor tiles are unwalkable
    if (isPlayer && this.terrain === 'floor') {
      if (engine && engine.riding && engine.riding.item && engine.riding.item.defId === 'vehicle.golf_cart') {
        return false;
      }
    }

    for (const item of this.contents) {
      if ((item.type === EntityType.DOOR || item.type === EntityType.GARAGE_DOOR) && item.isOpen) {
        hasEntry = true;
        break;
      }
      // ONLY allow window entries for non-player entities (zombies/NPCs).
      // A reinforced window stays blocked even when open/broken — the boards
      // must be destroyed first (R14#2).
      if (item.type === EntityType.WINDOW && (item.isOpen || item.isBroken) && !item.isReinforced && !isPlayer) {
        hasEntry = true;
        break;
      }
    }

    // 2. Terrain Check (Static obstacles) — single source: TERRAIN_PROPS (T2)
    if (!isTerrainWalkable(this.terrain) && !hasEntry) {
      // PATHFINDING EXCEPTION: Zombies can path "to" buildings to attack them
      // ONLY if the tile actually contains a door or window to breach.
      const hasBreachable = this.contents.some(e => e.type === EntityType.DOOR || e.type === EntityType.WINDOW || e.type === EntityType.GARAGE_DOOR);
      if (options.allowBreaching && (this.terrain === 'building' || this.terrain === 'wall') && hasBreachable) {
        // Fall through to content check
      } else {
        return false;
      }
    }

    // 3. Content Check (Full)
    for (const item of this.contents) {
      // Edge-based walls: doors and windows align to tile boundaries (edges) and should not block the entire tile.
      // Blocking is fully handled by Pathfinding.isEdgeBlocked.
      if ((item.type === EntityType.DOOR || item.type === EntityType.WINDOW || item.type === EntityType.GARAGE_DOOR) && item.edge !== undefined) continue;
      
      // Bypass for open/broken structures.
      // Reinforced windows stay blocked even when open/broken — the boards
      // must be destroyed first (R14#2).
      if ((item.type === EntityType.DOOR || item.type === EntityType.GARAGE_DOOR) && item.isOpen) continue;
      if (item.type === EntityType.WINDOW && (item.isOpen || item.isBroken) && !item.isReinforced && !isPlayer) continue;

      // Powered-on turrets block movement for everyone except their own faction
      // (the player can always step onto their own turret to retrieve it). Inert
      // turrets are walkable by all. This is dynamic, independent of blocksMovement.
      if (item.defId === TURRET_DEF_ID) {
        if (isTurretPassableBy(item, entity)) continue;
        // Same-tile safety: never block a mover already standing on this tile.
        if (entity && entity.logicalX === this.x && entity.logicalY === this.y) continue;
        return false;
      }

      if (item.blocksMovement) {

         // EXCEPTION: Same-tile safety
         if (entity && entity.logicalX === this.x && entity.logicalY === this.y) continue;
         
         // NEW: Check if this item is currently being dragged or ridden by the player
         if (options.draggedItemId && (item.instanceId === options.draggedItemId || item.id === options.draggedItemId)) {
             continue;
         }
         if (options.riddenItemId && (item.instanceId === options.riddenItemId || item.id === options.riddenItemId)) {
             continue;
         }

         // NEW: Check if we should ignore zombies (logjam prevention)
         if (options.ignoreZombies && item.type === EntityType.ZOMBIE) continue;
         
         return false;
      }
    }

    return true;
  }

  /**
   * Check if tile is unwalkable (inverse of isWalkable for cleaner API)
   */
  get unwalkable() {
    return !this.isWalkable();
  }

  /**
   * Add entity to this tile
   */
  addEntity(entity) {
    // Check if entity is already on this tile by ID
    const existingEntity = this.contents.find(e => e.id === entity.id);
    if (!existingEntity) {
      this.contents.push(entity);
      if (entity.type === 'item') {
        if (!this.inventoryItems) this.inventoryItems = [];
        if (!this.inventoryItems.some(i => i.id === entity.id || i.instanceId === entity.id)) {
          this.inventoryItems.push(entity);
        }
      }
      // console.log(`[Tile] Entity ${entity.id} added to tile (${this.x}, ${this.y}). Total entities:`, this.contents.length);
      // Note: Entity position should be set by the caller (GameMap.moveEntity)
      // to maintain single source of truth for entity coordinates
      this.emit('entityAdded', { entity: { id: entity.id, type: entity.type } });
    }

    // Diagnostic validation: Ensure coordinate symmetry
    const posX = entity.logicalX !== undefined ? entity.logicalX : entity.x;
    const posY = entity.logicalY !== undefined ? entity.logicalY : entity.y;
    
    if (posX !== undefined && posY !== undefined) {
      if (posX !== this.x || posY !== this.y) {
        console.error(`[Tile] ⚠️ Property Desync Detected! Adding entity ${entity.id} to tile (${this.x}, ${this.y}) but entity says it is at (${posX}, ${posY})`);
      }
    }
  }

  /**
   * Remove entity from this tile
   */
  removeEntity(entityId) {
    const index = this.contents.findIndex(e => e.id === entityId);
    if (index !== -1) {
      const entity = this.contents.splice(index, 1)[0];
      if (entity.type === 'item' && this.inventoryItems) {
        const itemIdx = this.inventoryItems.findIndex(i => i.id === entityId || i.instanceId === entityId);
        if (itemIdx !== -1) {
          this.inventoryItems.splice(itemIdx, 1);
        }
      }
      // console.log(`[Tile] Entity ${entityId} removed from tile (${this.x}, ${this.y}). Remaining entities:`, this.contents.length);
      this.emit('entityRemoved', { entity: { id: entity.id, type: entity.type } });
      return entity;
    }
    return null;
  }

  /**
   * Handle click events on this tile
   */
  handleClick(actionType = 'move') {
    console.log(`[Tile] Clicked on tile (${this.x}, ${this.y}) with action: ${actionType}`);
    this.emit('tileClicked', {
      action: actionType,
      walkable: this.isWalkable(),
      entityCount: this.contents.length
    });
  }

  /**
   * Handle hover events on this tile
   */
  handleHover(playerPosition) {
    // Calculate Manhattan distance for AP cost
    const apCost = Math.abs(this.x - playerPosition.x) + Math.abs(this.y - playerPosition.y);

    this.emit('tileHovered', {
      apCost,
      walkable: this.isWalkable(),
      entityCount: this.contents.length
    });
  }

  /**
   * Get actions available on this tile
   */
  getAvailableActions() {
    const actions = [];

    if (this.isWalkable()) {
      actions.push('move');
    }

    if (this.contents.length > 0) {
      actions.push('examine');
      // Add entity-specific actions
      this.contents.forEach(entity => {
        if (entity.type === EntityType.ITEM) {
          actions.push('pickup');
        }
        if (entity.type === EntityType.ZOMBIE) {
          actions.push('attack');
        }
      });
    }

    return actions;
  }

  /**
   * Serialize tile to JSON
   */
  toJSON() {
    // `inventoryItems` holds LIVE item entities that are also present in
    // `contents` (Tile.addEntity pushes to both). Serializing them in full here
    // would write every ground item twice, doubling the save footprint. Emit an
    // id reference for any item already in `contents` (the load path resolves it
    // via entityMap); still fully serialize any legacy item not in contents so it
    // can be migrated on load.
    const contentIds = new Set(this.contents.map(e => e.id));
    const inventoryItems = (this.inventoryItems || []).map(item => {
      const id = item.id || item.instanceId;
      if (id && contentIds.has(id)) return { _ref: id };
      return typeof item.toJSON === 'function' ? item.toJSON() : item;
    });
    return {
      x: this.x,
      y: this.y,
      terrain: this.terrain,
      contents: this.contents.map(entity => entity.toJSON()),
      inventoryItems,
      flags: this.flags,
      scent: this.scent,
      scentSequence: this.scentSequence,
      waterAmount: this.waterAmount,
      edgeWalls: this.edgeWalls,
      decoration: this.decoration,
      fireTurns: this.fireTurns
    };
  }

  /**
   * Create Tile from JSON data
   */
  static fromJSON(data) {
    const tile = new Tile(data.x, data.y, data.terrain);
    // `??` / `!== undefined` throughout: a saved 0/false/'' is legitimate state
    // and must not be replaced by the default (T1 falsy-default sweep).
    tile.flags = data.flags ?? {};
    tile.inventoryItems = data.inventoryItems ?? [];
    tile.scent = data.scent ?? 0;
    tile.scentSequence = data.scentSequence ?? 0;
    // waterAmount: an explicitly saved 0 (e.g. a drained water tile) must not
    // be refilled to the terrain default.
    tile.waterAmount = data.waterAmount !== undefined ? data.waterAmount : (data.terrain === 'water' ? 100 : 0);
    tile.edgeWalls = data.edgeWalls ?? { n: false, e: false, s: false, w: false };
    tile.decoration = data.decoration ?? null;
    tile.fireTurns = data.fireTurns ?? 0;
    // Note: contents are restored by GameMap.fromJSON
    return tile;
  }
}