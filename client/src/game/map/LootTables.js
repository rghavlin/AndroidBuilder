
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
        medical: ['medical.bandage', 'medical.antibiotics'],
        tools: ['weapon.fire_axe', 'weapon.hammer', 'weapon.crowbar', 'weapon.machete']
    },
    police: {
        ammo: ['ammo.9mm', 'ammo.357', 'ammo.308', 'ammo.shotgun_shells'],
        guns: ['weapon.9mmPistol', 'weapon.357Pistol', 'weapon.hunting_rifle', 'weapon.shotgun']
    },
    army_tent: {
        ammo: ['ammo.9mm', 'ammo.sniper', 'ammo.shotgun_shells'],
        mods: ['attachment.suppressor', 'attachment.lasersight', 'attachment.riflescope']
    }
};

export const ZOMBIE_LOOT = {
    firefighter: {
        specialized: ['weapon.fire_axe', 'weapon.hammer', 'weapon.crowbar', 'weapon.machete', 'clothing.paramedic_shirt'],
        medical: ['medical.bandage', 'medical.antibiotics'],
        common: ['clothing.pocket_t', 'clothing.sweatpants', 'clothing.blue_jeans', 'crafting.rag']
    },
    swat: {
        gear: ['weapon.9mmPistol', 'weapon.357Pistol', 'clothing.police_shirt'],
        ammo: ['ammo.9mm', 'ammo.357', 'ammo.shotgun_shells', 'ammo.308']
    },
    soldier: {
        gear: ['weapon.9mmPistol', 'weapon.sniper_rifle', 'clothing.police_shirt', 'clothing.military_shirt'],
        ammo: ['ammo.9mm', 'ammo.sniper', 'ammo.shotgun_shells']
    },
    uncommon: [
        'food.granolabar', 'food.chips', 'food.waterbottle', 'food.softdrink', 'food.energydrink',
        'medical.bandage', 'medical.antibiotics', 'crafting.leather_belt'
    ],
    exotic: ['weapon.9mmPistol', 'weapon.357Pistol', 'weapon.shotgun', 'tool.smallflashlight']
};

export const MAP_WIDE_UNIQUES = [
    { defId: 'tool.lighter' },
    { defId: 'tool.matchbook' }
];
