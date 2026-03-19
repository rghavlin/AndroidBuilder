
import { Item } from './client/src/game/inventory/Item.js';
import { ItemTrait } from './client/src/game/inventory/traits.js';

console.log('--- TESTING isChargeBased ---');

const tests = [
  { name: 'Lighter', props: { defId: 'tool.lighter' }, expected: true },
  { name: 'Matchbook', props: { defId: 'tool.matchbook' }, expected: true },
  { name: 'Battery (trait)', props: { traits: [ItemTrait.BATTERY] }, expected: true },
  { name: 'Flashlight (no battery)', props: { defId: 'tool.smallflashlight' }, expected: false },
  { name: 'Knife', props: { defId: 'weapon.knife' }, expected: false },
];

let failed = 0;
tests.forEach(t => {
  const item = new Item(t.props);
  const actual = !!item.isChargeBased();
  if (actual === t.expected) {
    console.log(`✅ ${t.name}: PASSED`);
  } else {
    console.log(`❌ ${t.name}: FAILED (Expected ${t.expected}, Got ${actual})`);
    failed++;
  }
});

if (failed === 0) {
  console.log('\n🎉 ALL CHARGE-BASED TESTS PASSED!');
} else {
  console.log(`\n⚠️ ${failed} tests failed.`);
  process.exit(1);
}
