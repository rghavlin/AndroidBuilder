/**
 * TollGate — standard map-exit tollgate layout.
 *
 * Computes a fully-enclosed serpentine barrier maze + corner turrets + a gate
 * guard from a single input: the forward exit's center on the map edge. The maze
 * forces the player onto a long switchback path so that even with maxed-out AP
 * they cannot cross before the turrets (which have line of sight across the whole
 * maze — barriers block movement, not sight — and range 15) cut them down. The
 * guard sits in the only opening of the entry wall; paying the toll lets it step
 * aside into a reserved alcove.
 *
 * The corridor is sealed on BOTH sides by vertical barrier walls along the
 * sidewalk columns so the player can neither walk up the side nor step into a
 * lane from the side — the only way in is the guarded entry, the only way out is
 * the exit. The four turrets sit on the side-wall columns and (being impassable
 * to non-town factions) double as the corner seals.
 *
 * Everything is derived from the exit center, so the same layout drops onto any
 * town-sized map that records its exit in metadata.exits.
 *
 * Geometry (north exit; south is the vertical mirror), offsets relative to the
 * exit column `ex`, dir = +1 inward. S = side wall, B = serpentine wall,
 * T = turret, G = guard, a = guard's sidestep alcove (left open):
 *
 *   off:  -5 -4 -3 -2 -1  0 +1 +2 +3 +4 +5
 *   ey     T  .  .  .  .  E  .  .  .  .  T   E = exit; T = corner turrets
 *   +1     S  B  B  B  B  B  B  B  B  .  S   wall 0, gap RIGHT
 *   +2     S  .  .  .  .  .  .  .  .  .  S   lane
 *   +3     S  .  B  B  B  B  B  B  B  B  S   wall 1, gap LEFT
 *   +4     S  .  .  .  .  .  .  .  .  .  S   lane
 *   +5     S  B  B  B  B  B  B  B  B  G  a   wall 2, gap RIGHT (guard in gap)
 *   +6     T  .  .  .  .  .  .  .  .  .  T   entry / approach (player arrives here)
 *
 * Turrets cap the side columns at the top (exit row) and bottom (approach row).
 */

// The central boulevard is 9 tiles wide (BranchingRoadGenerator SPINE_THICKNESS),
// i.e. exit column +/- 4. The serpentine spans that width; the side walls and
// turrets sit one tile further out on the flanking sidewalk (exit column +/- 5,
// still inside the cleared spine corridor since SPINE_HALF = 5).
export const TOLLGATE_BOULEVARD_HALF_WIDTH = 4;

export const TOLLGATE_DEFAULTS = {
  edge: 'north',     // which map edge the exit sits on ('north' | 'south')
  lanes: 3,          // number of switchback lanes (longer path = more turns under fire)
  halfWidth: TOLLGATE_BOULEVARD_HALF_WIDTH,
  laneHeight: 1      // walkable rows between consecutive walls
};

/**
 * Compute the tollgate layout from the forward exit center.
 * @param {{x:number,y:number}} exit forward exit center (on the map edge)
 * @param {object} [opts] see TOLLGATE_DEFAULTS
 * @returns {{
 *   barriers: {x:number,y:number}[],
 *   turrets:  {x:number,y:number}[],
 *   guard:    {x:number,y:number, sidestep:{x:number,y:number}},
 *   walls:    {y:number, gapX:number}[],
 *   bounds:   {xLeft:number,xRight:number,yNear:number,yFar:number}
 * }}
 */
export function computeTollGateLayout(exit, opts = {}) {
  const { edge, lanes, halfWidth, laneHeight } = { ...TOLLGATE_DEFAULTS, ...opts };

  const ex = exit.x;
  const ey = exit.y;
  const dir = edge === 'south' ? -1 : 1; // inward direction along Y (away from the edge)
  const xLeft = ex - halfWidth;          // interior (boulevard) left edge
  const xRight = ex + halfWidth;         // interior (boulevard) right edge
  const sideLeft = xLeft - 1;            // left sidewalk column (side wall)
  const sideRight = xRight + 1;          // right sidewalk column (side wall)

  const barriers = [];

  // --- Serpentine walls: full interior-width barrier rows with a single gap,
  // gap alternating ends. Wall 0 is nearest the exit, one row in from the edge
  // (the exit row itself is the final lane), so the last step lands on the exit. ---
  const walls = [];
  for (let k = 0; k < lanes; k++) {
    const y = ey + dir * (1 + k * (1 + laneHeight));
    const gapX = (k % 2 === 0) ? xRight : xLeft; // wall 0 gap right, wall 1 left, ...
    walls.push({ y, gapX });
    for (let x = xLeft; x <= xRight; x++) {
      if (x !== gapX) barriers.push({ x, y });
    }
  }

  const nearWall = walls[0];               // closest to the exit
  const farWall = walls[walls.length - 1]; // entry wall (the player reaches it first)

  // --- Guard: stands in the entry wall's gap, fully blocking it. On payment it
  // steps one tile out to the side (toward the gap's end) into a reserved alcove
  // in the side wall, opening the path. ---
  const guardOutX = farWall.gapX === xRight ? sideRight : sideLeft;
  const guard = {
    x: farWall.gapX,
    y: farWall.y,
    sidestep: { x: guardOutX, y: farWall.y }
  };

  // --- Side walls: seal both sidewalk columns across the maze rows so the player
  // can't walk up the side or enter a lane sideways. Skip the guard's sidestep
  // alcove so the gate can actually open. ---
  const yLo = Math.min(nearWall.y, farWall.y);
  const yHi = Math.max(nearWall.y, farWall.y);
  for (const sx of [sideLeft, sideRight]) {
    for (let y = yLo; y <= yHi; y++) {
      if (sx === guard.sidestep.x && y === guard.sidestep.y) continue; // leave alcove
      barriers.push({ x: sx, y });
    }
  }

  // --- Turrets: cap the four corners on the side-wall columns, one row beyond
  // each end wall (exit row at the top, approach row at the bottom). They seal
  // those corner tiles (impassable to the player) and have clear line of sight
  // across the whole maze. ---
  const turrets = [
    { x: sideLeft,  y: nearWall.y - dir }, // near-left  (exit row)
    { x: sideRight, y: nearWall.y - dir }, // near-right
    { x: sideLeft,  y: guard.sidestep.x === sideLeft ? farWall.y : farWall.y + dir },  // far-left   (moved up if it's the alcove)
    { x: sideRight, y: guard.sidestep.x === sideRight ? farWall.y : farWall.y + dir }   // far-right  (moved up if it's the alcove)
  ];

  const bounds = { xLeft, xRight, yNear: nearWall.y, yFar: farWall.y };

  // --- Exclusion footprint: the axis-aligned bounding box over everything the
  // gate occupies (walls, side walls, turrets, guard + alcove). Loot and zombies
  // are kept out of this rectangle so the kill-zone stays clean. Stored in map
  // metadata (gameMap.metadata.tollGate) and tested via MapUtils.isInsideTollGate. ---
  const all = [...barriers, ...turrets, guard, guard.sidestep];
  const xs = all.map(p => p.x);
  const ys = all.map(p => p.y);
  const area = {
    x1: Math.min(...xs),
    x2: Math.max(...xs),
    y1: Math.min(...ys),
    y2: Math.max(...ys)
  };

  return { barriers, turrets, guard, walls, bounds, area };
}
