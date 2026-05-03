import Logger from './Logger.js';

const logger = Logger.scope('LineOfSight');

/**
 * Universal Line of Sight System
 * Pure functional utility for calculating visibility between entities
 * Follows UniversalGoals.md: modular, testable, serializable
 */

export class LineOfSight {
  /**
   * Check if there's a clear line of sight between two points
   * @param {GameMap} gameMap - The game map instance
   * @param {number} startX - Starting X coordinate
   * @param {number} startY - Starting Y coordinate
   * @param {number} endX - Target X coordinate
   * @param {number} endY - Target Y coordinate
   * @param {Object} options - Line of sight options
   * @returns {Object} Line of sight result with blocking information
   */
  static hasLineOfSight(gameMap, startX, startY, endX, endY, options = {}) {
    const {
      maxRange = 15, // Maximum sight range
      ignoreTerrain = [], // Terrain types that don't block sight
      ignoreEntities = [], // Entity IDs that don't block sight
      debug = false
    } = options;

    // Validate inputs
    if (!gameMap || !gameMap.getTile) {
      throw new Error('[LineOfSight] Invalid gameMap provided');
    }

    // Check if points are the same
    if (startX === endX && startY === endY) {
      return {
        hasLineOfSight: true,
        distance: 0,
        blockedBy: null,
        path: [{ x: startX, y: startY }]
      };
    }

    // Calculate distance
    const distance = Math.sqrt(Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2));

    // Check if target is within range
    if (distance > maxRange) {
      return {
        hasLineOfSight: false,
        distance: distance,
        blockedBy: { type: 'range', message: 'Target out of range' },
        path: []
      };
    }

    // PHASE 30 FIX: Robust Bresenham with Corner Blocking
    // Ensure all inputs are integers for grid-based math
    const x0 = Math.round(startX);
    const y0 = Math.round(startY);
    const x1 = Math.round(endX);
    const y1 = Math.round(endY);

    const dx = Math.abs(x1 - x0);
    const dy = Math.abs(y1 - y0);
    const sx = x0 < x1 ? 1 : -1;
    const sy = y0 < y1 ? 1 : -1;
    let err = dx - dy;

    let x = x0;
    let y = y0;

    // Safety counter to prevent hard hangs
    let safety = 0;
    const maxIterations = (dx + dy + 2) * 2;

    const path = [{ x: x0, y: y0 }];

    while (safety < maxIterations) {
      safety++;
      
      const e2 = 2 * err;
      const xChanged = e2 > -dy;
      const yChanged = e2 < dx;

      // DIAGONAL CORNER CHECK: If both X and Y are about to change, check the corners
      if (xChanged && yChanged) {
          const corner1 = gameMap.getTile(x + sx, y);
          const corner2 = gameMap.getTile(x, y + sy);
          
          const isBlocked1 = corner1 && (this.isTerrainBlocking(corner1.terrain, ignoreTerrain) || this.getBlockingEntity(corner1, ignoreEntities));
          const isBlocked2 = corner2 && (this.isTerrainBlocking(corner2.terrain, ignoreTerrain) || this.getBlockingEntity(corner2, ignoreEntities));
          
          // If BOTH cardinal corners block sight, the diagonal path is blocked
          if (isBlocked1 && isBlocked2) {
              return {
                  hasLineOfSight: false,
                  distance: distance,
                  blockedBy: { type: 'corner', position: { x, y } },
                  path: path
              };
          }
      }

      if (xChanged) {
        err -= dy;
        x += sx;
      }
      if (yChanged) {
        err += dx;
        y += sy;
      }

      path.push({ x, y });

      // If we reached the target, we're done - the target tile itself doesn't block sight to itself
      if (x === x1 && y === y1) break;

      // Check intermediate tile
      const tile = gameMap.getTile(x, y);
      if (!tile) {
        return {
          hasLineOfSight: false,
          distance: distance,
          blockedBy: { type: 'bounds', position: { x, y }, message: 'Out of map bounds' },
          path: path
        };
      }

      if (this.isTerrainBlocking(tile.terrain, ignoreTerrain)) {
        return {
          hasLineOfSight: false,
          distance: distance,
          blockedBy: { type: 'terrain', terrain: tile.terrain, position: { x, y } },
          path: path
        };
      }

      const blockingEntity = this.getBlockingEntity(tile, ignoreEntities);
      if (blockingEntity) {
        return {
          hasLineOfSight: false,
          distance: distance,
          blockedBy: { type: 'entity', entity: blockingEntity, position: { x, y } },
          path: path
        };
      }
    }

    // Clear line of sight
    return {
      hasLineOfSight: true,
      distance: distance,
      blockedBy: null,
      path: path
    };
  }

  /**
   * Get all visible tiles from a position within range
   * @param {GameMap} gameMap - The game map instance
   * @param {number} centerX - Center X coordinate
   * @param {number} centerY - Center Y coordinate
   * @param {Object} options - Visibility options
   * @returns {Array} Array of visible tile positions
   */
  static getVisibleTiles(gameMap, centerX, centerY, options = {}) {
    const {
      maxRange = 15,
      ignoreTerrain = [],
      ignoreEntities = []
    } = options;

    const visibleTiles = [];
    const minX = Math.max(0, Math.floor(centerX - maxRange));
    const maxX = Math.min(gameMap.width - 1, Math.ceil(centerX + maxRange));
    const minY = Math.max(0, Math.floor(centerY - maxRange));
    const maxY = Math.min(gameMap.height - 1, Math.ceil(centerY + maxRange));

    for (let y = minY; y <= maxY; y++) {
      for (let x = minX; x <= maxX; x++) {
        // Skip the center tile (entity's own position)
        if (x === centerX && y === centerY) {
          visibleTiles.push({ x, y, distance: 0 });
          continue;
        }

        const losResult = this.hasLineOfSight(gameMap, centerX, centerY, x, y, {
          maxRange,
          ignoreTerrain,
          ignoreEntities
        });

        if (losResult.hasLineOfSight) {
          visibleTiles.push({ x, y, distance: losResult.distance });
        }
      }
    }

    return visibleTiles;
  }

  /**
   * Check if an entity can see another entity
   * @param {GameMap} gameMap - The game map instance
   * @param {Object} observer - Observer entity
   * @param {Object} target - Target entity
   * @param {Object} options - Line of sight options
   * @returns {Object} Line of sight result
   */
  static canSeeEntity(gameMap, observer, target, options = {}) {
    // Don't include the observer or target in entity blocking checks
    const ignoreEntities = [observer.id, target.id, ...(options.ignoreEntities || [])];

    return this.hasLineOfSight(
      gameMap,
      observer.logicalX !== undefined ? observer.logicalX : observer.x,
      observer.logicalY !== undefined ? observer.logicalY : observer.y,
      target.logicalX !== undefined ? target.logicalX : target.x,
      target.logicalY !== undefined ? target.logicalY : target.y,
      { ...options, ignoreEntities }
    );
  }

  /**
   * Generate line path using Bresenham's line algorithm
   * @param {number} x0 - Start X
   * @param {number} y0 - Start Y
   * @param {number} x1 - End X
   * @param {number} y1 - End Y
   * @returns {Array} Array of {x, y} coordinates along the line
   */
  static getLinePath(x0, y0, x1, y1) {
    // Phase 28 Fix: Ensure all inputs are integers to prevent infinite loops in Bresenham's algorithm
    x0 = Math.round(x0);
    y0 = Math.round(y0);
    x1 = Math.round(x1);
    y1 = Math.round(y1);

    const path = [];
    const dx = Math.abs(x1 - x0);
    const dy = Math.abs(y1 - y0);
    const sx = x0 < x1 ? 1 : -1;
    const sy = y0 < y1 ? 1 : -1;
    let err = dx - dy;

    let x = x0;
    let y = y0;

    // Safety counter to prevent hard hangs in case of logic errors
    let safety = 0;
    const maxIterations = (dx + dy + 2) * 2;

    while (safety < maxIterations) {
      safety++;
      path.push({ x, y });

      if (x === x1 && y === y1) break;

      const e2 = 2 * err;
      if (e2 > -dy) {
        err -= dy;
        x += sx;
      }
      if (e2 < dx) {
        err += dx;
        y += sy;
      }
    }
    
    if (safety >= maxIterations) {
      console.warn(`[LineOfSight] getLinePath safety limit reached! (${x0},${y0}) to (${x1},${y1})`);
    }

    return path;
  }

  /**
   * Check if terrain blocks line of sight
   * @param {string} terrain - Terrain type
   * @param {Array} ignoreTerrain - Terrain types to ignore
   * @returns {boolean} Whether terrain blocks sight
   */
  static isTerrainBlocking(terrain, ignoreTerrain = []) {
    if (ignoreTerrain.includes(terrain)) {
      return false;
    }

    // Define which terrains block sight
    const blockingTerrain = ['wall', 'building', 'tree', 'tent_wall'];
    return blockingTerrain.includes(terrain);
  }

  /**
   * Get blocking entity from tile
   * @param {Tile} tile - Tile to check
   * @param {Array} ignoreEntities - Entity IDs to ignore
   * @returns {Object|null} Blocking entity or null
   */
  static getBlockingEntity(tile, ignoreEntities = []) {
    return tile.contents.find(entity => {
      // Skip ignored entities
      if (ignoreEntities.includes(entity.id)) {
        return false;
      }

      // Check if entity has explicit blocksSight property
      if (entity.blocksSight !== undefined) {
        return entity.blocksSight;
      }

      // Doors block sight when closed
      if (entity.type === 'door' || entity.type === 'EntityType.DOOR') {
        return !entity.isOpen;
      }

      // Windows do not block sight (can see through them)
      if (entity.type === 'window' || entity.type === 'EntityType.WINDOW') {
        return false;
      }

      // Define which entity types block sight by default
      const blockingSightTypes = ['building', 'large_obstacle'];
      return blockingSightTypes.includes(entity.type) ||
        (entity.subtype && blockingSightTypes.includes(entity.subtype));
    }) || null;
  }

  /**
   * Debug visualization of line of sight
   * @param {GameMap} gameMap - The game map instance
   * @param {number} startX - Starting X coordinate
   * @param {number} startY - Starting Y coordinate
   * @param {number} endX - Target X coordinate
   * @param {number} endY - Target Y coordinate
   * @param {Object} options - Line of sight options
   */
  static debugLineOfSight(gameMap, startX, startY, endX, endY, options = {}) {
    const result = this.hasLineOfSight(gameMap, startX, startY, endX, endY, { ...options, debug: true });

    logger.debug(`Debug from (${startX}, ${startY}) to (${endX}, ${endY}):`);
    logger.debug(`  Has LOS: ${result.hasLineOfSight}`);
    logger.debug(`  Distance: ${result.distance.toFixed(2)}`);
    logger.debug(`  Path length: ${result.path.length}`);

    if (result.blockedBy) {
      logger.debug(`  Blocked by: ${result.blockedBy.type}`, result.blockedBy);
    }

    // Visual representation in console
    const visibleTiles = this.getVisibleTiles(gameMap, startX, startY, options);
    logger.debug(`  Visible tiles from position: ${visibleTiles.length}`);

    return result;
  }

  /**
   * Calculate field of view for an entity (useful for zombie AI)
   * @param {GameMap} gameMap - The game map instance
   * @param {Object} entity - Entity to calculate FOV for
   * @param {Object} options - FOV options
   * @returns {Object} Field of view data
   */
  static calculateFieldOfView(gameMap, entity, options = {}) {
    const {
      maxRange = entity.sightRange || 10,
      ignoreTerrain = [],
      ignoreEntities = [entity.id]
    } = options;

    const visibleTiles = this.getVisibleTiles(gameMap, entity.x, entity.y, {
      maxRange,
      ignoreTerrain,
      ignoreEntities
    });

    // Find visible entities
    const visibleEntities = [];
    visibleTiles.forEach(tile => {
      const mapTile = gameMap.getTile(tile.x, tile.y);
      if (mapTile && mapTile.contents.length > 0) {
        mapTile.contents.forEach(tileEntity => {
          if (tileEntity.id !== entity.id) {
            visibleEntities.push({
              entity: tileEntity,
              distance: tile.distance,
              position: { x: tile.x, y: tile.y }
            });
          }
        });
      }
    });

    return {
      visibleTiles,
      visibleEntities,
      center: { x: entity.x, y: entity.y },
      range: maxRange
    };
  }
}
