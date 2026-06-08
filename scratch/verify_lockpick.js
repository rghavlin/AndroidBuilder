import { ItemDefs } from '../client/src/game/inventory/ItemDefs.js';
import { CraftingRecipes } from '../client/src/game/inventory/CraftingRecipes.js';
import { ZOMBIE_LOOT } from '../client/src/game/map/LootTables.js';
import { ItemTrait } from '../client/src/game/inventory/traits.js';

console.log('=== VERIFICATION: Lockpick Integration ===\n');

// 1. Verify Item Definition
const lockpickDef = ItemDefs['tool.lockpick'];
if (lockpickDef) {
    console.log('✅ ItemDefs: tool.lockpick definition found');
    console.log(`   - Name: ${lockpickDef.name}`);
    console.log(`   - Rarity: ${lockpickDef.rarity}`);
    console.log(`   - Width: ${lockpickDef.width}, Height: ${lockpickDef.height}`);
    console.log(`   - Image: ${lockpickDef.imageId}`);
    console.log(`   - Traits: ${JSON.stringify(lockpickDef.traits)}`);
    console.log(`   - Stack Max: ${lockpickDef.stackMax}`);
    
    // Check specific properties
    const correctWidth = lockpickDef.width === 1 && lockpickDef.height === 1;
    const correctImage = lockpickDef.imageId === 'lockpick';
    const correctStack = lockpickDef.stackMax === 10;
    const correctTraits = lockpickDef.traits.includes(ItemTrait.STACKABLE) && lockpickDef.traits.includes(ItemTrait.CAN_PICK_LOCKS);
    
    if (correctWidth && correctImage && correctStack && correctTraits) {
        console.log('✅ ItemDefs details match requirements perfectly!');
    } else {
        console.log('❌ ItemDefs details do NOT match requirements!');
    }
} else {
    console.log('❌ ItemDefs: tool.lockpick definition NOT found!');
}

// 2. Verify Crafting Recipe
const recipe = CraftingRecipes.find(r => r.id === 'crafting.lockpick');
if (recipe) {
    console.log('\n✅ CraftingRecipes: crafting.lockpick recipe found');
    console.log(`   - Name: ${recipe.name}`);
    console.log(`   - Result Item: ${recipe.resultItem}`);
    console.log(`   - AP Cost: ${recipe.apCost}`);
    console.log(`   - Ingredients: ${JSON.stringify(recipe.ingredients)}`);
    
    const correctIngredients = recipe.ingredients.length === 2 &&
        recipe.ingredients.some(ing => ing.id === 'crafting.nail' && ing.count === 1) &&
        recipe.ingredients.some(ing => ing.id === 'crafting.wire' && ing.count === 1);
    const correctCost = recipe.apCost === 2;
    
    if (correctIngredients && correctCost) {
        console.log('✅ Recipe ingredients and AP cost match requirements perfectly!');
    } else {
        console.log('❌ Recipe details do NOT match requirements!');
    }
} else {
    console.log('\n❌ CraftingRecipes: crafting.lockpick recipe NOT found!');
}

// 3. Verify Loot Table Integration
const isUncommonDrop = ZOMBIE_LOOT.uncommon.includes('tool.lockpick');
if (isUncommonDrop) {
    console.log('\n✅ ZOMBIE_LOOT: tool.lockpick is in ZOMBIE_LOOT.uncommon');
} else {
    console.log('\n❌ ZOMBIE_LOOT: tool.lockpick NOT found in ZOMBIE_LOOT.uncommon!');
}
