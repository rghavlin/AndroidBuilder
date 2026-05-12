import { TemplateMapGenerator } from './client/src/game/map/TemplateMapGenerator.js';

async function verify() {
    const generator = new TemplateMapGenerator();
    const mapData = generator.generateFromTemplate('split_road');
    
    console.log(`Map Size: ${mapData.width}x${mapData.height}`);
    console.log(`Building Count: ${mapData.metadata.buildings.length}`);
    console.log(`Special Building Count: ${mapData.metadata.specialBuildings.length}`);
    
    // Check some specific tiles to verify the sequence
    // Fence (0) -> Sidewalk (1) -> Road (2..6) -> Sidewalk (7)
    const testY = 20;
    const tiles = mapData.tiles[testY];
    
    console.log(`Sequence at y=${testY}:`);
    for (let x = 0; x <= 10; x++) {
        console.log(`  x=${x}: ${tiles[x].terrain}`);
    }
    
    const centerX = Math.floor(mapData.width / 2);
    console.log(`Central Tile (x=${centerX}, y=${testY}): ${tiles[centerX].terrain}`);
    
    // Check transition tiles
    const northTile = mapData.tiles[0][centerX].terrain;
    const southTile = mapData.tiles[mapData.height-1][centerX].terrain;
    console.log(`North Exit (y=0): ${northTile}`);
    console.log(`South Exit (y=H-1): ${southTile}`);

    // Check "Blue Circle" area (inner sidewalk continuity)
    const innerS1 = 7; // 2 + 5 (roadThickness)
    const blueCircleTile = mapData.tiles[innerS1][centerX].terrain;
    console.log(`Inner Sidewalk at Transition (y=${innerS1}): ${blueCircleTile}`);
    
    // Check "Yellow Lines" (Perimeter continuity at corners)
    const cornerX = 0;
    const cornerY = 0;
    console.log(`Top-Left Corner (0,0): ${mapData.tiles[0][0].terrain}`);
    console.log(`Bottom-Left Corner (0,H-1): ${mapData.tiles[mapData.height-1][0].terrain}`);
    console.log(`Outer Sidewalk near Top-Left (1,1): ${mapData.tiles[1][1].terrain}`);
    
    // Check Entry Width (y=0)
    let roadCount = 0;
    for (let x = 0; x < mapData.width; x++) {
        const t = mapData.tiles[0][x].terrain;
        if (t === 'road' || t === 'transition') roadCount++;
    }
    console.log(`Entry Road Width at North Edge: ${roadCount}`);

    if (mapData.metadata.buildings.length >= 10) {
        console.log('SUCCESS: Generated at least 10 houses.');
    } else {
        console.log('WARNING: Fewer than 10 houses generated.');
    }
}

verify().catch(console.error);
