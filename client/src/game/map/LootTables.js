
/**
 * Loot Tables Data
 * Centralized configuration for specialized spawns and zombie loot
 */

import { ItemCategory } from '../inventory/traits.js';

export const SPECIAL_BUILDING_LOOT = {
    grocer: [
        { key: 'food.granolabar', weight: 25 },
        { key: 'food.chips', weight: 25 },
        { key: 'food.beans', weight: 15 },
        { key: 'food.cannedcorn', weight: 15 },
        { key: 'food.tomato', weight: 10 },
        { key: 'food.carrot', weight: 10 },
        { key: 'food.corn', weight: 10 },
        { key: 'food.cornseeds', weight: 5 },
        { key: 'food.tomatoseeds', weight: 5 },
        { key: 'food.carrotseeds', weight: 5 },
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
        gear: ['belt.holster', 'belt.ammo_pouch'],
        rules: {
            hasGun: 0.50,
            hasBackpack: 0.25,
            backpackType: 'backpack.standard'
        }
    },
    army_tent: {
        ammo: ['ammo.9mm', 'ammo.sniper', 'ammo.de', 'ammo.556'],
        mods: ['attachment.suppressor', 'attachment.lasersight', 'attachment.riflescope'],
        guns: ['weapon.battle_rifle'],
        gear: ['belt.holster', 'belt.ammo_pouch', 'belt.pouch'],
        rules: {
            hasSniper: 0.35,
            hasBattleRifle: 0.50,
            has9mm: 0.50,
            hasBackpack: 0.35,
            backpackType: 'backpack.hiking'
        }
    },
    hardware_store: {
        tools: ['weapon.hammer', 'weapon.crowbar', 'weapon.wrench', 'tool.smallflashlight', 'weapon.knife'],
        materials: ['crafting.nail', 'crafting.wire', 'crafting.tape', 'tool.battery', 'tool.large_battery'],
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
        gear: ['weapon.9mmPistol', 'weapon.sniper_rifle', 'clothing.military_shirt', 'weapon.battle_rifle', 'belt.holster', 'belt.ammo_pouch', 'belt.pouch'],
        ammo: ['ammo.9mm', 'ammo.sniper', 'ammo.shotgun_shells', 'ammo.556']
    },
    uncommon: [
        'food.granolabar', 'food.chips', 'food.waterbottle', 'food.softdrink', 'food.fruitjuice', 'food.energydrink', 'food.vitamindrink',
        'medical.bandage', 'medical.antibiotics', 'medical.wound_spray', 'medical.first_aid_kit', 'medical.stimulant', 'crafting.leather_belt', 'belt.pouch', 'belt.tool_ring'
    ],
    exotic: ['weapon.9mmPistol', 'weapon.357Pistol', 'weapon.shotgun', 'tool.smallflashlight']
};

export const MAP_WIDE_UNIQUES = [
    { defId: 'tool.lighter' },
    { defId: 'tool.matchbook' }
];

export const MAP_WIDE_REQUIREMENTS = {
    1: [
        { defId: 'crafting.tape', minCount: 3 },
        { defId: 'tool.cooking_pot', minCount: 1 }
    ],
    2: [
        { defId: 'crafting.leather_belt', minCount: 1 }
    ]
};
