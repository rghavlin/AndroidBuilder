import { describe, it, expect } from 'vitest';
// "Generate" in the map editor swaps in a new procedural layout. With "keep
// events" on, the authored tile layer (spawn, NPCs, triggers, stairs, authored
// exit arrows, event items) must survive at the same coordinates so the scenario's events
// still line up — while the old layout's ordinary loot and place icons (shop
// signs belong to the generated buildings) and its road-chain exits are discarded.
import { carryOverAuthoredTiles } from '../../client/src/components/MapEditor/carryOverAuthoredTiles.ts';

const tile = (extra = {}) => ({ terrain: 'grass', entities: [], items: [], ...extra });
const grid = (w, h, at = {}) =>
  Array.from({ length: h }, (_, y) => Array.from({ length: w }, (_, x) => tile(at[`${x},${y}`])));

describe('carryOverAuthoredTiles', () => {
  it('carries entities, triggers, authored exits/stairs and event items at their coordinates', () => {
    const old = grid(3, 3, {
      '1,1': { entities: [{ type: 'player' }], items: [{ defId: 'food.can' }, { defId: 'key', eventId: 'gate' }] },
      '2,0': { eventTrigger: { id: 'intro' }, placeIcon: 'shop' },
      '0,2': { items: [{ defId: 'placeable.exit', transitionTargetType: 'scenario', transitionTargetId: 'Tutorial' }] },
      '2,2': { items: [{ defId: 'placeable.stairs_down', transitionTargetId: 'Basement' }] },
    });
    const fresh = grid(3, 3, { '1,1': { terrain: 'road', items: [{ defId: 'gen.crop' }] } });

    const { tiles, carried, dropped } = carryOverAuthoredTiles(old, fresh);

    expect(tiles[1][1].terrain).toBe('road');
    expect(tiles[1][1].entities).toEqual([{ type: 'player' }]);
    expect(tiles[1][1].items.map(i => i.defId)).toEqual(['gen.crop', 'key']);
    expect(tiles[0][2].eventTrigger).toEqual({ id: 'intro' });
    expect(tiles[2][0].items[0].transitionTargetId).toBe('Tutorial');
    expect(tiles[2][2].items[0].defId).toBe('placeable.stairs_down');
    expect(carried).toBe(5);
    expect(dropped).toBe(0);
    expect(fresh[1][1].entities).toEqual([]); // input not mutated
  });

  it('does not stack the old layout\'s shop signs onto the new one', () => {
    // Each generated layout brings its own grocer sign; carrying the previous
    // one added a stray sign in front of a house on every Generate.
    const old = grid(3, 3, { '0,0': { placeIcon: 'grocer' } });
    const fresh = grid(3, 3, { '2,2': { placeIcon: 'grocer' } });
    const { tiles, carried } = carryOverAuthoredTiles(old, fresh);
    expect(tiles.flat().filter(t => t.placeIcon).length).toBe(1);
    expect(tiles[2][2].placeIcon).toBe('grocer');
    expect(carried).toBe(0);
  });

  it("leaves the old layout's next/previous exits behind; the new layout has its own", () => {
    const exit = (type) => ({ items: [{ defId: 'placeable.exit', transitionTargetType: type }] });
    const old = grid(3, 3, { '0,0': exit('next'), '0,2': exit('previous') });
    const fresh = grid(3, 3, { '2,0': exit('next'), '2,2': exit('previous') });
    const { tiles, carried } = carryOverAuthoredTiles(old, fresh);
    expect(tiles.flat().filter(t => t.items.length).length).toBe(2);
    expect(carried).toBe(0);
  });

  it('counts authored content that falls outside a smaller generated map', () => {
    const old = grid(4, 4, { '3,3': { entities: [{ type: 'npc' }] }, '0,0': { entities: [{ type: 'player' }] } });
    const { tiles, carried, dropped } = carryOverAuthoredTiles(old, grid(2, 2));
    expect(tiles[0][0].entities).toEqual([{ type: 'player' }]);
    expect(carried).toBe(1);
    expect(dropped).toBe(1);
  });
});
