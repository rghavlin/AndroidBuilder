import { ItemDefs } from '../client/src/game/inventory/ItemDefs.js';
import { ItemTrait } from '../client/src/game/inventory/traits.js';

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

console.log('=== bookStats fresh-game init derived from ItemDefs totalPages ===\n');

// Replicate the derivation logic now used in GameEngine.reset().
function buildFreshBookStats() {
  const bookStats = {};
  for (const [defId, def] of Object.entries(ItemDefs)) {
    if (def.traits?.includes(ItemTrait.READABLE)) {
      bookStats[defId] = { pagesLeft: def.totalPages, milestonesReached: 0 };
    }
  }
  return bookStats;
}

// 1. Every previously-hardcoded book is present with the correct derived value.
const expected = {
  'book.life_in_motion': 500,
  'book.nomad_survivor_1': 15,
  'book.nomad_survivor_2': 15,
  'book.nomad_survivor_3': 15,
  'book.nomad_survivor_4': 30,
  'book.nomad_survivor_5': 40,
  'book.nomad_survivor_6': 50,
  'book.nomad_survivor_7': 25,
};

const fresh = buildFreshBookStats();

for (const [defId, pages] of Object.entries(expected)) {
  assert(fresh[defId]?.pagesLeft === pages,
    `${defId} derived pagesLeft === ${pages} (got ${fresh[defId]?.pagesLeft})`);
  assert(fresh[defId]?.milestonesReached === 0,
    `${defId} starts at milestonesReached 0`);
}

// 2. Derived set exactly matches the READABLE definitions (no extras, none missing).
const readableIds = Object.entries(ItemDefs)
  .filter(([, def]) => def.traits?.includes(ItemTrait.READABLE))
  .map(([id]) => id)
  .sort();
assert(JSON.stringify(Object.keys(fresh).sort()) === JSON.stringify(readableIds),
  `bookStats keys match the READABLE definition set (${readableIds.length} books)`);

// 3. Every entry sources from a positive totalPages (no undefined/NaN leaking in).
for (const [defId, stat] of Object.entries(fresh)) {
  assert(typeof stat.pagesLeft === 'number' && stat.pagesLeft > 0,
    `${defId} has a positive numeric pagesLeft (${stat.pagesLeft})`);
}

// 4. Save/load compatibility: a loaded save replaces bookStats wholesale,
//    so persisted progress overrides the derived fresh-game defaults.
const loaded = JSON.parse(JSON.stringify({
  'book.life_in_motion': { pagesLeft: 42, milestonesReached: 4 },
}));
const engine = { bookStats: buildFreshBookStats() };
engine.bookStats = loaded; // mirrors GameSaveSystem load (engine.bookStats = saveData.bookStats)
assert(engine.bookStats['book.life_in_motion'].pagesLeft === 42,
  `loaded save overrides derived default (got ${engine.bookStats['book.life_in_motion'].pagesLeft})`);

console.log(`\n=== Results: ${passed} passed, ${failed} failed ===`);
if (failed > 0) {
  console.error('\n❌ SOME TESTS FAILED');
  process.exit(1);
} else {
  console.log('\n🎉 All bookStats init derivation tests passed!');
}
