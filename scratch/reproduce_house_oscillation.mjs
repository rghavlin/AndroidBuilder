import { TemplateMapGenerator } from '../client/src/game/map/TemplateMapGenerator.js';
import { GameMap } from '../client/src/game/map/GameMap.js';
import { Zombie } from '../client/src/game/entities/Zombie.js';
import { Player } from '../client/src/game/entities/Player.js';
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
    const player = new Player('player', 'player', px, py);
    gameMap.addEntity(player, px, py);

    // Place zombie inside the room, diagonally at (door.x - 1, 103)
    const zx = frontDoor.logicalX - 1;
    const zy = 103;
    const zombie = new Zombie('zombie-1', zx, zy, 'basic');
    zombie.currentAP = 10;
    gameMap.addEntity(zombie, zx, zy);

    console.log(`Player at (${player.logicalX}, ${player.logicalY})`);
    console.log(`Zombie at (${zombie.logicalX}, ${zombie.logicalY})`);

    // Let's print local tile details
    console.log("\nTile Grid details:");
    for (let y = 100; y <= 106; y++) {
        let line = `y=${y}: `;
        for (let x = frontDoor.logicalX - 3; x <= frontDoor.logicalX + 3; x++) {
            const tile = gameMap.getTile(x, y);
            const t = tile.terrain.substring(0, 4);
            const ew = Object.keys(tile.edgeWalls).filter(k => tile.edgeWalls[k]).join('');
            const hasEntity = tile.contents.map(e => e.type).join(',');
            line += `[x=${x}:${t}:${ew || 'none'}${hasEntity ? ':' + hasEntity : ''}] `;
        }
        console.log(line);
    }

    // Let's manually run the swarm spot evaluation logic
    const adjacentSpots = [];
    for (let dx = -1; dx <= 1; dx++) {
        for (let dy = -1; dy <= 1; dy++) {
            if (dx === 0 && dy === 0) continue;
            adjacentSpots.push({ x: player.logicalX + dx, y: player.logicalY + dy });
        }
    }
    adjacentSpots.sort((a, b) => {
        const isCardinalA = (a.x === player.logicalX || a.y === player.logicalY);
        const isCardinalB = (b.x === player.logicalX || b.y === player.logicalY);
        const canAttackFromA = zombie.subtype === 'mutant' || isCardinalA;
        const canAttackFromB = zombie.subtype === 'mutant' || isCardinalB;
        if (canAttackFromA !== canAttackFromB) return canAttackFromA ? -1 : 1;
        const distA = Math.abs(a.x - zombie.logicalX) + Math.abs(a.y - zombie.logicalY);
        const distB = Math.abs(b.x - zombie.logicalX) + Math.abs(b.y - zombie.logicalY);
        return distA - distB;
    });

    console.log("\nAdjacent Spots around Player (Sorted):");
    for (const spot of adjacentSpots) {
        const tile = gameMap.getTile(spot.x, spot.y);
        const walkable = tile && tile.isWalkable(zombie);
        console.log(`Spot (${spot.x}, ${spot.y}): walkable=${walkable}`);
    }

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
