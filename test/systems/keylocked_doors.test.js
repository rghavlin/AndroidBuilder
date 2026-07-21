import { describe, it, expect } from 'vitest';
import { Door } from '../../client/src/game/entities/Door.js';
import { GarageDoor } from '../../client/src/game/entities/GarageDoor.js';
import { GameMap } from '../../client/src/game/map/GameMap.js';
import eventRunner from '../../client/src/game/quest/EventRunner.js';
import engine from '../../client/src/game/GameEngine.js';

describe('Systems / Keylocked Doors', () => {
  it('prevents normal open and unlock on keylocked doors', () => {
    const door = new Door('test-door', 1, 1, false, false, false, 'n', true);
    
    // Keylocked door should report isKeylocked and isLocked (implied)
    expect(door.isKeylocked).toBe(true);
    expect(door.isLocked).toBe(true);
    
    // Attempt normal open
    let openEventCalled = false;
    let failReason = null;
    door.on('doorInteractionFailed', (data) => {
      openEventCalled = true;
      failReason = data.reason;
    });
    
    const openResult = door.open();
    expect(openResult).toBe(false);
    expect(openEventCalled).toBe(true);
    expect(failReason).toBe('keylocked');
    
    // Attempt normal unlock
    const unlockResult = door.unlock();
    expect(unlockResult).toBe(false);
    expect(door.isKeylocked).toBe(true);
    expect(door.isLocked).toBe(true);
  });

  it('prevents damage and breakage on keylocked doors', () => {
    const door = new Door('test-door', 1, 1, false, false, false, 'n', true);
    const initialHp = door.hp;
    
    const damageResult = door.takeDamage(10);
    expect(damageResult.isBroken).toBe(false);
    expect(door.hp).toBe(initialHp);
    
    const bigDamageResult = door.takeDamage(100);
    expect(bigDamageResult.isBroken).toBe(false);
    expect(door.isDamaged).toBe(false);
  });

  it('allows forceUnlock to clear keylock and locked states', () => {
    const door = new Door('test-door', 1, 1, false, false, false, 'n', true);
    
    let unlockedEventCalled = false;
    door.on('doorUnlocked', () => {
      unlockedEventCalled = true;
    });
    
    const forceResult = door.forceUnlock();
    expect(forceResult).toBe(true);
    expect(door.isKeylocked).toBe(false);
    expect(door.isLocked).toBe(false);
    expect(unlockedEventCalled).toBe(true);
  });

  it('propagates forceUnlock through garage door groups', () => {
    // Set up mock map for garage door peer lookup
    const map = new GameMap(5, 5);
    engine.gameMap = map;
    
    const gd1 = new GarageDoor('gd-1', 1, 1, false, false, false, 'n', 'group-A', true);
    const gd2 = new GarageDoor('gd-2', 2, 1, false, false, false, 'n', 'group-A', true);
    
    map.addEntity(gd1, 1, 1);
    map.addEntity(gd2, 2, 1);
    
    expect(gd1.isKeylocked).toBe(true);
    expect(gd2.isKeylocked).toBe(true);
    
    // Force unlock first door, should unlock the second
    gd1.forceUnlock();
    
    expect(gd1.isKeylocked).toBe(false);
    expect(gd2.isKeylocked).toBe(false);
    
    // Clean up
    engine.gameMap = null;
  });

  it('unlocks keylocked doors via EventRunner controlEntity steps', () => {
    const map = new GameMap(5, 5);
    engine.gameMap = map;
    
    // Register door manually in registry
    map.metadata = {
      entityRegistry: {
        entries: [
          { tag: 'restricted-gate', type: 'door', x: 1, y: 1, description: 'Locked gate' }
        ]
      }
    };
    
    const door = new Door('gate-1', 1, 1, false, false, false, 'n', true);
    map.addEntity(door, 1, 1);
    
    expect(door.isKeylocked).toBe(true);
    
    // Create controlEntity step to unlock the door
    const event = {
      id: 'unlock-event',
      steps: [
        { type: 'controlEntity', entityTag: 'restricted-gate', entityAction: 'unlock' }
      ]
    };
    
    eventRunner.reset();
    eventRunner.runEvent(event);
    
    expect(door.isKeylocked).toBe(false);
    expect(door.isLocked).toBe(false);
    
    // Clean up
    engine.gameMap = null;
  });
});
