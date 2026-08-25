import { describe, it, expect } from 'vitest';
// The editor's minimap used to fit every map inside a 120x120 box, which meant a
// 20x800 corridor (640 x 25600 map pixels) rendered as a 3-pixel-wide canvas —
// useless on exactly the map that most needs a navigation aid, since it is
// 25,600 pixels of featureless scrolling.
import {
  computeMinimapSize,
  MINIMAP_MAX_SHORT,
  MINIMAP_MAX_LONG,
  MINIMAP_MIN_SHORT
} from '../../client/src/game/editor/minimapLayout.js';

const CELL = 32;
const forMap = (w, h) => computeMinimapSize(w * CELL, h * CELL);

describe('computeMinimapSize', () => {
  it('gives a tall corridor a usable canvas instead of a hairline', () => {
    const { width, height, stretched } = forMap(20, 800);
    expect(width).toBeGreaterThanOrEqual(MINIMAP_MIN_SHORT);
    expect(height).toBe(MINIMAP_MAX_LONG);
    expect(stretched).toBe(true);

    // The old uniform-fit rule, for contrast.
    const legacy = Math.min(120 / (20 * CELL), 120 / (800 * CELL));
    expect(Math.round(20 * CELL * legacy)).toBeLessThan(MINIMAP_MIN_SHORT);
  });

  it('never exceeds either budget', () => {
    for (const [w, h] of [[20, 800], [20, 500], [45, 125], [220, 260], [300, 40], [1, 2000], [2000, 1]]) {
      const { width, height } = forMap(w, h);
      const long = Math.max(width, height);
      const short = Math.min(width, height);
      expect(long, `${w}x${h} long axis`).toBeLessThanOrEqual(MINIMAP_MAX_LONG);
      expect(short, `${w}x${h} short axis`).toBeLessThanOrEqual(MINIMAP_MAX_SHORT);
    }
  });

  it('leaves moderate aspect ratios undistorted', () => {
    // Campaign1's proportions: comfortably inside the budgets, so the canvas
    // should keep the map's true aspect ratio.
    const { width, height, stretched } = forMap(220, 260);
    expect(stretched).toBe(false);
    expect(width / height).toBeCloseTo(220 / 260, 2);
  });

  it('handles wide maps the same way it handles tall ones', () => {
    // A corridor laid on its side: same 1:40 ratio, mirrored result.
    const wide = forMap(800, 20);
    const tall = forMap(20, 800);
    expect(wide.width).toBe(tall.height);
    expect(wide.height).toBe(tall.width);
    expect(wide.stretched).toBe(true);
  });

  it('does not stretch a merely oblong map', () => {
    // 7.5:1 still leaves the short axis above the floor, so no distortion.
    const { width, height, stretched } = forMap(300, 40);
    expect(width).toBe(MINIMAP_MAX_LONG);
    expect(height).toBeGreaterThan(MINIMAP_MIN_SHORT);
    expect(stretched).toBe(false);
    expect(width / height).toBeCloseTo(300 / 40, 1);
  });

  it('returns a zero size for a degenerate map rather than NaN', () => {
    expect(computeMinimapSize(0, 0)).toEqual({ width: 0, height: 0, stretched: false });
    expect(computeMinimapSize(640, 0)).toEqual({ width: 0, height: 0, stretched: false });
  });
});
