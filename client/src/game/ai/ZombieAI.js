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

    while (zombie.currentAP > 0.05 && turnResult.actions.length < maxActions && safetyCounter < 100) {
      safetyCounter++;
      
      const canSee = zombie.canSeeEntity(gameMap, player);
      const isAdjacent = zombie.isAdjacentTo(player.logicalX, player.logicalY);
      const isDiagonal = zombie.isDiagonalTo(player.logicalX, player.logicalY);

      if (safetyCounter === 1) {
        console.log(`[ZombieAI] ${zombie.id} turn start: Pos(${zombie.logicalX}, ${zombie.logicalY}), canSee=${canSee}, lastSeen=${zombie.lastSeen}, LKP=(${zombie.targetSightedCoords?.x}, ${zombie.targetSightedCoords?.y})`);
      }

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

          // A) CLOSE RANGE: Swarm/Surround logic (8-tile awareness)
          if (distToPlayer <= 4 && playerCardinalPositions && playerCardinalPositions.length > 0) {
              // Try to find ANY available spot around the player (8 tiles)
              const adjacentSpots = [];
              for (let dx = -1; dx <= 1; dx++) {
                  for (let dy = -1; dy <= 1; dy++) {
                      if (dx === 0 && dy === 0) continue;
                      adjacentSpots.push({ x: player.logicalX + dx, y: player.logicalY + dy });
                  }
              }

              // Sort by distance to zombie to pick the most efficient flanking spot
              adjacentSpots.sort((a, b) => {
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
                  console.log(`[ZombieAI] ${zombie.id} swarm spots full, falling back to pursuit.`);
              } else {
                  // Swarm move successful
              }
          } 
          
          if (!actionResult || !actionResult.success) {
              // B) PRIMARY: A* Pathfinding toward player
              // A* finds the real shortest path (through windows/doors), unlike greedy
              // which just minimizes Manhattan distance and slides along walls.
              console.log(`[ZombieAI] ${zombie.id} A* pursuit toward player at (${player.logicalX}, ${player.logicalY}).`);
              actionResult = this.attemptMoveTowards(zombie, gameMap, player.logicalX, player.logicalY);
              let moveFound = actionResult && actionResult.success;

              // C) GREEDY FALLBACK: If A* failed (logjam, blocked), try greedy neighbors
              if (!moveFound) {
                  console.log(`[ZombieAI] ${zombie.id} A* pursuit blocked, trying greedy neighbors.`);
                  const neighbors = this.getNeighbors(zombie.logicalX, zombie.logicalY, true);
                  
                  // Sort by distance to player, with a tie-breaker for structures
                  neighbors.sort((a, b) => {
                      const distA = Math.abs(a.x - player.logicalX) + Math.abs(a.y - player.logicalY);
                      const distB = Math.abs(b.x - player.logicalX) + Math.abs(b.y - player.logicalY);
                      if (distA !== distB) return distA - distB;
                      
                      const tileA = gameMap.getTile(a.x, a.y);
                      const tileB = gameMap.getTile(b.x, b.y);
                      const hasStructA = tileA && tileA.contents.some(e => e.type === EntityType.DOOR || e.type === EntityType.WINDOW);
                      const hasStructB = tileB && tileB.contents.some(e => e.type === EntityType.DOOR || e.type === EntityType.WINDOW);
                      if (hasStructA && !hasStructB) return -1;
                      if (!hasStructA && hasStructB) return 1;
                      return 0;
                  });

                  for (const cand of neighbors) {
                      const candDist = Math.abs(cand.x - player.logicalX) + Math.abs(cand.y - player.logicalY);
                      const candTile = gameMap.getTile(cand.x, cand.y);
                      const isStructure = candTile && candTile.contents.some(e => e.type === EntityType.DOOR || e.type === EntityType.WINDOW);

                      if (candDist > distToPlayer) continue;
                      
                      if (candDist === distToPlayer && !isStructure) {
                          const directStepX = zombie.logicalX + Math.sign(player.logicalX - zombie.logicalX);
                          const directStepY = zombie.logicalY + Math.sign(player.logicalY - zombie.logicalY);
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

              // D) BEELINE FALLBACK (The "Anti-Inertia" Clause)
              if (!moveFound) {
                  console.log(`[ZombieAI] ${zombie.id} greedy blocked, triggering Beeline Fallback toward player.`);
                  actionResult = this.executeBeelineStep(zombie, gameMap, player.logicalX, player.logicalY);
                  if (actionResult && actionResult.success) moveFound = true;
              }

              if (!moveFound) {
                  console.log(`[ZombieAI] ${zombie.id} COMPLETELY BLOCKED from player. Waiting 0.5 AP.`);
                  zombie.useAP(0.5);
                  actionResult = { success: true, type: 'WAIT', entityId: zombie.id, data: { apCost: 0.5 } };
              }
          }
      }
      // 3. INVESTIGATION (Priority 3: Move toward LKP or Noise)
      else if (zombie.lastSeen || zombie.heardNoise) {
          const targetX = zombie.lastSeen ? zombie.targetSightedCoords.x : zombie.noiseCoords.x;
          const targetY = zombie.lastSeen ? zombie.targetSightedCoords.y : zombie.noiseCoords.y;
          
          console.log(`[ZombieAI] ${zombie.id} Investigating LKP at (${targetX}, ${targetY}). Current: (${zombie.logicalX}, ${zombie.logicalY})`);

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
                        console.log(`[ZombieAI] ${zombie.id} reached LKP, found breadcrumb at (${freshest.x}, ${freshest.y}). Following.`);
                        continue;
                    }
                }
                zombie.clearLastSeen();
                zombie.clearNoiseHeard();
                zombie.behaviorState = 'wandering';
                continue;
            } else {
              zombie.behaviorState = 'investigating';
              
              // PRIMARY: A* Pathfinding toward investigation target
              // A* finds the real shortest path (through windows/doors)
              console.log(`[ZombieAI] ${zombie.id} A* investigation toward LKP (${targetX}, ${targetY}).`);
              actionResult = this.attemptMoveTowards(zombie, gameMap, targetX, targetY);
              let moveFound = actionResult && actionResult.success;

              // GREEDY FALLBACK: If A* failed, try greedy neighbors
              if (!moveFound) {
                  console.log(`[ZombieAI] ${zombie.id} A* investigation blocked, trying greedy neighbors.`);
                  const neighbors = this.getNeighbors(zombie.logicalX, zombie.logicalY, true);
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

                  for (const cand of neighbors) {
                      const candDist = Math.abs(cand.x - targetX) + Math.abs(cand.y - targetY);
                      const distToTarget = Math.abs(zombie.logicalX - targetX) + Math.abs(zombie.logicalY - targetY);
                      
                      if (candDist > distToTarget) continue;
                      
                      if (candDist === distToTarget) {
                          const stepX = zombie.logicalX + Math.sign(targetX - zombie.logicalX);
                          const stepY = zombie.logicalY + Math.sign(targetY - zombie.logicalY);
                          const directTile = gameMap.getTile(stepX, stepY);
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

              // BEELINE FALLBACK for Investigation
              if (!moveFound) {
                  console.log(`[ZombieAI] ${zombie.id} Investigation greedy blocked, triggering Beeline Fallback to LKP.`);
                  actionResult = this.executeBeelineStep(zombie, gameMap, targetX, targetY);
                  if (actionResult && actionResult.success) moveFound = true;
              }

              if (!moveFound) {
                  // LOGJAM FIX: Only clear if the target is PERMANENTLY unwalkable (wall/terrain).
                  // If it's just occupied by a zombie, keep the LKP and wait.
                  const targetTile = gameMap.getTile(targetX, targetY);
                  if (!targetTile || !targetTile.isWalkable(zombie, { allowBreaching: true, ignoreZombies: true })) {
                    console.log(`[ZombieAI] ${zombie.id} Investigation target (${targetX}, ${targetY}) invalid or permanently blocked, clearing.`);
                    zombie.clearLastSeen();
                    zombie.clearNoiseHeard();
                  } else {
                    // LOGJAM: Target is valid but currently occupied by a comrade. 
                    console.log(`[ZombieAI] ${zombie.id} Investigation target (${targetX}, ${targetY}) blocked by entity, waiting.`);
                    zombie.useAP(0.5);
                    actionResult = { success: true, type: 'WAIT', data: { apCost: 0.5 } };
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
                  console.log(`[ZombieAI] ${zombie.id} picking up breadcrumb trail at (${freshestScent.x}, ${freshestScent.y})`);
                  continue; 
              }
          }

          // 5. WANDER (Priority 5: Random movement)
          zombie.behaviorState = 'wandering';
          actionResult = this.executeRandomWanderStep(zombie, gameMap);
      }

      // Process action result
      if (actionResult && actionResult.success) {
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
          console.log(`[ZombieAI] ${zombie.id} turn loop break: ${reason}. AP=${zombie.currentAP.toFixed(1)}`);
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
      
      // If we didn't move (either due to random or blocked), WAIT 0.5 AP to consume budget
      zombie.useAP(0.5);
      return { success: true, type: 'WAIT', entityId: zombie.id, data: { apCost: 0.5 } };
    }
    
    return { success: false, reason: 'No neighbors to wander to' };
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