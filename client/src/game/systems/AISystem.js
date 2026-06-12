import { Pathfinding } from '../utils/Pathfinding.js';
import { DamageIntent } from '../components/DamageIntent.js';
import { MoveIntent } from '../components/MoveIntent.js';
import { ScentTrail } from '../utils/ScentTrail.js';
import { LineOfSight } from '../utils/LineOfSight.js';

function getBeelineIntent(entity, zombiePos, targetX, targetY, gameMap, moveCost) {
  const dx = targetX - zombiePos.x;
  const dy = targetY - zombiePos.y;
  const stepX = dx !== 0 ? Math.sign(dx) : 0;
  const stepY = dy !== 0 ? Math.sign(dy) : 0;

  // 1. Try mutant diagonal
  if (entity.subtype === 'mutant' && stepX !== 0 && stepY !== 0) {
    const diagX = zombiePos.x + stepX;
    const diagY = zombiePos.y + stepY;
    if (Pathfinding.canMoveDiagonally(gameMap, zombiePos.x, zombiePos.y, diagX, diagY, entity)) {
      // Diagonal is clear of walls. Check blocking structures
      const blocking = Pathfinding.getBlockingStructure(gameMap, zombiePos.x, zombiePos.y, diagX, diagY);
      if (blocking) {
        return new DamageIntent({
          amount: 1,
          targetId: blocking.id,
          isStructure: true,
          targetX: diagX,
          targetY: diagY
        });
      } else {
        // Check tile walkability
        const tile = gameMap.getTile(diagX, diagY);
        if (tile && tile.isWalkable(entity, { ignoreZombies: false })) {
          return new MoveIntent({ dx: stepX, dy: stepY });
        }
      }
    }
  }

  // 2. Select cardinal choices
  const choices = [];
  if (Math.abs(dx) >= Math.abs(dy)) {
    if (stepX !== 0) choices.push({ cx: stepX, cy: 0 });
    if (stepY !== 0) choices.push({ cx: 0, cy: stepY });
  } else {
    if (stepY !== 0) choices.push({ cx: 0, cy: stepY });
    if (stepX !== 0) choices.push({ cx: stepX, cy: 0 });
  }

  for (const choice of choices) {
    const candX = zombiePos.x + choice.cx;
    const candY = zombiePos.y + choice.cy;
    const tile = gameMap.getTile(candX, candY);
    if (!tile) continue;

    // Check if there is an edge block (wall/door/window)
    const isBlocked = Pathfinding.isEdgeBlocked(gameMap, zombiePos.x, zombiePos.y, candX, candY, entity);
    if (isBlocked) {
      // If there is a blocking structure (door/window), we can attack it
      const blocking = Pathfinding.getBlockingStructure(gameMap, zombiePos.x, zombiePos.y, candX, candY);
      if (blocking) {
        return new DamageIntent({
          amount: 1,
          targetId: blocking.id,
          isStructure: true,
          targetX: candX,
          targetY: candY
        });
      }
      // Otherwise it's a solid wall, try next choice
      continue;
    }

    // Check full tile blocking structure
    const blocking = Pathfinding.getBlockingStructure(gameMap, zombiePos.x, zombiePos.y, candX, candY);
    if (blocking) {
      return new DamageIntent({
        amount: 1,
        targetId: blocking.id,
        isStructure: true,
        targetX: candX,
        targetY: candY
      });
    }

    // Check if tile is walkable
    if (tile.isWalkable(entity, { ignoreZombies: false })) {
      return new MoveIntent({ dx: choice.cx, dy: choice.cy });
    }
  }

  return null;
}

export class AISystem {
  static process(entities, worldManager, engine, actionQueue = [], intentQueue = null) {
    let intentsGenerated = 0;
    const entityList = Array.isArray(entities)
      ? entities
      : (entities instanceof Map ? Array.from(entities.values()) : Object.values(entities));

    // Find player entity
    const player = entityList.find(e => e.hasComponent('InventoryContainer') && e.hasComponent('Position'));
    if (!player) return intentsGenerated;

    const playerPos = player.getComponent('Position');
    const gameMap = engine ? engine.gameMap : null;
    if (!gameMap) return intentsGenerated;

    for (const entity of entityList) {
      if (entity.type === 'zombie' && entity.hasComponent('AIBehavior') && entity.hasComponent('Position')) {
        if (entity.hasComponent('MoveIntent') || entity.hasComponent('DamageIntent')) {
          continue;
        }
        
        const zombiePos = entity.getComponent('Position');
        const currentAP = entity.currentAP !== undefined ? entity.currentAP : (entity.ap !== undefined ? entity.ap : 0);
        const movable = entity.getComponent('Movable');
        const moveCost = movable ? movable.apCost : 1.0;

        if (currentAP <= 0.05) {
          continue;
        }

        const aiBehavior = entity.getComponent('AIBehavior');
        const vision = entity.getComponent('Vision');

        // Helper to enqueue intents
        const enqueueIntent = (intentType, intent) => {
          if (intentQueue) {
            intentQueue.enqueue(entity.id, intentType, intent);
          } else {
            entity.addComponent(intent);
          }
          intentsGenerated++;
        };

        // Helper: execute random walk
        const executeWander = () => {
          entity.behaviorState = 'wandering';
          aiBehavior.alertnessState = 'IDLE';
          if (currentAP >= moveCost) {
            const x = zombiePos.x;
            const y = zombiePos.y;
            const neighbors = [
              { x: x + 1, y },
              { x: x - 1, y },
              { x: x, y: y + 1 },
              { x: x, y: y - 1 }
            ];
            const walkable = neighbors.filter(pos => {
              const tile = gameMap.getTile(pos.x, pos.y);
              return tile && tile.isWalkable(entity, { ignoreZombies: false });
            });
            if (walkable.length > 0) {
              const chosen = walkable[Math.floor(Math.random() * walkable.length)];
              enqueueIntent('MoveIntent', new MoveIntent({ dx: chosen.x - x, dy: chosen.y - y }));
            }
          }
        };

        // Check player visibility using Vision component (fallback to canSeeEntity)
        let playerInLoS = false;
        if (vision) {
          playerInLoS = vision.visibleEntities.includes(player.id);
        } else {
          playerInLoS = entity.canSeeEntity(gameMap, player);
        }

        // --- Decision Tree ---

        // Priority 1: Hunting (Player is visible in current LoS)
        if (playerInLoS) {
          aiBehavior.alertnessState = 'HUNTING';
          aiBehavior.lastSeenPlayerCoords = { x: playerPos.x, y: playerPos.y };
          entity.setTargetSighted(playerPos.x, playerPos.y);
          entity.behaviorState = 'pursuing';

          // Clear cached path since we are actively chasing
          aiBehavior.currentPath = [];

          const dx = playerPos.x - zombiePos.x;
          const dy = playerPos.y - zombiePos.y;
          const absDx = Math.abs(dx);
          const absDy = Math.abs(dy);
          const isAdjacent = (absDx + absDy === 1);
          const isDiagonal = (absDx === 1 && absDy === 1);
          const canMeleeAttack = isAdjacent || (isDiagonal && entity.subtype === 'mutant');

          if (canMeleeAttack) {
            let blockingStructure = null;
            if (isAdjacent) {
              blockingStructure = Pathfinding.getBlockingStructure(gameMap, zombiePos.x, zombiePos.y, playerPos.x, playerPos.y);
            } else {
              if (Pathfinding.canMoveDiagonally(gameMap, zombiePos.x, zombiePos.y, playerPos.x, playerPos.y, entity)) {
                blockingStructure = Pathfinding.getBlockingStructure(gameMap, zombiePos.x, zombiePos.y, playerPos.x, playerPos.y);
              }
            }

            if (blockingStructure) {
              if (currentAP >= 1.0) {
                enqueueIntent('DamageIntent', new DamageIntent({
                  amount: 1,
                  targetId: blockingStructure.id,
                  isStructure: true,
                  targetX: playerPos.x,
                  targetY: playerPos.y
                }));
              }
            } else {
              if (currentAP >= 2.0) {
                enqueueIntent('DamageIntent', new DamageIntent({ amount: 2, targetId: player.id }));
              }
            }
          } else {
            // Move toward player exact coords
            let intent = null;

            // Try limited A* Pathfinding first for close-range smart breaching/navigation
            const path = Pathfinding.findPath(gameMap, zombiePos.x, zombiePos.y, playerPos.x, playerPos.y, {
              allowDiagonal: true,
              isZombie: true,
              entity,
              maxDistance: 6, // Limit A* search to close range (dumb at distance)
              ignoreZombies: false, // Don't ignore zombies so they path around each other (swarm behavior)
              isPathfinding: true
            });

            if (path && path.length > 1) {
              const nextStep = path[1];
              const isPlayerTile = nextStep.x === playerPos.x && nextStep.y === playerPos.y;

              if (!isPlayerTile) {
                const isDiagonal = Math.abs(nextStep.x - zombiePos.x) === 1 && Math.abs(nextStep.y - zombiePos.y) === 1;
                const isBlockedDiagonal = isDiagonal && !Pathfinding.canMoveDiagonally(gameMap, zombiePos.x, zombiePos.y, nextStep.x, nextStep.y, entity);

                if (!isBlockedDiagonal) {
                  const blocking = Pathfinding.getBlockingStructure(gameMap, zombiePos.x, zombiePos.y, nextStep.x, nextStep.y);
                  if (blocking) {
                    intent = new DamageIntent({
                      amount: 1,
                      targetId: blocking.id,
                      isStructure: true,
                      targetX: nextStep.x,
                      targetY: nextStep.y
                    });
                  } else {
                    intent = new MoveIntent({ dx: nextStep.x - zombiePos.x, dy: nextStep.y - zombiePos.y });
                  }
                }
              }
            }

            // Fallback to Beeline if A* didn't yield an intent
            if (!intent) {
              intent = getBeelineIntent(entity, zombiePos, playerPos.x, playerPos.y, gameMap, moveCost);
            }

            if (intent) {
              const isMove = intent instanceof MoveIntent;
              const isDamage = intent instanceof DamageIntent;
              if (isMove && currentAP >= moveCost) {
                enqueueIntent('MoveIntent', intent);
              } else if (isDamage && currentAP >= 1.0) {
                enqueueIntent('DamageIntent', intent);
              }
            }
          }
        }
        // Priority 2: Investigating Last Sighted Position or Heard Noise
        else if (aiBehavior.lastSeenPlayerCoords || aiBehavior.heardNoiseCoords) {
          aiBehavior.alertnessState = 'INVESTIGATING';
          entity.behaviorState = 'investigating';

          const targetX = aiBehavior.lastSeenPlayerCoords ? aiBehavior.lastSeenPlayerCoords.x : aiBehavior.heardNoiseCoords.x;
          const targetY = aiBehavior.lastSeenPlayerCoords ? aiBehavior.lastSeenPlayerCoords.y : aiBehavior.heardNoiseCoords.y;

          if (zombiePos.x === targetX && zombiePos.y === targetY) {
            // Reached target: Clear memory
            aiBehavior.lastSeenPlayerCoords = null;
            aiBehavior.heardNoiseCoords = null;
            entity.clearLastSeen();
            entity.clearNoiseHeard();
            aiBehavior.currentPath = [];

            // Follow scent trail if available, else wander
            const freshestScent = ScentTrail.findFreshestScent(gameMap, zombiePos.x, zombiePos.y, 6, 0);
            if (freshestScent) {
              const distToScent = Math.sqrt(Math.pow(freshestScent.x - zombiePos.x, 2) + Math.pow(freshestScent.y - zombiePos.y, 2));
              const hasLOS = LineOfSight.hasLineOfSight(gameMap, zombiePos.x, zombiePos.y, freshestScent.x, freshestScent.y).hasLineOfSight;
              if (distToScent <= 1.5 || hasLOS) {
                entity.setTargetSighted(freshestScent.x, freshestScent.y);
                entity.lastScentSequence = freshestScent.sequence;
                entity.behaviorState = 'tracking';
                continue;
              }
            }
            executeWander();
          } else {
            // Check if we are adjacent to the target
            const absDx = Math.abs(targetX - zombiePos.x);
            const absDy = Math.abs(targetY - zombiePos.y);
            const isAdjacentToLkp = (absDx + absDy === 1) || (absDx === 1 && absDy === 1);
            
            if (isAdjacentToLkp) {
              const canAttack = (absDx + absDy === 1) || (absDx === 1 && absDy === 1 && entity.subtype === 'mutant');
              const blocking = Pathfinding.getBlockingStructure(gameMap, zombiePos.x, zombiePos.y, targetX, targetY);
              
              if (blocking) {
                if (canAttack) {
                  if (currentAP >= 1.0) {
                    enqueueIntent('DamageIntent', new DamageIntent({
                      amount: 1,
                      targetId: blocking.id,
                      isStructure: true,
                      targetX: targetX,
                      targetY: targetY
                    }));
                  }
                  continue;
                }
                // Basic diagonal zombie next to a blocked tile should not hold position;
                // it needs to pathfind to a cardinal neighbor to attack.
              } else {
                // If we are adjacent to the LKP and there is no structure block, we are close enough.
                // Do not wander away; hold position and wait.
                continue;
              }
            }

            // Path caching optimization
            let needRecalculate = false;
            
            if (!aiBehavior.currentPath || aiBehavior.currentPath.length <= 1) {
              needRecalculate = true;
            } else {
              // Check if cached target matches memory coords target
              const cachedTarget = aiBehavior.currentPath[aiBehavior.currentPath.length - 1];
              if (cachedTarget.x !== targetX || cachedTarget.y !== targetY) {
                needRecalculate = true;
              } else {
                // Check if next step is blocked
                const nextStep = aiBehavior.currentPath[1];
                const tile = gameMap.getTile(nextStep.x, nextStep.y);
                if (!tile) {
                  needRecalculate = true;
                } else {
                  const isWalkable = Pathfinding.isTileWalkable(tile, entity, { isZombie: true });
                  const isEdgeBlocked = Pathfinding.isEdgeBlocked(gameMap, zombiePos.x, zombiePos.y, nextStep.x, nextStep.y, entity, { isZombie: true });
                  if (!isWalkable || isEdgeBlocked) {
                    needRecalculate = true;
                  }
                }
              }
            }

            if (needRecalculate) {
              aiBehavior.currentPath = Pathfinding.findPath(gameMap, zombiePos.x, zombiePos.y, targetX, targetY, { entity, isZombie: true });
            }

            if (aiBehavior.currentPath && aiBehavior.currentPath.length > 1) {
              const nextStep = aiBehavior.currentPath[1];
              const blocking = Pathfinding.getBlockingStructure(gameMap, zombiePos.x, zombiePos.y, nextStep.x, nextStep.y);

              if (blocking) {
                if (currentAP >= 1.0) {
                  enqueueIntent('DamageIntent', new DamageIntent({
                    amount: 1,
                    targetId: blocking.id,
                    isStructure: true,
                    targetX: nextStep.x,
                    targetY: nextStep.y
                  }));
                }
              } else {
                if (currentAP >= moveCost) {
                  enqueueIntent('MoveIntent', new MoveIntent({ dx: nextStep.x - zombiePos.x, dy: nextStep.y - zombiePos.y }));
                  // Shift the position off the cached path since we successfully enqueued a move
                  aiBehavior.currentPath.shift();
                }
              }
            } else {
              // Path blocked or no path, we're likely stuck or reached as close as possible
              // If we are already adjacent, we wouldn't reach here due to the check above.
              aiBehavior.lastSeenPlayerCoords = null;
              aiBehavior.heardNoiseCoords = null;
              entity.clearLastSeen();
              entity.clearNoiseHeard();
              aiBehavior.currentPath = [];
              executeWander();
            }
          }
        }
        // Priority 3: Follow Scent Trail
        else {
          const freshestScent = ScentTrail.findFreshestScent(gameMap, zombiePos.x, zombiePos.y, 5, entity.lastScentSequence || 0);
          if (freshestScent) {
            const distToScent = Math.sqrt(Math.pow(freshestScent.x - zombiePos.x, 2) + Math.pow(freshestScent.y - zombiePos.y, 2));
            const hasLOS = LineOfSight.hasLineOfSight(gameMap, zombiePos.x, zombiePos.y, freshestScent.x, freshestScent.y).hasLineOfSight;
            if (distToScent <= 1.5 || hasLOS) {
              entity.behaviorState = 'tracking';
              entity.lastScentSequence = freshestScent.sequence;
              entity.setTargetSighted(freshestScent.x, freshestScent.y);
              aiBehavior.alertnessState = 'INVESTIGATING';
              continue;
            }
          }

          // Priority 4: Random Wander
          aiBehavior.alertnessState = 'IDLE';
          executeWander();
        }
      }
    }

    return intentsGenerated;
  }
}
