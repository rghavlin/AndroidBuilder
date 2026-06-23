import { findSouthTransitionTile } from '../client/src/game/map/MapUtils.js';

let passed = 0, failed = 0;
function assert(c, label) {
  if (c) { console.log(`✅ PASS: ${label}`); passed++; }
  else { console.error(`❌ FAIL: ${label}`); failed++; }
}

// Minimal fake gameMap: a grid where each cell describes terrain + walkability.
function makeMap(width, height, cellFn) {
  return {
    width, height,
    getTile(x, y) {
      const c = cellFn(x, y);
      if (!c) return null;
      return { terrain: c.terrain, isWalkable: () => !!c.walkable };
    }
  };
}

console.log('=== P4-07: shared findSouthTransitionTile ===\n');

const H = 5, W = 10;
const southY = H - 1;

// 1. Prefers a 'transition' terrain tile on the south edge.
const m1 = makeMap(W, H, (x, y) => {
  if (y !== southY) return { terrain: 'grass', walkable: true };
  // south edge: a transition at x=6, walkable floor elsewhere
  if (x === 6) return { terrain: 'transition', walkable: true };
  return { terrain: 'floor', walkable: true };
});
const r1 = findSouthTransitionTile(m1);
assert(r1 && r1.x === 6 && r1.y === southY, `prefers transition tile (got ${JSON.stringify(r1)})`);

// 2. Falls back to the first walkable south-edge tile when no transition exists.
const m2 = makeMap(W, H, (x, y) => {
  if (y !== southY) return { terrain: 'grass', walkable: true };
  // south edge: walls except a walkable floor at x=3 and x=7
  if (x === 3 || x === 7) return { terrain: 'floor', walkable: true };
  return { terrain: 'wall', walkable: false };
});
const r2 = findSouthTransitionTile(m2);
assert(r2 && r2.x === 3 && r2.y === southY, `falls back to first walkable edge tile (got ${JSON.stringify(r2)})`);

// 3. Returns null when the south edge has neither transition nor walkable tiles.
const m3 = makeMap(W, H, (x, y) => {
  if (y !== southY) return { terrain: 'grass', walkable: true };
  return { terrain: 'wall', walkable: false };
});
assert(findSouthTransitionTile(m3) === null, 'returns null when south edge is fully blocked');

console.log(`\n=== Results: ${passed} passed, ${failed} failed ===`);
if (failed > 0) { console.error('\n❌ SOME TESTS FAILED'); process.exit(1); }
else { console.log('\n🎉 All P4-07 south-transition tests passed!'); }
