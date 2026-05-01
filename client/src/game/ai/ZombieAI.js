import { EntityType } from '../entities/Entity.js';
import { MovementHelper } from '../utils/MovementHelper.js';
import { Pathfinding } from '../utils/Pathfinding.js';
import { ScentTrail } from '../utils/ScentTrail.js';
import { LineOfSight } from '../utils/LineOfSight.js';
import audioManager from '../utils/AudioManager.js';
import { getZombieType } from '../entities/ZombieTypes.js';
import GameEvents, { GAME_EVENT } from '../utils/GameEvents.js';

/**
 * Zombie AI system implementing the behavior loop from ZombieInfo.md
 * Handles zombie decision making and actions during their turn.
 * Flattened for Phase 18 to prevent mid-turn state loss.
 */
export class ZombieAI {
  /**
   * Execute zombie behavior loop for a single zombie's turn.
   */
  static executeZombieTurn(zombie, gameMap, player, playerCardinalPositions, investigationContext) {
    const turnResult = {
      entityId: zombie.id,
      actions: [],
      behaviorTriggered: 'idle',
      success: true
    };

    const lastSeenTaggedTiles = investigationContext || new Set();
    let safetyCounter = 0;
    const maxActions = 20; 

    console.log(`[ZombieAI] Starting turn for zombie ${zombie.id} at (${zombie.logicalX}, ${zombie.logicalY}) with ${zombie.currentAP} AP`);

    // Force-sync logical coordinates to prevent drift
    zombie.logicalX = Math.floor(zombie.x);
    zombie.logicalY = Math.floor(zombie.y);

    const initialCanSee = zombie.canSeeEntity(gameMap, player);
    if (initialCanSee) {
        zombie.setTargetSighted(player.logicalX, player.logicalY);
    }

    while (zombie.currentAP > 0.05 && turnResult.actions.length < maxActions && safetyCounter < 100) {
      safetyCounter++;
      
      const canSee = zombie.canSeeEntity(gameMap, player);
      const isAdjacent = zombie.isAdjacentTo(player.logicalX, player.logicalY);
      const isDiagonal = zombie.isDiagonalTo(player.logicalX, player.logicalY);

      console.log(`[ZombieAI] ${zombie.id} step ${safetyCounter}: AP=${zombie.currentAP.toFixed(1)}, canSee=${canSee}, behavior=${zombie.behaviorState}`);

      let actionResult = null;

      // 1. COMBAT (Priority 1: Attack player if cardinally adjacent)
      if (canSee && isAdjacent && !isDiagonal) {
           const finalDist = Math.abs(zombie.logicalX - player.logicalX) + Math.abs(zombie.logicalY - player.logicalY);
           if (finalDist <= 1) {
             console.log(`[ZombieAI] ⚔️ ${zombie.id} is attacking player. Distance=${finalDist}, Pos=(${zombie.logicalX}, ${zombie.logicalY}), Player=(${player.logicalX}, ${player.logicalY})`);
             const attackResult = this.attemptAttack(zombie, player);
             actionResult = {
               type: 'ATTACK',
               success: true,
               entityId: zombie.id,
               data: { ...attackResult, targetId: player.id, targetType: 'player', from: { x: zombie.logicalX, y: zombie.logicalY }, to: { x: player.logicalX, y: player.logicalY } }
             };
           } else {
             console.warn(`[ZombieAI] ⚠️ ${zombie.id} distance check failed for attack! finalDist=${finalDist}. Logic reported adjacent=${isAdjacent}. Skipping attack and seeking move.`);
           }
      }
      // 2. PURSUIT (Priority 2: Move toward player if visible)
      else if (canSee) {
          zombie.behaviorState = 'pursuing';
          zombie.setTargetSighted(player.logicalX, player.logicalY);
          
          const distToPlayer = Math.abs(zombie.logicalX - player.logicalX) + Math.abs(zombie.logicalY - player.logicalY);

          // A) CLOSE RANGE: Swarm/Surround logic (Dist <= 3)
          if (distToPlayer <= 3 && playerCardinalPositions && playerCardinalPositions.length > 0) {
              const targetSpots = [...playerCardinalPositions].sort((a, b) => {
                  const distA = Math.abs(a.x - zombie.logicalX) + Math.abs(a.y - zombie.logicalY);
                  const distB = Math.abs(b.x - zombie.logicalX) + Math.abs(b.y - zombie.logicalY);
                  return distA - distB;
              });

              let swarmMoveFound = false;
              for (const spot of targetSpots) {
                  const tile = gameMap.getTile(spot.x, spot.y);
                  const isOccupiedByOther = tile && tile.contents.some(e => e.type === EntityType.ZOMBIE && e.id !== zombie.id);
                  if (isOccupiedByOther) continue;

                  // Only move if it's an improvement or maintaining adjacency
                  const candDist = Math.abs(spot.x - player.logicalX) + Math.abs(spot.y - player.logicalY);
                  if (candDist > distToPlayer && distToPlayer <= 1) continue;

                  actionResult = this.attemptMoveTowards(zombie, gameMap, spot.x, spot.y);
                  if (actionResult.success) {
                      swarmMoveFound = true;
                      break;
                  }
              }

              if (swarmMoveFound) {
                  turnResult.actions.push(actionResult);
                  continue;
              }

              // B) WAIT logic: If all spots are blocked, wait and growl
              console.log(`[ZombieAI] ${zombie.id} is blocked by swarm. Waiting...`);
              zombie.useAP(1.0);
              GameEvents.emit(GAME_EVENT.ZOMBIE_WAIT, { zombie });
              actionResult = { success: true, type: 'WAIT', entityId: zombie.id, data: { apCost: 1.0 } };
          } else {
              // C) LONG RANGE: Greedy Pursuit
              const neighbors = this.getNeighbors(zombie.logicalX, zombie.logicalY, true);
              neighbors.sort((a, b) => {
                  const distA = Math.abs(a.x - player.logicalX) + Math.abs(a.y - player.logicalY);
                  const distB = Math.abs(b.x - player.logicalX) + Math.abs(b.y - player.logicalY);
                  return distA - distB;
              });

              let moveFound = false;
              for (const cand of neighbors) {
                  const candDist = Math.abs(cand.x - player.logicalX) + Math.abs(cand.y - player.logicalY);
                  
                  // Phase 28 Fix: Only move if it actually gets us closer!
                  if (candDist >= distToPlayer) continue;

                  actionResult = this.attemptMoveTowards(zombie, gameMap, cand.x, cand.y);
                  if (actionResult.success) {
                      moveFound = true;
                      break;
                  }
              }

              if (!moveFound) {
                  actionResult = { success: false, reason: 'Pursuit stuck' };
              }
          }
      }
      // 3. INVESTIGATION (Priority 3: Move toward LKP or Noise)
      else if (zombie.lastSeen || zombie.heardNoise) {
          const targetX = zombie.lastSeen ? zombie.targetSightedCoords.x : zombie.noiseCoords.x;
          const targetY = zombie.lastSeen ? zombie.targetSightedCoords.y : zombie.noiseCoords.y;
          
          console.log(`[ZombieAI] ${zombie.id} Investigating LKP at (${targetX}, ${targetY}). Current: (${zombie.logicalX}, ${zombie.logicalY})`);

          if (zombie.logicalX === targetX && zombie.logicalY === targetY) {
              zombie.clearLastSeen();
              zombie.clearNoiseHeard();
              zombie.behaviorState = 'wandering';
              continue;
          } else {
              zombie.behaviorState = 'investigating';
              
              // GREEDY INVESTIGATION: Try direct neighbors first to avoid tactical flanking
              const neighbors = this.getNeighbors(zombie.logicalX, zombie.logicalY, true);
              neighbors.sort((a, b) => {
                  const distA = Math.abs(a.x - targetX) + Math.abs(a.y - targetY);
                  const distB = Math.abs(b.x - targetX) + Math.abs(b.y - targetY);
                  return distA - distB;
              });

              let moveFound = false;
              for (const cand of neighbors) {
                  actionResult = this.attemptMoveTowards(zombie, gameMap, cand.x, cand.y);
                  if (actionResult.success) {
                      moveFound = true;
                      break;
                  }
              }

              if (!moveFound) {
                  console.warn(`[ZombieAI] ${zombie.id} Investigation blocked to (${targetX}, ${targetY})`);
                  zombie.clearLastSeen();
                  zombie.clearNoiseHeard();
              }
          }
      }
      // 4. WANDER (Priority 4: Random movement)
      else {
          zombie.behaviorState = 'wandering';
          actionResult = this.executeRandomWanderStep(zombie, gameMap);
      }

      // Process action result
      if (actionResult && actionResult.success) {
          turnResult.actions.push(actionResult);
          if (actionResult.type === 'WAIT') break;
      } else {
          console.log(`[ZombieAI] ${zombie.id} turn ending: stuck or finished. AP=${zombie.currentAP}`);
          break; 
      }
    }

    if (zombie.currentAP <= 0) {
      zombie.isActive = false;
    }

    console.log(`[ZombieAI] Finished turn for zombie ${zombie.id}. Actions: ${turnResult.actions.length}`);

    turnResult.success = true;
    return turnResult;
  }

  static executeRandomWanderStep(zombie, gameMap) {
    const fromPos = { x: zombie.logicalX, y: zombie.logicalY };
    const neighbors = this.getNeighbors(zombie.logicalX, zombie.logicalY, true).filter(pos => {
      const tile = gameMap.getTile(pos.x, pos.y);
      return tile && tile.isWalkable(zombie);
    });

    if (neighbors.length > 0 && Math.random() < 0.4) { // Only move 40% of idle turns
      const randomPos = neighbors[Math.floor(Math.random() * neighbors.length)];
      const randomTile = gameMap.getTile(randomPos.x, randomPos.y);
      const apCost = zombie.getMovementMultiplier() * Pathfinding.getMovementCost(zombie.logicalX, zombie.logicalY, randomPos.x, randomPos.y, randomTile, { isZombie: true });
      if (zombie.currentAP >= apCost && gameMap.moveEntity(zombie.id, randomPos.x, randomPos.y, { ignoreZombies: false, snap: false })) {
        zombie.useAP(apCost);
        return { success: true, type: 'MOVE', entityId: zombie.id, data: { from: fromPos, to: { x: randomPos.x, y: randomPos.y }, apCost } };
      }
    }
    
    return { success: false, reason: 'Idle' };
  }

  static attemptMoveTowards(zombie, gameMap, targetX, targetY) {
    if (zombie.logicalX === targetX && zombie.logicalY === targetY) return { success: false, reason: 'At target' };
    const fromPos = { x: zombie.logicalX, y: zombie.logicalY };
    const subtypeMult = zombie.getMovementMultiplier();

    // Direct Step Optimization (1 tile away)
    const dx = Math.abs(zombie.logicalX - targetX);
    const dy = Math.abs(zombie.logicalY - targetY);
    if ((dx <= 1 && dy <= 1)) {
        // SAFETY: Check diagonal corners even for direct steps
        if (dx === 1 && dy === 1) {
            if (!Pathfinding.canMoveDiagonally(gameMap, zombie.logicalX, zombie.logicalY, targetX, targetY, zombie)) {
                // If diagonal is blocked by a wall corner, try the two cardinal neighbors to "flank" it
                const cardinal1 = { x: zombie.logicalX, y: targetY };
                const cardinal2 = { x: targetX, y: zombie.logicalY };
                for (const cand of [cardinal1, cardinal2]) {
                    const cTile = gameMap.getTile(cand.x, cand.y);
                    if (cTile && cTile.isWalkable(zombie, { ignoreZombies: false })) {
                        const cCost = subtypeMult * Pathfinding.getMovementCost(zombie.logicalX, zombie.logicalY, cand.x, cand.y, cTile, { isZombie: true });
                        if (zombie.currentAP >= cCost && gameMap.moveEntity(zombie.id, cand.x, cand.y, { ignoreZombies: false, snap: false })) {
                            zombie.useAP(cCost);
                            return { success: true, type: 'MOVE', entityId: zombie.id, data: { from: fromPos, to: cand, apCost: cCost } };
                        }
                    }
                }
                return { success: false, reason: 'Corner blocked' };
            }
        }

        // STRUCTURE BREACH: If target is a closed door/window and we are cardinal, attack it
        const targetTile = gameMap.getTile(targetX, targetY);
        if (targetTile) {
            const structure = targetTile.contents.find(e => (e.type === EntityType.DOOR && !e.isOpen) || (e.type === EntityType.WINDOW && (e.isReinforced || (!e.isBroken && !e.isOpen))));
            if (structure) {
                const isCardinal = (dx + dy === 1);
                if (isCardinal) {
                    return this.executeStructureAttack(zombie, gameMap, structure, { x: targetX, y: targetY }, fromPos);
                }
            }
        }

        const apCost = subtypeMult * Pathfinding.getMovementCost(zombie.logicalX, zombie.logicalY, targetX, targetY, targetTile, { isZombie: true });
        if (zombie.currentAP >= apCost && gameMap.moveEntity(zombie.id, targetX, targetY, { ignoreZombies: false, snap: false })) {
            zombie.useAP(apCost);
            return { success: true, type: 'MOVE', entityId: zombie.id, data: { from: fromPos, to: { x: targetX, y: targetY }, apCost } };
        }
    }

    // A* Pathfinding
    let finalTargetX = targetX;
    let finalTargetY = targetY;
    const targetTileObj = gameMap.getTile(targetX, targetY);
    
    // If the specific target tile is unwalkable (like a closed door/wall), 
    // find the best reachable tile adjacent to it.
    if (targetTileObj && !targetTileObj.isWalkable(zombie)) {
        const approach = this.findBestApproachTile(zombie, { logicalX: targetX, logicalY: targetY }, gameMap);
        if (approach.length > 0) {
            finalTargetX = approach[0].x;
            finalTargetY = approach[0].y;
            // If we are already at the best approach tile, we're done moving
            if (zombie.logicalX === finalTargetX && zombie.logicalY === finalTargetY) {
                return { success: false, reason: 'At best approach' };
            }
        }
    }

    const path = Pathfinding.findPath(gameMap, zombie.logicalX, zombie.logicalY, finalTargetX, finalTargetY, { 
      allowDiagonal: true, 
      isZombie: true, 
      entity: zombie, 
      maxDistance: 60, 
      ignoreZombies: false, 
      isPathfinding: true 
    });

    if (path.length > 1) {
      const nextStep = path[1];
      const nextTile = gameMap.getTile(nextStep.x, nextStep.y);
      if (nextTile) {
        // Handle structures (doors/windows)
        const structure = nextTile.contents.find(e => (e.type === EntityType.DOOR && !e.isOpen) || (e.type === EntityType.WINDOW && (e.isReinforced || (!e.isBroken && !e.isOpen))));
        if (structure) {
          const isCardinal = Math.abs(zombie.logicalX - nextStep.x) + Math.abs(zombie.logicalY - nextStep.y) === 1;
          if (isCardinal) {
            return this.executeStructureAttack(zombie, gameMap, structure, nextStep, fromPos);
          } else {
            // Diagonal structure: step cardinally first
            const cardinalPos = this.findOpenCardinalFromDiagonal(zombie, nextStep, gameMap);
            if (cardinalPos) {
                const cTile = gameMap.getTile(cardinalPos.x, cardinalPos.y);
                const cCost = subtypeMult * Pathfinding.getMovementCost(zombie.logicalX, zombie.logicalY, cardinalPos.x, cardinalPos.y, cTile, { isZombie: true });
                if (zombie.currentAP >= cCost && gameMap.moveEntity(zombie.id, cardinalPos.x, cardinalPos.y, { ignoreZombies: false, snap: false })) {
                    zombie.useAP(cCost);
                    return { success: true, type: 'MOVE', entityId: zombie.id, data: { from: fromPos, to: cardinalPos, apCost: cCost } };
                }
            }
          }
        }

        const apCost = subtypeMult * Pathfinding.getMovementCost(zombie.logicalX, zombie.logicalY, nextStep.x, nextStep.y, nextTile, { isZombie: true });
        if (zombie.currentAP >= apCost && gameMap.moveEntity(zombie.id, nextStep.x, nextStep.y, { ignoreZombies: false, snap: false })) {
          zombie.useAP(apCost);
          return { success: true, type: 'MOVE', entityId: zombie.id, data: { from: fromPos, to: { x: nextStep.x, y: nextStep.y }, apCost } };
        }
      }
    }
    return { success: false, reason: 'Path blocked' };
  }

  static executeStructureAttack(zombie, gameMap, structure, pos, fromPos) {
    const cost = 1.0;
    if (zombie.currentAP < cost) return { success: false, reason: 'Insufficient AP' };
    zombie.useAP(cost);
    
    // Guaranteed 1 damage to structures
    const damage = 1;
    // Silent update for simulation state only
    structure.takeDamage(damage, true);
    
    if (gameMap.emitNoise) gameMap.emitNoise(pos.x, pos.y, 6);
    return { success: true, type: 'STRUCTURE_INTERACT', entityId: zombie.id, data: { success: true, from: fromPos, to: pos, targetId: structure.id, targetType: structure.type, damage, isMiss: false, apCost: cost } };
  }

  static attemptAttack(zombie, target) {
    const apCost = 1.0;
    if (zombie.currentAP < apCost) return { success: false, reason: 'Insufficient AP' };
    zombie.useAP(apCost);
    // Original rules: 50% hit chance
    const hit = Math.random() < 0.5;
    let damage = 0;
    if (hit) {
      const typeDef = getZombieType(zombie.subtype);
      damage = Math.floor(Math.random() * (typeDef.combat.damage.max - typeDef.combat.damage.min + 1)) + typeDef.combat.damage.min;
    }
    return { success: hit, damage, apUsed: apCost };
  }

  static findBestApproachTile(zombie, player, gameMap) {
    const adjacent = [
      { x: player.logicalX + 1, y: player.logicalY, cardinal: true },
      { x: player.logicalX - 1, y: player.logicalY, cardinal: true },
      { x: player.logicalX, y: player.logicalY + 1, cardinal: true },
      { x: player.logicalX, y: player.logicalY - 1, cardinal: true },
      { x: player.logicalX + 1, y: player.logicalY + 1, cardinal: false },
      { x: player.logicalX + 1, y: player.logicalY - 1, cardinal: false },
      { x: player.logicalX - 1, y: player.logicalY + 1, cardinal: false },
      { x: player.logicalX - 1, y: player.logicalY - 1, cardinal: false }
    ];
    return adjacent.filter(pos => {
      const tile = gameMap.getTile(pos.x, pos.y);
      if (!tile) return false;
      // Use standardized isWalkable check to correctly handle open windows/doors
      return tile.isWalkable(zombie);
    }).sort((a, b) => {
      const tileA = gameMap.getTile(a.x, a.y);
      const tileB = gameMap.getTile(b.x, b.y);
      const walkA = tileA && tileA.isWalkable(zombie);
      const walkB = tileB && tileB.isWalkable(zombie);

      // Priority 1: Prefer tiles that are already open/walkable
      if (walkA !== walkB) return walkA ? -1 : 1;

      // Priority 2: Cardinal tiles first
      if (a.cardinal !== b.cardinal) return a.cardinal ? -1 : 1;

      // Priority 3: Distance to zombie
      const distA = Math.abs(zombie.logicalX - a.x) + Math.abs(zombie.logicalY - a.y);
      const distB = Math.abs(zombie.logicalX - b.x) + Math.abs(zombie.logicalY - b.y);
      return distA - distB;
    });
  }

  static findOpenCardinalFromDiagonal(zombie, target, gameMap) {
    const candidates = [{ x: zombie.logicalX, y: target.y }, { x: target.x, y: zombie.logicalY }];
    return candidates.find(pos => {
      const tile = gameMap.getTile(pos.x, pos.y);
      return tile && tile.isWalkable(zombie, { ignoreZombies: false });
    });
  }

  static getNeighbors(x, y, includeDiagonal = false) {
    const neighbors = [{ x: x + 1, y: y }, { x: x - 1, y: y }, { x: x, y: y + 1 }, { x: x, y: y - 1 }];
    if (includeDiagonal) neighbors.push({ x: x + 1, y: y + 1 }, { x: x + 1, y: y - 1 }, { x: x - 1, y: y + 1 }, { x: x - 1, y: y - 1 });
    return neighbors;
  }
}