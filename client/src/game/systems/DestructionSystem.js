import { NoiseEvent } from '../components/NoiseEvent.js';
import engine from '../GameEngine.js';
import { createItemFromDef } from '../inventory/ItemDefs.js';
import { EntityType } from '../entities/Entity.js';

import { gameRandom } from '../utils/SeededRandom.js';
import { dropZombieDeathLoot } from '../entities/ZombieCorpseConfig.js';
export class DestructionSystem {
  /**
   * Resolve a single DestroyIntent.
   * @param {Object} destroyIntent - The DestroyIntent component
   * @param {Array} entities - List of active entities
   * @param {GameMap} gameMap - Current game map
   * @param {IntentQueue} intentQueue - The central intent queue
   * @param {Array} actionQueue - Sequential visual actions list
   * @param {Object|null} parentEnvelope - Parent intent envelope for tracking cascade depth
   */
  static resolve(destroyIntent, entities, gameMap, intentQueue, actionQueue = [], parentEnvelope = null) {
    const targetId = destroyIntent.entityId;
    if (!targetId) return;

    // Find target
    const target = entities.find(e => e.id === targetId) || (gameMap ? gameMap.getEntity(targetId) : null);
    
    let x = 0;
    let y = 0;
    if (target) {
      x = target.logicalX !== undefined ? target.logicalX : (target.x || 0);
      y = target.logicalY !== undefined ? target.logicalY : (target.y || 0);
      
      let npcItems = [];
      if (target.type === EntityType.NPC) {
        npcItems = target.inventory ? target.inventory.getAllItems() : [];
      }

      // Call die if entity supports it (handles item drops / npc inventory clears)
      if (typeof target.die === 'function') {
        target.die();
      }

      // Drop loot on death
      if (target.type === EntityType.ZOMBIE) {
        const lootGenerator = engine?.lootGenerator;
        dropZombieDeathLoot(target, x, y, gameMap, lootGenerator, (items) => {
          if (gameMap) {
            gameMap.addItemsToTile(x, y, items);
          }
        });
      } else if (target.type === EntityType.NPC) {
        // Fallback: If engine event loop didn't drop the items (e.g. engine.gameMap not set in tests)
        if (npcItems.length > 0 && gameMap) {
          const tileItems = gameMap.getItemsOnTile(x, y) || [];
          const alreadyDropped = npcItems.some(item => tileItems.some(tItem => tItem.id === item.id || tItem.instanceId === item.instanceId));
          if (!alreadyDropped) {
            gameMap.addItemsToTile(x, y, npcItems);
          }
          target.inventory.clear();
        }
      } else if (target.type === EntityType.RABBIT) {
        const carcass = createItemFromDef('food.rabbit_carcass');
        if (carcass && gameMap) {
          gameMap.addItemsToTile(x, y, [carcass]);
        }
      }
    }

    // Remove from game map
    if (gameMap) {
      gameMap.removeEntity(targetId);
      gameMap._visionDirty = true;
    }

    // Clear targeting references from zombies
    const zombies = entities.filter(e => e.type === EntityType.ZOMBIE);
    zombies.forEach(z => {
      if (z.currentTarget && z.currentTarget.id === targetId) {
        z.currentTarget = null;
        z.behaviorState = 'idle';
      }
    });

    // Cascade: Enqueue a NoiseEvent at the site of destruction
    if (intentQueue && target) {
      intentQueue.enqueue(null, 'NoiseEvent', new NoiseEvent({
        x,
        y,
        volume: 10, // Sound of structure/entity breaking
        sourceEntityId: targetId
      }), parentEnvelope);
    }

    // Push visual action to the playback queue
    if (actionQueue) {
      actionQueue.push({
        type: 'DEATH',
        entityId: targetId,
        data: {
          x,
          y,
          entityType: target?.type
        }
      });
    }

  }
}
