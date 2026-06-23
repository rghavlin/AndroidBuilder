import { InventoryManager } from '../client/src/game/inventory/InventoryManager.js';
import { Container } from '../client/src/game/inventory/Container.js';
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

function makeItem(defId, overrides = {}) {
  return new Item({ ...ItemDefs[defId], defId, ...overrides });
}

console.log('=== Bug: unequip + drop where it does not fit must not crash ===\n');

// Pick a 1x1 equippable clothing item to keep grid math simple.
// Fall back to a synthetic item if the chosen def is missing.
const SHIRT_DEF = ItemDefs['clothing.tshirt'] ? 'clothing.tshirt'
  : Object.keys(ItemDefs).find(id => id.startsWith('clothing.')) || null;

const im = new InventoryManager();

// 1. Equip a shirt into the upper_body slot (simulating the player wearing it).
const shirt = SHIRT_DEF
  ? makeItem(SHIRT_DEF, { width: 1, height: 1 })
  : new Item({ defId: 'clothing.test_shirt', name: 'Test Shirt', width: 1, height: 1, categories: [], traits: [] });
shirt.isEquipped = true;
im.equipment.upper_body = shirt;

// 2. A full 1x1 target container: the only cell is occupied, so any drop fails.
const tiny = new Container({ id: 'tiny', type: 'generic', name: 'Tiny', width: 1, height: 1 });
const blocker = makeItem(SHIRT_DEF || 'clothing.test_shirt', { width: 1, height: 1 }) ||
  new Item({ defId: 'blocker', width: 1, height: 1 });
blocker.instanceId = 'blocker-1';
tiny.placeItemAt(blocker, 0, 0);
im.addContainer(tiny);

assert(typeof im.getContainer('equipment-upper_body').addItem !== 'function',
  'equipment virtual container has no addItem (pre-condition for the bug)');

// 3. Reproduce the exact failing flow: move the equipped shirt onto the occupied
//    cell of the tiny container. Placement fails -> moveItem falls back to
//    addItem(item, "equipment-upper_body") which previously threw
//    "container.addItem is not a function".
let threw = false;
let result;
try {
  result = im.moveItem(shirt.instanceId, 'equipment-upper_body', 'tiny', 0, 0);
} catch (err) {
  threw = true;
  console.error('   threw:', err.message);
}

assert(!threw, 'moveItem does not throw when returning item to the equipment slot');
assert(result && result.success === false, 'move reports failure (no space in target)');
assert(im.equipment.upper_body === shirt, 'shirt was returned to its equipment slot (state preserved)');
assert(shirt.isEquipped === true, 'shirt remains equipped after the failed move');

console.log(`\n=== Results: ${passed} passed, ${failed} failed ===`);
if (failed > 0) {
  console.error('\n❌ SOME TESTS FAILED');
  process.exit(1);
} else {
  console.log('\n🎉 Unequip-no-fit fallback no longer crashes!');
}
