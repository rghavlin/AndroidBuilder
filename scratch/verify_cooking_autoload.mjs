import { CraftingRecipes } from '../client/src/game/inventory/CraftingRecipes.js';
import { Item } from '../client/src/game/inventory/Item.js';
import { ItemDefs, createItemFromDef } from '../client/src/game/inventory/ItemDefs.js';
import { Container } from '../client/src/game/inventory/Container.js';
import { InventoryManager } from '../client/src/game/inventory/InventoryManager.js';
import { ItemCategory } from '../client/src/game/inventory/traits.js';

// Minimal global mocks
globalThis.window = { gameEngine: { inventoryManager: null } };

let passed = 0;
let failed = 0;

function assert(condition, label) {
    if (condition) {
        console.log(`✅ PASS: ${label}`);
        passed++;
    } else {
        console.error(`❌ FAIL: ${label}`);
        failed++;
    }
}

async function verify() {
    console.log('=== P2-07: Verify cooking autoload/unload ===\n');

    // --- Setup InventoryManager ---
    const inv = new InventoryManager();

    // Put items in ground container for autoload to find
    // Cooking recipe items: stew needs a cooking pot + veggie/meat + water
    const pot = new Item({ ...ItemDefs['tool.cooking_pot'], instanceId: 'pot-1' });
    const rawMeat = new Item({ ...ItemDefs['food.raw_meat'], instanceId: 'meat-1', stackCount: 2 });
    const waterBottle = new Item({
        ...ItemDefs['food.waterbottle'],
        instanceId: 'water-1',
        ammoCount: 20,
        waterQuality: 'dirty'
    });

    inv.groundContainer.addItem(pot);
    inv.groundContainer.addItem(rawMeat);
    inv.groundContainer.addItem(waterBottle);

    // Crafting recipe items: makeshift hammer needs stick + stone + tape/wire
    const stick = new Item({ ...ItemDefs['weapon.stick'], instanceId: 'stick-1' });
    const stone = new Item({ ...ItemDefs['crafting.stone'], instanceId: 'stone-1' });
    const tape = new Item({ ...ItemDefs['crafting.tape'], instanceId: 'tape-1' });

    inv.groundContainer.addItem(stick);
    inv.groundContainer.addItem(stone);
    inv.groundContainer.addItem(tape);

    console.log('--- Test 1: Autoload a COOKING recipe (cooking.stew) ---');
    const stew = CraftingRecipes.find(r => r.id === 'cooking.stew');
    assert(stew !== undefined, 'cooking.stew recipe exists');
    assert(stew.tab === 'cooking', 'cooking.stew has tab=cooking');

    const craftingManager = inv.craftingManager;
    const loadResult = craftingManager.autoload('cooking.stew');
    assert(loadResult.success === true, 'autoload cooking.stew succeeded');

    // Verify items were moved to COOKING containers, not crafting ones
    const cookingTools = inv.getContainer('cooking-tools');
    const cookingIngredients = inv.getContainer('cooking-ingredients');
    const craftingTools = inv.getContainer('crafting-tools');
    const craftingIngredients = inv.getContainer('crafting-ingredients');

    const cookingToolItems = cookingTools.getAllItems();
    const cookingIngItems = cookingIngredients.getAllItems();
    const craftingToolItems = craftingTools.getAllItems();
    const craftingIngItems = craftingIngredients.getAllItems();

    assert(cookingToolItems.length > 0, 'cooking-tools has items after autoload cooking recipe');
    assert(cookingIngItems.length > 0, 'cooking-ingredients has items after autoload cooking recipe');
    assert(craftingToolItems.length === 0, 'crafting-tools is EMPTY after autoload cooking recipe');
    assert(craftingIngItems.length === 0, 'crafting-ingredients is EMPTY after autoload cooking recipe');

    console.log(`  cooking-tools: ${cookingToolItems.map(i => i.name).join(', ')}`);
    console.log(`  cooking-ingredients: ${cookingIngItems.map(i => i.name).join(', ')}`);

    console.log('\n--- Test 2: Unload clears ALL workspaces ---');
    craftingManager.unload();

    assert(cookingTools.getAllItems().length === 0, 'cooking-tools is empty after unload');
    assert(cookingIngredients.getAllItems().length === 0, 'cooking-ingredients is empty after unload');
    assert(craftingTools.getAllItems().length === 0, 'crafting-tools is empty after unload');
    assert(craftingIngredients.getAllItems().length === 0, 'crafting-ingredients is empty after unload');

    // Items should be back in ground
    const groundItems = inv.groundContainer.getAllItems();
    console.log(`  Ground items after unload: ${groundItems.map(i => i.name).join(', ')}`);
    assert(groundItems.length >= 3, 'Items returned to ground after unload');

    console.log('\n--- Test 3: Autoload a CRAFTING recipe (crafting.makeshift_hammer) ---');
    const hammer = CraftingRecipes.find(r => r.id === 'crafting.makeshift_hammer');
    assert(hammer !== undefined, 'crafting.makeshift_hammer recipe exists');
    assert(hammer.tab === 'crafting', 'crafting.makeshift_hammer has tab=crafting');

    const loadResult2 = craftingManager.autoload('crafting.makeshift_hammer');
    assert(loadResult2.success === true, 'autoload crafting.makeshift_hammer succeeded');

    const craftingToolItems2 = craftingTools.getAllItems();
    const craftingIngItems2 = craftingIngredients.getAllItems();
    const cookingToolItems2 = cookingTools.getAllItems();
    const cookingIngItems2 = cookingIngredients.getAllItems();

    assert(craftingIngItems2.length > 0, 'crafting-ingredients has items after autoload crafting recipe');
    assert(cookingToolItems2.length === 0, 'cooking-tools is EMPTY after autoload crafting recipe');
    assert(cookingIngItems2.length === 0, 'cooking-ingredients is EMPTY after autoload crafting recipe');

    console.log(`  crafting-tools: ${craftingToolItems2.map(i => i.name).join(', ')}`);
    console.log(`  crafting-ingredients: ${craftingIngItems2.map(i => i.name).join(', ')}`);

    console.log('\n--- Test 4: Unload after crafting recipe also clears cooking containers ---');
    // Manually add an item to cooking-tools to simulate a leftover
    const leftoverPot = new Item({ ...ItemDefs['tool.cooking_pot'], instanceId: 'leftover-pot' });
    cookingTools.addItem(leftoverPot);
    assert(cookingTools.getAllItems().length === 1, 'Manually placed item in cooking-tools');

    craftingManager.unload();

    assert(cookingTools.getAllItems().length === 0, 'cooking-tools cleared by unload (leftover removed)');
    assert(cookingIngredients.getAllItems().length === 0, 'cooking-ingredients cleared by unload');
    assert(craftingTools.getAllItems().length === 0, 'crafting-tools cleared by unload');
    assert(craftingIngredients.getAllItems().length === 0, 'crafting-ingredients cleared by unload');

    console.log(`\n=== Results: ${passed} passed, ${failed} failed ===`);
    if (failed > 0) {
        console.error('\n❌ SOME TESTS FAILED');
        process.exit(1);
    } else {
        console.log('\n🎉 All P2-07 cooking autoload/unload tests passed!');
    }
}

verify().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});
