
import { Container } from '../client/src/game/inventory/Container.js';
import { Item } from '../client/src/game/inventory/Item.js';
import { ItemDefs } from '../client/src/game/inventory/ItemDefs.js';

// Mock some things to make Item work in Node
global.window = {
    crypto: {
        randomUUID: () => Math.random().toString(36).substring(7)
    }
};

async function testGridClearing() {
    console.log("Starting Grid Clearing Bug Reproduction Test...");

    // 1. Create a 4x4 container
    const container = new Container({
        id: 'test-container',
        width: 4,
        height: 4
    });

    // 2. Define a mock item def
    const cornDefId = 'food.corn';
    
    // 3. Create two Corn items (1x1)
    const corn1 = new Item({
        id: cornDefId,
        name: 'Corn 1',
        width: 1,
        height: 1,
        instanceId: 'corn-instance-1'
    });

    const corn2 = new Item({
        id: cornDefId,
        name: 'Corn 2',
        width: 1,
        height: 1,
        instanceId: 'corn-instance-2'
    });

    // 4. Place them in the container
    container.placeItemAt(corn1, 0, 0);
    container.placeItemAt(corn2, 1, 0);

    console.log("Initial grid state:");
    console.log(container.grid[0].slice(0, 4));

    // Verify both are there
    if (container.grid[0][0] !== 'corn-instance-1' || container.grid[0][1] !== 'corn-instance-2') {
        console.error("FAILED: Initial placement incorrect");
        process.exit(1);
    }

    // 5. Remove Corn 1
    console.log("Removing Corn 1...");
    container.removeItem('corn-instance-1');

    console.log("Grid state after removing Corn 1:");
    console.log(container.grid[0].slice(0, 4));

    // 6. Verify Corn 2 is STILL there
    if (container.grid[0][1] === 'corn-instance-2') {
        console.log("SUCCESS: Corn 2 remains in the grid.");
    } else if (container.grid[0][1] === null) {
        console.error("FAILED: Corn 2 was accidentally cleared from the grid!");
        process.exit(1);
    } else {
        console.error("FAILED: Unexpected grid state:", container.grid[0][1]);
        process.exit(1);
    }

    console.log("Test completed successfully.");
}

testGridClearing().catch(console.error);
