import engine from '../client/src/game/GameEngine.js';
import { EntityFactory } from '../client/src/game/EntityFactory.js';
import { ItemDefs } from '../client/src/game/inventory/ItemDefs.js';
import { CraftingRecipes } from '../client/src/game/inventory/CraftingRecipes.js';

function runTest() {
    console.log("=== Running Auto Turret & Nomad Survivor Vol 8 Verification Test ===");

    // Reset game engine
    engine.reset();
    const player = EntityFactory.createPlayer(0, 0);
    player.ap = 100;
    player.maxAp = 100;
    engine.player = player;

    // 1. Verify Definition of book.nomad_survivor_8
    console.log("\nChecking definition of book.nomad_survivor_8 in ItemDefs.js...");
    const bookDef = ItemDefs['book.nomad_survivor_8'];
    if (!bookDef) {
        throw new Error("FAIL: book.nomad_survivor_8 definition is missing!");
    }
    console.log(`✅ book.nomad_survivor_8 is defined: "${bookDef.name}"`);
    console.log(`✅ Description: "${bookDef.description}"`);
    if (bookDef.totalPages !== 50) {
        throw new Error(`FAIL: book.nomad_survivor_8 totalPages should be 50, got ${bookDef.totalPages}`);
    }
    console.log(`✅ totalPages: ${bookDef.totalPages}`);

    // 2. Verify bookStats Initialization
    console.log("\nChecking if book.nomad_survivor_8 is in engine.bookStats...");
    const stats = engine.bookStats['book.nomad_survivor_8'];
    if (!stats) {
        throw new Error("FAIL: book.nomad_survivor_8 stats not found in engine.bookStats!");
    }
    console.log(`✅ Stats found. pagesLeft initialized to: ${stats.pagesLeft}`);
    if (stats.pagesLeft !== 50) {
        throw new Error(`FAIL: pagesLeft should be 50, got ${stats.pagesLeft}`);
    }

    // 3. Verify recipe requirement configuration
    console.log("\nChecking if crafting.auto_turret recipe exists and is connected to Vol 8...");
    const recipe = CraftingRecipes.find(r => r.id === 'crafting.auto_turret');
    if (!recipe) {
        throw new Error("FAIL: crafting.auto_turret recipe is missing!");
    }
    console.log(`✅ Recipe name: "${recipe.name}"`);
    console.log(`✅ Required book: "${recipe.requiredBook}"`);
    if (recipe.requiredBook !== 'book.nomad_survivor_8') {
        throw new Error(`FAIL: recipe requiredBook should be 'book.nomad_survivor_8', got '${recipe.requiredBook}'`);
    }

    // 4. Verify Recipe Lock initially
    console.log("\nChecking if recipe is locked initially...");
    const initialCheck = engine.inventoryManager.craftingManager.checkRequirements('crafting.auto_turret', player.ap, player.craftingLvl);
    console.log("Initial check results:", initialCheck);
    if (initialCheck.canCraft !== false || !initialCheck.missing.includes('Recipe Locked')) {
        throw new Error("FAIL: Recipe should be locked initially!");
    }
    console.log("✅ Recipe is locked correctly.");

    // 5. Verify Recipe Unlock after reading
    console.log("\nSimulating reading Nomad Survivor Vol 8...");
    stats.pagesLeft = 0; // Fully read

    const afterCheck = engine.inventoryManager.craftingManager.checkRequirements('crafting.auto_turret', player.ap, player.craftingLvl);
    console.log("After check results:", afterCheck);
    if (afterCheck.missing.includes('Recipe Locked')) {
        throw new Error("FAIL: Recipe is still locked after reading the book!");
    }
    console.log("✅ Recipe is unlocked correctly! (Missing list no longer contains 'Recipe Locked')");

    console.log("\n=== ALL TESTS PASSED SUCCESSFULLY ===");
}

try {
    runTest();
} catch (error) {
    console.error("Test failed with error:", error);
    process.exit(1);
}
