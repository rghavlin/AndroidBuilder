export class AIState {
  constructor(properties = {}) {
    // Note: `??` (not `||`) so legitimate falsy values from a save (0, false,
    // '') survive deserialization instead of being clobbered by the default
    // (T1 falsy-default sweep). Mutable fields clone rather than alias the
    // incoming data (T8 shared-reference sweep).
    this.behaviorState = properties.behaviorState ?? 'idle';
    this.currentTarget = properties.currentTarget ?? null;
    this.heardNoise = properties.heardNoise ?? false;
    this.noiseCoords = properties.noiseCoords ? { ...properties.noiseCoords } : { x: 0, y: 0 };
    // Clone incoming mutables so the live component never aliases the save
    // POJO it was built from (T8 shared-reference sweep).
    this.noiseBlacklist = properties.noiseBlacklist ? [...properties.noiseBlacklist] : [];
    this.recentThreats = properties.recentThreats ? structuredClone(properties.recentThreats) : [];
    this.goalTarget = properties.goalTarget ?? null;
    this.lastSeen = properties.lastSeen ?? false;
    this.targetSightedCoords = properties.targetSightedCoords ? { ...properties.targetSightedCoords } : { x: 0, y: 0 };
    this.lastScentSequence = properties.lastScentSequence ?? 0;
    this.isAlerted = properties.isAlerted ?? false;
    this.currentPath = properties.currentPath ? structuredClone(properties.currentPath) : null;
    this.hasDemanded = properties.hasDemanded ?? false;
    this.hasExtorted = properties.hasExtorted ?? false;
    this.fleeRecoverChance = properties.fleeRecoverChance ?? 0;
    this.stunnedTurns = properties.stunnedTurns ?? 0;
    // Scripted/quest NPCs: when true, NPCAISystem skips this entity
    // entirely (no wandering/fleeing/combat AI) so only explicit event steps
    // (moveEntity, dialog, etc.) control it. See map editor NPC placement and
    // EventRunner's setNpcAI step.
    this.aiDisabled = properties.aiDisabled || false;
    // Per-entity override for attack-on-sight behavior. null = defer to the
    // faction's player disposition (the normal case); true/false pins the
    // behavior for scripted NPCs (EventRunner.setNpcAI) and legacy authored maps.
    // Read through the faction-aware Entity.attackOnSight accessor, never directly.
    this.attackOnSight = properties.attackOnSight ?? null;
  }

  toJSON() {
    return {
      behaviorState: this.behaviorState,
      currentTarget: this.currentTarget,
      heardNoise: this.heardNoise,
      // Deep-copy nested mutables so post-serialize gameplay can't mutate the
      // pending save POJO through the live component (T8/R1#5).
      noiseCoords: this.noiseCoords ? { ...this.noiseCoords } : this.noiseCoords,
      noiseBlacklist: this.noiseBlacklist ? [...this.noiseBlacklist] : this.noiseBlacklist,
      recentThreats: this.recentThreats ? structuredClone(this.recentThreats) : this.recentThreats,
      goalTarget: this.goalTarget,
      lastSeen: this.lastSeen,
      targetSightedCoords: this.targetSightedCoords ? { ...this.targetSightedCoords } : this.targetSightedCoords,
      lastScentSequence: this.lastScentSequence,
      isAlerted: this.isAlerted,
      currentPath: this.currentPath ? structuredClone(this.currentPath) : this.currentPath,
      hasDemanded: this.hasDemanded,
      hasExtorted: this.hasExtorted,
      fleeRecoverChance: this.fleeRecoverChance,
      stunnedTurns: this.stunnedTurns,
      aiDisabled: this.aiDisabled,
      attackOnSight: this.attackOnSight
    };
  }
}
