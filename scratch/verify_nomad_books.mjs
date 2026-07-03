import { EntityFactory } from '../client/src/game/EntityFactory.js';
import engine from '../client/src/game/GameEngine.js';

function runTest() {
    console.log("=== Running Nomad Survivor Books Verification Test ===");
    
    // 1. Reset engine to initialize players/stats
    engine.reset();
    const player = EntityFactory.createPlayer(0, 0);
    player.ap = 100;
    player.maxAp = 100;
    engine.player = player;

    console.log("Checking if Nomad Survivor Vol 1 book is initialized in bookStats...");
    const bookId = 'book.nomad_survivor_1';
    const stats = engine.bookStats[bookId];
    if (!stats) {
        throw new Error("FAIL: bookStats not initialized for book.nomad_survivor_1!");
    }
    console.log(`✅ bookStats found. Pages left: ${stats.pagesLeft}`);

    console.log("\nChecking if small_sled recipe is locked initially...");
    const recipeId = 'crafting.small_sled';
    const initialCheck = engine.inventoryManager.craftingManager.checkRequirements(recipeId, player.ap, player.craftingLvl);
    console.log("Initial check results:", initialCheck);
    if (initialCheck.canCraft !== false || !initialCheck.missing.includes('Recipe Locked')) {
        throw new Error("FAIL: Sled recipe should be locked initially!");
    }
    console.log("✅ Recipe is locked correctly.");

    console.log("\nSimulating reading book.nomad_survivor_1...");
    // Let's mock a book item
    const bookItem = {
        defId: bookId,
        name: 'Nomad Survivor Vol 1',
        hasTrait: (trait) => trait === 'readable',
        hasCategory: (cat) => cat === 'book' || cat === 'fuel'
    };

    // We mock checkPlayerTurn or trigger reading directly
    // Since readBook is a context callback that checks turn, we can verify pagesLeft directly:
    console.log(`Pages remaining before read: ${stats.pagesLeft}`);
    stats.pagesLeft = 0; // Simulate fully read
    console.log(`Pages remaining after read simulation: ${stats.pagesLeft}`);

    console.log("\nChecking if small_sled recipe is unlocked after reading book...");
    const afterCheck = engine.inventoryManager.craftingManager.checkRequirements(recipeId, player.ap, player.craftingLvl);
    console.log("After check results:", afterCheck);
    // Since we don't have ingredients, it should say canCraft: false, but the missing array should NOT contain 'Recipe Locked'
    if (afterCheck.missing.includes('Recipe Locked')) {
        throw new Error("FAIL: Recipe is still locked after reading the book!");
    }
    console.log("✅ Recipe is unlocked correctly! (Missing list no longer has 'Recipe Locked')");

    console.log("\n=== ALL TESTS PASSED SUCCESSFULLY ===");
}

try {
    runTest();
} catch (error) {
    console.error("Test failed with error:", error);
    process.exit(1);
}
