import { GameMap } from '../client/src/game/map/GameMap.js';
import { EntityFactory } from '../client/src/game/EntityFactory.js';
import { IntentQueue } from '../client/src/game/managers/IntentQueue.js';
import { ExplosionIntent } from '../client/src/game/components/ExplosionIntent.js';

async function runTests() {
  console.log("--- Running ExplosionSystem ECS Test ---");

  const gameMap = new GameMap(10, 10);
  for (let y = 0; y < 10; y++) {
    for (let x = 0; x < 10; x++) {
      gameMap.setTerrain(x, y, 'floor');
    }
  }

  // Put a wall in the middle
  gameMap.setTerrain(5, 5, 'wall');

  const player = EntityFactory.createPlayer(2, 2);
  const zombie = EntityFactory.createZombie(3, 3, 'basic', 'zombie-1');

  gameMap.addEntity(player, 2, 2);
  gameMap.addEntity(zombie, 3, 3);

  const ecsEntities = [player, zombie, ...Array.from(gameMap.entityMap.values())];

  const engine = {
    gameMap,
    worldManager: null,
    lootGenerator: null,
    _uiDirty: false
  };

  const intentQueue = new IntentQueue();
  const actionQueue = [];

  console.log("Starting state:");
  console.log(`- Wall at (5, 5) terrain: ${gameMap.getTile(5, 5).terrain}`);
  console.log(`- Zombie HP: ${zombie.hp}`);
  console.log(`- Player HP: ${player.hp}`);

  // Enqueue a Grenade (non-incendiary explosion at (4,4) with radius 2)
  console.log("\nEnqueuing Grenade Explosion at (4, 4)...");
  intentQueue.enqueue(null, 'ExplosionIntent', new ExplosionIntent({
    targetX: 4,
    targetY: 4,
    radius: 2,
    minDamage: 10,
    maxDamage: 30,
    isIncendiary: false,
    sourceEntityId: player.id
  }));

  // Resolve
  intentQueue.resolve(ecsEntities, engine.worldManager, engine, actionQueue);

  console.log("\nResulting State:");
  console.log(`- Wall at (5, 5) terrain: ${gameMap.getTile(5, 5).terrain} (expected: floor)`);
  console.log(`- Zombie HP: ${zombie.hp} (expected: damaged)`);
  console.log(`- Player HP: ${player.hp} (expected: damaged)`);
  console.log(`- Actions in queue: ${actionQueue.length}`);
  
  const flashes = actionQueue.filter(a => a.type === 'TILE_FLASH');
  console.log(`- TILE_FLASH actions: ${flashes.length}`);

  // Now test Molotov (incendiary)
  console.log("\nEnqueuing Molotov at (2, 2)...");
  intentQueue.enqueue(null, 'ExplosionIntent', new ExplosionIntent({
    targetX: 2,
    targetY: 2,
    radius: 1.45,
    minDamage: 2,
    maxDamage: 7,
    isIncendiary: true,
    sourceEntityId: player.id
  }));

  intentQueue.resolve(ecsEntities, engine.worldManager, engine, actionQueue);

  const tileAt2_2 = gameMap.getTile(2, 2);
  console.log(`- Tile (2, 2) fireTurns: ${tileAt2_2.fireTurns} (expected: 2)`);
  console.log(`- Player fireTurns: ${player.fireTurns} (expected: 2)`);
  console.log(`- Player HP after molotov: ${player.hp}`);

  console.log("\n--- ECS ExplosionSystem Test Finished ---");
}

runTests().catch(console.error);
