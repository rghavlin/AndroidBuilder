import { earbucksShopSystem } from '../client/src/game/systems/EarbucksShopSystem.js';
import engine from '../client/src/game/GameEngine.js';

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
    console.log('=== P2-08: Verify EarbucksShopSystem snapshot immutable references ===\n');

    // 1. Setup mock worldManager and map
    const mapId = 'map_test_001';
    engine.worldManager = {
        maps: new Map()
    };
    
    // First, verify getCatalog with missing/no maps returns empty catalog
    const emptyCatalog1 = earbucksShopSystem.getCatalog(mapId);
    const emptyCatalog2 = earbucksShopSystem.getCatalog(mapId);
    assert(Array.isArray(emptyCatalog1), 'getCatalog returns array when map is missing');
    assert(emptyCatalog1.length === 0, 'getCatalog returns empty array when map is missing');
    assert(emptyCatalog1 === emptyCatalog2, 'getCatalog returns referentially stable empty catalog when map is missing');

    // 2. Initialize catalog by creating map entry
    const mockMap = {
        metadata: {}
    };
    engine.worldManager.maps.set(mapId, mockMap);

    const catalog1 = earbucksShopSystem.getCatalog(mapId);
    assert(catalog1.length > 0, 'Catalog initialized with default items');

    const catalog2 = earbucksShopSystem.getCatalog(mapId);
    assert(catalog1 === catalog2, 'getCatalog returns referentially stable catalog when unmodified');

    // 3. Add an item (existing) and verify immutable update
    const prevItem = catalog1.find(i => i.defId === 'food.corn');
    assert(prevItem !== undefined, 'Corn is in catalog');

    earbucksShopSystem.addItem(mapId, { defId: 'food.corn', name: 'Fresh Corn', price: 10, stock: null });
    const catalog3 = earbucksShopSystem.getCatalog(mapId);
    assert(catalog1 !== catalog3, 'addItem (update) returns a new catalog array reference');

    const newItem = catalog3.find(i => i.defId === 'food.corn');
    assert(newItem !== undefined, 'Corn still in catalog');
    assert(newItem.name === 'Fresh Corn', 'Corn name updated');
    assert(newItem.price === 10, 'Corn price updated');
    assert(prevItem !== newItem, 'Updated item is a new object reference');

    // Verify other items did not change reference (structural sharing)
    const prevWater = catalog1.find(i => i.defId === 'food.waterbottle');
    const newWater = catalog3.find(i => i.defId === 'food.waterbottle');
    assert(prevWater === newWater, 'Unchanged items maintain reference (structural sharing)');

    // 4. Add a new item and verify catalog reference changes
    earbucksShopSystem.addItem(mapId, { defId: 'weapon.pistol', name: 'Pistol', price: 100, stock: 2 });
    const catalog4 = earbucksShopSystem.getCatalog(mapId);
    assert(catalog3 !== catalog4, 'addItem (new) returns a new catalog array reference');
    assert(catalog4.some(i => i.defId === 'weapon.pistol'), 'Pistol added to catalog');

    // 5. Remove an item and verify reference changes
    earbucksShopSystem.removeItem(mapId, 'weapon.pistol');
    const catalog5 = earbucksShopSystem.getCatalog(mapId);
    assert(catalog4 !== catalog5, 'removeItem returns a new catalog array reference');
    assert(!catalog5.some(i => i.defId === 'weapon.pistol'), 'Pistol removed from catalog');

    // 6. Buy an item (finite stock) and verify array and item clone
    const lighterBefore = catalog5.find(i => i.defId === 'tool.lighter');
    assert(lighterBefore !== undefined, 'Lighter is in catalog');
    assert(lighterBefore.stock === 1, 'Lighter stock is 1');
    assert(lighterBefore.purchased === 0, 'Lighter purchased is 0');

    // Mock player and inventoryManager for buying
    const mockPlayer = {
        earbucks: 100
    };
    const mockInvManager = {
        addItem: () => ({ success: true })
    };

    earbucksShopSystem.buyItem('tool.lighter', mapId, mockPlayer, mockInvManager);

    const catalog6 = earbucksShopSystem.getCatalog(mapId);
    assert(catalog5 !== catalog6, 'buyItem (finite stock) returns a new catalog array reference');

    const lighterAfter = catalog6.find(i => i.defId === 'tool.lighter');
    assert(lighterAfter.purchased === 1, 'Lighter purchased count incremented to 1');
    assert(lighterBefore !== lighterAfter, 'Lighter item reference was cloned');

    console.log(`\n=== Results: ${passed} passed, ${failed} failed ===`);
    if (failed > 0) {
        console.error('\n❌ SOME TESTS FAILED');
        process.exit(1);
    } else {
        console.log('\n🎉 All P2-08 Earbucks shop catalog snapshot tests passed!');
    }
}

verify().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});
