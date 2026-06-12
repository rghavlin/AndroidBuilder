import { TemplateMapGenerator } from '../client/src/game/map/TemplateMapGenerator.js';
import { GameMap } from '../client/src/game/map/GameMap.js';
import { EntityFactory } from '../client/src/game/EntityFactory.js';
import { ZombieAI } from '../client/src/game/ai/ZombieAI.js';
import { Pathfinding } from '../client/src/game/utils/Pathfinding.js';

async function runTest() {
    console.log("--- Starting House Zombie Oscillation Test ---");
    
    // Generate Starting Road map
    const gen = new TemplateMapGenerator();
    const mapData = gen.generateFromTemplate('starting_road', { mapNumber: 1 });
    
    // Create GameMap instance
    const gameMap = new GameMap(mapData.width, mapData.height);
    gameMap.mapNumber = 1;
    
    // Restore tiles and metadata
    for (let y = 0; y < mapData.height; y++) {
        for (let x = 0; x < mapData.width; x++) {
            const tileData = mapData.tiles[y][x];
            gameMap.tiles[y][x].terrain = tileData.terrain;
            gameMap.tiles[y][x].edgeWalls = { ...tileData.edgeWalls };
        }
    }

    // Restore doors from metadata
    const { Door } = await import('../client/src/game/entities/Door.js');
    mapData.metadata.doors.forEach(doorData => {
        const door = new Door(
            `door-${doorData.x}-${doorData.y}`,
            doorData.x,
            doorData.y,
            false,
            true, // We explicitly set it to OPEN
            false,
            doorData.edge
        );
        gameMap.addEntity(door, doorData.x, doorData.y);
    });

    // Find the front door of the starting home
    // Starting home has frontage 'north', so the entrance door is at y=102, edge='n'
    const frontDoor = gameMap.getAllEntities().find(e => e.type === 'door' && e.y === 102 && e.edge === 'n');
    if (!frontDoor) {
        console.error("Could not find front door!");
        return;
    }
    console.log(`Front door found at (${frontDoor.logicalX}, ${frontDoor.logicalY}), edge: ${frontDoor.edge}`);

    // Place player just outside the front door: at (door.x, 101)
    const px = frontDoor.logicalX;
    const py = 101;
    const player = EntityFactory.createPlayer(px, py);
    gameMap.addEntity(player, px, py);

    // Place zombie inside the room, diagonally at (door.x - 1, 103)
    const zx = frontDoor.logicalX - 1;
    const zy = 103;
    const zombie = EntityFactory.createZombie(zx, zy, 'basic', 'zombie-1');
    zombie.currentAP = 10;
    gameMap.addEntity(zombie, zx, zy);

    console.log(`Player at (${player.logicalX}, ${player.logicalY})`);
    console.log(`Zombie at (${zombie.logicalX}, ${zombie.logicalY})`);

    console.log("\n--- Executing Turn 1 ---");
    ZombieAI.DEBUG = true;
    let turn1 = ZombieAI.executeZombieTurn(zombie, gameMap, player, [], new Set());
    console.log("Turn 1 actions:", JSON.stringify(turn1.actions, null, 2));
    console.log(`Zombie now at (${zombie.logicalX}, ${zombie.logicalY})`);

    console.log("\n--- Executing Turn 2 ---");
    zombie.currentAP = 10;
    let turn2 = ZombieAI.executeZombieTurn(zombie, gameMap, player, [], new Set());
    console.log("Turn 2 actions:", JSON.stringify(turn2.actions, null, 2));
    console.log(`Zombie now at (${zombie.logicalX}, ${zombie.logicalY})`);
}

runTest().catch(console.error);
