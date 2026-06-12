import { GameMap } from '../client/src/game/map/GameMap.js';
import { TemplateMapGenerator } from '../client/src/game/map/TemplateMapGenerator.js';
import { EntityFactory } from '../client/src/game/EntityFactory.js';
import { ZombieSpawner } from '../client/src/game/utils/ZombieSpawner.js';
import { PlayerZombieTracker } from '../client/src/game/ai/PlayerZombieTracker.js';
import { AISystem } from '../client/src/game/systems/AISystem.js';

async function main() {
    console.log("--- Initializing Simulated Game for Map 1 ---");
    const gameMap = new GameMap(70, 84);
    gameMap.mapNumber = 1;

    const generator = new TemplateMapGenerator();
    const mapData = generator.generateFromTemplate('starting_road', { mapNumber: 1 });
    await generator.applyToGameMap(gameMap, mapData);

    // Determine start position
    let startX = Math.floor(gameMap.width / 2);
    let startY = Math.floor(gameMap.height * 0.9);
    const templateStartPos = generator.getStartPosition(mapData.template);
    if (templateStartPos) {
        startX = templateStartPos.x;
        startY = templateStartPos.y;
    }

    const player = EntityFactory.createPlayer(startX, startY);
    player.id = 'player-1';
    gameMap.addEntity(player, startX, startY);
    console.log(`Player spawned at: (${startX}, ${startY})`);

    // Spawn a zombie at the very top (e.g. y = 10)
    const topZombie = EntityFactory.createZombie(startX, 10, 'basic', 'zombie-top');
    gameMap.addEntity(topZombie, startX, 10);
    console.log(`Top zombie spawned at: (${startX}, 10)`);

    // Spawn other zombies normally
    ZombieSpawner.spawnZombies(gameMap, player, {
        basicCount: 18,
        crawlerRange: { min: 3, max: 6 },
        runnerCount: 1,
        acidRange: { min: 0, max: 0 },
        fatRange: { min: 0, max: 0 },
        maxTotal: 120,
        minDistance: 15
    });

    const zombies = gameMap.getEntitiesByType('zombie');
    console.log(`Spawned ${zombies.length} zombies total.`);

    // Initialize player-centric tracker
    const zombieTracker = new PlayerZombieTracker();
    const engine = { gameMap, player, zombieTracker };

    // Simulate initial fov (empty first, then update)
    const initialFov = []; // Empty or small FOV
    console.log("--- Calling initial updateTracking ---");
    zombieTracker.updateTracking(gameMap, player, initialFov);

    console.log(`Top Zombie targetSightedCoords:`, topZombie.targetSightedCoords, `lastSeen:`, topZombie.lastSeen);

    // Now run the AISystem on all entities
    console.log("--- Running AISystem.process ---");
    const entities = gameMap.getAllEntities().filter(e => typeof e.hasComponent === 'function');
    AISystem.process(entities, null, engine);

    console.log(`Top Zombie behaviorState: ${topZombie.behaviorState}`);
    console.log(`Top Zombie lastSeen: ${topZombie.lastSeen}`);
    console.log(`Top Zombie targetSightedCoords:`, topZombie.targetSightedCoords);
}

main().catch(console.error);
