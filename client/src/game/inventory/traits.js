
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

// Trait flags
export const ItemTrait = {
  STACKABLE: 'stackable',
  DEGRADABLE: 'degradable',
  OPENABLE_WHEN_NESTED: 'openableWhenNested',
  CONTAINER: 'container',
  EQUIPPABLE: 'equippable'
};

// Encumbrance modifiers
export const EncumbranceModifiers = {
  [EncumbranceTier.LIGHT]: { evade: 2, ap: 0 },
  [EncumbranceTier.MEDIUM]: { evade: 0, ap: -1 },
  [EncumbranceTier.HEAVY]: { evade: -2, ap: -2 }
};
