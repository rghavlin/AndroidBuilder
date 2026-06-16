/**
 * Scent Trail System
 * Manages "breadcrumbing" for zombie AI to follow player paths.
 * Allows zombies to track movements through doors/windows without point-to-point shortcuts.
 */
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
   * Find the freshest (highest sequence) scent in a radius
   * @param {GameMap} gameMap - The game map
   * @param {number} startX - Center X
   * @param {number} startY - Center Y
   * @param {number} radius - Search radius
   * @param {number} minSequence - Ignore sequences older than this
   * @returns {Object|null} - {x, y, sequence} of freshest scent
   */
  static findFreshestScent(gameMap, startX, startY, radius, minSequence = 0) {
    let freshest = null;
    let maxSeq = minSequence;

    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        const x = startX + dx;
        const y = startY + dy;
        
        // Manhattan distance check for radius
        if (Math.abs(dx) + Math.abs(dy) > radius) continue;

        const tile = gameMap.getTile(x, y);
        if (tile && tile.scent > 0 && tile.scentSequence > maxSeq) {
          maxSeq = tile.scentSequence;
          freshest = { x, y, sequence: tile.scentSequence };
        }
      }
    }

    return freshest;
  }
}
