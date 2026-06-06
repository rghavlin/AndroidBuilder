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
  static DEBUG = false;
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

    if (ZombieAI.DEBUG) console.log(`[ZombieAI] Starting turn for zombie ${zombie.id} at (${zombie.logicalX}, ${zombie.logicalY}) with ${zombie.currentAP} AP`);

    // PHASE 28 FINAL FIX: DO NOT snap logicalX to visual x. 
    // During turn simulation, logicalX is the source of truth. 
    // Visual 'x' stays behind until playback. Snapping here causes amnesia/teleporting.
    // zombie.logicalX = Math.floor(zombie.x);
    // zombie.logicalY = Math.floor(zombie.y);

    const initialCanSee = zombie.canSeeEntity(gameMap, player);
    // Only lock in LKP if the zombie has actual confirmed LOS right now.
    // Do NOT overwrite a valid LKP with the player's real position when the zombie
    // cannot see them — that was the root cause of the "sidestepping" bug.
    if (initialCanSee) {
        zombie.setTargetSighted(player.logicalX, player.logicalY);
    }

    const typeDef = getZombieType(zombie.subtype);

    while (zombie.currentAP > 0.05 && !turnResult.blocked && turnResult.actions.length < maxActions && safetyCounter < 100) {
      safetyCounter++;
      
      const canSee = zombie.canSeeEntity(gameMap, player);
      const isAdjacent = zombie.isAdjacentTo(player.logicalX, player.logicalY);
      const isDiagonal = zombie.isDiagonalTo(player.logicalX, player.logicalY);

      if (safetyCounter === 1) {
        if (ZombieAI.DEBUG) console.log(`[ZombieAI] ${zombie.id} turn start: Pos(${zombie.logicalX}, ${zombie.logicalY}), canSee=${canSee}, lastSeen=${zombie.lastSeen}, LKP=(${zombie.targetSightedCoords?.x}, ${zombie.targetSightedCoords?.y})`);
      }

      if (ZombieAI.DEBUG) console.log(`[ZombieAI] ${zombie.id} step ${safetyCounter}: AP=${zombie.currentAP.toFixed(1)}, canSee=${canSee}, behavior=${zombie.behaviorState}`);

      let actionResult = null;

      // 1. COMBAT (Priority 1: Attack player if in reach)
      let canMeleeAttack = canSee && (isAdjacent || (isDiagonal && zombie.subtype === 'mutant'));
      let blockingStructure = null;

      if (canMeleeAttack) {
          if (isAdjacent) {
              blockingStructure = Pathfinding.getBlockingStructure(gameMap, zombie.logicalX, zombie.logicalY, player.logicalX, player.logicalY);
              if (Pathfinding.isEdgeBlocked(gameMap, zombie.logicalX, zombie.logicalY, player.logicalX, player.logicalY, zombie)) {
                  if (!blockingStructure) {
                      canMeleeAttack = false; // Solid wall blocks attack!
                  }
              }
          } else {
              // Diagonal: check corner blocking
              if (!Pathfinding.canMoveDiagonally(gameMap, zombie.logicalX, zombie.logicalY, player.logicalX, player.logicalY, zombie)) {
                  canMeleeAttack = false; // Corner/wall blocks diagonal attack!
              }
          }
      }

      if (canMeleeAttack) {
          if (blockingStructure) {
              const fromPos = { x: zombie.logicalX, y: zombie.logicalY };
              actionResult = this.executeStructureAttack(zombie, gameMap, blockingStructure, { x: player.logicalX, y: player.logicalY }, fromPos);
          } else {
              if (ZombieAI.DEBUG) console.log(`[ZombieAI] ⚔️ ${zombie.id} is attacking player. Pos=(${zombie.logicalX}, ${zombie.logicalY}), Player=(${player.logicalX}, ${player.logicalY})`);
              const attackResult = this.attemptAttack(zombie, player);
              
              if (!attackResult.success && attackResult.reason === 'Insufficient AP') {
                  if (ZombieAI.DEBUG) console.log(`[ZombieAI] ${zombie.id} insufficient AP for melee attack. Breaking turn.`);
                  actionResult = { success: false, reason: 'Insufficient AP' };
              } else {
                  actionResult = {
                    type: 'ATTACK',
                    success: true,
                    entityId: zombie.id,
                    data: { ...attackResult, targetId: player.id, targetType: 'player', from: { x: zombie.logicalX, y: zombie.logicalY }, to: { x: player.logicalX, y: player.logicalY } }
                  };
              }
          }
      }
      // 1b. RANGED ATTACK (Ranged Priority: Spit/shoot if in range but not adjacent)
      else if (typeDef.isRanged && canSee && zombie.getDistanceTo(player.logicalX, player.logicalY) <= (typeDef.rangedRange || 5)) {
           const attackResult = this.attemptRangedAttack(zombie, player);
           
           if (!attackResult.success && attackResult.reason === 'Insufficient AP') {
               if (ZombieAI.DEBUG) console.log(`[ZombieAI] ${zombie.id} insufficient AP for ranged attack. Breaking turn.`);
               actionResult = { success: false, reason: 'Insufficient AP' };
           } else {
               actionResult = {
                   type: 'ATTACK',
                   success: true,
                   entityId: zombie.id,
                   metadata: {
                       isRanged: true,
                       projectile: {
                           type: 'projectile',
                           color: '#a855f7',
                           targetX: player.logicalX,
                           targetY: player.logicalY
                       }
                   },
                   data: { 
                       ...attackResult, 
                       targetId: player.id, 
                       targetType: 'player', 
                       from: { x: zombie.logicalX, y: zombie.logicalY }, 
                       to: { x: player.logicalX, y: player.logicalY } 
                   }
               };
           }
       }
       // 2. PURSUIT (Priority 2: Move toward player if visible)
      else if (canSee) {
          zombie.behaviorState = 'pursuing';
          zombie.setTargetSighted(player.logicalX, player.logicalY);
          
          const distToPlayer = Math.abs(zombie.logicalX - player.logicalX) + Math.abs(zombie.logicalY - player.logicalY);

          // A) CLOSE RANGE: Swarm/Surround logic (8-tile awareness)
          if (distToPlayer <= 4) {
              // Try to find ANY available spot around the player (8 tiles)
              const adjacentSpots = [];
              for (let dx = -1; dx <= 1; dx++) {
                  for (let dy = -1; dy <= 1; dy++) {
                      if (dx === 0 && dy === 0) continue;
                      
                      const sx = player.logicalX + dx;
                      const sy = player.logicalY + dy;
                      
                      // Filter out spots that are completely blocked by a solid wall from reaching the player
                      if (Math.abs(dx) + Math.abs(dy) === 1) {
                          // Cardinal
                          const isBlocked = Pathfinding.isEdgeBlocked(gameMap, sx, sy, player.logicalX, player.logicalY, zombie);
                          const hasStructure = Pathfinding.getBlockingStructure(gameMap, sx, sy, player.logicalX, player.logicalY) !== null;
                          if (isBlocked && !hasStructure) {
                              continue; // Separated by solid wall!
                          }
                      } else {
                          // Diagonal
                          if (!Pathfinding.canMoveDiagonally(gameMap, sx, sy, player.logicalX, player.logicalY, zombie)) {
                              continue; // Separated by corner/walls!
                          }
                      }
                      
                      adjacentSpots.push({ x: sx, y: sy });
                  }
              }

              // Sort by attack suitability and then distance to zombie to pick the most efficient flanking spot
              adjacentSpots.sort((a, b) => {
                  const isCardinalA = (a.x === player.logicalX || a.y === player.logicalY);
                  const isCardinalB = (b.x === player.logicalX || b.y === player.logicalY);
                  
                  // For mutants, all 8 spots are valid attack positions, so they are all high priority.
                  // For others, only cardinal spots are valid attack positions.
                  const canAttackFromA = zombie.subtype === 'mutant' || isCardinalA;
                  const canAttackFromB = zombie.subtype === 'mutant' || isCardinalB;
                  
                  if (canAttackFromA !== canAttackFromB) {
                      return canAttackFromA ? -1 : 1; // Prioritize spots the zombie can attack from
                  }

                  const distA = Math.abs(a.x - zombie.logicalX) + Math.abs(a.y - zombie.logicalY);
                  const distB = Math.abs(b.x - zombie.logicalX) + Math.abs(b.y - zombie.logicalY);
                  return distA - distB;
              });

              let swarmMoveFound = false;
              for (const spot of adjacentSpots) {
                  const tile = gameMap.getTile(spot.x, spot.y);
                  if (!tile || !tile.isWalkable(zombie, { ignoreZombies: false })) continue;
                  
                  // Check if another zombie is already there (logical position)
                  const isOccupiedByOther = tile.contents.some(e => e.type === EntityType.ZOMBIE && e.id !== zombie.id);
                  if (isOccupiedByOther) continue;

                  actionResult = this.attemptMoveTowards(zombie, gameMap, spot.x, spot.y);
                  if (actionResult && actionResult.success) {
                      swarmMoveFound = true;
                      break;
                  }
              }

              if (!swarmMoveFound) {
                  // If all adjacent spots are full, don't WAIT and end turn. 
                  // Instead, we fall through to Greedy Pursuit to try and at least get closer 
                  // or stand behind a comrade.
                  if (ZombieAI.DEBUG) console.log(`[ZombieAI] ${zombie.id} swarm spots full, falling back to pursuit.`);
              } else {
                  // Swarm move successful
              }
          } 
          
          if (!actionResult || !actionResult.success) {
              const fallbackResult = this._attemptMoveWithFallbacks(zombie, gameMap, player.logicalX, player.logicalY, 'pursuit');
              actionResult = fallbackResult.actionResult;
              let moveFound = fallbackResult.success;

              if (!moveFound) {
                  if (ZombieAI.DEBUG) console.log(`[ZombieAI] ${zombie.id} COMPLETELY BLOCKED from player. Ending turn.`);
                  turnResult.blocked = true;
                  actionResult = { success: true, type: 'WAIT', entityId: zombie.id, data: { apCost: zombie.currentAP } };
              }
          }
      }
      // 3. INVESTIGATION (Priority 3: Move toward LKP or Noise)
      else if (zombie.lastSeen || zombie.heardNoise) {
          const targetX = zombie.lastSeen ? zombie.targetSightedCoords.x : zombie.noiseCoords.x;
          const targetY = zombie.lastSeen ? zombie.targetSightedCoords.y : zombie.noiseCoords.y;
          
          if (ZombieAI.DEBUG) console.log(`[ZombieAI] ${zombie.id} Investigating LKP at (${targetX}, ${targetY}). Current: (${zombie.logicalX}, ${zombie.logicalY})`);

            if (zombie.logicalX === targetX && zombie.logicalY === targetY) {
                // Reached LKP/Noise - Check for breadcrumbs before giving up
                // Radius increased to 6 for better tracking; minSequence reset to 0 to pick up any fresh trail
                const freshest = ScentTrail.findFreshestScent(gameMap, zombie.logicalX, zombie.logicalY, 6, 0);
                
                if (freshest) {
                    // PHASE 30 FIX: Validate scent with LOS to prevent "leaking" through walls
                    const distToScent = Math.sqrt(Math.pow(freshest.x - zombie.logicalX, 2) + Math.pow(freshest.y - zombie.logicalY, 2));
                    const hasLOS = LineOfSight.hasLineOfSight(gameMap, zombie.logicalX, zombie.logicalY, freshest.x, freshest.y).hasLineOfSight;
                    
                    if (distToScent <= 1.5 || hasLOS) {
                        zombie.setTargetSighted(freshest.x, freshest.y);
                        zombie.lastScentSequence = freshest.sequence;
                        zombie.behaviorState = 'tracking';
                        if (ZombieAI.DEBUG) console.log(`[ZombieAI] ${zombie.id} reached LKP, found breadcrumb at (${freshest.x}, ${freshest.y}). Following.`);
                        continue;
                    }
                }
                zombie.clearLastSeen();
                zombie.clearNoiseHeard();
                zombie.behaviorState = 'wandering';
                continue;
            } else {
              zombie.behaviorState = 'investigating';
              
              const fallbackResult = this._attemptMoveWithFallbacks(zombie, gameMap, targetX, targetY, 'investigation');
              actionResult = fallbackResult.actionResult;
              let moveFound = fallbackResult.success;

              if (!moveFound) {
                  // LOGJAM FIX: Only clear if the target is PERMANENTLY unwalkable (wall/terrain).
                  // If it's just occupied by a zombie, keep the LKP and wait.
                  const targetTile = gameMap.getTile(targetX, targetY);
                  if (!targetTile || !targetTile.isWalkable(zombie, { allowBreaching: true, ignoreZombies: true })) {
                    if (ZombieAI.DEBUG) console.log(`[ZombieAI] ${zombie.id} Investigation target (${targetX}, ${targetY}) invalid or permanently blocked, clearing.`);
                    zombie.clearLastSeen();
                    zombie.clearNoiseHeard();
                  } else {
                    // LOGJAM: Target is valid but currently occupied by a comrade. 
                    if (ZombieAI.DEBUG) console.log(`[ZombieAI] ${zombie.id} Investigation target (${targetX}, ${targetY}) blocked by entity, waiting.`);
                    turnResult.blocked = true;
                    actionResult = { success: true, type: 'WAIT', entityId: zombie.id, data: { apCost: zombie.currentAP } };
                  }
              }
          }
      }
      // 4. TRACKING (Priority 4: Follow Scent Trail)
      else {
          const freshestScent = ScentTrail.findFreshestScent(gameMap, zombie.logicalX, zombie.logicalY, 5, zombie.lastScentSequence || 0);
          
          if (freshestScent) {
              // PHASE 30 FIX: Validate scent with LOS to prevent "leaking" through walls
              const distToScent = Math.sqrt(Math.pow(freshestScent.x - zombie.logicalX, 2) + Math.pow(freshestScent.y - zombie.logicalY, 2));
              const hasLOS = LineOfSight.hasLineOfSight(gameMap, zombie.logicalX, zombie.logicalY, freshestScent.x, freshestScent.y).hasLineOfSight;
              
              if (distToScent <= 1.5 || hasLOS) {
                  zombie.behaviorState = 'tracking';
                  zombie.lastScentSequence = freshestScent.sequence;
                  zombie.setTargetSighted(freshestScent.x, freshestScent.y);
                  if (ZombieAI.DEBUG) console.log(`[ZombieAI] ${zombie.id} picking up breadcrumb trail at (${freshestScent.x}, ${freshestScent.y})`);
                  continue; 
              }
          }

          // 5. WANDER (Priority 5: Random movement)
          zombie.behaviorState = 'wandering';
          actionResult = this.executeRandomWanderStep(zombie, gameMap);
      }

      // Process action result
      if (actionResult && actionResult.success) {
          if (actionResult.blocked) {
              turnResult.blocked = true;
          }
          // AGGREGATION LOGIC: Merge consecutive attacks of the same type on the same target
          const lastAction = turnResult.actions[turnResult.actions.length - 1];
          const isMergeable = lastAction && 
                             (actionResult.type === 'ATTACK' || actionResult.type === 'STRUCTURE_INTERACT') &&
                             lastAction.type === actionResult.type &&
                             lastAction.data.targetId === actionResult.data.targetId;

          if (isMergeable) {
              // Combine damage and AP costs
              lastAction.data.damage = (lastAction.data.damage || 0) + (actionResult.data.damage || 0);
              lastAction.data.apCost = (lastAction.data.apCost || 0) + (actionResult.data.apCost || 0);
              lastAction.data.attackCount = (lastAction.data.attackCount || 1) + 1;
              
              // If any hit in the batch succeeded, the whole aggregate is a "hit" for sound/visual purposes
              if (actionResult.data.success) {
                  lastAction.data.success = true;
                  lastAction.data.hitCount = (lastAction.data.hitCount || 0) + 1;
              }
              
              // Forward 'broken' flag for structures
              if (actionResult.data.broken) {
                  lastAction.data.broken = true;
              }
          } else {
              // Initialize counts for new actions
              actionResult.data.attackCount = 1;
              actionResult.data.hitCount = actionResult.data.success ? 1 : 0;
              turnResult.actions.push(actionResult);
          }
      } else {
          const reason = actionResult ? actionResult.reason : 'No behavior triggered';
          if (ZombieAI.DEBUG) console.log(`[ZombieAI] ${zombie.id} turn loop break: ${reason}. AP=${zombie.currentAP.toFixed(1)}`);
          break; 
      }
    }

    if (zombie.currentAP <= 0) {
      zombie.isActive = false;
    }

    if (ZombieAI.DEBUG) console.log(`[ZombieAI] Finished turn for zombie ${zombie.id}. Actions: ${turnResult.actions.length}`);

    turnResult.success = true;
    return turnResult;
  }

  static executeRandomWanderStep(zombie, gameMap) {
    const fromPos = { x: zombie.logicalX, y: zombie.logicalY };
    const neighbors = this.getNeighbors(zombie.logicalX, zombie.logicalY, true).filter(pos => {
      const tile = gameMap.getTile(pos.x, pos.y);
      if (!tile || !tile.isWalkable(zombie)) return false;
      const dx = Math.abs(zombie.logicalX - pos.x);
      const dy = Math.abs(zombie.logicalY - pos.y);
      if (dx === 0 || dy === 0) {
        if (Pathfinding.isEdgeBlocked(gameMap, zombie.logicalX, zombie.logicalY, pos.x, pos.y, zombie)) return false;
      } else {
        if (!Pathfinding.canMoveDiagonally(gameMap, zombie.logicalX, zombie.logicalY, pos.x, pos.y, zombie)) return false;
      }
      return true;
    });

    if (neighbors.length > 0) {
      if (Math.random() < 0.4) { // Only move 40% of idle turns
        const randomPos = neighbors[Math.floor(Math.random() * neighbors.length)];
        const randomTile = gameMap.getTile(randomPos.x, randomPos.y);
        const apCost = zombie.getMovementMultiplier() * Pathfinding.getMovementCost(zombie.logicalX, zombie.logicalY, randomPos.x, randomPos.y, randomTile, { isZombie: true });
        if (zombie.currentAP >= apCost && gameMap.moveEntity(zombie.id, randomPos.x, randomPos.y, { ignoreZombies: false, snap: false })) {
          zombie.useAP(apCost);
          return { success: true, type: 'MOVE', entityId: zombie.id, data: { from: fromPos, to: { x: randomPos.x, y: randomPos.y }, apCost } };
        }
      }
      
      // If we didn't move (either due to random or blocked), end turn via blocked flag
      return { success: true, type: 'WAIT', entityId: zombie.id, data: { apCost: zombie.currentAP }, blocked: true };
    }
    
    return { success: false, reason: 'No neighbors to wander to' };
  }

  static attemptMoveTowards(zombie, gameMap, targetX, targetY) {
    if (zombie.logicalX === targetX && zombie.logicalY === targetY) return { success: false, reason: 'At target' };
    const fromPos = { x: zombie.logicalX, y: zombie.logicalY };
    const targetTile = gameMap.getTile(targetX, targetY);
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
        const isCardinal = (dx + dy === 1);
        if (isCardinal) {
            const structure = Pathfinding.getBlockingStructure(gameMap, zombie.logicalX, zombie.logicalY, targetX, targetY);
            if (structure) {
                return this.executeStructureAttack(zombie, gameMap, structure, { x: targetX, y: targetY }, fromPos);
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
    
    // REDACTION: findBestApproachTile redirection removed. 
    // Pathfinding.js already allows zombies to path to closed structures via allowBreaching.
    // Redirecting here causes the "Wrong Side of the Wall" bug.

    const path = Pathfinding.findPath(gameMap, zombie.logicalX, zombie.logicalY, finalTargetX, finalTargetY, { 
      allowDiagonal: true, 
      isZombie: true, 
      entity: zombie, 
      maxDistance: 60, 
      ignoreZombies: true, // Planning should ignore zombies to find routes around logjams
      isPathfinding: true 
    });

    if (path.length > 1) {
      const nextStep = path[1];
      const nextTile = gameMap.getTile(nextStep.x, nextStep.y);
      if (nextTile) {
        const isCardinal = Math.abs(zombie.logicalX - nextStep.x) + Math.abs(zombie.logicalY - nextStep.y) === 1;
        
        let blockingStructure = null;
        if (isCardinal) {
            blockingStructure = Pathfinding.getBlockingStructure(gameMap, zombie.logicalX, zombie.logicalY, nextStep.x, nextStep.y);
        } else {
            const fullTileStructure = nextTile.contents.find(e => ((e.type === EntityType.DOOR && !e.isOpen) || (e.type === EntityType.WINDOW && (e.isReinforced || (!e.isBroken && !e.isOpen)))) && !e.edge);
            if (fullTileStructure) {
                blockingStructure = fullTileStructure;
            } else {
                const x1 = zombie.logicalX, y1 = zombie.logicalY;
                const x2 = nextStep.x, y2 = nextStep.y;
                const edgeStructures = [
                    Pathfinding.getBlockingStructure(gameMap, x1, y1, x1, y2),
                    Pathfinding.getBlockingStructure(gameMap, x1, y1, x2, y1),
                    Pathfinding.getBlockingStructure(gameMap, x1, y2, x2, y2),
                    Pathfinding.getBlockingStructure(gameMap, x2, y1, x2, y2)
                ];
                blockingStructure = edgeStructures.find(s => s !== null);
            }
        }

        if (blockingStructure) {
          if (isCardinal) {
            return this.executeStructureAttack(zombie, gameMap, blockingStructure, nextStep, fromPos);
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
    // Silent update for simulation state only - returns { isBroken, isReinforced, ... }
    const damageResult = structure.takeDamage(damage, true);
    const broken = !!(damageResult && damageResult.isBroken);
    
    if (gameMap.emitNoise) gameMap.emitNoise(pos.x, pos.y, 6);
    return { success: true, type: 'STRUCTURE_INTERACT', entityId: zombie.id, data: { success: true, from: fromPos, to: pos, targetId: structure.id, targetType: structure.type, damage, broken, isMiss: false, apCost: cost } };
  }

  /**
   * Hard Fallback: Move cardinally toward target without complex pathfinding
   * This ensures the zombie at least moves or attacks structures if blocked.
   */
  static executeBeelineStep(zombie, gameMap, targetX, targetY) {
      const fromPos = { x: zombie.logicalX, y: zombie.logicalY };
      const dx = targetX - zombie.logicalX;
      const dy = targetY - zombie.logicalY;
      
      // Pick the primary axis
      const stepX = dx !== 0 ? (dx > 0 ? 1 : -1) : 0;
      const stepY = dy !== 0 ? (dy > 0 ? 1 : -1) : 0;
      
      // Try X axis first
      if (stepX !== 0) {
          const res = this.attemptMoveTowards(zombie, gameMap, zombie.logicalX + stepX, zombie.logicalY);
          if (res && res.success) return res;
      }
      
      // Try Y axis second
      if (stepY !== 0) {
          const res = this.attemptMoveTowards(zombie, gameMap, zombie.logicalX, zombie.logicalY + stepY);
          if (res && res.success) return res;
      }
      
      return { success: false, reason: 'Beeline failed' };
  }

  static attemptAttack(zombie, target) {
    const apCost = zombie.attackCost || 1.0;
    if (zombie.currentAP < apCost) return { success: false, reason: 'Insufficient AP' };
    zombie.useAP(apCost);
    // Use zombie-specific accuracy (defaults to 0.5)
    const hit = Math.random() < (zombie.accuracy || 0.5);
    let damage = 0;
    if (hit) {
      const typeDef = getZombieType(zombie.subtype);
      damage = Math.floor(Math.random() * (typeDef.combat.damage.max - typeDef.combat.damage.min + 1)) + typeDef.combat.damage.min;
    }
    return { success: hit, damage, apUsed: apCost };
  }

  static attemptRangedAttack(zombie, target) {
    const typeDef = getZombieType(zombie.subtype);
    const apCost = typeDef.rangedApCost !== undefined ? typeDef.rangedApCost : 1.5;
    if (zombie.currentAP < apCost) return { success: false, reason: 'Insufficient AP' };
    zombie.useAP(apCost);
    
    // Use zombie-specific accuracy (defaults to 0.5)
    const hit = Math.random() < (zombie.accuracy || 0.5);
    let damage = 0;
    let sickInflicted = false;
    
    if (hit) {
      const combat = typeDef.combat || {};
      const min = combat.rangedDamage?.min || 1;
      const max = combat.rangedDamage?.max || 3;
      damage = Math.floor(Math.random() * (max - min + 1)) + min;
      
      // 20% chance for sick
      if (Math.random() < (combat.sickChance || 0.2)) {
          sickInflicted = true;
      }
    }
    
    return { success: hit, damage, sickInflicted, apUsed: apCost, isRanged: true };
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
      // Use standardized isWalkable check with allowBreaching enabled 
      // so zombies can target tiles with windows/doors they intend to break.
      return tile.isWalkable(zombie, { allowBreaching: true });
    }).sort((a, b) => {
      // DUMB ZOMBIE PRIORITY 1: Absolute distance to the zombie (Beeline)
      // This stops them from "bouncing" toward distant open doors.
      const distA = Math.abs(zombie.logicalX - a.x) + Math.abs(zombie.logicalY - a.y);
      const distB = Math.abs(zombie.logicalX - b.x) + Math.abs(zombie.logicalY - b.y);
      if (distA !== distB) return distA - distB;

      // PRIORITY 2: Cardinal tiles first (better for structure interaction)
      if (a.cardinal !== b.cardinal) return a.cardinal ? -1 : 1;

      // PRIORITY 3: Prefer tiles that are already open/walkable (Tie-breaker)
      const tileA = gameMap.getTile(a.x, a.y);
      const tileB = gameMap.getTile(b.x, b.y);
      const walkA = tileA && tileA.isWalkable(zombie);
      const walkB = tileB && tileB.isWalkable(zombie);
      if (walkA !== walkB) return walkA ? -1 : 1;

      return 0;
    });
  }

  /**
   * Helper to execute the standard A* -> greedy -> beeline movement sequence.
   * Unifies duplicate movement fallback logic.
   * @private
   */
  static _attemptMoveWithFallbacks(zombie, gameMap, targetX, targetY, modeName = 'pursuit') {
    const isPursuit = modeName === 'pursuit';
    const targetLabel = isPursuit ? 'player' : 'LKP';

    // A) PRIMARY: A* Pathfinding toward target
    if (ZombieAI.DEBUG) {
      console.log(`[ZombieAI] ${zombie.id} A* ${modeName} toward ${targetLabel} at (${targetX}, ${targetY}).`);
    }
    let actionResult = this.attemptMoveTowards(zombie, gameMap, targetX, targetY);
    let moveFound = actionResult && actionResult.success;

    // B) GREEDY FALLBACK: If A* failed (logjam, blocked), try greedy neighbors
    if (!moveFound) {
      if (ZombieAI.DEBUG) {
        console.log(`[ZombieAI] ${zombie.id} A* ${modeName} blocked, trying greedy neighbors.`);
      }
      const neighbors = this.getNeighbors(zombie.logicalX, zombie.logicalY, true);
      
      // Sort by distance to target, with a tie-breaker for structures
      neighbors.sort((a, b) => {
        const distA = Math.abs(a.x - targetX) + Math.abs(a.y - targetY);
        const distB = Math.abs(b.x - targetX) + Math.abs(b.y - targetY);
        if (distA !== distB) return distA - distB;
        
        const tileA = gameMap.getTile(a.x, a.y);
        const tileB = gameMap.getTile(b.x, b.y);
        const hasStructA = tileA && tileA.contents.some(e => e.type === EntityType.DOOR || e.type === EntityType.WINDOW);
        const hasStructB = tileB && tileB.contents.some(e => e.type === EntityType.DOOR || e.type === EntityType.WINDOW);
        if (hasStructA && !hasStructB) return -1;
        if (!hasStructA && hasStructB) return 1;
        return 0;
      });

      const distToTarget = Math.abs(zombie.logicalX - targetX) + Math.abs(zombie.logicalY - targetY);

      for (const cand of neighbors) {
        const candDist = Math.abs(cand.x - targetX) + Math.abs(cand.y - targetY);
        const candTile = gameMap.getTile(cand.x, cand.y);
        const isStructure = candTile && candTile.contents.some(e => e.type === EntityType.DOOR || e.type === EntityType.WINDOW);

        if (candDist > distToTarget) continue;
        
        if (candDist === distToTarget && !isStructure) {
          const directStepX = zombie.logicalX + Math.sign(targetX - zombie.logicalX);
          const directStepY = zombie.logicalY + Math.sign(targetY - zombie.logicalY);
          const directTile = gameMap.getTile(directStepX, directStepY);
          const isPathBlocked = directTile && directTile.contents.some(e => e.type === EntityType.ZOMBIE);
          if (!isPathBlocked) continue;
        }

        actionResult = this.attemptMoveTowards(zombie, gameMap, cand.x, cand.y);
        if (actionResult && actionResult.success) {
          moveFound = true;
          break;
        }
      }
    }

    // C) BEELINE FALLBACK (The "Anti-Inertia" Clause)
    if (!moveFound) {
      if (ZombieAI.DEBUG) {
        console.log(`[ZombieAI] ${zombie.id} ${modeName} greedy blocked, triggering Beeline Fallback toward ${targetLabel}.`);
      }
      actionResult = this.executeBeelineStep(zombie, gameMap, targetX, targetY);
      if (actionResult && actionResult.success) {
        moveFound = true;
      }
    }

    return { success: moveFound, actionResult };
  }

  static findOpenCardinalFromDiagonal(zombie, target, gameMap) {
    const candidates = [{ x: zombie.logicalX, y: target.y }, { x: target.x, y: zombie.logicalY }];
    return candidates.find(pos => {
      const tile = gameMap.getTile(pos.x, pos.y);
      // BUG FIX: Allow breaching building footprints when finding approach tiles
      return tile && tile.isWalkable(zombie, { ignoreZombies: false, allowBreaching: true });
    });
  }

  static getNeighbors(x, y, includeDiagonal = false) {
    const neighbors = [{ x: x + 1, y: y }, { x: x - 1, y: y }, { x: x, y: y + 1 }, { x: x, y: y - 1 }];
    if (includeDiagonal) neighbors.push({ x: x + 1, y: y + 1 }, { x: x + 1, y: y - 1 }, { x: x - 1, y: y + 1 }, { x: x - 1, y: y - 1 });
    return neighbors;
  }
}