/**
 * Scent Trail System
 * Manages "breadcrumbing" for zombie AI to follow player paths.
 * Allows zombies to track movements through doors/windows without point-to-point shortcuts.
 */
export class ScentTrail {
  /**
   * Drop a scent marker on a tile
   * @param {GameMap} gameMap - The game map
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   * @param {number} intensity - Number of turns the scent lasts
   */
  static dropScent(gameMap, x, y, intensity = 3) {
    const tile = gameMap.getTile(x, y);
    if (tile) {
      gameMap.scentSequenceCounter++;
      tile.scent = intensity;
      tile.scentSequence = gameMap.scentSequenceCounter;
      
      // console.log(`[ScentTrail] Dropped scent at (${x}, ${y}) intensity ${intensity}, seq ${tile.scentSequence}`);
    }
  }

  /**
   * Decay all scents on the map
   * @param {GameMap} gameMap - The game map
   */
  static decayScents(gameMap) {
    let decayedCount = 0;
    for (let y = 0; y < gameMap.height; y++) {
      for (let x = 0; x < gameMap.width; x++) {
        const tile = gameMap.getTile(x, y);
        if (tile && tile.scent > 0) {
          tile.scent--;
          if (tile.scent === 0) {
            tile.scentSequence = 0;
            decayedCount++;
          }
        }
      }
    }
    // if (decayedCount > 0) console.log(`[ScentTrail] Decayed ${decayedCount} scents`);
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
