import { LineOfSight } from '../utils/LineOfSight.js';

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

  /**
   * Single LOS implementation lives in LineOfSight (T2 — this used to be a
   * second, drifted Bresenham with its own door-state rules). No maxRange cap
   * here: calculateVisibility already distance-gates by the Vision range.
   */
  static hasLineOfSight(gameMap, x0, y0, x1, y1) {
    return LineOfSight.hasLineOfSight(gameMap, x0, y0, x1, y1, { maxRange: Number.MAX_SAFE_INTEGER }).hasLineOfSight;
  }
}
