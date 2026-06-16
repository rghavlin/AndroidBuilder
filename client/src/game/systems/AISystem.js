import { Pathfinding } from '../utils/Pathfinding.js';
import { DamageIntent } from '../components/DamageIntent.js';
import { MoveIntent } from '../components/MoveIntent.js';
import { ScentTrail, SCENT_FOLLOW_RADIUS } from '../utils/ScentTrail.js';

/**
 * Attempt to lock a zombie onto the freshest nearby scent breadcrumb.
 * On success the breadcrumb is set as a sighted target (a temporary LKP), so the
 * Investigating branch will A*-path to it on the next tick. We intentionally do
 * NOT require line of sight or proximity: scent trails exist precisely to track
 * the player around corners and through doors where LOS is blocked, and A*
 * already routes around walls (returning no path -> the zombie falls to wander).
 *
 * @param {Entity} entity - The zombie
 * @param {Position} zombiePos - The zombie's position component
 * @param {GameMap} gameMap - The game map
 * @param {AIBehavior} aiBehavior - The zombie's AIBehavior component
 * @returns {boolean} true if a scent was found and the zombie was retargeted
 */
function tryFollowScent(entity, zombiePos, gameMap, aiBehavior) {
  const freshestScent = ScentTrail.findFreshestScent(
    gameMap, zombiePos.x, zombiePos.y, SCENT_FOLLOW_RADIUS, entity.lastScentSequence || 0
  );
  if (!freshestScent) return false;

  entity.lastScentSequence = freshestScent.sequence;
  entity.behaviorState = 'tracking';
  entity.setTargetSighted(freshestScent.x, freshestScent.y);
  aiBehavior.alertnessState = 'INVESTIGATING';
  return true;
}

/**
 * Compute melee reachability from one tile to an adjacent target tile.
 * Shared by the hunting and investigating branches so adjacency / diagonal /
 * structure-blocking rules stay consistent. A diagonal target only counts as a
 * melee option for mutant zombies, and a diagonal that is blocked by walls
 * yields no blocking structure (the caller decides what to do in that case).
 *
 * @returns {{ isAdjacent:boolean, isDiagonal:boolean, canMeleeAttack:boolean, blockingStructure:Object|null }}
 */
function getMeleeReach(entity, gameMap, fromX, fromY, targetX, targetY) {
  const absDx = Math.abs(targetX - fromX);
  const absDy = Math.abs(targetY - fromY);
  const isAdjacent = (absDx + absDy === 1);
  const isDiagonal = (absDx === 1 && absDy === 1);
  const canMeleeAttack = isAdjacent || (isDiagonal && entity.subtype === 'mutant');

  let blockingStructure = null;
  if (canMeleeAttack) {
    if (isAdjacent) {
      blockingStructure = Pathfinding.getBlockingStructure(gameMap, fromX, fromY, targetX, targetY);
    } else if (Pathfinding.canMoveDiagonally(gameMap, fromX, fromY, targetX, targetY, entity)) {
      blockingStructure = Pathfinding.getBlockingStructure(gameMap, fromX, fromY, targetX, targetY);
    }
  }
  return { isAdjacent, isDiagonal, canMeleeAttack, blockingStructure };
}

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

/**
 * Priority 4 (last resort): random one-tile walk to a truly reachable neighbour.
 * Neighbours must be both tile-walkable AND not separated by a thin edge wall,
 * otherwise moveEntity silently rejects the move and the zombie loops in place.
 */
function wander(ctx) {
  const { entity, zombiePos, gameMap, aiBehavior, currentAP, moveCost } = ctx;
  entity.behaviorState = 'wandering';
  aiBehavior.alertnessState = 'IDLE';
  if (currentAP < moveCost) return;

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
    if (!tile || !tile.isWalkable(entity, { ignoreZombies: false })) return false;
    // A tile can be walkable yet separated by a thin edge wall; such a move
    // is silently rejected by moveEntity, leaving the zombie stuck retrying it.
    return !Pathfinding.isEdgeBlocked(gameMap, x, y, pos.x, pos.y, entity, { isZombie: true });
  });
  if (walkable.length > 0) {
    const chosen = walkable[Math.floor(Math.random() * walkable.length)];
    ctx.enqueue('MoveIntent', new MoveIntent({ dx: chosen.x - x, dy: chosen.y - y }));
  }
}

/**
 * Priority 1: the player is currently visible. Attack if in melee range,
 * otherwise step toward the player (smart A* at close range, beeline fallback),
 * and wander as a last resort if no progress toward the player is possible.
 */
function huntPlayer(ctx) {
  const { entity, zombiePos, gameMap, player, playerPos, aiBehavior, currentAP, moveCost } = ctx;

  aiBehavior.alertnessState = 'HUNTING';
  aiBehavior.lastSeenPlayerCoords = { x: playerPos.x, y: playerPos.y };
  entity.setTargetSighted(playerPos.x, playerPos.y);
  entity.behaviorState = 'pursuing';

  // Clear cached path since we are actively chasing
  aiBehavior.currentPath = [];

  const reach = getMeleeReach(entity, gameMap, zombiePos.x, zombiePos.y, playerPos.x, playerPos.y);

  if (reach.canMeleeAttack) {
    if (reach.blockingStructure) {
      if (currentAP >= 1.0) {
        ctx.enqueue('DamageIntent', new DamageIntent({
          amount: 1,
          targetId: reach.blockingStructure.id,
          isStructure: true,
          targetX: playerPos.x,
          targetY: playerPos.y
        }));
      }
    } else {
      if (currentAP >= 2.0) {
        ctx.enqueue('DamageIntent', new DamageIntent({ amount: 2, targetId: player.id }));
      }
    }
    return;
  }

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
      ctx.enqueue('MoveIntent', intent);
    } else if (isDamage && currentAP >= 1.0) {
      ctx.enqueue('DamageIntent', intent);
    }
  } else {
    // No path, no beeline step, and nothing to breach toward the player
    // (e.g. visible across a thin edge wall with no door). Reposition via a
    // wander step instead of freezing in place; the LKP is already set, so
    // the zombie will resume hunting/investigating once it has an angle.
    wander(ctx);
  }
}

/**
 * Priority 2: the player is not visible but the zombie remembers a last-known
 * position (from sight/scent) or a heard noise. Walk toward it; on arrival, pick
 * up a scent trail if one exists, otherwise wander.
 */
function investigate(ctx) {
  const { entity, zombiePos, gameMap, aiBehavior, currentAP, moveCost } = ctx;

  aiBehavior.alertnessState = 'INVESTIGATING';
  entity.behaviorState = 'investigating';

  const targetX = aiBehavior.lastSeenPlayerCoords ? aiBehavior.lastSeenPlayerCoords.x : aiBehavior.heardNoiseCoords.x;
  const targetY = aiBehavior.lastSeenPlayerCoords ? aiBehavior.lastSeenPlayerCoords.y : aiBehavior.heardNoiseCoords.y;

  // Reached the target: clear memory, then follow a scent trail if available.
  if (zombiePos.x === targetX && zombiePos.y === targetY) {
    aiBehavior.lastSeenPlayerCoords = null;
    aiBehavior.heardNoiseCoords = null;
    entity.clearLastSeen();
    entity.clearNoiseHeard();
    aiBehavior.currentPath = [];

    if (tryFollowScent(entity, zombiePos, gameMap, aiBehavior)) return;
    wander(ctx);
    return;
  }

  // In melee range of the target tile: breach a blocking structure, else hold.
  const reach = getMeleeReach(entity, gameMap, zombiePos.x, zombiePos.y, targetX, targetY);
  if (reach.canMeleeAttack) {
    if (reach.blockingStructure) {
      if (currentAP >= 1.0) {
        ctx.enqueue('DamageIntent', new DamageIntent({
          amount: 1,
          targetId: reach.blockingStructure.id,
          isStructure: true,
          targetX: targetX,
          targetY: targetY
        }));
      }
    }
    // Adjacent with no structure to breach: hold position and wait.
    return;
  }

  // Path caching optimization: reuse the cached path unless it is stale/blocked.
  let needRecalculate = false;
  if (!aiBehavior.currentPath || aiBehavior.currentPath.length <= 1) {
    needRecalculate = true;
  } else {
    const cachedTarget = aiBehavior.currentPath[aiBehavior.currentPath.length - 1];
    if (cachedTarget.x !== targetX || cachedTarget.y !== targetY) {
      needRecalculate = true;
    } else {
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
        ctx.enqueue('DamageIntent', new DamageIntent({
          amount: 1,
          targetId: blocking.id,
          isStructure: true,
          targetX: nextStep.x,
          targetY: nextStep.y
        }));
      }
    } else if (currentAP >= moveCost) {
      ctx.enqueue('MoveIntent', new MoveIntent({ dx: nextStep.x - zombiePos.x, dy: nextStep.y - zombiePos.y }));
      // Shift the position off the cached path since we successfully enqueued a move
      aiBehavior.currentPath.shift();
    }
  } else {
    // Path blocked or no path: give up this target and wander.
    aiBehavior.lastSeenPlayerCoords = null;
    aiBehavior.heardNoiseCoords = null;
    entity.clearLastSeen();
    entity.clearNoiseHeard();
    aiBehavior.currentPath = [];
    wander(ctx);
  }
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
      if (entity.type !== 'zombie' || entity.hp <= 0 || !entity.hasComponent('AIBehavior') || !entity.hasComponent('Position')) {
        continue;
      }
      // Skip zombies that already have an unresolved intent this turn.
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

      // Decision context shared with the named behaviour functions.
      const ctx = {
        entity, zombiePos, gameMap, player, playerPos, aiBehavior, currentAP, moveCost,
        enqueue(intentType, intent) {
          if (intentQueue) {
            intentQueue.enqueue(entity.id, intentType, intent);
          } else {
            entity.addComponent(intent);
          }
          intentsGenerated++;
        }
      };

      // Visibility: prefer the cached Vision component, fall back to direct LOS.
      const playerInLoS = vision
        ? vision.visibleEntities.includes(player.id)
        : entity.canSeeEntity(gameMap, player);

      // --- Decision tree (highest priority first) ---
      if (playerInLoS) {
        huntPlayer(ctx);                                                   // Priority 1: hunt
      } else if (aiBehavior.lastSeenPlayerCoords || aiBehavior.heardNoiseCoords) {
        investigate(ctx);                                                  // Priority 2: investigate
      } else if (!tryFollowScent(entity, zombiePos, gameMap, aiBehavior)) {
        wander(ctx);                                                       // Priority 3 scent, else 4 wander
      }
    }

    return intentsGenerated;
  }
}
