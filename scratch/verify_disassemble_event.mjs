import { InventoryManager } from '../client/src/game/inventory/InventoryManager.js';
import { Item } from '../client/src/game/inventory/Item.js';
import { ItemDefs } from '../client/src/game/inventory/ItemDefs.js';

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
    console.log('=== P2-11: Verify disassembleItem event emission ===\n');

    const inv = new InventoryManager();

    // Create a wagon item (requires disassembly)
    const wagon = new Item({ ...ItemDefs['vehicle.wagon'], instanceId: 'wagon-1' });
    // Create a wrench item (the required tool)
    const wrench = new Item({ ...ItemDefs['weapon.wrench'], instanceId: 'wrench-1' });

    // Place them both in the ground container
    inv.groundContainer.addItem(wagon);
    inv.groundContainer.addItem(wrench);

    let inventoryChangedEmitted = false;
    let updateEmitted = false;

    inv.on('inventoryChanged', () => {
        inventoryChangedEmitted = true;
    });

    inv.on('update', () => {
        updateEmitted = true;
    });

    console.log('Disassembling wagon...');
    const result = inv.disassembleItem(wagon);

    assert(result === true, 'Disassembly succeeded');
    assert(inventoryChangedEmitted === true, 'disassembleItem emitted "inventoryChanged" event');
    assert(updateEmitted === false, 'disassembleItem did NOT emit "update" event');

    console.log(`\n=== Results: ${passed} passed, ${failed} failed ===`);
    if (failed > 0) {
        console.error('\n❌ SOME TESTS FAILED');
        process.exit(1);
    } else {
        console.log('\n🎉 All P2-11 disassemble event tests passed!');
    }
}

verify().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});
