import { describe, it, expect } from 'vitest';
// T4 regression tests: getReachableTiles must return CHEAPEST costs under
// variable move costs (it used to be a FIFO BFS where first-pop won regardless
// of cost, R7#7), and isSameBuildingShell must still behave after the
// shift() -> index-pointer conversion.
import { GameMap } from '../../client/src/game/map/GameMap.js';
import { Pathfinding } from '../../client/src/game/utils/Pathfinding.js';
import { Door } from '../../client/src/game/entities/Door.js';

function floorMap(w, h) {
  const map = new GameMap(w, h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) map.setTerrain(x, y, 'floor');
  }
  return map;
}

describe('Wave 2 P1 · findPath optimality after decrease-key fix (R7#1)', () => {
  // The A* open set had a broken decrease-key: a cheaper g for an already-open
  // node was written in place without re-heapifying, so pop() could return a
  // stale higher-f node and — with the closed set blocking re-expansion —
  // settle a suboptimal path. Lazy deletion (push superseding node + skip
  // stale pops) fixes it; these pin that findPath returns optimal paths.
  const pathCost = (map, path) => Pathfinding.calculateMovementCost(map, path);

  it('takes the diagonal shortcut rather than a cardinal detour', () => {
    const map = floorMap(4, 4);
    const path = Pathfinding.findPath(map, 0, 0, 3, 3, { allowDiagonal: true });
    expect(path.length).toBe(4);            // start + 3 diagonal steps
    expect(path[path.length - 1]).toEqual({ x: 3, y: 3 });
    // 3 diagonals (3 * 1.4 = 4.2) must beat any mixed route.
    expect(pathCost(map, path)).toBeLessThanOrEqual(4.2 + 1e-6);
  });

  it('finds the minimal-length detour around a wall', () => {
    // Vertical wall across the middle with a single gap at the bottom row.
    const map = floorMap(5, 5);
    for (let y = 0; y < 4; y++) map.setTerrain(2, y, 'wall');
    const path = Pathfinding.findPath(map, 0, 2, 4, 2, { allowDiagonal: true });
    expect(path.length).toBeGreaterThan(1);           // a path exists
    expect(path[0]).toEqual({ x: 0, y: 2 });
    expect(path[path.length - 1]).toEqual({ x: 4, y: 2 });
    // Must route through the gap column at row 4.
    expect(path.some(p => p.x === 2 && p.y === 4)).toBe(true);
  });

  it('returns [] when the target is fully walled off', () => {
    const map = floorMap(5, 5);
    for (let y = 0; y < 5; y++) map.setTerrain(2, y, 'wall');
    const path = Pathfinding.findPath(map, 0, 2, 4, 2, { allowDiagonal: false });
    expect(path).toEqual([]);
  });
});

describe('T4 getReachableTiles cheapest-cost correctness', () => {
  it('prices diagonal moves at 1.4 and cardinal chains exactly', () => {
    const map = floorMap(4, 4);
    const reachable = Pathfinding.getReachableTiles(map, 0, 0, 2.0, { allowDiagonal: true });
    const byKey = new Map(reachable.map(t => [`${t.x},${t.y}`, t.cost]));

    expect(byKey.get('1,0')).toBeCloseTo(1.0, 5);   // one cardinal step
    expect(byKey.get('1,1')).toBeCloseTo(1.4, 5);   // one diagonal step
    expect(byKey.get('2,0')).toBeCloseTo(2.0, 5);   // two cardinal steps
    expect(byKey.has('2,1')).toBe(false);           // 1.4 + 1.0 = 2.4 > budget
    expect(byKey.has('0,0')).toBe(false);           // origin is not "reachable"
  });

  it('returns the cheapest cost when a longer-step route is cheaper', () => {
    // (2,2) from (0,0): two diagonals = 2.8 beats four cardinals = 4.0.
    // The old FIFO BFS could record whichever route popped first.
    const map = floorMap(3, 3);
    const reachable = Pathfinding.getReachableTiles(map, 0, 0, 4.0, { allowDiagonal: true });
    const byKey = new Map(reachable.map(t => [`${t.x},${t.y}`, t.cost]));

    expect(byKey.get('2,2')).toBeCloseTo(2.8, 5);
    expect(byKey.get('2,1')).toBeCloseTo(2.4, 5);   // diagonal + cardinal
    expect(reachable.length).toBe(8);               // whole 3x3 minus origin
  });

  it('respects walls and never exceeds the budget', () => {
    const map = floorMap(5, 3);
    map.setTerrain(2, 0, 'wall');
    map.setTerrain(2, 1, 'wall');
    map.setTerrain(2, 2, 'wall');

    const reachable = Pathfinding.getReachableTiles(map, 0, 1, 3.0, { allowDiagonal: false });
    for (const t of reachable) {
      expect(t.cost).toBeLessThanOrEqual(3.0);
      expect(t.x).toBeLessThan(2); // wall column is uncrossable
    }
  });
});

describe('T4 isSameBuildingShell (BFS index-pointer conversion)', () => {
  it('two tiles in the same open room share a shell', () => {
    const map = floorMap(7, 3);
    expect(GameMap.isSameBuildingShell(map, { x: 1, y: 1 }, { x: 5, y: 1 })).toBe(true);
  });

  it('an outdoor start is never in a shell', () => {
    const map = new GameMap(5, 5); // all grass
    expect(GameMap.isSameBuildingShell(map, { x: 1, y: 1 }, { x: 3, y: 3 })).toBe(false);
  });

  it('a wall-split map separates the shells', () => {
    const map = floorMap(7, 3);
    for (let y = 0; y < 3; y++) map.setTerrain(3, y, 'wall');
    expect(GameMap.isSameBuildingShell(map, { x: 1, y: 1 }, { x: 5, y: 1 })).toBe(false);
  });

  it('two closed doors between the tiles breaks the shell link', () => {
    // Single-tile-wide corridor so the only path runs through both doors.
    const map = floorMap(7, 1);
    const door1 = new Door('d1', 2, 0, false, false, false, undefined); // closed
    const door2 = new Door('d2', 4, 0, false, false, false, undefined); // closed
    map.addEntity(door1, 2, 0);
    map.addEntity(door2, 4, 0);

    expect(GameMap.isSameBuildingShell(map, { x: 1, y: 0 }, { x: 5, y: 0 })).toBe(false);

    // Opening one door leaves exactly one closed door -> still same shell.
    door1.open();
    expect(GameMap.isSameBuildingShell(map, { x: 1, y: 0 }, { x: 5, y: 0 })).toBe(true);
  });
});
