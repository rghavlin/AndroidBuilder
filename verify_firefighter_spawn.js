import GameInitializationManager from './client/src/game/GameInitializationManager.js';
import Zombie from './client/src/game/entities/Zombie.js';

// Mock GameMap
class MockMap {
    constructor(width, height) {
        this.width = width;
        this.height = height;
        this.entities = [];
        this.metadata = {
            specialBuildings: [
                { type: 'firestation', x: 10, y: 10, width: 10, height: 10 }
            ]
        };
        this.grid = Array(height).fill(null).map(() => Array(width).fill({ terrain: 'floor', contents: [] }));
    }
    getTile(x, y) {
        if (x < 0 || x >= this.width || y < 0 || y >= this.height) return null;
        return {
            terrain: 'floor',
            contents: this.entities.filter(e => e.x === x && e.y === y),
            isWalkable: () => true
        };
    }
    addEntity(entity, x, y) {
        entity.x = x;
        entity.y = y;
        this.entities.push(entity);
        return true;
    }
}

// Mock Player
const mockPlayer = { x: 0, y: 0 };

async function verifySpawning() {
    const gameMap = new MockMap(50, 50);
    const manager = new GameInitializationManager();
    
    console.log("--- Verifying Firefighter Zombie Spawning ---");
    const spawnedCount = manager._spawnInitialZombies(gameMap, mockPlayer);
    
    const firefighters = gameMap.entities.filter(e => e.subtype === 'firefighter');
    console.log(`Total spawned: ${spawnedCount}`);
    console.log(`Firefighter zombies: ${firefighters.length}`);
    
    firefighters.forEach((f, i) => {
        console.log(`Firefighter ${i+1}: ID=${f.id}, Pos=(${f.x}, ${f.y}), HP=${f.hp}/${f.maxHp}, AP=${f.currentAP}/${f.maxAP}`);
    });

    if (firefighters.length >= 2 && firefighters.length <= 3) {
        console.log("SUCCESS: Correct number of firefighter zombies spawned.");
    } else {
        console.log("FAILURE: Incorrect number of firefighter zombies spawned.");
    }
    
    // Check if inside fire station (10,10 to 20,20)
    const allInside = firefighters.every(f => f.x >= 10 && f.x < 20 && f.y >= 10 && f.y < 20);
    if (allInside) {
        console.log("SUCCESS: All firefighter zombies are inside the fire station.");
    } else {
        console.log("FAILURE: Some firefighter zombies are OUTSIDE the fire station.");
    }
}

verifySpawning().catch(console.error);
