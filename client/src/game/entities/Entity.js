import { SafeEventEmitter } from '../utils/SafeEventEmitter.js';

/**
 * Base Entity class for all game objects (players, zombies, items, etc.)
 * Provides common functionality like position, ID, and event handling
 */
export class Entity extends SafeEventEmitter {
  constructor(id, type, x = 0, y = 0) {
    super(); // Initialize EventEmitter
    this.id = id;
    this.type = type;
    this.x = x;
    this.y = y;
    this.blocksMovement = false; // Whether other entities can move through this one
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
   */
  moveTo(x, y) {
    const oldPosition = { x: this.x, y: this.y };
    this.x = x;
    this.y = y;

    this.emit('entityMoved', {
      oldPosition,
      newPosition: { x, y }
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
      blocksMovement: this.blocksMovement
    };
  }

  /**
   * Create entity from JSON data
   */
  static fromJSON(data) {
    const entity = new Entity(data.id, data.type, data.x, data.y);
    entity.blocksMovement = data.blocksMovement;
    return entity;
  }
}