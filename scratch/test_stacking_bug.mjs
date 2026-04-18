
import { CraftingManager } from '../client/src/game/inventory/CraftingManager.js';
import { Container } from '../client/src/game/inventory/Container.js';
import { Item } from '../client/src/game/inventory/Item.js';
import { ItemTrait, ItemCategory } from '../client/src/game/inventory/traits.js';

// Mock InventoryManager
const mockInv = {
    getContainer: (id) => null,
    groundContainer: null
};

const cm = new CraftingManager(mockInv);

// Create a container
const container = new Container({ id: 'test', width: 10, height: 10 });

// Create a stack of water bottles
const waterBottleDef = {
    instanceId: 'stack-1',
    defId: 'food.waterbottle',
    name: 'Water Bottle',
    width: 1,
    height: 2,
    traits: [ItemTrait.STACKABLE, ItemTrait.WATER_CONTAINER],
    stackCount: 5,
    stackMax: 10,
    ammoCount: 20,
    capacity: 20,
    waterQuality: 'clean'
};
const stack = new Item(waterBottleDef);
container.placeItemAt(stack, 0, 0);

console.log('Initial stack count:', stack.stackCount);

// Call _consumeFromStack (the one we just fixed in the real file)
const singleItem = cm._consumeFromStack(stack, container);

console.log('After _consumeFromStack:');
console.log('Original stack count:', stack.stackCount);
console.log('Single item instanceId:', singleItem.instanceId);
console.log('Single item stackCount:', singleItem.stackCount);

// Check if singleItem is in container
const inContainer = container.items.has(singleItem.instanceId);
console.log('Is single item in container?', inContainer);

// Now test a more complex scenario: consuming more water than one bottle holds
// Reset container and stack
container.clear();
const stack2 = new Item({
    ...waterBottleDef,
    instanceId: 'stack-2',
    ammoCount: 5, // Only 5 water per bottle
    stackCount: 10
});
container.placeItemAt(stack2, 0, 0);

console.log('\n--- Multi-bottle consumption test ---');
console.log('Initial stack count:', stack2.stackCount);

// Simulate the loop in stew logic
let waterToConsume = 12;
const waterContainers = [stack2];
const ingredientContainer = container;

for (const item of waterContainers) {
    if (waterToConsume <= 0) break;
    while (waterToConsume > 0 && (item.ammoCount || 0) > 0) {
        const consume = Math.min(item.ammoCount, waterToConsume);
        const targetItem = cm._consumeFromStack(item, ingredientContainer);
        targetItem.ammoCount -= consume;
        waterToConsume -= consume;
        console.log(`Consumed ${consume}. Target ammo: ${targetItem.ammoCount}. Stack remaining: ${item.stackCount}`);
        if (item !== targetItem && item.stackCount <= 0) break;
        if (item === targetItem) break;
    }
}

console.log('Final waterToConsume:', waterToConsume);
console.log('Final stack count:', stack2.stackCount);
console.log('Total items in container:', container.items.size);
