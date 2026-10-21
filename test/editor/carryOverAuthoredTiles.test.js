import { describe, it, expect } from 'vitest';
// "Generate" in the map editor swaps in a new procedural layout. With "keep
// events" on, the authored tile layer (spawn, NPCs, triggers, transitions,
// event items) must survive at the same coordinates so the scenario's events
// still line up — while the old layout's ordinary loot is discarded.
import { carryOverAuthoredTiles } from '../../client/src/components/MapEditor/carryOverAuthoredTiles.ts';

const tile = (extra = {}) => ({ terrain: 'grass', entities: [], items: [], ...extra });
const grid = (w, h, at = {}) =>
  Array.from({ length: h }, (_, y) => Array.from({ length: w }, (_, x) => tile(at[`${x},${y}`])));

describe('carryOverAuthoredTiles', () => {
  it('carries entities, triggers, transitions, icons and event items at their coordinates', () => {
    const old = grid(3, 3, {
      '1,1': { entities: [{ type: 'player' }], items: [{ defId: 'food.can' }, { defId: 'key', eventId: 'gate' }] },
      '2,0': { eventTrigger: { id: 'intro' }, placeIcon: 'shop' },
      '0,2': { mapTransition: { targetType: 'scenario', targetId: 'Tutorial' } },
    });
    const fresh = grid(3, 3, { '1,1': { terrain: 'road', items: [{ defId: 'gen.crop' }] } });

    const { tiles, carried, dropped } = carryOverAuthoredTiles(old, fresh);

    expect(tiles[1][1].terrain).toBe('road');
    expect(tiles[1][1].entities).toEqual([{ type: 'player' }]);
    expect(tiles[1][1].items.map(i => i.defId)).toEqual(['gen.crop', 'key']);
    expect(tiles[0][2].eventTrigger).toEqual({ id: 'intro' });
    expect(tiles[0][2].placeIcon).toBe('shop');
    expect(tiles[2][0].mapTransition.targetId).toBe('Tutorial');
    expect(carried).toBe(5);
    expect(dropped).toBe(0);
    expect(fresh[1][1].entities).toEqual([]); // input not mutated
  });

  it('counts authored content that falls outside a smaller generated map', () => {
    const old = grid(4, 4, { '3,3': { entities: [{ type: 'npc' }] }, '0,0': { entities: [{ type: 'player' }] } });
    const { tiles, carried, dropped } = carryOverAuthoredTiles(old, grid(2, 2));
    expect(tiles[0][0].entities).toEqual([{ type: 'player' }]);
    expect(carried).toBe(1);
    expect(dropped).toBe(1);
  });
});
