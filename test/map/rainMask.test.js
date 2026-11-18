import { describe, it, expect } from 'vitest';
import { computeRainMask, getRainMask } from '../../client/src/game/renderer/RainMask.js';
import { isOpenToSky } from '../../client/src/game/map/TerrainTypes.js';

// Tiny map from rows of terrain codes:
//   g = grass, f = floor, w = wall
const CODES = { g: 'grass', f: 'floor', w: 'wall' };
function makeMap(rows) {
  return {
    getTile(x, y) {
      const row = rows[y];
      if (!row || x < 0 || x >= row.length) return null;
      return { terrain: CODES[row[x]] };
    }
  };
}
const allVisible = (rows) => {
  const set = new Set();
  rows.forEach((row, y) => [...row].forEach((_, x) => set.add(`${x},${y}`)));
  return set;
};
const boundsOf = (rows) => ({ startX: 0, endX: rows[0].length - 1, startY: 0, endY: rows.length - 1 });

// A house (walls + floor) with an open doorway in its west wall onto the yard.
const HOUSE = [
  'ggwwww',
  'ggffff',
  'ggwwww'
];

describe('isOpenToSky', () => {
  it('is false for interior floors and building structure, true for open ground', () => {
    for (const t of ['floor', 'garagefloor', 'tent_floor', 'wall', 'building', 'tent_wall', 'brick', 'metal_wall', 'window']) {
      expect(isOpenToSky(t), t).toBe(false);
    }
    for (const t of ['grass', 'road', 'sidewalk', 'water', 'deep_water', 'tree', 'fence']) {
      expect(isOpenToSky(t), t).toBe(true);
    }
  });
});

describe('computeRainMask', () => {
  it('inside: rain only on visible open-sky tiles, never on walls or floor', () => {
    const map = makeMap(HOUSE);
    const { mode, runs } = computeRainMask(map, boundsOf(HOUSE), allVisible(HOUSE), true);
    expect(mode).toBe('include');
    // The two grass columns of each row, merged into one run per row.
    expect(runs).toEqual([[0, 0, 2], [0, 1, 2], [0, 2, 2]]);
  });

  it('inside: open-sky tiles the player cannot see stay dry', () => {
    const map = makeMap(HOUSE);
    // Only the doorway view: the yard tile right outside it.
    const visible = new Set(['1,1', '2,1', '3,1']);
    const { runs } = computeRainMask(map, boundsOf(HOUSE), visible, true);
    expect(runs).toEqual([[1, 1, 1]]);
  });

  it('outside: excludes only the interior floor the player can see', () => {
    const map = makeMap(HOUSE);
    const visible = new Set(['0,1', '1,1', '2,1', '3,1']); // looking in through the doorway
    const { mode, runs } = computeRainMask(map, boundsOf(HOUSE), visible, false);
    expect(mode).toBe('exclude');
    expect(runs).toEqual([[2, 1, 2]]);
  });

  it('splits runs around tiles that are out of the mask', () => {
    const rows = ['gwgg'];
    const { runs } = computeRainMask(makeMap(rows), boundsOf(rows), allVisible(rows), true);
    expect(runs).toEqual([[0, 0, 1], [2, 0, 2]]);
  });
});

describe('getRainMask memo', () => {
  it('reuses the result until the FOV set or threshold changes', () => {
    const map = makeMap(HOUSE);
    const bounds = boundsOf(HOUSE);
    const visible = allVisible(HOUSE);
    const a = getRainMask(map, bounds, visible, true);
    expect(getRainMask(map, { ...bounds }, visible, true)).toBe(a);
    expect(getRainMask(map, bounds, visible, false)).not.toBe(a);
    expect(getRainMask(map, bounds, new Set(visible), true)).not.toBe(a);
  });
});
