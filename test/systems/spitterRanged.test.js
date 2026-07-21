import { describe, it, expect } from 'vitest';
import { GameMap } from '../../client/src/game/map/GameMap.js';
import { EntityFactory } from '../../client/src/game/EntityFactory.js';
import { AISystem } from '../../client/src/game/systems/AISystem.js';

// A spitter's ranged attack must be tagged weaponType: 'ranged' so playback
// gives it a recoil instead of the melee lunge (which slid the zombie 35% of
// the way to the player — a multi-tile thrust for a ranged spit).

describe('Spitter ranged attack', () => {
  it('tags the spit ATTACK as ranged', () => {
    const gameMap = new GameMap(12, 12);
    for (let y = 0; y < 12; y++) {
      for (let x = 0; x < 12; x++) gameMap.getTile(x, y).terrain = 'grass';
    }

    const player = EntityFactory.createPlayer(5, 5);
    const spitter = EntityFactory.createZombie(5, 9, 'spitter');
    gameMap.addEntity(player, 5, 5);
    gameMap.addEntity(spitter, 5, 9);

    // Pretend VisionSystem already ran: the spitter has eyes on the player.
    spitter.getComponent('Vision').visibleEntities = [player.id];
    spitter.setTargetSighted(player.logicalX, player.logicalY);

    const actionQueue = [];
    AISystem.process([player, spitter], null, { gameMap }, actionQueue, null, {});

    const spit = actionQueue.find(a => a.type === 'ATTACK');
    expect(spit).toBeDefined();
    expect(spit.data.weaponType).toBe('ranged');
    // Still a genuine ranged attack: fired from four tiles away with a projectile.
    expect(spit.metadata.projectile).toBeDefined();
    expect(spitter.getDistanceTo(player.logicalX, player.logicalY)).toBeGreaterThan(1);
  });
});
