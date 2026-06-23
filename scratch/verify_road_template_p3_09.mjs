import { TemplateMapGenerator } from '../client/src/game/map/TemplateMapGenerator.js';
import { TEMPLATE_METADATA } from '../client/src/game/config/TemplateConfig.js';

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

console.log('=== P3-09: Road template size/layout consistency ===\n');

const gen = new TemplateMapGenerator();
const roadTemplate = gen.templates.get('road');

// 1. The stale literal layout is gone; road follows the generator convention.
assert(Array.isArray(roadTemplate.layout) && roadTemplate.layout.length === 0,
  `road template layout is empty (got length ${roadTemplate.layout.length})`);

// 2. Declared size matches metadata (single source of truth).
assert(roadTemplate.size.width === TEMPLATE_METADATA.road.size.width &&
       roadTemplate.size.height === TEMPLATE_METADATA.road.size.height,
  `road size === metadata ${TEMPLATE_METADATA.road.size.width}x${TEMPLATE_METADATA.road.size.height}`);

// 3. Generated map fills the full declared dimensions (no 20x39 truncation).
const mapData = gen.generateFromTemplate('road', {});
assert(mapData.width === TEMPLATE_METADATA.road.size.width,
  `generated map width === ${TEMPLATE_METADATA.road.size.width} (got ${mapData.width})`);
assert(mapData.height === TEMPLATE_METADATA.road.size.height,
  `generated map height === ${TEMPLATE_METADATA.road.size.height} (got ${mapData.height})`);
assert(mapData.tiles.length === TEMPLATE_METADATA.road.size.height,
  `tile rows === ${TEMPLATE_METADATA.road.size.height} (got ${mapData.tiles.length})`);
assert(mapData.tiles[0].length === TEMPLATE_METADATA.road.size.width,
  `tile cols === ${TEMPLATE_METADATA.road.size.width} (got ${mapData.tiles[0].length})`);

// 4. North/south transition tiles land at the metadata exit X (within bounds).
const findTransition = (y) => mapData.tiles[y].findIndex(t => t.terrain === 'transition');
const southX = findTransition(mapData.height - 1);
const northX = findTransition(0);
assert(northX === TEMPLATE_METADATA.road.northExitX,
  `north transition at x=${TEMPLATE_METADATA.road.northExitX} (got ${northX})`);
assert(southX === TEMPLATE_METADATA.road.southEntranceX,
  `south transition at x=${TEMPLATE_METADATA.road.southEntranceX} (got ${southX})`);

// 5. All other generator-based templates already use an empty layout — confirm road
//    now matches that convention rather than being the lone anomaly.
const generatorTemplates = ['winding_road', 'mirrored_winding_road', 'split_road', 'lab', 'branching_road', 'starting_road'];
for (const name of generatorTemplates) {
  const t = gen.templates.get(name);
  assert(Array.isArray(t.layout) && t.layout.length === 0, `${name} layout is empty (convention)`);
}

console.log(`\n=== Results: ${passed} passed, ${failed} failed ===`);
if (failed > 0) {
  console.error('\n❌ SOME TESTS FAILED');
  process.exit(1);
} else {
  console.log('\n🎉 All P3-09 road template tests passed!');
}
