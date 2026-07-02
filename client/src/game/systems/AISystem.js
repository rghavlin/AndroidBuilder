import { Pathfinding } from '../utils/Pathfinding.js';
import { DamageIntent } from '../components/DamageIntent.js';
import { MoveIntent } from '../components/MoveIntent.js';
import { ScentTrail, SCENT_FOLLOW_RADIUS } from '../utils/ScentTrail.js';

import { gameRandom } from '../utils/SeededRandom.js';
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
  if (entity.deaf) return false;
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
 * `canReachTile` indicates whether the zombie could actually step onto the target
 * tile in one move (open and not separated by a solid edge wall) — used to tell a
 * genuinely-adjacent target from one that is walled off.
 *
 * @returns {{ isAdjacent:boolean, isDiagonal:boolean, canMeleeAttack:boolean, blockingStructure:Object|null, canReachTile:boolean }}
 */
function getMeleeReach(entity, gameMap, fromX, fromY, targetX, targetY) {
  const absDx = Math.abs(targetX - fromX);
  const absDy = Math.abs(targetY - fromY);
  const isAdjacent = (absDx + absDy === 1);
  const isDiagonal = (absDx === 1 && absDy === 1);
  const canMeleeAttack = isAdjacent || (isDiagonal && entity.subtype === 'mutant');

  let blockingStructure = null;
  let canReachTile = false;
  if (canMeleeAttack) {
    const targetTile = gameMap.getTile(targetX, targetY);
    const tileOpen = !!targetTile && targetTile.isWalkable(entity, { ignoreZombies: true });
    if (isAdjacent) {
      blockingStructure = Pathfinding.getBlockingStructure(gameMap, fromX, fromY, targetX, targetY);
      canReachTile = tileOpen && !Pathfinding.isEdgeBlocked(gameMap, fromX, fromY, targetX, targetY, entity, { isZombie: true });
    } else if (Pathfinding.canMoveDiagonally(gameMap, fromX, fromY, targetX, targetY, entity)) {
      blockingStructure = Pathfinding.getBlockingStructure(gameMap, fromX, fromY, targetX, targetY);
      canReachTile = tileOpen;
    }
  }
  return { isAdjacent, isDiagonal, canMeleeAttack, blockingStructure, canReachTile };
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
 * Greedy hunting fallback: take the single step that best reduces distance to the
 * player, instead of wandering randomly. Used by huntPlayer when the close-range
 * A* (capped) and the straight-line beeline both come up empty — the two cases
 * that previously dumped the zombie into a random wander and produced the visible
 * oscillation / backstepping over a multi-step turn:
 *   - lining up a CARDINAL approach to a window that is off the direct line to a
 *     diagonally-visible player (the beeline only steps straight at the player and
 *     never sidesteps to line up the opening), and
 *   - rounding a lone obstacle when the player sits just beyond A*'s search radius.
 *
 * Considers every reachable neighbour — cardinal moves, breaching a closed
 * door/window in the way, and clean diagonals — scores each by its remaining
 * Chebyshev distance to the player (diagonal-aware, matching the A* heuristic),
 * and lightly penalises stepping back onto the tile we just left so the zombie
 * doesn't ping-pong. Never steps onto the player's own tile (melee handles that).
 *
 * @returns {MoveIntent|DamageIntent|null} null only when genuinely boxed in.
 */
function getGreedyHuntIntent(entity, zombiePos, targetX, targetY, gameMap, lastTile) {
  const fromX = zombiePos.x;
  const fromY = zombiePos.y;
  const candidates = [];

  // Cardinal neighbours: step through an open edge, or breach a closed structure.
  const cardinals = [{ dx: 1, dy: 0 }, { dx: -1, dy: 0 }, { dx: 0, dy: 1 }, { dx: 0, dy: -1 }];
  for (const { dx, dy } of cardinals) {
    const nx = fromX + dx;
    const ny = fromY + dy;
    if (nx === targetX && ny === targetY) continue; // never body-block onto the player
    const tile = gameMap.getTile(nx, ny);
    if (!tile) continue;

    const blocking = Pathfinding.getBlockingStructure(gameMap, fromX, fromY, nx, ny);
    if (blocking) {
      // A breachable door/window between us and the next tile — attacking it is
      // forward progress toward the player.
      candidates.push({
        nx, ny,
        intent: new DamageIntent({ amount: 1, targetId: blocking.id, isStructure: true, targetX: nx, targetY: ny })
      });
      continue;
    }
    if (Pathfinding.isEdgeBlocked(gameMap, fromX, fromY, nx, ny, entity, { isZombie: true })) continue;
    if (!tile.isWalkable(entity, { ignoreZombies: false })) continue;
    candidates.push({ nx, ny, intent: new MoveIntent({ dx, dy }) });
  }

  // Diagonal neighbours: clean pass only (a diagonal can't breach a corner).
  const diagonals = [{ dx: 1, dy: 1 }, { dx: 1, dy: -1 }, { dx: -1, dy: 1 }, { dx: -1, dy: -1 }];
  for (const { dx, dy } of diagonals) {
    const nx = fromX + dx;
    const ny = fromY + dy;
    if (nx === targetX && ny === targetY) continue;
    const tile = gameMap.getTile(nx, ny);
    if (!tile) continue;
    if (!Pathfinding.canMoveDiagonally(gameMap, fromX, fromY, nx, ny, entity)) continue;
    if (!tile.isWalkable(entity, { ignoreZombies: false })) continue;
    candidates.push({ nx, ny, intent: new MoveIntent({ dx, dy }) });
  }

  if (candidates.length === 0) return null;

  // Score by remaining Chebyshev distance to the player; add a small penalty for
  // stepping back onto the tile we just left so equal-distance lateral moves win
  // over a pointless reversal (a strictly-closer backtrack is still allowed).
  let bestScore = Infinity;
  for (const c of candidates) {
    const dist = Math.max(Math.abs(c.nx - targetX), Math.abs(c.ny - targetY));
    const isBacktrack = lastTile && lastTile.x === c.nx && lastTile.y === c.ny;
    c.score = dist + (isBacktrack ? 0.5 : 0);
    if (c.score < bestScore) bestScore = c.score;
  }

  const best = candidates.filter(c => c.score === bestScore);
  return best[gameRandom.nextInt(0, best.length - 1)].intent;
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
    const chosen = walkable[gameRandom.nextInt(0, walkable.length - 1)];
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

  // A* toward the player. The search radius must give A* enough room to route
  // AROUND walls to a VISIBLE player — e.g. across to an off-axis window — rather
  // than bail to the straight-line beeline below. The old flat cap of 6 was the
  // root cause of the "won't go through the window / oscillates" bug: when a
  // visible player sat >6 tiles away, A* returned nothing, the beeline stepped
  // straight at the player into the dead-end wall, and the investigate branch
  // (uncapped A*) pulled the other way toward the opening — so the zombie ping-
  // ponged forever. Since hunting requires line of sight, the player is already
  // within sight range; sizing the radius to ~2x the straight-line distance
  // covers realistic detours while still bounding the search (Manhattan radius
  // from the zombie, so a detour needs headroom beyond the direct distance).
  const manhattanToPlayer = Math.abs(playerPos.x - zombiePos.x) + Math.abs(playerPos.y - zombiePos.y);
  const huntSearchRadius = Math.max(8, manhattanToPlayer * 2 + 2);
  const path = Pathfinding.findPath(gameMap, zombiePos.x, zombiePos.y, playerPos.x, playerPos.y, {
    allowDiagonal: true,
    isZombie: true,
    entity,
    maxDistance: huntSearchRadius,
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

  // Greedy fallback before any random wander: take the single distance-reducing
  // step (breaching a structure in the way, refusing to reverse) so the zombie
  // lines up off-axis windows and rounds lone obstacles that the capped A* and
  // straight-line beeline miss, instead of jittering randomly across the turn.
  if (!intent) {
    intent = getGreedyHuntIntent(entity, zombiePos, playerPos.x, playerPos.y, gameMap, aiBehavior.lastTile);
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
    // Genuinely boxed in (e.g. visible across a thin edge wall with no door and
    // no reachable neighbour that helps). Random wander as the absolute last
    // resort instead of freezing; the LKP is set, so hunting resumes on an angle.
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

  // Adjacent to the target tile (melee range).
  const reach = getMeleeReach(entity, gameMap, zombiePos.x, zombiePos.y, targetX, targetY);
  if (reach.canMeleeAttack && reach.blockingStructure) {
    // Breach the structure (e.g. a door) between us and the last-known-position.
    if (currentAP >= 1.0) {
      ctx.enqueue('DamageIntent', new DamageIntent({
        amount: 1,
        targetId: reach.blockingStructure.id,
        isStructure: true,
        targetX: targetX,
        targetY: targetY
      }));
    }
    return;
  }
  if (reach.canMeleeAttack && !reach.canReachTile) {
    // Adjacent to the target but walled off with nothing to breach (e.g. a thin
    // wall between us and the last-known-position). We can never reach it, so
    // abandon this target instead of freezing; resume scent-following / wander.
    aiBehavior.lastSeenPlayerCoords = null;
    aiBehavior.heardNoiseCoords = null;
    entity.clearLastSeen();
    entity.clearNoiseHeard();
    aiBehavior.currentPath = [];
    if (tryFollowScent(entity, zombiePos, gameMap, aiBehavior)) return;
    wander(ctx);
    return;
  }
  // If adjacent and reachable we deliberately do NOT hold: the player is not
  // visible (or we'd be hunting), so they are not on the LKP. Fall through to
  // pathfinding and step onto the tile; reaching it next turn clears the memory
  // and resumes the search, rather than freezing here indefinitely.

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
          if (intentType === 'MoveIntent') {
            // Remember the tile we're leaving so the greedy hunting fallback can
            // avoid immediately stepping back onto it (anti-oscillation). Captured
            // here, before the move resolves, so it reflects the pre-move tile.
            aiBehavior.lastTile = { x: zombiePos.x, y: zombiePos.y };
          }
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
      // Hunting is gated on faction hostility. Zombies are HOSTILE -> player in
      // the stance table, so this is always true today (no behavior change); the
      // candidate set widens in later phases as other factions become targetable.
      if (playerInLoS && entity.isHostileTo(player)) {
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
