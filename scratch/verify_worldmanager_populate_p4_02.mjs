import { WorldManager } from '../client/src/game/WorldManager.js';

let passed = 0;
let failed = 0;
function assert(condition, label) {
  if (condition) { console.log(`✅ PASS: ${label}`); passed++; }
  else { console.error(`❌ FAIL: ${label}`); failed++; }
}

console.log('=== P4-02: shared map-population pipeline ===\n');

// --- executeTransition: generate a fresh map via the shared helper ---
const wm = new WorldManager();
wm.currentMapId = 'map_001';

// Enter map_002 (a 'road' template, 45x125) from the north edge (y<=1).
const result = await wm.executeTransition('map_002', { x: 22, y: 1 }, 5);

assert(result.success === true, 'executeTransition succeeded for a freshly generated map');
assert(result.mapId === 'map_002', 'result.mapId is the target map');
assert(!!result.gameMap, 'result.gameMap is populated');
assert(result.gameMap.mapNumber === 2, `gameMap.mapNumber === 2 (got ${result.gameMap?.mapNumber})`);
assert(wm.maps.has('map_002'), 'map_002 was saved into the world collection');
assert(wm.currentMapId === 'map_002', 'currentMapId advanced to the target map');
assert(!!result.metadata, 'transition result carries map metadata');

// Spawn position was re-resolved against the generated map's north exit.
assert(result.spawnPosition && result.spawnPosition.y === 1,
  `spawn re-resolved to north entry (y=1, got ${result.spawnPosition?.y})`);
assert(typeof result.spawnPosition.x === 'number',
  `spawn x resolved to a column (got ${result.spawnPosition?.x})`);

// Population actually happened: zombies/loot were placed on the map.
const entities = Array.from(result.gameMap.entityMap.values());
const zombies = entities.filter(e => e.type === 'zombie');
assert(zombies.length > 0, `zombies were spawned (${zombies.length})`);

// --- generateNextMap: thin wrapper over the same helper (no spawn position) ---
const wm2 = new WorldManager();
const gen = await wm2.generateNextMap('road', 1);
assert(gen && gen.mapId, `generateNextMap returns a saved map id (${gen?.mapId})`);
assert(!!gen.gameMap, 'generateNextMap returns a populated gameMap');
assert(wm2.maps.has(gen.mapId), 'generateNextMap saved its map');
assert(typeof gen.mapType === 'string', `generateNextMap returns the actual template (${gen.mapType})`);

console.log(`\n=== Results: ${passed} passed, ${failed} failed ===`);
if (failed > 0) { console.error('\n❌ SOME TESTS FAILED'); process.exit(1); }
else { console.log('\n🎉 All P4-02 map-population pipeline tests passed!'); }
