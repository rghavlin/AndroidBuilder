import { GameMap } from '../client/src/game/map/GameMap.js';
import { EntityFactory } from '../client/src/game/EntityFactory.js';
import { Pathfinding } from '../client/src/game/utils/Pathfinding.js';
import { AISystem } from '../client/src/game/systems/AISystem.js';
import { MovementSystem } from '../client/src/game/systems/MovementSystem.js';
import { CombatSystem } from '../client/src/game/systems/CombatSystem.js';
import { Window } from '../client/src/game/entities/Window.js';
import engine from '../client/src/game/GameEngine.js';
import { VisionSystem } from '../client/src/game/systems/VisionSystem.js';

async function runOscillationTest() {
  console.log("--- Running ECS Window Side Oscillation Test ---");

  const gameMap = new GameMap(10, 10);
  for (let y = 0; y < 10; y++) {
    for (let x = 0; x < 10; x++) {
      gameMap.setTerrain(x, y, 'floor');
    }
  }

  engine.gameMap = gameMap;
  engine.worldManager = {};

  // Player at (4, 4) (inside room)
  const player = EntityFactory.createPlayer(4, 4);
  gameMap.addEntity(player, 4, 4);

  // Zombie at (5, 5) (outside, to the side of the window)
  const zombie = EntityFactory.createZombie(5, 5, 'basic', 'zombie-test');
  gameMap.addEntity(zombie, 5, 5);

  // Window on the south edge of tile (5, 4)
  const windowEntity = new Window('window-1', 5, 4, false, false, false, 's');
  gameMap.addEntity(windowEntity, 5, 4);

  // Set the edge walls along y=4 south / y=5 north
  for (let x = 0; x < 10; x++) {
    gameMap.getTile(x, 4).edgeWalls.s = true;
    gameMap.getTile(x, 5).edgeWalls.n = true;
  }

  const ecsEntities = [player, zombie];

  for (let turn = 1; turn <= 4; turn++) {
    console.log(`\n=== Turn ${turn} ===`);
    zombie.startTurn();
    
    // Simulate turn resolution cycle
    let tick = 0;
    const actionQueue = [];
    while (zombie.currentAP > 0 && tick < 10) {
      tick++;
      // 1. Vision
      VisionSystem.process(ecsEntities, engine.worldManager, engine);
      // 2. AI
      const intentsCount = AISystem.process(ecsEntities, engine.worldManager, engine, actionQueue);
      if (intentsCount === 0) {
        console.log(`No intents generated at tick ${tick}`);
        break;
      }
      // 3. Movement / Combat (Intent execution)
      MovementSystem.process(ecsEntities, engine.worldManager, engine, actionQueue);
      CombatSystem.process(ecsEntities, engine.worldManager, engine, actionQueue);
    }
    console.log(`Zombie Pos: (${zombie.logicalX}, ${zombie.logicalY}), AP: ${zombie.currentAP}`);
    console.log(`Window isBroken: ${windowEntity.isBroken}`);
    console.log(`Actions:`, JSON.stringify(actionQueue));
  }
}

runOscillationTest().catch(console.error);
