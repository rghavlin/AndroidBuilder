import { ItemTrait, ItemCategory, CategoryDisplayName, SlotDisplayName } from './traits.js';
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
    shelfLife = null,
    lifetimeTurns = null,
    ammoDefId = null,
    rangedStats = null,
    description = null,
    transformInto = null,
    produce = null,
    backgroundColor = null,
    isLit = false
  }) {
    super(); // Initialize EventEmitter
    // Core identity - MUST be unique per item instance
    const uniqueSuffix = Math.random().toString(36).substring(2, 9);
    const timestamp = Date.now();
    this.instanceId = instanceId || `item-${timestamp}-${uniqueSuffix}`;
    this.defId = defId || id;
    this.id = this.defId; // Maintain id for legacy compatibility
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
    this.description = description;
    this.transformInto = transformInto;
    this.produce = produce;
    this.backgroundColor = backgroundColor;

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
    this.lifetimeTurns = lifetimeTurns;
    this.ammoDefId = ammoDefId;
    this.isLit = isLit;

    // Load shelfLife from definition if not provided
    if (this.shelfLife === null && this.defId && ItemDefs[this.defId]?.shelfLife) {
      this.shelfLife = ItemDefs[this.defId].shelfLife;
    }

    // Load lifetimeTurns from definition if not provided
    if (this.lifetimeTurns === null && this.defId && ItemDefs[this.defId]?.lifetimeTurns) {
      this.lifetimeTurns = ItemDefs[this.defId].lifetimeTurns;
    }

    // MIGRATION / INITIALIZATION: Load attributes from definition
    if (this.defId && ItemDefs[this.defId]) {
      const def = ItemDefs[this.defId];
      if (def.attachmentSlots) this.attachmentSlots = def.attachmentSlots;
      if (def.ammoDefId && !this.ammoDefId) this.ammoDefId = def.ammoDefId;
      if (def.rarity && !this.rarity) this.rarity = def.rarity;
      if (def.combat && !this.combat) this.combat = def.combat;
      if (def.rangedStats && !this.rangedStats) this.rangedStats = def.rangedStats;
      if (def.imageId && !this.imageId) this.imageId = def.imageId;
      if (def.produce && !this.produce) this.produce = def.produce;
      if (def.backgroundColor && !this.backgroundColor) this.backgroundColor = def.backgroundColor;
      if (def.disassembleData) this.disassembleData = def.disassembleData;
      if (def.renderFullTile) this.renderFullTile = def.renderFullTile;
      if (def.isFurniture) this.isFurniture = def.isFurniture;
      if (def.isWagon) this.isWagon = def.isWagon;
      if (def.dragApPenalty) this.dragApPenalty = def.dragApPenalty;
      if (def.isPlanter) this.isPlanter = def.isPlanter;
      if (def.isPuddle) this.isPuddle = def.isPuddle;
      if (def.plantsAs) this.plantsAs = def.plantsAs;
      if (def.produceMin !== undefined) this.produceMin = def.produceMin;
      if (def.produceMax !== undefined) this.produceMax = def.produceMax;
      
      // Auto-inherit categories from definition if not already present
      if (def.categories && Array.isArray(def.categories)) {
        def.categories.forEach(cat => {
          if (!this.categories.includes(cat)) {
            this.categories.push(cat);
          }
        });
      }

      // Phase 25: Sync traits from definition to handle updates to existing items
      if (def.traits && Array.isArray(def.traits)) {
        def.traits.forEach(trait => {
          if (!this.traits.includes(trait)) {
            this.traits.push(trait);
          }
        });
      }

      // Sync dragApPenalty
      if (def.dragApPenalty !== undefined && this.dragApPenalty === undefined) {
        this.dragApPenalty = def.dragApPenalty;
      }
      if (def.noDrag !== undefined && this.noDrag === undefined) {
        this.noDrag = def.noDrag;
      }
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

  /**
   * Check if the item is a motorized wagon with sufficient power
   */
  isMotorized() {
    if (!this.isWagon || !this.attachments) return false;
    const motor = this.attachments['motor'];
    const battery = this.attachments['battery'];
    // Motorized if it has a motor AND a battery with charge
    return !!(motor && battery && battery.ammoCount > 0);
  }

  /**
   * Get the current battery charge percentage (if applicable)
   */
  getBatteryCharge() {
    if (!this.attachments) return 0;
    const battery = this.attachments['battery'];
    if (!battery) return 0;
    // Standard battery max is 10, Large battery max is 100
    const max = battery.defId === 'tool.large_battery' ? 100 : 10;
    return (battery.ammoCount / max) * 100;
  }

  /**
   * Update item properties from a new definition ID.
   * Useful for "transforming" items (e.g. empty bottle -> filled bottle).
   */
  updateFromDef(newDefId) {
    if (!newDefId || !ItemDefs[newDefId]) {
      console.warn(`[Item] Cannot update from definition: ${newDefId} not found`);
      return false;
    }

    const def = ItemDefs[newDefId];
    this.defId = newDefId;
    this.id = newDefId; // Maintain legacy id sync
    this.name = def.name || this.name;
    this.imageId = def.imageId || this.imageId;
    this.width = def.width || this.width;
    this.height = def.height || this.height;
    this.traits = Array.isArray(def.traits) ? [...def.traits] : this.traits;
    this.categories = Array.isArray(def.categories) ? [...def.categories] : this.categories;
    this.capacity = def.capacity !== undefined ? def.capacity : this.capacity;
    this.consumptionEffects = def.consumptionEffects ? { ...def.consumptionEffects } : this.consumptionEffects;

    // Signal update
    this.emit('updated', this);
    return true;
  }

  /**
   * Check if item can be equipped in a specific slot
   */
  canEquipIn(slotId) {
    if (!this.equippableSlot) return false;
    if (Array.isArray(this.equippableSlot)) {
      return this.equippableSlot.includes(slotId);
    }
    return this.equippableSlot === slotId;
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
    return !!(item.traits && item.traits.includes(ItemTrait.WATER_CONTAINER));
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

  /**
   * Determine if this item is eligible for automatic rotation to fit a grid.
   * Skip rotation for:
   * 1. Square items (1x1, 2x2, etc.)
   * 2. Pre-fit 3x2 icons (Crowbars, Hammers, etc.)
   * 
   * Only rotate "particularly wide" items (e.g. Rifles, Fire Axe, Shovel) - size 4+ in any dimension
   */
  shouldRotateToFit() {
    // 1. Never rotate square items
    if (this.width === this.height) return false;

    // 2. Only rotate if one dimension is 4 or more (particularly wide items)
    // This naturally excludes 2x1 and 3x2 items per user request
    const maxDim = Math.max(this.width, this.height);
    return maxDim >= 4;
  }

  isMagazine() {
    // Items with capacity are magazines or weapons with internal mags
    // BUT we exclude charge-based tools like lighters and matches
    return this.capacity !== null && this.capacity > 0 && !this.isChargeBased();
  }

  isAmmo() {
    return this.hasCategory(ItemCategory.AMMO) && this.isStackable();
  }

  isWaterBottle() {
    return this.hasTrait(ItemTrait.WATER_CONTAINER);
  }

  isBattery() {
    return this.hasTrait(ItemTrait.BATTERY);
  }

  isChargeBased() {
    return this.hasTrait(ItemTrait.CHARGE_BASED) || this.isBattery?.();
  }

  isBatteryPowered() {
    return this.hasTrait(ItemTrait.BATTERY_POWERED);
  }
  
  get lightRange() {
    return this._def?.lightRange || 8;
  }
  
  get lightType() {
    return this._def?.lightType || null;
  }

  getBattery() {
    if (!this.attachmentSlots) return null;
    return this.attachments['battery'] || null;
  }

  getCharges() {
    if (this.isBattery()) return this.ammoCount || 0;
    if (this.isBatteryPowered()) {
      const battery = this.getBattery();
      return battery ? (battery.ammoCount || 0) : 0;
    }
    if (this.hasTrait(ItemTrait.IGNITABLE)) {
      return this.condition || 0;
    }
    return 0;
  }

  /**
   * Consume a specific amount of charges from the item or its battery.
   * Handles Flashlights, Torches, Batteries, and Lighters.
   * @param {number} amount - Number of charges to consume
   * @returns {boolean} - True if charges were successfully consumed, false if insufficient
   */
  consumeCharge(amount = 1) {
    // 1. Battery Powered items (Flashlight, NVG) - consume from attached battery
    if (this.isBatteryPowered()) {
      const battery = this.getBattery();
      if (battery && (battery.ammoCount || 0) >= amount) {
        battery.ammoCount -= amount;
        return true;
      }
      return false;
    }

    // 2. Standalone Battery or Charge-based tool (Lighter) - consume from own ammoCount
    if (this.isBattery() || this.hasTrait(ItemTrait.CHARGE_BASED)) {
      if ((this.ammoCount || 0) >= amount) {
        this.ammoCount -= amount;
        return true;
      }
      return false;
    }

    // 3. Ignitable items (Torch) - consume from condition
    if (this.hasTrait(ItemTrait.IGNITABLE)) {
      if ((this.condition || 0) >= amount) {
        // Use degrade to handle auto-destruction if it hits 0
        this.degrade(amount);
        return true;
      }
      return false;
    }

    return false;
  }

  isSpoilable() {
    return this.hasTrait(ItemTrait.SPOILABLE);
  }

  get isSpoiled() {
    return this.isSpoilable() && this.shelfLife !== null && this.shelfLife <= 0;
  }

  getNutritionValue() {
    if (!this.consumptionEffects || this.consumptionEffects.nutrition === undefined) return 0;

    if (this.isSpoiled) {
      return Math.floor(this.consumptionEffects.nutrition * 0.5);
    }

    return this.consumptionEffects.nutrition;
  }

  getHydrationValue() {
    if (!this.consumptionEffects || this.consumptionEffects.hydration === undefined) return 0;

    if (this.isSpoiled) {
      return Math.floor(this.consumptionEffects.hydration * 0.5);
    }

    return this.consumptionEffects.hydration;
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

    // 1b. Process lifetimeTurns (for campfires)
    if (this.lifetimeTurns !== null && this.lifetimeTurns !== undefined) {
      this.lifetimeTurns = Math.max(0, this.lifetimeTurns - 1);
      if (this.lifetimeTurns <= 0) {
        console.log(`[Item] ${this.name} (${this.instanceId}) has EXPIRED (lifetimeTurns reached 0)`);
      }
    }

  }

  canLoadAmmo(ammoItem) {
    if (!this.isMagazine() || !ammoItem.isAmmo()) return false;

    // Enforce compatibility if an ammo type is specified
    if (this.ammoDefId && ammoItem.defId !== this.ammoDefId) {
      console.debug(`[Item] REJECT: Incompatible ammo for ${this.name}. Expected: ${this.ammoDefId}, Got: ${ammoItem.defId}`);
      return false;
    }

    return true;
  }

  loadAmmo(ammoItem) {
    if (!this.canLoadAmmo(ammoItem)) return { success: false, reason: 'Incompatible' };

    const spaceLeft = this.capacity - this.ammoCount;
    if (spaceLeft <= 0) return { success: false, reason: 'Full' };

    const amountToTransfer = Math.min(spaceLeft, ammoItem.stackCount);
    if (amountToTransfer <= 0) return { success: false, reason: 'Empty' };
    
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

    // Use instance property first, fallback to definition
    const ammoDefId = this.ammoDefId || ItemDefs[this.defId]?.ammoDefId;

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
    // 1. If it's a water bottle or puddle, hide the number
    if (this.isWaterBottle() || this.isPuddle) {
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

    // 4. If it's battery-powered, show battery charges
    if (this.isBatteryPowered && this.isBatteryPowered()) {
      const battery = this.getBattery();
      return battery ? (battery.ammoCount || 0) : 0;
    }

    // 5. If it's a standalone battery, show its charge
    if (this.isBattery && this.isBattery()) {
      return this.ammoCount || 0;
    }

    // 6. If it's an ignitable item (Torch), show its condition as charges
    if (this.hasTrait(ItemTrait.IGNITABLE)) {
      return this.condition || 0;
    }

    // 7. If it's a charge-based tool (Lighter/Matches), show its ammoCount
    if (this.isChargeBased && this.isChargeBased()) {
      return this.ammoCount || 0;
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
    // 0. High priority categories for ground organization
    if (this.isVehicle || this.isWagon) return 'vehicles';
    if (this.isPuddle) return 'environment';
    if (this.isPlanter || this.plantsAs || this.defId?.endsWith('_plant') || this.defId === 'provision.hole') return 'farming';
    if (this.isFurniture) return 'furniture';

    // Standard fallback categories
    if (this.categories.includes(ItemCategory.GUN) || this.categories.includes(ItemCategory.WEAPON)) return 'weapons';
    if (this.categories.includes(ItemCategory.AMMO)) return 'ammunition';
    if (this.categories.includes(ItemCategory.CLOTHING)) return 'armor';
    if (this.categories.includes(ItemCategory.TOOL)) return 'tools';
    if (this.categories.includes(ItemCategory.FOOD) || this.categories.includes(ItemCategory.MEDICAL)) return 'consumables';
    if (this.categories.includes(ItemCategory.CRAFTING_MATERIAL)) return 'materials';
    if (this.categories.includes(ItemCategory.CONTAINER)) return 'containers';

    return 'misc';
  }

  /**
   * Overridden for environment items that scale based on content
   */
  getActualWidth() {
    if (this.isPuddle) {
      // 1x1 at 10, 2x2 at 20, 3x3 at 30, 4x4 at 40, 5x5 at 50
      return Math.max(1, Math.min(5, Math.ceil(this.ammoCount / 10)));
    }
    return this.rotation === 90 || this.rotation === 270 ? this.height : this.width;
  }

  getActualHeight() {
    if (this.isPuddle) {
      return Math.max(1, Math.min(5, Math.ceil(this.ammoCount / 10)));
    }
    return this.rotation === 90 || this.rotation === 270 ? this.width : this.height;
  }

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

    // Toggle rotation: 0 (default) <-> 90 (rotated)
    const newRotation = (this.rotation === 0) ? 90 : 0;

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

    // Stacking is orientation-agnostic; validatePlacement handles the grid overlap.
    if (!Item.isStackable(this) || !Item.isStackable(otherItem)) {
      return false;
    }

    // Items MUST have the same definition ID to stack in a single slot
    if (this.defId !== otherItem.getDefId?.() && this.defId !== otherItem.defId) {
      return false;
    }

    // Special rule for Water Bottles: They only stack if they are EMPTY or FULL and levels match
    if (this.isWaterBottle()) {
      const capacity = this.capacity;
      const ammo = this.ammoCount || 0;
      const otherAmmo = otherItem.ammoCount || 0;

      const isFull = ammo === capacity;
      const isEmpty = ammo === 0;
      const otherIsFull = otherAmmo === capacity;
      const otherIsEmpty = otherAmmo === 0;

      // 1. Quality must match (Unless both are empty)
      if (!isEmpty && !otherIsEmpty && this.waterQuality !== otherItem.waterQuality) {
        return false;
      }

      // 2. Both must be exactly Full or exactly Empty to stack, and the amounts must be identical
      // (This prevents a bottle with 19 units from stacking with one with 20 units, or 20 from stacking with 0).
      if (!(isFull || isEmpty) || !(otherIsFull || otherIsEmpty) || ammo !== otherAmmo) {
        return false;
      }
    }

    // Special rule for Batteries: They only stack if they are EMPTY or FULL
    if (this.isBattery()) {
      const ammo = this.ammoCount || 0;
      const otherAmmo = otherItem.ammoCount || 0;

      // 2. ONLY FULL batteries are stackable (User Rule)
      const isFull = ammo === (this.capacity || 10);
      if (!isFull || ammo !== otherAmmo) {
        return false;
      }
    }

    // Special rule for Charge-based items: They only stack if they have the SAME number of charges
    if (this.hasTrait(ItemTrait.CHARGE_BASED)) {
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

    // 1. Water Bottle Interaction
    if (this.isWaterBottle() && Item.isWaterBottle(otherItem)) {
      // STRICT RULE: Only individual, non-stacked bottles can transfer water
      if ((this.stackCount || 1) > 1 || (otherItem.stackCount || 1) > 1) {
        return false;
      }

      const myCapacity = this.capacity;
      const otherCapacity = otherItem.capacity;

      const canFillMe = (this.ammoCount || 0) < myCapacity && (otherItem.ammoCount || 0) > 0;
      const canFillOther = (otherItem.ammoCount || 0) < otherCapacity && (this.ammoCount || 0) > 0;

      if (!canFillMe && !canFillOther) return false;

      // Quality check: Only allow if both match OR target is empty
      const isMeEmpty = (this.ammoCount || 0) === 0;
      const isOtherEmpty = (otherItem.ammoCount || 0) === 0;

      if (canFillMe && !isMeEmpty && this.waterQuality !== otherItem.waterQuality) return false;
      if (canFillOther && !isOtherEmpty && this.waterQuality !== otherItem.waterQuality) return false;

      return true;
    }

    // 2. Battery Interaction (Replacement)
    if (this.isBatteryPowered() && otherItem.isBattery()) {
      return true;
    }

    return false;
  }

  combineWith(otherItem) {
    if (!this.canCombineWith(otherItem)) return false;

    // 1. Water Bottle Interaction
    if (this.isWaterBottle() && Item.isWaterBottle(otherItem)) {
      const myCapacity = this.capacity;
      const otherCapacity = otherItem.capacity;
      
      // 1a. Try Dragged -> Occupant (Filling the grid item)
      const spaceInMe = myCapacity - (this.ammoCount || 0);
      const amountToMe = Math.min(spaceInMe, otherItem.ammoCount || 0);
      
      if (amountToMe > 0) {
        if ((this.ammoCount || 0) === 0) {
          this.waterQuality = otherItem.waterQuality;
        }
        this.ammoCount = (this.ammoCount || 0) + amountToMe;
        otherItem.ammoCount = (otherItem.ammoCount || 0) - amountToMe;
        return true;
      }
      
      // 1b. Try Occupant -> Dragged (Filling the hand item)
      const spaceInOther = otherCapacity - (otherItem.ammoCount || 0);
      const amountToOther = Math.min(spaceInOther, this.ammoCount || 0);
      
      if (amountToOther > 0) {
        if ((otherItem.ammoCount || 0) === 0) {
          otherItem.waterQuality = this.waterQuality;
        }
        otherItem.ammoCount = (otherItem.ammoCount || 0) + amountToOther;
        this.ammoCount = (this.ammoCount || 0) - amountToOther;
        return true;
      }
      return false;
    }

    // 2. Battery Interaction (Replacement)
    if (this.isBatteryPowered() && otherItem.isBattery()) {
      // 2a. Take 1 from source stack if needed
      let batteryToInsert = otherItem;
      if (otherItem.stackCount > 1) {
        batteryToInsert = otherItem.splitStack(1);
        otherItem.stackCount -= 1;
        console.log(`[Item] Splitting 1 battery from stack of ${otherItem.stackCount + 1}`);
      } else {
        // Mark as consumed for the caller (moveItem)
        otherItem.stackCount = 0;
      }

      // 2b. Eject existing battery
      const ejected = this.detachItem('battery');

      // 2c. Attach new battery
      this.attachItem('battery', batteryToInsert);

      console.log(`[Item] Replaced battery in ${this.name}. Ejected: ${ejected ? ejected.name : 'None'}`);

      return { success: true, ejected };
    }

    return false;
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

    // Create a clone but don't mutate original here.
    // Atomically reduce original stack ONLY if placement succeeds (handled in InventoryContext).
    const newItem = Item.fromJSON(this.toJSON());
    newItem.instanceId = `${this.instanceId}-split-${Date.now()}`;
    newItem.stackCount = count;
    
    // Reset position for fresh placement
    newItem.x = 0;
    newItem.y = 0;
    newItem._container = null;

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
        name: this._containerGridData.name || this.name,
        ownerId: this.instanceId // Ensure ownerId is set for turn skip logic
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
        this.pocketGrids = this._pocketGridsData.map(gridDef => {
          const container = Container.fromJSON(gridDef);
          container.ownerId = this.instanceId; // Ensure ownerId is set
          return container;
        });
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

  findCompatibleAttachmentSlot(item, allowOccupied = false) {
    if (!this.attachmentSlots) return null;

    // Find first compatible slot
    for (const slot of this.attachmentSlots) {
      if (!allowOccupied && this.attachments[slot.id]) continue; // Skip if occupied unless allowed

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
      type: 'item',
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
      pocketLayoutId: this.pocketLayoutId, // Persist the layout ID
      categories: this.categories,
      consumptionEffects: this.consumptionEffects,
      waterQuality: this.waterQuality,
      shelfLife: this.shelfLife,
      lifetimeTurns: this.lifetimeTurns,
      rarity: this.rarity,
      combat: this.combat,
      rangedStats: this.rangedStats,
      description: this.description,
      transformInto: this.transformInto,
      produce: this.produce,
      backgroundColor: this.backgroundColor
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

  static fromJSON(data) {
    if (!data) return null;
    
    // Phase 12 Fix: Robust type check - if it's already an instantiated Item, return it directly
    if (data.type === 'item' && typeof data.isStackable === 'function') {
      return data;
    }

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
