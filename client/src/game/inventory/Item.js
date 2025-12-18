import { ItemTrait } from './traits.js';
import { Container } from './Container.js';
import { PocketLayouts } from './PocketLayouts.js';
import { ItemDefs } from './ItemDefs.js'; // Import definitions for lookup

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
    pocketLayoutId = null,
    pocketGrids = null, // For restoring from save
    _pocketGridsData = null // For restoring from save
  }) {
    // Core identity
    this.instanceId = instanceId || id || `item-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    this.defId = defId;
    this.name = name;
    this.imageId = imageId;

    // MIGRATION: Backfill pocketLayoutId from definition if missing
    if (!pocketLayoutId && this.defId && ItemDefs[this.defId]) {
      const def = ItemDefs[this.defId];
      if (def.pocketLayoutId) {
        pocketLayoutId = def.pocketLayoutId;
        // console.debug('[Item] Backfilled pocketLayoutId for legacy item:', this.name, pocketLayoutId);
      }
    }

    console.debug('[Item] Created:', this.name, 'pocketLayout:', pocketLayoutId);

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

    // Pocket properties
    this.pocketLayoutId = pocketLayoutId;
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
    // console.debug('[Item.getPocketContainerIds] Called for:', this.name); // Removed as per diff
    // console.debug('[Item.getPocketContainerIds] - Current pocketGrids.length:', this.pocketGrids.length); // Removed as per diff
    // console.debug('[Item.getPocketContainerIds] - Has _pocketGridsData:', !!this._pocketGridsData); // Removed as per diff

    const pockets = this.getPocketContainers();
    // console.debug('[Item.getPocketContainerIds] Returning IDs:', ids); // Removed as per diff
    return pockets.map(p => p.id);
  }

  // Get all pocket containers
  getPocketContainers() {
    if (this.pocketGrids.length === 0) {
      if (this.pocketLayoutId || (this._pocketGridsData && this._pocketGridsData.length > 0)) {
        this.initializePocketGrids();
      }
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
      // console.warn('[Item] No container data to initialize for:', this.name); // Removed as per diff
      return null;
    }

    // Use Container.fromJSON to properly restore the full container with items
    try {
      // Ensure Container class is available
      if (typeof Container === 'undefined') {
        // console.error('[Item] Container class not available - circular import issue'); // Removed as per diff
        return null;
      }

      // console.debug('[Item] Initializing container for:', this.name, 'instanceId:', this.instanceId); // Removed as per diff
      // console.debug('[Item] Container data:', this._containerGridData); // Removed as per diff

      // Ensure the container data has a stable ID based on item instanceId
      const containerData = {
        ...this._containerGridData,
        id: this._containerGridData.id || `${this.instanceId}-container`
      };

      this.containerGrid = Container.fromJSON(containerData);

      if (!this.containerGrid) {
        // console.error('[Item] Container.fromJSON returned null/undefined'); // Removed as per diff
        return null;
      }

      // console.debug('[Item] ✅ Lazy-initialized container:', this.name, this.instanceId, 'ID:', this.containerGrid.id, 'with', this.containerGrid.items.size, 'items'); // Removed as per diff

      return this.containerGrid;
    } catch (err) {
      console.error('[Item] Failed to initialize Container from data', this.instanceId, err);
      // console.error('[Item] Container data was:', this._containerGridData); // Removed as per diff
      return null;
    }
  }

  initializePocketGrids() {
    // Return existing if already initialized
    if (this.pocketGrids.length > 0) {
      return this.pocketGrids;
    }

    try {
      // DEBUG: Check for dependency issues
      if (typeof Container === 'undefined') {
        console.error('[Item] CRITICAL: Container class is undefined! Circular dependency suspected.');
        return [];
      } else {
        // console.debug('[Item] Container class is available.');
      }

      // Priority 1: Restore from saved data (if loading game)
      if (this._pocketGridsData && this._pocketGridsData.length > 0) {
        console.debug('[Item] Restoring pocket grids from save data for:', this.name);
        this.pocketGrids = this._pocketGridsData.map(gridDef => Container.fromJSON(gridDef));
        return this.pocketGrids;
      }

      // Priority 2: Create new from Layout
      if (this.pocketLayoutId) {
        console.debug('[Item] Attempting layout init:', this.pocketLayoutId);
        const layout = PocketLayouts[this.pocketLayoutId];
        if (!layout) {
          console.warn('[Item] Invalid pocket layout ID:', this.pocketLayoutId);
          return [];
        }

        console.debug('[Item] Initializing pockets from layout:', layout.name);

        this.pocketGrids = layout.pockets.map((pocketDef, index) => {
          const pocketId = `${this.instanceId}-pocket-${index + 1}`;
          return new Container({
            id: pocketId,
            type: 'dynamic-pocket',
            name: pocketDef.name, // Use the nice name from layout ("Front Left")
            width: pocketDef.width,
            height: pocketDef.height,
            autoExpand: false,
            autoSort: false,
            ownerId: this.instanceId
          });
        });

        return this.pocketGrids;
      }

      return [];
    } catch (err) {
      console.error('[Item] Failed to initialize pocket grids', err);
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
      // traits: this.traits, // Traits are now conditionally added
      stackCount: this.stackCount,
      stackMax: this.stackMax,
      condition: this.condition,
      equippableSlot: this.equippableSlot,
      isEquipped: this.isEquipped,
      encumbranceTier: this.encumbranceTier,
      pocketLayoutId: this.pocketLayoutId // Persist the layout ID
    };

    // Serialize Traits
    if (this.traits && this.traits.length > 0) {
      data.traits = this.traits;
    }

    // Serialize Container (Backpack)
    if (this.containerGrid) {
      data.containerGrid = this.containerGrid.toJSON();
    } else if (this._containerGridData) {
      data.containerGrid = this._containerGridData;
    }

    // Serialize Pockets
    // IMPORTANT: We must save the *state* of the pockets (items inside them)
    // We don't save the definition, just the container state
    if (this.pocketGrids.length > 0) {
      data.pocketGrids = this.pocketGrids.map(pocket => pocket.toJSON());
    } else if (this._pocketGridsData) {
      data.pocketGrids = this._pocketGridsData;
    }

    return data;
  }

  // Helper for static instantiation
  static fromJSON(data) {
    // If saving/loading, data.pocketGrids will contain the full container objects
    // We pass this as _pocketGridsData to the constructor
    // The constructor assigns it to _pocketGridsData
    // initializePocketGrids uses it to restore containers
    return new Item({
      ...data,
      _containerGridData: data.containerGrid,
      _pocketGridsData: data.pocketGrids
    });
  }


}
