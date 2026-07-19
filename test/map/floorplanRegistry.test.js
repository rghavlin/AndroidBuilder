import { describe, it, expect } from 'vitest';
import {
  rotateFloorplanCW, rotateFloorplan, orientFloorplan,
  FLOORPLAN_FOOTPRINTS, FLOORPLANS, pickFloorplan,
} from '../../client/src/game/map/FloorplanRegistry.js';
import { gameRandom } from '../../client/src/game/utils/SeededRandom.js';
import { MapBuilder } from '../../client/src/game/map/MapBuilder.js';

// Occupied tiles of a furniture piece given a footprint table.
function occupiedTiles(piece) {
  const base = FLOORPLAN_FOOTPRINTS[piece.type];
  const w = (piece.rot % 2) ? base.h : base.w;
  const h = (piece.rot % 2) ? base.w : base.h;
  const tiles = new Set();
  for (let y = piece.y; y < piece.y + h; y++)
    for (let x = piece.x; x < piece.x + w; x++) tiles.add(`${x},${y}`);
  return tiles;
}

describe('FloorplanRegistry rotation', () => {
  const plan = {
    id: 'test', width: 3, height: 2,
    grid: ['ABC', 'DEF'],
    legend: {},
    doors: [{ x: 0, y: 0, edge: 'n' }],
    furniture: [{ type: 'bed', x: 0, y: 0, rot: 0 }], // 2x3 base, but plan only 3x2 — fine for math
  };

  it('rotates the grid 90° clockwise', () => {
    const r = rotateFloorplanCW(plan);
    expect(r.width).toBe(2);
    expect(r.height).toBe(3);
    // CW: top-left 'A' (0,0) -> (H-1-0, 0) = (1,0); bottom-left 'D' (0,1) -> (0,0)
    expect(r.grid).toEqual(['DA', 'EB', 'FC']);
  });

  it('rotates door tiles and edges consistently', () => {
    const r = rotateFloorplanCW(plan);
    // door tile (0,0) -> (H-1-0, 0) = (1,0); edge n -> e
    expect(r.doors[0]).toEqual({ x: 1, y: 0, edge: 'e' });
  });

  it('four CW turns is identity', () => {
    const r = rotateFloorplan(plan, 4);
    expect(r.grid).toEqual(plan.grid);
    expect(r.width).toBe(plan.width);
    expect(r.doors).toEqual(plan.doors);
  });

  it('preserves a furniture footprint tile-set through a full turn cycle', () => {
    const p = { ...plan, width: 6, height: 6, grid: Array(6).fill('AAAAAA') };
    const before = occupiedTiles(p.furniture[0]);
    let r = p;
    for (let i = 0; i < 4; i++) r = rotateFloorplanCW(r);
    expect(occupiedTiles(r.furniture[0])).toEqual(before);
  });

  it('keeps a rotated furniture piece within the rotated footprint bounds', () => {
    // Bed 2x3 at (1,1) in a 8x8 plan; after each CW turn it must stay in bounds.
    const p = { id: 't', width: 8, height: 8, grid: Array(8).fill('A'.repeat(8)),
                legend: {}, doors: [], furniture: [{ type: 'bed', x: 1, y: 1, rot: 0 }] };
    let r = p;
    for (let i = 0; i < 4; i++) {
      r = rotateFloorplanCW(r);
      for (const t of occupiedTiles(r.furniture[0])) {
        const [x, y] = t.split(',').map(Number);
        expect(x).toBeGreaterThanOrEqual(0);
        expect(y).toBeGreaterThanOrEqual(0);
        expect(x).toBeLessThan(r.width);
        expect(y).toBeLessThan(r.height);
      }
    }
  });
});

describe('FloorplanRegistry authored plans', () => {
  it('every authored plan is internally consistent', () => {
    for (const p of FLOORPLANS) {
      expect(p.grid.length).toBe(p.height);
      for (const row of p.grid) expect(row.length).toBe(p.width);
      // Every furniture piece fits inside the footprint
      for (const f of p.furniture) {
        const base = FLOORPLAN_FOOTPRINTS[f.type];
        expect(base, `footprint for ${f.type}`).toBeDefined();
        const w = (f.rot % 2) ? base.h : base.w;
        const h = (f.rot % 2) ? base.w : base.h;
        expect(f.x + w).toBeLessThanOrEqual(p.width);
        expect(f.y + h).toBeLessThanOrEqual(p.height);
      }
      // Every legend char used and every used char in legend
      const used = new Set(p.grid.join('').split(''));
      for (const c of used) expect(p.legend[c], `legend for '${c}'`).toBeDefined();
    }
  });

  it('orientFloorplan matches expected dims per frontage', () => {
    const p = FLOORPLANS[0];
    expect(orientFloorplan(p, 'south').width).toBe(p.width);
    expect(orientFloorplan(p, 'north').width).toBe(p.width);
    expect(orientFloorplan(p, 'east').width).toBe(p.height); // 90° swaps dims
    expect(orientFloorplan(p, 'west').width).toBe(p.height);
  });

  it('stamps a floorplan into a building: bathroom role, baked furniture, connectivity', () => {
    gameRandom.seed(99);
    const mb = new MapBuilder(40, 40);
    // A lot large enough for a 14x14 plan; south frontage keeps canonical orient.
    mb.drawBuilding(4, 4, 20, 18, 'south', 'residential');
    const b = mb.metadata.buildings.find(x => x.x === 4 && x.y === 4);
    expect(b).toBeDefined();
    // Adopted a floorplan (shrunk to the plan footprint).
    expect(b.furniturePlan).toBeDefined();
    expect(b.furniturePlan.length).toBeGreaterThan(0);
    expect(b.width).toBe(14);
    expect(b.height).toBe(14);

    // Roles include a dedicated bathroom, and it has a toilet + bathtub baked in.
    const roles = new Set((b.rooms || []).map(r => r.role));
    expect(roles.has('bathroom')).toBe(true);
    expect(roles.has('living')).toBe(true);
    const types = new Set(b.furniturePlan.map(p => p.type));
    expect(types.has('toilet')).toBe(true);
    expect(types.has('bathtub')).toBe(true);

    // Every room is reachable from the entrance through interior doors.
    const layout = mb.layout;
    const wallAt = (x, y, e) => (layout[y] && layout[y][x] ? !!layout[y][x].edgeWalls[e] : true);
    const doorSet = new Set(mb.metadata.doors.map(d => `${d.x},${d.y}`));
    const inB = (x, y) => x >= b.x && x < b.x + b.width && y >= b.y && y < b.y + b.height;
    const seen = new Set([`${b.entranceX},${b.entranceY}`]);
    const q = [{ x: b.entranceX, y: b.entranceY }];
    const dirs = [[0, -1, 'n', 's'], [1, 0, 'e', 'w'], [0, 1, 's', 'n'], [-1, 0, 'w', 'e']];
    while (q.length) {
      const c = q.pop();
      for (const [dx, dy, e, o] of dirs) {
        const nx = c.x + dx, ny = c.y + dy;
        if (!inB(nx, ny) || seen.has(`${nx},${ny}`)) continue;
        if (layout[ny][nx].terrain !== 'floor') continue;
        const walled = wallAt(c.x, c.y, e) || wallAt(nx, ny, o);
        const doored = doorSet.has(`${c.x},${c.y}`) || doorSet.has(`${nx},${ny}`);
        if (walled && !doored) continue;
        seen.add(`${nx},${ny}`);
        q.push({ x: nx, y: ny });
      }
    }
    // Each authored room's seed tile is reachable.
    for (const r of (b.rooms || [])) {
      expect(seen.has(`${r.seedX},${r.seedY}`), `room ${r.role} reachable`).toBe(true);
    }
  });

  it('pickFloorplan snaps down and is seed-stable', () => {
    gameRandom.seed(1);
    const a = pickFloorplan(20, 18);
    gameRandom.seed(1);
    const b = pickFloorplan(20, 18);
    expect(a).not.toBeNull();
    expect(a.plan.id).toBe(b.plan.id);
    // A lot smaller than any authored plan yields null.
    expect(pickFloorplan(5, 5)).toBeNull();
  });
});
