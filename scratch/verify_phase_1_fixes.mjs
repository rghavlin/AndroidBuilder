import { Entity } from '../client/src/game/entities/Entity.js';
import { CombatSystem } from '../client/src/game/systems/CombatSystem.js';
import { Container } from '../client/src/game/inventory/Container.js';
import { Item } from '../client/src/game/inventory/Item.js';

// Mock window and crypto
global.window = {
    crypto: {
        randomUUID: () => Math.random().toString(36).substring(7)
    }
};

async function testPhase1() {
    console.log("=== Testing Phase 1: Critical Bug Fixes ===");

    // --- Test 1A: Synchronous Entity.fromJSON inventory restoration ---
    console.log("\n--- Testing 1A: Synchronous inventory restoration ---");
    
    // Create a Container and add an item
    const container = new Container('test-container', 10, 10);
    const item = new Item({ id: 'food.corn', name: 'Test Corn' });
    container.placeItemAt(item, 0, 0);

    const serializedEntity = {
        id: 'e1',
        type: 'zombie',
        inventory: container.toJSON()
    };

    console.log("Deserializing entity...");
    // Since fromJSON is now fully synchronous, we don't need to await any microtask to check inventory.
    const entity = Entity.fromJSON(serializedEntity);

    if (entity.inventory) {
        console.log("✅ SUCCESS: Inventory restored synchronously.");
        const restoredItem = Array.from(entity.inventory.items.values())[0];
        if (restoredItem && restoredItem.id === 'food.corn') {
            console.log("✅ SUCCESS: Restored item in inventory matches.");
        } else {
            console.error("❌ FAILURE: Item in inventory does not match or is missing.");
            process.exit(1);
        }
    } else {
        console.error("❌ FAILURE: Inventory is null immediately after fromJSON!");
        process.exit(1);
    }

    // --- Test 1B: CombatSystem AP deduction ---
    console.log("\n--- Testing 1B: CombatSystem AP deduction ---");
    
    // Create attacker and target
    const attacker = new Entity('attacker', 'zombie', 0, 0);
    attacker.ap = 10;
    const target = new Entity('target', 'zombie', 1, 0);
    
    // Attack intent
    const damageIntent = {
        targetId: 'target',
        amount: 5,
        isStructure: false
    };

    console.log(`Attacker initial AP: ${attacker.ap}`);
    
    // CombatSystem.resolve
    CombatSystem.resolve(attacker, damageIntent, [attacker, target], null, null, null, null);
    
    console.log(`Attacker remaining AP: ${attacker.ap}`);
    if (attacker.ap === 8) {
        console.log("✅ SUCCESS: AP deducted correctly (apCost = 2.0, remaining = 8.0).");
    } else {
        console.error(`❌ FAILURE: Expected AP to be 8, but got ${attacker.ap}`);
        process.exit(1);
    }

    // Test structure attack AP deduction
    console.log("\n--- Testing 1B: CombatSystem structure attack AP deduction ---");
    
    const structAttacker = new Entity('struct-attacker', 'zombie', 0, 0);
    structAttacker.ap = 10;
    // Mock target structure
    const structure = new Entity('struct-target', 'structure', 1, 0);
    structure.health = 10;
    structure.takeDamage = (amount) => {
        structure.health -= amount;
        return { isBroken: structure.health <= 0 };
    };

    const structDamageIntent = {
        targetId: 'struct-target',
        targetX: 1,
        targetY: 0,
        amount: 2,
        isStructure: true
    };

    // Mock map
    const mockMap = {
        getTile: (x, y) => {
            if (x === 1 && y === 0) {
                return { contents: [structure] };
            }
            return null;
        }
    };

    console.log(`Attacker initial AP: ${structAttacker.ap}`);
    
    CombatSystem.resolve(structAttacker, structDamageIntent, [structAttacker], mockMap, null, null, null);
    
    console.log(`Attacker remaining AP: ${structAttacker.ap}`);
    // Structure attack calculations:
    // ATTACK_AP_COST = 1.0;
    // hitsToDestroy = ceil(10 / 2) = 5
    // maxHitsPossible = floor(10 / 1.0) = 10
    // actualHits = min(5, 10) = 5
    // totalApCost = 5 * 1.0 = 5.0
    // Remaining AP should be 10 - 5 = 5.0
    if (structAttacker.ap === 5) {
        console.log("✅ SUCCESS: Structure AP deducted correctly (totalApCost = 5.0, remaining = 5.0).");
    } else {
        console.error(`❌ FAILURE: Expected AP to be 5, but got ${structAttacker.ap}`);
        process.exit(1);
    }

    console.log("\n🎉 Phase 1 Verification Completed Successfully!");
}

testPhase1().catch(console.error);
