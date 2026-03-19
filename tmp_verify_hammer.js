
import { ItemDefs } from './client/src/game/inventory/ItemDefs.js';
import { CraftingRecipes } from './client/src/game/inventory/CraftingRecipes.js';

console.log('--- Verification: Makeshift Hammer ---');

const hammerDef = ItemDefs['weapon.makeshift_hammer'];
if (hammerDef) {
    console.log('✅ ItemDefs: weapon.makeshift_hammer found');
    console.log(`   Name: ${hammerDef.name}`);
    console.log(`   ImageId: ${hammerDef.imageId}`);
} else {
    console.log('❌ ItemDefs: weapon.makeshift_hammer NOT found');
}

const hatchetDef = ItemDefs['weapon.makeshift_hatchet'];
if (hatchetDef) {
    console.log('❌ ItemDefs: weapon.makeshift_hatchet STILL exists');
} else {
    console.log('✅ ItemDefs: weapon.makeshift_hatchet REMOVED');
}

const hammerRecipe = CraftingRecipes.find(r => r.id === 'crafting.makeshift_hammer');
if (hammerRecipe) {
    console.log('✅ CraftingRecipes: crafting.makeshift_hammer found');
    console.log(`   Name: ${hammerRecipe.name}`);
    console.log(`   Result: ${hammerRecipe.resultItem}`);
} else {
    console.log('❌ CraftingRecipes: crafting.makeshift_hammer NOT found');
}

const hatchetRecipe = CraftingRecipes.find(r => r.id === 'crafting.makeshift_hatchet');
if (hatchetRecipe) {
    console.log('❌ CraftingRecipes: crafting.makeshift_hatchet STILL exists');
} else {
    console.log('✅ CraftingRecipes: crafting.makeshift_hatchet REMOVED');
}
