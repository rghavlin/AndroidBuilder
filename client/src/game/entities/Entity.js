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
    
    // Position for rendering
    this._x = x;
    this._y = y;
    
    // Phase: Turn-Based Serialization
    // logicalX/Y represent where the entity "is" in the game logic during turn simulation.
    // x/y represent the "visual" position currently being rendered.
    this.logicalX = x;
    this.logicalY = y;
    
    this.subtype = subtype || null;
    this.blocksMovement = false; // Whether other entities can move through this one

    // Phase 28B Fix: Absolute visual lock to prevent ghosting
    this.isVisualLocked = false; 
  }

  // Getters and Setters for coordinates to enforce phase-based guards
  get x() { return this._x; }
  set x(val) {
    if (this.isVisualLocked || (engine && engine.turnPhase === 'SIMULATING')) {
      return; // Absolute lock during simulation or explicit lock
    }
    this._x = val;
  }

  get y() { return this._y; }
  set y(val) {
    if (this.isVisualLocked || (engine && engine.turnPhase === 'SIMULATING')) {
      return; // Absolute lock during simulation or explicit lock
    }
    this._y = val;
  }

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
    const oldPosition = { x: this.logicalX, y: this.logicalY };
    
    this.logicalX = x;
    this.logicalY = y;

    // Phase 28 Fix: Absolute guard against visual coordinate leakage during simulation
    if (this.isVisualLocked || (engine && engine.turnPhase === 'SIMULATING')) {
      return;
    }

    if (snap) {
      this.x = x;
      this.y = y;
    }

    this.emit('entityMoved', {
      oldPosition,
      newPosition: { x: this.logicalX, y: this.logicalY },
      visualPosition: { x: this.x, y: this.y }
    });
  }

  /**
   * Serialize entity to JSON
   */
  toJSON() {
    return {
      id: this.id,
      type: this.type,
      x: this.x,
      y: this.y,
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
    entity.logicalX = data.logicalX !== undefined ? data.logicalX : data.x;
    entity.logicalY = data.logicalY !== undefined ? data.logicalY : data.y;
    entity.blocksMovement = data.blocksMovement;
    return entity;
  }
}