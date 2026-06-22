import { LootGenerator } from '../client/src/game/map/LootGenerator.js';
import { ItemDefs } from '../client/src/game/inventory/ItemDefs.js';

console.log("--- Verifying General Loot Spawns for Lighter and Matchbook ---");

const generator = new LootGenerator();

// 1. Confirm that lighter and matchbook do not have noLoot: true
console.log("Lighter noLoot:", ItemDefs['tool.lighter'].noLoot);
console.log("Matchbook noLoot:", ItemDefs['tool.matchbook'].noLoot);

if (ItemDefs['tool.lighter'].noLoot || ItemDefs['tool.matchbook'].noLoot) {
    console.error("❌ FAILURE: noLoot is still true!");
    process.exit(1);
}

// 2. Roll 10000 times and check if we get at least one lighter and one matchbook
let lighterCount = 0;
let matchbookCount = 0;

for (let i = 0; i < 10000; i++) {
    const items = generator.generateRandomItems('any');
    for (const item of items) {
        if (item.defId === 'tool.lighter') {
            lighterCount++;
        }
        if (item.defId === 'tool.matchbook') {
            matchbookCount++;
        }
    }
}

console.log(`Lighters found in 10,000 rolls: ${lighterCount}`);
console.log(`Matchbooks found in 10,000 rolls: ${matchbookCount}`);

if (lighterCount > 0 && matchbookCount > 0) {
    console.log("✅ SUCCESS: Lighters and matchbooks are spawning naturally in general loot!");
} else {
    console.error("❌ FAILURE: Lighters and matchbooks did not spawn.");
    process.exit(1);
}
