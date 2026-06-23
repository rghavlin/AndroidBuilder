import { ItemDefs } from '../client/src/game/inventory/ItemDefs.js';

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

console.log('=== P3-10: belt.tool_ring allowedItems must reference real defs ===\n');

const toolRing = ItemDefs['belt.tool_ring'];
assert(!!toolRing?.beltGrid?.allowedItems, 'belt.tool_ring has beltGrid.allowedItems');

const allowed = toolRing.beltGrid.allowedItems;

// The historical bug: 'weapon.pliers' did not exist; pliers is 'tool.pliers'.
assert(!allowed.includes('weapon.pliers'), "allowedItems no longer references non-existent 'weapon.pliers'");
assert(allowed.includes('tool.pliers'), "allowedItems references the real 'tool.pliers'");

// Every entry must resolve to a real definition.
for (const defId of allowed) {
  assert(!!ItemDefs[defId], `allowedItems entry '${defId}' resolves to a real ItemDef`);
}

console.log(`\n=== Results: ${passed} passed, ${failed} failed ===`);
if (failed > 0) {
  console.error('\n❌ SOME TESTS FAILED');
  process.exit(1);
} else {
  console.log('\n🎉 All P3-10 tool ring tests passed!');
}
