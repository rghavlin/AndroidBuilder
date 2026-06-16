export class FireSystem {
  static processTileFires(gameMap) {
    if (!gameMap || !gameMap.tiles) return;
    
    // Iterate over all tiles
    for (let x = 0; x < gameMap.width; x++) {
      for (let y = 0; y < gameMap.height; y++) {
        const tile = gameMap.getTile(x, y);
        if (tile && tile.fireTurns > 0) {
          tile.fireTurns--;
          if (tile.fireTurns <= 0) {
            // Extinguish, could leave ashes or emit an event
            if (gameMap.engine) {
               gameMap.engine.emit('tileFireExtinguished', { x, y });
            }
          }
        }
      }
    }
  }

  static processEntityFires(gameMap) {
    if (!gameMap) return;
    for (const entity of gameMap.entityMap.values()) {
      if (!entity) continue;
      const burnable = entity.getComponent('Burnable');
      const health = entity.getComponent('Health');
      
      if (burnable && health && burnable.fireTurns > 0) {
        burnable.fireTurns--;
        
        // Entity takes fire damage
        const fireDamage = Math.max(1, Math.floor(Math.random() * 4) + 2 - (burnable.fireResistance || 0)); // 2-5 damage base
        entity.takeDamage(fireDamage, { id: 'fire', type: 'hazard' });
      }
    }
  }

  static checkTileIgnition(entity, gameMap) {
    if (!gameMap || !entity) return;
    
    const ex = entity.logicalX !== undefined ? entity.logicalX : entity.x;
    const ey = entity.logicalY !== undefined ? entity.logicalY : entity.y;
    const tile = gameMap.getTile(ex, ey);

    if (tile && tile.fireTurns > 0) {
      const burnable = entity.getComponent('Burnable');
      if (burnable) {
        burnable.fireTurns = 2; // Catch fire from tile
        const fireDamage = Math.max(1, Math.floor(Math.random() * 4) + 2 - (burnable.fireResistance || 0));
        entity.takeDamage(fireDamage, { id: 'fire_tile', type: 'hazard' });
      }
    }
  }

  static ignite(target, turns = 2) {
    if (!target) return;
    if (target.isDead && target.isDead()) return; // Entities that are dead
    
    // If it's a tile
    if (target.x !== undefined && target.y !== undefined && typeof target.getComponent !== 'function') {
      target.fireTurns = turns;
      return;
    }

    // If it's an entity
    if (typeof target.getComponent === 'function') {
      const burnable = target.getComponent('Burnable');
      if (burnable) {
        burnable.fireTurns = turns;
      } else if (target.fireTurns !== undefined) {
        // Fallback for objects that aren't fully ECS yet but have the property
        target.fireTurns = turns;
      }
    }
  }
}
