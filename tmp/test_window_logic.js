
import { GameMap } from 'c:/Games/AndroidBuilder/client/src/game/map/GameMap.js';
import { Window } from 'c:/Games/AndroidBuilder/client/src/game/entities/Window.js';
import { Tile } from 'c:/Games/AndroidBuilder/client/src/game/map/Tile.js';

async function testWindowPassability() {
    console.log('--- Testing Window Passability ---');
    
    const gameMap = new GameMap('test-map', 10, 10);
    const x = 5, y = 5;
    
    // Set tile as floor first to ensure it's normally walkable
    gameMap.setTerrain(x, y, 'floor');
    let tile = gameMap.getTile(x, y);
    console.log(`Initial floor walkability: ${tile.isWalkable()}`); // Should be true
    
    // Add a closed window
    const window = new Window('test-window', x, y, true, false, false);
    gameMap.addEntity(window, x, y);
    
    console.log(`Window blocksMovement: ${window.blocksMovement}`); // Should be true
    console.log(`Tile contents length: ${tile.contents.length}`);
    console.log(`Tile terrain: ${tile.terrain}`);
    console.log(`Tile walkability with closed window: ${tile.isWalkable()}`); // Should be false
    
    if (tile.isWalkable()) {
        console.error('FAIL: Closed window is passable!');
    } else {
        console.log('SUCCESS: Closed window blocks movement.');
    }
    
    // Open the window
    window.open();
    console.log(`Window blocksMovement (open): ${window.blocksMovement}`); // Should be false
    console.log(`Tile walkability with open window: ${tile.isWalkable()}`); // Should be true
    
    // Break the window
    window.close();
    window.break();
    console.log(`Window blocksMovement (broken): ${window.blocksMovement}`); // Should be false
    console.log(`Tile walkability with broken window: ${tile.isWalkable()}`); // Should be true
}

testWindowPassability().catch(console.error);
