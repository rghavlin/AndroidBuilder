import { TemplateMapGenerator } from './client/src/game/map/TemplateMapGenerator.js';
import { GameMap } from './client/src/game/map/GameMap.js';

async function test() {
    const generator = new TemplateMapGenerator();
    const gameMap = new GameMap(70, 80);
    
    console.log("Generating 'lab' template...");
    const templateData = generator.generateFromTemplate('lab', 70, 80);
    
    console.log("Applying to GameMap...");
    await generator.applyToGameMap(gameMap, templateData);
    
    // Find a door
    const doors = gameMap.getAllEntities().filter(e => e.type === 'door' || e.type === 'EntityType.DOOR');
    console.log(`Found ${doors.length} doors.`);
    
    if (doors.length > 0) {
        const d = doors[0];
        console.log(`Door at ${d.x}, ${d.y}, edge: ${d.edge}`);
        
        const tile = gameMap.getTile(d.x, d.y);
        console.log(`Door tile terrain: ${tile.terrain}`);
        console.log(`Door tile edgeWalls:`, tile.edgeWalls);
        
        const adjY = d.y - 1;
        const adjTile = gameMap.getTile(d.x, adjY);
        console.log(`North tile (${d.x}, ${adjY}) terrain: ${adjTile.terrain}`);
        console.log(`North tile edgeWalls:`, adjTile.edgeWalls);
    }
}

test().catch(console.error);
