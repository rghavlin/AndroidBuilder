import { describe, it, expect, vi } from 'vitest';
// Wave 2 P0 (R8#3): GameMap.addEntity used to detect a duplicate entity ID,
// log a five-line alarm, and then overwrite entityMap anyway — leaving the
// PREVIOUS instance ghosted on its tile and in the type index while entityMap
// pointed at the new one. The fix evicts the old instance (tile + type index +
// gameMap) before inserting the new one.
import { GameMap } from '../../client/src/game/map/GameMap.js';
import { EntityFactory } from '../../client/src/game/EntityFactory.js';

describe('Wave 2 P0 · addEntity duplicate ID is evict-then-add (R8#3)', () => {
  it('evicts the old instance from tile, type index, and gameMap', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const gm = new GameMap(10, 10);

    const first = EntityFactory.createZombie(1, 1, 'basic', 'dup-1');
    expect(gm.addEntity(first, 1, 1)).toBe(true);

    const second = EntityFactory.createZombie(3, 3, 'basic', 'dup-1');
    gm.addEntity(second, 3, 3);
    warnSpy.mockRestore();

    // entityMap points at the new instance only.
    expect(gm.getEntity('dup-1')).toBe(second);

    // Old instance fully detached: not on its tile, not in the type index,
    // gameMap nulled — no ghost.
    const oldTile = gm.getTile(1, 1);
    expect(oldTile.contents).not.toContain(first);
    expect(first.gameMap).toBe(null);

    const zombies = gm.getEntitiesByType('zombie');
    expect(zombies).toContain(second);
    expect(zombies).not.toContain(first);
    // Exactly one zombie with this id remains on the map.
    expect(zombies.filter(z => z.id === 'dup-1').length).toBe(1);

    // New instance is correctly placed on its own tile.
    expect(gm.getTile(3, 3).contents).toContain(second);
  });

  it('re-adding the same instance moves it without ghosting', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const gm = new GameMap(10, 10);
    const z = EntityFactory.createZombie(2, 2, 'basic', 'same-1');
    expect(gm.addEntity(z, 2, 2)).toBe(true);

    // Add the very same instance again at a new tile.
    gm.addEntity(z, 5, 5);
    warnSpy.mockRestore();

    expect(gm.getEntity('same-1')).toBe(z);
    expect(gm.getTile(2, 2).contents).not.toContain(z);
    expect(gm.getTile(5, 5).contents).toContain(z);
    expect(gm.getEntitiesByType('zombie').filter(e => e.id === 'same-1').length).toBe(1);
  });
});
