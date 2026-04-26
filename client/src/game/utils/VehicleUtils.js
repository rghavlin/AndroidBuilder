
/**
 * VehicleUtils - Shared logic for vehicle movement and drag mechanics
 */
export const VehicleUtils = {
  /**
   * Calculate the total AP cost for dragging an item across a path.
   * Extracts logic from GameMapContext to centralize motorized bonuses and terrain discounts.
   * 
   * @param {Item} item - The item being dragged
   * @param {Array} path - Array of {x, y} coordinates
   * @param {GameMap} gameMap - The map instance for terrain lookup
   * @param {number} baseMovementCost - The player's base walking cost for this path
   * @returns {number} - Final AP cost
   */
  calculateDragCost(item, path, gameMap, baseMovementCost) {
    if (!item || !path || path.length <= 1) return baseMovementCost;

    const basePenalty = item.dragApPenalty || 2;
    let motorBonusValue = 0;
    
    // Sum up all active motorized assist bonuses (handles multiple axles)
    if (item.getMotorizedBonus) {
      motorBonusValue = item.getMotorizedBonus();
    } else if (item.isMotorized && item.isMotorized()) {
      // Fallback for older items or direct calls
      motorBonusValue = item.motorAssistBonus || 0.5;
    }

    let dragPenaltyTotal = 0;
    
    // Calculate penalty per step (skipping the starting tile)
    for (let i = 1; i < path.length; i++) {
      const tile = gameMap.getTile(path[i].x, path[i].y);
      let stepPenalty = Math.max(0, basePenalty - motorBonusValue);
      
      // Terrain affinity (e.g. Roads/Sidewalks make dragging easier)
      if (tile && item.terrainModifiers && item.terrainModifiers[tile.terrain] !== undefined) {
        stepPenalty += item.terrainModifiers[tile.terrain];
      } else if (tile && (tile.terrain === 'road' || tile.terrain === 'sidewalk')) {
        // Fallback for items without explicit modifiers but still dragging on pavement
        stepPenalty -= 0.5;
      }
      
      dragPenaltyTotal += Math.max(0, stepPenalty);
    }

    return baseMovementCost + dragPenaltyTotal;
  }
};
