
// Reproduction script for zombie loot issue
const { LootGenerator } = require('./client/src/game/map/LootGenerator.js');
const { ItemDefs } = require('./client/src/game/inventory/ItemDefs.js');
const { ItemCategory } = require('./client/src/game/inventory/traits.js');

// Mock createItemFromDef if needed or use real one
function mockCreateItemFromDef(defId) {
    const def = ItemDefs[defId];
    if (!def) return null;
    return { ...def, defId };
}

// Override LootGenerator's createItemFromDef for testing if necessary
// But LootGenerator imports it, so we might need to mock the module

console.log("Testing Zombie Loot Drops...");

const lootGen = new LootGenerator();
const subtypes = ['basic', 'crawler', 'runner', 'acid', 'fat', 'firefighter', 'swat'];

subtypes.forEach(subtype => {
    let drops = 0;
    const iterations = 100;
    for (let i = 0; i < iterations; i++) {
        const items = lootGen.generateZombieLoot(subtype);
        if (items && items.length > 0) {
            drops++;
        }
    }
    console.log(`Subtype: ${subtype} - Drop Rate: ${(drops / iterations * 100).toFixed(1)}%`);
});

console.log("\nTesting Rarity Weights...");
lootGen.initItemKeys();
const clothingKeys = lootGen.itemKeys.filter(key => {
    const def = ItemDefs[key];
    return (def.categories && def.categories.includes(ItemCategory.CLOTHING)) || key === 'crafting.rag';
});
console.log(`Available Clothing/Rag Keys: ${clothingKeys.length}`);
if (clothingKeys.length === 0) {
    console.error("ERROR: No clothing/rag keys found! Common loot will fail.");
}
