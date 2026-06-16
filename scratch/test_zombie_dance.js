import { GameMap } from '../client/src/game/map/GameMap.js';
import { EntityFactory } from '../client/src/game/EntityFactory.js';
import { AISystem } from '../client/src/game/systems/AISystem.js';
import { CombatSystem } from '../client/src/game/systems/CombatSystem.js';
import { MovementSystem } from '../client/src/game/systems/MovementSystem.js';
import { IntentQueue } from '../client/src/game/managers/IntentQueue.js';

async function testZombieDance() {
  console.log("--- Reproducing Zombie Dance Bug ---");
  const gameMap = new GameMap(10, 10);
  for (let y = 0; y < 10; y++) {
    for (let x = 0; x < 10; x++) {
      gameMap.setTerrain(x, y, 'floor');
    }
  }

  // Player at (5, 5)
  const player = EntityFactory.createPlayer(5, 5);
  player.addComponent('InventoryContainer', {}); // Mark as player
  gameMap.addEntity(player, 5, 5);

  // Zombie at (4, 5) (adjacent to player)
  const zombie = EntityFactory.createZombie(4, 5, 'basic', 'zombie-1');
  zombie.currentAP = 10;
  // Initialize AIBehavior components
  zombie.addComponent('AIBehavior', { alertnessState: 'IDLE' });
  zombie.addComponent('Vision', { visibleEntities: [player.id] });
  gameMap.addEntity(zombie, 4, 5);

  const entities = [player, zombie];
  
  // Create a mock engine
  const engine = {
    gameMap,
    worldManager: null,
    _uiDirty: false
  };

  const actionQueue = [];
  let aiCycleCounter = 0;

  console.log(`Initial Pos: Zombie(${zombie.getComponent('Position').x}, ${zombie.getComponent('Position').y}), Player(${player.getComponent('Position').x}, ${player.getComponent('Position').y})`);
  console.log(`Initial AP: ${zombie.currentAP}`);

  // Simulating the loop in SimulationManager
  while (aiCycleCounter < 10) {
    const intentQueue = new IntentQueue();
    const initialIntentCount = AISystem.process(entities, engine.worldManager, engine, actionQueue, intentQueue);
    
    if (initialIntentCount === 0) {
      console.log(`Turn ended at cycle ${aiCycleCounter} with AP ${zombie.currentAP}`);
      break;
    }

    console.log(`\nCycle ${aiCycleCounter}: Generated intents count:`, intentQueue.queue.length);

    // Resolve intents manually for visibility
    for (const intentWrapper of intentQueue.queue) {
      console.log(`  Processing ${intentWrapper.type}...`);
      if (intentWrapper.type === 'DamageIntent') {
        zombie.addComponent('DamageIntent', intentWrapper.component);
        CombatSystem.resolve(zombie, intentWrapper.component, entities, gameMap, intentQueue, actionQueue, engine);
        console.log(`  Combat executed. New AP: ${zombie.currentAP}`);
      } else if (intentWrapper.type === 'MoveIntent') {
        zombie.addComponent('MoveIntent', intentWrapper.component);
        MovementSystem.resolve(zombie, intentWrapper.component, gameMap, actionQueue);
        const pos = zombie.getComponent('Position');
        console.log(`  Movement executed. New Pos: (${pos.x}, ${pos.y}). New AP: ${zombie.currentAP}`);
      }
    }

    aiCycleCounter++;
  }

  console.log(`\nFinal Pos: Zombie(${zombie.getComponent('Position').x}, ${zombie.getComponent('Position').y}), Player(${player.getComponent('Position').x}, ${player.getComponent('Position').y})`);
  console.log(`Final AP: ${zombie.currentAP}`);
}

testZombieDance().catch(console.error);
