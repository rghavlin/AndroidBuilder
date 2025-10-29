
/**
 * Item Definitions Catalog
 * Static item templates following trait-based model
 */

import { EncumbranceTier, EquipmentSlot, ItemTrait } from './traits.js';

export const ItemDefs = {
  // Backpacks (containers, equippable)
  'backpack.school': {
    id: 'backpack.school',
    name: 'School Backpack',
    imageId: 'bookBag',
    width: 3,
    height: 3,
    traits: [ItemTrait.EQUIPPABLE, ItemTrait.CONTAINER],
    equippableSlot: EquipmentSlot.BACKPACK,
    containerGrid: { width: 6, height: 8 }
  },
  
  'backpack.hiking': {
    id: 'backpack.hiking',
    name: 'Hiking Backpack',
    imageId: 'hikingBackpack',
    width: 3,
    height: 4,
    traits: [ItemTrait.EQUIPPABLE, ItemTrait.CONTAINER],
    equippableSlot: EquipmentSlot.BACKPACK,
    containerGrid: { width: 8, height: 10 }
  },

  // Clothing - Upper Body
  'clothing.tshirt': {
    id: 'clothing.tshirt',
    name: 'T-Shirt',
    width: 2,
    height: 2,
    traits: [ItemTrait.EQUIPPABLE],
    equippableSlot: EquipmentSlot.UPPER_BODY,
    encumbranceTier: EncumbranceTier.LIGHT
  },

  'clothing.jacket': {
    id: 'clothing.jacket',
    name: 'Jacket',
    width: 2,
    height: 3,
    traits: [ItemTrait.EQUIPPABLE],
    equippableSlot: EquipmentSlot.UPPER_BODY,
    encumbranceTier: EncumbranceTier.MEDIUM
  },

  'clothing.tactical_vest': {
    id: 'clothing.tactical_vest',
    name: 'Tactical Vest',
    width: 2,
    height: 3,
    traits: [ItemTrait.EQUIPPABLE, ItemTrait.CONTAINER],
    equippableSlot: EquipmentSlot.UPPER_BODY,
    encumbranceTier: EncumbranceTier.HEAVY,
    containerGrid: { width: 4, height: 2 }
  },

  // Clothing - Lower Body
  'clothing.jeans': {
    id: 'clothing.jeans',
    name: 'Jeans',
    width: 2,
    height: 2,
    traits: [ItemTrait.EQUIPPABLE],
    equippableSlot: EquipmentSlot.LOWER_BODY,
    encumbranceTier: EncumbranceTier.LIGHT
  },

  'clothing.cargo_pants': {
    id: 'clothing.cargo_pants',
    name: 'Cargo Pants',
    width: 2,
    height: 3,
    traits: [ItemTrait.EQUIPPABLE, ItemTrait.CONTAINER],
    equippableSlot: EquipmentSlot.LOWER_BODY,
    encumbranceTier: EncumbranceTier.MEDIUM,
    containerGrid: { width: 2, height: 2 }
  },

  // Melee Weapons (degradable)
  'weapon.knife': {
    id: 'weapon.knife',
    name: 'Knife',
    imageId: 'knife',
    width: 1,
    height: 2,
    traits: [ItemTrait.EQUIPPABLE, ItemTrait.DEGRADABLE],
    equippableSlot: EquipmentSlot.MELEE,
    condition: 100
  },

  'weapon.baseball_bat': {
    id: 'weapon.baseball_bat',
    name: 'Baseball Bat',
    imageId: 'woodbat',
    width: 1,
    height: 3,
    traits: [ItemTrait.EQUIPPABLE, ItemTrait.DEGRADABLE],
    equippableSlot: EquipmentSlot.MELEE,
    condition: 100
  },

  // Firearms (no degradation)
  'weapon.pistol': {
    id: 'weapon.pistol',
    name: '9mm Pistol',
    width: 2,
    height: 1,
    traits: [ItemTrait.EQUIPPABLE],
    equippableSlot: EquipmentSlot.HANDGUN
  },

  'weapon.rifle': {
    id: 'weapon.rifle',
    name: 'Rifle',
    width: 1,
    height: 4,
    traits: [ItemTrait.EQUIPPABLE],
    equippableSlot: EquipmentSlot.LONG_GUN
  },

  // Flashlight
  'tool.flashlight': {
    id: 'tool.flashlight',
    name: 'Flashlight',
    width: 1,
    height: 2,
    traits: [ItemTrait.EQUIPPABLE, ItemTrait.DEGRADABLE],
    equippableSlot: EquipmentSlot.FLASHLIGHT,
    condition: 100
  },

  // Specialty Containers (openable when nested)
  'container.lunchbox': {
    id: 'container.lunchbox',
    name: 'Lunchbox',
    imageId: 'toolbox',
    width: 2,
    height: 1,
    traits: [ItemTrait.CONTAINER, ItemTrait.OPENABLE_WHEN_NESTED],
    containerGrid: { width: 3, height: 2 }
  },

  'container.ammo_box': {
    id: 'container.ammo_box',
    name: 'Ammo Box',
    imageId: 'toolbox',
    width: 2,
    height: 2,
    traits: [ItemTrait.CONTAINER, ItemTrait.OPENABLE_WHEN_NESTED],
    containerGrid: { width: 4, height: 3 }
  },

  // Stackable items
  'ammo.9mm': {
    id: 'ammo.9mm',
    name: '9mm Ammo',
    width: 1,
    height: 1,
    traits: [ItemTrait.STACKABLE],
    stackMax: 50
  },

  'medical.bandage': {
    id: 'medical.bandage',
    name: 'Bandage',
    width: 1,
    height: 1,
    traits: [ItemTrait.STACKABLE],
    stackMax: 10
  },

  'food.canned': {
    id: 'food.canned',
    name: 'Canned Food',
    width: 1,
    height: 1,
    traits: [ItemTrait.STACKABLE],
    stackMax: 6
  }
};

// Factory function to create item instances from definitions
export function createItemFromDef(defId, overrides = {}) {
  const def = ItemDefs[defId];
  if (!def) {
    console.warn(`[ItemDefs] Definition not found: ${defId}`);
    return null;
  }

  return {
    instanceId: `${defId}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    defId,
    ...def,
    ...overrides
  };
}
