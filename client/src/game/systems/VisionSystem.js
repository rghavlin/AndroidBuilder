export class VisionSystem {
  static process(entities, worldManager, engine) {
    const entityList = Array.isArray(entities)
      ? entities
      : (entities instanceof Map ? Array.from(entities.values()) : Object.values(entities));

    const gameMap = engine ? engine.gameMap : (worldManager ? worldManager.gameMap : null);

    // 1. Process standard Vision component LoS updates if map is available
    if (gameMap) {
      const globalVisionDirty = !!gameMap._visionDirty;
      if (globalVisionDirty) {
        gameMap._visionDirty = false;
      }
      for (const entity of entityList) {
        if (entity.hasComponent('Vision') && entity.hasComponent('Position')) {
          const vision = entity.getComponent('Vision');
          const position = entity.getComponent('Position');
          
          if (globalVisionDirty || vision._visionDirty) {
            const { visibleTiles, visibleEntities } = this.calculateVisibility(
              gameMap,
              position.x,
              position.y,
              vision.range,
              entityList,
              entity.id
            );
            
            vision.visibleTiles = visibleTiles;
            vision.visibleEntities = visibleEntities;
            vision._visionDirty = false;
          }
        }
      }
    }

    // 2. Process legacy LightEmitter FOV/lighting recalculation
    for (const entity of entityList) {
      if (entity.hasComponent('Position') && entity.hasComponent('LightEmitter')) {
        const position = entity.getComponent('Position');
        const lightEmitter = entity.getComponent('LightEmitter');

        if (lightEmitter.isOn) {
          if (worldManager && typeof worldManager.recalculateLighting === 'function') {
            worldManager.recalculateLighting(position.x, position.y, lightEmitter.radius, lightEmitter.intensity);
          } else if (engine && typeof engine.recalculateFOV === 'function') {
            engine.recalculateFOV({ x: position.x, y: position.y });
          }
        }
      }
    }
  }

  static calculateVisibility(gameMap, startX, startY, range, allEntities, observerId) {
    const visibleTiles = [];
    const visibleEntities = [];

    // Scan bounding box within map boundaries
    const minX = Math.max(0, startX - range);
    const maxX = Math.min(gameMap.width - 1, startX + range);
    const minY = Math.max(0, startY - range);
    const maxY = Math.min(gameMap.height - 1, startY + range);

    for (let y = minY; y <= maxY; y++) {
      for (let x = minX; x <= maxX; x++) {
        const dx = x - startX;
        const dy = y - startY;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance <= range) {
          if (this.hasLineOfSight(gameMap, startX, startY, x, y)) {
            visibleTiles.push({ x, y });

            // Find entities on this tile
            const tile = gameMap.getTile(x, y);
            if (tile && tile.contents && Array.isArray(tile.contents)) {
              for (const entity of tile.contents) {
                if (entity.id !== observerId) {
                  visibleEntities.push(entity.id);
                }
              }
            }
          }
        }
      }
    }

    return { visibleTiles, visibleEntities };
  }

  static hasLineOfSight(gameMap, x0, y0, x1, y1) {
    if (x0 === x1 && y0 === y1) return true;

    x0 = Math.round(x0);
    y0 = Math.round(y0);
    x1 = Math.round(x1);
    y1 = Math.round(y1);

    const dx = Math.abs(x1 - x0);
    const dy = Math.abs(y1 - y0);
    const sx = x0 < x1 ? 1 : -1;
    const sy = y0 < y1 ? 1 : -1;
    let err = dx - dy;

    let x = x0;
    let y = y0;

    const maxIterations = (dx + dy + 2) * 2;
    let safety = 0;

    while (safety < maxIterations) {
      safety++;

      const e2 = 2 * err;
      const xChanged = e2 > -dy;
      const yChanged = e2 < dx;

      // DIAGONAL CORNER CHECK: If both X and Y are about to change, check the corners
      if (xChanged && yChanged) {
        const corner1 = gameMap.getTile(x + sx, y);
        const corner2 = gameMap.getTile(x, y + sy);
        
        let isBlocked1 = !corner1 || this.isTileBlocking(gameMap, x + sx, y) || this.isEdgeBlocked(gameMap, x, y, x + sx, y);
        let isBlocked2 = !corner2 || this.isTileBlocking(gameMap, x, y + sy) || this.isEdgeBlocked(gameMap, x, y, x, y + sy);

        if (isBlocked1 && isBlocked2) {
          return false;
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

      // Check edge block along the cardinal step
      if (this.isEdgeBlocked(gameMap, prevX, prevY, x, y)) {
        return false;
      }

      if (x === x1 && y === y1) {
        break;
      }

      // Check intermediate tile
      if (this.isTileBlocking(gameMap, x, y)) {
        return false;
      }
    }

    return true;
  }

  static isTileBlocking(gameMap, x, y) {
    const tile = gameMap.getTile(x, y);
    if (!tile) return true; // Out of bounds blocks sight

    // Terrain check
    const blockingTerrain = ['wall', 'building', 'tree', 'tent_wall', 'fence'];
    if (blockingTerrain.includes(tile.terrain)) {
      return true;
    }

    // Entity contents check
    if (tile.contents && Array.isArray(tile.contents)) {
      for (const entity of tile.contents) {
        // Doors block sight when closed and not broken
        if (entity.type === 'door') {
          if (entity.edge !== undefined) continue;
          if (!entity.isOpen && !entity.isBroken) {
            return true;
          }
        }
        // Windows do not block sight
        if (entity.type === 'window') {
          continue;
        }
        if (entity.blocksSight === true) {
          return true;
        }
        if (['building', 'large_obstacle'].includes(entity.type) || 
            (entity.subtype && ['building', 'large_obstacle'].includes(entity.subtype))) {
          return true;
        }
      }
    }

    return false;
  }

  static isEdgeBlocked(gameMap, x1, y1, x2, y2) {
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
    if (!hasWall) return false;

    // Check if there is a door/window on that edge
    const breachable1 = t1.contents.filter(e => (e.type === 'door' || e.type === 'window') && (!e.edge || e.edge === dir1to2));
    const breachable2 = t2.contents.filter(e => (e.type === 'door' || e.type === 'window') && (!e.edge || e.edge === dir2to1));
    const allBreachable = [...breachable1, ...breachable2];

    if (allBreachable.length === 0) return true; // Solid wall blocks sight

    for (const e of allBreachable) {
      if ((e.type === 'door') && !e.isOpen && !e.isBroken) {
        return true; // Closed door blocks sight
      }
      // Open doors or windows (even closed/broken) allow sight
    }

    return false;
  }
}
