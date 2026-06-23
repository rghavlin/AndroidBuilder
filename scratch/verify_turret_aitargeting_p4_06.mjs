import { TurretAI } from '../client/src/game/ai/TurretAI.js';
import { AITargeting } from '../client/src/game/ai/AITargeting.js';
import { GameMap } from '../client/src/game/map/GameMap.js';
import { EntityFactory } from '../client/src/game/EntityFactory.js';
import { Item } from '../client/src/game/inventory/Item.js';

let passed = 0, failed = 0;
function assert(c, label) {
  if (c) { console.log(`✅ PASS: ${label}`); passed++; }
  else { console.error(`❌ FAIL: ${label}`); failed++; }
}

console.log('=== P4-06: TurretAI delegates target selection to AITargeting ===\n');

// --- AITargeting origin option: distance + LOS measured from a tile ---
const attacker = { isHostileTo: () => true }; // position-less (turret-like)
const near = { id: 'near', hp: 10, x: 3, y: 0 };
const far = { id: 'far', hp: 10, x: 30, y: 0 };
const dead = { id: 'dead', hp: 0, x: 2, y: 0 };
const openMap = { getTile: () => ({ isWalkable: () => true, contents: [] }), width: 50, height: 50 };

const picked = AITargeting.acquireTargets(attacker, [far, near, dead], {
  maxRange: 10, origin: { x: 0, y: 0 }
});
assert(picked.length === 1 && picked[0].id === 'near', 'origin: nearest in-range hostile selected, far/dead excluded');

const nonHostile = { isHostileTo: () => false };
assert(AITargeting.acquireTargets(nonHostile, [near], { maxRange: 10, origin: { x: 0, y: 0 } }).length === 0,
  'origin: non-hostile candidates are excluded');

// --- End-to-end: a real turret fires at the nearest hostile zombie ---
const gameMap = new GameMap(20, 20);
const z1 = EntityFactory.createZombie(8, 5, 'basic', 'z-near'); // dist 3 from turret(5,5)
const z2 = EntityFactory.createZombie(14, 5, 'basic', 'z-far');  // dist 9
gameMap.addEntity(z1, 8, 5);
gameMap.addEntity(z2, 14, 5);

const turret = new Item({
  id: 'placeable.auto_turret', defId: 'placeable.auto_turret',
  factionId: 'player', isOn: true,
  attachments: { battery: { defId: 'tool.large_battery', ammoCount: 10 }, ammo: { defId: 'ammo.9mm', ammoCount: 50 } }
});
turret.isHostileTo = (e) => e.type === 'zombie';

const result = TurretAI.executeTurretTurn(turret, 5, 5, gameMap, [z1, z2]);
const shots = result.actions.filter(a => a.type === 'TURRET_SHOT');
assert(shots.length > 0, `turret fired (${shots.length} shots)`);
assert(shots[0].data.targetId === 'z-near', 'turret engages the NEAREST zombie first');
assert(shots[0].data.targetX === 8 && shots[0].data.targetY === 5,
  `action carries target coords (got ${shots[0].data.targetX},${shots[0].data.targetY})`);
// z-far must never be shot before z-near is dead (ordering preserved by sort).
const firstFarIdx = shots.findIndex(s => s.data.targetId === 'z-far');
const lastNearIdx = shots.map(s => s.data.targetId).lastIndexOf('z-near');
assert(firstFarIdx === -1 || firstFarIdx > lastNearIdx,
  'turret only switches to the farther zombie after the nearer one is handled');

// Out-of-range target only: turret with tiny range should not fire.
const z3 = EntityFactory.createZombie(19, 19, 'basic', 'z-distant');
const gm2 = new GameMap(20, 20);
gm2.addEntity(z3, 19, 19);
const turret2 = new Item({
  id: 'placeable.auto_turret', defId: 'placeable.auto_turret', factionId: 'player', isOn: true,
  attachments: { battery: { defId: 'tool.large_battery', ammoCount: 10 }, ammo: { defId: 'ammo.9mm', ammoCount: 50 } }
});
turret2.isHostileTo = (e) => e.type === 'zombie';
const r2 = TurretAI.executeTurretTurn(turret2, 0, 0, gm2, [z3]);
assert(r2.actions.filter(a => a.type === 'TURRET_SHOT').length === 0,
  'turret does not fire at a target beyond maxRange');

console.log(`\n=== Results: ${passed} passed, ${failed} failed ===`);
if (failed > 0) { console.error('\n❌ SOME TESTS FAILED'); process.exit(1); }
else { console.log('\n🎉 All P4-06 turret/AITargeting tests passed!'); }
