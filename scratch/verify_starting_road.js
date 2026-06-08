import { TemplateMapGenerator } from '../client/src/game/map/TemplateMapGenerator.js';
import { LootGenerator } from '../client/src/game/map/LootGenerator.js';
import { GameMap } from '../client/src/game/map/GameMap.js';

console.log('--- STARTING ROAD MAP VERIFICATION ---');

try {
    const templateMapGenerator = new TemplateMapGenerator();
    const lootGenerator = new LootGenerator();

    const mapData = templateMapGenerator.generateFromTemplate('starting_road', {
        randomWalls: 1,
        extraFloors: 2,
        mapNumber: 1
    });

    const gameMap = new GameMap(mapData.width, mapData.height);
    gameMap.mapNumber = 1;
    await templateMapGenerator.applyToGameMap(gameMap, mapData);
    lootGenerator.spawnLoot(gameMap, 1);

    console.log(`Map generated successfully! Template: ${gameMap.template}, Size: ${gameMap.width}x${gameMap.height}`);
    if (gameMap.height !== 117) {
        throw new Error(`Expected map height to be 117, found ${gameMap.height}`);
    }

    // Check starting position
    const startPos = templateMapGenerator.getStartPosition('starting_road');
    console.log(`Starting Position: (${startPos.x}, ${startPos.y})`);
    
    // Check if starting position is inside the starting home
    const startingHome = gameMap.buildings.find(b => b.type === 'starting_home');
    if (!startingHome) {
        throw new Error('Starting home building not found on the map!');
    }
    console.log(`Starting Home: at (${startingHome.x}, ${startingHome.y}) size ${startingHome.width}x${startingHome.height}`);
    
    const isInside = startPos.x >= startingHome.x && startPos.x < startingHome.x + startingHome.width &&
                     startPos.y >= startingHome.y && startPos.y < startingHome.y + startingHome.height;
    console.log(`Is start position inside starting home: ${isInside ? '✅ Yes' : '❌ No'}`);
    if (!isInside) throw new Error('Start position must be inside starting home!');

    // Check starting home terrain at start position
    const startTile = gameMap.getTile(startPos.x, startPos.y);
    console.log(`Terrain at starting position: '${startTile.terrain}'`);
    if (startTile.terrain !== 'floor') {
        throw new Error(`Terrain at start position should be floor, got '${startTile.terrain}'`);
    }

    // Check bottom fence goes all the way across
    console.log('Checking horizontal fence at y = 116...');
    for (let x = 0; x < gameMap.width; x++) {
        const terrain = gameMap.getTile(x, 116).terrain;
        if (terrain !== 'fence') {
            throw new Error(`Expected fence at position (${x}, 116), got '${terrain}'`);
        }
    }
    console.log(`Fence at y=116: All ${gameMap.width} tiles are fences ✅ Correct`);

    // Check starting home loot
    console.log('Checking loot inside starting home...');
    let randomPilesCount = 0;
    let totalPlanks = 0;

    for (let y = startingHome.y + 1; y < startingHome.y + startingHome.height - 1; y++) {
        for (let x = startingHome.x + 1; x < startingHome.x + startingHome.width - 1; x++) {
            const items = gameMap.getItemsOnTile(x, y);
            if (items && items.length > 0) {
                console.log(`  Loot at (${x}, ${y}): ${items.map(i => `${i.name} (${i.defId})`).join(', ')}`);
                const hasNonPlank = items.some(item => item.defId !== 'weapon.plank');
                if (hasNonPlank) {
                    randomPilesCount++;
                }
                items.forEach(item => {
                    if (item.defId === 'weapon.plank') {
                        totalPlanks++;
                    }
                });
            }
        }
    }

    // Verify using item counts in the starting home
    let totalItems = 0;
    let plankCountInHome = 0;
    let nonPlankCountInHome = 0;

    for (let y = startingHome.y + 1; y < startingHome.y + startingHome.height - 1; y++) {
        for (let x = startingHome.x + 1; x < startingHome.x + startingHome.width - 1; x++) {
            const items = gameMap.getItemsOnTile(x, y);
            if (items && items.length > 0) {
                totalItems += items.length;
                items.forEach(item => {
                    if (item.defId === 'weapon.plank') {
                        plankCountInHome++;
                    } else {
                        nonPlankCountInHome++;
                    }
                });
            }
        }
    }

    console.log(`Total items in starting home: ${totalItems}`);
    console.log(`Planks in starting home: ${plankCountInHome}`);
    console.log(`Non-planks in starting home: ${nonPlankCountInHome}`);

    if (totalItems < 7 || totalItems > 21) {
        throw new Error(`Unexpected number of total items in starting home: ${totalItems}`);
    }
    if (plankCountInHome < 1) {
        throw new Error(`Expected at least 1 plank in starting home, found ${plankCountInHome}`);
    }

    console.log('✅ ALL CHECKS PASSED SUCCESSFULLY!');

} catch (err) {
    console.error('❌ VERIFICATION FAILED:', err);
    process.exit(1);
}
