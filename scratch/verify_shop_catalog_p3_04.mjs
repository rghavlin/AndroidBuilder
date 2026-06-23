import { earbucksShopSystem } from '../client/src/game/systems/EarbucksShopSystem.js';
import { DEFAULT_SHOP_CATALOG } from '../client/src/game/config/ShopConfig.js';
import { ItemDefs } from '../client/src/game/inventory/ItemDefs.js';
import engine from '../client/src/game/GameEngine.js';
import { WorldManager } from '../client/src/game/WorldManager.js';

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

async function verify() {
  console.log('=== P3-04: Verify Shop Catalog Relocation & Dynamic Name Derivation ===\n');

  // Setup WorldManager mock
  const worldManager = new WorldManager();
  engine.worldManager = worldManager;

  const mapId = 'map_shop_test_p3_04';
  worldManager.currentMapId = mapId;
  worldManager.maps.set(mapId, { metadata: {} });

  // Test 1: initCatalog populates items from DEFAULT_SHOP_CATALOG
  console.log('Initializing catalog...');
  earbucksShopSystem.initCatalog(mapId);
  const catalog = earbucksShopSystem.getCatalog(mapId);

  assert(catalog.length === DEFAULT_SHOP_CATALOG.length, `Catalog length matches default config (${DEFAULT_SHOP_CATALOG.length} items)`);

  // Test 2: Derived names match ItemDefs
  DEFAULT_SHOP_CATALOG.forEach(configItem => {
    const itemInCatalog = catalog.find(i => i.defId === configItem.defId);
    assert(!!itemInCatalog, `Found ${configItem.defId} in initialized catalog`);
    if (itemInCatalog) {
      const expectedName = ItemDefs[configItem.defId]?.name || 'Unknown Item';
      assert(itemInCatalog.name === expectedName, `Item ${configItem.defId} name is derived from ItemDefs ("${itemInCatalog.name}" === "${expectedName}")`);
      assert(itemInCatalog.price === configItem.price, `Item ${configItem.defId} price matches config (${itemInCatalog.price} === ${configItem.price})`);
      assert(itemInCatalog.stock === configItem.stock, `Item ${configItem.defId} stock matches config (${itemInCatalog.stock} === ${configItem.stock})`);
    }
  });

  // Test 3: Dynamic name resolution if ItemDefs changes
  console.log('\nTesting dynamic name updates if definition changes...');
  const originalName = ItemDefs['food.corn'].name;
  ItemDefs['food.corn'].name = 'Sweet Golden Maize';

  const mapId2 = 'map_shop_test_p3_04_dynamic';
  worldManager.maps.set(mapId2, { metadata: {} });
  earbucksShopSystem.initCatalog(mapId2);
  const catalog2 = earbucksShopSystem.getCatalog(mapId2);
  const cornItem = catalog2.find(i => i.defId === 'food.corn');
  
  assert(cornItem?.name === 'Sweet Golden Maize', `Successfully derived updated name from ItemDefs: "${cornItem?.name}"`);

  // Restore ItemDefs
  ItemDefs['food.corn'].name = originalName;

  // Test 4: addItem fallback to ItemDefs name
  console.log('\nTesting addItem name derivation...');
  const mapId3 = 'map_shop_test_p3_04_add';
  worldManager.maps.set(mapId3, { metadata: {} });
  
  // Add item without name parameter
  earbucksShopSystem.addItem(mapId3, { defId: 'food.beans', price: 15, stock: 5 });
  const catalog3 = earbucksShopSystem.getCatalog(mapId3);
  const beansItem = catalog3.find(i => i.defId === 'food.beans');

  assert(!!beansItem, 'Added food.beans successfully');
  if (beansItem) {
    const expectedBeansName = ItemDefs['food.beans']?.name;
    assert(beansItem.name === expectedBeansName, `addItem derived name from ItemDefs: "${beansItem.name}" === "${expectedBeansName}"`);
  }

  console.log(`\n=== Results: ${passed} passed, ${failed} failed ===`);
  if (failed > 0) {
    console.error('\n❌ SOME TESTS FAILED');
    process.exit(1);
  } else {
    console.log('\n🎉 All P3-04 shop catalog tests passed!');
  }
}

verify().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
