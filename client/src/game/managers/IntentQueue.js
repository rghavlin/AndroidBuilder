import { MovementSystem } from '../systems/MovementSystem.js';
import { CombatSystem } from '../systems/CombatSystem.js';
import { DestructionSystem } from '../systems/DestructionSystem.js';
import { AudioSystem } from '../systems/AudioSystem.js';
import { InventorySystem } from '../systems/InventorySystem.js';

export class IntentQueue {
  constructor() {
    this.queue = [];
    this.processedCount = 0;
    this.maxDepth = 50;
    this.maxTotalIntents = 2000;
  }

  /**
   * Enqueue a new intent component to be processed.
   * @param {string} entityId - The target entity ID (or null for global events)
   * @param {string} type - The type of intent component (e.g. 'MoveIntent', 'DamageIntent')
   * @param {Object} component - The intent component data
   * @param {Object|null} parentIntent - The parent intent if enqueued during resolution
   */
  enqueue(entityId, type, component, parentIntent = null) {
    const depth = parentIntent ? parentIntent.depth + 1 : 0;
    
    const intentEnvelope = {
      entityId,
      type,
      component,
      depth
    };

    this.queue.push(intentEnvelope);
  }

  isEmpty() {
    return this.queue.length === 0;
  }

  clear() {
    this.queue = [];
    this.processedCount = 0;
  }

  /**
   * Resolve all enqueued intents sequentially until the queue is empty.
   */
  resolve(entities, worldManager, engine, actionQueue) {
    this.processedCount = 0;
    
    // Construct lookup/array of entities for systems
    const entityList = Array.isArray(entities)
      ? entities
      : (entities instanceof Map ? Array.from(entities.values()) : Object.values(entities));

    while (this.queue.length > 0) {
      if (this.processedCount >= this.maxTotalIntents) {
        console.warn(`[IntentQueue] ⚠️ Safeguard limit reached: ${this.maxTotalIntents} total intents processed in a single tick. Halting.`);
        this.clear();
        break;
      }

      const intent = this.queue.shift();

      if (intent.depth > this.maxDepth) {
        console.warn(`[IntentQueue] ⚠️ Cascade depth limit reached: depth ${intent.depth} (max ${this.maxDepth}) for intent ${intent.type} on entity ${intent.entityId}. Halting.`);
        this.clear();
        break;
      }

      this.processedCount++;

      try {
        this.processIntent(intent, entityList, worldManager, engine, actionQueue);
      } catch (err) {
        console.error(`[IntentQueue] Error resolving intent ${intent.type} on entity ${intent.entityId}:`, err);
      }
    }
  }

  processIntent(intent, entityList, worldManager, engine, actionQueue) {
    const entity = entityList.find(e => e.id === intent.entityId);

    switch (intent.type) {
      case 'MoveIntent':
        if (entity) {
          MovementSystem.resolve(entity, intent.component, engine.gameMap, actionQueue);
        }
        break;

      case 'DamageIntent':
        // Attacker is entity; target and damage details are in intent.component
        CombatSystem.resolve(entity, intent.component, entityList, engine.gameMap, this, actionQueue, engine, intent);
        break;

      case 'DestroyIntent':
        DestructionSystem.resolve(intent.component, entityList, engine.gameMap, this, actionQueue, intent);
        break;

      case 'NoiseEvent':
        AudioSystem.resolve(intent.component, entityList, engine.gameMap, this, actionQueue, engine, intent);
        break;

      case 'PickupIntent':
        if (entity) {
          InventorySystem.resolvePickup(entity, intent.component, engine.gameMap, actionQueue, engine);
        }
        break;

      case 'DropIntent':
        if (entity) {
          InventorySystem.resolveDrop(entity, intent.component, engine.gameMap, actionQueue, engine);
        }
        break;

      default:
        console.warn(`[IntentQueue] Unknown intent type: ${intent.type}`);
    }
  }
}
