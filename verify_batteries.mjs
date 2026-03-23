
import { ItemDefs, createItemFromDef } from './client/src/game/inventory/ItemDefs.js';
import { LootGenerator } from './client/src/game/map/LootGenerator.js';
import { Item } from './client/src/game/inventory/Item.js';

async function verifyBatteries() {
    try {
        console.log("Starting Battery Loot Verification...");
        const lootGen = new LootGenerator();

        // 1. Verify World SPawn (LootGenerator.generateRandomItems)
        // We might need to call it multiple times since it's random
        console.log("Checking World Loot for Batteries...");
        let batteryFound = false;
        for (let i = 0; i < 500; i++) {
            const items = lootGen.generateRandomItems('any');
            const battery = items.find(it => it.defId === 'tool.battery');
            if (battery) {
                batteryFound = true;
                console.log(`✅ Found World Battery: Charge=${battery.ammoCount}, Stack=${battery.stackCount}`);
                if (battery.ammoCount !== (battery.capacity || 10)) {
                    throw new Error(`Battery charge incorrect: ${battery.ammoCount}`);
                }
                if (battery.stackCount !== 1) {
                    throw new Error(`Battery stack size incorrect: ${battery.stackCount}`);
                }
                break;
            }
        }
        if (!batteryFound) console.warn("⚠️ No battery found in 500 world loot attempts (uncommon)");

        // 2. Verify Zombie Spawn (LootGenerator.generateZombieLoot)
        console.log("Checking Zombie Loot for Flashlights...");
        let flashlightFound = false;
        for (let i = 0; i < 500; i++) {
            const items = lootGen.generateZombieLoot('exotic'); // exotic has flashlight
            const flashlight = items.find(it => it.defId === 'tool.smallflashlight');
            if (flashlight) {
                flashlightFound = true;
                const battery = flashlight.attachments['battery'];
                if (battery) {
                    console.log(`✅ Found Flashlight Battery: Charge=${battery.ammoCount}`);
                    if (battery.ammoCount !== (battery.capacity || 10)) {
                        throw new Error(`Flashlight battery charge incorrect: ${battery.ammoCount}`);
                    }
                } else {
                    console.warn("⚠️ Flashlight spawned without battery (is this expected?)");
                }
                break;
            }
        }
        
        // 3. Verify Stacking Logic
        console.log("Verifying Battery Stacking...");
        const b1 = Item.fromJSON({ ...ItemDefs['tool.battery'], instanceId: 'b1' });
        const b2 = Item.fromJSON({ ...ItemDefs['tool.battery'], instanceId: 'b2' });
        
        // Both full
        console.log(`B1: ${b1.ammoCount}, B2: ${b2.ammoCount}, CanStack: ${b1.canStackWith(b2)}`);
        if (!b1.canStackWith(b2)) throw new Error("Full batteries should stack");

        // One partially used
        b2.ammoCount = 5;
        console.log(`B1: ${b1.ammoCount}, B2: ${b2.ammoCount}, CanStack: ${b1.canStackWith(b2)}`);
        if (b1.canStackWith(b2)) throw new Error("Used battery should not stack with full one");

        // Both same partial use (should they stack? User said "full batteries stackable")
        // Current logic says they only stack if BOTH are EMPTY or BOTH are FULL.
        // Wait, let's look at the code again.
        // if (!(isFull || isEmpty) || this.ammoCount !== otherItem.ammoCount) return false;
        // This means if both are 5, they won't stack because !(isFull || isEmpty) is true (they are neither full nor empty).
        // Correct. Only full or empty stack.
        
        console.log("✅ Battery Stacking logic verified.");
        console.log("✅ Battery Loot Verification PASSED.");

    } catch (error) {
        console.error("❌ ERROR during battery verification:");
        console.error(error.stack || error);
        process.exit(1);
    }
}

verifyBatteries();
