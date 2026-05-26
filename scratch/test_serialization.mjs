
import { InventoryManager } from '../client/src/game/inventory/InventoryManager.js';
import { Container } from '../client/src/game/inventory/Container.js';
import { Item } from '../client/src/game/inventory/Item.js';

// Mock window and crypto
global.window = {
    crypto: {
        randomUUID: () => Math.random().toString(36).substring(7)
    }
};

async function testSerialization() {
    console.log("Starting Serialization Test...");

    const manager = new InventoryManager();

    // 1. Verify workspace containers exist
    const workspace = manager.getContainer('crafting-ingredients');
    if (!workspace) {
        console.error("FAILED: Workspace container missing after construction");
        process.exit(1);
    }

    // 2. Add an item to workspace
    const item = new Item({ id: 'food.corn', name: 'Test Corn' });
    workspace.placeItemAt(item, 0, 0);

    // 3. Serialize
    console.log("Serializing...");
    const json = manager.toJSON();

    // 4. Verify workspace IS in the JSON
    const hasWorkspaceInJson = json.containers.some(([id, data]) => id === 'crafting-ingredients');
    if (!hasWorkspaceInJson) {
        console.error("FAILED: Workspace container was NOT persisted in JSON!");
        process.exit(1);
    } else {
        console.log("SUCCESS: Workspace container was successfully included in JSON.");
    }

    // 5. Verify ground IS in the JSON
    const hasGroundInJson = json.containers.some(([id, data]) => id === 'ground');
    if (!hasGroundInJson) {
        console.error("FAILED: Ground container missing from JSON!");
        process.exit(1);
    }

    // 6. Deserialize
    console.log("Deserializing...");
    const restoredManager = InventoryManager.fromJSON(json);

    // 7. Verify workspace exists in restored manager and is NOT empty
    const restoredWorkspace = restoredManager.getContainer('crafting-ingredients');
    if (!restoredWorkspace) {
        console.error("FAILED: Workspace container missing in restored manager");
        process.exit(1);
    }
    if (restoredWorkspace.items.size !== 1) {
        console.error(`FAILED: Restored workspace has size ${restoredWorkspace.items.size}, expected 1!`);
        process.exit(1);
    } else {
        const restoredItem = Array.from(restoredWorkspace.items.values())[0];
        if (restoredItem.id !== 'food.corn') {
            console.error(`FAILED: Restored item ID is ${restoredItem.id}, expected food.corn!`);
            process.exit(1);
        }
        console.log("SUCCESS: Restored workspace is populated with correct items.");
    }

    console.log("Test completed successfully.");
}

testSerialization().catch(console.error);
