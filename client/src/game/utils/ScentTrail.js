/**
 * Scent Trail System
 * Manages "breadcrumbing" for zombie AI to follow player paths.
 * Allows zombies to track movements through doors/windows without point-to-point shortcuts.
 */
import { Pathfinding } from './Pathfinding.js';
// Number of turns a freshly-dropped scent marker lasts before fully decaying.
export const SCENT_INTENSITY = 3;

// Manhattan radius a zombie searches for scent breadcrumbs to follow.
export const SCENT_FOLLOW_RADIUS = 6;

export class ScentTrail {
  /**
   * Drop a scent marker on a tile
   * @param {GameMap} gameMap - The game map
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   * @param {number} intensity - Number of turns the scent lasts
   */
  static dropScent(gameMap, x, y, intensity = SCENT_INTENSITY) {
    const tile = gameMap.getTile(x, y);
    if (tile) {
      gameMap.scentSequenceCounter++;
      tile.scent = intensity;
      tile.scentSequence = gameMap.scentSequenceCounter;
      // Track this tile so decay only visits tiles that actually hold scent.
      if (gameMap.activeScents) gameMap.activeScents.add(`${x},${y}`);
    }
  }

  /**
   * Decay all active scents on the map.
   * Iterates only the sparse set of scent-bearing tiles, so cost scales with the
   * number of active trails rather than the full map area.
   * @param {GameMap} gameMap - The game map
   */
  static decayScents(gameMap) {
    const active = gameMap.activeScents;
    if (!active || active.size === 0) return;

    for (const key of active) {
      const [x, y] = key.split(',');
      const tile = gameMap.getTile(Number(x), Number(y));
      if (!tile || tile.scent <= 0) {
        active.delete(key);
        continue;
      }
      tile.scent--;
      if (tile.scent === 0) {
        tile.scentSequence = 0;
        active.delete(key);
      }
    }
  }

  /**
   * Rebuild the sparse active-scent index from tile state.
   * Called after deserialization, where tiles carry persisted scent but the
   * index starts empty. O(map area) but only runs on load, never per turn.
   * @param {GameMap} gameMap - The game map
   */
  static rebuildIndex(gameMap) {
    if (!gameMap.activeScents) gameMap.activeScents = new Set();
    const active = gameMap.activeScents;
    active.clear();
    for (let y = 0; y < gameMap.height; y++) {
      for (let x = 0; x < gameMap.width; x++) {
        const tile = gameMap.getTile(x, y);
        if (tile && tile.scent > 0) active.add(`${x},${y}`);
      }
    }
  }

  /**
   * Find the freshest (highest sequence) scent the sniffer can actually smell.
   *
   * Scent propagates by breadth-first flood from the sniffer's own tile through
   * OPEN boundaries only, capped at `radius` steps. It is deliberately NOT a
   * box scan over Manhattan distance: that ignored geometry entirely, so a
   * zombie sealed inside a building picked up a breadcrumb the player dropped
   * outside and — because tryFollowScent launders a scent hit into a confirmed
   * "sighting" (Entity.setTargetSighted) — walked straight to the door and
   * breached it, having never seen or heard anything. Smelling around corners
   * and through an open door/broken window is the intent; smelling through a
   * solid wall is not.
   *
   * Openness uses Pathfinding.isEdgeBlocked with breaching explicitly DISABLED.
   * That distinction matters: zombie pathfinding treats a closed door as
   * passable (it can break through), but scent must not cross one — reusing the
   * pathfinding predicate here would leave the wall porous and reintroduce the
   * bug. Cardinal steps only, so a step count equals Manhattan distance in open
   * ground and the radius keeps its old meaning; diagonals would also let scent
   * squeeze through the corner where two walls meet.
   *
   * @param {GameMap} gameMap - The game map
   * @param {number} startX - Sniffer X
   * @param {number} startY - Sniffer Y
   * @param {number} radius - Maximum number of steps scent travels
   * @param {number} minSequence - Ignore sequences older than this
   * @param {Entity} [entity] - The sniffer, for walkability/window rules
   * @returns {Object|null} - {x, y, sequence} of freshest reachable scent
   */
  static findFreshestScent(gameMap, startX, startY, radius, minSequence = 0, entity = null) {
    let freshest = null;
    let maxSeq = minSequence;

    const visited = new Set([`${startX},${startY}`]);
    let frontier = [{ x: startX, y: startY }];

    for (let step = 0; step <= radius; step++) {
      const next = [];
      for (const { x, y } of frontier) {
        const tile = gameMap.getTile(x, y);
        if (!tile) continue;

        if (tile.scent > 0 && tile.scentSequence > maxSeq) {
          maxSeq = tile.scentSequence;
          freshest = { x, y, sequence: tile.scentSequence };
        }

        if (step === radius) continue;

        for (const [nx, ny] of [[x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]]) {
          const key = `${nx},${ny}`;
          if (visited.has(key)) continue;
          const nTile = gameMap.getTile(nx, ny);
          if (!nTile) continue;
          // Another zombie standing in the way does not stop a smell.
          if (!nTile.isWalkable(entity, { ignoreZombies: true })) continue;
          if (Pathfinding.isEdgeBlocked(gameMap, x, y, nx, ny, entity, {
            isPathfinding: false,
            allowBreaching: false
          })) continue;
          visited.add(key);
          next.push({ x: nx, y: ny });
        }
      }
      frontier = next;
      if (frontier.length === 0) break;
    }

    return freshest;
  }
}
