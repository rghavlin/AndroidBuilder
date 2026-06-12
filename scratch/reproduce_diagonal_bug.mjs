import { GameMap } from '../client/src/game/map/GameMap.js';
import { EntityFactory } from '../client/src/game/EntityFactory.js';
import { AISystem } from '../client/src/game/systems/AISystem.js';
import { MovementSystem } from '../client/src/game/systems/MovementSystem.js';
import { IntentQueue } from '../client/src/game/managers/IntentQueue.js';

async function testDiagonalBug() {
  console.log("--- Reproducing Zombie Diagonal Bug ---");
  const gameMap = new GameMap(10, 10);
  for (let y = 0; y < 10; y++) {
    for (let x = 0; x < 10; x++) {
      gameMap.setTerrain(x, y, 'floor');
    }
  }

  // Player at (5, 5)
  const player = EntityFactory.createPlayer(5, 5);
  gameMap.addEntity(player, 5, 5);

  // Basic Zombie at (4, 4) (diagonal to player)
  const zombie = EntityFactory.createZombie(4, 4, 'basic', 'zombie-1');
  zombie.currentAP = 10;
  zombie.addComponent('AIBehavior', { alertnessState: 'IDLE' });
  zombie.addComponent('Vision', { visibleEntities: [player.id] });
  gameMap.addEntity(zombie, 4, 4);

  const entities = [player, zombie];
  
  const engine = {
    gameMap,
    worldManager: null,
    _uiDirty: false
  };

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

testDiagonalBug().catch(console.error);
