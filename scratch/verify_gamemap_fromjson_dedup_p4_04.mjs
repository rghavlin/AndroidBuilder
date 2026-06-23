import { GameMap } from '../client/src/game/map/GameMap.js';
import { EntityFactory } from '../client/src/game/EntityFactory.js';
import { Rabbit } from '../client/src/game/entities/Rabbit.js';

let passed = 0;
let failed = 0;
function assert(c, label) {
  if (c) { console.log(`✅ PASS: ${label}`); passed++; }
  else { console.error(`❌ FAIL: ${label}`); failed++; }
}
const ofType = (gm, t) => Array.from(gm.entityMap.values()).filter(e => e.type === t);

console.log('=== P4-04: GameMap.fromJSON / fromJSONSelective dedup ===\n');

// Build a map with a player, zombie, and rabbit, then serialize it.
const gm = new GameMap(10, 10);
gm.addEntity(EntityFactory.createPlayer(5, 5), 5, 5);
gm.addEntity(EntityFactory.createZombie(3, 3, 'basic', 'z-1'), 3, 3);
gm.addEntity(new Rabbit('rabbit-1', 7, 7), 7, 7);
gm.buildings = [{ id: 'b1', x: 1, y: 1, w: 2, h: 2 }];

const serialized = gm.toJSON();

// --- fromJSON: full restoration restores everything ---
const full = await GameMap.fromJSON(serialized);
assert(ofType(full, 'player').length === 1, 'fromJSON restores the player');
assert(ofType(full, 'zombie').length === 1, 'fromJSON restores the zombie');
assert(ofType(full, 'rabbit').length === 1, 'fromJSON restores the rabbit');
assert(Array.isArray(full.buildings) && full.buildings.length === 1, 'fromJSON restores buildings');
assert(full.mapNumber === gm.mapNumber, 'fromJSON preserves mapNumber');

// --- fromJSONSelective excluding players: keeps zombie AND rabbit ---
const sel = await GameMap.fromJSONSelective(serialized, { excludeEntityTypes: ['player'] });
assert(ofType(sel, 'player').length === 0, 'selective excludes the player');
assert(ofType(sel, 'zombie').length === 1, 'selective restores the zombie');
// Bug fix: selective previously dropped rabbits (no case in its switch).
assert(ofType(sel, 'rabbit').length === 1, 'selective NOW restores the rabbit (was dropped before)');

// --- includeEntityTypes still works ---
const onlyZombies = await GameMap.fromJSONSelective(serialized, { includeEntityTypes: ['zombie'] });
assert(ofType(onlyZombies, 'zombie').length === 1, 'include filter keeps zombies');
assert(ofType(onlyZombies, 'player').length === 0, 'include filter drops players');
assert(ofType(onlyZombies, 'rabbit').length === 0, 'include filter drops rabbits');

// --- entity counts: full == selective(no options) ---
const selAll = await GameMap.fromJSONSelective(serialized, {});
assert(selAll.entityMap.size === full.entityMap.size,
  `selective with no filter matches full restoration (${selAll.entityMap.size} vs ${full.entityMap.size})`);

console.log(`\n=== Results: ${passed} passed, ${failed} failed ===`);
if (failed > 0) { console.error('\n❌ SOME TESTS FAILED'); process.exit(1); }
else { console.log('\n🎉 All P4-04 fromJSON dedup tests passed!'); }
