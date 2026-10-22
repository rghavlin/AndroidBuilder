import { describe, it, expect, beforeEach } from 'vitest';
import { LootGenerator } from '../../client/src/game/map/LootGenerator.js';
import { SPECIAL_CONTAINER_CONTENTS, fillSpecialContainer } from '../../client/src/game/map/ContainerLoot.js';
import { Item } from '../../client/src/game/inventory/Item.js';
import { ItemDefs, createItemFromDef } from '../../client/src/game/inventory/ItemDefs.js';
import { gameRandom } from '../../client/src/game/utils/SeededRandom.js';

const CONTAINER_IDS = Object.keys(SPECIAL_CONTAINER_CONTENTS);

function contentsOf(item) {
    return Array.from(item.getContainerGrid().items.values());
}

describe('special container contents', () => {
    beforeEach(() => {
        gameRandom.seed(1234);
    });

    it('every pool entry is a lootable item the container accepts', () => {
        for (const containerId of CONTAINER_IDS) {
            const allowed = ItemDefs[containerId].containerGrid.allowedCategories;
            for (const { key } of SPECIAL_CONTAINER_CONTENTS[containerId].pool) {
                const def = ItemDefs[key];
                expect(def, `${containerId}: ${key} missing`).toBeDefined();
                expect(def.noLoot, `${containerId}: ${key} is noLoot`).toBeFalsy();
                expect(def.categories.some(c => allowed.includes(c)), `${containerId}: ${key} not allowed`).toBe(true);
            }
        }
    });

    for (const containerId of CONTAINER_IDS) {
        it(`${containerId} spawns with 0-2 pool items, covering 0, 1 and 2`, () => {
            const poolKeys = new Set(SPECIAL_CONTAINER_CONTENTS[containerId].pool.map(e => e.key));
            const seenCounts = new Set();

            for (let i = 0; i < 200; i++) {
                const item = new Item(createItemFromDef(containerId));
                LootGenerator.applySpawnDefaults(item, false);
                const contents = contentsOf(item);

                // Two rolls of the same stackable merge into one entry, so this is an upper bound.
                expect(contents.length).toBeLessThanOrEqual(2);
                contents.forEach(c => expect(poolKeys.has(c.defId)).toBe(true));
                seenCounts.add(contents.length);
            }
            expect(seenCounts).toEqual(new Set([0, 1, 2]));
        });
    }

    it('fills plain item data so the contents survive conversion to an Item', () => {
        let filled = null;
        for (let i = 0; i < 50 && !filled; i++) {
            const data = createItemFromDef('container.medkit');
            LootGenerator.applySpawnDefaults(data, false);
            if (data.containerGrid.items?.length > 0) filled = data;
        }
        expect(filled).not.toBeNull();

        const item = Item.fromJSON(filled);
        const contents = contentsOf(item);
        expect(contents.length).toBe(filled.containerGrid.items.length);
        expect(item.getContainerGrid().id).toBe(`${filled.instanceId}-container`);
    });

    it('does not refill a container that already has contents', () => {
        const item = new Item(createItemFromDef('container.toolbox'));
        item.getContainerGrid().addItem(new Item(createItemFromDef('crafting.tape')));

        fillSpecialContainer(item);

        const contents = contentsOf(item);
        expect(contents).toHaveLength(1);
        expect(contents[0].defId).toBe('crafting.tape');
    });

    it('leaves other containers alone', () => {
        const item = new Item(createItemFromDef('container.guncase'));
        LootGenerator.applySpawnDefaults(item, false);
        expect(contentsOf(item)).toHaveLength(0);
    });
});
