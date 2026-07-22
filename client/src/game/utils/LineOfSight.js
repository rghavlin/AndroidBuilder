import Logger from './Logger.js';
import { terrainBlocksSight } from '../map/TerrainTypes.js';

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
    let maxRange = options.maxRange;
    if (typeof maxRange !== 'number' || isNaN(maxRange) || maxRange <= 0) {
      maxRange = 15;
    }
    const {
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
          
          let isBlocked1 = !corner1 || this.isTerrainBlocking(corner1.terrain, ignoreTerrain) || this.getBlockingEntity(corner1, ignoreEntities);
          let isBlocked2 = !corner2 || this.isTerrainBlocking(corner2.terrain, ignoreTerrain) || this.getBlockingEntity(corner2, ignoreEntities);
          
          // Diagonal corner crosses edge walls. If both cardinal paths are blocked by edge walls, the corner is blocked
          if (!isBlocked1 && (this.isEdgeSightBlocked(gameMap, x, y, x + sx, y, ignoreEntities) || this.isEdgeSightBlocked(gameMap, x + sx, y, x + sx, y + sy, ignoreEntities))) isBlocked1 = true;
          if (!isBlocked2 && (this.isEdgeSightBlocked(gameMap, x, y, x, y + sy, ignoreEntities) || this.isEdgeSightBlocked(gameMap, x, y + sy, x + sx, y + sy, ignoreEntities))) isBlocked2 = true;

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

      const prevX = x;
      const prevY = y;

      if (xChanged) {
        err -= dy;
        x += sx;
      }
      if (yChanged) {
        err += dx;
        y += sy;
      }

      // Edge wall check along the path
      if (xChanged && !yChanged) {
          if (this.isEdgeSightBlocked(gameMap, prevX, prevY, x, y, ignoreEntities)) {
              return { hasLineOfSight: false, distance, blockedBy: { type: 'edge', position: { x, y } }, path };
          }
      } else if (yChanged && !xChanged) {
          if (this.isEdgeSightBlocked(gameMap, prevX, prevY, x, y, ignoreEntities)) {
              return { hasLineOfSight: false, distance, blockedBy: { type: 'edge', position: { x, y } }, path };
          }
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
   * Get all visible tiles from a position within range using Recursive Shadowcasting
   * @param {GameMap} gameMap - The game map instance
   * @param {number} centerX - Center X coordinate
   * @param {number} centerY - Center Y coordinate
   * @param {Object} options - Visibility options
   * @returns {Array} Array of visible tile positions
   */
  static getVisibleTiles(gameMap, centerX, centerY, options = {}) {
    let maxRange = options.maxRange;
    if (typeof maxRange !== 'number' || isNaN(maxRange) || maxRange <= 0) {
      maxRange = 15;
    }
    const {
      ignoreTerrain = [],
      ignoreEntities = []
    } = options;

    if (!gameMap || !gameMap.getTile) {
      throw new Error('[LineOfSight] Invalid gameMap provided');
    }

    const visibleMap = new Map();
    visibleMap.set(`${centerX},${centerY}`, { x: centerX, y: centerY, distance: 0 });

    const origin = { x: centerX, y: centerY };

    for (let i = 0; i < 4; i++) {
      const quadrant = new Quadrant(i, origin);

      const isWall = (tile) => {
        if (!tile) return false;
        const { x, y } = quadrant.transform(tile);
        if (x < 0 || x >= gameMap.width || y < 0 || y >= gameMap.height) return true; // Treat out-of-bounds as blocking
        const mapTile = gameMap.getTile(x, y);
        if (!mapTile) return true;
        
        const blockingEntity = this.getBlockingEntity(mapTile, ignoreEntities);
        if (blockingEntity && (blockingEntity.type === 'door' || blockingEntity.type === 'garage_door')) {
          return this.isTerrainBlocking(mapTile.terrain, ignoreTerrain);
        }
        
        return this.isTerrainBlocking(mapTile.terrain, ignoreTerrain) || blockingEntity;
      };

      const isEnteringWallBlocked = (tile) => {
        if (!tile) return false;
        const { x, y } = quadrant.transform(tile);
        if (x < 0 || x >= gameMap.width || y < 0 || y >= gameMap.height) return false;
        const mapTile = gameMap.getTile(x, y);
        if (!mapTile) return false;
        
        // Solid wall or blocking terrain blocks sight (we want to reveal solid walls)
        if (this.isTerrainBlocking(mapTile.terrain, ignoreTerrain)) {
          return false;
        }

        // Blocking entity: if it is a solid obstacle (not a door/window), we want to reveal it.
        // If it is a door, it is edge-aligned, so we let it fall through to edge checks.
        const blockingEntity = this.getBlockingEntity(mapTile, ignoreEntities);
        if (blockingEntity && blockingEntity.type !== 'door' && blockingEntity.type !== 'garage_door') {
          return false;
        }

        // Use the robust hasLineOfSight directly to verify if the tile's entry path is clear
        const res = this.hasLineOfSight(gameMap, centerX, centerY, x, y, { ignoreEntities, ignoreTerrain, maxRange });
        return !res.hasLineOfSight;
      };

      const isFloor = (tile) => {
        if (!tile) return false;
        return !isWall(tile);
      };

      const reveal = (tile) => {
        const { x, y } = quadrant.transform(tile);
        if (x >= 0 && x < gameMap.width && y >= 0 && y < gameMap.height) {
          const key = `${x},${y}`;
          if (!visibleMap.has(key)) {
            const dx = x - centerX;
            const dy = y - centerY;
            const distance = Math.sqrt(dx * dx + dy * dy);
            visibleMap.set(key, { x, y, distance });
          }
        }
      };

      const isSymmetric = (row, tile) => {
        const [depth, col] = tile;
        const colSlope = col / depth;
        return colSlope >= row.startSlope && colSlope <= row.endSlope;
      };

      const scan = (row) => {
        if (row.depth > maxRange) return;

        let prevTile = null;
        for (const tile of row.tiles()) {
          const wall = isWall(tile);
          const enteringBlocked = isEnteringWallBlocked(tile);
          const blocking = wall || enteringBlocked;
          const sym = isSymmetric(row, tile);

          if (!enteringBlocked && (wall || sym)) {
            reveal(tile);
          }

          if (prevTile !== null) {
            const prevWall = isWall(prevTile);
            const prevEnteringBlocked = isEnteringWallBlocked(prevTile);
            const prevBlocking = prevWall || prevEnteringBlocked;

            if (prevBlocking && !blocking) {
              row.startSlope = slope(tile);
            }
            if (!prevBlocking && blocking) {
              const nextRow = row.next();
              nextRow.endSlope = slope(tile);
              scan(nextRow);
            }
          }
          prevTile = tile;
        }

        const lastBlocking = prevTile !== null && (isWall(prevTile) || isEnteringWallBlocked(prevTile));
        if (prevTile !== null && !lastBlocking) {
          scan(row.next());
        }
      };

      const firstRow = new Row(1, -1, 1);
      scan(firstRow);
    }

    return Array.from(visibleMap.values());
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

    // Single source of truth: TERRAIN_PROPS (T2)
    return terrainBlocksSight(terrain);
  }

  /**
   * THE door-state sight matrix (R6#1 — previously three divergent versions):
   * a door blocks sight iff it is closed AND intact. Open, damaged, or broken
   * doors let sight through. Doors only carry `isDamaged`; `isBroken` is
   * checked too so window-like breachables share the rule safely.
   * @param {Object} door - Door/garage-door entity
   * @returns {boolean} Whether the door currently blocks sight
   */
  static doorBlocksSight(door) {
    return !door.isOpen && !door.isDamaged && !door.isBroken;
  }

  /**
   * Check if an edge wall blocks sight between two adjacent tiles
   */
  static isEdgeSightBlocked(gameMap, x1, y1, x2, y2, ignoreEntities = []) {
    const t1 = gameMap.getTile(x1, y1);
    const t2 = gameMap.getTile(x2, y2);
    if (!t1 || !t2) return true;

    let dir1to2 = null;
    let dir2to1 = null;
    if (x2 > x1) { dir1to2 = 'e'; dir2to1 = 'w'; }
    else if (x2 < x1) { dir1to2 = 'w'; dir2to1 = 'e'; }
    else if (y2 > y1) { dir1to2 = 's'; dir2to1 = 'n'; }
    else if (y2 < y1) { dir1to2 = 'n'; dir2to1 = 's'; }
    if (!dir1to2) return false;

    const hasWall = (t1.edgeWalls && t1.edgeWalls[dir1to2]) || (t2.edgeWalls && t2.edgeWalls[dir2to1]);

    // Doors clear their edge-wall flag at map load (the door entity takes over
    // blocking), so a closed door on this edge must block sight even when no
    // wall flag remains.
    const breachable1 = t1.contents.filter(e => (e.type === 'door' || e.type === 'window' || e.type === 'garage_door') && (!e.edge || e.edge === dir1to2));
    const breachable2 = t2.contents.filter(e => (e.type === 'door' || e.type === 'window' || e.type === 'garage_door') && (!e.edge || e.edge === dir2to1));
    const allBreachable = [...breachable1, ...breachable2];

    if (!hasWall && allBreachable.length === 0) return false;

    if (allBreachable.length === 0) return true; // Solid wall blocks sight

    for (const e of allBreachable) {
        if (ignoreEntities.includes(e.id)) continue;
        if ((e.type === 'door' || e.type === 'garage_door') && this.doorBlocksSight(e)) return true; // Closed intact door blocks sight
    }

    return false;
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

      // Doors: if they are edge-aligned, they only block sight when crossing their edge, NOT the entire tile
      if ((entity.type === 'door' || entity.type === 'garage_door') && entity.edge !== undefined) {
        return false;
      }

      // Doors block sight per the single door-state matrix (closed + intact)
      if (entity.type === 'door' || entity.type === 'garage_door') {
        return this.doorBlocksSight(entity);
      }

      // Windows do not block sight (can see through them)
      if (entity.type === 'window') {
        return false;
      }

      // Check if entity has explicit blocksSight property
      if (entity.blocksSight !== undefined) {
        return entity.blocksSight;
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

// --- Recursive Shadowcasting Helpers ---

class Quadrant {
  static NORTH = 0;
  static EAST = 1;
  static SOUTH = 2;
  static WEST = 3;

  constructor(cardinal, origin) {
    this.cardinal = cardinal;
    this.ox = origin.x;
    this.oy = origin.y;
  }

  transform(tile) {
    const [row, col] = tile;
    switch (this.cardinal) {
      case Quadrant.NORTH:
        return { x: this.ox + col, y: this.oy - row };
      case Quadrant.SOUTH:
        return { x: this.ox + col, y: this.oy + row };
      case Quadrant.EAST:
        return { x: this.ox + row, y: this.oy + col };
      case Quadrant.WEST:
        return { x: this.ox - row, y: this.oy + col };
      default:
        throw new Error(`Invalid cardinal direction: ${this.cardinal}`);
    }
  }
}

class Row {
  constructor(depth, startSlope, endSlope) {
    this.depth = depth;
    this.startSlope = startSlope;
    this.endSlope = endSlope;
  }

  tiles() {
    const minCol = Math.floor(this.depth * this.startSlope + 0.5);
    const maxCol = Math.ceil(this.depth * this.endSlope - 0.5);
    const result = [];
    for (let col = minCol; col <= maxCol; col++) {
      result.push([this.depth, col]);
    }
    return result;
  }

  next() {
    return new Row(this.depth + 1, this.startSlope, this.endSlope);
  }
}

function slope(tile) {
  const [rowDepth, col] = tile;
  return (2 * col - 1) / (2 * rowDepth);
}
