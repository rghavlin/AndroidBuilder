export class AIState {
  constructor(properties = {}) {
    this.behaviorState = properties.behaviorState || 'idle';
    this.currentTarget = properties.currentTarget || null;
    this.heardNoise = properties.heardNoise || false;
    this.noiseCoords = properties.noiseCoords || { x: 0, y: 0 };
    this.noiseBlacklist = properties.noiseBlacklist || [];
    this.recentThreats = properties.recentThreats || [];
    this.goalTarget = properties.goalTarget || null;
    this.lastSeen = properties.lastSeen || false;
    this.targetSightedCoords = properties.targetSightedCoords || { x: 0, y: 0 };
    this.lastScentSequence = properties.lastScentSequence || 0;
    this.isAlerted = properties.isAlerted || false;
    this.currentPath = properties.currentPath || null;
    this.hasDemanded = properties.hasDemanded || false;
    this.hasExtorted = properties.hasExtorted || false;
    this.fleeRecoverChance = properties.fleeRecoverChance || 0;
    this.stunnedTurns = properties.stunnedTurns || 0;
    // Scripted/quest NPCs: when true, NPCAISystem skips this entity
    // entirely (no wandering/fleeing/combat AI) so only explicit event steps
    // (moveEntity, dialog, etc.) control it. See map editor NPC placement and
    // EventRunner's setNpcAI step.
    this.aiDisabled = properties.aiDisabled || false;
  }

  toJSON() {
    return {
      behaviorState: this.behaviorState,
      currentTarget: this.currentTarget,
      heardNoise: this.heardNoise,
      noiseCoords: this.noiseCoords,
      noiseBlacklist: this.noiseBlacklist,
      recentThreats: this.recentThreats,
      goalTarget: this.goalTarget,
      lastSeen: this.lastSeen,
      targetSightedCoords: this.targetSightedCoords,
      lastScentSequence: this.lastScentSequence,
      isAlerted: this.isAlerted,
      currentPath: this.currentPath,
      hasDemanded: this.hasDemanded,
      hasExtorted: this.hasExtorted,
      fleeRecoverChance: this.fleeRecoverChance,
      stunnedTurns: this.stunnedTurns,
      aiDisabled: this.aiDisabled
    };
  }
}
