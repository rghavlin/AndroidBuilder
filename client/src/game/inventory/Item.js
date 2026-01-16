import { ItemTrait, ItemCategory } from './traits.js';
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
    _pocketGridsData = null, // For restoring from save
    categories = [],
    attachments = null,
    capacity = null,
    ammoCount = 0
  }) {
    // Core identity - MUST be unique per item instance
    const uniqueSuffix = Math.random().toString(36).substring(2, 9);
    const timestamp = Date.now();
    this.instanceId = instanceId || `item-${timestamp}-${uniqueSuffix}`;
    this.defId = defId;
    this.name = name;
    this.imageId = imageId;

    // Diagnostic branding for debugging
    this._creationTime = timestamp;
    this._uniqueKey = uniqueSuffix;

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
    this.capacity = capacity; // Initialize capacity here
    this.ammoCount = ammoCount;

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
    this.categories = Array.isArray(categories) ? categories : [];

    // Weapon Attachment properties
    this.attachmentSlots = null;
    this.attachments = attachments || {}; // Store attached Item instances by slotId

    // MIGRATION / INITIALIZATION: Load attachment slots from definition
    if (this.defId && ItemDefs[this.defId]?.attachmentSlots) {
      this.attachmentSlots = ItemDefs[this.defId].attachmentSlots;
    }

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

    // Compatibility property for legacy logic
    this.stackable = this.isStackable();
  }

  // Static helpers for robust type-safe checks
  static isStackable(item) {
    if (!item) return false;
    if (typeof item.isStackable === 'function') return item.isStackable();
    return !!(item.stackable || (item.traits && item.traits.includes(ItemTrait.STACKABLE)));
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

  isMagazine() {
    // Items with capacity are magazines or weapons with internal mags
    return this.capacity !== null && this.capacity > 0;
  }

  isAmmo() {
    return this.hasCategory(ItemCategory.AMMO) && this.isStackable();
  }

  canLoadAmmo(ammoItem) {
    if (!this.isMagazine() || !ammoItem.isAmmo()) return false;
    // Check if compatible (using categories for now, could be more specific later)
    // For now, if both are AMMO category, they are compatible
    return true;
  }

  loadAmmo(ammoItem) {
    if (!this.canLoadAmmo(ammoItem)) return { success: false, reason: 'Incompatible' };

    const spaceLeft = this.capacity - this.ammoCount;
    if (spaceLeft <= 0) return { success: false, reason: 'Full' };

    const amountToTransfer = Math.min(spaceLeft, ammoItem.stackCount);
    this.ammoCount += amountToTransfer;
    ammoItem.stackCount -= amountToTransfer;

    return {
      success: true,
      amountLoaded: amountToTransfer,
      isStackEmpty: ammoItem.stackCount <= 0
    };
  }

  unloadAmmo() {
    if (!this.isMagazine() || this.ammoCount <= 0) return { success: false, reason: 'Empty' };

    const amount = this.ammoCount;
    this.ammoCount = 0;

    const ammoDefId = ItemDefs[this.defId]?.ammoDefId;

    return {
      success: true,
      amount,
      ammoDefId
    };
  }

  isWeapon() {
    return this.hasCategory(ItemCategory.WEAPON) || !!this.attachmentSlots;
  }

  getDisplayAmmoCount() {
    // 1. If it's a magazine, return its ammo count
    if (this.isMagazine()) {
      return this.ammoCount || 0;
    }

    // 2. If it's a weapon, check for an attached magazine
    if (this.attachmentSlots) {
      // Find the ammo/magazine slot
      const ammoSlot = this.attachmentSlots.find(slot =>
        slot.id === 'ammo' || (slot.allowedCategories && slot.allowedCategories.includes(ItemCategory.AMMO))
      );

      if (ammoSlot) {
        const attachedMag = this.attachments[ammoSlot.id];
        // If magazine is equipped, show its count; if no mag, show 0 per user request
        return attachedMag ? (attachedMag.ammoCount || 0) : 0;
      }
    }

    return null;
  }

  hasCategory(category) {
    return this.categories.includes(category);
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
    if (!otherItem) return false;

    if (!Item.isStackable(this) || !Item.isStackable(otherItem)) {
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
      // and inherits the item's name if no specific name is provided
      const containerData = {
        ...this._containerGridData,
        id: this._containerGridData.id || `${this.instanceId}-container`,
        name: this._containerGridData.name || this.name
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
      }

      // Priority 1: Restore from saved data (if loading game)
      if (this._pocketGridsData && this._pocketGridsData.length > 0) {
        this.pocketGrids = this._pocketGridsData.map(gridDef => Container.fromJSON(gridDef));
        return this.pocketGrids;
      }

      // Priority 2: Create new from Layout
      if (this.pocketLayoutId) {
        const layout = PocketLayouts[this.pocketLayoutId];
        if (!layout) {
          console.warn('[Item] Invalid pocket layout ID:', this.pocketLayoutId);
          return [];
        }

        this.pocketGrids = layout.pockets.map((pocketDef, index) => {
          const pocketId = `${this.instanceId}-pocket-${index + 1}`;
          return new Container({
            id: pocketId,
            type: 'dynamic-pocket',
            name: pocketDef.name,
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

  // Weapon Attachment Methods
  attachItem(slotId, item) {
    if (!this.attachmentSlots) return false;
    const slot = this.attachmentSlots.find(s => s.id === slotId);
    if (!slot) return false;

    // Validate category compatibility
    if (slot.allowedCategories && slot.allowedCategories.length > 0) {
      const isCompatible = item.categories.some(c => slot.allowedCategories.includes(c));
      if (!isCompatible) return false;
    }

    // Validate specific item ID compatibility
    if (slot.allowedItems && slot.allowedItems.length > 0) {
      if (!slot.allowedItems.includes(item.defId)) return false;
    }

    this.attachments[slotId] = item;
    item.isEquipped = true; // Mark as equipped when attached to a weapon
    return true;
  }

  findCompatibleAttachmentSlot(item) {
    if (!this.attachmentSlots) return null;

    // Find first empty and compatible slot
    for (const slot of this.attachmentSlots) {
      if (this.attachments[slot.id]) continue; // Already occupied

      // Validate category compatibility
      if (slot.allowedCategories && slot.allowedCategories.length > 0) {
        const isCompatible = item.categories.some(c => slot.allowedCategories.includes(c));
        if (!isCompatible) continue;
      }

      // Validate specific item ID compatibility
      if (slot.allowedItems && slot.allowedItems.length > 0) {
        if (!slot.allowedItems.includes(item.defId)) continue;
      }

      return slot.id;
    }

    return null;
  }

  detachItem(slotId) {
    const item = this.attachments[slotId];
    if (item) {
      delete this.attachments[slotId];
      item.isEquipped = false;
      return item;
    }
    return null;
  }

  getAttachment(slotId) {
    return this.attachments[slotId] || null;
  }

  hasAttachments() {
    return Object.keys(this.attachments).length > 0;
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
      capacity: this.capacity,
      ammoCount: this.ammoCount,
      equippableSlot: this.equippableSlot,
      isEquipped: this.isEquipped,
      encumbranceTier: this.encumbranceTier,
      pocketLayoutId: this.pocketLayoutId, // Persist the layout ID
      categories: this.categories
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
    if (this.pocketGrids.length > 0) {
      data.pocketGrids = this.pocketGrids.map(pocket => pocket.toJSON());
    } else if (this._pocketGridsData) {
      data.pocketGrids = this._pocketGridsData;
    }

    // Serialize Attachments
    if (Object.keys(this.attachments).length > 0) {
      data.attachments = {};
      for (const [slotId, item] of Object.entries(this.attachments)) {
        data.attachments[slotId] = item.toJSON();
      }
    }

    return data;
  }

  // Helper for static instantiation
  static fromJSON(data) {
    const item = new Item({
      ...data,
      _containerGridData: data.containerGrid,
      _pocketGridsData: data.pocketGrids
    });

    // Restore attachments
    if (data.attachments) {
      item.attachments = {};
      for (const [slotId, itemData] of Object.entries(data.attachments)) {
        item.attachments[slotId] = Item.fromJSON(itemData);
      }
    }

    return item;
  }


}
