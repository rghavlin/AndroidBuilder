/**
 * Item Definitions Catalog
 * Static item templates following trait-based model
 */

import { EncumbranceTier, EquipmentSlot, ItemTrait, ItemCategory } from './traits.js';

export const ItemDefs = {
  // Backpacks (containers, equippable)
  // Book bag: 3×3 item footprint → 4×5 internal storage
  'backpack.school': {
    id: 'backpack.school',
    name: 'Book Bag',
    imageId: 'bookBag', // No extension - loader will append .png
    width: 3,
    height: 3,
    traits: [ItemTrait.EQUIPPABLE, ItemTrait.CONTAINER],
    equippableSlot: EquipmentSlot.BACKPACK,
    containerGrid: { width: 4, height: 5 }
  },

  // Standard backpack: 4×4 item footprint → 5×7 internal storage
  'backpack.standard': {
    id: 'backpack.standard',
    name: 'Standard Backpack',
    imageId: 'standardBackpack', // No extension - loader will append .png
    width: 4,
    height: 4,
    traits: [ItemTrait.EQUIPPABLE, ItemTrait.CONTAINER],
    equippableSlot: EquipmentSlot.BACKPACK,
    containerGrid: { width: 5, height: 7 }
  },

  // Hiking backpack: 5×5 item footprint → 6×10 internal storage
  'backpack.hiking': {
    id: 'backpack.hiking',
    name: 'Hiking Backpack',
    imageId: 'hikingBackpack', // No extension - loader will append .png
    width: 5,
    height: 5,
    traits: [ItemTrait.EQUIPPABLE, ItemTrait.CONTAINER],
    equippableSlot: EquipmentSlot.BACKPACK,
    containerGrid: { width: 6, height: 10 }
  },

  // Clothing - Upper Body

  'clothing.pocket_t': {
    id: 'clothing.pocket_t',
    name: 'Pocket T-Shirt',
    imageId: 'pocket-t', // Image: pocket-t.png
    width: 1,
    height: 1,
    traits: [ItemTrait.EQUIPPABLE, ItemTrait.CONTAINER],
    equippableSlot: EquipmentSlot.UPPER_BODY,
    encumbranceTier: EncumbranceTier.LIGHT,
    pocketLayoutId: 'pocket_tee'
  },

  'clothing.workshirt': {
    id: 'clothing.workshirt',
    name: 'Work Shirt',
    imageId: 'workshirt', // Image: workshirt.png
    width: 1,
    height: 1,
    traits: [ItemTrait.EQUIPPABLE, ItemTrait.CONTAINER],
    equippableSlot: EquipmentSlot.UPPER_BODY,
    encumbranceTier: EncumbranceTier.LIGHT,
    pocketLayoutId: 'work_shirt'
  },



  // Clothing - Lower Body

  'clothing.sweatpants': {
    id: 'clothing.sweatpants',
    name: 'Sweatpants',
    imageId: 'sweatpants', // Image: sweatpants.png
    width: 1,
    height: 1,
    traits: [ItemTrait.EQUIPPABLE, ItemTrait.CONTAINER],
    equippableSlot: EquipmentSlot.LOWER_BODY,
    encumbranceTier: EncumbranceTier.LIGHT,
    pocketLayoutId: 'sweatpants'
  },

  'clothing.cargopants': {
    id: 'clothing.cargopants',
    name: 'Cargo Pants',
    imageId: 'cargopants', // Image: cargopants.png
    width: 1,
    height: 1,
    traits: [ItemTrait.EQUIPPABLE, ItemTrait.CONTAINER],
    equippableSlot: EquipmentSlot.LOWER_BODY,
    encumbranceTier: EncumbranceTier.MEDIUM,
    pocketLayoutId: 'cargo_pants'
  },



  // Melee Weapons (degradable)
  'weapon.knife': {
    id: 'weapon.knife',
    name: 'Knife',
    imageId: 'knife', // No extension - loader will append .png
    width: 2,
    height: 1,
    traits: [ItemTrait.EQUIPPABLE, ItemTrait.DEGRADABLE],
    equippableSlot: EquipmentSlot.MELEE,
    categories: [ItemCategory.WEAPON, ItemCategory.TOOL],
    condition: 100
  },

  'weapon.woodenbat': {
    id: 'weapon.woodenbat',
    name: 'Wooden Bat',
    imageId: 'woodenbat',
    width: 4,
    height: 1,
    traits: [ItemTrait.EQUIPPABLE, ItemTrait.DEGRADABLE],
    equippableSlot: EquipmentSlot.MELEE,
    categories: [ItemCategory.WEAPON],
    condition: 100
  },


  // Firearms (no degradation)
  'weapon.9mmPistol': {
    id: 'weapon.9mmPistol',
    name: '9mm Pistol',
    imageId: '9mm pistol',
    width: 2,
    height: 2,
    traits: [ItemTrait.EQUIPPABLE, ItemTrait.CONTAINER, ItemTrait.OPENABLE_WHEN_NESTED],
    equippableSlot: EquipmentSlot.HANDGUN,
    attachmentSlots: [
      { id: 'barrel', name: 'Barrel', allowedCategories: [ItemCategory.SUPPRESSOR] },
      { id: 'sight', name: 'Optic', allowedCategories: [ItemCategory.LASER_SIGHT] },
      { id: 'ammo', name: 'Magazine', allowedCategories: [ItemCategory.AMMO], allowedItems: ['attachment.9mm_magazine', 'attachment.9mm_extended_magazine'] }
    ]
  },


  'weapon.sniper_rifle': {
    id: 'weapon.sniper_rifle',
    name: 'Sniper Rifle',
    imageId: 'sniper rifle', // Note: space in filename
    width: 5,
    height: 2,
    traits: [ItemTrait.EQUIPPABLE, ItemTrait.CONTAINER, ItemTrait.OPENABLE_WHEN_NESTED],
    equippableSlot: EquipmentSlot.LONG_GUN,
    attachmentSlots: [
      { id: 'barrel', name: 'Barrel', allowedCategories: [ItemCategory.SUPPRESSOR] },
      { id: 'sight', name: 'Optic', allowedCategories: [ItemCategory.RIFLE_SCOPE] },
      { id: 'ammo', name: 'Magazine', allowedCategories: [ItemCategory.AMMO], allowedItems: ['attachment.sniper_magazine'] }
    ]
  },

  'tool.smallflashlight': {
    id: 'tool.smallflashlight',
    name: 'Small Flashlight',
    imageId: 'smallflashlight',
    width: 2,
    height: 1,
    traits: [ItemTrait.EQUIPPABLE, ItemTrait.DEGRADABLE],
    equippableSlot: EquipmentSlot.FLASHLIGHT,
    categories: [ItemCategory.TOOL],
    condition: 100
  },

  // Specialty Containers (openable when nested)
  'container.toolbox': {
    id: 'container.toolbox',
    name: 'Tool Box',
    imageId: 'toolbox', // No extension - loader will append .png
    width: 2,
    height: 2,
    traits: [ItemTrait.CONTAINER, ItemTrait.OPENABLE_WHEN_NESTED],
    containerGrid: {
      width: 4,
      height: 3,
      allowedCategories: [ItemCategory.TOOL]
    }
  },

  'container.ammo_box': {
    id: 'container.ammo_box',
    name: 'Ammo Box',
    imageId: 'toolbox', // No extension - loader will append .png (TODO: Replace with actual ammo box image)
    width: 2,
    height: 2,
    traits: [ItemTrait.CONTAINER, ItemTrait.OPENABLE_WHEN_NESTED],
    containerGrid: { width: 4, height: 3 }
  },

  // Weapon Attachments
  'attachment.suppressor': {
    id: 'attachment.suppressor',
    name: 'Suppressor',
    imageId: 'suppressor',
    width: 2,
    height: 1,
    traits: [],
    categories: [ItemCategory.SUPPRESSOR]
  },

  'attachment.lasersight': {
    id: 'attachment.lasersight',
    name: 'Laser Sight',
    imageId: 'lasersight',
    width: 1,
    height: 1,
    traits: [],
    categories: [ItemCategory.LASER_SIGHT]
  },

  'attachment.riflescope': {
    id: 'attachment.riflescope',
    name: 'Rifle Scope',
    imageId: 'rifle_scope',
    width: 2,
    height: 1,
    traits: [],
    categories: [ItemCategory.RIFLE_SCOPE]
  },

  'attachment.9mm_magazine': {
    id: 'attachment.9mm_magazine',
    name: '9mm Magazine',
    imageId: '9mm_magazine',
    width: 1,
    height: 1,
    traits: [],
    categories: [ItemCategory.AMMO],
    capacity: 10,
    ammoDefId: 'ammo.9mm'
  },
  'attachment.9mm_extended_magazine': {
    id: 'attachment.9mm_extended_magazine',
    name: '9mm Extended Magazine',
    imageId: '9mm_extended_magazine',
    width: 2,
    height: 1,
    traits: [],
    categories: [ItemCategory.AMMO],
    capacity: 20,
    ammoDefId: 'ammo.9mm'
  },
  'attachment.sniper_magazine': {
    id: 'attachment.sniper_magazine',
    name: 'Sniper Magazine',
    imageId: 'sniper_magazine',
    width: 2,
    height: 1,
    traits: [],
    categories: [ItemCategory.AMMO],
    capacity: 10,
    ammoDefId: 'ammo.sniper'
  },

  // Stackable items
  'ammo.9mm': {
    id: 'ammo.9mm',
    name: '9mm Ammo',
    imageId: '9mmAmmo', // No extension - loader will append .png
    width: 1,
    height: 1,
    traits: [ItemTrait.STACKABLE],
    categories: [ItemCategory.AMMO],
    stackMax: 50
  },
  'ammo.sniper': {
    id: 'ammo.sniper',
    name: 'Sniper Ammo',
    imageId: 'sniper rifle', // Temporary until we have a real one
    width: 1,
    height: 1,
    traits: [ItemTrait.STACKABLE],
    categories: [ItemCategory.AMMO],
    stackMax: 20
  },

  'medical.bandage': {
    id: 'medical.bandage',
    name: 'Bandage',
    imageId: 'bandage',
    width: 1,
    height: 1,
    traits: [ItemTrait.STACKABLE, ItemTrait.CONSUMABLE],
    stackMax: 20
  },

  'food.cannedsoup': {
    id: 'food.cannedsoup',
    name: 'Canned Soup',
    imageId: 'cannedsoup',
    width: 1,
    height: 1,
    traits: [ItemTrait.STACKABLE, ItemTrait.CONSUMABLE],
    categories: [ItemCategory.FOOD],
    stackMax: 10,
    consumptionEffects: {
      nutrition: 5,
      hydration: 2
    }
  },

  'food.waterbottle': {
    id: 'food.waterbottle',
    name: 'Water Bottle',
    imageId: 'waterbottle',
    width: 2,
    height: 1,
    traits: [ItemTrait.CONSUMABLE],
    categories: [ItemCategory.FOOD],
    consumptionEffects: {
      hydration: 10
    }
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