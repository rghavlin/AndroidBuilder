import { describe, it, expect } from 'vitest';
// Ported from verify_phase_3.mjs — Burnable components and FireSystem behavior.
import { EntityFactory } from '../../client/src/game/EntityFactory.js';
import { Rabbit } from '../../client/src/game/entities/Rabbit.js';
import { FireSystem } from '../../client/src/game/systems/FireSystem.js';
import { GameMap } from '../../client/src/game/map/GameMap.js';

const assert = (condition, message) => expect(condition, message).toBeTruthy();

describe('Systems / FireSystem + Burnable', () => {
  it('gives entities Burnable components (with firefighter resistance)', () => {
    assert(EntityFactory.createPlayer(0, 0).getComponent('Burnable') !== undefined, 'player Burnable');
    const zombie = EntityFactory.createZombie(0, 0, 'firefighter');
    assert(zombie.getComponent('Burnable').fireResistance === 2, 'firefighter fire resistance');
    assert(new Rabbit('r1', 0, 0).getComponent('Burnable') !== undefined, 'rabbit Burnable');
  });

  it('ignites tiles and entities', () => {
    const mockTile = { x: 0, y: 0, fireTurns: 0 };
    FireSystem.ignite(mockTile, 3);
    assert(mockTile.fireTurns === 3, 'ignites tiles');

    const player = EntityFactory.createPlayer(0, 0);
    FireSystem.ignite(player, 2);
    assert(player.fireTurns === 2, 'ignites entities via Burnable facade');
  });

  it('processEntityFires decrements fireTurns and applies damage', () => {
    const player = EntityFactory.createPlayer(0, 0);
    FireSystem.ignite(player, 2);
    const initialHp = player.hp;
    const map = new GameMap(10, 10);
    map.entityMap.set(player.id, player);
    FireSystem.processEntityFires(map);
    assert(player.fireTurns === 1, 'decrements fireTurns');
    assert(player.hp < initialHp, 'applies fire damage');
  });

  it('checkTileIgnition sets entities alight on fire tiles and deals immediate damage', () => {
    const mockTile = { x: 0, y: 0, fireTurns: 2 };
    const map = new GameMap(1, 1);
    map.tiles = [mockTile];
    map.width = 1;
    map.height = 1;
    map.getTile = () => mockTile;

    const npc = EntityFactory.createNPC(0, 0);
    npc.fireTurns = 0;
    const npcInitialHp = npc.hp;
    FireSystem.checkTileIgnition(npc, map);
    assert(npc.fireTurns === 2, 'ignites on stepping onto fire tile');
    assert(npc.hp < npcInitialHp, 'deals immediate damage');
  });
});
