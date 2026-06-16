/**
 * AIBehavior — the zombie pursuit/search state used by AISystem's decision tree.
 *
 * Responsibilities (zombie-only):
 *  - alertnessState: 'IDLE' | 'INVESTIGATING' | 'HUNTING' (what the zombie is doing)
 *  - lastSeenPlayerCoords / heardNoiseCoords: investigation targets (the "memory")
 *  - currentPath: cached A* path toward the current target
 *
 * Sibling component AIState (Entity facade props: behaviorState, lastSeen,
 * targetSightedCoords, lastScentSequence, isAlerted) is shared with rabbits/NPCs
 * and holds the animation/marker-facing state. The two overlap (alertnessState vs
 * behaviorState; lastSeenPlayerCoords vs targetSightedCoords) and are candidates
 * for a future merge — see memory note `zombie-ai-gotchas`.
 *
 * The constructor still accepts the legacy `state` / `lastSeenPlayerAt` keys so
 * older saved games deserialize correctly; the runtime aliases for them were
 * removed as dead code (nothing read them).
 */
export class AIBehavior {
  constructor(properties = {}) {
    this.alertnessState = properties.alertnessState !== undefined
      ? properties.alertnessState
      : (properties.state !== undefined ? properties.state.toUpperCase() : 'IDLE');

    this.lastSeenPlayerCoords = properties.lastSeenPlayerCoords !== undefined
      ? properties.lastSeenPlayerCoords
      : (properties.lastSeenPlayerAt !== undefined ? properties.lastSeenPlayerAt : null);

    this.heardNoiseCoords = properties.heardNoiseCoords !== undefined
      ? properties.heardNoiseCoords
      : null;

    this.currentPath = properties.currentPath !== undefined
      ? properties.currentPath
      : [];
  }

  toJSON() {
    return { ...this };
  }
}
