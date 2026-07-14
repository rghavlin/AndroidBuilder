import { QuestState } from '../client/src/game/quest/QuestState.js';
import { evalCondition, evalAll } from '../client/src/game/quest/conditions.js';

let failures = 0;
function assert(cond, msg) {
  if (!cond) {
    failures++;
    console.error(`FAIL: ${msg}`);
  } else {
    console.log(`ok: ${msg}`);
  }
}

// --- QuestState basics ---
const qs = new QuestState();
assert(qs.getFlag('met_mayor') === false, 'unset flag defaults to false');
assert(qs.getVar('reputation') === 0, 'unset var defaults to 0');

qs.setFlag('met_mayor', true);
qs.setVar('reputation', 5);
qs.addVar('reputation', 3);
assert(qs.getFlag('met_mayor') === true, 'setFlag persists true');
assert(qs.getVar('reputation') === 8, 'addVar accumulates (5+3=8)');

// --- QuestState round-trip ---
const json = qs.toJSON();
const qs2 = new QuestState();
qs2.fromJSON(json);
assert(qs2.getFlag('met_mayor') === true, 'fromJSON restores flag');
assert(qs2.getVar('reputation') === 8, 'fromJSON restores var');

// --- reset ---
qs2.reset();
assert(qs2.getFlag('met_mayor') === false, 'reset clears flags');
assert(qs2.getVar('reputation') === 0, 'reset clears vars');

// --- questStateChanged event fires ---
let changeEvents = [];
const qs3 = new QuestState();
qs3.on('questStateChanged', (e) => changeEvents.push(e));
qs3.setFlag('x', true);
qs3.setVar('y', 1);
qs3.reset();
assert(changeEvents.length === 3, `questStateChanged fired 3 times (got ${changeEvents.length})`);
assert(changeEvents[0].kind === 'flag' && changeEvents[1].kind === 'var' && changeEvents[2].kind === 'reset', 'event kinds are flag/var/reset in order');

// --- Conditions: fake ctx ---
const fakeInventoryManager = {
  isItemEquipped: (defId) => defId === 'gate_key',
  hasItemByDefId: (defId, count) => (defId === 'bandage' ? 3 : 0) >= count,
};
const questState = new QuestState();
questState.setFlag('met_guard', true);
questState.setVar('goblins_killed', 4);
const ctx = { inventoryManager: fakeInventoryManager, questState };

assert(evalCondition({ kind: 'none' }, ctx) === true, 'kind:none is always true');
assert(evalCondition({ kind: 'itemEquipped', defId: 'gate_key' }, ctx) === true, 'itemEquipped true when equipped');
assert(evalCondition({ kind: 'itemEquipped', defId: 'rusty_shiv' }, ctx) === false, 'itemEquipped false when not equipped');
assert(evalCondition({ kind: 'itemInInventory', defId: 'bandage', count: 2 }, ctx) === true, 'itemInInventory true when count sufficient');
assert(evalCondition({ kind: 'itemInInventory', defId: 'bandage', count: 5 }, ctx) === false, 'itemInInventory false when count insufficient');
assert(evalCondition({ kind: 'flag', flag: 'met_guard', value: true }, ctx) === true, 'flag condition matches true value');
assert(evalCondition({ kind: 'flag', flag: 'met_guard', value: false }, ctx) === false, 'flag condition false when value mismatches');
assert(evalCondition({ kind: 'var', var: 'goblins_killed', op: '>=', value: 3 }, ctx) === true, 'var >= comparison true');
assert(evalCondition({ kind: 'var', var: 'goblins_killed', op: '<', value: 3 }, ctx) === false, 'var < comparison false');

// --- evalAll: AND-only + empty-array=true ---
assert(evalAll([], ctx) === true, 'evalAll of empty array is true');
assert(evalAll(undefined, ctx) === true, 'evalAll of undefined is true');
assert(evalAll([
  { kind: 'itemEquipped', defId: 'gate_key' },
  { kind: 'flag', flag: 'met_guard', value: true },
], ctx) === true, 'evalAll true when all conditions pass');
assert(evalAll([
  { kind: 'itemEquipped', defId: 'gate_key' },
  { kind: 'flag', flag: 'met_guard', value: false },
], ctx) === false, 'evalAll false when one condition fails');

console.log(failures === 0 ? '\nAll checks passed.' : `\n${failures} check(s) FAILED.`);
process.exit(failures === 0 ? 0 : 1);
