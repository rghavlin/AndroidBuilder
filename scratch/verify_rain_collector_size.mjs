import { Item } from '../client/src/game/inventory/Item.js';
import { ItemDefs } from '../client/src/game/inventory/ItemDefs.js';
import { ItemTrait } from '../client/src/game/inventory/traits.js';

console.log("=== Starting Verification of Rain Collector Footprint & Gauge ===");

// Check that definitions exist
const rainCollectorDef = ItemDefs['provision.rain_collector'];
const waterPuddleDef = ItemDefs['environment.water_puddle'];

if (!rainCollectorDef) {
  console.error("CRITICAL: provision.rain_collector definition not found!");
  process.exit(1);
}
if (!waterPuddleDef) {
  console.error("CRITICAL: environment.water_puddle definition not found!");
  process.exit(1);
}

// Helper to check and print dimensions and gauge percent
function checkItem(name, item) {
  const width = item.getActualWidth();
  const height = item.getActualHeight();
  const meter = item.getMeterPercent();
  console.log(`${name} (ammoCount: ${item.ammoCount}/${item.capacity}): actual dimensions = ${width}x${height}, gauge = ${meter !== null ? meter + '%' : 'none'}`);
  return { width, height, meter };
}

let allPassed = true;

// 1. Verify Rain Collector remains 3x3 at various ammoCount levels AND returns correct meter percent
console.log("\n--- Testing Rain Collector Sizing & Gauge ---");
const rcLevels = [
  { ammo: 0, expectedMeter: 0 },
  { ammo: 5, expectedMeter: 5 },
  { ammo: 10, expectedMeter: 10 },
  { ammo: 30, expectedMeter: 30 },
  { ammo: 50, expectedMeter: 50 },
  { ammo: 100, expectedMeter: 100 }
];
for (const rcLevel of rcLevels) {
  const rc = new Item({ ...rainCollectorDef, ammoCount: rcLevel.ammo });
  const dims = checkItem("Rain Collector", rc);
  if (dims.width !== 3 || dims.height !== 3) {
    console.error(`❌ Error: Rain Collector should be 3x3, but is ${dims.width}x${dims.height} at ammoCount ${rcLevel.ammo}!`);
    allPassed = false;
  }
  if (dims.meter !== rcLevel.expectedMeter) {
    console.error(`❌ Error: Rain Collector meter should be ${rcLevel.expectedMeter}%, but is ${dims.meter}%!`);
    allPassed = false;
  }
  if (dims.width === 3 && dims.height === 3 && dims.meter === rcLevel.expectedMeter) {
    console.log(`✅ Passed: Rain Collector at ammoCount ${rcLevel.ammo}`);
  }
}

// 2. Verify Water Puddle continues to size dynamically AND has no gauge meter
console.log("\n--- Testing Water Puddle Sizing & Gauge ---");
const puddleLevels = [
  { ammo: 0, expectedWidth: 1 },
  { ammo: 10, expectedWidth: 1 },
  { ammo: 15, expectedWidth: 2 },
  { ammo: 20, expectedWidth: 2 },
  { ammo: 30, expectedWidth: 3 },
  { ammo: 40, expectedWidth: 4 },
  { ammo: 50, expectedWidth: 5 }
];

for (const level of puddleLevels) {
  const puddle = new Item({ ...waterPuddleDef, ammoCount: level.ammo });
  const dims = checkItem("Water Puddle", puddle);
  if (dims.width !== level.expectedWidth || dims.height !== level.expectedWidth) {
    console.error(`❌ Error: Puddle at ammoCount ${level.ammo} should be ${level.expectedWidth}x${level.expectedWidth}, but is ${dims.width}x${dims.height}!`);
    allPassed = false;
  }
  if (dims.meter !== null) {
    console.error(`❌ Error: Puddle should not have a gauge meter, but got ${dims.meter}%!`);
    allPassed = false;
  }
  if (dims.width === level.expectedWidth && dims.height === level.expectedWidth && dims.meter === null) {
    console.log(`✅ Passed: Puddle at ammoCount ${level.ammo}`);
  }
}

if (allPassed) {
  console.log("\n🎉 ALL FOOTPRINT & GAUGE VERIFICATIONS PASSED SUCCESSFULLY!");
  process.exit(0);
} else {
  console.error("\n❌ VERIFICATION FAILED!");
  process.exit(1);
}
