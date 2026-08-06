import { Pathfinding } from '../utils/Pathfinding.js';
import { isTerrainWalkable } from '../map/TerrainTypes.js';
import { EntityType } from '../entities/Entity.js';
import { TURRET_DEF_ID, isTurretPassableBy } from '../ai/TurretCombat.js';
import { VehicleUtils } from '../utils/VehicleUtils.js';

/**
 * Where an RC wagon may roll, and how far it gets for a given AP budget.
 *
 * Extracted from RcVehicleMovement so the two ways a wagon moves — the player
 * driving it live, and the autonomous controller advancing it on its own turn —
 * share one set of movement rules. They differ in who pays and when the move
 * commits, never in where the wagon can go, and keeping the filter private to
 * one of them was the easy way for that to stop being true.
 */

/** Mirrors Tile.isWalkable's content rules, minus the wagon and the player. */
export function makeRcFilter(engine, wagonKey) {
  const playerId = engine?.player?.id;

  return (tile) => {
    if (!tile) return false;

    // An open door on an otherwise solid tile is still a way in.
    const hasEntry = tile.contents.some(e =>
      (e.type === EntityType.DOOR || e.type === EntityType.GARAGE_DOOR) && e.isOpen
    );
    if (!isTerrainWalkable(tile.terrain) && !hasEntry) return false;

    for (const e of tile.contents) {
      // Edge-anchored structures sit on tile boundaries; blocking for those is
      // Pathfinding.isEdgeBlocked's job, not the tile's.
      if ((e.type === EntityType.DOOR || e.type === EntityType.WINDOW || e.type === EntityType.GARAGE_DOOR)
          && e.edge !== undefined) continue;
      if ((e.type === EntityType.DOOR || e.type === EntityType.GARAGE_DOOR) && e.isOpen) continue;

      // The wagon never blocks itself, and it can always come home to you.
      if (e.instanceId === wagonKey || e.id === wagonKey) continue;
      if (playerId && e.id === playerId) continue;

      if (e.defId === TURRET_DEF_ID) {
        if (isTurretPassableBy(e, engine?.player)) continue;
        return false;
      }

      if (e.blocksMovement) return false;
    }

    return true;
  };
}

/**
 * Route a wagon from one tile to another. Returns [] when there is no way
 * through; the returned path INCLUDES the start tile, so a one-tile move is two
 * nodes long.
 *
 * @param {number} fromX
 * @param {number} fromY
 * @param {number} toX
 * @param {number} toY
 * @param {GameEngine} engine
 * @param {string} wagonKey - instanceId, so the wagon doesn't block itself
 * @returns {Array<{x:number,y:number}>}
 */
export function findRcPath(fromX, fromY, toX, toY, engine, wagonKey) {
  return Pathfinding.findPath(
    engine.gameMap,
    fromX, fromY,
    toX, toY,
    { allowDiagonal: true, entityFilter: makeRcFilter(engine, wagonKey) }
  );
}

/**
 * How much of `path` an autonomous wagon can afford this turn.
 *
 * Walks the path pricing each step with VehicleUtils.remoteStepCost — the same
 * atom the player-facing quote is summed from — and stops before the first step
 * it can't pay for. Because the price is per-tile and terrain-aware, a wagon
 * that finds a road genuinely covers more ground per turn than one crossing
 * grass, which is the whole reason this walks the path instead of dividing the
 * budget by an average.
 *
 * Returns the start tile alone (a leg of length 1, meaning "no move") when even
 * the first step is unaffordable. That is a real state — a Cargo Wagon whose
 * motors have died prices every step above its budget — and callers treat it as
 * "stay put, keep the order".
 *
 * @param {Array<{x:number,y:number}>} path - includes the start tile
 * @param {Item} item
 * @param {GameMap} gameMap
 * @param {number} apBudget
 * @returns {{leg: Array<{x:number,y:number}>, apSpent: number}}
 */
export function sliceLegByAp(path, item, gameMap, apBudget) {
  if (!path || path.length <= 1 || !item) {
    return { leg: path?.length ? [path[0]] : [], apSpent: 0 };
  }

  const perStep = VehicleUtils.getRemoteStepPenalty(item);
  let spent = 0;
  let end = 0;

  for (let i = 1; i < path.length; i++) {
    const tile = gameMap ? gameMap.getTile(path[i].x, path[i].y) : null;
    const cost = VehicleUtils.remoteStepCost(item, tile, perStep);
    if (spent + cost > apBudget) break;
    spent += cost;
    end = i;
  }

  return {
    leg: path.slice(0, end + 1),
    apSpent: Math.round(spent * 10) / 10
  };
}

/**
 * How many turns of `apBudget` it takes to walk `path` end to end.
 *
 * The same greedy rule sliceLegByAp applies, in one pass: fill a turn until the
 * next step won't fit, then start a fresh turn with that step. Kept here beside
 * sliceLegByAp because the two must price a tile identically — a quoted "3t"
 * that the wagon then takes four turns to honour is a bug the player can see.
 *
 * Deliberately not implemented by calling sliceLegByAp in a loop: that copies a
 * shrinking tail of the path on every iteration, and this runs on every mouse
 * move while a destination is being aimed.
 *
 * @returns {number} turns (>= 1 for a non-empty path), or Infinity if any single
 *   step costs more than a whole turn's budget — the wagon can never start.
 */
export function countTurnsForPath(path, item, gameMap, apBudget) {
  if (!path || path.length <= 1 || !item) return 0;

  const perStep = VehicleUtils.getRemoteStepPenalty(item);
  let turns = 1;
  let spent = 0;

  for (let i = 1; i < path.length; i++) {
    const tile = gameMap ? gameMap.getTile(path[i].x, path[i].y) : null;
    const cost = VehicleUtils.remoteStepCost(item, tile, perStep);
    if (cost > apBudget) return Infinity;

    if (spent + cost > apBudget) {
      turns++;
      spent = cost;
    } else {
      spent += cost;
    }
  }

  return turns;
}
