import { Pathfinding } from '../utils/Pathfinding.js';
import { LineOfSight } from '../utils/LineOfSight.js';
import { MAX_VISION_RANGE } from '../config/VisionConfig.js';

import { gameRandom } from '../utils/SeededRandom.js';
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
   */
  static executeRabbitTurn(rabbit, gameMap, player, zombies = []) {
    if (!rabbit || !gameMap || !player) return { success: false };

    const turnResult = {
      rabbitId: rabbit.id,
      actions: [],
      apUsed: 0,
      success: true
    };

    try {
      // 1. Initial Detection Parameters
      const distToPlayer = Math.sqrt(Math.pow(rabbit.logicalX - player.logicalX, 2) + Math.pow(rabbit.logicalY - player.logicalY, 2));
      
      // Rabbit Vicinity Awareness (10 tiles) OR Sight (15 tiles)
      const canSeePlayer = (distToPlayer <= MAX_VISION_RANGE) ? LineOfSight.canSeeEntity(gameMap, rabbit, player, { maxRange: MAX_VISION_RANGE }).hasLineOfSight : false;
      let hasDetectedPlayer = distToPlayer <= 10 || canSeePlayer;

      // 2. Check for nearest Zombie (within 5 squares)
      let nearestZombie = null;
      let minDistToZombie = 6; // Range 5
      
      zombies.forEach(zombie => {
        const dist = Math.abs(rabbit.logicalX - zombie.x) + Math.abs(rabbit.logicalY - zombie.y);
        if (dist < minDistToZombie) {
          minDistToZombie = dist;
          nearestZombie = zombie;
        }
      });

      // While rabbit has AP, execute behavior
      let safetyCounter = 0;
      while (rabbit.currentAP >= 1.0 && safetyCounter < 30) {
        safetyCounter++;
        
        const currentDistToPlayer = Math.sqrt(Math.pow(rabbit.logicalX - player.logicalX, 2) + Math.pow(rabbit.logicalY - player.logicalY, 2));
        
        // Re-check detection every step if not already fleeing
        if (!hasDetectedPlayer) {
          const currentlyVisible = (currentDistToPlayer <= MAX_VISION_RANGE) ? LineOfSight.canSeeEntity(gameMap, rabbit, player, { maxRange: MAX_VISION_RANGE }).hasLineOfSight : false;
          if (currentDistToPlayer <= 10 || currentlyVisible) {
            hasDetectedPlayer = true;
          }
        }

        // A. Flee from Player (if detected in vicinity at any point this turn)
        // Once fleeing starts, continue until safe distance (25) or no AP
        if (hasDetectedPlayer && currentDistToPlayer < 25) {
          const moved = this.attemptFlee(rabbit, gameMap, player.logicalX, player.logicalY, turnResult);
          if (!moved) break; // Trapped
          continue;
        }
        
        // B. Avoid Zombies (within 5 squares)
        if (nearestZombie) {
          const currentDistToZombie = Math.abs(rabbit.logicalX - nearestZombie.logicalX) + Math.abs(rabbit.logicalY - nearestZombie.logicalY);
          if (currentDistToZombie <= 5) {
            const moved = this.attemptFlee(rabbit, gameMap, nearestZombie.logicalX, nearestZombie.logicalY, turnResult);
            if (!moved) break;
            continue;
          }
        }
        
        // C. Random Wander (Max 2 steps per turn)
        if (turnResult.actions.filter(a => a.type === 'MOVE').length < 2) {
          const moved = this.executeRandomWander(rabbit, gameMap, turnResult);
          if (!moved) break;
        } else {
          break; // Done wandering
        }
      }

    } catch (error) {
      console.error('[RabbitAI] Error during rabbit turn:', error);
    }

    turnResult.apUsed = rabbit.maxAP - rabbit.currentAP;
    turnResult.success = true;
    return turnResult;
  }

  /**
   * Attempt to move one step away from a threat
   */
  static attemptFlee(rabbit, gameMap, threatX, threatY, turnResult) {
    const neighbors = Pathfinding.getNeighbors(rabbit.logicalX, rabbit.logicalY, true); // Rabbits can move diagonally
    
    // Evaluate neighbors by distance from threat
    const candidates = neighbors
      .filter(n => this.canMoveToTile(gameMap, n.x, n.y, rabbit))
      .map(n => ({
        x: n.x,
        y: n.y,
        dist: Math.sqrt(Math.pow(n.x - threatX, 2) + Math.pow(n.y - threatY, 2))
      }))
      .sort((a, b) => b.dist - a.dist); // Maximize distance

    if (candidates.length === 0) return false;

    const currentDist = Math.sqrt(Math.pow(rabbit.logicalX - threatX, 2) + Math.pow(rabbit.logicalY - threatY, 2));
    
    // Separate candidates into those that increase distance and those that don't
    const dynamicCandidates = candidates.filter(c => c.dist > currentDist);
    
    // We also want to filter candidates by visited status to prevent back-and-forth loops in corners
    const visited = rabbit.movementPath || [];
    const isVisited = (c) => visited.some(pos => pos.x === c.x && pos.y === c.y);
    
    // 1. Try to find a move that increases distance and is unvisited
    let best = dynamicCandidates.find(c => !isVisited(c));
    
    // 2. If none, try to find any move that increases distance (fallback)
    if (!best) {
      best = dynamicCandidates[0];
    }
    
    // 3. If we still don't have a move that increases distance (e.g. cornered),
    // allow moving to an unvisited tile even if it is closer to the threat (dist <= currentDist)
    if (!best) {
      best = candidates.find(c => !isVisited(c));
    }

    if (best) {
      // Diagonal cost 1.4, Cardinal 1.0
      const apCost = (best.x !== rabbit.logicalX && best.y !== rabbit.logicalY) ? 1.4 : 1.0;
      
      if (rabbit.currentAP >= apCost) {
        const fromPos = { x: rabbit.logicalX, y: rabbit.logicalY };
        // Only commit AP + animation if the logical move actually succeeded;
        // moveEntity rejects blocked edges/occupied tiles, which would otherwise
        // leave the rabbit visually sliding to a tile it isn't on.
        if (gameMap.moveEntity(rabbit.id, best.x, best.y, { snap: false })) {
          rabbit.useAP(apCost);
          rabbit.movementPath.push({ x: best.x, y: best.y });

          turnResult.actions.push({
            type: 'MOVE',
            entityId: rabbit.id,
            data: {
              from: fromPos,
              to: { x: best.x, y: best.y },
              apCost: apCost
            }
          });
          return true;
        }
      }
    }
    
    return false;
  }

  /**
   * Random wiggle
   */
  static executeRandomWander(rabbit, gameMap, turnResult) {
    const directions = Pathfinding.getNeighbors(rabbit.logicalX, rabbit.logicalY, true);
    const shuffled = gameRandom.shuffle(directions);
    
    for (const dir of shuffled) {
      if (this.canMoveToTile(gameMap, dir.x, dir.y, rabbit)) {
        const apCost = (dir.x !== rabbit.logicalX && dir.y !== rabbit.logicalY) ? 1.4 : 1.0;
        
        if (rabbit.currentAP >= apCost) {
          const fromPos = { x: rabbit.logicalX, y: rabbit.logicalY };
          // Guard the move: on rejection, fall through to try another direction
          // rather than spending AP for a move that didn't happen.
          if (gameMap.moveEntity(rabbit.id, dir.x, dir.y, { snap: false })) {
            rabbit.useAP(apCost);
            rabbit.movementPath.push({ x: dir.x, y: dir.y });

            turnResult.actions.push({
              type: 'MOVE',
              entityId: rabbit.id,
              data: {
                from: fromPos,
                to: { x: dir.x, y: dir.y },
                apCost: apCost
              }
            });
            return true;
          }
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
    if (Math.abs(x - rabbit.logicalX) === 1 && Math.abs(y - rabbit.logicalY) === 1) {
      if (!Pathfinding.canMoveDiagonally(gameMap, rabbit.logicalX, rabbit.logicalY, x, y)) {
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
