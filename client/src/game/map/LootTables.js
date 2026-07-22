
/**
 * Loot Tables Data
 * Centralized configuration for specialized spawns and zombie loot
 */

import { ItemCategory } from '../inventory/traits.js';

/**
 * SPECIAL_BUILDING_LOOT — per-building-type loot configuration.
 *
 * NOTE (P7-12): This table intentionally uses TWO shapes, one per kind of
 * consumer logic in LootGenerator. This is deliberate, not an inconsistency to
 * "fix" — the two shapes back genuinely different spawn code paths, and
 * collapsing them to one schema would mean rewriting that bespoke consumer.
 *
 *   1. Weighted-pool array — `[{ key, weight }]`
 *      Simple weighted random pulls. Used by: grocer, gas_station.
 *      Consumed via LootGenerator.addItemsFromTable().
 *
 *   2. Categorized object — `{ <categoryName>: string[], ..., rules: {...} }`
 *      Named pools (medical/tools/ammo/guns/tech/...) plus a `rules` block of
 *      building-specific spawn parameters (e.g. hasGun, hasGrenade, roomLayout,
 *      guaranteedTech). Used by: firestation, police, army_tent, hardware_store,
 *      lab. Each drives bespoke per-building logic in LootGenerator (~L968-1247).
 *
 * When adding a building type, match whichever shape fits its consumer path.
 */
export const SPECIAL_BUILDING_LOOT = {
    grocer: [
        { key: 'food.granolabar', weight: 25 },
        { key: 'food.chips', weight: 25 },
        { key: 'food.beans', weight: 15 },
        { key: 'food.cannedcorn', weight: 15 },
        { key: 'food.waterbottle', weight: 10 },
        { key: 'backpack.school', weight: 5 }
    ],
    gas_station: [
        { key: 'food.chips', weight: 35 },
        { key: 'food.granolabar', weight: 35 },
        { key: 'food.waterbottle', weight: 20 }
    ],
    firestation: {
        medical: ['medical.bandage', 'medical.antibiotics', 'medical.wound_spray', 'medical.first_aid_kit', 'medical.stimulant'],
        tools: ['weapon.fire_axe', 'weapon.hammer', 'weapon.crowbar', 'weapon.machete', 'weapon.wrench', 'tool.battery_charger', 'belt.tool_ring'],
        rules: {
            hasTool: 0.50,
            hasBackpack: 0.25,
            backpackType: 'backpack.standard'
        }
    },
    police: {
        ammo: ['ammo.9mm', 'ammo.357', 'ammo.308', 'ammo.shotgun_shells'],
        guns: ['weapon.9mmPistol', 'weapon.357Pistol', 'weapon.hunting_rifle', 'weapon.shotgun'],
        gear: ['belt.holster', 'belt.ammo_pouch', 'crafting.motion_sensor'],
        rules: {
            hasGun: 0.50,
            hasBackpack: 0.25,
            backpackType: 'backpack.standard'
        }
    },
    army_tent: {
        ammo: ['ammo.9mm', 'ammo.de', 'ammo.556'],
        mods: ['attachment.suppressor', 'attachment.lasersight', 'attachment.riflescope'],
        guns: ['weapon.battle_rifle'],
        gear: ['belt.holster', 'belt.ammo_pouch', 'belt.pouch'],
        rules: {
            hasGrenade: 0.35,
            hasBattleRifle: 0.50,
            has9mm: 0.50,
            hasBackpack: 0.35,
            backpackType: 'backpack.hiking',
            hasDesertEagle: 0.10,
            hasNightVision: 0.10
        }
    },
    hardware_store: {
        tools: ['weapon.hammer', 'weapon.crowbar', 'weapon.wrench', 'tool.smallflashlight', 'weapon.knife', 'tool.crank_charger'],
        materials: ['crafting.nail', 'crafting.wire', 'crafting.tape', 'tool.battery', 'tool.large_battery', 'tool.high_capacity_battery', 'crafting.motion_sensor'],
        rules: {
            guaranteedTech: ['crafting.solar_panel', 'tool.battery_charger']
        }
    },
    lab: {
        medical: ['medical.bandage', 'medical.antibiotics', 'medical.wound_spray', 'medical.first_aid_kit', 'container.medkit', 'medical.antiseptic', 'medical.stimulant'],
        tech: ['crafting.wire', 'crafting.tape', 'tool.battery', 'tool.large_battery', 'tool.pliers', 'tool.battery_charger', 'crafting.solar_panel', 'crafting.rag'],
        rules: {
            roomLayout: {
                wingWidth: 5,
                roomHeight: 12,
                roomsCount: 10
            },
            dropsPerRoom: { min: 2, max: 3 },
            uniques: [
                { defId: 'tool.nightvision', count: 1 }
            ]
        }
    }
};

export const ZOMBIE_LOOT = {
    firefighter: {
        specialized: ['weapon.fire_axe', 'weapon.hammer', 'weapon.crowbar', 'weapon.machete', 'clothing.paramedic_shirt'],
        medical: ['medical.bandage', 'medical.antibiotics', 'medical.wound_spray', 'medical.first_aid_kit', 'medical.stimulant'],
        common: ['clothing.pocket_t', 'clothing.sweatpants', 'clothing.blue_jeans', 'crafting.rag']
    },
    swat: {
        gear: ['weapon.9mmPistol', 'weapon.357Pistol', 'clothing.police_shirt', 'belt.holster', 'belt.ammo_pouch'],
        ammo: ['ammo.9mm', 'ammo.357', 'ammo.shotgun_shells', 'ammo.308']
    },
    soldier: {
        gear: ['weapon.9mmPistol', 'weapon.grenade', 'clothing.military_shirt', 'weapon.battle_rifle', 'belt.holster', 'belt.ammo_pouch', 'belt.pouch'],
        ammo: ['ammo.9mm', 'ammo.shotgun_shells', 'ammo.556']
    },
    uncommon: [
        'food.granolabar', 'food.chips', 'food.waterbottle', 'food.softdrink', 'food.fruitjuice', 'food.energydrink', 'food.vitamindrink', 'food.whiskey', 'book.life_in_motion',
        'medical.bandage', 'medical.antibiotics', 'medical.wound_spray', 'medical.first_aid_kit', 'medical.stimulant', 'crafting.leather_belt', 'belt.pouch', 'belt.tool_ring',
        'tool.lockpick'
    ],
    exotic: ['weapon.9mmPistol', 'weapon.357Pistol', 'weapon.shotgun', 'tool.smallflashlight']
};

export const MAP_WIDE_REQUIREMENTS = {
    1: [
        { defId: 'crafting.tape', minCount: 3 },
        { defId: 'tool.cooking_pot', minCount: 1 }
    ],
    2: [
        { defId: 'crafting.leather_belt', minCount: 1 }
    ]
};
