import { MapBuilder } from './client/src/game/map/MapBuilder.js';
import { GameMap } from './client/src/game/map/GameMap.js';
import { TemplateMapGenerator } from './client/src/game/map/TemplateMapGenerator.js';

async function test() {
    const builder = new MapBuilder(20, 20);
    for (let y = 0; y < 20; y++) {
        for (let x = 0; x < 20; x++) {
            builder.setTerrain(x, y, 'grass');
        }
    }
    
    // Draw building
    builder.drawBuilding(5, 5, 5, 5, 'south');
    builder.placeWindows(5, 5, 5, 5);

    const templateData = builder.getFinalMapData('road', {});
    console.log("Doors:", templateData.metadata.doors.length);
    console.log("Windows:", templateData.metadata.windows.length);

    const gameMap = new GameMap(20, 20);
    const generator = new TemplateMapGenerator();
    await generator.applyToGameMap(gameMap, templateData);

    const windows = gameMap.getAllEntities().filter(e => e.type === 'window' || e.type === 'EntityType.WINDOW');
    console.log(`Found ${windows.length} windows in game map.`);
    
    for (const w of windows) {
        console.log(`Window at ${w.x}, ${w.y}, edge: ${w.edge}`);
        const tile = gameMap.getTile(w.x, w.y);
        console.log(`Window tile terrain: ${tile.terrain}`);
        console.log(`Window tile walkable? ${tile.isWalkable()}`);
        console.log(`Window tile edgeWalls:`, tile.edgeWalls);
        
        let adjX = w.x, adjY = w.y;
        if (w.edge === 'e') adjX += 1;
        if (w.edge === 'w') adjX -= 1;
        if (w.edge === 's') adjY += 1;
        if (w.edge === 'n') adjY -= 1;
        
        const adjTile = gameMap.getTile(adjX, adjY);
        console.log(`Adj tile (${adjX}, ${adjY}) terrain: ${adjTile.terrain}`);
        console.log(`Adj tile walkable? ${adjTile.isWalkable()}`);
        console.log('---');
    }
}

test().catch(console.error);
