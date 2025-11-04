
import { ItemTrait } from './traits.js';
import { Container } from './Container.js';

/**
 * Item Instance - Runtime item with state
 */
export class Item {
  constructor({
    instanceId,
    defId,
    id, // legacy support
    name = '',
    imageId = null,
    width = 1,
    height = 1,
    rotation = 0,
    x = 0,
    y = 0,
    traits = [],
    stackCount = 1,
    stackMax = 1,
    condition = null,
    equippableSlot = null,
    isEquipped = false,
    encumbranceTier = null,
    containerGrid = null,
    _containerGridData = null
  }) {
    // Core identity
    this.instanceId = instanceId || id || `item-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    this.defId = defId;
    this.name = name;
    this.imageId = imageId;
    
    console.debug('[Item] Created:', this.name, 'instanceId:', this.instanceId, 'at position:', `(${x}, ${y})`);

    // Grid properties
    this.width = width;
    this.height = height;
    this.rotation = rotation;
    this.x = x;
    this.y = y;

    // Traits
    this.traits = Array.isArray(traits) ? traits : [];

    // Stack properties (if stackable)
    this.stackCount = stackCount;
    this.stackMax = stackMax;

    // Condition (if degradable)
    this.condition = condition;

    // Equipment properties
    this.equippableSlot = equippableSlot;
    this.isEquipped = isEquipped;
    this.encumbranceTier = encumbranceTier;

    // Container properties
    this._containerGridData = _containerGridData || containerGrid;
    this.containerGrid = null;

    // Initialize container grid synchronously if data exists
    if (this._containerGridData) {
      // Defer initialization to avoid circular import issues
      // Container will be created on first access via getContainerGrid()
      console.debug('[Item] Container initialization deferred (will be created on first access)', this.instanceId);
    }

    // Container reference (not serialized)
    this._container = null;
  }

  // Trait checks
  hasTrait(trait) {
    return this.traits.includes(trait);
  }

  isStackable() {
    return this.hasTrait(ItemTrait.STACKABLE);
  }

  isDegradable() {
    return this.hasTrait(ItemTrait.DEGRADABLE);
  }

  isEquippable() {
    return this.hasTrait(ItemTrait.EQUIPPABLE);
  }

  isContainer() {
    return this.hasTrait(ItemTrait.CONTAINER);
  }

  isOpenableWhenNested() {
    return this.hasTrait(ItemTrait.OPENABLE_WHEN_NESTED);
  }

  // Rotation
  getActualWidth() {
    return (this.rotation === 90 || this.rotation === 270) ? this.height : this.width;
  }

  getActualHeight() {
    return (this.rotation === 90 || this.rotation === 270) ? this.width : this.height;
  }

  rotate(checkContainer = true) {
    const oldRotation = this.rotation;
    const newRotation = (this.rotation + 90) % 360;

    if (checkContainer && this._container) {
      this.rotation = newRotation;
      const width = this.getActualWidth();
      const height = this.getActualHeight();

      if (!this._container.isAreaFree(this.x, this.y, width, height, this.instanceId)) {
        this.rotation = oldRotation;
        return false;
      }

      this._container.removeItemFromGrid(this);
      this._container.placeItemAt(this, this.x, this.y);
    } else {
      this.rotation = newRotation;
    }

    return true;
  }

  // Stacking
  canStackWith(otherItem) {
    if (!this.isStackable() || !otherItem.isStackable()) {
      return false;
    }

    if (this.defId !== otherItem.defId) {
      return false;
    }

    if (this.stackCount >= this.stackMax) {
      return false;
    }

    return true;
  }

  getStackableAmount(otherItem) {
    if (!this.canStackWith(otherItem)) {
      return 0;
    }
    return Math.min(otherItem.stackCount, this.stackMax - this.stackCount);
  }

  stackWith(otherItem) {
    if (!this.canStackWith(otherItem)) {
      return false;
    }
    this.stackCount += otherItem.stackCount;
    return true;
  }

  splitStack(count) {
    if (!this.isStackable() || count >= this.stackCount || count <= 0) {
      return null;
    }

    const newItem = Item.fromJSON(this.toJSON());
    newItem.instanceId = `${this.instanceId}-split-${Date.now()}`;
    newItem.stackCount = count;
    this.stackCount -= count;

    return newItem;
  }

  // Container grid
  getContainerGrid() {
    // Return existing container if available
    if (this.containerGrid) {
      return this.containerGrid;
    }
    
    // Attempt lazy initialization if we have data but no container yet
    if (this._containerGridData) {
      return this.initializeContainerGrid();
    }
    
    return null;
  }

  initializeContainerGrid() {
    // No-op if container already created successfully
    if (this.containerGrid) {
      return this.containerGrid;
    }
    
    // Can't initialize without data
    if (!this._containerGridData) {
      return null;
    }
    
    // Use Container.fromJSON to properly restore the full container with items
    try {
      this.containerGrid = Container.fromJSON(this._containerGridData);
      
      console.debug('[Item] Lazy-initialized container:', this.name, this.instanceId, 'with', this.containerGrid.items.size, 'items');
      
      return this.containerGrid;
    } catch (err) {
      console.warn('[Item] Failed to initialize Container from data', this.instanceId, err);
      return null;
    }
  }

  // Serialization
  toJSON() {
    const data = {
      instanceId: this.instanceId,
      defId: this.defId,
      name: this.name,
      imageId: this.imageId,
      width: this.width,
      height: this.height,
      rotation: this.rotation,
      x: this.x,
      y: this.y,
      traits: this.traits,
      stackCount: this.stackCount,
      stackMax: this.stackMax,
      condition: this.condition,
      equippableSlot: this.equippableSlot,
      isEquipped: this.isEquipped,
      encumbranceTier: this.encumbranceTier
    };

    if (this.containerGrid) {
      data.containerGrid = this.containerGrid.toJSON();
    }

    return data;
  }

  static fromJSON(data) {
    let containerGrid = null;
    if (data.containerGrid) {
      containerGrid = data.containerGrid;
    }

    const item = new Item({
      ...data,
      _containerGridData: containerGrid,
      containerGrid: null
    });

    if (containerGrid) {
      try {
        item.containerGrid = Container.fromJSON(containerGrid);
      } catch (err) {
        item._containerGridData = containerGrid;
      }
    }

    return item;
  }
}
