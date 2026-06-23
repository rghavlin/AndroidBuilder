import { isInsideAnyBuilding } from '../client/src/game/map/MapUtils.js';

let passed = 0, failed = 0;
function assert(c, label) {
  if (c) { console.log(`✅ PASS: ${label}`); passed++; }
  else { console.error(`❌ FAIL: ${label}`); failed++; }
}

console.log('=== P4-08: shared isInsideAnyBuilding ===\n');

// Building at (10,10) spanning 10..14 x, 10..13 y (width 5, height 4).
const buildings = [{ x: 10, y: 10, width: 5, height: 4 }, { x: 0, y: 0, width: 2, height: 2 }];

// Inside
assert(isInsideAnyBuilding(buildings, 10, 10) === true, 'top-left corner is inside');
assert(isInsideAnyBuilding(buildings, 14, 13) === true, 'bottom-right interior cell is inside');
assert(isInsideAnyBuilding(buildings, 12, 11) === true, 'center is inside');
assert(isInsideAnyBuilding(buildings, 1, 1) === true, 'second building cell is inside');

// Outside / exclusive upper bound (x < b.x + width)
assert(isInsideAnyBuilding(buildings, 15, 10) === false, 'x == b.x+width is OUTSIDE (exclusive)');
assert(isInsideAnyBuilding(buildings, 10, 14) === false, 'y == b.y+height is OUTSIDE (exclusive)');
assert(isInsideAnyBuilding(buildings, 9, 10) === false, 'x just left of building is outside');
assert(isInsideAnyBuilding(buildings, 100, 100) === false, 'far away is outside');

// Defensive: empty / null
assert(isInsideAnyBuilding([], 12, 11) === false, 'no buildings => outside');
assert(isInsideAnyBuilding(null, 12, 11) === false, 'null buildings => outside (no throw)');

console.log(`\n=== Results: ${passed} passed, ${failed} failed ===`);
if (failed > 0) { console.error('\n❌ SOME TESTS FAILED'); process.exit(1); }
else { console.log('\n🎉 All P4-08 isInsideAnyBuilding tests passed!'); }
