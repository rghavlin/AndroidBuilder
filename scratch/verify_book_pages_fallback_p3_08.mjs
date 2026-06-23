import { Item } from '../client/src/game/inventory/Item.js';
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

function makeItem(defId, overrides = {}) {
  return new Item({ ...ItemDefs[defId], defId, ...overrides });
}

console.log('=== P3-08: Book page-count fallback sourced from definition data ===\n');

// 1. Every READABLE book definition now carries a totalPages field.
const readableBooks = Object.entries(ItemDefs)
  .filter(([, def]) => def.traits?.includes(ItemTrait.READABLE));
assert(readableBooks.length > 0, `Found ${readableBooks.length} READABLE book definitions`);
for (const [defId, def] of readableBooks) {
  assert(typeof def.totalPages === 'number' && def.totalPages > 0,
    `${defId} has a positive totalPages (${def.totalPages})`);
}

// 2. With no live gameEngine bookStats, getDisplayAmmoCount falls back to the def's totalPages
//    (was previously a hardcoded 500 for every book).
const savedEngine = globalThis.gameEngine;
globalThis.gameEngine = undefined;

{
  const lifeInMotion = makeItem('book.life_in_motion');
  assert(lifeInMotion.getDisplayAmmoCount() === 500,
    `book.life_in_motion falls back to 500 from def (got ${lifeInMotion.getDisplayAmmoCount()})`);

  const nomad4 = makeItem('book.nomad_survivor_4');
  assert(nomad4.getDisplayAmmoCount() === 30,
    `book.nomad_survivor_4 falls back to its own 30, not a blanket 500 (got ${nomad4.getDisplayAmmoCount()})`);
}

// 3. Live bookStats still take precedence over the definition fallback.
globalThis.gameEngine = { bookStats: { 'book.life_in_motion': { pagesLeft: 123 } } };
{
  const lifeInMotion = makeItem('book.life_in_motion');
  assert(lifeInMotion.getDisplayAmmoCount() === 123,
    `live pagesLeft (123) overrides def fallback (got ${lifeInMotion.getDisplayAmmoCount()})`);
}

// 4. A readable item with no def entry at all degrades to 0, not a phantom 500.
globalThis.gameEngine = undefined;
{
  const orphan = new Item({ defId: 'book.__nonexistent__', traits: [ItemTrait.READABLE], categories: [] });
  assert(orphan.getDisplayAmmoCount() === 0,
    `unknown readable defId yields 0, not a hardcoded 500 (got ${orphan.getDisplayAmmoCount()})`);
}

globalThis.gameEngine = savedEngine;

console.log(`\n=== Results: ${passed} passed, ${failed} failed ===`);
if (failed > 0) {
  console.error('\n❌ SOME TESTS FAILED');
  process.exit(1);
} else {
  console.log('\n🎉 All P3-08 book page-count fallback tests passed!');
}
