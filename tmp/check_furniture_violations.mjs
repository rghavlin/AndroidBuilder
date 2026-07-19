import {
  orientFloorplan, FLOORPLAN_FOOTPRINTS, FLOORPLANS,
} from '../client/src/game/map/FloorplanRegistry.js';
import { makeLayoutGrid } from '../client/src/game/map/RoomGraph.js';

function buildPlanGrid(plan) {
  const W = plan.width, H = plan.height;
  const layout = Array.from({ length: H }, () =>
    Array.from({ length: W }, () => ({ terrain: 'floor', edgeWalls: { n: false, e: false, s: false, w: false } }))
  );
  for (let y = 0; y < H; y++) {
    layout[y][0].edgeWalls.w = true;
    layout[y][W - 1].edgeWalls.e = true;
  }
  for (let x = 0; x < W; x++) {
    layout[0][x].edgeWalls.n = true;
    layout[H - 1][x].edgeWalls.s = true;
  }
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
  const doors = [...plan.doors, plan.entrance, plan.back].filter(Boolean).map(d => ({ x: d.x, y: d.y, edge: d.edge }));
  return makeLayoutGrid(layout, doors);
}

const violations = [];
for (const frontage of ['south', 'west', 'north', 'east']) {
  for (const plan of FLOORPLANS) {
    const oriented = orientFloorplan(plan, frontage);
    const grid = buildPlanGrid(oriented);
    for (const f of oriented.furniture) {
      const base = FLOORPLAN_FOOTPRINTS[f.type];
      const fw = (f.rot % 2) ? base.h : base.w;
      const fh = (f.rot % 2) ? base.w : base.h;
      for (let y = f.y; y < f.y + fh; y++) {
        for (let x = f.x; x < f.x + fw; x++) {
          if (grid.terrainAt(x, y) !== 'floor') violations.push(`${oriented.id} ${frontage} ${f.type} non-floor tile (${x},${y})`);
          if (x + 1 < f.x + fw && (grid.edgeWallAt(x, y, 'e') || grid.edgeWallAt(x + 1, y, 'w'))) {
            violations.push(`${oriented.id} ${frontage} ${f.type} straddles E/W wall at (${x},${y})`);
          }
          if (y + 1 < f.y + fh && (grid.edgeWallAt(x, y, 's') || grid.edgeWallAt(x, y + 1, 'n'))) {
            violations.push(`${oriented.id} ${frontage} ${f.type} straddles N/S wall at (${x},${y})`);
          }
        }
      }
      // Check direct overlap with door tiles only (not adjacency). Authored
      // floorplans control both door and furniture placement, so they only need
      // to avoid occupying the same tile.
      for (let y = f.y; y < f.y + fh; y++) {
        for (let x = f.x; x < f.x + fw; x++) {
          if (grid.doorAt(x, y)) violations.push(`${oriented.id} ${frontage} ${f.type} overlaps door at (${x},${y})`);
        }
      }
    }
  }
}
for (const v of violations) console.log(v);
console.log(`\nTotal violations: ${violations.length}`);
