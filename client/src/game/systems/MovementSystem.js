import { FireSystem } from '../systems/FireSystem.js';
import engine from '../GameEngine.js';
import { markHeardIfInRange } from '../utils/PlayerHearing.js';
import { ScentTrail } from '../utils/ScentTrail.js';

const ZOMBIE_MOVE_NOISE = 3;

export class MovementSystem {
  static resolve(entity, moveIntent, gameMap, actionQueue = []) {
    if (!gameMap || !entity) return;
    if (!entity.hasComponent('Position') || !entity.hasComponent('Movable')) return;

    const position = entity.getComponent('Position');
    const movable = entity.getComponent('Movable');

    const targetX = position.x + moveIntent.dx;
    const targetY = position.y + moveIntent.dy;

    const oldX = position.x;
    const oldY = position.y;

    let moved = false;
    if (typeof gameMap.moveEntity === 'function') {
      moved = gameMap.moveEntity(entity.id, targetX, targetY, { snap: false });
    } else {
      // R16#3: the old fallback teleported the Position component directly with
      // no walkability/occupancy check and no tile-contents / spatial-index
      // update, silently desyncing position from the map. Fail loudly instead
      // of succeeding falsely — every real map (and the test harness) provides
      // moveEntity.
      throw new Error(`[MovementSystem] gameMap.moveEntity is not a function; cannot resolve MoveIntent for ${entity.id} without desyncing the spatial index.`);
    }

    if (moved) {
      if (entity.hasComponent('Vision')) {
        entity.getComponent('Vision')._visionDirty = true;
      }
      
      // Check if entity walked into fire
      FireSystem.checkTileIgnition(entity, gameMap);
      
      actionQueue.push({
        type: 'MOVE',
        entityId: entity.id,
        data: {
          from: { x: oldX, y: oldY },
          to: { x: targetX, y: targetY }
        }
      });

      // Deduct Movable.apCost from action points if tracked
      if (entity.ap !== undefined) {
        entity.ap = Math.max(0, entity.ap - movable.apCost);
      } else if (entity.currentAP !== undefined) {
        entity.currentAP = Math.max(0, entity.currentAP - movable.apCost);
      }

      // Idle zombies are silent; a moving one might be within the player's
      // Perception-based earshot even without line of sight.
      if (entity.type === 'zombie' && engine.player) {
        markHeardIfInRange(entity, engine.player, ZOMBIE_MOVE_NOISE);
      }

      // Moving NPCs leave scent so zombies can track them (legacy NPCAI dropped
      // scent on every step; zombie moves deliberately do not).
      if (entity.type === 'npc') {
        ScentTrail.dropScent(gameMap, targetX, targetY);
      }
    }

    // Cleanup: Remove MoveIntent from entity
    entity.removeComponent('MoveIntent');
  }

  static process(entities, worldManager, engine, actionQueue = []) {
    const gameMap = engine ? engine.gameMap : null;
    if (!gameMap) return;

    const entityList = Array.isArray(entities)
      ? entities
      : (entities instanceof Map ? Array.from(entities.values()) : Object.values(entities));

    for (const entity of entityList) {
      if (entity.hasComponent('Position') && entity.hasComponent('Movable') && entity.hasComponent('MoveIntent')) {
        const moveIntent = entity.getComponent('MoveIntent');
        this.resolve(entity, moveIntent, gameMap, actionQueue);
      }
    }
  }
}
