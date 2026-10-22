/**
 * ContainerLoot - fills spawned containers with their starting contents.
 *
 * Extracted from LootGenerator (AGENTS.md §6). Two kinds of container live here:
 *  - Safes: a curated, mostly-guaranteed stash (populateSafe).
 *  - Special loose containers (lunchbox, tool box, medkit): 0-2 random items
 *    drawn from a themed pool (fillSpecialContainer). Hooked from
 *    LootGenerator.applySpawnDefaults, so every random drop path that applies
 *    spawn defaults gets filled containers without each caller opting in.
 */
import { Item } from '../inventory/Item.js';
import { Container } from '../inventory/Container.js';
import { createItemFromDef } from '../inventory/ItemDefs.js';
import { ItemCategory } from '../inventory/traits.js';
import { gameRandom } from '../utils/SeededRandom.js';
import { LootGenerator } from './LootGenerator.js';

// Weighted pools per container. Every key must satisfy the container's
// containerGrid.allowedCategories, or the grid will reject it (enforced by
// test/map/containerLoot.test.js). Water bottles are left out of the lunchbox
// on purpose: they are progression-restricted after map 3.
export const SPECIAL_CONTAINER_CONTENTS = {
    'container.lunchbox': {
        min: 0,
        max: 2,
        pool: [
            { key: 'food.granolabar', weight: 30 },
            { key: 'food.apple', weight: 20 },
            { key: 'food.chips', weight: 20 },
            { key: 'food.softdrink', weight: 15 },
            { key: 'food.fruitjuice', weight: 15 },
            { key: 'food.beans', weight: 10 },
            { key: 'food.cannedcorn', weight: 8 },
            { key: 'food.energydrink', weight: 6 },
            { key: 'food.honey', weight: 4 }
        ]
    },
    'container.toolbox': {
        min: 0,
        max: 2,
        pool: [
            { key: 'crafting.nail', weight: 25 },
            { key: 'crafting.tape', weight: 20 },
            { key: 'crafting.wire', weight: 20 },
            { key: 'tool.pliers', weight: 15 },
            { key: 'weapon.wrench', weight: 12 },
            { key: 'weapon.hammer', weight: 10 },
            { key: 'crafting.rope', weight: 8 },
            { key: 'weapon.crowbar', weight: 4 },
            { key: 'tool.lockpick', weight: 3 }
        ]
    },
    'container.medkit': {
        min: 0,
        max: 2,
        pool: [
            { key: 'medical.bandage', weight: 35 },
            { key: 'medical.wound_spray', weight: 20 },
            { key: 'medical.antiseptic', weight: 18 },
            { key: 'medical.antibiotics', weight: 12 },
            { key: 'medical.first_aid_kit', weight: 5 },
            { key: 'medical.stimulant', weight: 4 }
        ]
    }
};

function pickWeightedKey(pool) {
    const totalWeight = pool.reduce((sum, entry) => sum + entry.weight, 0);
    let random = gameRandom.next() * totalWeight;
    for (const entry of pool) {
        if (random < entry.weight) return entry.key;
        random -= entry.weight;
    }
    return pool[pool.length - 1].key;
}

/**
 * Resolve a container grid for either an Item instance or plain item data
 * (createItemFromDef output, which most loot paths hand around until the item
 * is placed). For plain data, commit() writes the filled grid back as
 * serialized containerGrid, which the Item constructor restores on placement.
 */
function resolveGrid(item) {
    if (typeof item.getContainerGrid === 'function') {
        const grid = item.getContainerGrid();
        return grid ? { grid, commit: () => {} } : null;
    }
    if (!item.containerGrid) return null;

    const grid = Container.fromJSON({
        ...item.containerGrid,
        id: item.containerGrid.id || `${item.instanceId}-container`,
        name: item.containerGrid.name || item.name,
        ownerId: item.instanceId
    });
    return { grid, commit: () => { item.containerGrid = grid.toJSON(); } };
}

/**
 * Put 0-2 themed random items into a freshly spawned special container.
 * No-op for any other item, and for a container that already holds something
 * (so a second applySpawnDefaults pass never double-fills it).
 * @param {Item|object} item - Item instance or plain item data
 * @param {boolean} isZombieLoot - Passed through to the contents' spawn defaults
 */
export function fillSpecialContainer(item, isZombieLoot = false) {
    const spec = SPECIAL_CONTAINER_CONTENTS[item?.defId];
    if (!spec) return;

    const resolved = resolveGrid(item);
    if (!resolved || resolved.grid.items.size > 0) return;
    const { grid, commit } = resolved;

    const count = spec.min + gameRandom.nextInt(0, spec.max - spec.min);
    for (let i = 0; i < count; i++) {
        const data = createItemFromDef(pickWeightedKey(spec.pool));
        if (!data) continue;
        const content = new Item(data);
        LootGenerator.applySpawnDefaults(content, isZombieLoot);
        if (!grid.addItem(content)) {
            console.log(`[ContainerLoot] ${item.name}: ${content.name} did not fit. Skipping.`);
        }
    }
    commit();
}

/**
 * Populate safe container with random loot
 */
export function populateSafe(safeItem) {
    const grid = safeItem.getContainerGrid();
    if (!grid) return;

    const SAFE_GUNS = [
        { gun: 'weapon.9mmPistol', ammo: 'ammo.9mm' },
        { gun: 'weapon.357Pistol', ammo: 'ammo.357' },
        { gun: 'weapon.hunting_rifle', ammo: 'ammo.308' },
        { gun: 'weapon.battle_rifle', ammo: 'ammo.556' },
        { gun: 'weapon.shotgun', ammo: 'ammo.shotgun_shells' }
    ];

    const options = [];

    // Option: A gun (max one)
    const hasGun = gameRandom.next() < 0.7; // 70% chance to contain a gun
    let spawnedGunInfo = null;
    if (hasGun) {
        const gunInfo = SAFE_GUNS[gameRandom.nextInt(0, SAFE_GUNS.length - 1)];
        spawnedGunInfo = gunInfo;
        options.push(() => {
            const gun = createItemFromDef(gunInfo.gun);
            if (gun) {
                const item = Item.fromJSON(gun);
                LootGenerator.applySpawnDefaults(item, false);
                return item;
            }
            return null;
        });
    }

    // Option: Ammo for the gun in the safe (15-20 rounds)
    if (hasGun) {
        options.push(() => {
            if (!spawnedGunInfo) return null;
            const ammo = createItemFromDef(spawnedGunInfo.ammo);
            if (ammo) {
                const count = 15 + gameRandom.nextInt(0, 5); // 15-20
                const item = Item.fromJSON(ammo);
                item.stackCount = count;
                return item;
            }
            return null;
        });
    }

    // Option: MREs (1-2)
    if (gameRandom.next() < 0.8) options.push(() => {
        const mre = createItemFromDef('food.mre');
        if (!mre) return null;
        const item = Item.fromJSON(mre);
        item.stackCount = gameRandom.next() < 0.5 ? 1 : 2;
        return item;
    });

    // Option: Full water bottles (1-2)
    if (gameRandom.next() < 0.8) options.push(() => {
        const bottle = createItemFromDef('food.waterbottle');
        if (!bottle) return null;
        const item = Item.fromJSON(bottle);
        item.ammoCount = 20; // Full
        item.waterQuality = 'clean';
        return item;
    });

    // Option: Any ammo (15-20 rounds)
    if (gameRandom.next() < 0.8) {
        options.push(() => {
            const randGun = SAFE_GUNS[gameRandom.nextInt(0, SAFE_GUNS.length - 1)];
            const ammo = createItemFromDef(randGun.ammo);
            if (ammo) {
                const count = 15 + gameRandom.nextInt(0, 5); // 15-20
                const item = Item.fromJSON(ammo);
                item.stackCount = count;
                return item;
            }
            return null;
        });
    }

    // Option: flashlight (with full battery)
    if (gameRandom.next() < 0.6) {
        options.push(() => {
            const flData = createItemFromDef('tool.smallflashlight');
            if (flData) {
                flData.attachments = {
                    battery: createItemFromDef('tool.battery')
                };
                const item = Item.fromJSON(flData);
                return item;
            }
            return null;
        });
    }

    // Option: batteries (2-4)
    if (gameRandom.next() < 0.7) options.push(() => {
        const bat = createItemFromDef('tool.battery');
        if (!bat) return null;
        const item = Item.fromJSON(bat);
        item.stackCount = 2 + gameRandom.nextInt(0, 2); // 2-4
        return item;
    });

    // Option: high capacity batteries (1-2)
    if (gameRandom.next() < 0.45) options.push(() => {
        const highBat = createItemFromDef('tool.high_capacity_battery');
        if (!highBat) return null;
        const item = Item.fromJSON(highBat);
        item.stackCount = gameRandom.next() < 0.5 ? 1 : 2; // 1-2
        return item;
    });

    // Option: hand cranked battery charger
    if (gameRandom.next() < 0.5) options.push(() => {
        const charger = createItemFromDef('tool.crank_charger');
        return charger ? Item.fromJSON(charger) : null;
    });

    // Option: first aid kit
    if (gameRandom.next() < 0.6) options.push(() => {
        const kit = createItemFromDef('medical.first_aid_kit');
        return kit ? Item.fromJSON(kit) : null;
    });

    // Shuffle the option generators
    const shuffled = gameRandom.shuffle(options);

    // Try to generate and add each item
    let gunAdded = false;
    for (const gen of shuffled) {
        const item = gen();
        if (!item) continue;

        // If it's a gun and we already added a gun, skip it!
        if (item.hasCategory?.(ItemCategory.GUN) || item.categories?.includes(ItemCategory.GUN)) {
            if (gunAdded) continue;
            gunAdded = true;
        }

        // Attempt to add to grid
        const added = grid.addItem(item);
        if (!added) {
            // Try rotating to fit
            item.rotation = item.rotation === 0 ? 90 : 0;
            const addedRotated = grid.addItem(item);
            if (!addedRotated) {
                console.log(`[LootGenerator] Safe: Item ${item.name} did not fit. Skipping.`);
            } else {
                console.log(`[LootGenerator] Safe: Added rotated ${item.name}`);
            }
        } else {
            console.log(`[LootGenerator] Safe: Added ${item.name}`);
        }
    }
}
