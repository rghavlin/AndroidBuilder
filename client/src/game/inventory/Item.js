import { ItemTrait, ItemCategory } from './traits.js';
import { Container } from './Container.js';
import { PocketLayouts } from './PocketLayouts.js';
import { ItemDefs } from './ItemDefs.js'; // Import definitions for lookup
import { SafeEventEmitter } from '../utils/SafeEventEmitter.js';

/**
 * Item Instance - Runtime item with state
 */
export class Item extends SafeEventEmitter {
  constructor({
    instanceId,
    defId,
    subtype = null,
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
    ammoCount = 0,
    consumptionEffects = null,
    waterQuality = 'clean',
    shelfLife = null
  }) {
    super(); // Initialize EventEmitter
    // Core identity - MUST be unique per item instance
    const uniqueSuffix = Math.random().toString(36).substring(2, 9);
    const timestamp = Date.now();
    this.instanceId = instanceId || `item-${timestamp}-${uniqueSuffix}`;
    this.defId = defId;
    this.type = 'item'; // Explicit type for map rendering compatibility
    this.subtype = subtype;
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
    this.fragility = 2; // Default
    if (this.defId && ItemDefs[this.defId]?.fragility) {
      this.fragility = ItemDefs[this.defId].fragility;
    }

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
    this.consumptionEffects = consumptionEffects;

    // Water properties
    this.waterQuality = waterQuality;
    this.shelfLife = shelfLife;

    // Load shelfLife from definition if not provided
    if (this.shelfLife === null && this.defId && ItemDefs[this.defId]?.shelfLife) {
      this.shelfLife = ItemDefs[this.defId].shelfLife;
    }

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

  static isWaterBottle(item) {
    if (!item) return false;
    if (typeof item.isWaterBottle === 'function') return item.isWaterBottle();
    return !!(item.defId && (item.defId.startsWith('food.waterbottle') || item.defId === 'food.waterjug'));
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

  isGroundOnly() {
    return this.hasTrait(ItemTrait.GROUND_ONLY);
  }

  isMagazine() {
    // Items with capacity are magazines or weapons with internal mags
    return this.capacity !== null && this.capacity > 0;
  }

  isAmmo() {
    return this.hasCategory(ItemCategory.AMMO) && this.isStackable();
  }

  isWaterBottle() {
    return this.defId && (this.defId.startsWith('food.waterbottle') || this.defId === 'food.waterjug');
  }

  isSpoilable() {
    return this.hasTrait(ItemTrait.SPOILABLE);
  }

  get isSpoiled() {
    return this.isSpoilable() && this.shelfLife !== null && this.shelfLife <= 0;
  }

  getNutritionValue() {
    if (!this.consumptionEffects || this.consumptionEffects.nutrition === undefined) return 0;

    // Eating spoiled corn will restore 3 nutrition
    if (this.isSpoiled) {
      if (this.defId === 'food.corn') return 3;
      // For other items, maybe reduce by half?
      return Math.floor(this.consumptionEffects.nutrition * 0.5);
    }

    return this.consumptionEffects.nutrition;
  }

  processTurn() {
    // 1. Process own spoilage/lifetime
    if (this.shelfLife !== null && this.shelfLife !== undefined) {
      // User requested 1 hour per turn (1 turn = 1 hour)
      this.shelfLife -= 1;

      // Emit event if it just spoiled
      if (this.shelfLife === 0 && this.isSpoilable()) {
        console.log(`[Item] ${this.name} (${this.instanceId}) has SPOILED!`);
        this.emitEvent('itemSpoiled', { item: this });
      }
    }

    // 2. Recurse into attachments
    if (this.attachments) {
      Object.values(this.attachments).forEach(attachedItem => {
        if (attachedItem && attachedItem.processTurn) {
          attachedItem.processTurn();
        }
      });
    }

    // 3. Recurse into container grid
    if (this.containerGrid) {
      this.containerGrid.getAllItems().forEach(nestedItem => {
        if (nestedItem && nestedItem.processTurn) {
          nestedItem.processTurn();
        }
      });
    }

    // 4. Recurse into pockets
    if (this.pocketGrids) {
      this.pocketGrids.forEach(pocket => {
        pocket.getAllItems().forEach(pocketItem => {
          if (pocketItem && pocketItem.processTurn) {
            pocketItem.processTurn();
          }
        });
      });
    }
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
    // 1. If it's a water bottle, hide the number (we use a fill bar instead)
    if (this.isWaterBottle()) {
      return null;
    }

    // 2. If it's a magazine, return its ammo count
    if (this.isMagazine()) {
      return this.ammoCount || 0;
    }

    // 3. If it's a weapon, check for an attached magazine
    if (this.attachmentSlots) {
      // Find the ammo/magazine slot
      const ammoSlot = this.attachmentSlots.find(slot =>
        slot.id === 'ammo' || (slot.allowedCategories && slot.allowedCategories.includes(ItemCategory.AMMO))
      );

      if (ammoSlot) {
        const attachedMag = this.attachments[ammoSlot.id];
        // If magazine is equipped, show its count
        if (attachedMag && attachedMag.isMagazine()) {
          return attachedMag.ammoCount || 0;
        }
        // If it's not a magazine but is ammo (e.g. .357 rounds in a drum), show the stack count
        if (attachedMag && attachedMag.isAmmo()) {
          return attachedMag.stackCount || 0;
        }
        // If no mag/ammo, show 0 per user request
        return 0;
      }
    }

    return null;
  }

  getWaterPercent() {
    if (!this.isWaterBottle() || !this.capacity) return 0;
    return (this.ammoCount / this.capacity) * 100;
  }

  /**
   * Check if item has a specific category
   */
  hasCategory(category) {
    return this.categories.includes(category);
  }

  /**
   * Get primary category for organization/grouping
   */
  getCategory() {
    // 1. Return first explicit category if available
    if (this.categories && this.categories.length > 0) {
      // Normalize common singular categories to plural forms used by GroundManager
      const cat = this.categories[0];
      if (cat === 'weapon') return 'weapons';
      if (cat === 'ammo') return 'ammunition';
      if (cat === 'tool') return 'tools';
      if (cat === 'clothing') return 'armor';
      if (cat === 'food' || cat === 'medical') return 'consumables';
      return cat;
    }

    // 2. Fallbacks based on traits
    if (this.isWeapon()) return 'weapons';
    if (this.isAmmo()) return 'ammunition';
    if (this.isContainer()) return 'containers';

    // 3. Fallback based on slot
    if (this.equippableSlot) {
      if (this.equippableSlot === 'melee' || this.equippableSlot === 'handgun' || this.equippableSlot === 'long_gun') {
        return 'weapons';
      }
      if (this.equippableSlot === 'upper_body' || this.equippableSlot === 'lower_body') {
        return 'armor';
      }
      if (this.equippableSlot === 'backpack') {
        return 'containers';
      }
    }

    return 'misc';
  }

  // Rotation
  getActualWidth() {
    return (this.rotation === 90 || this.rotation === 270) ? this.height : this.width;
  }

  getActualHeight() {
    return (this.rotation === 90 || this.rotation === 270) ? this.width : this.height;
  }

  /**
   * Reduce condition for degradable items
   * @param {number} amount - Amount to reduce condition by (defaults to items fragility)
   */
  degrade(amount = null) {
    if (!this.isDegradable() || this.condition === null) return;

    const finalAmount = amount !== null ? amount : this.fragility;
    this.condition = Math.max(0, this.condition - finalAmount);
    console.debug(`[Item] ${this.name} degraded by ${finalAmount}. Remaining condition: ${this.condition}`);

    if (this.condition <= 0) {
      console.log(`[Item] ${this.name} (${this.instanceId}) has BROKEN!`);
      // Notify container to remove this item if it breaks
      if (this._container) {
        this._container.removeItem(this.instanceId);
      }
      this.emitEvent('itemBroken', { item: this });
    }
  }

  /**
   * Emit item events with standard data
   */
  emitEvent(eventType, data = {}) {
    const eventData = {
      item: {
        instanceId: this.instanceId,
        defId: this.defId,
        name: this.name
      },
      timestamp: Date.now(),
      ...data
    };

    this.emit(eventType, eventData);
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

    const isBothWaterBottle = this.isWaterBottle() && Item.isWaterBottle(otherItem);
    if (this.defId !== otherItem.defId && !isBothWaterBottle) {
      return false;
    }

    // Special rule for Water Bottles: They only stack if they are EMPTY or FULL and levels match
    if (this.isWaterBottle()) {
      const capacity = this.capacity || 20;
      const ammo = this.ammoCount || 0;
      const otherAmmo = otherItem.ammoCount || 0;

      const isFull = ammo === capacity;
      const isEmpty = ammo === 0;
      if (!(isFull || isEmpty) || ammo !== otherAmmo) {
        return false;
      }
    }

    // Special rule for Lighters and Matchbooks: They only stack if they have the SAME number of charges
    if (this.defId === 'tool.lighter' || this.defId === 'tool.matchbook') {
      if (this.ammoCount !== otherItem.ammoCount) {
        return false;
      }
    }

    if (this.stackCount >= this.stackMax) {
      return false;
    }

    return true;
  }

  canCombineWith(otherItem) {
    if (!otherItem) return false;
    if (this.instanceId === otherItem.instanceId) return false;

    // Both must be water bottles
    if (!this.isWaterBottle() || !Item.isWaterBottle(otherItem)) return false;

    // Target must have space or source must have water
    return this.ammoCount < this.capacity || otherItem.ammoCount > 0;
  }

  combineWith(otherItem) {
    if (!this.canCombineWith(otherItem)) return false;

    const spaceLeft = (this.capacity || 20) - (this.ammoCount || 0);
    const amountToTransfer = Math.min(spaceLeft, otherItem.ammoCount || 0);

    this.ammoCount = (this.ammoCount || 0) + amountToTransfer;
    otherItem.ammoCount = (otherItem.ammoCount || 0) - amountToTransfer;

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
      categories: this.categories,
      consumptionEffects: this.consumptionEffects,
      waterQuality: this.waterQuality,
      shelfLife: this.shelfLife
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
