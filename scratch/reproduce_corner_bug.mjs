import { GameMap } from '../client/src/game/map/GameMap.js';
import { EntityFactory } from '../client/src/game/EntityFactory.js';
import { AISystem } from '../client/src/game/systems/AISystem.js';
import { MovementSystem } from '../client/src/game/systems/MovementSystem.js';
import { IntentQueue } from '../client/src/game/managers/IntentQueue.js';
import { VisionSystem } from '../client/src/game/systems/VisionSystem.js';

async function testCornerBug() {
  console.log("--- Reproducing Zombie Corner Stuck Bug ---");
  const gameMap = new GameMap(10, 10);
  for (let y = 0; y < 10; y++) {
    for (let x = 0; x < 10; x++) {
      gameMap.setTerrain(x, y, 'floor');
    }
  }

  // Set up a room at top-left: x <= 4, y <= 4
  // Vertical wall on the east edge of column 4
  for (let y = 0; y <= 4; y++) {
    gameMap.getTile(4, y).edgeWalls.e = true;
    gameMap.getTile(5, y).edgeWalls.w = true;
  }
  // Horizontal wall on the south edge of row 4
  for (let x = 0; x <= 4; x++) {
    gameMap.getTile(x, 4).edgeWalls.s = true;
    gameMap.getTile(x, 5).edgeWalls.n = true;
  }

  // Player at (4, 5) (just below the horizontal wall)
  const player = EntityFactory.createPlayer(4, 5);
  gameMap.addEntity(player, 4, 5);

  // Crawler/Basic Zombie at (5, 4) (just to the right of the vertical wall)
  const zombie = EntityFactory.createZombie(5, 4, 'crawler', 'zombie-1');
  zombie.currentAP = 10;
  zombie.addComponent('AIBehavior', { alertnessState: 'IDLE' });
  gameMap.addEntity(zombie, 5, 4);

  const entities = [player, zombie];
  
  const engine = {
    gameMap,
    worldManager: null,
    _uiDirty: false
  };

  zombie.setTargetSighted(4, 5); // last seen player at (4, 5)

  VisionSystem.process(entities, null, engine);

  console.log(`Zombie can see player: ${zombie.canSeeEntity(gameMap, player)}`);
  const vision = zombie.getComponent('Vision');
  console.log(`Player in visibleEntities: ${vision.visibleEntities.includes(player.id)}`);

  const actionQueue = [];
  const intentQueue = new IntentQueue();

  console.log(`Initial Pos: Zombie(${zombie.getComponent('Position').x}, ${zombie.getComponent('Position').y}), Player(${player.getComponent('Position').x}, ${player.getComponent('Position').y})`);
  console.log(`Initial AP: ${zombie.currentAP}`);

  // Run AISystem
  const intentsCount = AISystem.process(entities, engine.worldManager, engine, actionQueue, intentQueue);
  console.log(`Intents generated: ${intentsCount}`);
  
  if (intentQueue.queue.length > 0) {
    for (const item of intentQueue.queue) {
      console.log(`Intent generated: type=${item.type}, dx=${item.component.dx}, dy=${item.component.dy}`);
      
      // Resolve intent
      if (item.type === 'MoveIntent') {
        zombie.addComponent('MoveIntent', item.component);
        MovementSystem.resolve(zombie, item.component, gameMap, actionQueue);
        const pos = zombie.getComponent('Position');
        console.log(`After Move: Zombie at (${pos.x}, ${pos.y}), AP=${zombie.currentAP}`);
      }
    }
  } else {
    console.log("No intents queued!");
  }
}

testCornerBug().catch(console.error);
