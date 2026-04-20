
import { Item } from '../client/src/game/inventory/Item.js';
import { ItemDefs } from '../client/src/game/inventory/ItemDefs.js';
import { ItemTrait } from '../client/src/game/inventory/traits.js';

// Mock engine and other dependencies if needed, or just test the Item class logic
console.log("Starting Verification of Water Bottle Stacking...");

const bottleDef = ItemDefs['food.waterbottle'];
if (!bottleDef) {
    console.error("CRITICAL: food.waterbottle definition not found!");
    process.exit(1);
}

// 1. Create two empty bottles
const bottle1 = new Item({...bottleDef, instanceId: 'bottle-1', ammoCount: 0});
const bottle2 = new Item({...bottleDef, instanceId: 'bottle-2', ammoCount: 0});

console.log(`Bottle 1: ${bottle1.name}, ID: ${bottle1.defId}, Ammo: ${bottle1.ammoCount}`);
console.log(`Bottle 2: ${bottle2.name}, ID: ${bottle2.defId}, Ammo: ${bottle2.ammoCount}`);

const canStackEmpty = bottle1.canStackWith(bottle2);
console.log(`Can stack two empty bottles? ${canStackEmpty ? 'YES' : 'NO'}`);

// 2. Create two full bottles
const bottle3 = new Item({...bottleDef, instanceId: 'bottle-3', ammoCount: 20});
const bottle4 = new Item({...bottleDef, instanceId: 'bottle-4', ammoCount: 20});

const canStackFull = bottle3.canStackWith(bottle4);
console.log(`Can stack two full bottles? ${canStackFull ? 'YES' : 'NO'}`);

// 3. Create one partial bottle
const bottle5 = new Item({...bottleDef, instanceId: 'bottle-5', ammoCount: 10});
const canStackPartial = bottle1.canStackWith(bottle5);
console.log(`Can stack empty with partial (10)? ${canStackPartial ? 'YES' : 'NO'}`);

const canStackPartialWithPartial = bottle5.canStackWith(bottle5); // Should be false because not empty or full
console.log(`Can stack partial (10) with itself? ${bottle5.canStackWith(new Item({...bottleDef, instanceId: 'bottle-6', ammoCount: 10})) ? 'YES' : 'NO'}`);

if (canStackEmpty && canStackFull && !canStackPartial) {
    console.log("SUCCESS: Stacking logic is correct.");
} else {
    console.error("FAILURE: Stacking logic mismatch!");
}
