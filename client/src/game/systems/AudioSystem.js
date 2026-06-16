import { Pathfinding } from '../utils/Pathfinding.js';
import { MoveIntent } from '../components/MoveIntent.js';

export class AudioSystem {
  /**
   * Resolve a single NoiseEvent.
   * @param {Object} noiseEvent - The NoiseEvent component
   * @param {Array} entities - List of active entities
   * @param {GameMap} gameMap - Current game map
   * @param {IntentQueue} intentQueue - The central intent queue
   * @param {Array} actionQueue - Sequential visual actions list
   * @param {Object} engine - The central game engine
   * @param {Object|null} parentEnvelope - Parent intent envelope for tracking cascade depth
   */
  static resolve(noiseEvent, entities, gameMap, intentQueue, actionQueue = [], engine = null, parentEnvelope = null) {
    const { x, y, volume, sourceEntityId } = noiseEvent;
    if (!gameMap) return;

    console.log(`[AudioSystem] 📢 Noise event at (${x}, ...${y}) radius: ${volume}`);
    let alertedCount = 0;

    entities.forEach(entity => {
      // Don't alert the source of the noise itself
      if (entity.id === sourceEntityId) return;

      if (entity.hp > 0 && !entity.hasExited && entity.hasComponent('AIBehavior') && entity.hasComponent('Position')) {
        const pos = entity.getComponent('Position');
        const dist = Math.sqrt(Math.pow(pos.x - x, 2) + Math.pow(pos.y - y, 2));

        if (dist <= volume) {
          if (typeof entity.setNoiseHeard === 'function') {
            entity.setNoiseHeard(x, y);
            entity.behaviorState = 'investigating';
            alertedCount++;

            // If entity has AP, enqueue a MoveIntent to investigate the sound in this same tick
            // CRITICAL turn-based fix: AI entities should ONLY move logically during the simulation phase.
            // Moving during the player's turn causes visual desyncs (since playback isn't running)
            // and allows players to step onto the same tile.
            const isSimulating = engine && engine.turnPhase === 'SIMULATING';
            const currentAP = entity.currentAP !== undefined ? entity.currentAP : (entity.ap !== undefined ? entity.ap : 0);
            const movable = entity.getComponent('Movable');
            const moveCost = movable ? movable.apCost : 1.0;

            if (isSimulating && currentAP >= moveCost) {
              const step = this.calculateStepTowards(entity, pos, x, y, gameMap);
              if (step) {
                intentQueue.enqueue(entity.id, 'MoveIntent', new MoveIntent({
                  dx: step.dx,
                  dy: step.dy
                }), parentEnvelope);
              }
            }
          }
        }
      }
    });

    if (alertedCount > 0) {
      console.log(`[AudioSystem] 🧟 ${alertedCount} entities alerted by noise cascade at (${x}, ${y})`);
    }

    // Trigger visual/audio feedback event for TurnManager playback
    if (actionQueue) {
      actionQueue.push({
        type: 'SOUND',
        entityId: sourceEntityId || 'global',
        data: { x, y, radius: volume }
      });
    }
  }

  /**
   * Helper to determine the immediate pathfinding step an entity should take towards a target coordinate
   */
  static calculateStepTowards(entity, pos, targetX, targetY, gameMap) {
    const dx = targetX - pos.x;
    const dy = targetY - pos.y;
    if (dx === 0 && dy === 0) return null;

    const stepX = dx !== 0 ? Math.sign(dx) : 0;
    const stepY = dy !== 0 ? Math.sign(dy) : 0;

    // 1. Try mutant diagonal movement if applicable
    if (entity.subtype === 'mutant' && stepX !== 0 && stepY !== 0) {
      const diagX = pos.x + stepX;
      const diagY = pos.y + stepY;
      if (Pathfinding.canMoveDiagonally(gameMap, pos.x, pos.y, diagX, diagY, entity)) {
        const tile = gameMap.getTile(diagX, diagY);
        if (tile && tile.isWalkable(entity, { ignoreZombies: false })) {
          return { dx: stepX, dy: stepY };
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
      const candX = pos.x + choice.cx;
      const candY = pos.y + choice.cy;
      const tile = gameMap.getTile(candX, candY);
      if (!tile) continue;

      const isBlocked = Pathfinding.isEdgeBlocked(gameMap, pos.x, pos.y, candX, candY, entity);
      if (isBlocked) continue;

      if (tile.isWalkable(entity, { ignoreZombies: false })) {
        return { dx: choice.cx, dy: choice.cy };
      }
    }

    return null;
  }
}
