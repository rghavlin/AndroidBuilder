import { Entity } from './Entity.js';

/**
 * Test Entity for debugging and testing line of sight
 */
export class TestEntity extends Entity {
  constructor(id, x = 0, y = 0, subtype = 'default') {
    super(id, 'test', x, y);
    this.subtype = subtype;
    this.blocksMovement = false;
    this.blocksSight = subtype === 'obstacle'; // Only obstacle subtype blocks sight
    this.description = `Test ${subtype} entity`;
  }

  /**
   * Serialize TestEntity to JSON
   */
  toJSON() {
    return {
      ...super.toJSON(),
      subtype: this.subtype,
      blocksSight: this.blocksSight,
      description: this.description
    };
  }

  /**
   * Create TestEntity from JSON data
   */
  static fromJSON(data) {
    const entity = new TestEntity(data.id, data.x, data.y, data.subtype);
    entity.blocksMovement = data.blocksMovement;
    entity.blocksSight = data.blocksSight || false;
    entity.description = data.description || '';
    return entity;
  }
}

/**
 * Item entity - represents collectible items
 */
export class Item extends Entity {
  constructor(id, x, y, subtype = 'generic') {
    super(id, 'item', x, y);
    this.subtype = subtype; // weapon, ammo, food, medicine, etc.
    this.blocksMovement = false; // Items don't block movement
    this.blocksSight = false; // Items don't block sight
  }

  /**
   * Serialize Item to JSON
   */
  toJSON() {
    return {
      ...super.toJSON(),
      subtype: this.subtype,
      blocksMovement: this.blocksMovement,
      blocksSight: this.blocksSight,
      name: this.name
    };
  }

  /**
   * Create Item from JSON data
   */
  static fromJSON(data) {
    const item = new Item(data.id, data.x, data.y, data.subtype);
    item.blocksMovement = data.blocksMovement;
    item.blocksSight = data.blocksSight;
    item.name = data.name || '';
    return item;
  }
}