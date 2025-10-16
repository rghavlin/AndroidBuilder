
import { Pathfinding } from './Pathfinding.js';

/**
 * Movement Helper - Bridge between pathfinding and game entities
 * Provides convenient methods for common movement operations
 */
export class MovementHelper {
  /**
   * Calculate AP cost for movement between two points
   * @param {GameMap} gameMap - The game map instance
   * @param {number} startX - Starting X coordinate
   * @param {number} startY - Starting Y coordinate
   * @param {number} endX - Target X coordinate
   * @param {number} endY - Target Y coordinate
   * @param {Object} options - Pathfinding options
   * @returns {number} AP cost or -1 if no path exists
   */
  static calculateAPCost(gameMap, startX, startY, endX, endY, options = {}) {
    const path = Pathfinding.findPath(gameMap, startX, startY, endX, endY, options);
    
    if (path.length === 0) {
      return -1; // No path possible
    }

    return Pathfinding.calculateMovementCost(path);
  }

  /**
   * Check if movement is possible within AP budget
   * @param {GameMap} gameMap - The game map instance
   * @param {Object} entity - Entity with current position and AP
   * @param {number} targetX - Target X coordinate
   * @param {number} targetY - Target Y coordinate
   * @param {Object} options - Pathfinding options
   * @returns {Object} Result with isValid, cost, path, and reason
   */
  static validateMovement(gameMap, entity, targetX, targetY, options = {}) {
    const result = {
      isValid: false,
      cost: 0,
      path: [],
      reason: ''
    };

    // Find path
    const path = Pathfinding.findPath(
      gameMap, 
      entity.x, 
      entity.y, 
      targetX, 
      targetY, 
      options
    );

    if (path.length === 0) {
      result.reason = 'No path to target';
      return result;
    }

    const cost = Pathfinding.calculateMovementCost(path);

    if (entity.ap !== undefined && cost > entity.ap) {
      result.cost = cost;
      result.path = path;
      result.reason = 'Insufficient AP';
      return result;
    }

    result.isValid = true;
    result.cost = cost;
    result.path = path;
    result.reason = 'Valid movement';
    return result;
  }

  /**
   * Get all tiles within movement range for an entity
   * @param {GameMap} gameMap - The game map instance
   * @param {Object} entity - Entity with current position and AP
   * @param {Object} options - Pathfinding options
   * @returns {Array} Array of reachable {x, y, cost} coordinates
   */
  static getMovementRange(gameMap, entity, options = {}) {
    const maxCost = entity.ap || 10; // Default to 10 if no AP defined
    
    return Pathfinding.getReachableTiles(
      gameMap,
      entity.x,
      entity.y,
      maxCost,
      options
    );
  }

  /**
   * Find the optimal path to get as close as possible to a target
   * Useful when direct path is blocked but you want to get closer
   * @param {GameMap} gameMap - The game map instance
   * @param {number} startX - Starting X coordinate
   * @param {number} startY - Starting Y coordinate
   * @param {number} targetX - Target X coordinate
   * @param {number} targetY - Target Y coordinate
   * @param {number} maxCost - Maximum movement cost
   * @param {Object} options - Pathfinding options
   * @returns {Object} Result with best path and final distance
   */
  static findBestApproach(gameMap, startX, startY, targetX, targetY, maxCost, options = {}) {
    const reachableTiles = Pathfinding.getReachableTiles(gameMap, startX, startY, maxCost, options);
    
    if (reachableTiles.length === 0) {
      return {
        path: [],
        finalDistance: Pathfinding.heuristic(startX, startY, targetX, targetY),
        cost: 0
      };
    }

    // Find the reachable tile closest to the target
    let bestTile = null;
    let bestDistance = Infinity;

    for (const tile of reachableTiles) {
      const distance = Pathfinding.heuristic(tile.x, tile.y, targetX, targetY);
      if (distance < bestDistance) {
        bestDistance = distance;
        bestTile = tile;
      }
    }

    if (bestTile) {
      const path = Pathfinding.findPath(gameMap, startX, startY, bestTile.x, bestTile.y, options);
      return {
        path: path,
        finalDistance: bestDistance,
        cost: bestTile.cost
      };
    }

    return {
      path: [],
      finalDistance: Pathfinding.heuristic(startX, startY, targetX, targetY),
      cost: 0
    };
  }

  /**
   * Create entity filter for pathfinding that ignores specific entities
   * @param {Array} ignoreEntityIds - Array of entity IDs to ignore during pathfinding
   * @returns {Function} Filter function for pathfinding
   */
  static createEntityFilter(ignoreEntityIds = []) {
    return (tile) => {
      // Allow movement if no blocking entities or all blocking entities are in ignore list
      const blockingEntities = tile.contents.filter(entity => {
        return entity.blocksMovement && !ignoreEntityIds.includes(entity.id);
      });

      return blockingEntities.length === 0;
    };
  }
}
