
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
    _containerGridData = null,
    pocketGrids = null,
    _pocketGridsData = null
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

    // Container properties (single container for backpacks, etc.)
    this._containerGridData = _containerGridData || containerGrid;
    this.containerGrid = null;

    // Pocket grids (multiple containers for clothing)
    this._pocketGridsData = _pocketGridsData || pocketGrids;
    this.pocketGrids = [];

    // Initialize container grid synchronously if data exists
    if (this._containerGridData) {
      // Defer initialization to avoid circular import issues
      // Container will be created on first access via getContainerGrid()
      console.debug('[Item] Container initialization deferred (will be created on first access)', this.instanceId);
    }

    // Initialize pocket grids if data exists
    if (this._pocketGridsData && Array.isArray(this._pocketGridsData)) {
      console.debug('[Item] Pocket grids initialization deferred for', this.name, '- count:', this._pocketGridsData.length);
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
    // Skip rotation for square items (1×1, 2×2, etc.)
    if (this.width === this.height) {
      console.debug('[Item] Skipping rotation - item is square:', this.name, `${this.width}×${this.height}`);
      return false;
    }

    const oldRotation = this.rotation;
    
    // Smart rotation: toggle between landscape and portrait
    // Landscape items (width > height) rotate 90° clockwise
    // Portrait items (width < height) rotate 90° counter-clockwise
    const currentWidth = this.getActualWidth();
    const currentHeight = this.getActualHeight();
    const isLandscape = currentWidth > currentHeight;
    
    // Toggle rotation: landscape rotates clockwise, portrait rotates counter-clockwise
    const newRotation = isLandscape 
      ? (this.rotation + 90) % 360  // Clockwise
      : (this.rotation - 90 + 360) % 360;  // Counter-clockwise

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

  // Get pocket container IDs for clothing with multiple pockets
  getPocketContainerIds() {
    console.debug('[Item.getPocketContainerIds] Called for:', this.name);
    console.debug('[Item.getPocketContainerIds] - Current pocketGrids.length:', this.pocketGrids.length);
    console.debug('[Item.getPocketContainerIds] - Has _pocketGridsData:', !!this._pocketGridsData);
    
    // Initialize pocket grids if not yet initialized
    if (this.pocketGrids.length === 0 && this._pocketGridsData && Array.isArray(this._pocketGridsData)) {
      console.debug('[Item.getPocketContainerIds] Triggering initializePocketGrids()');
      this.initializePocketGrids();
    }
    
    // Return array of container IDs
    const ids = this.pocketGrids.map(pocket => pocket.id);
    console.debug('[Item.getPocketContainerIds] Returning IDs:', ids);
    return ids;
  }

  // Get all pocket containers
  getPocketContainers() {
    // Initialize pocket grids if not yet initialized
    if (this.pocketGrids.length === 0 && this._pocketGridsData && Array.isArray(this._pocketGridsData)) {
      this.initializePocketGrids();
    }
    
    return this.pocketGrids;
  }

  initializeContainerGrid() {
    // No-op if container already created successfully
    if (this.containerGrid) {
      return this.containerGrid;
    }
    
    // Can't initialize without data
    if (!this._containerGridData) {
      console.warn('[Item] No container data to initialize for:', this.name);
      return null;
    }
    
    // Use Container.fromJSON to properly restore the full container with items
    try {
      // Ensure Container class is available
      if (typeof Container === 'undefined') {
        console.error('[Item] Container class not available - circular import issue');
        return null;
      }
      
      console.debug('[Item] Initializing container for:', this.name, 'instanceId:', this.instanceId);
      console.debug('[Item] Container data:', this._containerGridData);
      
      // Ensure the container data has a stable ID based on item instanceId
      const containerData = {
        ...this._containerGridData,
        id: this._containerGridData.id || `${this.instanceId}-container`
      };
      
      this.containerGrid = Container.fromJSON(containerData);
      
      if (!this.containerGrid) {
        console.error('[Item] Container.fromJSON returned null/undefined');
        return null;
      }
      
      console.debug('[Item] ✅ Lazy-initialized container:', this.name, this.instanceId, 'ID:', this.containerGrid.id, 'with', this.containerGrid.items.size, 'items');
      
      return this.containerGrid;
    } catch (err) {
      console.error('[Item] Failed to initialize Container from data', this.instanceId, err);
      console.error('[Item] Container data was:', this._containerGridData);
      return null;
    }
  }

  initializePocketGrids() {
    // No-op if pockets already initialized
    if (this.pocketGrids.length > 0) {
      return this.pocketGrids;
    }
    
    // Can't initialize without data
    if (!this._pocketGridsData || !Array.isArray(this._pocketGridsData)) {
      console.warn('[Item] No pocket grids data to initialize for:', this.name);
      return [];
    }
    
    try {
      // Ensure Container class is available
      if (typeof Container === 'undefined') {
        console.error('[Item] Container class not available - circular import issue');
        return [];
      }
      
      console.debug('[Item] Initializing', this._pocketGridsData.length, 'pocket grids for:', this.name, 'instanceId:', this.instanceId);
      
      // Create a Container for each pocket grid definition
      this.pocketGrids = this._pocketGridsData.map((gridDef, index) => {
        // If gridDef already has full container data (from save), restore it
        if (gridDef.id && gridDef.items) {
          return Container.fromJSON(gridDef);
        }
        
        // Otherwise, create new container from definition
        const pocketId = `${this.instanceId}-pocket-${index + 1}`;
        const container = new Container({
          id: pocketId,
          type: 'dynamic-pocket',
          name: `${this.name} Pocket ${index + 1}`,
          width: gridDef.width || 1,
          height: gridDef.height || 1,
          autoExpand: false,
          autoSort: false
        });
        
        console.debug('[Item] Created pocket container:', pocketId, `${gridDef.width}x${gridDef.height}`);
        return container;
      });
      
      console.debug('[Item] ✅ Initialized', this.pocketGrids.length, 'pocket grids for:', this.name);
      
      return this.pocketGrids;
    } catch (err) {
      console.error('[Item] Failed to initialize pocket grids', this.instanceId, err);
      console.error('[Item] Pocket grids data was:', this._pocketGridsData);
      return [];
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

    if (this.pocketGrids.length > 0) {
      data.pocketGrids = this.pocketGrids.map(pocket => pocket.toJSON());
    }

    return data;
  }

  static fromJSON(data) {
    let containerGrid = null;
    if (data.containerGrid) {
      containerGrid = data.containerGrid;
    }

    let pocketGrids = null;
    if (data.pocketGrids && Array.isArray(data.pocketGrids)) {
      pocketGrids = data.pocketGrids;
    }

    const item = new Item({
      ...data,
      _containerGridData: containerGrid,
      containerGrid: null,
      _pocketGridsData: pocketGrids,
      pocketGrids: null
    });

    // Try to initialize container grid
    if (containerGrid) {
      try {
        item.containerGrid = Container.fromJSON(containerGrid);
      } catch (err) {
        item._containerGridData = containerGrid;
      }
    }

    // Try to initialize pocket grids
    if (pocketGrids) {
      try {
        item.initializePocketGrids();
      } catch (err) {
        item._pocketGridsData = pocketGrids;
      }
    }

    return item;
  }
}
