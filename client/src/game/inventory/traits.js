
/**
 * Item Trait System - Defines item capabilities and properties
 */

// Encumbrance tiers for clothing
export const EncumbranceTier = {
  LIGHT: 'light',    // +2 evade, +0 AP
  MEDIUM: 'medium',  // +0 evade, -1 AP
  HEAVY: 'heavy'     // -2 evade, -2 AP
};

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
  AMMO: 'ammo',
  CLOTHING: 'clothing',
  SUPPRESSOR: 'suppressor',
  LASER_SIGHT: 'laser_sight',
  RIFLE_SCOPE: 'rifle_scope',
  CHOKE: 'choke',
  CRAFTING_MATERIAL: 'crafting_material'
};

// Trait flags
export const ItemTrait = {
  STACKABLE: 'stackable',
  DEGRADABLE: 'degradable',
  OPENABLE_WHEN_NESTED: 'openableWhenNested',
  CONTAINER: 'container',
  EQUIPPABLE: 'equippable',
  CONSUMABLE: 'consumable'
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

// Encumbrance modifiers
export const EncumbranceModifiers = {
  [EncumbranceTier.LIGHT]: { evade: 2, ap: 0 },
  [EncumbranceTier.MEDIUM]: { evade: 0, ap: -1 },
  [EncumbranceTier.HEAVY]: { evade: -2, ap: -2 }
};
