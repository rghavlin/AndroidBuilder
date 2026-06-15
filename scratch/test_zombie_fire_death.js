import { GameMap } from '../client/src/game/map/GameMap.js';
import { Entity } from '../client/src/game/entities/Entity.js';
import { SimulationManager } from '../client/src/game/managers/SimulationManager.js';
import engine from '../client/src/game/GameEngine.js';

async function testZombieFireDeath() {
  console.log("🧪 RUNNING ZOMBIE FIRE DEATH TEST 🧪");

  // Setup mock map and entities
  const map = new GameMap(10, 10);
  engine.gameMap = map;
  globalThis.gameEngine = { gameMap: map };

  const player = new Entity('player-id', 'player', 2, 2);
  player.hp = 20;
  player.maxHp = 20;
  map.entityMap.set(player.id, player);
  map.getTile(2, 2).addEntity(player);

  const zombie = new Entity('zombie-id', 'zombie', 4, 3);
  zombie.hp = 2; // low hp so one fire tick will kill it
  zombie.maxHp = 15;
  zombie.fireTurns = 2;
  map.entityMap.set(zombie.id, zombie);
  map.getTile(4, 3).addEntity(zombie);

  console.log(`Initial state: Zombie HP = ${zombie.hp}, fireTurns = ${zombie.fireTurns}`);
  console.log(`Zombie is in map: ${!!map.getEntity(zombie.id)}`);

  // Run 1 turn simulation
  console.log("Simulating 1 turn...");
  SimulationManager.runTurn(map, { player, isSleeping: false });

  console.log(`State after simulation:`);
  console.log(`Zombie HP = ${zombie.hp}`);
  console.log(`Zombie is in map: ${!!map.getEntity(zombie.id)}`);

  if (zombie.hp <= 0 && map.getEntity(zombie.id)) {
    console.error("❌ BUG REPRODUCED: Zombie HP is 0 or less, but it is still in the map!");
  } else if (zombie.hp <= 0 && !map.getEntity(zombie.id)) {
    console.log("✅ SUCCESS: Zombie HP <= 0 and it was removed from the map.");
  } else {
    console.log("Zombie didn't die yet (HP > 0).");
  }
}

testZombieFireDeath();
