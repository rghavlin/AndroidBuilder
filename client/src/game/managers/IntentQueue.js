import { MovementSystem } from '../systems/MovementSystem.js';
import { CombatSystem } from '../systems/CombatSystem.js';
import { DestructionSystem } from '../systems/DestructionSystem.js';
import { AudioSystem } from '../systems/AudioSystem.js';
import { ExplosionSystem } from '../systems/ExplosionSystem.js';

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

    // T3: build the id -> entity lookup ONCE per resolve pass. Previously every
    // intent did an O(E) find() on entityList — thousands of intents at horde
    // scale turned a turn into millions of comparisons. The list is fixed for
    // the pass (spawns/removals go through gameMap), so this is identical to
    // the repeated find() semantics.
    const entityById = new Map();
    for (const e of entityList) entityById.set(e.id, e);

    // T4: index pointer instead of queue.shift() — shift() is O(n) per dequeue,
    // making a full pass O(n^2) in queued intents. Cascades enqueue during the
    // loop, so the loop condition re-reads the live length each iteration.
    let head = 0;
    while (head < this.queue.length) {
      if (this.processedCount >= this.maxTotalIntents) {
        console.warn(`[IntentQueue] ⚠️ Safeguard limit reached: ${this.maxTotalIntents} total intents processed in a single tick. Halting.`);
        this.clear();
        break;
      }

      const intent = this.queue[head++];

      if (intent.depth > this.maxDepth) {
        console.warn(`[IntentQueue] ⚠️ Cascade depth limit reached: depth ${intent.depth} (max ${this.maxDepth}) for intent ${intent.type} on entity ${intent.entityId}. Halting.`);
        this.clear();
        break;
      }

      this.processedCount++;

      try {
        this.processIntent(intent, entityList, worldManager, engine, actionQueue, entityById);
      } catch (err) {
        console.error(`[IntentQueue] Error resolving intent ${intent.type} on entity ${intent.entityId}:`, err);
      }
    }

    // Everything before `head` was processed (or the queue was cleared above).
    this.queue = [];
  }

  processIntent(intent, entityList, worldManager, engine, actionQueue, entityById = null) {
    const entity = entityById
      ? entityById.get(intent.entityId)
      : entityList.find(e => e.id === intent.entityId);

    switch (intent.type) {
      case 'MoveIntent':
        if (entity) {
          MovementSystem.resolve(entity, intent.component, engine.gameMap, actionQueue);
        }
        break;

      case 'DamageIntent':
        // Attacker is entity; target and damage details are in intent.component
        CombatSystem.resolve(entity, intent.component, entityList, engine.gameMap, this, actionQueue, engine, intent, entityById);
        break;

      case 'DestroyIntent':
        DestructionSystem.resolve(intent.component, entityList, engine.gameMap, this, actionQueue, intent, entityById);
        break;

      case 'NoiseEvent':
        AudioSystem.resolve(intent.component, entityList, engine.gameMap, this, actionQueue, engine, intent);
        break;

      case 'ExplosionIntent':
        ExplosionSystem.resolve(intent.component, entityList, engine.gameMap, this, actionQueue, engine, intent);
        break;

      default:
        console.warn(`[IntentQueue] Unknown intent type: ${intent.type}`);
    }
  }
}
