import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { LootGenerator } from '../../client/src/game/map/LootGenerator.js';
import { GameMap } from '../../client/src/game/map/GameMap.js';
import { ItemDefs } from '../../client/src/game/inventory/ItemDefs.js';
import { gameRandom } from '../../client/src/game/utils/SeededRandom.js';
import { ItemCategory, ItemTrait } from '../../client/src/game/inventory/traits.js';

describe('Room-Specific Loot Spawning', () => {
    let originalNext;
    let originalNextInt;

    beforeEach(() => {
        originalNext = gameRandom.next;
        originalNextInt = gameRandom.nextInt;
    });

    afterEach(() => {
        gameRandom.next = originalNext;
        gameRandom.nextInt = originalNextInt;
    });

    it('spawns room-specific loot correctly in kitchen, bathroom, and closet', () => {
        // Force the random generator to always succeed the chance roll (since 0.0 < 0.25)
        // and always pick indices deterministically
        gameRandom.next = () => 0.0;
        gameRandom.nextInt = (min, max) => min;

        const map = new GameMap(10, 10);
        
        // Define a building with kitchen, bathroom, and closet rooms
        const building = {
            x: 1,
            y: 1,
            width: 8,
            height: 8,
            type: 'residential',
            rooms: [
                { role: 'kitchen', minX: 1, minY: 1, maxX: 3, maxY: 3 },
                { role: 'bathroom', minX: 4, minY: 1, maxX: 6, maxY: 3 },
                { role: 'closet', minX: 1, minY: 4, maxX: 3, maxY: 6 }
            ]
        };
        map.buildings = [building];

        // Make the room tiles walkable floor tiles
        for (let y = 1; y <= 6; y++) {
            for (let x = 1; x <= 6; x++) {
                const tile = map.getTile(x, y);
                if (tile) {
                    tile.terrain = 'floor';
                }
            }
        }

        // Add a door near one of the kitchen tiles to test door proximity buffer zone exclusion
        // Kitchen room: minX: 1, minY: 1, maxX: 3, maxY: 3.
        // Let's place a door at (1, 1). This should exclude (1,1), (1,2), (2,1), (2,2) from spawning.
        // The tile (3, 3) is at distance dx=2, dy=2 from (1, 1), so (3, 3) should still be eligible.
        const doorTile = map.getTile(1, 1);
        doorTile.contents.push({ type: 'door' });

        const generator = new LootGenerator();
        generator.spawnRoomSpecificLoot(map, 1);

        // Verify kitchen room loot
        let kitchenLootFound = false;
        for (let y = 1; y <= 3; y++) {
            for (let x = 1; x <= 3; x++) {
                const items = map.getItemsOnTile(x, y);
                if (items && items.length > 0) {
                    kitchenLootFound = true;
                    const kitchenItem = items[0];
                    const kitchenDef = ItemDefs[kitchenItem.defId];
                    const isFood = (kitchenDef.id && kitchenDef.id.startsWith('food.')) || (kitchenDef.categories && kitchenDef.categories.includes(ItemCategory.FOOD));
                    const isKnife = (kitchenDef.id && kitchenDef.id.includes('knife')) || (kitchenDef.categories && kitchenDef.categories.includes(ItemCategory.KNIFE));
                    const isPotOrPan = (kitchenDef.categories && kitchenDef.categories.includes(ItemCategory.COOKING_POT)) || kitchenItem.defId === 'tool.cooking_pot' || kitchenItem.defId === 'weapon.frying_pan';
                    const isLunchbox = kitchenItem.defId === 'container.lunchbox';
                    expect(isFood || isKnife || isPotOrPan || isLunchbox).toBe(true);
                }
            }
        }
        expect(kitchenLootFound).toBe(true);

        // Verify bathroom room loot
        let bathroomLootFound = false;
        for (let y = 1; y <= 3; y++) {
            for (let x = 4; x <= 6; x++) {
                const items = map.getItemsOnTile(x, y);
                if (items && items.length > 0) {
                    bathroomLootFound = true;
                    const item = items[0];
                    const def = ItemDefs[item.defId];
                    const isMedical = (def.id && def.id.startsWith('medical.')) || (def.categories && def.categories.includes(ItemCategory.MEDICAL)) || (def.traits && def.traits.includes(ItemTrait.MEDICAL));
                    expect(isMedical).toBe(true);
                }
            }
        }
        expect(bathroomLootFound).toBe(true);

        // Verify closet room loot
        let closetLootFound = false;
        for (let y = 4; y <= 6; y++) {
            for (let x = 1; x <= 3; x++) {
                const items = map.getItemsOnTile(x, y);
                if (items && items.length > 0) {
                    closetLootFound = true;
                    const item = items[0];
                    const def = ItemDefs[item.defId];
                    const isClothing = (def.id && def.id.startsWith('clothing.')) || (def.categories && def.categories.includes(ItemCategory.CLOTHING));
                    const isTape = item.defId === 'crafting.tape';
                    const isWire = item.defId === 'crafting.wire';
                    const isHammer = (def.categories && def.categories.includes(ItemCategory.HAMMER)) || item.defId === 'weapon.hammer' || item.defId === 'weapon.makeshift_hammer';
                    const isWrench = item.defId === 'weapon.wrench';
                    const isToolbox = item.defId === 'container.toolbox';
                    expect(isClothing || isTape || isWire || isHammer || isWrench || isToolbox).toBe(true);
                }
            }
        }
        expect(closetLootFound).toBe(true);
    });

    it('does not spawn room-specific loot if chance roll fails', () => {
        // Force the chance roll to fail (since 0.9 > 0.35)
        gameRandom.next = () => 0.9;
        gameRandom.nextInt = (min, max) => min;

        const map = new GameMap(10, 10);
        const building = {
            x: 1,
            y: 1,
            width: 8,
            height: 8,
            type: 'residential',
            rooms: [
                { role: 'kitchen', minX: 1, minY: 1, maxX: 3, maxY: 3 }
            ]
        };
        map.buildings = [building];

        for (let y = 1; y <= 3; y++) {
            for (let x = 1; x <= 3; x++) {
                const tile = map.getTile(x, y);
                if (tile) tile.terrain = 'floor';
            }
        }

        const generator = new LootGenerator();
        generator.spawnRoomSpecificLoot(map, 1);

        // Verify kitchen room has no loot
        for (let y = 1; y <= 3; y++) {
            for (let x = 1; x <= 3; x++) {
                const items = map.getItemsOnTile(x, y);
                expect(items.length).toBe(0);
            }
        }
    });
});
