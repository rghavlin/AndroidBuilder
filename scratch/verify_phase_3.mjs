import { EntityFactory } from '../client/src/game/EntityFactory.js';
import { MoveIntent } from '../client/src/game/components/MoveIntent.js';
import { MovementSystem } from '../client/src/game/systems/MovementSystem.js';

console.log("Starting Phase 3 Verification...");

try {
  // 1. Manually instantiate an engine mock and a mock WorldManager
  const mockEngine = {
    gameMap: {
      getTile(x, y) {
        // Return a mock tile that is walkable
        return {
          x,
          y,
          isWalkable(entity) {
            return true; 
          },
          contents: []
        };
      }
    },
    _uiDirty: false
  };

  const mockWorldManager = {};

  // 2. Create player and zombie using EntityFactory
  const player = EntityFactory.createPlayer(5, 5);
  const zombie = EntityFactory.createZombie(5, 10);
  const entities = [player, zombie];

  console.log("Initial Zombie Position:", zombie.getComponent('Position'));

  // 3. Give the Zombie a MoveIntent of {dx: 0, dy: -1}
  zombie.addComponent(new MoveIntent({ dx: 0, dy: -1 }));
  console.log("Zombie with MoveIntent attached:", zombie);

  // 4. Run MovementSystem.process(entities, mockWorldManager, mockEngine)
  MovementSystem.process(entities, mockWorldManager, mockEngine);

  const zombiePos = zombie.getComponent('Position');
  console.log("Post-Movement Zombie Position:", zombiePos);

  // 5. Assert that the Zombie's Position.y has decreased by 1 (10 -> 9)
  if (zombiePos.y !== 9) {
    throw new Error(`Assertion failed: Zombie's Position.y should be 9, got: ${zombiePos.y}`);
  }
  if (zombiePos.x !== 5) {
    throw new Error(`Assertion failed: Zombie's Position.x should remain 5, got: ${zombiePos.x}`);
  }

  // 6. Assert that the MoveIntent component has been successfully removed from the Zombie
  const hasMoveIntent = zombie.hasComponent('MoveIntent');
  console.log("Zombie has MoveIntent component post-process:", hasMoveIntent);
  if (hasMoveIntent) {
    throw new Error("Assertion failed: MoveIntent component was not removed from the Zombie.");
  }

  console.log("Phase 3 Verification Complete! All assertions passed successfully.");
} catch (error) {
  console.error("Verification failed with error:", error);
  process.exit(1);
}
