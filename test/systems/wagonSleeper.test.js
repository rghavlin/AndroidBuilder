import { describe, it, expect, beforeEach } from 'vitest';
import { GameHarness } from '../harness/GameHarness.js';
import { Item } from '../../client/src/game/inventory/Item.js';
import { createItemFromDef } from '../../client/src/game/inventory/ItemDefs.js';
import { VehicleUtils } from '../../client/src/game/utils/VehicleUtils.js';
import { SimulationManager } from '../../client/src/game/managers/SimulationManager.js';
import { AISystem } from '../../client/src/game/systems/AISystem.js';
import { EntityFactory } from '../../client/src/game/EntityFactory.js';
import engine from '../../client/src/game/GameEngine.js';

describe('Wagon Sleeper Upgrade & Sleep Mechanics', () => {
  let harness;

  beforeEach(() => {
    harness = new GameHarness({ seed: 42, width: 20, height: 20, terrain: 'floor' }).bootstrap();
    engine.isSleeping = false;
    engine.sleepProgress = 0;
    engine.sleepingInWagonInstanceId = null;
  });

  it('can attach a wagon sleeper to a wagon in the sleeper slot', () => {
    const wagon = new Item(createItemFromDef('vehicle.wagon'));
    const sleeper = new Item(createItemFromDef('wagon_sleeper'));
    
    // Check that sleeper slot is present
    const sleeperSlot = wagon.attachmentSlots.find(s => s.id === 'sleeper');
    expect(sleeperSlot).toBeDefined();
    expect(sleeperSlot.allowedItems).toContain('wagon_sleeper');

    // Attach sleeper
    const success = wagon.attachItem('sleeper', sleeper);
    expect(success).toBe(true);
    expect(wagon.attachments['sleeper']).toBe(sleeper);
  });

  it('checks if a zombie is in sight correctly', () => {
    // No zombies initially
    expect(VehicleUtils.isZombieInSightOfPlayer(engine)).toBe(false);

    // Set player position and FOV
    engine.player.x = 5;
    engine.player.y = 5;
    engine.playerFieldOfView = [{ x: 5, y: 5 }, { x: 5, y: 6 }, { x: 6, y: 5 }];

    // Spawn a zombie in sight
    const zombieInSight = EntityFactory.createZombie(5, 6);
    harness.gameMap.addEntity(zombieInSight, 5, 6);
    expect(VehicleUtils.isZombieInSightOfPlayer(engine)).toBe(true);

    // Remove zombie and spawn one out of sight
    harness.gameMap.removeEntity(zombieInSight.id);
    const zombieOutOfSight = EntityFactory.createZombie(10, 10);
    harness.gameMap.addEntity(zombieOutOfSight, 10, 10);
    expect(VehicleUtils.isZombieInSightOfPlayer(engine)).toBe(false);
  });

  it('makes player invisible to zombies while sleeping in a wagon', () => {
    const zombie = EntityFactory.createZombie(5, 6);
    harness.gameMap.addEntity(zombie, 5, 6);

    // Awake: player is visible
    engine.isSleeping = false;
    engine.sleepingInWagonInstanceId = null;
    
    // Check canSeeEntity
    expect(zombie.canSeeEntity(harness.gameMap, engine.player)).toBe(true);

    // Set sleeping in wagon
    engine.isSleeping = true;
    engine.sleepingInWagonInstanceId = 'test-wagon-id';

    // Simulate AI decision cycle (which invokes AISystem.process)
    const ecsEntities = new Map();
    ecsEntities.set(zombie.id, zombie);
    ecsEntities.set(engine.player.id, engine.player);
    
    // Give zombie AP so it decides to attack if it sees player
    zombie.ap = 2;
    zombie.currentAP = 2;

    const actionQueue = [];
    const intentsGenerated = AISystem.process(ecsEntities, engine.worldManager, engine, actionQueue);

    // Since player is sleeping in wagon, playerInLoS is false, and zombie doesn't hunt/attack the player
    const attackAction = actionQueue.find(a => a.type === 'ATTACK' && a.data.targetType === 'player');
    expect(attackAction).toBeFalsy();
  });
});
