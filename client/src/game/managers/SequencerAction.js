/**
 * SequencerAction - A standardized wrapper for time-dependent visual actions.
 * Driven by the GameEngine's Master Heartbeat to ensure frame-perfect timing.
 */
export class SequencerAction {
  /**
   * @param {Object} entity - The entity performing the action (must have animationProgress property)
   * @param {number} duration - Total duration of the animation in ms
   * @param {number} impactPoint - The timestamp (ms) at which onImpact should be triggered
   * @param {Function} onImpact - Callback triggered at the impact point
   */
  constructor(entity, duration, impactPoint = 0, onImpact = null) {
    this.entity = entity;
    this.duration = duration;
    this.impactPoint = impactPoint;
    this.onImpact = onImpact;
    
    this.elapsed = 0;
    this.isComplete = false;
    this.triggered = false;
    
    // The promise that TurnManager will await for sequential processing
    this.promise = new Promise(resolve => {
      this.resolve = resolve;
    });
  }

  /**
   * Update the action state using delta time.
   * Called by the GameEngine's Master Heartbeat loop.
   * @param {number} dt - Milliseconds elapsed since the last frame
   */
  update(dt) {
    if (this.isComplete) return;

    this.elapsed += dt;
    
    // 1. Update mutable internal state on the entity (Bypassing React state updates)
    if (this.entity) {
      this.entity.animationProgress = Math.min(1, this.elapsed / this.duration);
    }

    // 2. Precise Impact Trigger
    if (this.elapsed >= this.impactPoint && !this.triggered) {
      if (this.onImpact) {
        this.onImpact();
      }
      this.triggered = true;
    }

    // 3. Completion check
    if (this.elapsed >= this.duration) {
      if (this.entity) {
        this.entity.animationProgress = 1.0; // Ensure we finish at the destination
      }
      this.isComplete = true;
      this.resolve();
    }
  }
}
