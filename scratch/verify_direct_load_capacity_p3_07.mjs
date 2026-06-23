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

function makeItem(defId, overrides = {}) {
  return new Item({ ...ItemDefs[defId], defId, ...overrides });
}

// Load `stackCount` rounds into an empty weapon from the ground; return the weapon.
function loadFromGround(im, weaponDefId, ammoDefId, stackCount) {
  const weapon = makeItem(weaponDefId);
  const ammo = makeItem(ammoDefId, { stackCount });
  im.groundContainer.addItem(ammo, 0, 0);
  const result = im.attachItemToWeapon(weapon, 'ammo', ammo, 'ground');
  return { weapon, ammo, result };
}

console.log('=== P3-07: Direct-load capacities sourced from weapon definitions ===\n');

// 1. Each weapon def carries a directLoad config matching the historical hardcoded values.
const expected = {
  'weapon.357Pistol': { ammoId: 'ammo.357', capacity: 6 },
  'weapon.hunting_rifle': { ammoId: 'ammo.308', capacity: 5 },
  'weapon.shotgun': { ammoId: 'ammo.shotgun_shells', capacity: 7 },
};

for (const [defId, exp] of Object.entries(expected)) {
  const dl = ItemDefs[defId]?.directLoad;
  assert(!!dl, `${defId} has a directLoad config`);
  assert(dl?.slotId === 'ammo', `${defId} directLoad targets the 'ammo' slot`);
  assert(dl?.ammoId === exp.ammoId, `${defId} directLoad.ammoId === ${exp.ammoId}`);
  assert(dl?.capacity === exp.capacity, `${defId} directLoad.capacity === ${exp.capacity}`);
}

console.log('\n--- Behavioral: loading an oversized stack caps at capacity ---');
for (const [defId, exp] of Object.entries(expected)) {
  const im = new InventoryManager();
  const { weapon, result } = loadFromGround(im, defId, exp.ammoId, 20);
  const loaded = weapon.attachments?.ammo?.stackCount;
  assert(result.success === true, `${defId}: attach reported success`);
  assert(loaded === exp.capacity, `${defId}: loaded ${loaded} rounds (cap ${exp.capacity})`);
}

console.log('\n--- Behavioral: topping off a partially loaded weapon ---');
{
  const im = new InventoryManager();
  // Pre-load shotgun with 2 shells, then add 20 more from the ground.
  const weapon = makeItem('weapon.shotgun');
  const seed = makeItem('ammo.shotgun_shells', { stackCount: 2 });
  weapon.attachItem('ammo', seed);
  const more = makeItem('ammo.shotgun_shells', { stackCount: 20 });
  im.groundContainer.addItem(more, 1, 0);
  const result = im.attachItemToWeapon(weapon, 'ammo', more, 'ground');
  const loaded = weapon.attachments?.ammo?.stackCount;
  assert(result.success === true && result.merged === true, 'shotgun top-off reported merged success');
  assert(loaded === 7, `shotgun topped off to capacity 7 (got ${loaded})`);
  assert(more.stackCount === 15, `surplus reduced to 15 after adding 5 (got ${more.stackCount})`);
}

console.log('\n--- Behavioral: wrong ammo for a direct-load weapon is rejected before direct-load ---');
{
  const im = new InventoryManager();
  const weapon = makeItem('weapon.shotgun');
  const wrongAmmo = makeItem('ammo.357', { stackCount: 5 });
  im.groundContainer.addItem(wrongAmmo, 2, 0);
  const result = im.attachItemToWeapon(weapon, 'ammo', wrongAmmo, 'ground');
  assert(result.success === false, 'shotgun rejects ammo.357 (slot allowedItems guard)');
  assert(!weapon.attachments?.ammo, 'shotgun ammo slot remains empty after rejected load');
}

console.log(`\n=== Results: ${passed} passed, ${failed} failed ===`);
if (failed > 0) {
  console.error('\n❌ SOME TESTS FAILED');
  process.exit(1);
} else {
  console.log('\n🎉 All P3-07 direct-load capacity tests passed!');
}
