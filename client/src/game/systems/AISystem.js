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
  static process(entities, worldManager, engine) {
    const entityList = Array.isArray(entities)
      ? entities
      : (entities instanceof Map ? Array.from(entities.values()) : Object.values(entities));

    // Find player entity
    const player = entityList.find(e => e.hasComponent('InventoryContainer') && e.hasComponent('Position'));
    if (!player) return;

    const playerPos = player.getComponent('Position');
    const gameMap = engine ? engine.gameMap : null;
    if (!gameMap) return;

    const npcs = entityList.filter(e => e.type === 'npc' && e.hp > 0 && !e.hasExited);

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

        // Helper: execute random walk
        const executeWander = () => {
          entity.behaviorState = 'wandering';
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
              entity.addComponent(new MoveIntent({ dx: chosen.x - x, dy: chosen.y - y }));
            }
          }
        };

        // 1. Gather all potential targets (player + active NPCs)
        const potentialTargets = [player, ...npcs];

        // Find closest visible target
        let target = null;
        let minDist = Infinity;
        potentialTargets.forEach(t => {
          if (entity.canSeeEntity(gameMap, t)) {
            const dist = entity.getDistanceTo(t.logicalX, t.logicalY);
            if (dist < minDist) {
              minDist = dist;
              target = t;
            }
          }
        });

        // Target Sighting & Memory Synchronization
        if (target) {
          entity.currentTarget = { id: target.id, type: target.id === player.id ? 'player' : 'npc' };
          if (target.id === player.id) {
            entity.setTargetSighted(target.logicalX, target.logicalY);
          }
          entity.behaviorState = 'pursuing';
        } else {
          // Verify if memory target is still valid
          let targetValid = false;
          if (entity.currentTarget) {
            if (entity.currentTarget.id === player.id) {
              target = player;
              targetValid = true;
            } else {
              const np = npcs.find(n => n.id === entity.currentTarget.id);
              if (np) {
                target = np;
                targetValid = true;
              }
            }
          }
          if (!targetValid) {
            entity.currentTarget = null;
            target = null;
          }
        }

        const canSee = target && entity.canSeeEntity(gameMap, target);

        // --- Decision Tree ---

        // Priority 1: Pursue Visible Target
        if (canSee) {
          const dx = target.logicalX - zombiePos.x;
          const dy = target.logicalY - zombiePos.y;
          const absDx = Math.abs(dx);
          const absDy = Math.abs(dy);
          const isAdjacent = (absDx + absDy === 1);
          const isDiagonal = (absDx === 1 && absDy === 1);
          const canMeleeAttack = isAdjacent || (isDiagonal && entity.subtype === 'mutant');

          if (canMeleeAttack) {
            let blockingStructure = null;
            if (isAdjacent) {
              blockingStructure = Pathfinding.getBlockingStructure(gameMap, zombiePos.x, zombiePos.y, target.logicalX, target.logicalY);
            } else {
              if (!Pathfinding.canMoveDiagonally(gameMap, zombiePos.x, zombiePos.y, target.logicalX, target.logicalY, entity)) {
                // Corner blocked
              } else {
                blockingStructure = Pathfinding.getBlockingStructure(gameMap, zombiePos.x, zombiePos.y, target.logicalX, target.logicalY);
              }
            }

            if (blockingStructure) {
              if (currentAP >= 1.0) {
                entity.addComponent(new DamageIntent({
                  amount: 1,
                  targetId: blockingStructure.id,
                  isStructure: true,
                  targetX: target.logicalX,
                  targetY: target.logicalY
                }));
              }
            } else {
              if (currentAP >= 2.0) {
                entity.addComponent(new DamageIntent({ amount: 2, targetId: target.id }));
              }
            }
          } else {
            // Move toward target using Beeline
            const intent = getBeelineIntent(entity, zombiePos, target.logicalX, target.logicalY, gameMap, moveCost);
            if (intent) {
              const isMove = intent instanceof MoveIntent;
              const isDamage = intent instanceof DamageIntent;
              if (isMove && currentAP >= moveCost) {
                entity.addComponent(intent);
              } else if (isDamage && currentAP >= 1.0) {
                entity.addComponent(intent);
              }
            }
          }
        }
        // Priority 2: Investigate Last Sighted Position or Heard Noise
        else if (entity.lastSeen || entity.heardNoise) {
          const targetX = entity.lastSeen ? entity.targetSightedCoords.x : entity.noiseCoords.x;
          const targetY = entity.lastSeen ? entity.targetSightedCoords.y : entity.noiseCoords.y;

          if (zombiePos.x === targetX && zombiePos.y === targetY) {
            // Reached destination - check for breadcrumbs
            const freshest = ScentTrail.findFreshestScent(gameMap, zombiePos.x, zombiePos.y, 6, 0);
            if (freshest) {
              const distToScent = Math.sqrt(Math.pow(freshest.x - zombiePos.x, 2) + Math.pow(freshest.y - zombiePos.y, 2));
              const hasLOS = LineOfSight.hasLineOfSight(gameMap, zombiePos.x, zombiePos.y, freshest.x, freshest.y).hasLineOfSight;
              if (distToScent <= 1.5 || hasLOS) {
                entity.setTargetSighted(freshest.x, freshest.y);
                entity.lastScentSequence = freshest.sequence;
                entity.behaviorState = 'tracking';
                continue; // Re-evaluate or wait
              }
            }
            entity.clearLastSeen();
            entity.clearNoiseHeard();
            executeWander();
          } else {
            entity.behaviorState = 'investigating';
            const intent = getBeelineIntent(entity, zombiePos, targetX, targetY, gameMap, moveCost);
            if (intent) {
              const isMove = intent instanceof MoveIntent;
              const isDamage = intent instanceof DamageIntent;
              if (isMove && currentAP >= moveCost) {
                entity.addComponent(intent);
              } else if (isDamage && currentAP >= 1.0) {
                entity.addComponent(intent);
              }
            } else {
              // Path blocked (beeline failed to find any step) - clear target memory
              entity.clearLastSeen();
              entity.clearNoiseHeard();
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
              continue;
            }
          }

          // Priority 4: Random Wander
          executeWander();
        }
      }
    }
  }
}
