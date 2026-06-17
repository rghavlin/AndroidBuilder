import { Pathfinding } from '../utils/Pathfinding.js';

/**
 * MapConnectivityValidator - Post-generation reachability gate.
 *
 * Confirms a generated map is actually playable before it ships to the player:
 *   1. the two road exits (transition tiles) connect to each other, and
 *   2. every building can be walked up to (its door is reachable).
 *
 * Movement is evaluated with the SAME rules the game uses (Pathfinding's
 * walkability + edge/diagonal checks), from the player's perspective, treating
 * closed/locked doors as passable since the player can open or force them.
 * Windows stay blocked for the player, matching real movement.
 *
 * This is intentionally a guard, not a generator: it reports whether a map is
 * good, and a caller regenerates on failure (see TemplateMapGenerator.generateValidatedMap).
 */

const PLAYER_FLOOD_OPTS = { allowBreaching: true };

/**
 * Flood-fill every tile reachable from (sx, sy) under player movement rules.
 * @returns {Set<string>} keys "x,y" of reachable tiles (includes the source).
 */
function floodFill(gameMap, sx, sy) {
  const reached = new Set();
  const start = gameMap.getTile(sx, sy);
  if (!start || !Pathfinding.isTileWalkable(start, null, PLAYER_FLOOD_OPTS)) {
    return reached; // unwalkable source -> nothing reachable
  }

  reached.add(`${sx},${sy}`);
  const queue = [{ x: sx, y: sy }];
  let head = 0;
  while (head < queue.length) {
    const { x, y } = queue[head++];
    for (const n of Pathfinding.getNeighbors(x, y, true)) {
      const key = `${n.x},${n.y}`;
      if (reached.has(key)) continue;

      const tile = gameMap.getTile(n.x, n.y);
      if (!tile || !Pathfinding.isTileWalkable(tile, null, PLAYER_FLOOD_OPTS)) continue;
      if (Pathfinding.isEdgeBlocked(gameMap, x, y, n.x, n.y, null, PLAYER_FLOOD_OPTS)) continue;

      const isDiagonal = Math.abs(n.x - x) === 1 && Math.abs(n.y - y) === 1;
      if (isDiagonal && !Pathfinding.canMoveDiagonally(gameMap, x, y, n.x, n.y, null, PLAYER_FLOOD_OPTS)) continue;

      reached.add(key);
      queue.push(n);
    }
  }
  return reached;
}

/** Doors (from metadata) whose tile lies within a building's footprint. */
function doorsForBuilding(b, doors) {
  return doors.filter(d =>
    d.x >= b.x && d.x < b.x + b.width &&
    d.y >= b.y && d.y < b.y + b.height
  );
}

/**
 * Validate connectivity of a freshly built GameMap against its generation metadata.
 *
 * @param {GameMap} gameMap - map after applyToGameMap (terrain, edges, doors present)
 * @param {Object} mapData - the generator output (for metadata.spawnZones / buildings / doors)
 * @returns {{ ok: boolean, score: number, reasons: string[] }}
 *   score: 0 is perfect; higher is worse (exits dominate buildings). Lets a caller
 *   keep the least-bad attempt if every attempt fails.
 */
export function validateConnectivity(gameMap, mapData) {
  const meta = mapData?.metadata || {};
  const transitions = meta.spawnZones?.transitionPoints || null;
  const reasons = [];

  // A listed transition point only counts as a real exit if the map actually
  // placed a transition tile there. Some templates (e.g. starting_road) list a
  // south point but intentionally seal that edge, so it must not be required.
  const isExitTile = (p) => p && gameMap.getTile(p.x, p.y)?.terrain === 'transition';
  const north = isExitTile(transitions?.north) ? transitions.north : null;
  const south = isExitTile(transitions?.south) ? transitions.south : null;
  const source = north || south || { x: Math.floor(gameMap.width / 2), y: Math.floor(gameMap.height / 2) };

  const reached = floodFill(gameMap, source.x, source.y);
  const isReached = (p) => p && reached.has(`${p.x},${p.y}`);

  if (reached.size === 0) {
    reasons.push(`source (${source.x},${source.y}) is not walkable`);
    return { ok: false, score: 1000, reasons };
  }

  // 1. Exit-to-exit connectivity (the unwinnable-map guard).
  let exitsOk = true;
  if (north && south) {
    if (!isReached(south)) {
      exitsOk = false;
      reasons.push(`south exit (${south.x},${south.y}) unreachable from north exit`);
    }
  }

  // 2. Building approachability — each building's door should be reachable.
  const buildings = meta.buildings || [];
  const doors = meta.doors || [];
  let unreachableBuildings = 0;
  for (const b of buildings) {
    const bDoors = doorsForBuilding(b, doors);
    if (bDoors.length === 0) continue; // nothing to assess (e.g. open shelters)
    if (!bDoors.some(d => reached.has(`${d.x},${d.y}`))) {
      unreachableBuildings++;
      reasons.push(`building ${b.type} at (${b.x},${b.y}) has no reachable door`);
    }
  }

  const score = (exitsOk ? 0 : 100) + unreachableBuildings;
  return { ok: score === 0, score, reasons };
}
