import { gameRandom } from '../utils/SeededRandom.js';
export class FireSystem {
  // NOTE: tile-fire ticking lives on GameMap.processTileFires(), which iterates
  // the sparse gameMap.activeFires index and self-cleans extinguished tiles.
  // ignite() below is the single registrar for that index.

  static processEntityFires(gameMap) {
    if (!gameMap) return;
    for (const entity of gameMap.entityMap.values()) {
      if (!entity) continue;
      const burnable = entity.getComponent('Burnable');
      const health = entity.getComponent('Health');
      
      if (burnable && health && burnable.fireTurns > 0) {
        burnable.fireTurns--;
        
        // Entity takes fire damage
        const fireDamage = Math.max(1, gameRandom.nextInt(0, 3) + 2 - (burnable.fireResistance || 0)); // 2-5 damage base
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
        const fireDamage = Math.max(1, gameRandom.nextInt(0, 3) + 2 - (burnable.fireResistance || 0));
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
      // Register in the sparse active-fire index so processTileFires (which
      // iterates only active fires) ticks and eventually extinguishes it.
      if (target.gameMap?.activeFires) {
        target.gameMap.activeFires.add(`${target.x},${target.y}`);
      }
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
