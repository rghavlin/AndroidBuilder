/**
 * Helper function to check if coordinates (x, y) lie inside a compound's fence bounds.
 * @param {Object} compound - The compound metadata (e.g. townSquareCompound)
 * @param {number} x - The x-coordinate
 * @param {number} y - The y-coordinate
 * @returns {boolean} True if inside the compound bounds, false otherwise.
 */
export function isInsideCompound(compound, x, y) {
  if (!compound || !compound.fenceBounds) return false;
  const { x1, x2, y1, y2 } = compound.fenceBounds;
  return x >= x1 && x <= x2 && y >= y1 && y <= y2;
}

/**
 * Check if coordinates (x, y) lie inside the map-exit tollgate footprint.
 * @param {Object} tollGate - The tollgate metadata rect (gameMap.metadata.tollGate)
 * @param {number} x - The x-coordinate
 * @param {number} y - The y-coordinate
 * @returns {boolean} True if inside the tollgate area, false otherwise.
 */
export function isInsideTollGate(tollGate, x, y) {
  if (!tollGate) return false;
  const { x1, x2, y1, y2 } = tollGate;
  return x >= x1 && x <= x2 && y >= y1 && y <= y2;
}

/**
 * Check whether (x, y) falls inside any building's footprint. Buildings use
 * top-left origin + width/height bounds (distinct from compound fenceBounds).
 * @param {Array<{x:number,y:number,width:number,height:number}>} buildings
 * @param {number} x
 * @param {number} y
 * @returns {boolean}
 */
export function isInsideAnyBuilding(buildings, x, y) {
  if (!buildings) return false;
  return buildings.some(b =>
    x >= b.x && x < b.x + b.width && y >= b.y && y < b.y + b.height
  );
}

/**
 * Find the south-edge transition tile (y = height - 1). Prefers a 'transition'
 * terrain tile; falls back to any walkable edge tile. Shared by NPC pathing
 * (NPCAISystem) and NPC spawning (NPCSpawner).
 * @param {GameMap} gameMap
 * @returns {{x: number, y: number} | null}
 */
export function findSouthTransitionTile(gameMap) {
  const y = gameMap.height - 1;
  // Preferred: 'transition' terrain tile
  for (let x = 0; x < gameMap.width; x++) {
    const tile = gameMap.getTile(x, y);
    if (tile && tile.terrain === 'transition') {
      return { x, y };
    }
  }
  // Fallback: any walkable edge tile
  for (let x = 0; x < gameMap.width; x++) {
    const tile = gameMap.getTile(x, y);
    if (tile && tile.isWalkable()) {
      return { x, y };
    }
  }
  return null;
}
