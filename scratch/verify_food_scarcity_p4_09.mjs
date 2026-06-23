import { getFoodRejectionChance } from '../client/src/game/map/LootGenerator.js';

let passed = 0, failed = 0;
function assert(c, label) {
  if (c) { console.log(`✅ PASS: ${label}`); passed++; }
  else { console.error(`❌ FAIL: ${label}`); failed++; }
}
const close = (a, b) => Math.abs(a - b) < 1e-9;

console.log('=== P4-09: food scarcity formula ===\n');

// Reference: the exact original inline computation.
const reference = (mapNumber) => {
  let r = 0.4 + (mapNumber - 1) * 0.05;
  return Math.min(0.85, Math.max(0.0, r));
};

// Matches the original across the full map range (and past the cap).
for (let m = 1; m <= 15; m++) {
  assert(close(getFoodRejectionChance(m), reference(m)),
    `map ${m}: ${getFoodRejectionChance(m).toFixed(2)} == reference ${reference(m).toFixed(2)}`);
}

// Spot-check the documented anchors.
assert(close(getFoodRejectionChance(1), 0.40), 'map 1 = 40% base');
assert(close(getFoodRejectionChance(10), 0.85), 'map 10 = 85% (hits cap)');
assert(close(getFoodRejectionChance(20), 0.85), 'beyond map 10 stays clamped at 85%');

console.log(`\n=== Results: ${passed} passed, ${failed} failed ===`);
if (failed > 0) { console.error('\n❌ SOME TESTS FAILED'); process.exit(1); }
else { console.log('\n🎉 All P4-09 food scarcity tests passed!'); }
