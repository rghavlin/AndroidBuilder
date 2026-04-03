import { GameMap } from './client/src/game/map/GameMap.js';
import { Rabbit } from './client/src/game/entities/Rabbit.js';
import { RabbitAI } from './client/src/game/ai/RabbitAI.js';
import { AnimalSpawner } from './client/src/game/utils/AnimalSpawner.js';

console.log('--- Rabbit System Check ---');

try {
    const map = new GameMap(20, 20);
    const rabbit = new Rabbit('test-rabbit', 5, 5);
    map.addEntity(rabbit, 5, 5);
    console.log('Rabbit entity created and added to map.');

    const player = { x: 10, y: 10 };
    const turnResult = RabbitAI.executeRabbitTurn(rabbit, map, player, []);
    console.log('Rabbit AI turn execution successful:', turnResult);

    const spawned = AnimalSpawner.spawnAnimals(map, player, { rabbitRange: { min: 2, max: 2 } });
    console.log(`Animal Spawner check: Spawned ${spawned} rabbits.`);

    console.log('--- All structures verified ---');
} catch (error) {
    console.error('System Check FAILED:', error);
}
