/**
 * Item Definitions Catalog
 * Static item templates following trait-based model
 */

import { EquipmentSlot, ItemTrait, ItemCategory, Rarity } from './traits.js';

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

  'backpack.makeshift': {
    id: 'backpack.makeshift',
    name: 'Makeshift pack',
    noLoot: true,
    rarity: Rarity.COMMON,
    imageId: 'makeshiftpack',
    width: 3,
    height: 3,
    traits: [ItemTrait.EQUIPPABLE, ItemTrait.CONTAINER],
    equippableSlot: EquipmentSlot.BACKPACK,
    containerGrid: { width: 4, height: 4 }
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

  // Toy Wagon: 4x6 Ground Container / Furniture
  'toy_wagon': {
    id: 'toy_wagon',
    name: 'Toy Wagon',
    noLoot: true,
    rarity: Rarity.UNCOMMON,
    imageId: 'toywagon',
    width: 4,
    height: 6,
    traits: [ItemTrait.DRAGGABLE, ItemTrait.GROUND_ONLY, ItemTrait.CONTAINER],
    isFurniture: true,
    dragApPenalty: 1,
    renderFullTile: true,
    isWagon: true,
    containerGrid: { width: 4, height: 5, isVehicle: true },
    attachmentSlots: [
      { id: 'motor', name: 'Electric Motor', allowedItems: ['electric_motor'] },
      { id: 'battery', name: 'Power Cell', allowedCategories: [ItemCategory.LARGE_BATTERY], allowedItems: ['tool.large_battery'] }
    ],
    disassembleData: {
      toolId: 'weapon.wrench',
      apCost: 10,
      components: [
        { id: 'crafting.wheel', count: 4 },
        { id: 'weapon.metal_rod', count: 2 },
        { id: 'crafting.metal_plate', count: 1 }
      ]
    }
  },
  'furniture.planter_box': {
    id: 'furniture.planter_box',
    name: 'Planter box',
    noLoot: true,
    rarity: Rarity.UNCOMMON,
    imageId: 'planterbox',
    width: 3,
    height: 3,
    traits: [ItemTrait.DRAGGABLE, ItemTrait.GROUND_ONLY, ItemTrait.CONTAINER, ItemTrait.OPENABLE_WHEN_NESTED],
    isFurniture: true,
    isPlanter: true,
    containerGrid: { width: 2, height: 2, isPlanter: true },
  },
  'electric_motor': {
    id: 'electric_motor',
    name: 'Electric motor',
    noLoot: true,
    rarity: Rarity.RARE,
    imageId: 'electricmotor',
    width: 2,
    height: 2,
    traits: [],
    categories: [ItemCategory.CRAFTING_MATERIAL]
  },
  'crafting.mower_blade': {
    id: 'crafting.mower_blade',
    name: 'Mower blade',
    noLoot: true,
    rarity: Rarity.RARE,
    imageId: 'mowerblade',
    width: 3,
    height: 1,
    traits: [],
    categories: [ItemCategory.CRAFTING_MATERIAL]
  },
  'crafting.nail': {
    id: 'crafting.nail',
    name: 'Nail',
    rarity: Rarity.COMMON,
    imageId: 'nail',
    width: 1,
    height: 1,
    traits: [ItemTrait.STACKABLE],
    categories: [ItemCategory.TOOL, ItemCategory.CRAFTING_MATERIAL],
    stackMax: 100,
    spawnStackMin: 1,
    spawnStackMax: 5
  },

  'crafting.rope': {
    id: 'crafting.rope',
    name: 'Rope',
    rarity: Rarity.UNCOMMON,
    imageId: 'rope',
    width: 2,
    height: 1,
    traits: [ItemTrait.STACKABLE],
    categories: [ItemCategory.CRAFTING_MATERIAL],
    stackMax: 5
  },
  'crafting.garbage_bag': {
    id: 'crafting.garbage_bag',
    name: 'Garbage bag',
    rarity: Rarity.COMMON,
    imageId: 'garbagebag',
    width: 1,
    height: 1,
    traits: [ItemTrait.STACKABLE],
    categories: [ItemCategory.CRAFTING_MATERIAL],
    stackMax: 10
  },
  'crafting.metal_plate': {
    id: 'crafting.metal_plate',
    name: 'Metal plate',
    rarity: Rarity.UNCOMMON,
    imageId: 'metalplate',
    width: 2,
    height: 1,
    traits: [],
    categories: [ItemCategory.CRAFTING_MATERIAL]
  },

  'crafting.soil': {
    id: 'crafting.soil',
    name: 'Soil',
    noLoot: true,
    rarity: Rarity.COMMON,
    imageId: 'soil',
    width: 2,
    height: 1,
    traits: [ItemTrait.STACKABLE],
    categories: [ItemCategory.CRAFTING_MATERIAL],
    stackMax: 10
  },

  'crafting.loose_soil': {
    id: 'crafting.loose_soil',
    name: 'Loose soil',
    noLoot: true,
    rarity: Rarity.COMMON,
    imageId: 'loosesoil',
    width: 2,
    height: 2,
    traits: [ItemTrait.GROUND_ONLY, ItemTrait.DRAGGABLE],
    categories: [ItemCategory.CRAFTING_MATERIAL]
  },

  'crafting.wheel': {
    id: 'crafting.wheel',
    name: 'Wheel',
    rarity: Rarity.RARE,
    imageId: 'wheel',
    width: 2,
    height: 2,
    traits: [ItemTrait.STACKABLE],
    categories: [ItemCategory.CRAFTING_MATERIAL],
    stackMax: 4
  },

  'crafting.feather_padding': {
    id: 'crafting.feather_padding',
    name: 'Feather padding',
    rarity: Rarity.RARE,
    imageId: 'featherpadding',
    width: 3,
    height: 2,
    traits: [],
    categories: [ItemCategory.CRAFTING_MATERIAL]
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
    categories: [ItemCategory.CLOTHING, ItemCategory.FUEL],

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
    categories: [ItemCategory.CLOTHING, ItemCategory.FUEL],
    pocketLayoutId: 'work_shirt'
  },

  'clothing.paramedic_shirt': {
    id: 'clothing.paramedic_shirt',
    name: "Paramedic's shirt",
    rarity: Rarity.RARE,
    imageId: 'paramedicshirt', // Image: paramedicshirt.png
    width: 1,
    height: 1,
    traits: [ItemTrait.EQUIPPABLE, ItemTrait.CONTAINER],
    equippableSlot: EquipmentSlot.UPPER_BODY,
    categories: [ItemCategory.CLOTHING, ItemCategory.FUEL],
    pocketLayoutId: 'paramedic_shirt',
    backgroundColor: '#8a0303'
  },

  'clothing.police_shirt': {
    id: 'clothing.police_shirt',
    name: 'Police shirt',
    rarity: Rarity.RARE,
    imageId: 'policeshirt', // Image: policeshirt.png
    width: 1,
    height: 1,
    traits: [ItemTrait.EQUIPPABLE, ItemTrait.CONTAINER],
    equippableSlot: EquipmentSlot.UPPER_BODY,
    categories: [ItemCategory.CLOTHING, ItemCategory.FUEL],
    pocketLayoutId: 'police_shirt',
    backgroundColor: '#0a2e5c'
  },
  'clothing.military_shirt': {
    id: 'clothing.military_shirt',
    name: 'Military Shirt',
    noLoot: true,
    rarity: Rarity.RARE,
    imageId: 'militaryshirt',
    width: 1,
    height: 1,
    traits: [ItemTrait.EQUIPPABLE, ItemTrait.CONTAINER],
    equippableSlot: EquipmentSlot.UPPER_BODY,
    categories: [ItemCategory.CLOTHING, ItemCategory.FUEL],
    pocketLayoutId: 'military_shirt',
    backgroundColor: '#5C653A'
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
    categories: [ItemCategory.CLOTHING, ItemCategory.FUEL],
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
    categories: [ItemCategory.CLOTHING, ItemCategory.FUEL],
    pocketLayoutId: 'cargo_pants'
  },
  'clothing.blue_jeans': {
    id: 'clothing.blue_jeans',
    name: 'Blue Jeans',
    rarity: Rarity.COMMON,
    imageId: 'jeans',
    width: 1,
    height: 1,
    traits: [ItemTrait.EQUIPPABLE, ItemTrait.CONTAINER],
    equippableSlot: EquipmentSlot.LOWER_BODY,
    categories: [ItemCategory.CLOTHING, ItemCategory.FUEL],
    pocketLayoutId: 'blue_jeans'
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
    categories: [ItemCategory.WEAPON, ItemCategory.TOOL, ItemCategory.KNIFE],
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

  'weapon.spikedbat': {
    id: 'weapon.spikedbat',
    name: 'Spiked Bat',
    noLoot: true,
    rarity: Rarity.UNCOMMON,
    imageId: 'spikedbat',
    width: 4,
    height: 1,
    traits: [ItemTrait.EQUIPPABLE, ItemTrait.DEGRADABLE],
    equippableSlot: EquipmentSlot.MELEE,
    categories: [ItemCategory.WEAPON],
    condition: 100,
    combat: {
      hitChance: 0.85,
      damage: { min: 3, max: 9 }
    }
  },

  'weapon.plank': {
    id: 'weapon.plank',
    name: 'Plank',
    rarity: Rarity.COMMON,
    imageId: 'plank',
    width: 4,
    height: 1,
    traits: [ItemTrait.EQUIPPABLE, ItemTrait.DEGRADABLE],
    equippableSlot: EquipmentSlot.MELEE,
    categories: [ItemCategory.WEAPON, ItemCategory.FUEL],
    condition: 100,
    combat: {
      hitChance: 0.65,
      damage: { min: 1, max: 6 }
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
    categories: [ItemCategory.WEAPON, ItemCategory.TOOL, ItemCategory.HAMMER],
    condition: 100,
    combat: {
      hitChance: 0.70,
      damage: { min: 2, max: 8 }
    }
  },

  'weapon.machete': {
    id: 'weapon.machete',
    name: 'Machete',
    rarity: Rarity.UNCOMMON,
    imageId: 'machete',
    width: 3,
    height: 2,
    traits: [ItemTrait.EQUIPPABLE, ItemTrait.DEGRADABLE],
    equippableSlot: EquipmentSlot.MELEE,
    categories: [ItemCategory.WEAPON],
    condition: 100,
    combat: {
      hitChance: 0.75,
      damage: { min: 3, max: 9 }
    }
  },
  'weapon.crowbar': {
    id: 'weapon.crowbar',
    name: 'Crowbar',
    rarity: Rarity.UNCOMMON,
    imageId: 'crowbar',
    width: 3,
    height: 2,
    traits: [ItemTrait.EQUIPPABLE, ItemTrait.DEGRADABLE, ItemTrait.CAN_BREAK_DOORS],
    equippableSlot: EquipmentSlot.MELEE,
    categories: [ItemCategory.WEAPON, ItemCategory.TOOL],
    condition: 100,
    combat: {
      hitChance: 0.70,
      damage: { min: 2, max: 8 }
    }
  },
  'weapon.fire_axe': {
    id: 'weapon.fire_axe',
    name: 'Fire axe',
    rarity: Rarity.UNCOMMON,
    imageId: 'fireaxe',
    width: 5,
    height: 2,
    traits: [ItemTrait.EQUIPPABLE, ItemTrait.DEGRADABLE, ItemTrait.CAN_BREAK_DOORS],
    equippableSlot: EquipmentSlot.MELEE,
    categories: [ItemCategory.WEAPON, ItemCategory.TOOL],
    condition: 100,
    combat: {
      hitChance: 0.90,
      damage: { min: 5, max: 15 }
    }
  },

  'weapon.shovel': {
    id: 'weapon.shovel',
    name: 'Shovel',
    rarity: Rarity.UNCOMMON,
    imageId: 'shovel',
    width: 5,
    height: 2,
    traits: [ItemTrait.EQUIPPABLE, ItemTrait.DEGRADABLE, ItemTrait.CAN_DIG],
    equippableSlot: EquipmentSlot.MELEE,
    categories: [ItemCategory.WEAPON, ItemCategory.TOOL],
    condition: 100,
    combat: {
      hitChance: 0.75,
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
    spawnBias: { outside: 10, inside: 0 },
    condition: 100,
    combat: {
      hitChance: 0.60,
      damage: { min: 1, max: 5 }
    }
  },

  'weapon.metal_rod': {
    id: 'weapon.metal_rod',
    name: 'Metal rod',
    rarity: Rarity.UNCOMMON,
    imageId: 'metalrod',
    width: 4,
    height: 1,
    traits: [ItemTrait.EQUIPPABLE, ItemTrait.DEGRADABLE],
    equippableSlot: EquipmentSlot.MELEE,
    categories: [ItemCategory.WEAPON],
    condition: 100,
    combat: {
      hitChance: 0.65,
      damage: { min: 2, max: 7 }
    }
  },

  'weapon.wrench': {
    id: 'weapon.wrench',
    name: 'Wrench',
    rarity: Rarity.UNCOMMON,
    imageId: 'wrench',
    width: 2,
    height: 1,
    traits: [ItemTrait.EQUIPPABLE, ItemTrait.DEGRADABLE],
    equippableSlot: EquipmentSlot.MELEE,
    categories: [ItemCategory.WEAPON, ItemCategory.TOOL],
    condition: 100,
    combat: {
      hitChance: 0.65,
      damage: { min: 1, max: 6 }
    }
  },

  'weapon.makeshift_hammer': {
    id: 'weapon.makeshift_hammer',
    name: 'Makeshift hammer',
    noLoot: true,
    rarity: Rarity.COMMON,
    imageId: 'Makeshifthammer',
    width: 3,
    height: 2,
    traits: [ItemTrait.EQUIPPABLE, ItemTrait.DEGRADABLE],
    equippableSlot: EquipmentSlot.MELEE,
    categories: [ItemCategory.WEAPON, ItemCategory.TOOL, ItemCategory.HAMMER],
    condition: 100,
    fragility: 4,
    combat: {
      hitChance: 0.70,
      damage: { min: 3, max: 9 }
    }
  },
  'weapon.makeshift_knife': {
    id: 'weapon.makeshift_knife',
    name: 'Makeshift knife',
    rarity: Rarity.COMMON,
    imageId: 'makeshiftknife',
    noLoot: true,
    width: 2,
    height: 1,
    traits: [ItemTrait.EQUIPPABLE, ItemTrait.DEGRADABLE],
    equippableSlot: EquipmentSlot.MELEE,
    categories: [ItemCategory.WEAPON, ItemCategory.TOOL, ItemCategory.KNIFE],
    condition: 100,
    fragility: 4,
    combat: {
      hitChance: 0.65,
      damage: { min: 2, max: 5 }
    }
  },
  'weapon.makeshift_shovel': {
    id: 'weapon.makeshift_shovel',
    name: 'Makeshift shovel',
    rarity: Rarity.COMMON,
    imageId: 'makeshiftshovel',
    noLoot: true,
    width: 5,
    height: 2,
    traits: [ItemTrait.EQUIPPABLE, ItemTrait.DEGRADABLE, ItemTrait.CAN_DIG],
    equippableSlot: EquipmentSlot.MELEE,
    categories: [ItemCategory.WEAPON, ItemCategory.TOOL],
    condition: 100,
    fragility: 4,
    combat: {
      hitChance: 0.75,
      damage: { min: 3, max: 9 }
    }
  },
  'weapon.makeshift_machete': {
    id: 'weapon.makeshift_machete',
    name: 'Makeshift machete',
    noLoot: true,
    rarity: Rarity.UNCOMMON,
    imageId: 'makeshiftmachete',
    width: 3,
    height: 1,
    traits: [ItemTrait.EQUIPPABLE, ItemTrait.DEGRADABLE],
    equippableSlot: EquipmentSlot.MELEE,
    categories: [ItemCategory.WEAPON, ItemCategory.KNIFE],
    condition: 100,
    combat: {
      hitChance: 0.70,
      damage: { min: 2, max: 7 }
    }
  },
  'weapon.spear': {
    id: 'weapon.spear',
    name: 'Spear',
    noLoot: true,
    rarity: Rarity.COMMON,
    imageId: 'spear',
    width: 4,
    height: 1,
    traits: [ItemTrait.EQUIPPABLE, ItemTrait.DEGRADABLE],
    equippableSlot: EquipmentSlot.MELEE,
    categories: [ItemCategory.WEAPON],
    condition: 100,
    combat: {
      hitChance: 0.80,
      damage: { min: 4, max: 8 },
      range: 2.1 // Increased reach (2 squares)
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
    categories: [ItemCategory.WEAPON, ItemCategory.GUN],
    attachmentSlots: [
      { id: 'barrel', name: 'Barrel', allowedCategories: [ItemCategory.SUPPRESSOR] },
      { id: 'sight', name: 'Optic', allowedCategories: [ItemCategory.LASER_SIGHT] },
      { id: 'ammo', name: 'Magazine', hidden: true, allowedCategories: [ItemCategory.AMMO], allowedItems: ['attachment.9mm_magazine', 'attachment.9mm_extended_magazine'] }
    ],
    rangedStats: {
      noiseRadius: 12,
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
    categories: [ItemCategory.WEAPON, ItemCategory.GUN],
    attachmentSlots: [
      { id: 'barrel', name: 'Barrel', allowedCategories: [ItemCategory.SUPPRESSOR] },
      { id: 'sight', name: 'Optic', allowedCategories: [ItemCategory.RIFLE_SCOPE] },
      { id: 'ammo', name: 'Magazine', hidden: true, allowedCategories: [ItemCategory.AMMO], allowedItems: ['attachment.sniper_magazine'] }
    ],
    rangedStats: {
      noiseRadius: 22,
      damage: { min: 4, max: 20 },
      accuracyFalloff: 0.05,
      minAccuracy: 0.01
    }
  },
  'weapon.357Pistol': {
    id: 'weapon.357Pistol',
    name: '.357 Pistol',
    rarity: Rarity.RARE,
    imageId: '357',
    width: 2,
    height: 2,
    traits: [ItemTrait.EQUIPPABLE, ItemTrait.CONTAINER, ItemTrait.OPENABLE_WHEN_NESTED],
    equippableSlot: EquipmentSlot.HANDGUN,
    categories: [ItemCategory.WEAPON, ItemCategory.GUN],
    attachmentSlots: [
      { id: 'sight', name: 'Optic', allowedCategories: [ItemCategory.LASER_SIGHT] },
      { id: 'ammo', name: 'Ammo', hidden: true, allowedCategories: [ItemCategory.AMMO], allowedItems: ['ammo.357'] }
    ],
    rangedStats: {
      noiseRadius: 15,
      damage: { min: 5, max: 12 },
      accuracyFalloff: 0.1,
      minAccuracy: 0.01
    },
    spawnMaxRounds: 6
  },
  'weapon.hunting_rifle': {
    id: 'weapon.hunting_rifle',
    name: 'Hunting rifle (308)',
    rarity: Rarity.RARE,
    imageId: 'huntingrifle',
    width: 5,
    height: 2,
    traits: [ItemTrait.EQUIPPABLE, ItemTrait.CONTAINER, ItemTrait.OPENABLE_WHEN_NESTED],
    equippableSlot: EquipmentSlot.LONG_GUN,
    categories: [ItemCategory.WEAPON, ItemCategory.GUN],
    attachmentSlots: [
      { id: 'sight', name: 'Optic', allowedCategories: [ItemCategory.RIFLE_SCOPE, ItemCategory.LASER_SIGHT] },
      { id: 'ammo', name: 'Ammo', hidden: true, allowedCategories: [ItemCategory.AMMO], allowedItems: ['ammo.308'] }
    ],
    rangedStats: {
      noiseRadius: 18,
      damage: { min: 4, max: 15 },
      accuracyFalloff: 0.07,
      minAccuracy: 0.01
    },
    spawnMaxRounds: 4
  },

  'weapon.grenade': {
    id: 'weapon.grenade',
    name: 'Grenade',
    rarity: Rarity.RARE,
    imageId: 'grenade',
    width: 1,
    height: 1,
    traits: [ItemTrait.STACKABLE],
    categories: [ItemCategory.WEAPON],
    stackMax: 10
  },

  'tool.smallflashlight': {
    id: 'tool.smallflashlight',
    name: 'Flashlight',
    rarity: Rarity.UNCOMMON,
    imageId: 'flashlight',
    width: 2,
    height: 1,
    traits: [ItemTrait.EQUIPPABLE, ItemTrait.DEGRADABLE, ItemTrait.BATTERY_POWERED, ItemTrait.OPENABLE_WHEN_NESTED],
    equippableSlot: EquipmentSlot.FLASHLIGHT,
    categories: [ItemCategory.TOOL],
    condition: 100,
    lightRange: 8,
    lightType: 'beam',
    attachmentSlots: [
      { id: 'battery', name: 'Battery', type: 'battery', allowedCategories: [ItemCategory.BATTERY] }
    ]
  },
  'tool.torch': {
    id: 'tool.torch',
    name: 'Torch',
    rarity: Rarity.COMMON,
    imageId: 'torch',
    width: 4,
    height: 1,
    traits: [ItemTrait.EQUIPPABLE, ItemTrait.DEGRADABLE, ItemTrait.IGNITABLE],
    equippableSlot: EquipmentSlot.FLASHLIGHT,
    categories: [ItemCategory.TORCH],
    condition: 10,
    isLit: false,
    lightRange: 5,
    lightType: 'glow',
    noLoot: true // Craftable only
  },
  'tool.battery': {
    id: 'tool.battery',
    name: 'Battery',
    rarity: Rarity.UNCOMMON,
    imageId: 'battery',
    width: 1,
    height: 1,
    traits: [ItemTrait.STACKABLE, ItemTrait.BATTERY],
    categories: [ItemCategory.BATTERY, ItemCategory.TOOL],
    stackMax: 10,
    capacity: 10,
    ammoCount: 10
  },
  'tool.large_battery': {
    id: 'tool.large_battery',
    name: 'Large battery',
    rarity: Rarity.RARE,
    imageId: 'largebattery',
    width: 2,
    height: 1,
    traits: [ItemTrait.STACKABLE, ItemTrait.BATTERY],
    categories: [ItemCategory.LARGE_BATTERY, ItemCategory.TOOL],
    stackMax: 5,
    capacity: 100,
    ammoCount: 100
  },


  // Specialty Containers (openable when nested)
  'tool.nightvision': {
    id: 'tool.nightvision',
    name: 'Night vision goggles',
    rarity: Rarity.EXTREMELY_RARE,
    imageId: 'nightvision',
    width: 2,
    height: 1,
    traits: [ItemTrait.EQUIPPABLE, ItemTrait.DEGRADABLE, ItemTrait.BATTERY_POWERED, ItemTrait.OPENABLE_WHEN_NESTED],
    equippableSlot: EquipmentSlot.FLASHLIGHT,
    categories: [ItemCategory.TOOL],
    condition: 100,
    lightRange: 15,
    lightType: 'nightvision',
    attachmentSlots: [
      { id: 'battery', name: 'Battery', type: 'battery', allowedCategories: [ItemCategory.BATTERY] }
    ]
  },
  'tool.snare_undeployed': {
    id: 'tool.snare_undeployed',
    name: 'Rabbit snare',
    noLoot: true,
    rarity: Rarity.UNCOMMON,
    imageId: 'undeployedsnare',
    width: 2,
    height: 1,
    traits: [ItemTrait.DEGRADABLE],
    categories: [ItemCategory.TOOL],
    condition: 100
  },
  'tool.snare_deployed': {
    id: 'tool.snare_deployed',
    name: 'Deployed snare',
    noLoot: true,
    renderFullTile: true,
    rarity: Rarity.UNCOMMON,
    imageId: 'deployedsnare',
    width: 2,
    height: 2,
    traits: [ItemTrait.DEGRADABLE, ItemTrait.GROUND_ONLY],
    categories: [ItemCategory.TOOL],
    condition: 100
  },
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
    noLoot: true,
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
    width: 2,
    height: 2,
    traits: [ItemTrait.CONTAINER, ItemTrait.OPENABLE_WHEN_NESTED],
    containerGrid: {
      width: 4,
      height: 3,
      allowedCategories: [ItemCategory.FOOD]
    }
  },
  'container.medkit': {
    id: 'container.medkit',
    name: 'Medkit',
    rarity: Rarity.RARE,
    imageId: 'medkit',
    width: 2,
    height: 2,
    traits: [ItemTrait.CONTAINER, ItemTrait.OPENABLE_WHEN_NESTED],
    containerGrid: {
      width: 4,
      height: 3,
      allowedCategories: [ItemCategory.MEDICAL]
    }
  },

  'container.guncase': {
    id: 'container.guncase',
    name: 'Gun case',
    rarity: Rarity.RARE,
    imageId: 'guncase', // Image: guncase.png
    width: 3,
    height: 2,
    traits: [ItemTrait.CONTAINER, ItemTrait.OPENABLE_WHEN_NESTED],
    containerGrid: {
      width: 5,
      height: 4,
      allowedCategories: [
        ItemCategory.GUN,
        ItemCategory.AMMO,
        ItemCategory.SUPPRESSOR,
        ItemCategory.LASER_SIGHT,
        ItemCategory.RIFLE_SCOPE,
        ItemCategory.CHOKE
      ]
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
    traits: [ItemTrait.EQUIPPABLE],
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
    stackMax: 50,
    spawnStackMin: 3,
    spawnStackMax: 6
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
    stackMax: 20,
    spawnStackMin: 3,
    spawnStackMax: 6
  },
  'ammo.357': {
    id: 'ammo.357',
    name: '.357 Ammo',
    rarity: Rarity.UNCOMMON,
    imageId: '357ammo',
    width: 1,
    height: 1,
    traits: [ItemTrait.STACKABLE],
    categories: [ItemCategory.AMMO],
    stackMax: 50,
    spawnStackMin: 3,
    spawnStackMax: 6
  },
  'ammo.308': {
    id: 'ammo.308',
    name: '.308 Ammo',
    rarity: Rarity.UNCOMMON,
    imageId: '308ammo',
    width: 1,
    height: 1,
    traits: [ItemTrait.STACKABLE],
    categories: [ItemCategory.AMMO],
    stackMax: 50,
    spawnStackMin: 3,
    spawnStackMax: 6
  },

  'medical.bandage': {
    id: 'medical.bandage',
    name: 'Bandage',
    rarity: Rarity.COMMON,
    imageId: 'bandage',
    width: 1,
    height: 1,
    traits: [ItemTrait.CONSUMABLE, ItemTrait.STACKABLE],
    categories: [ItemCategory.MEDICAL],
    pileLimitOne: true,
    stackMax: 10,
    consumptionEffects: [
      { type: 'heal', value: { min: 4, max: 7 } },
      { type: 'stop_bleeding', value: true }
    ]
  },

  'medical.antiseptic': {
    id: 'medical.antiseptic',
    name: 'Antiseptic',
    rarity: Rarity.UNCOMMON,
    imageId: 'antiseptic',
    width: 1,
    height: 1,
    traits: [ItemTrait.MEDICAL, ItemTrait.STACKABLE],
    categories: [ItemCategory.MEDICAL],
    stackMax: 5
  },
  'medical.antibiotics': {
    id: 'medical.antibiotics',
    name: 'Antibiotics',
    rarity: Rarity.UNCOMMON,
    imageId: 'antibiotics',
    width: 1,
    height: 1,
    traits: [ItemTrait.STACKABLE, ItemTrait.CONSUMABLE],
    categories: [ItemCategory.MEDICAL],
    pileLimitOne: true,
    stackMax: 10,
    consumptionEffects: {
      cure: true
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
    traits: [ItemTrait.STACKABLE, ItemTrait.CONSUMABLE, ItemTrait.WATER_CONTAINER],
    categories: [ItemCategory.FOOD],
    stackMax: 10,
    capacity: 20,
    ammoCount: 20,
    spawnAmmoPercent: 1.0,
    consumptionEffects: {
      hydration: 1
    }
  },
  'food.softdrink': {
    id: 'food.softdrink',
    name: 'Soft drink',
    rarity: Rarity.UNCOMMON,
    imageId: 'softdrink',
    width: 1,
    height: 1,
    traits: [ItemTrait.STACKABLE, ItemTrait.CONSUMABLE],
    categories: [ItemCategory.FOOD],
    stackMax: 10,
    consumptionEffects: {
      hydration: 10,
      nutrition: 2
    }
  },
  'food.energydrink': {
    id: 'food.energydrink',
    name: 'Energy drink',
    rarity: Rarity.UNCOMMON,
    imageId: 'energydrink',
    width: 1,
    height: 1,
    traits: [ItemTrait.STACKABLE, ItemTrait.CONSUMABLE],
    categories: [ItemCategory.FOOD],
    stackMax: 10,
    consumptionEffects: {
      hydration: 10,
      energy: 5,
      ap: 2
    }
  },
  'food.waterjug': {
    id: 'food.waterjug',
    name: 'Water Jug',
    rarity: Rarity.UNCOMMON,
    imageId: 'waterjug',
    width: 2,
    height: 2,
    traits: [ItemTrait.STACKABLE, ItemTrait.CONSUMABLE, ItemTrait.WATER_CONTAINER],
    categories: [ItemCategory.FOOD],
    stackMax: 5,
    capacity: 50,
    ammoCount: 50,
    spawnAmmoPercent: 1.0,
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

  'provision.rain_collector': {
    id: 'provision.rain_collector',
    name: 'Rain collector',
    noLoot: true,
    rarity: Rarity.UNCOMMON,
    imageId: 'raincollector',
    width: 3,
    height: 3,
    capacity: 100,
    ammoCount: 0,
    waterQuality: 'dirty',
    renderFullTile: true,
    traits: [ItemTrait.WATER_CONTAINER],
    categories: [ItemCategory.PROVISION]
  },

  'provision.hole': {
    id: 'provision.hole',
    name: 'Hole',
    rarity: Rarity.COMMON,
    renderFullTile: true,
    imageId: 'hole',
    width: 2,
    height: 2,
    traits: [ItemTrait.GROUND_ONLY],
    categories: [],
    noLoot: true
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
  'food.apple': {
    id: 'food.apple',
    name: 'Apple',
    rarity: Rarity.COMMON,
    imageId: 'apple',
    width: 1,
    height: 1,
    traits: [ItemTrait.STACKABLE, ItemTrait.CONSUMABLE, ItemTrait.SPOILABLE],
    categories: [ItemCategory.FOOD],
    stackMax: 10,
    shelfLife: 96,
    consumptionEffects: {
      nutrition: 6
    }
  },
  'food.cornseeds': {
    id: 'food.cornseeds',
    name: 'Corn seeds',
    rarity: Rarity.UNCOMMON,
    imageId: 'cornseeds',
    width: 1,
    height: 1,
    traits: [ItemTrait.STACKABLE],
    categories: [ItemCategory.FOOD],
    stackMax: 100,
    spawnStackMin: 2,
    spawnStackMax: 3,
    plantsAs: 'provision.corn_plant'
  },
  'provision.corn_plant': {
    id: 'provision.corn_plant',
    name: 'Corn plant',
    rarity: Rarity.COMMON,
    renderFullTile: true,
    imageId: 'cornplant',
    width: 2,
    height: 2,
    traits: [ItemTrait.GROUND_ONLY],
    categories: [],
    noLoot: true,
    noDrag: true,
    lifetimeTurns: 48,
    transformInto: 'provision.harvestable_corn'
  },
  'provision.harvestable_corn': {
    id: 'provision.harvestable_corn',
    name: 'Harvestable corn',
    rarity: Rarity.COMMON,
    renderFullTile: true,
    imageId: 'harvestablecorn',
    width: 2,
    height: 2,
    traits: [ItemTrait.GROUND_ONLY],
    categories: [],
    noLoot: true,
    noDrag: true,
    produce: 'food.corn',
    produceMin: 4,
    produceMax: 7
  },
  'food.corn': {
    id: 'food.corn',
    name: 'Corn',
    rarity: Rarity.COMMON,
    imageId: 'corn',
    width: 1,
    height: 1,
    traits: [ItemTrait.STACKABLE, ItemTrait.CONSUMABLE, ItemTrait.SPOILABLE],
    categories: [ItemCategory.FOOD, ItemCategory.VEGETABLE],
    stackMax: 10,
    shelfLife: 72,
    consumptionEffects: {
      nutrition: 5
    }
  },
  'food.tomato': {
    id: 'food.tomato',
    name: 'Tomato',
    rarity: Rarity.COMMON,
    imageId: 'tomato',
    width: 1,
    height: 1,
    traits: [ItemTrait.STACKABLE, ItemTrait.CONSUMABLE, ItemTrait.SPOILABLE],
    categories: [ItemCategory.FOOD, ItemCategory.VEGETABLE],
    stackMax: 10,
    shelfLife: 72,
    consumptionEffects: {
      nutrition: 5
    }
  },
  'food.tomatoseeds': {
    id: 'food.tomatoseeds',
    name: 'Tomato seeds',
    rarity: Rarity.UNCOMMON,
    imageId: 'tomatoseeds',
    width: 1,
    height: 1,
    traits: [ItemTrait.STACKABLE],
    categories: [ItemCategory.FOOD],
    stackMax: 100,
    spawnStackMin: 2,
    spawnStackMax: 3,
    plantsAs: 'provision.tomato_plant'
  },
  'provision.tomato_plant': {
    id: 'provision.tomato_plant',
    name: 'Tomato plant',
    rarity: Rarity.COMMON,
    renderFullTile: true,
    imageId: 'tomatoplant',
    width: 2,
    height: 2,
    traits: [ItemTrait.GROUND_ONLY],
    categories: [],
    noLoot: true,
    noDrag: true,
    lifetimeTurns: 48,
    transformInto: 'provision.harvestable_tomato'
  },
  'provision.harvestable_tomato': {
    id: 'provision.harvestable_tomato',
    name: 'Harvestable tomato',
    rarity: Rarity.COMMON,
    renderFullTile: true,
    imageId: 'harvestabletomato',
    width: 2,
    height: 2,
    traits: [ItemTrait.GROUND_ONLY],
    categories: [],
    noLoot: true,
    noDrag: true,
    produce: 'food.tomato',
    produceMin: 4,
    produceMax: 7
  },
  'food.carrot': {
    id: 'food.carrot',
    name: 'Carrot',
    rarity: Rarity.COMMON,
    imageId: 'carrot',
    width: 1,
    height: 1,
    traits: [ItemTrait.STACKABLE, ItemTrait.CONSUMABLE, ItemTrait.SPOILABLE],
    categories: [ItemCategory.FOOD, ItemCategory.VEGETABLE],
    stackMax: 10,
    shelfLife: 72,
    consumptionEffects: {
      nutrition: 5
    }
  },
  'food.carrotseeds': {
    id: 'food.carrotseeds',
    name: 'Carrot seeds',
    rarity: Rarity.UNCOMMON,
    imageId: 'carrotseeds',
    width: 1,
    height: 1,
    traits: [ItemTrait.STACKABLE],
    categories: [ItemCategory.FOOD],
    stackMax: 100,
    spawnStackMin: 2,
    spawnStackMax: 3,
    plantsAs: 'provision.carrot_plant'
  },
  'provision.carrot_plant': {
    id: 'provision.carrot_plant',
    name: 'Carrot plant',
    rarity: Rarity.COMMON,
    renderFullTile: true,
    imageId: 'carrotplant',
    width: 2,
    height: 2,
    traits: [ItemTrait.GROUND_ONLY],
    categories: [],
    noLoot: true,
    noDrag: true,
    lifetimeTurns: 48,
    transformInto: 'provision.harvestable_carrot'
  },
  'provision.harvestable_carrot': {
    id: 'provision.harvestable_carrot',
    name: 'Harvestable carrot',
    rarity: Rarity.COMMON,
    renderFullTile: true,
    imageId: 'harvestablecarrot',
    width: 2,
    height: 2,
    traits: [ItemTrait.GROUND_ONLY],
    categories: [],
    noLoot: true,
    noDrag: true,
    produce: 'food.carrot',
    produceMin: 4,
    produceMax: 7
  },
  'food.stew': {
    id: 'food.stew',
    name: 'Stew',
    noLoot: true,
    rarity: Rarity.RARE,
    imageId: 'vegetablesoup',
    width: 1,
    height: 1,
    traits: [ItemTrait.CONSUMABLE, ItemTrait.SPOILABLE],
    categories: [ItemCategory.FOOD],
    stackMax: 1,
    shelfLife: 72,
    consumptionEffects: {
      nutrition: 15,
      hydration: 5
    }
  },

  'food.raw_meat': {
    id: 'food.raw_meat',
    name: 'Raw meat',
    rarity: Rarity.COMMON,
    renderFullTile: true,
    imageId: 'rawmeat',
    width: 1,
    height: 1,
    traits: [ItemTrait.STACKABLE, ItemTrait.CONSUMABLE, ItemTrait.SPOILABLE],
    categories: [ItemCategory.FOOD],
    stackMax: 10,
    noLoot: true, // Not found in loot drops
    shelfLife: 48, // Spoils in 48 hours
    transformInto: 'food.rotten_meat',
    consumptionEffects: {
      nutrition: 10,
      sickness: 5 // Causes 5 turns of sickness
    }
  },

  'food.rotten_meat': {
    id: 'food.rotten_meat',
    name: 'Rotten meat',
    rarity: Rarity.COMMON,
    renderFullTile: true,
    imageId: 'rawmeat', // Using rawmeat icon for now per user
    width: 1,
    height: 1,
    traits: [ItemTrait.STACKABLE, ItemTrait.CONSUMABLE, ItemTrait.SPOILABLE],
    categories: [ItemCategory.FOOD],
    stackMax: 10,
    noLoot: true,
    shelfLife: 24, // Eventually vanishes
    consumptionEffects: {
      nutrition: 4,
      condition: 'Diseased' // Causes disease condition
    }
  },

  'food.cooked_meat': {
    id: 'food.cooked_meat',
    name: 'Cooked meat',
    rarity: Rarity.COMMON,
    imageId: 'cookedmeat',
    width: 1,
    height: 1,
    traits: [ItemTrait.STACKABLE, ItemTrait.CONSUMABLE, ItemTrait.SPOILABLE],
    categories: [ItemCategory.FOOD],
    stackMax: 10,
    noLoot: true,
    shelfLife: 72,
    consumptionEffects: {
      nutrition: 12
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
    spawnBias: { outside: 10, inside: 0 },
    pileLimitOne: true,
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
    traits: [ItemTrait.CHARGE_BASED],
    categories: [ItemCategory.TOOL],
    stackMax: 1,
    capacity: 10,
    ammoCount: 10,
    spawnAmmoPercent: 1.0,
    noLoot: true
  },
  'tool.matchbook': {
    id: 'tool.matchbook',
    name: 'Matchbook',
    rarity: Rarity.UNCOMMON,
    imageId: 'matchbook',
    width: 1,
    height: 1,
    traits: [ItemTrait.CHARGE_BASED],
    categories: [ItemCategory.TOOL],
    stackMax: 1,
    capacity: 15,
    ammoCount: 15,
    spawnAmmoPercent: 1.0,
    noLoot: true
  },
  'tool.bowdrill': {
    id: 'tool.bowdrill',
    name: 'Bow drill',
    rarity: Rarity.COMMON,
    imageId: 'bowdrill',
    width: 2,
    height: 1,
    traits: [ItemTrait.CHARGE_BASED],
    categories: [ItemCategory.TOOL],
    stackMax: 1,
    capacity: 5,
    ammoCount: 5,
    noLoot: true
  },
  'crafting.glass_shard': {
    id: 'crafting.glass_shard',
    name: 'Glass shard',
    rarity: Rarity.COMMON,
    imageId: 'glassshard',
    width: 2,
    height: 1,
    traits: [ItemTrait.STACKABLE],
    categories: [ItemCategory.CRAFTING_MATERIAL],
    pileLimitOne: true,
    stackMax: 20
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

  'weapon.frying_pan': {
    id: 'weapon.frying_pan',
    name: 'Frying pan',
    rarity: Rarity.COMMON,
    imageId: 'fryingpan',
    width: 2,
    height: 2,
    traits: [ItemTrait.EQUIPPABLE, ItemTrait.DEGRADABLE],
    equippableSlot: EquipmentSlot.MELEE,
    categories: [ItemCategory.WEAPON, ItemCategory.TOOL, ItemCategory.COOKING_POT],
    condition: 100,
    combat: {
      hitChance: 0.60,
      damage: { min: 1, max: 6 }
    }
  },

  'weapon.shotgun': {
    id: 'weapon.shotgun',
    name: 'Shotgun',
    rarity: Rarity.RARE,
    imageId: 'shotgun',
    width: 3,
    height: 2,
    traits: [ItemTrait.EQUIPPABLE, ItemTrait.CONTAINER, ItemTrait.OPENABLE_WHEN_NESTED],
    equippableSlot: ['handgun', 'long_gun'], // Dual equip slot
    categories: [ItemCategory.WEAPON, ItemCategory.GUN],
    attachmentSlots: [
      { id: 'ammo', name: 'Ammo', hidden: true, allowedCategories: [ItemCategory.AMMO], allowedItems: ['ammo.shotgun_shells'] }
    ],
    rangedStats: {
      isShotgun: true,
      noiseRadius: 25,
      damage: { min: 20, max: 20 }, // Base damage at 1 square
      accuracyMaxRange: 5,
      accuracyFalloff: 0.2, // -20% per square beyond 5
      damageFalloff: 0.1, // -10% per square always
      damageFalloffExtra: 0.1, // -10% additional per square beyond 5
      minAccuracy: 0.0
    }
  },

  'ammo.shotgun_shells': {
    id: 'ammo.shotgun_shells',
    name: 'Shotgun shells',
    rarity: Rarity.UNCOMMON,
    imageId: 'shotgunshells',
    width: 1,
    height: 1,
    traits: [ItemTrait.STACKABLE],
    categories: [ItemCategory.AMMO],
    stackMax: 20,
    spawnStackMin: 3,
    spawnStackMax: 6
  },

  'placeable.campfire': {
    id: 'placeable.campfire',
    name: 'Campfire',
    noLoot: true,
    rarity: Rarity.COMMON,
    imageId: 'campfire',
    width: 4,
    height: 4,
    traits: [ItemTrait.CONTAINER, ItemTrait.GROUND_ONLY],
    lightRange: 5,
    lightType: 'glow',
    containerGrid: {
      width: 4,
      height: 4,
      allowedCategories: [ItemCategory.FOOD]
    },
    noDrag: true,
    // Specialized slots (handled by specialized UI)
      attachmentSlots: [
      { id: 'pot', name: 'Cooking Pot', allowedCategories: [ItemCategory.COOKING_POT] }
    ]
  },
  'crafting.leather_belt': {
    id: 'crafting.leather_belt',
    name: 'Leather belt',
    rarity: Rarity.UNCOMMON,
    imageId: 'leatherbelt',
    width: 1,
    height: 1,
    traits: [ItemTrait.STACKABLE],
    categories: [ItemCategory.CRAFTING_MATERIAL],
    pileLimitOne: true,
    stackMax: 20
  },
  'weapon.sling': {
    id: 'weapon.sling',
    name: 'Sling',
    noLoot: true,
    rarity: Rarity.COMMON,
    imageId: 'sling',
    width: 1,
    height: 1,
    traits: [ItemTrait.EQUIPPABLE, ItemTrait.DEGRADABLE],
    equippableSlot: EquipmentSlot.HANDGUN,
    categories: [ItemCategory.WEAPON],
    condition: 100,
    fragility: 4,
    rangedStats: {
      damage: { min: 2, max: 5 },
      minRange: 2,
      accuracyFalloff: 0.1,
      isSling: true // Special flag for combat logic
    }
  },
  'bedroll.closed': {
    id: 'bedroll.closed',
    name: 'Bedroll (Closed)',
    rarity: Rarity.RARE,
    imageId: 'bedrollclosed',
    width: 2,
    height: 1,
    traits: [],
    categories: [ItemCategory.TOOL]
  },
  'bedroll.open': {
    id: 'bedroll.open',
    name: 'Bedroll (Open)',
    rarity: Rarity.RARE,
    noLoot: true,
    imageId: 'bedrollopen',
    width: 4,
    height: 6,
    traits: [ItemTrait.GROUND_ONLY],
    categories: [ItemCategory.TOOL]
  },
  'placeable.bed': {
    id: 'placeable.bed',
    name: 'Bed',
    rarity: Rarity.RARE,
    noLoot: true,
    noPickup: true,
    renderFullTile: true,
    traits: [ItemTrait.GROUND_ONLY, ItemTrait.DRAGGABLE],
    dragApPenalty: 2,
    imageId: 'bed',
    width: 4,
    height: 6,
    isFurniture: true,
    categories: [ItemCategory.FURNITURE, ItemCategory.TOOL],
    disassembleData: {
      toolId: { either: ['weapon.hammer', 'weapon.makeshift_hammer'] },
      apCost: 10,
      components: [
        { id: 'crafting.feather_padding', count: 1 },
        { id: 'weapon.plank', count: 4 },
        { id: 'crafting.nail', count: 4 }
      ]
    }
  },

  'placeable.small_sled': {
    id: 'placeable.small_sled',
    name: 'Small sled',
    rarity: Rarity.UNCOMMON,
    imageId: 'smallsled',
    width: 4,
    height: 6,
    traits: [ItemTrait.GROUND_ONLY, ItemTrait.CONTAINER, ItemTrait.DRAGGABLE],
    categories: [ItemCategory.FURNITURE, ItemCategory.TOOL],
    noLoot: true,
    isFurniture: true,
    isWagon: true,
    dragApPenalty: 1.5,
    renderFullTile: true,
    containerGrid: { width: 4, height: 5, isVehicle: true },
    disassembleData: {
      toolId: { either: ['weapon.hammer', 'weapon.makeshift_hammer'] },
      apCost: 10,
      components: [
        { id: 'weapon.plank', count: 4 },
        { id: 'crafting.nail', count: 4 }
      ]
    }
  },

  'furniture.electric_mower': {
    id: 'furniture.electric_mower',
    name: 'Electric mower',
    noLoot: true,
    noPickup: true,
    rarity: Rarity.RARE,
    imageId: 'electricmower',
    width: 3,
    height: 4,
    traits: [ItemTrait.DRAGGABLE, ItemTrait.GROUND_ONLY, ItemTrait.OPENABLE_WHEN_NESTED],
    isFurniture: true,
    dragApPenalty: 1,
    renderFullTile: true,
    attachmentSlots: [
      { id: 'battery', name: 'Power Cell', allowedCategories: [ItemCategory.LARGE_BATTERY], allowedItems: ['tool.large_battery'] }
    ],
    disassembleData: {
      toolId: 'weapon.wrench',
      apCost: 15,
      components: [
        { id: 'crafting.wheel', count: 4 },
        { id: 'electric_motor', count: 1 },
        { id: 'crafting.mower_blade', count: 1 },
        { id: 'weapon.metal_rod', count: 2 },
        { id: 'crafting.metal_plate', count: 1 }
      ]
    }
  },
  'environment.water_puddle': {
    id: 'environment.water_puddle',
    name: 'Water puddle',
    rarity: Rarity.COMMON,
    imageId: 'waterpuddle',
    width: 5,
    height: 5,
    isPuddle: true,
    isPickable: false,
    noDrag: true,
    traits: [],
    maxWater: 50,
    ammoCount: 50, // Using ammoCount for water level
    capacity: 50,
    categories: [ItemCategory.ENVIRONMENT],
    noLoot: true,
    renderFullTile: true
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

/**
 * Get the display name for an item definition ID
 */
export function getItemName(defId) {
  const def = ItemDefs[defId];
  return def ? def.name : (defId || "Unknown Item");
}