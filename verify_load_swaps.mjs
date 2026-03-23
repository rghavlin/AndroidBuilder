
import { ItemDefs, createItemFromDef } from './client/src/game/inventory/ItemDefs.js';
import { InventoryManager } from './client/src/game/inventory/InventoryManager.js';
import { Item } from './client/src/game/inventory/Item.js';

async function verifyLoadSwaps() {
    try {
        console.log("STEP 1: Initializing Manager");
        const manager = new InventoryManager();
        
        console.log("STEP 2: Creating Flashlight and empty battery");
        const flashlight = new Item(createItemFromDef('tool.smallflashlight'));
        flashlight.instanceId = 'flashlight-1';
        
        const emptyBattery = new Item(createItemFromDef('tool.battery'));
        emptyBattery.instanceId = 'battery-empty';
        emptyBattery.ammoCount = 0;
        
        console.log("STEP 3: Attaching empty battery to flashlight");
        flashlight.attachItem('battery', emptyBattery);
        manager.equipment.flashlight = flashlight;
        flashlight.isEquipped = true;
        
        const initialAttach = flashlight.getAttachment('battery');
        console.log(`Initial State: Flashlight battery is ${initialAttach.instanceId} (Charge: ${initialAttach.ammoCount})`);

        console.log("STEP 4: Equipping Backpack");
        const bp = new Item(createItemFromDef('backpack.standard'));
        manager.equipItem(bp, 'backpack');
        const backpack = manager.getBackpackContainer();
        if (!backpack) throw new Error("Backpack container missing");

        console.log("STEP 5: Adding Battery Stack to Backpack");
        const batteryStack = new Item(createItemFromDef('tool.battery'));
        batteryStack.instanceId = 'battery-stack';
        batteryStack.stackCount = 5;
        
        const addStackResult = backpack.addItem(batteryStack, 0, 0);
        if (!addStackResult) throw new Error("Failed to add battery stack to backpack");
        console.log(`Backpack has battery stack: ${batteryStack.instanceId} (Count: ${batteryStack.stackCount}) at (${batteryStack.x}, ${batteryStack.y})`);

        console.log("STEP 6: Performing SWAP");
        const result = manager.attachItemToWeapon(flashlight, 'battery', batteryStack, backpack.id);
        
        if (!result.success) {
            console.error("SWAP REJECTED:", result.reason);
            throw new Error(`Swap failed: ${result.reason}`);
        }
        console.log("SWAP SUCCESSFUL");

        console.log("STEP 7: Verifying Attached Item");
        const attachedBattery = flashlight.getAttachment('battery');
        console.log(`New Flashlight battery: ${attachedBattery.instanceId} (Charge: ${attachedBattery.ammoCount}, Stack: ${attachedBattery.stackCount})`);
        
        if (attachedBattery.instanceId !== 'battery-stack') {
             throw new Error(`Attachment instanceId mismatch. Expected battery-stack, got ${attachedBattery.instanceId}`);
        }
        if (attachedBattery.stackCount !== 1) {
            throw new Error(`Attached battery stack count error. Expected 1, got ${attachedBattery.stackCount}`);
        }

        console.log("STEP 8: Verifying Displaced Item");
        // We check backpack for the empty battery
        const displaced = backpack.getAllItems().find(it => it.instanceId === 'battery-empty');
        if (!displaced) {
            console.log("Backpack Items:", backpack.getAllItems().map(it => it.instanceId));
            throw new Error("Empty battery was not displaced to backpack");
        }
        console.log(`✅ Displaced empty battery found at (${displaced.x}, ${displaced.y})`);

        console.log("STEP 9: Verifying Remainder");
        const remainder = backpack.getAllItems().find(it => it.instanceId.startsWith('battery-stack-split'));
        if (!remainder) {
             console.log("Backpack Items:", backpack.getAllItems().map(it => it.instanceId));
             throw new Error("Remainder of battery stack not found in backpack");
        }
        console.log(`✅ Remainder found: ${remainder.instanceId} (Count: ${remainder.stackCount}) at (${remainder.x}, ${remainder.y})`);

        console.log("\n✅ ALL TESTS PASSED");

    } catch (error) {
        console.error("\nFAIL:", error.message);
        console.error(error.stack);
        process.exit(1);
    }
}

verifyLoadSwaps();
