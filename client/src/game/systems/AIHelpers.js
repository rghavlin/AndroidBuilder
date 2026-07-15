import { Pathfinding } from '../utils/Pathfinding.js';

/**
 * AIHelpers - mechanics shared between the zombie AI (AISystem) and the NPC AI.
 * Pure functions only: no intent emission, no entity mutation.
 */

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
export function getMeleeReach(entity, gameMap, fromX, fromY, targetX, targetY) {
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

/**
 * True when `entity` could melee-attack `target` from tile (fromX, fromY):
 * cardinally adjacent (diagonal for mutants), with no closed door/window and no
 * solid edge wall on the boundary between the two tiles.
 */
export function isMeleeAttackPosition(entity, gameMap, fromX, fromY, target) {
  const tx = target.logicalX;
  const ty = target.logicalY;
  const reach = getMeleeReach(entity, gameMap, fromX, fromY, tx, ty);
  if (!reach.canMeleeAttack || reach.blockingStructure) return false;
  // A plain edge wall (no breachable structure) also rules the position out.
  if (reach.isAdjacent && Pathfinding.isEdgeBlocked(gameMap, fromX, fromY, tx, ty, entity)) return false;
  return true;
}

/**
 * Pick the best free cardinal attack slot next to `target` and an A* path to it.
 *
 * A slot is valid when melee from it would connect (see isMeleeAttackPosition)
 * and the tile itself is enterable (breachable structures allowed — the stepper
 * opens doors/windows en route). The A* target is always a walkable neighbor
 * tile, never the target's own occupied tile, so the pathfinder's
 * unwalkable-target bypass can never hand back the target's tile as a step.
 *
 * @returns {{ slot:{x,y}, path:Array<{x,y}> }|null}
 *   path[0] is the entity's current tile; path.length === 1 means the entity
 *   already stands on a valid slot. null when no slot is reachable.
 */
export function findAttackSlotPath(gameMap, entity, target) {
  const tx = target.logicalX;
  const ty = target.logicalY;
  // Deterministic N/E/S/W tie-break order.
  const slots = [
    { x: tx, y: ty - 1 },
    { x: tx + 1, y: ty },
    { x: tx, y: ty + 1 },
    { x: tx - 1, y: ty }
  ];

  let best = null;
  for (const slot of slots) {
    const tile = gameMap.getTile(slot.x, slot.y);
    if (!tile) continue;
    if (!isMeleeAttackPosition(entity, gameMap, slot.x, slot.y, target)) continue;

    if (entity.logicalX === slot.x && entity.logicalY === slot.y) {
      return { slot, path: [{ x: slot.x, y: slot.y }] };
    }

    if (!tile.isWalkable(entity, { allowBreaching: true })) continue;

    const path = Pathfinding.findPath(gameMap, entity.logicalX, entity.logicalY, slot.x, slot.y, { entity });
    if (path && path.length > 1 && (!best || path.length < best.path.length)) {
      best = { slot, path };
    }
  }

  return best;
}
