import { ItemTrait, ItemCategory, CategoryDisplayName, SlotDisplayName, FireMode } from './traits.js';
import { TurnProcessingUtils } from '../utils/TurnProcessingUtils.js';
import { Container } from './Container.js';
import { PocketLayouts } from './PocketLayouts.js';
import { ItemDefs } from './ItemDefs.js'; // Import definitions for lookup
import { SafeEventEmitter } from '../utils/SafeEventEmitter.js';
import { FactionRegistry } from '../ai/FactionRegistry.js';
import { TURRET_DEF_ID } from '../ai/TurretCombat.js';

/**
 * Item Instance - Runtime item with state
 */
export class Item extends SafeEventEmitter {
  constructor(config = {}) {
    let {
      instanceId, // Unique runtime ID for this specific item instance (e.g., 'item-12345')
      defId,      // The template ID from ItemDefs (e.g., 'tool.battery')
      subtype = null,
      id,         // Legacy alias for defId (do NOT use for unique instance lookup)
      name = '',
      imageId = null,
      width = 1,
      height = 1,
      rotation = 0,
      x = 0,
      y = 0,
      traits = [],
      stackable = false,
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
      ammoCount = undefined,
      hp = undefined,
      maxHp = undefined,
      factionId = undefined,
      consumptionEffects = null,
      waterQuality = undefined,
      shelfLife = null,
      lifetimeTurns = null,
      ammoDefId = null,
      rangedStats = null,
      description = null,
      consumptionSound = null,
      transformInto = null,
      produce = null,
      backgroundColor = null,
      isLit = undefined,
      isOn = undefined,
      providesElectricity = undefined,
      fireMode = undefined,
      availableFireModes = [],
      renderFullTile = null,
      dragApPenalty = undefined,
      noDrag = undefined,
      rideApBonus = undefined,
      scooterMode = undefined,
      isLocked = undefined
    } = config;
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

    // Phase 27: Furniture & Dragging Restoration
    this.renderFullTile = renderFullTile;
    this.dragApPenalty = dragApPenalty;
    this.noDrag = noDrag;
    this.isLocked = isLocked;

    // Stack properties (if stackable)
    this.stackCount = stackCount;
    this.stackMax = stackMax;

    // Condition (if degradable)
    this.condition = condition;
    this.fragility = 2; // Default
    if (this.defId && ItemDefs[this.defId]?.fragility) {
      this.fragility = ItemDefs[this.defId].fragility;
    }

    this.capacity = capacity;
    this.ammoCount = ammoCount;

    // Combat attributes. ONLY items whose definition declares an hp pool (e.g.
    // turrets) are attackable; everything else leaves hp/maxHp undefined so they
    // never read as "destroyed" and don't acquire a stray hp:0 when round-tripped
    // through an ECS item-entity (whose hp getter returns 0).
    const combatDef = this.defId ? ItemDefs[this.defId] : null;
    if (combatDef && combatDef.hp !== undefined) {
      this.maxHp = maxHp !== undefined ? maxHp : combatDef.maxHp;
      this.hp = hp !== undefined ? hp : (this.maxHp !== undefined ? this.maxHp : combatDef.hp);
    } else {
      this.hp = undefined;
      this.maxHp = undefined;
    }
    this.factionId = factionId;
    // Per-entity hostility escalation (faction ids / entity ids). Used by turret
    // faction targeting and runtime escalation (e.g. town turrets vs the player).
    this.hostileOverrides = Array.isArray(config.hostileOverrides) ? new Set(config.hostileOverrides) : new Set();

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
    this.attachmentSlots = config.attachmentSlots !== undefined ? config.attachmentSlots : null;
    this.attachments = attachments || {}; // Store attached Item instances by slotId
    this.consumptionEffects = consumptionEffects;
    this.consumptionSound = consumptionSound;

    // Water properties
    this.waterQuality = waterQuality;
    this.shelfLife = shelfLife;
    this.lifetimeTurns = lifetimeTurns;
    this.ammoDefId = ammoDefId;
    this.isLit = isLit;
    this.isOn = isOn;
    this.providesElectricity = providesElectricity;
    this.fireMode = fireMode;
    this.availableFireModes = Array.isArray(availableFireModes) ? availableFireModes : [];
    
    // Derived properties
    this.isRanged = !!(rangedStats || (this.defId && ItemDefs[this.defId]?.rangedStats));

    // Load shelfLife from definition if not provided
    if (this.shelfLife === null && this.defId && ItemDefs[this.defId]?.shelfLife) {
      this.shelfLife = ItemDefs[this.defId].shelfLife;
    }

    // Load lifetimeTurns from definition if not provided
    if (this.lifetimeTurns === null && this.defId && ItemDefs[this.defId]?.lifetimeTurns) {
      this.lifetimeTurns = ItemDefs[this.defId].lifetimeTurns;
    }

    this.rideApBonus = rideApBonus;
    this.scooterMode = scooterMode;

    // MIGRATION / INITIALIZATION: Load attributes from definition
    if (this.defId && ItemDefs[this.defId]) {
      this._def = ItemDefs[this.defId];
      const def = this._def;
      if (def.attachmentSlots) this.attachmentSlots = def.attachmentSlots;
      if (def.condition !== undefined && (this.condition === null || this.condition === undefined)) this.condition = def.condition;
      if (def.capacity !== undefined && this.capacity === null) this.capacity = def.capacity;
      if (def.ammoCount !== undefined && this.ammoCount === undefined) this.ammoCount = def.ammoCount;
      if (def.factionId !== undefined && this.factionId === undefined) this.factionId = def.factionId;
      if (def.ammoDefId && !this.ammoDefId) this.ammoDefId = def.ammoDefId;
      if (def.equippableSlot && !this.equippableSlot) this.equippableSlot = def.equippableSlot;
      if (def.rarity && !this.rarity) this.rarity = def.rarity;
      if (def.combat && !this.combat) this.combat = def.combat;
      if (def.rangedStats && !this.rangedStats) this.rangedStats = def.rangedStats;
      if (def.imageId && !this.imageId) this.imageId = def.imageId;
      if (def.produce && !this.produce) this.produce = def.produce;
      if (def.backgroundColor && !this.backgroundColor) this.backgroundColor = def.backgroundColor;
      if (def.disassembleData) this.disassembleData = def.disassembleData;
      if (def.containerGrid && !this._containerGridData) this._containerGridData = def.containerGrid;
      if (def.consumptionSound && !this.consumptionSound) this.consumptionSound = def.consumptionSound;
      if (def.renderFullTile && this.renderFullTile === null) this.renderFullTile = def.renderFullTile;
      if (def.dragApPenalty !== undefined && this.dragApPenalty === undefined) this.dragApPenalty = def.dragApPenalty;
      if (def.noDrag !== undefined && this.noDrag === undefined) this.noDrag = def.noDrag;
      if (def.plantsAs) this.plantsAs = def.plantsAs;
      if (def.produceMin !== undefined) this.produceMin = def.produceMin;
      if (def.produceMax !== undefined) this.produceMax = def.produceMax;
      if (def.motorAssistBonus !== undefined) this.motorAssistBonus = def.motorAssistBonus;
      if (def.terrainModifiers) this.terrainModifiers = def.terrainModifiers;
      if (def.rideApBonus !== undefined) this.rideApBonus = def.rideApBonus;
      if (def.scooterMode !== undefined) this.scooterMode = def.scooterMode;
      
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
      if (def.isLocked !== undefined && this.isLocked === undefined) {
        this.isLocked = def.isLocked;
      }
      if (def.noTooltipUnits !== undefined) {
        this.noTooltipUnits = def.noTooltipUnits;
      }
      if (def.noTooltipRarity !== undefined) {
        this.noTooltipRarity = def.noTooltipRarity;
      }
      if (def.isOn !== undefined && this.isOn === undefined) {
        this.isOn = def.isOn;
      }
      if (def.providesElectricity !== undefined && this.providesElectricity === undefined) {
        this.providesElectricity = def.providesElectricity;
      }
      if (def.fireMode !== undefined && this.fireMode === FireMode.SINGLE) {
        this.fireMode = def.fireMode;
      }
      if (def.availableFireModes !== undefined && this.availableFireModes.length === 0) {
        this.availableFireModes = def.availableFireModes;
      }
      if (def.waterQuality !== undefined && this.waterQuality === undefined) {
        this.waterQuality = def.waterQuality;
      }
      if (def.beltGrid) {
        this.beltGrid = def.beltGrid;
      }
    }

    // Automatically set default background colors for food and medical items
    if (!this.backgroundColor) {
      if (this.hasCategory(ItemCategory.FOOD)) {
        this.backgroundColor = '#006B18';
      } else if (this.hasCategory(ItemCategory.MEDICAL)) {
        this.backgroundColor = '#8a0303';
      }
    }

    // Final fallbacks for mandatory properties if not in def or instance
    if (this.ammoCount === undefined) this.ammoCount = 0;
    if (this.waterQuality === undefined) this.waterQuality = 'clean';
    if (this.isLit === undefined) this.isLit = false;
    if (this.isOn === undefined) this.isOn = false;
    if (this.providesElectricity === undefined) this.providesElectricity = false;
    if (this.fireMode === undefined) this.fireMode = FireMode.SINGLE;

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
    // Stacking
    this.stackable = this.hasTrait(ItemTrait.STACKABLE) || stackable;
    if (stackable && !this.traits.includes(ItemTrait.STACKABLE)) {
      this.traits.push(ItemTrait.STACKABLE);
    }

    // Automatically copy any other custom properties from config
    for (const [key, value] of Object.entries(config)) {
      if (
        value !== undefined &&
        !key.startsWith('_') &&
        key !== 'containerGrid' &&
        key !== 'pocketGrids' &&
        key !== 'attachments' &&
        key !== 'id' &&
        key !== 'components' &&
        // hp/maxHp are gated on the definition above; never copy a stray hp:0
        // that came from an ECS item-entity round-trip onto a non-combat item.
        key !== 'hp' &&
        key !== 'maxHp' &&
        this[key] === undefined
      ) {
        this[key] = value;
      }
    }
  }



  /**
   * Calculate total AP bonus from all active motor/battery pairs
   */
  getMotorizedBonus() {
    if (!this.hasTrait(ItemTrait.WAGON) || !this.attachments) return 0;
    
    let totalBonus = 0;
    const assistValue = this.motorAssistBonus || 0.5;

    // Define potential slot pairs for motorized assistance
    const slotPairs = [
      ['motor', 'battery'],
      ['motor_front', 'battery_front'],
      ['motor_middle', 'battery_middle'],
      ['motor_rear', 'battery_rear']
    ];

    slotPairs.forEach(([motorSlot, batterySlot]) => {
      const motor = this.attachments[motorSlot];
      const battery = this.attachments[batterySlot];
      if (motor && battery && (battery.ammoCount || 0) > 0) {
        totalBonus += assistValue;
      }
    });

    return totalBonus;
  }

  /**
   * Consume battery power from all active motor pairs based on distance traveled
   * @param {number} distance - Distance in tiles
   */
  consumeMotorPower(distance) {
    if (!this.hasTrait(ItemTrait.WAGON) || !this.attachments) return;

    const slotPairs = [
      ['motor', 'battery'],
      ['motor_front', 'battery_front'],
      ['motor_middle', 'battery_middle'],
      ['motor_rear', 'battery_rear']
    ];

    slotPairs.forEach(([motorSlot, batterySlot]) => {
      const motor = this.attachments[motorSlot];
      const battery = this.attachments[batterySlot];
      if (motor && battery && (battery.ammoCount || 0) > 0) {
        battery.ammoCount = Math.max(0, battery.ammoCount - distance);
        // console.log(`[Item] Motorized wagon (${this.name}) consumed ${distance} charges from ${batterySlot}. Remaining: ${battery.ammoCount}`);
      }
    });
  }

  /**
   * Check if the item has any active motorized assist
   */
  isMotorized() {
    return this.getMotorizedBonus() > 0;
  }

  /**
   * Check if the scooter is in ride mode AND has battery power
   */
  isScooterRideActive() {
    if (!this.hasTrait(ItemTrait.SCOOTER)) return false;
    if (!this.scooterMode || this.scooterMode !== 'ride') return false;
    const battery = this.attachments?.['battery'];
    return battery && (battery.ammoCount || 0) > 0;
  }

  /**
   * Consume scooter power in ride mode
   */
  consumeScooterPower(distance) {
    if (!this.hasTrait(ItemTrait.SCOOTER)) return;
    const battery = this.attachments?.['battery'];
    if (battery && (battery.ammoCount || 0) > 0) {
      battery.ammoCount = Math.max(0, battery.ammoCount - distance);
    }
  }

  /**
   * Get scooter ride AP bonus (discount)
   */
  getScooterRideBonus() {
    if (!this.isScooterRideActive()) return 0;
    return this.rideApBonus || 0.5;
  }


  /**
   * Get battery status for all available battery slots
   */
  getBatteryStatuses() {
    if (!this.attachments) return [];
    
    // Find all slots that are intended for batteries
    const batterySlots = this.attachmentSlots?.filter(s => s.id.includes('battery')) || [];
    
    // Legacy fallback for the generic 'battery' slot if not in definition
    if (batterySlots.length === 0 && this.attachments['battery']) {
      batterySlots.push({ id: 'battery', name: 'Power Cell' });
    }

    return batterySlots.map(slot => {
      const battery = this.attachments[slot.id];
      if (!battery) return { slotId: slot.id, name: slot.name, percent: 0, present: false };
      
      const max = battery.capacity || (battery.defId === 'tool.large_battery' ? 100 : 10);
      const percent = (battery.ammoCount / max) * 100;
      return { 
        slotId: slot.id, 
        name: slot.name, 
        percent, 
        present: true,
        ammoCount: battery.ammoCount,
        max
      };
    });
  }

  /**
   * Legacy wrapper for single battery UI or simple checks
   */
  getBatteryCharge() {
    const statuses = this.getBatteryStatuses();
    return statuses.length > 0 ? statuses[0].percent : 0;
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
    this.consumptionSound = def.consumptionSound || this.consumptionSound;

    // Transformation / Growth state synchronization
    this.lifetimeTurns = def.lifetimeTurns !== undefined ? def.lifetimeTurns : null;
    this.transformInto = def.transformInto !== undefined ? def.transformInto : null;
    this.produce = def.produce !== undefined ? def.produce : null;
    this.produceMin = def.produceMin !== undefined ? def.produceMin : undefined;
    this.produceMax = def.produceMax !== undefined ? def.produceMax : undefined;

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



  // Trait checks
  hasTrait(trait) {
    return this.traits.includes(trait);
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

    // 2. Always allow auto-rotation for rectangular items to improve placement success
    return true;
  }

  isContainer() {
    return this.hasTrait?.(ItemTrait.CONTAINER) || !!this._def?.container || !!this._containerGridData || !!this.containerGrid;
  }

  isStackable() {
    return this.hasTrait?.(ItemTrait.STACKABLE) || (this.stackMax && this.stackMax > 1);
  }

  isAmmo() {
    return this.hasCategory(ItemCategory.AMMO);
  }

  isOpenableWhenNested() {
    return this.hasTrait(ItemTrait.OPENABLE_WHEN_NESTED);
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
    if (this.hasTrait(ItemTrait.BATTERY)) return this.ammoCount || 0;
    if (this.hasTrait(ItemTrait.BATTERY_POWERED)) {
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
    if (this.hasTrait(ItemTrait.BATTERY_POWERED)) {
      const battery = this.getBattery();
      if (battery && (battery.ammoCount || 0) >= amount) {
        battery.ammoCount -= amount;
        return true;
      }
      return false;
    }

    // 2. Standalone Battery or Charge-based tool (Lighter) - consume from own ammoCount
    if (this.hasTrait(ItemTrait.BATTERY) || this.hasTrait(ItemTrait.CHARGE_BASED)) {
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



  // --- Faction & combat (turrets) ---

  /** Faction this item belongs to (turrets). Defaults to 'neutral' when unset. */
  getFaction() {
    return this.factionId || 'neutral';
  }

  isAutoTurret() {
    return this.defId === TURRET_DEF_ID;
  }

  /**
   * Whether this item (turret) is hostile toward `target`: per-entity overrides
   * first, then the directional faction stance table. Mirrors Entity.isHostileTo
   * (minus the NPC legacy clause) so turret AI can target uniformly.
   */
  isHostileTo(target) {
    if (!target || target === this) return false;
    const targetFaction = typeof target.getFaction === 'function' ? target.getFaction() : null;
    if (this.hostileOverrides && this.hostileOverrides.size > 0) {
      if (this.hostileOverrides.has(target.id) ||
          this.hostileOverrides.has(target.instanceId) ||
          (targetFaction && this.hostileOverrides.has(targetFaction))) {
        return true;
      }
    }
    return FactionRegistry.isHostile(this.getFaction(), targetFaction);
  }

  /**
   * Turrets not owned by the player (e.g. the town's defenses) are treated as
   * having infinite battery + ammo and stay permanently powered on.
   */
  isInfiniteTurret() {
    return this.isAutoTurret() && this.getFaction() !== 'player';
  }

  /**
   * Apply combat damage to an attackable item (turret). No-op for items without
   * an hp pool. Returns remaining hp.
   */
  takeDamage(amount) {
    if (this.hp === undefined || this.hp === null) return undefined;
    this.hp = Math.max(0, this.hp - amount);
    return this.hp;
  }

  isDead() {
    return this.hp !== undefined && this.hp !== null && this.hp <= 0;
  }

  get isSpoiled() {
    return this.hasTrait(ItemTrait.SPOILABLE) && this.shelfLife !== null && this.shelfLife <= 0;
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
    const oldShelfLife = this.shelfLife;
    const decay = TurnProcessingUtils.processDecay(this);

    if (decay.modified) {
      // 1. Process own spoilage/lifetime events
      if (this.shelfLife === 0 && oldShelfLife > 0 && this.hasTrait(ItemTrait.SPOILABLE)) {
        console.log(`[Item] ${this.name} (${this.instanceId}) has SPOILED!`);
        this.emitEvent('itemSpoiled', { item: this });
      }

      if (this.lifetimeTurns === 0 && this.defId === 'placeable.campfire') {
         // Log or emit for campfire expiry
         console.log(`[Item] ${this.name} (${this.instanceId}) has EXPIRED (lifetimeTurns reached 0)`);
      }
    }

    // Battery-powered hotplate drainage logic
    TurnProcessingUtils.processHotplateDrain(this);

    // Auto turret drainage logic
    TurnProcessingUtils.processAutoTurretDrain(this);
  }

  canLoadAmmo(ammoItem) {
    if (!this.hasTrait(ItemTrait.MAGAZINE) || !ammoItem.hasCategory(ItemCategory.AMMO)) return false;

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
    if (!this.hasTrait(ItemTrait.MAGAZINE) || this.ammoCount <= 0) return { success: false, reason: 'Empty' };

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



  getDisplayAmmoCount() {
    // 1. If it's a water bottle, fuel can, or puddle, hide the number
    if (this.hasTrait(ItemTrait.WATER_CONTAINER) || this.hasTrait(ItemTrait.FUEL_CONTAINER) || this.hasTrait(ItemTrait.WATER_SOURCE)) {
      return null;
    }

    // 2. If it's a magazine, return its ammo count
    if (this.hasTrait(ItemTrait.MAGAZINE)) {
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
        if (attachedMag && attachedMag.hasTrait(ItemTrait.MAGAZINE)) {
          return attachedMag.ammoCount || 0;
        }
        // If it's not a magazine but is ammo (e.g. .357 rounds in a drum), show the stack count
        if (attachedMag && attachedMag.hasCategory(ItemCategory.AMMO)) {
          return attachedMag.stackCount || 0;
        }
        // If no mag/ammo, show 0 per user request
        return 0;
      }
    }

    // 4. If it's battery-powered, show battery charges
    if (this.hasTrait(ItemTrait.BATTERY_POWERED)) {
      const battery = this.getBattery();
      return battery ? (battery.ammoCount || 0) : 0;
    }

    // 5. If it's a standalone battery, show its charge
    if (this.hasTrait(ItemTrait.BATTERY)) {
      return this.ammoCount || 0;
    }
    
    // 6. If it's a book, show global pages left
    if (this.hasTrait(ItemTrait.READABLE)) {
      // Use globalThis.gameEngine as the bridge to global state.
      // Fall back to the book definition's total page count if no live stats exist yet.
      const engine = globalThis.gameEngine;
      const defaultPages = ItemDefs[this.defId]?.totalPages ?? 0;
      return engine?.bookStats?.[this.defId]?.pagesLeft ?? defaultPages;
    }

    // 6. If it's an ignitable item (Torch), show its condition as charges
    if (this.hasTrait(ItemTrait.IGNITABLE)) {
      return this.condition || 0;
    }

    // 7. If it's a charge-based tool (Lighter/Matches), show its ammoCount
    if (this.hasTrait(ItemTrait.CHARGE_BASED)) {
      return this.ammoCount || 0;
    }

    return null;
  }

  getWaterPercent() {
    if (!this.hasTrait(ItemTrait.WATER_CONTAINER) || !this.capacity) return 0;
    return (this.ammoCount / this.capacity) * 100;
  }

  getMeterPercent() {
    if (this.hasTrait(ItemTrait.WATER_CONTAINER)) {
      if (!this.hasTrait(ItemTrait.WATER_SOURCE) || this.defId === 'provision.rain_collector') {
        return this.getWaterPercent();
      }
    }
    if (this.hasTrait(ItemTrait.FUEL_CONTAINER) && this.capacity) return (this.ammoCount / this.capacity) * 100;
    return null;
  }

  getMeterColor() {
    if (this.hasTrait(ItemTrait.WATER_CONTAINER)) {
      return this.waterQuality === 'dirty' ? "#8B4513" : "#60a5fa";
    }
    if (this.hasTrait(ItemTrait.FUEL_CONTAINER)) {
      return "#b8860b"; // Dark Gold
    }
    return null;
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
    if (this.hasTrait(ItemTrait.VEHICLE) || this.hasTrait(ItemTrait.WAGON)) return 'vehicles';
    if (this.hasTrait(ItemTrait.WATER_SOURCE)) return 'environment';
    if (this.hasTrait(ItemTrait.PLANTER) || this.plantsAs || this.defId?.endsWith('_plant') || this.defId === 'provision.hole') return 'farming';
    if (this.hasTrait(ItemTrait.FURNITURE)) return 'furniture';

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
    if (this.hasTrait(ItemTrait.WATER_SOURCE) && this.defId === 'environment.water_puddle') {
      // 1x1 at 10, 2x2 at 20, 3x3 at 30, 4x4 at 40, 5x5 at 50
      return Math.max(1, Math.min(5, Math.ceil(this.ammoCount / 10)));
    }
    const baseWidth = this.rotation === 90 || this.rotation === 270 ? this.height : this.width;
    return Math.max(1, Math.min(20, baseWidth || 1));
  }

  getActualHeight() {
    if (this.hasTrait(ItemTrait.WATER_SOURCE) && this.defId === 'environment.water_puddle') {
      return Math.max(1, Math.min(5, Math.ceil(this.ammoCount / 10)));
    }
    const baseHeight = this.rotation === 90 || this.rotation === 270 ? this.width : this.height;
    return Math.max(1, Math.min(20, baseHeight || 1));
  }

  degrade(amount = null) {
    if (!this.hasTrait(ItemTrait.DEGRADABLE) || this.condition === null) return;

    const finalAmount = amount !== null ? amount : this.fragility;
    this.condition = Math.max(0, this.condition - finalAmount);
    console.debug(`[Item] ${this.name} degraded by ${finalAmount}. Remaining condition: ${this.condition}`);

    if (this.condition <= 0) {
      console.log(`[Item] ${this.name} (${this.instanceId}) has BROKEN!`);
      // Notify container/inventory system to remove/destroy this item if it breaks
      const invManager = window.gameEngine?.inventoryManager;
      if (invManager) {
        invManager.destroyItem(this.instanceId);
      } else if (this._container) {
        this._container.removeItem(this.instanceId);
      }
      this.emitEvent('itemBroken', { item: this });
    }
  }

  isDegradable() {
    return this.hasTrait(ItemTrait.DEGRADABLE) && this.condition !== null;
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
    if (!this.hasTrait(ItemTrait.STACKABLE) || !otherItem.hasTrait(ItemTrait.STACKABLE)) {
      return false;
    }

    // Items MUST have the same definition ID to stack in a single slot
    if (this.defId !== otherItem.getDefId?.() && this.defId !== otherItem.defId) {
      return false;
    }

    // Special rule for Water Bottles: They only stack if they are EMPTY or FULL and levels match
    if (this.hasTrait(ItemTrait.WATER_CONTAINER)) {
      const capacity = this.capacity;
      const ammo = Math.round(this.ammoCount || 0);
      const otherAmmo = Math.round(otherItem.ammoCount || 0);

      const isFull = ammo >= capacity;
      const isEmpty = ammo <= 0;
      const otherIsFull = otherAmmo >= capacity;
      const otherIsEmpty = otherAmmo <= 0;

      // 1. Quality must match (Unless both are empty)
      const myQuality = this.waterQuality || 'clean';
      const otherQuality = otherItem.waterQuality || 'clean';

      console.log(`[Item] Stacking CHECK for ${this.name}: Self=${ammo}/${capacity} (${myQuality}), Other=${otherAmmo}/${capacity} (${otherQuality})`);

      if (!isEmpty && !otherIsEmpty && myQuality !== otherQuality) {
        console.log(`[Item] Stacking REJECT: Water quality mismatch (${myQuality} vs ${otherQuality})`);
        return false;
      }

      // 2. Both must be exactly Full or exactly Empty to stack, and the amounts must be identical
      if (!(isFull || isEmpty) || !(otherIsFull || otherIsEmpty) || ammo !== otherAmmo) {
        console.log(`[Item] Stacking REJECT: Water level mismatch. Self: ${ammo}/${capacity} (Full:${isFull}, Empty:${isEmpty}), Other: ${otherAmmo}/${capacity} (Full:${otherIsFull}, Empty:${otherIsEmpty})`);
        return false;
      }
      console.log(`[Item] Stacking ALLOWED for ${this.name}`);
    }

    // Special rule for Batteries: They only stack if they are EMPTY or FULL
    if (this.hasTrait(ItemTrait.BATTERY)) {
      const ammo = Math.round(this.ammoCount || 0);
      const otherAmmo = Math.round(otherItem.ammoCount || 0);

      // 2. ONLY FULL batteries are stackable (User Rule)
      const isFull = ammo >= (this.capacity || 10);
      const otherIsFull = otherAmmo >= (otherItem.capacity || 10);
      if (!isFull || !otherIsFull || ammo !== otherAmmo) {
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
    if (this.hasTrait(ItemTrait.WATER_CONTAINER) && otherItem.hasTrait(ItemTrait.WATER_CONTAINER)) {
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
    if (this.hasTrait(ItemTrait.BATTERY_POWERED) && otherItem.hasTrait(ItemTrait.BATTERY)) {
      return true;
    }

    return false;
  }

  combineWith(otherItem) {
    if (!this.canCombineWith(otherItem)) return false;

    // 1. Water Bottle Interaction
    if (this.hasTrait(ItemTrait.WATER_CONTAINER) && otherItem.hasTrait(ItemTrait.WATER_CONTAINER)) {
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
    if (this.hasTrait(ItemTrait.BATTERY_POWERED) && otherItem.hasTrait(ItemTrait.BATTERY)) {
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
    if (!this.hasTrait(ItemTrait.STACKABLE) || count >= this.stackCount || count <= 0) {
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

    // New: If this item has a beltGrid definition, initialize it as a container
    if (this.beltGrid) {
      this._containerGridData = {
        id: `${this.instanceId}-grid`,
        name: this.name,
        width: this.beltGrid.width,
        height: this.beltGrid.height,
        allowedCategories: this.beltGrid.allowedCategories,
        allowedItems: this.beltGrid.allowedItems
      };
      return this.initializeContainerGrid();
    }

    return null;
  }

  // Get belt container IDs for equippable belts
  getBeltContainerIds() {
    return this.getBeltContainers().map(c => c.id);
  }

  // Get all containers provided by belt attachments
  getBeltContainers() {
    if (!this.attachmentSlots || this.attachmentSlots.length === 0) {
      return [];
    }

    const containers = [];
    // The order should match the attachmentSlots to keep the UI consistent
    for (const slot of this.attachmentSlots) {
      const attachedItem = this.attachments[slot.id];
      if (attachedItem) {
        const grid = attachedItem.getContainerGrid();
        if (grid) {
          containers.push(grid);
        }
      }
    }
    return containers;
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
        ownerId: this.instanceId, // Ensure ownerId is set for turn skip logic
        isVehicle: this._containerGridData.isVehicle || this.hasTrait(ItemTrait.VEHICLE)
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
  addAttachment(slotId, item) {
    return this.attachItem(slotId, item);
  }

  attachItem(slotId, item) {
    if (!this.attachmentSlots) return null;
    const slot = this.attachmentSlots.find(s => s.id === slotId);
    if (!slot) return null;

    // Validate category compatibility
    if (slot.allowedCategories && slot.allowedCategories.length > 0) {
      const isCompatible = item.categories.some(c => slot.allowedCategories.includes(c));
      if (!isCompatible) return null;
    }

    // Validate specific item ID compatibility
    if (slot.allowedItems && slot.allowedItems.length > 0) {
      if (!slot.allowedItems.includes(item.defId)) return null;
    }

    const ejectedItem = this.attachments[slotId] || null;
    this.attachments[slotId] = item;
    item.isEquipped = true; // Mark as equipped when attached to a weapon
    return ejectedItem || true; // Return ejected item if any, or true for success
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

  static SERIALIZABLE_PROPERTIES = [
    'instanceId', 'defId', 'name', 'imageId', 'renderFullTile', 'width', 'height',
    'rotation', 'x', 'y', 'stackCount', 'stackMax', 'condition', 'capacity',
    'ammoCount', 'equippableSlot', 'isEquipped', 'pocketLayoutId', 'categories',
    'consumptionEffects', 'waterQuality', 'shelfLife', 'lifetimeTurns', 'rarity',
    'combat', 'rangedStats', 'description', 'transformInto', 'produce',
    'backgroundColor', 'isOn', 'providesElectricity', 'fireMode',
    'availableFireModes', 'scooterMode', 'rideApBonus', 'isLit', 'isLocked'
  ];

  // Serialization
  toJSON() {
    const data = {
      type: 'item'
    };

    // Automatically serialize registered properties
    for (const prop of Item.SERIALIZABLE_PROPERTIES) {
      if (this[prop] !== undefined) {
        data[prop] = this[prop];
      }
    }

    // Automatically serialize any other custom/extra property added dynamically
    for (const [key, value] of Object.entries(this)) {
      if (
        key.startsWith('_') ||
        typeof value === 'function' ||
        Item.SERIALIZABLE_PROPERTIES.includes(key) ||
        key === 'containerGrid' ||
        key === 'pocketGrids' ||
        key === 'attachments' ||
        key === 'traits' ||
        key === 'listeners' ||
        key === 'hostileOverrides' ||
        key === 'components'
      ) {
        continue;
      }
      data[key] = value;
    }

    // Serialize faction hostility overrides as a plain array (Set isn't JSON-able)
    if (this.hostileOverrides && this.hostileOverrides.size > 0) {
      data.hostileOverrides = Array.from(this.hostileOverrides);
    }

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
    if (data.type === 'item' && typeof data.hasTrait === 'function') {
      return data;
    }

    // Convert from ECS Entity if needed
    if (data.components && typeof data.hasComponent === 'function') {
      const plainData = data.toJSON ? data.toJSON() : { ...data };
      if (data.hasComponent('Item')) {
        const itemComp = data.getComponent('Item');
        plainData.name = itemComp.name || plainData.name;
        plainData.weight = itemComp.weight !== undefined ? itemComp.weight : plainData.weight;
        plainData.description = itemComp.description || plainData.description;
      }
      if (data.hasComponent('Renderable')) {
        const renderComp = data.getComponent('Renderable');
        plainData.imageId = renderComp.spriteId || plainData.imageId;
        if (renderComp.backgroundColor && renderComp.backgroundColor !== '#000000') {
          plainData.backgroundColor = renderComp.backgroundColor;
        } else if (plainData.backgroundColor === '#000000') {
          plainData.backgroundColor = undefined;
        }
      }
      if (data.hasComponent('MeleeWeapon')) {
        const weaponComp = data.getComponent('MeleeWeapon');
        plainData.combat = plainData.combat || {};
        plainData.combat.damage = plainData.combat.damage || {};
        plainData.combat.damage.max = weaponComp.damage;
      }
      if (data.hasComponent('Consumable')) {
        const consumableComp = data.getComponent('Consumable');
        plainData.nutrition = consumableComp.nutrition !== undefined ? consumableComp.nutrition : plainData.nutrition;
        plainData.hydration = consumableComp.hydration !== undefined ? consumableComp.hydration : plainData.hydration;
      }
      data = plainData;
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
