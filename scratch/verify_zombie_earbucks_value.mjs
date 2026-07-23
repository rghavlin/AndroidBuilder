// Verifies the map-editor earbucksValue feature end-to-end at the engine level:
// a zombie carrying an editor-authored earbucksValue drops a corpse whose
// harvest value matches it (when killed by the player).
import { dropZombieDeathLoot } from '../client/src/game/entities/ZombieCorpseConfig.js';

const fakeMap = { getTile: () => ({ contents: [] }), mapNumber: 1 };

function dropCorpse(target) {
  const placed = [];
  dropZombieDeathLoot(target, 0, 0, fakeMap, null, items => placed.push(...items));
  return placed.find(i => i.defId === 'zombie.corpse');
}

let failures = 0;
function check(label, actual, expected) {
  const ok = actual === expected;
  if (!ok) failures++;
  console.log(`${ok ? 'PASS' : 'FAIL'} ${label}: expected ${expected}, got ${actual}`);
}

// 1. Editor-authored value honored when killed by player
check('authored value 5, player kill',
  dropCorpse({ subtype: 'basic', lastAttacker: { type: 'player' }, earbucksValue: 5 })?.earbucksValue, 5);

// 2. Explicit 0 stays 0 (not overridden by def default)
check('authored value 0, player kill',
  dropCorpse({ subtype: 'basic', lastAttacker: { type: 'player' }, earbucksValue: 0 })?.earbucksValue, 0);

// 3. No authored value -> item def default (1)
check('no authored value, player kill',
  dropCorpse({ subtype: 'basic', lastAttacker: { type: 'player' } })?.earbucksValue, 1);

// 4. Non-player kill still zeroes out, even with authored value
check('authored value 5, non-player kill',
  dropCorpse({ subtype: 'basic', lastAttacker: { type: 'npc' }, earbucksValue: 5 })?.earbucksValue, 0);

process.exit(failures ? 1 : 0);
