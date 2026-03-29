
import { TemplateMapGenerator } from '../client/src/game/map/TemplateMapGenerator.js';
import { GameMap } from '../client/src/game/map/GameMap.js';

async function testWallGapFix() {
    const generator = new TemplateMapGenerator();
    const map = new GameMap(10, 10);
    
    // Scenario: Door between a window (Above) and a wall (Below)
    // This previously failed and caused a gap below the door.
    const templateData = {
        width: 10,
        height: 10,
        tiles: Array(10).fill().map((_, y) => Array(10).fill().map((_, x) => ({
            x, y, terrain: 'grass'
        }))),
        metadata: {
            doors: [
                { x: 5, y: 5, isLocked: false, isOpen: false }
            ]
        }
    };
    
    // Vertical wall line: Window(5,4), Door(5,5), Wall(5,6)
    templateData.tiles[4][5].terrain = 'window'; 
    templateData.tiles[5][5].terrain = 'building'; // Door site
    templateData.tiles[6][5].terrain = 'building'; 
    
    console.log('Initial: (5,4)=window, (5,5)=building, (5,6)=building');
    
    // Apply to game map
    await generator.applyToGameMap(map, templateData);
    
    console.log('After apply: (5,4) is', map.getTile(5, 4).terrain);
    console.log('After apply: (5,5) is', map.getTile(5, 5).terrain);
    console.log('After apply: (5,6) is', map.getTile(5, 6).terrain);
    
    // Verify results
    const isWindowPreserved = map.getTile(5, 4).terrain === 'window';
    const isWallPreserved = map.getTile(5, 6).terrain === 'building';
    const isDoorFloor = map.getTile(5, 5).terrain === 'floor';
    
    if (isWindowPreserved && isWallPreserved && isDoorFloor) {
        console.log('SUCCESS: Doorway clearance preserved the surrounding wall/window structure!');
    } else {
        console.log('FAILURE: Gap detected or structure corrupted.');
        if (!isWallPreserved) console.log(' -> GAP DETECTED at (5,6)');
        if (!isWindowPreserved) console.log(' -> WINDOW CORRUPTED at (5,4)');
    }
}

testWallGapFix().catch(console.error);
