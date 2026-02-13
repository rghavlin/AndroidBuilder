/**
 * Individual tile logic with position, terrain, and contents
 * Tiles are the core building blocks - they know their state and emit events
 */
export class Tile {
  constructor(x, y, terrain = 'grass') {
    this.x = x;
    this.y = y;
    this.terrain = terrain; // 'grass', 'wall', 'floor', 'road', 'sidewalk', 'fence', 'building'
    this.contents = []; // Array of entities on this tile
    this.inventoryItems = []; // Array of serialized items on this tile
    this.listeners = new Map(); // Event listeners
    this.flags = {}; // Tile-specific flags (e.g., for fog of war)
  }

  /**
   * Add event listener for tile events
   */
  addEventListener(eventType, callback) {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, []);
    }
    this.listeners.get(eventType).push(callback);
  }

  /**
   * Emit events with context for React components
   */
  emit(eventType, data = {}) {
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

    if (this.listeners.has(eventType)) {
      this.listeners.get(eventType).forEach(callback => callback(eventData));
    }
  }

  /**
   * Check if tile is walkable based on terrain and contents
   */
  isWalkable() {
    // Buildings, walls, fences, and trees are never walkable
    if (this.terrain === 'wall' || this.terrain === 'fence' || this.terrain === 'building' || this.terrain === 'tree' || this.terrain === 'water') {
      return false;
    }

    // Transition tiles are walkable
    if (this.terrain === 'transition') {
      return true;
    }

    // Check if any entity blocks movement
    const blocked = this.contents.some(entity => entity.blocksMovement);

    return !blocked;
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
      console.log(`[Tile] Entity ${entity.id} added to tile (${this.x}, ${this.y}). Total entities:`, this.contents.length);
      // Note: Entity position should be set by the caller (GameMap.moveEntity)
      // to maintain single source of truth for entity coordinates
      this.emit('entityAdded', { entity: { id: entity.id, type: entity.type } });
    } else {
      console.warn(`[Tile] Entity ${entity.id} already exists on tile (${this.x}, ${this.y})`);
    }
  }

  /**
   * Remove entity from this tile
   */
  removeEntity(entityId) {
    const index = this.contents.findIndex(e => e.id === entityId);
    if (index !== -1) {
      const entity = this.contents.splice(index, 1)[0];
      console.log(`[Tile] Entity ${entityId} removed from tile (${this.x}, ${this.y}). Remaining entities:`, this.contents.length);
      this.emit('entityRemoved', { entity: { id: entity.id, type: entity.type } });
      return entity;
    } else {
      console.warn(`[Tile] Attempted to remove entity ${entityId} from tile (${this.x}, ${this.y}) but entity not found`);
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
        if (entity.type === 'item') {
          actions.push('pickup');
        }
        if (entity.type === 'zombie') {
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
    return {
      x: this.x,
      y: this.y,
      terrain: this.terrain,
      contents: this.contents.map(entity => entity.toJSON()),
      inventoryItems: this.inventoryItems, // items are already serialized
      flags: this.flags
    };
  }

  /**
   * Create Tile from JSON data
   */
  static fromJSON(data) {
    const tile = new Tile(data.x, data.y, data.terrain);
    tile.flags = data.flags || {};
    tile.inventoryItems = data.inventoryItems || [];
    // Note: contents are restored by GameMap.fromJSON
    return tile;
  }
}