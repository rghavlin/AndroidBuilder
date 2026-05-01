import { SafeEventEmitter } from '../utils/SafeEventEmitter.js';
import engine from '../GameEngine.js';

/**
 * Common entity types for the game
 */
export const EntityType = {
  PLAYER: 'player',
  ZOMBIE: 'zombie',
  DOOR: 'door',
  WINDOW: 'window',
  RABBIT: 'rabbit',
  ANIMAL: 'animal',
  ITEM: 'item',
  NPC: 'npc',
  PLACE_ICON: 'place_icon',
  STRUCTURE: 'structure' // Generic structure type if needed
};

/**
 * Base Entity class for all game objects (players, zombies, items, etc.)
 * Provides common functionality like position, ID, and event handling
 */
export class Entity extends SafeEventEmitter {
  constructor(id, type, x = 0, y = 0, subtype = null) {
    super(); // Initialize EventEmitter
    this.id = id;
    this.type = type;
    
    // Phase 28C: Dual-Coordinate System
    // gridX/gridY: Logical position in the world (used by AI and Pathfinding)
    this.gridX = x;
    this.gridY = y;
    
    // renderX/renderY: Visual position on the screen (used by the Renderer)
    this.renderX = x;
    this.renderY = y;
    
    // Legacy mapping (pointing to logical state for backward compatibility where needed)
    this.logicalX = x; 
    this.logicalY = y;
    
    this.subtype = subtype || null;
    this.blocksMovement = false; // Whether other entities can move through this one
  }

  // Getters for coordinates to enforce visual decoupling
  // MapCanvas and EntityRenderer read entity.x and entity.y
  // By returning renderX/renderY, we ensure they only see the animated position.
  get x() { return this.renderX; }
  set x(val) { this.renderX = val; }

  get y() { return this.renderY; }
  set y(val) { this.renderY = val; }

  /**
   * Play an action visually. Overridden by subclasses (Zombie, NPC).
   * @param {Object} action - The action to play
   * @returns {Promise} Resolves when the visual animation is complete
   */
  async playAction(action) {
    // Default implementation: just snap to final position
    if (action.type === 'MOVE' && action.data.to) {
      this.x = action.data.to.x;
      this.y = action.data.to.y;
    }
  }

  /**
   * Check if this entity is diagonally adjacent to a target position
   * @param {number} targetX 
   * @param {number} targetY 
   * @returns {boolean}
   */
  isDiagonalTo(targetX, targetY) {
    return Math.abs(this.logicalX - targetX) === 1 && Math.abs(this.logicalY - targetY) === 1;
  }

  /**
   * Add event listener (use EventEmitter's on method)
   */
  addEventListener(eventType, callback) {
    this.on(eventType, callback);
  }

  /**
   * Emit entity events with enhanced data
   */
  emitEvent(eventType, data = {}) {
    const eventData = {
      entity: {
        id: this.id,
        type: this.type,
        position: { x: this.x, y: this.y }
      },
      timestamp: Date.now(),
      ...data
    };

    this.emit(eventType, eventData);
  }

  /**
   * Move to new position (updates coordinates, doesn't handle tile management)
   * @param {number} x - Target X
   * @param {number} y - Target Y
   * @param {Object} options - { snap: boolean }
   */
  moveTo(x, y, options = {}) {
    const { snap = true } = options;
    const oldPosition = { x: this.gridX, y: this.gridY };
    
    // Always update logical position immediately
    this.gridX = x;
    this.gridY = y;
    this.logicalX = x;
    this.logicalY = y;

    // Only update render position if snapping is requested (usually outside of simulation)
    if (snap) {
      this.renderX = x;
      this.renderY = y;
    }

    this.emit('entityMoved', {
      oldPosition,
      newPosition: { x: this.gridX, y: this.gridY },
      visualPosition: { x: this.renderX, y: this.renderY }
    });
  }

  /**
   * Serialize entity to JSON
   */
  toJSON() {
    return {
      id: this.id,
      type: this.type,
      x: this.renderX,
      y: this.renderY,
      gridX: this.gridX,
      gridY: this.gridY,
      logicalX: this.logicalX,
      logicalY: this.logicalY,
      subtype: this.subtype,
      blocksMovement: this.blocksMovement
    };
  }

  /**
   * Create entity from JSON data
   */
  static fromJSON(data) {
    const entity = new Entity(data.id, data.type, data.x, data.y, data.subtype);
    entity.gridX = data.gridX !== undefined ? data.gridX : (data.logicalX !== undefined ? data.logicalX : data.x);
    entity.gridY = data.gridY !== undefined ? data.gridY : (data.logicalY !== undefined ? data.logicalY : data.y);
    entity.renderX = data.x;
    entity.renderY = data.y;
    entity.logicalX = entity.gridX;
    entity.logicalY = entity.gridY;
    entity.blocksMovement = data.blocksMovement;
    return entity;
  }
}