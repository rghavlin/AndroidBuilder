/**
 * Item Definitions Catalog
 * Static item templates following trait-based model
 */

import { EncumbranceTier, EquipmentSlot, ItemTrait, ItemCategory, Rarity } from './traits.js';

export const ItemDefs = {
  // Backpacks (containers, equippable)
  // Book bag: 3×3 item footprint → 4×5 internal storage
  'backpack.school': {
    id: 'backpack.school',
    name: 'Book Bag',
    rarity: Rarity.UNCOMMON,
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
    rarity: Rarity.RARE,
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
    rarity: Rarity.EXTREMELY_RARE,
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
    rarity: Rarity.COMMON,
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
    rarity: Rarity.UNCOMMON,
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
    rarity: Rarity.COMMON,
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
    rarity: Rarity.UNCOMMON,
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
    rarity: Rarity.COMMON,
    imageId: 'knife', // No extension - loader will append .png
    width: 2,
    height: 1,
    traits: [ItemTrait.EQUIPPABLE, ItemTrait.DEGRADABLE],
    equippableSlot: EquipmentSlot.MELEE,
    categories: [ItemCategory.WEAPON, ItemCategory.TOOL],
    condition: 100,
    combat: {
      hitChance: 0.65,
      damage: { min: 1, max: 4 }
    }
  },

  'weapon.woodenbat': {
    id: 'weapon.woodenbat',
    name: 'Wooden Bat',
    rarity: Rarity.UNCOMMON,
    imageId: 'woodenbat',
    width: 4,
    height: 1,
    traits: [ItemTrait.EQUIPPABLE, ItemTrait.DEGRADABLE],
    equippableSlot: EquipmentSlot.MELEE,
    categories: [ItemCategory.WEAPON],
    condition: 100,
    combat: {
      hitChance: 0.75,
      damage: { min: 1, max: 6 }
    }
  },

  'weapon.2x4': {
    id: 'weapon.2x4',
    name: '2x4',
    rarity: Rarity.COMMON,
    imageId: '2by4',
    width: 4,
    height: 1,
    traits: [ItemTrait.EQUIPPABLE, ItemTrait.DEGRADABLE],
    equippableSlot: EquipmentSlot.MELEE,
    categories: [ItemCategory.WEAPON, ItemCategory.FUEL],
    condition: 100,
    combat: {
      hitChance: 0.65,
      damage: { min: 3, max: 9 }
    }
  },

  'weapon.hammer': {
    id: 'weapon.hammer',
    name: 'Hammer',
    rarity: Rarity.UNCOMMON,
    imageId: 'hammer',
    width: 3,
    height: 2,
    traits: [ItemTrait.EQUIPPABLE, ItemTrait.DEGRADABLE],
    equippableSlot: EquipmentSlot.MELEE,
    categories: [ItemCategory.WEAPON, ItemCategory.TOOL],
    condition: 100,
    combat: {
      hitChance: 0.75,
      damage: { min: 3, max: 10 }
    }
  },
  'weapon.crowbar': {
    id: 'weapon.crowbar',
    name: 'Crowbar',
    rarity: Rarity.UNCOMMON,
    imageId: 'crowbar',
    width: 3,
    height: 2,
    traits: [ItemTrait.EQUIPPABLE, ItemTrait.DEGRADABLE],
    equippableSlot: EquipmentSlot.MELEE,
    categories: [ItemCategory.WEAPON, ItemCategory.TOOL],
    condition: 100,
    combat: {
      hitChance: 0.70,
      damage: { min: 3, max: 9 }
    }
  },

  'weapon.stick': {
    id: 'weapon.stick',
    name: 'Stick',
    rarity: Rarity.COMMON,
    imageId: 'stick',
    width: 4,
    height: 1,
    traits: [ItemTrait.EQUIPPABLE, ItemTrait.DEGRADABLE],
    equippableSlot: EquipmentSlot.MELEE,
    categories: [ItemCategory.WEAPON, ItemCategory.CRAFTING_MATERIAL, ItemCategory.FUEL],
    condition: 100,
    combat: {
      hitChance: 0.60,
      damage: { min: 1, max: 5 }
    }
  },

  'weapon.makeshift_hatchet': {
    id: 'weapon.makeshift_hatchet',
    name: 'Makeshift hatchet',
    rarity: Rarity.COMMON,
    imageId: 'Makeshifthatchet',
    width: 3,
    height: 2,
    traits: [ItemTrait.EQUIPPABLE, ItemTrait.DEGRADABLE],
    equippableSlot: EquipmentSlot.MELEE,
    categories: [ItemCategory.WEAPON],
    condition: 100,
    combat: {
      hitChance: 0.70,
      damage: { min: 3, max: 9 }
    }
  },


  // Firearms (no degradation)
  'weapon.9mmPistol': {
    id: 'weapon.9mmPistol',
    name: '9mm Pistol',
    rarity: Rarity.RARE,
    imageId: '9mm pistol',
    width: 2,
    height: 2,
    traits: [ItemTrait.EQUIPPABLE, ItemTrait.CONTAINER, ItemTrait.OPENABLE_WHEN_NESTED],
    equippableSlot: EquipmentSlot.HANDGUN,
    attachmentSlots: [
      { id: 'barrel', name: 'Barrel', allowedCategories: [ItemCategory.SUPPRESSOR] },
      { id: 'sight', name: 'Optic', allowedCategories: [ItemCategory.LASER_SIGHT] },
      { id: 'ammo', name: 'Magazine', allowedCategories: [ItemCategory.AMMO], allowedItems: ['attachment.9mm_magazine', 'attachment.9mm_extended_magazine'] }
    ],
    rangedStats: {
      damage: { min: 4, max: 10 },
      accuracyFalloff: 0.1,
      minAccuracy: 0.01
    }
  },


  'weapon.sniper_rifle': {
    id: 'weapon.sniper_rifle',
    name: 'Sniper Rifle',
    rarity: Rarity.EXTREMELY_RARE,
    imageId: 'sniper rifle', // Note: space in filename
    width: 5,
    height: 2,
    traits: [ItemTrait.EQUIPPABLE, ItemTrait.CONTAINER, ItemTrait.OPENABLE_WHEN_NESTED],
    equippableSlot: EquipmentSlot.LONG_GUN,
    attachmentSlots: [
      { id: 'barrel', name: 'Barrel', allowedCategories: [ItemCategory.SUPPRESSOR] },
      { id: 'sight', name: 'Optic', allowedCategories: [ItemCategory.RIFLE_SCOPE] },
      { id: 'ammo', name: 'Magazine', allowedCategories: [ItemCategory.AMMO], allowedItems: ['attachment.sniper_magazine'] }
    ],
    rangedStats: {
      damage: { min: 4, max: 20 },
      accuracyFalloff: 0.05,
      minAccuracy: 0.01
    }
  },

  'tool.smallflashlight': {
    id: 'tool.smallflashlight',
    name: 'Small Flashlight',
    rarity: Rarity.UNCOMMON,
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
    rarity: Rarity.UNCOMMON,
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
    rarity: Rarity.RARE,
    imageId: 'toolbox', // No extension - loader will append .png (TODO: Replace with actual ammo box image)
    width: 2,
    height: 2,
    traits: [ItemTrait.CONTAINER, ItemTrait.OPENABLE_WHEN_NESTED],
    containerGrid: { width: 4, height: 3 }
  },
  'container.lunchbox': {
    id: 'container.lunchbox',
    name: 'Lunchbox',
    rarity: Rarity.UNCOMMON,
    imageId: 'lunchbox',
    width: 3,
    height: 2,
    traits: [ItemTrait.CONTAINER, ItemTrait.OPENABLE_WHEN_NESTED],
    containerGrid: {
      width: 4,
      height: 3,
      allowedCategories: [ItemCategory.FOOD]
    }
  },

  // Weapon Attachments
  'attachment.suppressor': {
    id: 'attachment.suppressor',
    name: 'Suppressor',
    rarity: Rarity.RARE,
    imageId: 'suppressor',
    width: 2,
    height: 1,
    traits: [],
    categories: [ItemCategory.SUPPRESSOR]
  },

  'attachment.lasersight': {
    id: 'attachment.lasersight',
    name: 'Laser Sight',
    rarity: Rarity.RARE,
    imageId: 'lasersight',
    width: 1,
    height: 1,
    traits: [],
    categories: [ItemCategory.LASER_SIGHT]
  },

  'attachment.riflescope': {
    id: 'attachment.riflescope',
    name: 'Rifle Scope',
    rarity: Rarity.RARE,
    imageId: 'rifle_scope',
    width: 2,
    height: 1,
    traits: [],
    categories: [ItemCategory.RIFLE_SCOPE]
  },

  'attachment.9mm_magazine': {
    id: 'attachment.9mm_magazine',
    name: '9mm Magazine',
    rarity: Rarity.UNCOMMON,
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
    rarity: Rarity.RARE,
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
    rarity: Rarity.RARE,
    imageId: 'sniper_magazine',
    width: 2,
    height: 1,
    traits: [],
    categories: [ItemCategory.AMMO],
    capacity: 5,
    ammoDefId: 'ammo.sniper'
  },

  // Stackable items
  'ammo.9mm': {
    id: 'ammo.9mm',
    name: '9mm Ammo',
    rarity: Rarity.UNCOMMON,
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
    rarity: Rarity.RARE,
    imageId: 'sniperAmmo', // New box icon matching 9mm style
    width: 1,
    height: 1,
    traits: [ItemTrait.STACKABLE],
    categories: [ItemCategory.AMMO],
    stackMax: 20
  },

  'medical.bandage': {
    id: 'medical.bandage',
    name: 'Bandage',
    rarity: Rarity.UNCOMMON,
    imageId: 'bandage',
    width: 1,
    height: 1,
    traits: [ItemTrait.STACKABLE, ItemTrait.CONSUMABLE],
    categories: [ItemCategory.MEDICAL],
    stackMax: 20,
    consumptionEffects: {
      hp: 5
    }
  },

  'food.cannedsoup': {
    id: 'food.cannedsoup',
    name: 'Canned Soup',
    rarity: Rarity.UNCOMMON,
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
    rarity: Rarity.COMMON,
    imageId: 'waterbottle',
    width: 2,
    height: 1,
    traits: [ItemTrait.STACKABLE, ItemTrait.CONSUMABLE],
    categories: [ItemCategory.FOOD],
    stackMax: 10,
    capacity: 20,
    ammoCount: 20,
    consumptionEffects: {
      hydration: 1
    }
  },
  'food.chips': {
    id: 'food.chips',
    name: 'Potato Chips',
    rarity: Rarity.UNCOMMON,
    imageId: 'chips',
    width: 1,
    height: 1,
    traits: [ItemTrait.STACKABLE, ItemTrait.CONSUMABLE],
    categories: [ItemCategory.FOOD],
    stackMax: 10,
    consumptionEffects: {
      nutrition: 3
    }
  },
  'food.beans': {
    id: 'food.beans',
    name: 'Canned Beans',
    rarity: Rarity.COMMON,
    imageId: 'cannedbeans',
    width: 1,
    height: 1,
    traits: [ItemTrait.STACKABLE, ItemTrait.CONSUMABLE],
    categories: [ItemCategory.FOOD],
    stackMax: 10,
    consumptionEffects: {
      nutrition: 10
    }
  },
  'food.granolabar': {
    id: 'food.granolabar',
    name: 'Granola Bar',
    rarity: Rarity.COMMON,
    imageId: 'granolabar',
    width: 1,
    height: 1,
    traits: [ItemTrait.STACKABLE, ItemTrait.CONSUMABLE],
    categories: [ItemCategory.FOOD],
    stackMax: 10,
    consumptionEffects: {
      nutrition: 6
    }
  },
  'food.honey': {
    id: 'food.honey',
    name: 'Honey',
    rarity: Rarity.UNCOMMON,
    imageId: 'honey',
    width: 1,
    height: 1,
    traits: [ItemTrait.STACKABLE, ItemTrait.CONSUMABLE],
    categories: [ItemCategory.FOOD],
    stackMax: 10,
    consumptionEffects: {
      nutrition: 4
    }
  },
  'food.mre': {
    id: 'food.mre',
    name: 'MRE',
    rarity: Rarity.RARE,
    imageId: 'mre',
    width: 1,
    height: 1,
    traits: [ItemTrait.STACKABLE, ItemTrait.CONSUMABLE],
    categories: [ItemCategory.FOOD],
    stackMax: 10,
    consumptionEffects: {
      nutrition: 20
    }
  },

  'crafting.stone': {
    id: 'crafting.stone',
    name: 'Stone',
    rarity: Rarity.COMMON,
    imageId: 'stone',
    width: 1,
    height: 1,
    traits: [ItemTrait.STACKABLE],
    categories: [ItemCategory.CRAFTING_MATERIAL],
    stackMax: 50
  },
  'crafting.tape': {
    id: 'crafting.tape',
    name: 'Tape',
    rarity: Rarity.COMMON,
    imageId: 'tape',
    width: 1,
    height: 1,
    traits: [ItemTrait.STACKABLE],
    categories: [ItemCategory.TOOL, ItemCategory.CRAFTING_MATERIAL],
    stackMax: 20
  },
  'crafting.wire': {
    id: 'crafting.wire',
    name: 'Wire',
    rarity: Rarity.COMMON,
    imageId: 'wire',
    width: 1,
    height: 1,
    traits: [ItemTrait.STACKABLE],
    categories: [ItemCategory.TOOL, ItemCategory.CRAFTING_MATERIAL],
    stackMax: 20
  },
  'crafting.rag': {
    id: 'crafting.rag',
    name: 'Rag',
    rarity: Rarity.COMMON,
    imageId: 'rag',
    width: 1,
    height: 1,
    traits: [ItemTrait.STACKABLE],
    categories: [ItemCategory.CRAFTING_MATERIAL, ItemCategory.FUEL],
    stackMax: 50
  },
  'tool.lighter': {
    id: 'tool.lighter',
    name: 'Lighter',
    rarity: Rarity.UNCOMMON,
    imageId: 'lighter',
    width: 1,
    height: 1,
    traits: [],
    categories: [ItemCategory.TOOL],
    stackMax: 1,
    capacity: 10,
    ammoCount: 10
  },
  'tool.matchbook': {
    id: 'tool.matchbook',
    name: 'Matchbook',
    rarity: Rarity.UNCOMMON,
    imageId: 'matchbook',
    width: 1,
    height: 1,
    traits: [],
    categories: [ItemCategory.TOOL],
    stackMax: 1,
    capacity: 15,
    ammoCount: 15
  },
  'tool.cooking_pot': {
    id: 'tool.cooking_pot',
    name: 'Cooking pot',
    rarity: Rarity.COMMON,
    imageId: 'cookingpot',
    width: 2,
    height: 2,
    traits: [],
    categories: [ItemCategory.TOOL, ItemCategory.COOKING_POT]
  },

  'placeable.campfire': {
    id: 'placeable.campfire',
    name: 'Campfire',
    rarity: Rarity.COMMON,
    imageId: 'campfire',
    width: 4,
    height: 4,
    traits: [ItemTrait.CONTAINER, ItemTrait.GROUND_ONLY],
    containerGrid: {
      width: 4,
      height: 4,
      allowedCategories: [ItemCategory.FOOD]
    },
    // Specialized slots (handled by specialized UI)
    attachmentSlots: [
      { id: 'pot', name: 'Cooking Pot', allowedCategories: [ItemCategory.COOKING_POT] },
      { id: 'fuel', name: 'Fuel', allowedCategories: [ItemCategory.FUEL] }
    ]
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