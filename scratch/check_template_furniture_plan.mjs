// check_template_furniture_plan.mjs
// Verifies that TemplateMapGenerator.generateFromTemplate produces buildings
// carrying a valid furniturePlan (the data the map editor draws as furniture
// outlines). Run: node scratch/check_template_furniture_plan.mjs
import { TemplateMapGenerator } from '../client/src/game/map/TemplateMapGenerator.js';

const KNOWN_TYPES = new Set(['bed', 'table', 'couch', 'desk', 'counter', 'bathtub', 'toilet', 'chair']);
// Road-family templates place floorplan-stamped houses -> furniturePlan expected.
// lab uses LabMapGenerator (no floorplan stamping); small_building/mall_section/
// outdoor_area place no buildings at all -> report only.
const ASSERT_FURNISHED = ['starting_road', 'road', 'winding_road', 'mirrored_winding_road', 'split_road', 'branching_road'];
const REPORT_ONLY = ['lab', 'small_building', 'mall_section', 'outdoor_area'];

let failures = 0;
const fail = msg => { console.error('FAIL:', msg); failures++; };

for (const [templateName, expectFurniture] of [
  ...ASSERT_FURNISHED.map(t => [t, true]),
  ...REPORT_ONLY.map(t => [t, false]),
]) {
  const generator = new TemplateMapGenerator();
  const data = generator.generateFromTemplate(templateName, { mapNumber: 1 });
  const buildings = data?.metadata?.buildings || [];
  const withPlan = buildings.filter(b => Array.isArray(b.furniturePlan) && b.furniturePlan.length > 0);

  console.log(`\n[${templateName}] ${data.width}x${data.height}, buildings=${buildings.length}, with furniturePlan=${withPlan.length}`);

  if (expectFurniture && withPlan.length === 0) {
    fail(`${templateName}: floorplan template but no building carries a furniturePlan`);
  }

  for (const b of withPlan) {
    for (const p of b.furniturePlan) {
      if (!KNOWN_TYPES.has(p.type)) fail(`${templateName}: unknown furniture type '${p.type}'`);
      for (const k of ['x', 'y', 'w', 'h']) {
        if (!Number.isFinite(p[k])) fail(`${templateName}: ${p.type} has non-numeric ${k} (${p[k]})`);
      }
      if (p.rot !== undefined && ![0, 1, 2, 3].includes(p.rot)) {
        fail(`${templateName}: ${p.type} at (${p.x},${p.y}) has invalid rot=${p.rot}`);
      }
      if (p.x < 0 || p.y < 0 || p.x + p.w > data.width || p.y + p.h > data.height) {
        fail(`${templateName}: ${p.type} at (${p.x},${p.y}) ${p.w}x${p.h} out of map bounds`);
      }
    }
    console.log(`  ${b.type} (${b.x},${b.y} ${b.width}x${b.height}): ` +
      b.furniturePlan.map(p => `${p.type}@(${p.x},${p.y}) ${p.w}x${p.h} rot=${p.rot ?? 0}`).join(', '));
  }
}

console.log(failures === 0 ? '\nOK: furniturePlan data path valid' : `\n${failures} failure(s)`);
process.exit(failures === 0 ? 0 : 1);
