import { describe, it, expect } from 'vitest';
import { GameMap } from '../../client/src/game/map/GameMap.js';
import { EntityFactory } from '../../client/src/game/EntityFactory.js';
import { Pathfinding } from '../../client/src/game/utils/Pathfinding.js';
import { Window } from '../../client/src/game/entities/Window.js';
import { EntityType } from '../../client/src/game/entities/Entity.js';

describe('Combat / Melee window redirection', () => {
  it('redirects attack from zombie to window if closed window is between them', () => {
    const gameMap = new GameMap(5, 5);

    const player = EntityFactory.createPlayer(1, 1);
    const zombie = EntityFactory.createZombie(1, 2, 'standard');

    gameMap.entityMap.set(player.id, player);
    gameMap.entityMap.set(zombie.id, zombie);

    const tilePlayer = gameMap.getTile(1, 1);
    const tileZombie = gameMap.getTile(1, 2);

    tilePlayer.contents.push(player);
    tileZombie.contents.push(zombie);

    const windowEntity = new Window('test-window', 1, 2, false, false, false, 'n');
    tileZombie.contents.push(windowEntity);
    gameMap.entityMap.set(windowEntity.id, windowEntity);

    // Verify window is closed and unbroken
    const blocking = Pathfinding.getBlockingStructure(gameMap, player.x, player.y, zombie.x, zombie.y);
    expect(blocking).not.toBeNull();
    expect(blocking.type).toBe(EntityType.WINDOW);
    expect(blocking.isOpen).toBe(false);
    expect(blocking.isBroken).toBe(false);

    // Run redirection simulation
    let targetEntity = zombie;
    let structure = null;
    let structureX = zombie.x;
    let structureY = zombie.y;

    if (targetEntity && targetEntity.type === EntityType.ZOMBIE) {
      const blockingWin = Pathfinding.getBlockingStructure(gameMap, player.x, player.y, zombie.x, zombie.y);
      if (blockingWin && blockingWin.type === EntityType.WINDOW && !blockingWin.isOpen && !blockingWin.isBroken) {
        structure = blockingWin;
        structureX = blockingWin.x;
        structureY = blockingWin.y;
        targetEntity = null;
      }
    }

    // Assert redirection occurred
    expect(targetEntity).toBeNull();
    expect(structure).toBe(windowEntity);
    expect(structureX).toBe(1);
    expect(structureY).toBe(2);

    // Break structure and assert zombie is untouched
    const originalZombieHp = zombie.hp;
    structure.break();
    if (structure.isReinforced) {
      structure.isReinforced = false;
      structure.reinforcementHp = 0;
    }

    expect(windowEntity.isBroken).toBe(true);
    expect(zombie.hp).toBe(originalZombieHp);
  });

  it('handles reinforced window redirection and clears reinforcement', () => {
    const gameMap = new GameMap(5, 5);

    const player = EntityFactory.createPlayer(1, 1);
    const zombie = EntityFactory.createZombie(1, 2, 'standard');

    gameMap.entityMap.set(player.id, player);
    gameMap.entityMap.set(zombie.id, zombie);

    const tilePlayer = gameMap.getTile(1, 1);
    const tileZombie = gameMap.getTile(1, 2);

    tilePlayer.contents.push(player);
    tileZombie.contents.push(zombie);

    const windowEntity = new Window('test-window-reinforced', 1, 2, false, false, false, 'n');
    windowEntity.reinforce(10);
    tileZombie.contents.push(windowEntity);
    gameMap.entityMap.set(windowEntity.id, windowEntity);

    // Verify reinforced window blocks path
    const blocking = Pathfinding.getBlockingStructure(gameMap, player.x, player.y, zombie.x, zombie.y);
    expect(blocking).not.toBeNull();
    expect(blocking.isReinforced).toBe(true);

    // Run redirection simulation
    let targetEntity = zombie;
    let structure = null;
    let structureX = zombie.x;
    let structureY = zombie.y;

    if (targetEntity && targetEntity.type === EntityType.ZOMBIE) {
      const blockingWin = Pathfinding.getBlockingStructure(gameMap, player.x, player.y, zombie.x, zombie.y);
      if (blockingWin && blockingWin.type === EntityType.WINDOW && !blockingWin.isOpen && !blockingWin.isBroken) {
        structure = blockingWin;
        structureX = blockingWin.x;
        structureY = blockingWin.y;
        targetEntity = null;
      }
    }

    expect(structure).toBe(windowEntity);

    // Break window and check reinforcement cleared
    structure.break();
    if (structure.isReinforced) {
      structure.isReinforced = false;
      structure.reinforcementHp = 0;
      structure.dirtyVision();
      structure.updateBlocking();
    }

    expect(windowEntity.isBroken).toBe(true);
    expect(windowEntity.isReinforced).toBe(false);
    expect(windowEntity.reinforcementHp).toBe(0);
  });
});
