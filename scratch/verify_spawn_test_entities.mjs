import { TestEntity, Item as LegacyItem } from '../client/src/game/entities/TestEntity.js';
import { Entity } from '../client/src/game/entities/Entity.js';

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
    console.log('=== P2-14: Verify TestEntity and LegacyItem construction ===\n');

    // 1. Instantiate TestEntity
    const testEntity = new TestEntity('test-zombie-1', 10, 20, 'zombie');
    assert(testEntity instanceof Entity, 'TestEntity is an instance of Entity');
    assert(testEntity.id === 'test-zombie-1', 'TestEntity id matches');
    assert(testEntity.x === 10 && testEntity.y === 20, 'TestEntity coordinates match');
    assert(testEntity.subtype === 'zombie', 'TestEntity subtype matches');

    // 2. Instantiate LegacyItem
    const legacyItem = new LegacyItem('item-weapon-1', 15, 25, 'weapon');
    assert(legacyItem instanceof Entity, 'LegacyItem is an instance of Entity');
    assert(legacyItem.id === 'item-weapon-1', 'LegacyItem id matches');
    assert(legacyItem.x === 15 && legacyItem.y === 25, 'LegacyItem coordinates match');
    assert(legacyItem.subtype === 'weapon', 'LegacyItem subtype matches');

    console.log(`\n=== Results: ${passed} passed, ${failed} failed ===`);
    if (failed > 0) {
        console.error('\n❌ SOME TESTS FAILED');
        process.exit(1);
    } else {
        console.log('\n🎉 All P2-14 test entity construction tests passed!');
    }
}

verify().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});
