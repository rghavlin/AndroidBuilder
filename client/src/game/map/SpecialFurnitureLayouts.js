import { orientFloorplan, FLOORPLAN_FOOTPRINTS } from './FloorplanRegistry.js';

/**
 * SpecialFurnitureLayouts - decorative furniture outlines for special buildings
 * (stores and the police station). Same model as residential floorplans: pieces
 * are authored in a canonical frame with the entrance on the SOUTH wall, then
 * rotated to the building's frontage with orientFloorplan.
 *
 * Layouts are generated from the building's actual footprint rather than fixed
 * coordinates, because a special can be clamped below its SPECIAL_BUILDING_SPECS
 * size when its lot is too small (Map 1's grocer is 14x14, not 16x14).
 *
 * Deterministic, no gameRandom: calling this never shifts the map seed.
 *
 * Door safety: drawSpecialBuilding centres the entrance at floor(len/2) along
 * the frontage, but rotating a canonical south door by 180°/270° lands it at
 * len-1-floor(len/2), one tile off for even lengths. Layouts therefore keep the
 * two middle columns (floor(W/2)-1 and floor(W/2)) clear in the front rows, so
 * whichever tile the door ends up on, it opens into an aisle.
 */

/** Rows reserved in front of the shelving, between the aisles and the entrance wall. */
const FRONT_CLEAR_ROWS = 2;

const SHELF_LEN = FLOORPLAN_FOOTPRINTS.shelf.w;

/**
 * Shelving for a store, in the canonical frame (W x H, entrance south).
 *   - wall shelves along the back wall (backs north) and both side walls
 *     (backs against the wall), leaving a 1-tile aisle in front of the back row
 *   - back-to-back gondola pairs running front-to-back, mirrored about the
 *     centre, each with a 2-tile aisle beside it
 *   - a centre gondola when the gap left between the innermost pairs is wide
 *     enough to keep 2-tile aisles either side of it (the grocer's middle, the
 *     gas-station minimart that's too narrow for side pairs)
 */
function storeLayout(W, H) {
  const pieces = [];
  const centreL = Math.floor(W / 2) - 1;

  const pairXs = [];
  for (let gx = 3; gx + 1 < centreL; gx += 4) pairXs.push(gx);
  // Free columns between the innermost pairs (or the side-wall shelves).
  const innerRight = pairXs.length ? pairXs[pairXs.length - 1] + 1 : 0;
  const centreGondola = W - 2 * (innerRight + 1) >= 6;

  // Rows the vertical runs (side walls + gondolas) may occupy: below the back
  // shelf + its aisle, above the front clearance.
  const runTop = 2;
  const runCount = Math.floor((H - runTop - FRONT_CLEAR_ROWS) / SHELF_LEN);
  const runYs = Array.from({ length: runCount }, (_, i) => runTop + i * SHELF_LEN);

  // Back wall, centred. rot 0 = back (head) to the north wall.
  const backCount = Math.floor((W - 2) / SHELF_LEN);
  const backStart = Math.floor((W - backCount * SHELF_LEN) / 2);
  for (let i = 0; i < backCount; i++) {
    pieces.push({ type: 'shelf', x: backStart + i * SHELF_LEN, y: 0, rot: 0 });
  }

  for (const y of runYs) {
    // Side walls: rot 3 puts the back west, rot 1 puts it east.
    pieces.push({ type: 'shelf', x: 0, y, rot: 3 });
    pieces.push({ type: 'shelf', x: W - 1, y, rot: 1 });

    // Gondola pairs. Within a pair the left shelf backs east (rot 1) onto the
    // right one, which backs west (rot 3).
    for (const gx of pairXs) {
      const mx = W - 2 - gx;
      pieces.push({ type: 'shelf', x: gx, y, rot: 1 });
      pieces.push({ type: 'shelf', x: gx + 1, y, rot: 3 });
      pieces.push({ type: 'shelf', x: mx, y, rot: 1 });
      pieces.push({ type: 'shelf', x: mx + 1, y, rot: 3 });
    }

    if (centreGondola) {
      pieces.push({ type: 'shelf', x: centreL, y, rot: 1 });
      pieces.push({ type: 'shelf', x: centreL + 1, y, rot: 3 });
    }
  }

  return pieces;
}

/**
 * Police station: a front lobby with waiting benches either side of the
 * entrance and a reception desk facing the door, and a bullpen of desks behind.
 */
function policeLayout(W, H) {
  const pieces = [];
  const deskW = FLOORPLAN_FOOTPRINTS.desk.w;
  const benchW = FLOORPLAN_FOOTPRINTS.bench.w;
  const centreL = Math.floor(W / 2) - 1;

  // Bullpen: desks in two columns hugging the side walls, monitors north.
  for (let y = 1; y + 1 <= H - 5; y += 3) {
    pieces.push({ type: 'desk', x: 1, y, rot: 0 });
    pieces.push({ type: 'desk', x: W - 1 - deskW, y, rot: 0 });
  }

  // Reception desk, centred and turned around (rot 2) so the officer sits on
  // the back side facing the front door.
  pieces.push({ type: 'desk', x: centreL, y: H - 4, rot: 2 });

  // Lobby benches against the front wall, backs south, clear of the door
  // columns. Only when there's room on both sides.
  if (benchW <= centreL) {
    pieces.push({ type: 'bench', x: 0, y: H - 1, rot: 2 });
    pieces.push({ type: 'bench', x: W - benchW, y: H - 1, rot: 2 });
  }

  return pieces;
}

const LAYOUTS = {
  grocer: storeLayout,
  hardware_store: storeLayout,
  gas_station: storeLayout,
  police: policeLayout,
};

/** Whether this special building type gets furniture outlines. */
export function hasSpecialFurnitureLayout(type) {
  return !!LAYOUTS[type];
}

/**
 * Absolute furniture pieces ({type, x, y, w, h, rot}, the gameMap.furniture
 * shape) for a special building, or [] for a type without a layout.
 *
 * @param {{type:string, x:number, y:number, width:number, height:number, frontage?:string}} building
 */
export function planSpecialFurniture(building) {
  const make = LAYOUTS[building.type];
  if (!make) return [];

  const frontage = building.frontage || 'south';
  // Canonical frame is entrance-south; east/west frontages are a quarter turn
  // away, so the canonical width runs along the map's y axis.
  const sideways = frontage === 'east' || frontage === 'west';
  const W = sideways ? building.height : building.width;
  const H = sideways ? building.width : building.height;

  const canonical = {
    id: `special_${building.type}`,
    width: W,
    height: H,
    grid: Array.from({ length: H }, () => 'a'.repeat(W)),
    legend: { a: building.type },
    doors: [],
    furniture: make(W, H),
  };
  const oriented = orientFloorplan(canonical, frontage);

  return oriented.furniture.map(f => {
    const base = FLOORPLAN_FOOTPRINTS[f.type];
    const fw = (f.rot % 2) ? base.h : base.w;
    const fh = (f.rot % 2) ? base.w : base.h;
    return { type: f.type, x: building.x + f.x, y: building.y + f.y, w: fw, h: fh, rot: f.rot };
  });
}
