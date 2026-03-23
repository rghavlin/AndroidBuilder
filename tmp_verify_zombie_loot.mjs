
import { LootGenerator } from './client/src/game/map/LootGenerator.js';
import { ItemDefs } from './client/src/game/inventory/ItemDefs.js';
import { ItemCategory } from './client/src/game/inventory/traits.js';

console.log("Testing Zombie Loot Drops...");

const lootGen = new LootGenerator();
const subtypes = ['basic', 'crawler', 'runner', 'acid', 'fat', 'firefighter', 'swat'];

subtypes.forEach(subtype => {
    let drops = 0;
    const iterations = 1000;
    for (let i = 0; i < iterations; i++) {
        const items = lootGen.generateZombieLoot(subtype);
        if (items && items.length > 0) {
            drops++;
        }
    }
    console.log(`Subtype: ${subtype} - Drop Rate: ${(drops / iterations * 100).toFixed(1)}%`);
});

console.log("\nTesting Item Keys...");
lootGen.initItemKeys();
console.log(`Initial Item Keys: ${lootGen.itemKeys.length}`);

const clothingKeys = lootGen.itemKeys.filter(key => {
    const def = ItemDefs[key];
    return (def.categories && def.categories.includes(ItemCategory.CLOTHING)) || key === 'crafting.rag';
});

console.log(`Available Clothing/Rag Keys: ${clothingKeys.length}`);
if (clothingKeys.length === 0) {
    console.error("ERROR: No clothing/rag keys found!");
}
