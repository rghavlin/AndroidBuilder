import { Pathfinding } from '../utils/Pathfinding.js';
import { LineOfSight } from '../utils/LineOfSight.js';

/**
 * Rabbit AI system
 * Handles fleeing behavior for Rabbit entities
 */
export class RabbitAI {
  /**
   * Execute rabbit behavior for its turn
   * @param {Rabbit} rabbit - The rabbit entity
   * @param {GameMap} gameMap - The game map
   * @param {Entity} player - The player entity
   * @param {Array} zombies - List of all zombies on map
   * @returns {Object} - Result of the turn
   */
  static executeRabbitTurn(rabbit, gameMap, player, zombies = []) {
    if (!rabbit || !gameMap || !player) return { success: false };

    rabbit.startTurn();
    const turnResult = {
      rabbitId: rabbit.id,
      actions: [],
      apUsed: 0
    };

    try {
      // 1. Initial Detection Parameters
      const distToPlayer = Math.sqrt(Math.pow(rabbit.x - player.x, 2) + Math.pow(rabbit.y - player.y, 2));
      
      // Rabbit Vicinity Awareness (10 tiles) OR Sight (15 tiles)
      const canSeePlayer = (distToPlayer <= 15) ? LineOfSight.canSeeEntity(gameMap, rabbit, player, { maxRange: 15 }).hasLineOfSight : false;
      let hasDetectedPlayer = distToPlayer <= 10 || canSeePlayer;

      // 2. Check for nearest Zombie (within 5 squares)
      let nearestZombie = null;
      let minDistToZombie = 6; // Range 5
      
      zombies.forEach(zombie => {
        const dist = Math.abs(rabbit.x - zombie.x) + Math.abs(rabbit.y - zombie.y);
        if (dist < minDistToZombie) {
          minDistToZombie = dist;
          nearestZombie = zombie;
        }
      });

      // While rabbit has AP, execute behavior
      let safetyCounter = 0;
      while (rabbit.currentAP >= 1.0 && safetyCounter < 30) {
        safetyCounter++;
        
        const currentDistToPlayer = Math.sqrt(Math.pow(rabbit.x - player.x, 2) + Math.pow(rabbit.y - player.y, 2));
        
        // Re-check detection every step if not already fleeing
        if (!hasDetectedPlayer) {
          const currentlyVisible = (currentDistToPlayer <= 15) ? LineOfSight.canSeeEntity(gameMap, rabbit, player, { maxRange: 15 }).hasLineOfSight : false;
          if (currentDistToPlayer <= 10 || currentlyVisible) {
            hasDetectedPlayer = true;
          }
        }

        // A. Flee from Player (if detected in vicinity at any point this turn)
        // Once fleeing starts, continue until safe distance (25) or no AP
        if (hasDetectedPlayer && currentDistToPlayer < 25) {
          const moved = this.attemptFlee(rabbit, gameMap, player.x, player.y, turnResult);
          if (!moved) break; // Trapped
          continue;
        }
        
        // B. Avoid Zombies (within 5 squares)
        if (nearestZombie) {
          const currentDistToZombie = Math.abs(rabbit.x - nearestZombie.x) + Math.abs(rabbit.y - nearestZombie.y);
          if (currentDistToZombie <= 5) {
            const moved = this.attemptFlee(rabbit, gameMap, nearestZombie.x, nearestZombie.y, turnResult);
            if (!moved) break;
            continue;
          }
        }
        
        // C. Random Wander (Max 2 steps per turn)
        if (turnResult.actions.filter(a => a.type === 'wander').length < 2) {
          const moved = this.executeRandomWander(rabbit, gameMap, turnResult);
          if (!moved) break;
        } else {
          break; // Done wandering
        }
      }

    } catch (error) {
      console.error('[RabbitAI] Error during rabbit turn:', error);
    }

    rabbit.endTurn();
    turnResult.apUsed = rabbit.maxAP - rabbit.currentAP;
    turnResult.success = true;
    return turnResult;
  }

  /**
   * Attempt to move one step away from a threat
   */
  static attemptFlee(rabbit, gameMap, threatX, threatY, turnResult) {
    const neighbors = Pathfinding.getNeighbors(rabbit.x, rabbit.y, true); // Rabbits can move diagonally
    
    // Evaluate neighbors by distance from threat
    const candidates = neighbors
      .filter(n => this.canMoveToTile(gameMap, n.x, n.y, rabbit))
      .map(n => ({
        x: n.x,
        y: n.y,
        dist: Math.sqrt(Math.pow(n.x - threatX, 2) + Math.pow(n.y - threatY, 2))
      }))
      .sort((a, b) => b.dist - a.dist); // Maximize distance

    if (candidates.length > 0 && candidates[0].dist > Math.sqrt(Math.pow(rabbit.x - threatX, 2) + Math.pow(rabbit.y - threatY, 2))) {
      const best = candidates[0];
      
      // Diagonal cost 1.4, Cardinal 1.0
      const apCost = (best.x !== rabbit.x && best.y !== rabbit.y) ? 1.4 : 1.0;
      
      if (rabbit.currentAP >= apCost) {
        const fromPos = { x: rabbit.x, y: rabbit.y };
        gameMap.moveEntity(rabbit.id, best.x, best.y);
        rabbit.useAP(apCost);
        rabbit.movementPath.push({ x: best.x, y: best.y });
        
        turnResult.actions.push({
          type: 'flee',
          from: fromPos,
          to: { x: best.x, y: best.y },
          apCost: apCost
        });
        return true;
      }
    }
    
    return false;
  }

  /**
   * Random wiggle
   */
  static executeRandomWander(rabbit, gameMap, turnResult) {
    const directions = Pathfinding.getNeighbors(rabbit.x, rabbit.y, true);
    const shuffled = directions.sort(() => Math.random() - 0.5);
    
    for (const dir of shuffled) {
      if (this.canMoveToTile(gameMap, dir.x, dir.y, rabbit)) {
        const apCost = (dir.x !== rabbit.x && dir.y !== rabbit.y) ? 1.4 : 1.0;
        
        if (rabbit.currentAP >= apCost) {
          const fromPos = { x: rabbit.x, y: rabbit.y };
          gameMap.moveEntity(rabbit.id, dir.x, dir.y);
          rabbit.useAP(apCost);
          rabbit.movementPath.push({ x: dir.x, y: dir.y });
          
          turnResult.actions.push({
            type: 'wander',
            from: fromPos,
            to: { x: dir.x, y: dir.y },
            apCost: apCost
          });
          return true;
        }
      }
    }
    return false;
  }

  /**
   * Check if a tile is valid for rabbit movement
   */
  static canMoveToTile(gameMap, x, y, rabbit) {
    const tile = gameMap.getTile(x, y);
    if (!tile || !tile.isWalkable()) return false;
    
    // For diagonals, prevent cutting corners
    if (Math.abs(x - rabbit.x) === 1 && Math.abs(y - rabbit.y) === 1) {
      if (!Pathfinding.canMoveDiagonally(gameMap, rabbit.x, rabbit.y, x, y)) {
        return false;
      }
    }

    // Check for blocking entities
    const blocking = tile.contents.some(e => 
      e.blocksMovement && e.id !== rabbit.id
    );
    
    return !blocking;
  }
}
