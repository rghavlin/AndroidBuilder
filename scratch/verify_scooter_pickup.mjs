import { Item } from '../client/src/game/inventory/Item.js';
import { ItemDefs } from '../client/src/game/inventory/ItemDefs.js';
import { Container } from '../client/src/game/inventory/Container.js';
import { ItemTrait } from '../client/src/game/inventory/traits.js';
import assert from 'assert';

function runVerification() {
  console.log("=== Electric Scooter Pickup Verification ===");

  const def = ItemDefs['vehicle.electric_scooter'];
  if (!def) {
    throw new Error("FAIL: vehicle.electric_scooter definition not found in ItemDefs!");
  }
  console.log("✅ Found definition in ItemDefs.js");

  // 1. Verify noPickup is NOT true
  if (def.noPickup === true) {
    throw new Error("FAIL: Expected noPickup to be undefined or false, but got true!");
  }
  console.log("✅ noPickup flag is successfully removed");

  // 2. Verify GROUND_ONLY is NOT in traits
  if (def.traits.includes(ItemTrait.GROUND_ONLY)) {
    throw new Error("FAIL: Expected GROUND_ONLY trait to be removed, but it is still present!");
  }
  console.log("✅ GROUND_ONLY trait is successfully removed");

  // 3. Create instances of the scooter and a backpack container
  const scooter = new Item({ ...def, instanceId: 'scooter-test' });
  const backpack = new Container({ id: 'backpack-test', type: 'backpack', width: 6, height: 6 });

  // 4. Try putting the scooter in the backpack
  const validation = backpack.validateNesting(scooter);
  console.log("Nesting validation result:", validation);
  assert.strictEqual(validation.valid, true, `validateNesting should allow placing the scooter in the backpack, but failed: ${validation.reason}`);

  const placed = backpack.placeItemAt(scooter, 0, 0);
  assert.strictEqual(placed, true, "Should successfully place the electric scooter in the backpack grid");
  console.log("✅ Successfully placed the electric scooter in the backpack container grid");

  // 5. Test loading from a save containing old values (noPickup: true, traits: [ItemTrait.GROUND_ONLY])
  const savedScooterConfig = {
    defId: 'vehicle.electric_scooter',
    instanceId: 'scooter-saved-test',
    noPickup: true,
    traits: [ItemTrait.DRAGGABLE, ItemTrait.GROUND_ONLY, ItemTrait.VEHICLE, ItemTrait.WAGON, ItemTrait.SCOOTER]
  };

  const loadedScooter = new Item(savedScooterConfig);
  assert.strictEqual(loadedScooter.noPickup, undefined, "Loaded item's noPickup should be synchronized/overwritten to undefined/false");
  assert.ok(!loadedScooter.traits.includes(ItemTrait.GROUND_ONLY), "Loaded item's GROUND_ONLY trait should be cleaned up via definition sync");
  console.log("✅ Successfully verified migration/sync compatibility for loaded save files");

  console.log("\nALL ELECTRIC SCOOTER PICKUP VERIFICATIONS PASSED SUCCESSFULLY! 🎉");
}

try {
  runVerification();
} catch (err) {
  console.error(err);
  process.exit(1);
}
