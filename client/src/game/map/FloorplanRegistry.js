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
 *     legend: { '1':'living', '2':'kitchen', '3':'bedroom', '4':'bathroom', '5':'closet', ... },
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
  chair: { w: 1, h: 1 },
};

// --- Authored floorplans (canonical: front door faces SOUTH) --------------

const RANCH_2BED_1BATH = {
  id: 'ranch_2bed_1bath',
  width: 14,
  height: 14,
  // Closets (C, D) are clean 2x2 nooks carved INSIDE the bedrooms, so the
  // bedroom/bathroom walls stay straight and each closet door opens into its
  // own bedroom. The bathroom (W) reaches the hall for its (interior) door.
  //        01234567890123
  grid: [
    'AAAACCWWDDBBBB', // y0  (north / back)  C=closet in A, D=closet in B
    'AAAACCWWDDBBBB', // y1
    'AAAAAAWWBBBBBB', // y2
    'AAAAAAWWBBBBBB', // y3
    'AAAAAAWWBBBBBB', // y4
    'AAAAAAWWBBBBBB', // y5
    'AAAAAAWWBBBBBB', // y6  (W reaches the hall here)
    'HHHHHHHHHHHHHH', // y7  (hall)
    'HHHHHHHHHHHHHH', // y8
    'LLLLLLLLKKKKKK', // y9
    'LLLLLLLLKKKKKK', // y10
    'LLLLLLLLKKKKKK', // y11
    'LLLLLLLLKKKKKK', // y12
    'LLLLLLLLKKKKKK', // y13 (south / front — entrance opens into L or K)
  ],
  legend: { A: 'bedroom', B: 'bedroom', W: 'bathroom', C: 'closet', D: 'closet', H: 'hall', L: 'living', K: 'kitchen' },
  doors: [
    { x: 2, y: 7, edge: 'n' },   // bedroom A  <-> hall
    { x: 11, y: 7, edge: 'n' },  // bedroom B  <-> hall
    { x: 6, y: 7, edge: 'n' },   // bathroom W <-> hall
    { x: 4, y: 2, edge: 'n' },   // closet C   <-> bedroom A
    { x: 8, y: 2, edge: 'n' },   // closet D   <-> bedroom B
    { x: 3, y: 9, edge: 'n' },   // living L   <-> hall
    { x: 10, y: 9, edge: 'n' },  // kitchen K  <-> hall
  ],
  furniture: [
    // bedroom A (x0..5): bed on the north wall, east of its closet
    { type: 'bed', x: 0, y: 3, rot: 0 },
    // bedroom B (x8..13): bed in the NE, west of its closet
    { type: 'bed', x: 12, y: 3, rot: 0 },
    // bathroom W (x6..7, y0..6): toilet NW corner, bathtub down the east wall
    { type: 'toilet', x: 6, y: 0, rot: 0 },
    { type: 'bathtub', x: 7, y: 5, rot: 0 },
    // living L (x0..7, y9..13): couch backing the hall wall, chair on east wall
    { type: 'couch', x: 1, y: 9, rot: 0 },
    { type: 'chair', x: 7, y: 10, rot: 1 },
    // kitchen K (x8..13, y9..13): counter backing the hall wall, table centred
    { type: 'table', x: 10, y: 10, rot: 0 },
    { type: 'counter', x: 8, y: 9, rot: 0 },
  ],
};

const RANCH_1BED_OPEN = {
  id: 'ranch_1bed_open',
  width: 14,
  height: 14,
  // Closets (C, D) are clean 2x2 nooks in the NW/NE corners of the bedrooms,
  // doors opening into their bedrooms. Bathroom (W) reaches the hall.
  //        01234567890123
  grid: [
    'CCAAAAAWWWBBDD', // y0  C=closet in A, D=closet in B
    'CCAAAAAWWWBBDD', // y1
    'AAAAAAAWWWBBBB', // y2
    'AAAAAAAWWWBBBB', // y3
    'AAAAAAAWWWBBBB', // y4
    'AAAAAAAWWWBBBB', // y5
    'HHHHHHHHHHHHHH', // y6 hall
    'HHHHHHHHHHHHHH', // y7
    'KKKKKLLLLLLLLL', // y8
    'KKKKKLLLLLLLLL', // y9
    'KKKKKLLLLLLLLL', // y10
    'KKKKKLLLLLLLLL', // y11
    'KKKKKLLLLLLLLL', // y12
    'KKKKKLLLLLLLLL', // y13
  ],
  legend: { A: 'bedroom', W: 'bathroom', B: 'bedroom', C: 'closet', D: 'closet', H: 'hall', K: 'kitchen', L: 'living' },
  doors: [
    { x: 3, y: 6, edge: 'n' },   // bedroom A <-> hall
    { x: 11, y: 6, edge: 'n' },  // bedroom B <-> hall
    { x: 0, y: 2, edge: 'n' },   // closet C   <-> bedroom A
    { x: 13, y: 2, edge: 'n' },  // closet D   <-> bedroom B
    { x: 8, y: 6, edge: 'n' },   // bathroom W <-> hall
    { x: 2, y: 8, edge: 'n' },   // kitchen K <-> hall
    { x: 9, y: 8, edge: 'n' },   // living L <-> hall
  ],
  furniture: [
    { type: 'bed', x: 5, y: 0, rot: 0 },       // bedroom A, north wall east of closet
    { type: 'bed', x: 10, y: 0, rot: 0 },      // bedroom B, north wall west of closet
    { type: 'toilet', x: 7, y: 0, rot: 0 },    // bathroom
    { type: 'bathtub', x: 9, y: 4, rot: 0 },
    { type: 'counter', x: 0, y: 8, rot: 0 },   // kitchen counter on hall wall
    { type: 'couch', x: 6, y: 8, rot: 0 },     // living couch on hall wall
    { type: 'table', x: 8, y: 10, rot: 0 },    // living table
  ],
};

/**
 * Validate an authored floorplan's topology. Catches the classes of authoring
 * mistakes that produce broken houses at runtime:
 *  - a room with no way in (e.g. a sealed bathroom),
 *  - a door placed somewhere that isn't a wall between two rooms,
 *  - a room char that isn't one contiguous region.
 * Reachability is measured from the FRONT (south-edge) rooms, which is where the
 * building entrance opens. Returns { ok, errors }.
 */
export function validateFloorplan(plan) {
  const errors = [];
  const { width: W, height: H, grid, legend } = plan;
  const at = (x, y) => (x >= 0 && x < W && y >= 0 && y < H ? grid[y][x] : null);

  if (grid.length !== H) errors.push(`grid has ${grid.length} rows, expected ${H}`);
  for (const row of grid) if (row.length !== W) errors.push(`row "${row}" width ${row.length}, expected ${W}`);

  // Contiguity: each distinct char must be a single connected region.
  const seen = new Set();
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const c = at(x, y);
      const key = `${x},${y}`;
      if (seen.has(key)) continue;
      // flood this char
      const q = [{ x, y }]; seen.add(key);
      while (q.length) {
        const cur = q.pop();
        for (const [dx, dy] of [[0, -1], [1, 0], [0, 1], [-1, 0]]) {
          const nx = cur.x + dx, ny = cur.y + dy, nk = `${nx},${ny}`;
          if (at(nx, ny) === c && !seen.has(nk)) { seen.add(nk); q.push({ x: nx, y: ny }); }
        }
      }
    }
  }
  const charCells = new Map();
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const c = at(x, y);
    if (!legend[c]) errors.push(`char '${c}' at (${x},${y}) missing from legend`);
    if (!charCells.has(c)) charCells.set(c, []);
    charCells.get(c).push({ x, y });
  }
  // A char is non-contiguous if a fresh flood from its first cell misses any cell.
  for (const [c, cells] of charCells) {
    const start = cells[0];
    const reach = new Set([`${start.x},${start.y}`]);
    const q = [start];
    while (q.length) {
      const cur = q.pop();
      for (const [dx, dy] of [[0, -1], [1, 0], [0, 1], [-1, 0]]) {
        const nx = cur.x + dx, ny = cur.y + dy, nk = `${nx},${ny}`;
        if (at(nx, ny) === c && !reach.has(nk)) { reach.add(nk); q.push({ x: nx, y: ny }); }
      }
    }
    if (reach.size !== cells.length) errors.push(`room '${c}' (${legend[c]}) is not one contiguous region`);
  }

  // Room adjacency graph from interior doors.
  const neighborOf = (d) => {
    if (d.edge === 'n') return { x: d.x, y: d.y - 1 };
    if (d.edge === 's') return { x: d.x, y: d.y + 1 };
    if (d.edge === 'e') return { x: d.x + 1, y: d.y };
    return { x: d.x - 1, y: d.y };
  };
  const adj = new Map(); // char -> Set(char)
  const link = (a, b) => {
    if (!adj.has(a)) adj.set(a, new Set());
    if (!adj.has(b)) adj.set(b, new Set());
    adj.get(a).add(b); adj.get(b).add(a);
  };
  for (const d of plan.doors) {
    const a = at(d.x, d.y);
    const n = neighborOf(d);
    const b = at(n.x, n.y);
    if (a === null || b === null) { errors.push(`door ${JSON.stringify(d)} points off-grid`); continue; }
    if (a === b) { errors.push(`door ${JSON.stringify(d)} is inside room '${a}', not on a wall`); continue; }
    link(a, b);
  }

  // Reachability from front (south-edge) rooms.
  const frontChars = new Set();
  for (let x = 0; x < W; x++) frontChars.add(at(x, H - 1));
  const reached = new Set(frontChars);
  const stack = [...frontChars];
  while (stack.length) {
    const c = stack.pop();
    for (const nb of (adj.get(c) || [])) if (!reached.has(nb)) { reached.add(nb); stack.push(nb); }
  }
  for (const c of charCells.keys()) {
    if (!reached.has(c)) errors.push(`room '${c}' (${legend[c]}) is unreachable from the entrance`);
  }

  return { ok: errors.length === 0, errors };
}

// Compact 1-bedroom for the many small (12x12+) lots. Closet nook in the
// bedroom, bathroom reaches the hall.
const COTTAGE_1BED = {
  id: 'cottage_1bed',
  width: 12,
  height: 12,
  //        012345678901
  grid: [
    'CCAAAAAAAWWW', // y0  C=closet in A, W=bathroom
    'CCAAAAAAAWWW', // y1
    'AAAAAAAAAWWW', // y2
    'AAAAAAAAAWWW', // y3
    'AAAAAAAAAWWW', // y4
    'HHHHHHHHHHHH', // y5  hall
    'HHHHHHHHHHHH', // y6
    'LLLLLLLKKKKK', // y7  L=living, K=kitchen
    'LLLLLLLKKKKK', // y8
    'LLLLLLLKKKKK', // y9
    'LLLLLLLKKKKK', // y10
    'LLLLLLLKKKKK', // y11 (front — entrance opens into L or K)
  ],
  legend: { A: 'bedroom', C: 'closet', W: 'bathroom', H: 'hall', L: 'living', K: 'kitchen' },
  doors: [
    { x: 4, y: 5, edge: 'n' },   // bedroom A <-> hall
    { x: 10, y: 5, edge: 'n' },  // bathroom W <-> hall
    { x: 0, y: 2, edge: 'n' },   // closet C <-> bedroom A
    { x: 3, y: 7, edge: 'n' },   // living L <-> hall
    { x: 9, y: 7, edge: 'n' },   // kitchen K <-> hall
  ],
  furniture: [
    { type: 'bed', x: 7, y: 0, rot: 0 },     // bedroom A, north wall by the bath
    { type: 'toilet', x: 9, y: 0, rot: 0 },  // bathroom
    { type: 'bathtub', x: 11, y: 3, rot: 0 },
    { type: 'couch', x: 1, y: 7, rot: 0 },   // living couch on hall wall
    { type: 'counter', x: 7, y: 7, rot: 0 }, // kitchen counter on hall wall
    { type: 'table', x: 8, y: 9, rot: 0 },   // kitchen table
  ],
};

// Second 12x12 variant for variety: full-width living room at the front, with
// the kitchen, bathroom and bedroom (+ closet nook) ranged across the back.
const COTTAGE_OPEN_LIVING = {
  id: 'cottage_open_living',
  width: 12,
  height: 12,
  //        012345678901
  grid: [
    'KKKKKWWWAAAA', // y0  K=kitchen, W=bathroom, A=bedroom
    'KKKKKWWWAAAA', // y1
    'KKKKKWWWAAAA', // y2
    'KKKKKWWWCCAA', // y3  C=closet nook in bedroom A
    'KKKKKWWWCCAA', // y4
    'HHHHHHHHHHHH', // y5  hall
    'HHHHHHHHHHHH', // y6
    'LLLLLLLLLLLL', // y7  living (full width, front)
    'LLLLLLLLLLLL', // y8
    'LLLLLLLLLLLL', // y9
    'LLLLLLLLLLLL', // y10
    'LLLLLLLLLLLL', // y11 (front — entrance opens into L)
  ],
  legend: { K: 'kitchen', W: 'bathroom', A: 'bedroom', C: 'closet', H: 'hall', L: 'living' },
  doors: [
    { x: 2, y: 5, edge: 'n' },   // kitchen K <-> hall
    { x: 6, y: 5, edge: 'n' },   // bathroom W <-> hall
    { x: 10, y: 5, edge: 'n' },  // bedroom A <-> hall
    { x: 8, y: 3, edge: 'n' },   // closet C <-> bedroom A
    { x: 6, y: 7, edge: 'n' },   // living L <-> hall
  ],
  furniture: [
    { type: 'counter', x: 0, y: 0, rot: 0 },  // kitchen counter on north wall
    { type: 'table', x: 2, y: 2, rot: 0 },    // kitchen table
    { type: 'toilet', x: 5, y: 0, rot: 0 },   // bathroom
    { type: 'bathtub', x: 7, y: 0, rot: 0 },
    { type: 'bed', x: 10, y: 0, rot: 0 },     // bedroom A, north wall
    { type: 'couch', x: 1, y: 7, rot: 0 },    // living couch on hall wall
    { type: 'table', x: 5, y: 9, rot: 0 },    // living table
    { type: 'chair', x: 9, y: 7, rot: 0 },    // living chair
  ],
};

// Wide 2-bed bungalow for the wide-but-short lots (width 16-22, height 12-13).
// Two bedrooms with closet nooks flank a central bathroom; living + kitchen
// span the front.
const BUNGALOW_2BED_WIDE = {
  id: 'bungalow_2bed_wide',
  width: 18,
  height: 12,
  //        012345678901234567
  grid: [
    'CCAAAAAWWWBBBBBBDD', // y0  C/D=closets, A/B=bedrooms, W=bathroom
    'CCAAAAAWWWBBBBBBDD', // y1
    'AAAAAAAWWWBBBBBBBB', // y2
    'AAAAAAAWWWBBBBBBBB', // y3
    'AAAAAAAWWWBBBBBBBB', // y4
    'HHHHHHHHHHHHHHHHHH', // y5  hall
    'HHHHHHHHHHHHHHHHHH', // y6
    'LLLLLLLLLLKKKKKKKK', // y7  L=living, K=kitchen
    'LLLLLLLLLLKKKKKKKK', // y8
    'LLLLLLLLLLKKKKKKKK', // y9
    'LLLLLLLLLLKKKKKKKK', // y10
    'LLLLLLLLLLKKKKKKKK', // y11 (front — entrance opens into L or K)
  ],
  legend: { A: 'bedroom', B: 'bedroom', W: 'bathroom', C: 'closet', D: 'closet', H: 'hall', L: 'living', K: 'kitchen' },
  doors: [
    { x: 3, y: 5, edge: 'n' },   // bedroom A <-> hall
    { x: 13, y: 5, edge: 'n' },  // bedroom B <-> hall
    { x: 8, y: 5, edge: 'n' },   // bathroom W <-> hall
    { x: 0, y: 2, edge: 'n' },   // closet C <-> bedroom A
    { x: 17, y: 2, edge: 'n' },  // closet D <-> bedroom B
    { x: 4, y: 7, edge: 'n' },   // living L <-> hall
    { x: 13, y: 7, edge: 'n' },  // kitchen K <-> hall
  ],
  furniture: [
    { type: 'bed', x: 5, y: 0, rot: 0 },      // bedroom A, north wall by the bath
    { type: 'bed', x: 10, y: 0, rot: 0 },     // bedroom B, north wall by the bath
    { type: 'toilet', x: 7, y: 0, rot: 0 },   // bathroom
    { type: 'bathtub', x: 9, y: 3, rot: 0 },
    { type: 'couch', x: 1, y: 7, rot: 0 },    // living couch on hall wall
    { type: 'table', x: 5, y: 9, rot: 0 },    // living table
    { type: 'chair', x: 8, y: 7, rot: 0 },    // living chair
    { type: 'counter', x: 10, y: 7, rot: 0 }, // kitchen counter on hall wall
    { type: 'table', x: 13, y: 9, rot: 0 },   // kitchen table
  ],
};

// Wide 3-bed bungalow for the widest lots (width 20-22, height 12-13). Uses the
// extra width for a third bedroom; central bathroom, living + kitchen up front.
const BUNGALOW_3BED_WIDE = {
  id: 'bungalow_3bed_wide',
  width: 20,
  height: 12,
  //        01234567890123456789
  grid: [
    'CCAAAAWWWBBBBBEEEEDD', // y0  C/D=closets, A/B/E=bedrooms, W=bathroom
    'CCAAAAWWWBBBBBEEEEDD', // y1
    'AAAAAAWWWBBBBBEEEEEE', // y2
    'AAAAAAWWWBBBBBEEEEEE', // y3
    'AAAAAAWWWBBBBBEEEEEE', // y4
    'HHHHHHHHHHHHHHHHHHHH', // y5  hall
    'HHHHHHHHHHHHHHHHHHHH', // y6
    'LLLLLLLLLLLLKKKKKKKK', // y7  L=living, K=kitchen
    'LLLLLLLLLLLLKKKKKKKK', // y8
    'LLLLLLLLLLLLKKKKKKKK', // y9
    'LLLLLLLLLLLLKKKKKKKK', // y10
    'LLLLLLLLLLLLKKKKKKKK', // y11 (front — entrance opens into L or K)
  ],
  legend: { A: 'bedroom', B: 'bedroom', E: 'bedroom', W: 'bathroom', C: 'closet', D: 'closet', H: 'hall', L: 'living', K: 'kitchen' },
  doors: [
    { x: 3, y: 5, edge: 'n' },   // bedroom A <-> hall
    { x: 11, y: 5, edge: 'n' },  // bedroom B (middle) <-> hall
    { x: 16, y: 5, edge: 'n' },  // bedroom E <-> hall
    { x: 7, y: 5, edge: 'n' },   // bathroom W <-> hall
    { x: 0, y: 2, edge: 'n' },   // closet C <-> bedroom A
    { x: 19, y: 2, edge: 'n' },  // closet D <-> bedroom E
    { x: 5, y: 7, edge: 'n' },   // living L <-> hall
    { x: 15, y: 7, edge: 'n' },  // kitchen K <-> hall
  ],
  furniture: [
    { type: 'bed', x: 4, y: 0, rot: 0 },      // bedroom A
    { type: 'bed', x: 9, y: 0, rot: 0 },      // bedroom B (middle)
    { type: 'bed', x: 14, y: 0, rot: 0 },     // bedroom E
    { type: 'toilet', x: 6, y: 0, rot: 0 },   // bathroom
    { type: 'bathtub', x: 8, y: 3, rot: 0 },
    { type: 'couch', x: 1, y: 7, rot: 0 },    // living couch on hall wall
    { type: 'table', x: 5, y: 9, rot: 0 },    // living table
    { type: 'chair', x: 9, y: 7, rot: 0 },    // living chair
    { type: 'counter', x: 12, y: 7, rot: 0 }, // kitchen counter on hall wall
    { type: 'table', x: 15, y: 9, rot: 0 },   // kitchen table
  ],
};

// Taller 2-bed for the ~18% of lots that are 15-16 high. Same clean back-half
// pattern as RANCH_2BED_1BATH, stretched vertically.
const RANCH_2BED_1BATH_TALL = {
  id: 'ranch_2bed_1bath_tall',
  width: 14,
  height: 16,
  //        01234567890123
  grid: [
    'AAAACCWWDDBBBB', // y0
    'AAAACCWWDDBBBB', // y1
    'AAAAAAWWBBBBBB', // y2
    'AAAAAAWWBBBBBB', // y3
    'AAAAAAWWBBBBBB', // y4
    'AAAAAAWWBBBBBB', // y5
    'AAAAAAWWBBBBBB', // y6
    'AAAAAAWWBBBBBB', // y7
    'HHHHHHHHHHHHHH', // y8  hall
    'HHHHHHHHHHHHHH', // y9
    'LLLLLLLLKKKKKK', // y10
    'LLLLLLLLKKKKKK', // y11
    'LLLLLLLLKKKKKK', // y12
    'LLLLLLLLKKKKKK', // y13
    'LLLLLLLLKKKKKK', // y14
    'LLLLLLLLKKKKKK', // y15
  ],
  legend: { A: 'bedroom', B: 'bedroom', W: 'bathroom', C: 'closet', D: 'closet', H: 'hall', L: 'living', K: 'kitchen' },
  doors: [
    { x: 2, y: 8, edge: 'n' },   // bedroom A <-> hall
    { x: 11, y: 8, edge: 'n' },  // bedroom B <-> hall
    { x: 6, y: 8, edge: 'n' },   // bathroom W <-> hall
    { x: 4, y: 2, edge: 'n' },   // closet C <-> bedroom A
    { x: 8, y: 2, edge: 'n' },   // closet D <-> bedroom B
    { x: 3, y: 10, edge: 'n' },  // living L <-> hall
    { x: 10, y: 10, edge: 'n' }, // kitchen K <-> hall
  ],
  furniture: [
    { type: 'bed', x: 0, y: 3, rot: 0 },
    { type: 'bed', x: 12, y: 3, rot: 0 },
    { type: 'toilet', x: 6, y: 0, rot: 0 },
    { type: 'bathtub', x: 7, y: 6, rot: 0 },
    { type: 'couch', x: 1, y: 10, rot: 0 },
    { type: 'chair', x: 7, y: 11, rot: 1 },
    { type: 'table', x: 10, y: 11, rot: 0 },
    { type: 'counter', x: 8, y: 10, rot: 0 },
  ],
};

const FLOORPLANS = [RANCH_2BED_1BATH, RANCH_1BED_OPEN, COTTAGE_1BED, COTTAGE_OPEN_LIVING, RANCH_2BED_1BATH_TALL, BUNGALOW_2BED_WIDE, BUNGALOW_3BED_WIDE];

// Fail fast in dev if a floorplan is authored broken (sealed room, etc.).
for (const p of FLOORPLANS) {
  const v = validateFloorplan(p);
  if (!v.ok) console.error(`[FloorplanRegistry] INVALID floorplan '${p.id}':\n  - ${v.errors.join('\n  - ')}`);
}

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
 * Pick an authored floorplan that fits a lot of (maxW x maxH) once oriented to
 * `frontage`. The plan is rotated by frontage at stamp time (even turns keep the
 * canonical dims, odd turns swap them), so the fit test must use those ORIENTED
 * dims — otherwise a portrait plan could be stamped landscape and overflow the
 * lot. Snaps DOWN to the largest-area authored plan that fits. Seed-stable.
 * Returns { plan } or null when nothing fits.
 */
export function pickFloorplan(maxW, maxH, frontage = 'south') {
  const swap = ((FRONTAGE_TURNS[frontage] ?? 0) % 2) === 1;
  for (const s of SIZES) {
    const ow = swap ? s.h : s.w;
    const oh = swap ? s.w : s.h;
    if (ow > maxW || oh > maxH) continue;
    const options = BY_SIZE.get(s.key);
    const plan = options[gameRandom.nextInt(0, options.length - 1)];
    return { plan };
  }
  return null;
}

export { FLOORPLANS };
