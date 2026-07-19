import { gameRandom } from '../utils/SeededRandom.js';

/**
 * FloorplanRegistry - authored residential floorplans with baked-in room roles
 * and furniture, for a standardized (non-procedural) interior look.
 *
 * A floorplan is authored in a CANONICAL orientation with the front door facing
 * SOUTH (bottom edge). At stamp time it is rotated to the building's frontage.
 *
 * Format:
 *   {
 *     id, width, height,
 *     grid: [ "112233", ... ],   // one char per interior tile = a ROOM INSTANCE
 *     legend: { '1':'living', '2':'kitchen', '3':'bedroom', '4':'bathroom', ... },
 *     doors: [ {x, y, edge} ],   // interior doorways (canonical coords)
 *     furniture: [ {type, x, y, rot} ], // canonical top-left + rotation
 *   }
 *
 * Walls are implied between adjacent cells whose room char differs (the building
 * perimeter is walled by drawBuilding). Distinct chars => distinct rooms, so two
 * bedrooms are two chars even though both map to the 'bedroom' role.
 */

const EDGE_CW = { n: 'e', e: 's', s: 'w', w: 'n' }; // edge under one 90° CW turn

/** Rotate a floorplan 90° clockwise. (x,y) -> (H-1-y, x); width/height swap. */
export function rotateFloorplanCW(plan) {
  const W = plan.width, H = plan.height;
  const grid = Array.from({ length: W }, () => new Array(H));
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      grid[x][H - 1 - y] = plan.grid[y][x];
    }
  }
  const doors = plan.doors.map(d => ({ x: H - 1 - d.y, y: d.x, edge: EDGE_CW[d.edge] }));
  const furniture = plan.furniture.map(f => {
    const base = FLOORPLAN_FOOTPRINTS[f.type] || { w: 1, h: 1 };
    const fw = (f.rot % 2) ? base.h : base.w;
    const fh = (f.rot % 2) ? base.w : base.h;
    // Occupied tiles span [f.x, f.x+fw) x [f.y, f.y+fh). Under CW each tile
    // (x,y) -> (H-1-y, x); the new top-left is the image of the old bottom-left.
    const nx = H - 1 - (f.y + fh - 1);
    const ny = f.x;
    return { type: f.type, x: nx, y: ny, rot: (f.rot + 1) % 4 };
  });
  return {
    id: plan.id,
    width: H,
    height: W,
    grid: grid.map(row => row.join('')),
    legend: plan.legend,
    doors,
    furniture,
  };
}

/** Rotate a floorplan by `turns` clockwise 90° steps (0-3). */
export function rotateFloorplan(plan, turns) {
  let p = plan;
  for (let i = 0; i < ((turns % 4) + 4) % 4; i++) p = rotateFloorplanCW(p);
  return p;
}

// Canonical front faces south; rotate CW this many times to face the frontage.
const FRONTAGE_TURNS = { south: 0, west: 1, north: 2, east: 3 };

/** Orient a canonical (front=south) plan to a building frontage. */
export function orientFloorplan(plan, frontage) {
  return rotateFloorplan(plan, FRONTAGE_TURNS[frontage] ?? 0);
}

// Footprints must match FurniturePlanner.FURNITURE_FOOTPRINTS / TileRenderer.
export const FLOORPLAN_FOOTPRINTS = {
  bed: { w: 2, h: 3 },
  table: { w: 2, h: 3 },
  couch: { w: 3, h: 1 },
  desk: { w: 2, h: 1 },
  counter: { w: 2, h: 1 },
  bathtub: { w: 1, h: 2 },
  toilet: { w: 1, h: 1 },
};

// --- Authored floorplans (canonical: front door faces SOUTH) --------------

const RANCH_2BED_1BATH = {
  id: 'ranch_2bed_1bath',
  width: 14,
  height: 14,
  //        0123456789012 3
  grid: [
    'AAAAAAWWWBBBBB', // y0  (north / back)
    'AAAAAAWWWBBBBB', // y1
    'AAAAAAWWWBBBBB', // y2
    'AAAAAAWWWBBBBB', // y3
    'AAAAAAWWWBBBBB', // y4
    'AAAAAAWWWBBBBB', // y5
    'AAAAAAWWWBBBBB', // y6
    'HHHHHHHHHHHHHH', // y7  (hall)
    'HHHHHHHHHHHHHH', // y8
    'LLLLLLLLKKKKKK', // y9
    'LLLLLLLLKKKKKK', // y10
    'LLLLLLLLKKKKKK', // y11
    'LLLLLLLLKKKKKK', // y12
    'LLLLLLLLKKKKKK', // y13 (south / front — entrance opens into L or K)
  ],
  legend: { A: 'bedroom', B: 'bedroom', W: 'bathroom', H: 'hall', L: 'living', K: 'kitchen' },
  doors: [
    { x: 2, y: 7, edge: 'n' },   // bedroom A  <-> hall
    { x: 11, y: 7, edge: 'n' },  // bedroom B  <-> hall
    { x: 7, y: 7, edge: 'n' },   // bathroom W <-> hall
    { x: 3, y: 9, edge: 'n' },   // living L   <-> hall
    { x: 10, y: 9, edge: 'n' },  // kitchen K  <-> hall
  ],
  furniture: [
    // bedroom A (x0..5, y0..6): bed in NW corner, head north
    { type: 'bed', x: 0, y: 0, rot: 0 },
    // bedroom B (x9..13, y0..6): bed in NE corner
    { type: 'bed', x: 12, y: 0, rot: 0 },
    // bathroom W (x6..8, y0..6): toilet NW corner, bathtub against east wall
    { type: 'toilet', x: 6, y: 0, rot: 0 },
    { type: 'bathtub', x: 8, y: 0, rot: 0 },
    // living L (x0..7, y9..13): couch backing the hall wall, table centred
    { type: 'couch', x: 1, y: 9, rot: 0 },
    { type: 'table', x: 3, y: 10, rot: 0 },
    // kitchen K (x8..13, y9..13): counter backing the hall wall
    { type: 'counter', x: 8, y: 9, rot: 0 },
  ],
};

const RANCH_1BED_OPEN = {
  id: 'ranch_1bed_open',
  width: 14,
  height: 14,
  grid: [
    'AAAAAAAWWWWBBB', // y0  A=bedroom, W=bathroom, B=hall-closet-ish -> make bedroom
    'AAAAAAAWWWWBBB',
    'AAAAAAAWWWWBBB',
    'AAAAAAAWWWWBBB',
    'AAAAAAAWWWWBBB',
    'AAAAAAAWWWWBBB',
    'HHHHHHHHHHHHHH', // y6 hall
    'HHHHHHHHHHHHHH', // y7
    'KKKKKLLLLLLLLL', // y8
    'KKKKKLLLLLLLLL', // y9
    'KKKKKLLLLLLLLL', // y10
    'KKKKKLLLLLLLLL', // y11
    'KKKKKLLLLLLLLL', // y12
    'KKKKKLLLLLLLLL', // y13
  ],
  legend: { A: 'bedroom', W: 'bathroom', B: 'bedroom', H: 'hall', K: 'kitchen', L: 'living' },
  doors: [
    { x: 3, y: 6, edge: 'n' },   // bedroom A <-> hall
    { x: 11, y: 6, edge: 'n' },  // bedroom B <-> hall
    { x: 8, y: 6, edge: 'n' },   // bathroom W <-> hall
    { x: 2, y: 8, edge: 'n' },   // kitchen K <-> hall
    { x: 9, y: 8, edge: 'n' },   // living L <-> hall
  ],
  furniture: [
    { type: 'bed', x: 0, y: 0, rot: 0 },       // bedroom A NW corner
    { type: 'bed', x: 11, y: 0, rot: 0 },      // bedroom B corner
    { type: 'toilet', x: 7, y: 0, rot: 0 },    // bathroom
    { type: 'bathtub', x: 9, y: 0, rot: 0 },
    { type: 'counter', x: 0, y: 8, rot: 0 },   // kitchen counter on hall wall
    { type: 'couch', x: 6, y: 8, rot: 0 },     // living couch on hall wall
    { type: 'table', x: 8, y: 10, rot: 0 },    // living table
  ],
};

const FLOORPLANS = [RANCH_2BED_1BATH, RANCH_1BED_OPEN];

// Index by "WxH" (canonical size) for snap-to-nearest lookup.
const BY_SIZE = new Map();
for (const p of FLOORPLANS) {
  const key = `${p.width}x${p.height}`;
  if (!BY_SIZE.has(key)) BY_SIZE.set(key, []);
  BY_SIZE.get(key).push(p);
}
// Distinct authored footprints, largest area first (for snap-down search).
const SIZES = [...new Set(FLOORPLANS.map(p => `${p.width}x${p.height}`))]
  .map(k => { const [w, h] = k.split('x').map(Number); return { w, h, key: k }; })
  .sort((a, b) => (b.w * b.h) - (a.w * a.h));

/**
 * Pick an authored floorplan that fits within a lot of (maxW x maxH), snapping
 * DOWN to the largest authored footprint that fits either as-authored or rotated
 * 90°. Returns { plan, needsSwap } or null when nothing fits. Seed-stable.
 * `needsSwap` is informational; orientation is applied later via frontage.
 */
export function pickFloorplan(maxW, maxH) {
  for (const s of SIZES) {
    const fitsDirect = s.w <= maxW && s.h <= maxH;
    const fitsRot = s.h <= maxW && s.w <= maxH;
    if (!fitsDirect && !fitsRot) continue;
    const options = BY_SIZE.get(s.key);
    const plan = options[gameRandom.nextInt(0, options.length - 1)];
    return { plan };
  }
  return null;
}

export { FLOORPLANS };
