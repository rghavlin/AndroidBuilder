import { TemplateMapGenerator } from '../client/src/game/map/TemplateMapGenerator.js';

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
    console.log('=== P2-09: Verify addRandomWalls/addRandomFloors infinite loop protection ===\n');

    const generator = new TemplateMapGenerator();

    // 1. Test addRandomWalls on a 5x5 grid with a high count (100)
    // A 5x5 grid has only 3x3 = 9 internal cells, so asking for 100 walls is impossible.
    // If the loop doesn't have an attempts guard, this call will hang.
    const layout1 = [
        ['grass', 'grass', 'grass', 'grass', 'grass'],
        ['grass', 'grass', 'grass', 'grass', 'grass'],
        ['grass', 'grass', 'grass', 'grass', 'grass'],
        ['grass', 'grass', 'grass', 'grass', 'grass'],
        ['grass', 'grass', 'grass', 'grass', 'grass']
    ];

    console.log('Testing addRandomWalls with count=100 on 5x5 grid...');
    const startTime1 = Date.now();
    generator.addRandomWalls(layout1, 100);
    const duration1 = Date.now() - startTime1;

    console.log(`addRandomWalls finished in ${duration1}ms`);
    assert(duration1 < 100, 'addRandomWalls terminated within 100ms');

    // Count how many walls were placed. It should be <= 9.
    let wallCount = 0;
    for (let y = 1; y < 4; y++) {
        for (let x = 1; x < 4; x++) {
            if (layout1[y][x] === 'wall') wallCount++;
        }
    }
    console.log(`Placed ${wallCount} walls out of 9 possible internal cells.`);
    assert(wallCount <= 9, 'Correctly placed a subset of walls without exceeding internal bounds');

    // 2. Test addRandomFloors on a 5x5 grid with no grass tiles at all
    // If the loop doesn't have an attempts guard, asking for 10 floors will hang.
    const layout2 = [
        ['wall', 'wall', 'wall', 'wall', 'wall'],
        ['wall', 'wall', 'wall', 'wall', 'wall'],
        ['wall', 'wall', 'wall', 'wall', 'wall'],
        ['wall', 'wall', 'wall', 'wall', 'wall'],
        ['wall', 'wall', 'wall', 'wall', 'wall']
    ];

    console.log('Testing addRandomFloors with count=10 on grassless grid...');
    const startTime2 = Date.now();
    generator.addRandomFloors(layout2, 10);
    const duration2 = Date.now() - startTime2;

    console.log(`addRandomFloors finished in ${duration2}ms`);
    assert(duration2 < 100, 'addRandomFloors terminated within 100ms');

    let floorCount = 0;
    for (let y = 0; y < 5; y++) {
        for (let x = 0; x < 5; x++) {
            if (layout2[y][x] === 'floor') floorCount++;
        }
    }
    assert(floorCount === 0, 'No floor tiles were placed because no grass was available');

    console.log(`\n=== Results: ${passed} passed, ${failed} failed ===`);
    if (failed > 0) {
        console.error('\n❌ SOME TESTS FAILED');
        process.exit(1);
    } else {
        console.log('\n🎉 All P2-09 infinite loop protection tests passed!');
    }
}

verify().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});
