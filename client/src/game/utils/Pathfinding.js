
/**
 * Universal Pathfinding System
 * Pure functional pathfinding utility for all entities
 * Follows UniversalGoals.md: modular, testable, serializable
 */

export class Pathfinding {
  /**
   * Find optimal path using A* algorithm
   * @param {GameMap} gameMap - The game map instance
   * @param {number} startX - Starting X coordinate
   * @param {number} startY - Starting Y coordinate
   * @param {number} endX - Target X coordinate
   * @param {number} endY - Target Y coordinate
   * @param {Object} options - Pathfinding options
   * @returns {Array} Array of {x, y} coordinates representing the path
   */
  static findPath(gameMap, startX, startY, endX, endY, options = {}) {
    const {
      allowDiagonal = false,
      maxDistance = Infinity,
      entityFilter = null, // Function to check if entity blocks path for this specific entity
      debug = false
    } = options;

    // Validate inputs
    if (!gameMap || !gameMap.getTile) {
      throw new Error('[Pathfinding] Invalid gameMap provided');
    }

    const startTile = gameMap.getTile(startX, startY);
    const endTile = gameMap.getTile(endX, endY);

    if (!startTile || !endTile) {
      if (debug) console.log('[Pathfinding] Start or end tile out of bounds');
      return []; // No path possible
    }

    // Check if target is walkable
    if (!this.isTileWalkable(endTile, entityFilter)) {
      if (debug) console.log('[Pathfinding] Target tile not walkable');
      return []; // Cannot reach unwalkable target
    }

    // If already at target
    if (startX === endX && startY === endY) {
      return [{ x: startX, y: startY }];
    }

    // A* algorithm implementation
    const openSet = [{ x: startX, y: startY, g: 0, h: this.heuristic(startX, startY, endX, endY), f: 0, parent: null }];
    const closedSet = new Set();
    const openSetMap = new Map();

    openSet[0].f = openSet[0].g + openSet[0].h;
    openSetMap.set(`${startX},${startY}`, openSet[0]);

    while (openSet.length > 0) {
      // Find node with lowest f score
      let currentIndex = 0;
      for (let i = 1; i < openSet.length; i++) {
        if (openSet[i].f < openSet[currentIndex].f) {
          currentIndex = i;
        }
      }

      const current = openSet.splice(currentIndex, 1)[0];
      openSetMap.delete(`${current.x},${current.y}`);
      closedSet.add(`${current.x},${current.y}`);

      // Found the goal
      if (current.x === endX && current.y === endY) {
        return this.reconstructPath(current);
      }

      // Check all neighbors
      const neighbors = this.getNeighbors(current.x, current.y, allowDiagonal);

      for (const neighbor of neighbors) {
        const neighborKey = `${neighbor.x},${neighbor.y}`;

        // Skip if already evaluated
        if (closedSet.has(neighborKey)) {
          continue;
        }

        // Skip if out of bounds or not walkable
        const neighborTile = gameMap.getTile(neighbor.x, neighbor.y);
        if (!neighborTile) {
          if (debug) console.log(`[Pathfinding] Neighbor (${neighbor.x}, ${neighbor.y}) out of bounds`);
          continue;
        }

        if (!this.isTileWalkable(neighborTile, entityFilter)) {
          if (debug) console.log(`[Pathfinding] Neighbor (${neighbor.x}, ${neighbor.y}) not walkable. Terrain: ${neighborTile.terrain}, Unwalkable: ${neighborTile.unwalkable}, Contents: ${neighborTile.contents.length}`);
          continue;
        }

        // For diagonal movement, check if both adjacent orthogonal tiles are walkable
        // This prevents cutting corners around obstacles
        if (allowDiagonal && this.isDiagonalMove(current.x, current.y, neighbor.x, neighbor.y)) {
          if (!this.canMoveDiagonally(gameMap, current.x, current.y, neighbor.x, neighbor.y, entityFilter)) {
            continue;
          }
        }

        // Skip if beyond max distance
        const distanceFromStart = Math.abs(neighbor.x - startX) + Math.abs(neighbor.y - startY);
        if (distanceFromStart > maxDistance) {
          continue;
        }

        const tentativeG = current.g + this.getMovementCost(current.x, current.y, neighbor.x, neighbor.y);

        // Check if this neighbor is already in open set
        const existingNode = openSetMap.get(neighborKey);

        if (!existingNode) {
          // New node - add to open set
          const newNode = {
            x: neighbor.x,
            y: neighbor.y,
            g: tentativeG,
            h: this.heuristic(neighbor.x, neighbor.y, endX, endY),
            f: 0,
            parent: current
          };
          newNode.f = newNode.g + newNode.h;

          openSet.push(newNode);
          openSetMap.set(neighborKey, newNode);
        } else if (tentativeG < existingNode.g) {
          // Better path to existing node
          existingNode.g = tentativeG;
          existingNode.f = existingNode.g + existingNode.h;
          existingNode.parent = current;
        }
      }
    }

    // No path found
    if (debug) console.log('[Pathfinding] No path found');
    return [];
  }

  static calculateMovementCost(path, entity = null) {
    if (!path || path.length <= 1) {
      return 0;
    }

    let baseCost = 0;
    for (let i = 1; i < path.length; i++) {
      const cost = this.getMovementCost(path[i - 1].x, path[i - 1].y, path[i].x, path[i].y);
      baseCost += cost;
    }

    // Apply acceleration bonus: Every 5 tiles reduces total cost by 0.5 AP
    const numTiles = path.length - 1;
    const bonus = Math.floor(numTiles / 5) * 0.5;

    // Ensure cost never drops below a minimum (e.g., 0.1 per move or at least something)
    // to prevent free movement.
    const finalCost = Math.max(0.1, baseCost - bonus);

    return finalCost;
  }

  /**
   * Check if a path is walkable for a specific entity
   * @param {GameMap} gameMap - The game map instance
   * @param {Array} path - Array of {x, y} coordinates
   * @param {Object} entity - Entity that would move along the path (optional)
   * @returns {boolean} True if entire path is walkable
   */
  static isPathWalkable(gameMap, path, entity = null) {
    if (!path || path.length === 0) {
      return false;
    }

    for (const point of path) {
      const tile = gameMap.getTile(point.x, point.y);
      if (!tile || !this.isTileWalkable(tile, null)) {
        return false;
      }
    }

    return true;
  }

  /**
   * Find all tiles within movement range
   * @param {GameMap} gameMap - The game map instance
   * @param {number} startX - Starting X coordinate
   * @param {number} startY - Starting Y coordinate
   * @param {number} maxCost - Maximum movement cost
   * @param {Object} options - Pathfinding options
   * @returns {Array} Array of {x, y, cost} objects representing reachable tiles
   */
  static getReachableTiles(gameMap, startX, startY, maxCost, options = {}) {
    const reachable = [];
    const visited = new Set();
    const queue = [{ x: startX, y: startY, cost: 0 }];

    while (queue.length > 0) {
      const current = queue.shift();
      const key = `${current.x},${current.y}`;

      if (visited.has(key)) {
        continue;
      }

      visited.add(key);

      // Add to reachable tiles (excluding starting position)
      if (current.cost > 0) {
        reachable.push({ x: current.x, y: current.y, cost: current.cost });
      }

      // Explore neighbors
      const neighbors = this.getNeighbors(current.x, current.y, options.allowDiagonal || false);

      for (const neighbor of neighbors) {
        const neighborTile = gameMap.getTile(neighbor.x, neighbor.y);
        if (!neighborTile || !this.isTileWalkable(neighborTile, options.entityFilter)) {
          continue;
        }

        const moveCost = this.getMovementCost(current.x, current.y, neighbor.x, neighbor.y);
        const totalCost = current.cost + moveCost;

        if (totalCost <= maxCost && !visited.has(`${neighbor.x},${neighbor.y}`)) {
          queue.push({ x: neighbor.x, y: neighbor.y, cost: totalCost });
        }
      }
    }

    return reachable;
  }

  // Private helper methods

  /**
   * Manhattan distance heuristic
   */
  static heuristic(x1, y1, x2, y2) {
    return Math.abs(x1 - x2) + Math.abs(y1 - y2);
  }

  /**
   * Get movement cost between two adjacent tiles
   */
  static getMovementCost(x1, y1, x2, y2) {
    const dx = Math.abs(x1 - x2);
    const dy = Math.abs(y1 - y2);

    // Diagonal movement costs more
    if (dx === 1 && dy === 1) {
      return 1.4;
    }

    // Orthogonal movement
    return 1;
  }

  /**
   * Get neighboring coordinates
   */
  static getNeighbors(x, y, allowDiagonal = false) {
    const neighbors = [
      { x: x + 1, y: y },     // Right
      { x: x - 1, y: y },     // Left
      { x: x, y: y + 1 },     // Down
      { x: x, y: y - 1 }      // Up
    ];

    if (allowDiagonal) {
      neighbors.push(
        { x: x + 1, y: y + 1 }, // Down-Right
        { x: x + 1, y: y - 1 }, // Up-Right
        { x: x - 1, y: y + 1 }, // Down-Left
        { x: x - 1, y: y - 1 }  // Up-Left
      );
    }

    return neighbors;
  }

  /**
   * Check if a tile is walkable
   */
  static isTileWalkable(tile, entityFilter = null) {
    // Use the tile's own walkability determination
    if (tile.unwalkable) {
      return false;
    }

    // Apply entity-specific filtering if provided
    if (entityFilter && typeof entityFilter === 'function') {
      return entityFilter(tile);
    }

    return true;
  }

  /**
   * Check if a move is diagonal
   */
  static isDiagonalMove(x1, y1, x2, y2) {
    const dx = Math.abs(x1 - x2);
    const dy = Math.abs(y1 - y2);
    return dx === 1 && dy === 1;
  }

  /**
   * Check if diagonal movement is allowed (both adjacent orthogonal tiles must be walkable)
   * This prevents cutting corners around obstacles
   */
  static canMoveDiagonally(gameMap, x1, y1, x2, y2, entityFilter = null) {
    // Check the two orthogonal tiles adjacent to the diagonal move
    const tile1 = gameMap.getTile(x1, y2); // Vertical adjacent
    const tile2 = gameMap.getTile(x2, y1); // Horizontal adjacent

    // Both adjacent tiles must exist and be walkable
    const tile1Walkable = tile1 && this.isTileWalkable(tile1, entityFilter);
    const tile2Walkable = tile2 && this.isTileWalkable(tile2, entityFilter);

    return tile1Walkable && tile2Walkable;
  }

  /**
   * Reconstruct path from A* node
   */
  static reconstructPath(node) {
    const path = [];
    let current = node;

    while (current) {
      path.unshift({ x: current.x, y: current.y });
      current = current.parent;
    }

    return path;
  }

  /**
   * Serialize a path to JSON
   */
  static serializePath(path) {
    return {
      path: path.map(point => ({ x: point.x, y: point.y })),
      length: path.length,
      cost: this.calculateMovementCost(path),
      generated: new Date().toISOString()
    };
  }

  /**
   * Deserialize a path from JSON
   */
  static deserializePath(data) {
    return data.path || [];
  }
}
