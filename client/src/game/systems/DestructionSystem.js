import { NoiseEvent } from '../components/NoiseEvent.js';

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
      
      // Call die if entity supports it (handles item drops)
      if (typeof target.die === 'function') {
        target.die();
      }
    }

    // Remove from game map
    if (gameMap) {
      gameMap.removeEntity(targetId);
      if (gameMap.entityMap) {
        for (const entity of gameMap.entityMap.values()) {
          if (entity.hasComponent && typeof entity.hasComponent === 'function' && entity.hasComponent('Vision')) {
            entity.getComponent('Vision')._visionDirty = true;
          }
        }
      }
    }

    // Clear targeting references from zombies
    const zombies = entities.filter(e => e.type === 'zombie');
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
        data: {}
      });
    }

    console.log(`[DestructionSystem] Resolved DestroyIntent for entity: ${targetId} at (${x}, ${y})`);
  }
}
