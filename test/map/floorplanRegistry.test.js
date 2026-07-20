import { describe, it, expect } from 'vitest';
import {
  rotateFloorplanCW, rotateFloorplan, orientFloorplan,
  FLOORPLAN_FOOTPRINTS, FLOORPLANS, pickFloorplan, validateFloorplan,
} from '../../client/src/game/map/FloorplanRegistry.js';
import { gameRandom } from '../../client/src/game/utils/SeededRandom.js';
import { MapBuilder } from '../../client/src/game/map/MapBuilder.js';
import { makeLayoutGrid } from '../../client/src/game/map/RoomGraph.js';

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

// Build a MapBuilder-style grid adapter from an authored floorplan so we can
// verify that each furniture piece is on a floor tile and does not straddle an
// interior wall or sit on/adjacent to a door tile.
function buildPlanGrid(plan) {
  const W = plan.width, H = plan.height;
  const layout = Array.from({ length: H }, () =>
    Array.from({ length: W }, () => ({ terrain: 'floor', edgeWalls: { n: false, e: false, s: false, w: false } }))
  );
  // Perimeter walls
  for (let y = 0; y < H; y++) {
    layout[y][0].edgeWalls.w = true;
    layout[y][W - 1].edgeWalls.e = true;
  }
  for (let x = 0; x < W; x++) {
    layout[0][x].edgeWalls.n = true;
    layout[H - 1][x].edgeWalls.s = true;
  }
  // Interior partitions between differing room chars
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const c = plan.grid[y][x];
      if (x + 1 < W && plan.grid[y][x + 1] !== c) {
        layout[y][x].edgeWalls.e = true;
        layout[y][x + 1].edgeWalls.w = true;
      }
      if (y + 1 < H && plan.grid[y + 1][x] !== c) {
        layout[y][x].edgeWalls.s = true;
        layout[y + 1][x].edgeWalls.n = true;
      }
    }
  }
  // Include the exterior entrance/back doors too — furniture must clear those
  // as well, not just interior doorways.
  const doors = plan.doors.map(d => ({ x: d.x, y: d.y, edge: d.edge }));
  if (plan.entrance) doors.push({ x: plan.entrance.x, y: plan.entrance.y, edge: plan.entrance.edge });
  if (plan.back) doors.push({ x: plan.back.x, y: plan.back.y, edge: plan.back.edge });
  return makeLayoutGrid(layout, doors);
}

function assertFurnitureClear(plan, grid) {
  for (const f of plan.furniture) {
    const base = FLOORPLAN_FOOTPRINTS[f.type];
    expect(base, `${plan.id} ${f.type} footprint`).toBeDefined();
    const fw = (f.rot % 2) ? base.h : base.w;
    const fh = (f.rot % 2) ? base.w : base.h;
    expect(f.x + fw).toBeLessThanOrEqual(plan.width);
    expect(f.y + fh).toBeLessThanOrEqual(plan.height);

    for (let y = f.y; y < f.y + fh; y++) {
      for (let x = f.x; x < f.x + fw; x++) {
        expect(grid.terrainAt(x, y), `${plan.id} ${f.type} tile (${x},${y}) must be floor`).toBe('floor');
        expect(grid.doorAt(x, y), `${plan.id} ${f.type} overlaps a door tile at (${x},${y})`).toBe(false);
        if (x + 1 < f.x + fw) {
          expect(grid.edgeWallAt(x, y, 'e') || grid.edgeWallAt(x + 1, y, 'w'),
            `${plan.id} ${f.type} straddles an E/W wall`).toBe(false);
        }
        if (y + 1 < f.y + fh) {
          expect(grid.edgeWallAt(x, y, 's') || grid.edgeWallAt(x, y + 1, 'n'),
            `${plan.id} ${f.type} straddles an N/S wall`).toBe(false);
        }
      }
    }
  }
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

  it('every authored floorplan is topologically valid (no sealed rooms)', () => {
    for (const p of FLOORPLANS) {
      const v = validateFloorplan(p);
      expect(v.ok, `${p.id}: ${v.errors.join('; ')}`).toBe(true);
    }
  });

  it('closet doors open into a bedroom, never into a bathroom', () => {
    for (const p of FLOORPLANS) {
      const at = (x, y) => (p.grid[y] ? p.grid[y][x] : null);
      const nbr = (d) => d.edge === 'n' ? { x: d.x, y: d.y - 1 }
        : d.edge === 's' ? { x: d.x, y: d.y + 1 }
        : d.edge === 'e' ? { x: d.x + 1, y: d.y } : { x: d.x - 1, y: d.y };
      for (const d of p.doors) {
        const a = p.legend[at(d.x, d.y)];
        const n = nbr(d);
        const b = p.legend[at(n.x, n.y)];
        const roles = [a, b];
        if (roles.includes('closet')) {
          expect(roles, `${p.id} closet door ${JSON.stringify(d)}`).toContain('bedroom');
          expect(roles).not.toContain('bathroom');
        }
      }
    }
  });

  it('every authored hall is at least 2 tiles wide', () => {
    for (const p of FLOORPLANS) {
      const at = (x, y) => (x >= 0 && x < p.width && y >= 0 && y < p.height ? p.grid[y][x] : null);
      for (const [c, role] of Object.entries(p.legend)) {
        if (role !== 'hall') continue;
        for (let y = 0; y < p.height; y++) {
          for (let x = 0; x < p.width; x++) {
            if (at(x, y) !== c) continue;
            const in2x2 = [[0, 0], [-1, 0], [0, -1], [-1, -1]].some(([ox, oy]) =>
              at(x + ox, y + oy) === c && at(x + ox + 1, y + oy) === c &&
              at(x + ox, y + oy + 1) === c && at(x + ox + 1, y + oy + 1) === c);
            expect(in2x2, `${p.id}: hall '${c}' is 1 tile wide at (${x},${y})`).toBe(true);
          }
        }
      }
    }
  });

  it('validateFloorplan flags a 1-tile-wide hall', () => {
    const narrow = {
      id: 'narrow', width: 6, height: 6,
      grid: ['AAAAAA', 'AAAAAA', 'HHHHHH', 'LLLLLL', 'LLLLLL', 'LLLLLL'],
      legend: { A: 'bedroom', H: 'hall', L: 'living' },
      doors: [{ x: 2, y: 2, edge: 'n' }, { x: 2, y: 3, edge: 'n' }],
      entrance: { x: 2, y: 5, edge: 's' }, back: { x: 2, y: 0, edge: 'n' },
      furniture: [],
    };
    const v = validateFloorplan(narrow);
    expect(v.ok).toBe(false);
    expect(v.errors.some(e => /narrower than 2/.test(e))).toBe(true);
  });

  it('validateFloorplan flags a sealed room', () => {
    const sealed = {
      id: 'sealed', width: 4, height: 4,
      grid: ['LLLL', 'LWWL', 'LWWL', 'LLLL'], // W bathroom fully enclosed, no door
      legend: { L: 'living', W: 'bathroom' },
      doors: [],
      furniture: [],
    };
    const v = validateFloorplan(sealed);
    expect(v.ok).toBe(false);
    expect(v.errors.some(e => /unreachable/.test(e))).toBe(true);
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
    // Adopted a floorplan (shrunk to some authored plan footprint that fits).
    expect(b.furniturePlan).toBeDefined();
    expect(b.furniturePlan.length).toBeGreaterThan(0);
    const sizeKey = `${b.width}x${b.height}`;
    const authoredSizes = new Set(FLOORPLANS.flatMap(p => [`${p.width}x${p.height}`, `${p.height}x${p.width}`]));
    expect(authoredSizes.has(sizeKey), `stamped size ${sizeKey} matches an authored plan`).toBe(true);
    expect(b.width).toBeLessThanOrEqual(20);
    expect(b.height).toBeLessThanOrEqual(18);

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

    // No exterior door (entrance/back) opens into a bathroom.
    const bathroomTiles = new Set();
    for (const r of (b.rooms || [])) {
      if (r.role !== 'bathroom') continue;
      for (let yy = r.minY; yy <= r.maxY; yy++)
        for (let xx = r.minX; xx <= r.maxX; xx++) bathroomTiles.add(`${xx},${yy}`);
    }
    for (const key of [`${b.entranceX},${b.entranceY}`, `${b.backX},${b.backY}`]) {
      expect(bathroomTiles.has(key), `exterior door at ${key} in a bathroom`).toBe(false);
    }

    // Interior doorways must not leave a wall on the NEIGHBOUR side, or the map
    // renders a wall remnant in the opening once the door opens. (The door's own
    // edge stays set — the door entity suppresses it — so rooms still separate.)
    const OPP = { n: 's', s: 'n', e: 'w', w: 'e' };
    const NB = { n: [0, -1], s: [0, 1], e: [1, 0], w: [-1, 0] };
    const ext = new Set([`${b.entranceX},${b.entranceY}`, `${b.backX},${b.backY}`]);
    const interiorDoors = mb.metadata.doors.filter(d =>
      d.x > b.x && d.x < b.x + b.width - 1 && d.y > b.y && d.y < b.y + b.height - 1 &&
      !ext.has(`${d.x},${d.y}`));
    expect(interiorDoors.length).toBeGreaterThan(0);
    for (const d of interiorDoors) {
      const [ndx, ndy] = NB[d.edge];
      expect(wallAt(d.x + ndx, d.y + ndy, OPP[d.edge]),
        `neighbour wall cleared at door ${JSON.stringify(d)}`).toBe(false);
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

  it('every authored plan furniture is clear of walls and doors in all orientations', () => {
    for (const frontage of ['south', 'west', 'north', 'east']) {
      for (const plan of FLOORPLANS) {
        const oriented = orientFloorplan(plan, frontage);
        const grid = buildPlanGrid(oriented);
        assertFurnitureClear(oriented, grid);
      }
    }
  });
});
