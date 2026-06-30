import { InventoryManager } from '../client/src/game/inventory/InventoryManager.js';
import { Item } from '../client/src/game/inventory/Item.js';
import { ItemDefs } from '../client/src/game/inventory/ItemDefs.js';
import assert from 'assert';

async function run() {
    const inv = new InventoryManager();

    // 1. Create a scooter item
    const scooter = new Item({ ...ItemDefs['vehicle.electric_scooter'], instanceId: 'scooter-1' });
    
    // 2. Create a battery and put it inside the scooter's attachment slots
    const battery = new Item({ ...ItemDefs['tool.large_battery'], instanceId: 'battery-1' });
    scooter.attachments = { battery: battery };

    // 3. Create a wrench item (the tool)
    const wrench = new Item({ ...ItemDefs['weapon.wrench'], instanceId: 'wrench-1' });

    // 4. Put them in the ground container
    inv.groundContainer.addItem(scooter);
    inv.groundContainer.addItem(wrench);

    console.log('Before disassembly:');
    console.log('Ground container items:', inv.groundContainer.getAllItems().map(i => `${i.name} (${i.defId})`));
    console.log('Scooter attachments:', Object.keys(scooter.attachments).map(k => `${k}: ${scooter.attachments[k].name}`));

    // Try disassembling
    const result = inv.disassembleItem(scooter, wrench);
    assert.strictEqual(result, true, 'Disassembly should succeed');

    console.log('After disassembly:');
    const items = inv.groundContainer.getAllItems();
    console.log('Ground container items:', items.map(i => `${i.name} (${i.defId})`));

    // Verify components
    const hasMotor = items.some(i => i.defId === 'electric_motor');
    const hasRod = items.some(i => i.defId === 'weapon.metal_rod');
    const wheel = items.find(i => i.defId === 'crafting.wheel');
    const hasPlate = items.some(i => i.defId === 'crafting.metal_plate');
    const hasBattery = items.some(i => i.instanceId === 'battery-1');

    assert.ok(hasMotor, 'Should contain electric motor');
    assert.ok(hasRod, 'Should contain metal rod');
    assert.ok(wheel && wheel.stackCount === 2, 'Should contain exactly 2 wheels');
    assert.ok(hasPlate, 'Should contain metal plate');
    assert.ok(hasBattery, 'Should contain the battery that was inside the scooter');

    console.log('✅ test_scooter_disassembly_with_battery passed!');
}

run().catch(err => {
    console.error(err);
    process.exit(1);
});
