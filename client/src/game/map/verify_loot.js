
import { ItemDefs, createItemFromDef } from '../inventory/ItemDefs.js';
import { LootGenerator } from './LootGenerator.js';

// Mock GameMap to test LootGenerator
class MockGameMap {
    constructor(width, height) {
        this.width = width;
        this.height = height;
        this.tiles = Array(height).fill().map(() => Array(width).fill({ terrain: 'grass' }));
        this.loot = {};
    }
    getTile(x, y) { return { terrain: this.tiles[y][x].terrain }; }
    setItemsOnTile(x, y, items) { this.loot[`${x},${y}`] = items; }
}

const generator = new LootGenerator();
const indoorMap = new MockGameMap(10, 10);
indoorMap.tiles = Array(10).fill().map(() => Array(10).fill({ terrain: 'floor' }));

const outdoorMap = new MockGameMap(10, 10);
outdoorMap.tiles = Array(10).fill().map(() => Array(10).fill({ terrain: 'grass' }));

console.log("\n--- Running Validation Tests ---");
function validatePiles(location, iterations = 100) {
    let stats = {
        stones: 0,
        bandages: 0,
        stonePiles: 0,
        bandagePiles: 0,
        errors: []
    };

    for (let i = 0; i < iterations; i++) {
        const items = generator.generateRandomItems(location);
        const stones = items.filter(item => item.defId === 'crafting.stone');
        const bandages = items.filter(item => item.defId === 'medical.bandage');

        if (stones.length > 1) {
            stats.errors.push(`FAIL: Found ${stones.length} stones in one pile at loop ${i}`);
        }
        if (bandages.length > 1) {
            stats.errors.push(`FAIL: Found ${bandages.length} bandages in one pile at loop ${i}`);
        }

        stones.forEach(s => {
            if (s.stackCount !== 1) stats.errors.push(`FAIL: Stone has stackCount ${s.stackCount} at loop ${i}`);
            stats.stones++;
        });
        bandages.forEach(b => {
            if (b.stackCount !== 1) stats.errors.push(`FAIL: Bandage has stackCount ${b.stackCount} at loop ${i}`);
            stats.bandages++;
        });

        if (stones.length > 0) stats.stonePiles++;
        if (bandages.length > 0) stats.bandagePiles++;
    }

    if (stats.errors.length === 0) {
        console.log(`[PASS] ${location}: Validated ${iterations} piles. Stones: ${stats.stones}, Bandages: ${stats.bandages}`);
    } else {
        stats.errors.forEach(e => console.error(e));
    }
}

validatePiles('inside');
validatePiles('outside');

console.log("\n--- Checking Item Definitions ---");
console.log("Stick:", ItemDefs['weapon.stick']);
console.log("Stone:", ItemDefs['crafting.stone']);
console.log("Bandage:", ItemDefs['medical.bandage']);
console.log("Tape:", ItemDefs['crafting.tape']);
console.log("Wire:", ItemDefs['crafting.wire']);
