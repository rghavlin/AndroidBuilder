import { describe, it, expect } from 'vitest';
import { GameMap } from '../../client/src/game/map/GameMap.js';
import { EntityFactory } from '../../client/src/game/EntityFactory.js';
import { AISystem } from '../../client/src/game/systems/AISystem.js';
import { IntentQueue } from '../../client/src/game/managers/IntentQueue.js';
import { gameRandom } from '../../client/src/game/utils/SeededRandom.js';
import engine from '../../client/src/game/GameEngine.js';

describe('AI State Transitions (AISystem)', () => {
  it('starts in IDLE alertness state when no player is sighted or heard', () => {
    gameRandom.seed(1);
    engine.reset();

    const gameMap = new GameMap(10, 10);
    for (let y = 0; y < 10; y++) {
      for (let x = 0; x < 10; x++) gameMap.setTerrain(x, y, 'floor');
    }
    engine.gameMap = gameMap;

    const player = EntityFactory.createPlayer(0, 0);
    const zombie = EntityFactory.createZombie(8, 8, 'standard', 'z1');
    gameMap.addEntity(player, 0, 0);
    gameMap.addEntity(zombie, 8, 8);

    const aiBehavior = zombie.getComponent('AIBehavior');
    expect(aiBehavior.alertnessState).toBe('IDLE');
  });

  it('transitions from IDLE to HUNTING when player is in Line of Sight', () => {
    gameRandom.seed(1);
    engine.reset();

    const gameMap = new GameMap(10, 10);
    for (let y = 0; y < 10; y++) {
      for (let x = 0; x < 10; x++) gameMap.setTerrain(x, y, 'floor');
    }
    engine.gameMap = gameMap;

    const player = EntityFactory.createPlayer(5, 5);
    const zombie = EntityFactory.createZombie(5, 7, 'standard', 'z1');
    gameMap.addEntity(player, 5, 5);
    gameMap.addEntity(zombie, 5, 7);

    // Populate vision component so player is in zombie's LOS
    const vision = zombie.getComponent('Vision');
    if (vision) {
      vision.visibleEntities = [player.id];
    }

    const intentQueue = new IntentQueue();
    const actionQueue = [];

    // Process AI decision cycle
    AISystem.process([player, zombie], null, engine, actionQueue, intentQueue);

    const aiBehavior = zombie.getComponent('AIBehavior');
    expect(aiBehavior.alertnessState).toBe('HUNTING');
    expect(aiBehavior.lastSeenPlayerCoords).toEqual({ x: 5, y: 5 });
  });

  it('transitions from HUNTING to INVESTIGATING when LOS is broken with valid LKP', () => {
    gameRandom.seed(1);
    engine.reset();

    const gameMap = new GameMap(10, 10);
    for (let y = 0; y < 10; y++) {
      for (let x = 0; x < 10; x++) gameMap.setTerrain(x, y, 'floor');
    }
    // Block LOS between zombie (5, 7) and player (5, 3) with a solid wall at (5, 5)
    gameMap.setTerrain(5, 5, 'brick');
    engine.gameMap = gameMap;

    const player = EntityFactory.createPlayer(5, 3);
    const zombie = EntityFactory.createZombie(5, 7, 'standard', 'z1');
    gameMap.addEntity(player, 5, 3);
    gameMap.addEntity(zombie, 5, 7);

    // Pre-populate AI with last seen player coords from previous turn
    const aiBehavior = zombie.getComponent('AIBehavior');
    aiBehavior.alertnessState = 'HUNTING';
    aiBehavior.lastSeenPlayerCoords = { x: 5, y: 4 };

    const intentQueue = new IntentQueue();
    const actionQueue = [];

    AISystem.process([player, zombie], null, engine, actionQueue, intentQueue);

    // LOS is blocked by wall, so zombie should transition to INVESTIGATING LKP (5, 4)
    expect(aiBehavior.alertnessState).toBe('INVESTIGATING');
  });

  it('clears memory and returns to IDLE when arriving at LKP with no target in sight', () => {
    gameRandom.seed(1);
    engine.reset();

    const gameMap = new GameMap(10, 10);
    for (let y = 0; y < 10; y++) {
      for (let x = 0; x < 10; x++) gameMap.setTerrain(x, y, 'floor');
    }
    // Wall blocking direct LOS to player at (0, 0)
    gameMap.setTerrain(2, 2, 'brick');
    engine.gameMap = gameMap;

    const player = EntityFactory.createPlayer(0, 0);
    // Zombie is sitting EXACTLY on the LKP tile (5, 5)
    const zombie = EntityFactory.createZombie(5, 5, 'standard', 'z1');
    gameMap.addEntity(player, 0, 0);
    gameMap.addEntity(zombie, 5, 5);

    const aiBehavior = zombie.getComponent('AIBehavior');
    aiBehavior.alertnessState = 'INVESTIGATING';
    aiBehavior.lastSeenPlayerCoords = { x: 5, y: 5 };

    const intentQueue = new IntentQueue();
    const actionQueue = [];

    AISystem.process([player, zombie], null, engine, actionQueue, intentQueue);

    // Arrived at LKP -> memory cleared -> alertnessState updated to IDLE
    expect(aiBehavior.lastSeenPlayerCoords).toBeNull();
    expect(aiBehavior.alertnessState).toBe('IDLE');
  });
});
