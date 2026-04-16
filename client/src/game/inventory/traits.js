
/**
 * Item Trait System - Defines item capabilities and properties
 */


// Equipment slot definitions (exactly these)
export const EquipmentSlot = {
  BACKPACK: 'backpack',
  UPPER_BODY: 'upper_body',
  LOWER_BODY: 'lower_body',
  MELEE: 'melee',
  HANDGUN: 'handgun',
  LONG_GUN: 'long_gun',
  FLASHLIGHT: 'flashlight'
};

// Item categories for container restrictions
export const ItemCategory = {
  FOOD: 'food',
  TOOL: 'tool',
  WEAPON: 'weapon',
  MEDICAL: 'medical',
  BATTERY: 'battery',
  AMMO: 'ammo',
  CLOTHING: 'clothing',
  SUPPRESSOR: 'suppressor',
  LASER_SIGHT: 'laser_sight',
  RIFLE_SCOPE: 'rifle_scope',
  CHOKE: 'choke',
  CRAFTING_MATERIAL: 'crafting_material',
  COOKING_POT: 'cooking_pot',
  FUEL: 'fuel',
  KNIFE: 'knife',
  TORCH: 'torch',
  GUN: 'gun',
  VEGETABLE: 'vegetable'
};

// Trait flags
export const ItemTrait = {
  STACKABLE: 'stackable',
  DEGRADABLE: 'degradable',
  BATTERY: 'battery',
  BATTERY_POWERED: 'battery-powered',
  OPENABLE_WHEN_NESTED: 'openable-when-nested',
  CONTAINER: 'container',
  EQUIPPABLE: 'equippable',
  CONSUMABLE: 'consumable',
  GROUND_ONLY: 'groundOnly',
  CAN_BREAK_DOORS: 'canBreakDoors',
  SPOILABLE: 'spoilable',
  IGNITABLE: 'ignitable',
  CAN_DIG: 'canDig',
  CHARGE_BASED: 'charge-based',
  WATER_CONTAINER: 'water_bottle'
};

// Item rarity levels for loot generation
export const Rarity = {
  COMMON: 'common',
  UNCOMMON: 'uncommon',
  RARE: 'rare',
  EXTREMELY_RARE: 'extremely_rare'
};

// Spawn weights for LootGenerator
export const RarityWeights = {
  [Rarity.COMMON]: 100,
  [Rarity.UNCOMMON]: 40,
  [Rarity.RARE]: 10,
  [Rarity.EXTREMELY_RARE]: 1
};

// Map internal categories to user-friendly group names
export const CategoryDisplayName = {
  [ItemCategory.WEAPON]: 'weapons',
  [ItemCategory.AMMO]: 'ammunition',
  [ItemCategory.TOOL]: 'tools',
  [ItemCategory.CLOTHING]: 'armor',
  [ItemCategory.FOOD]: 'consumables',
  [ItemCategory.MEDICAL]: 'consumables',
  [ItemCategory.GUN]: 'weapons'
};

// Map equipment slots to user-friendly category fallbacks
export const SlotDisplayName = {
  [EquipmentSlot.MELEE]: 'weapons',
  [EquipmentSlot.HANDGUN]: 'weapons',
  [EquipmentSlot.LONG_GUN]: 'weapons',
  [EquipmentSlot.UPPER_BODY]: 'armor',
  [EquipmentSlot.LOWER_BODY]: 'armor',
  [EquipmentSlot.BACKPACK]: 'containers'
};

