export class AIBehavior {
  constructor(properties = {}) {
    // 1. Alertness state: 'IDLE' | 'INVESTIGATING' | 'HUNTING'
    this.alertnessState = properties.alertnessState !== undefined 
      ? properties.alertnessState 
      : (properties.state !== undefined ? properties.state.toUpperCase() : 'IDLE');

    // 2. Memory coordinates
    this.lastSeenPlayerCoords = properties.lastSeenPlayerCoords !== undefined 
      ? properties.lastSeenPlayerCoords 
      : (properties.lastSeenPlayerAt !== undefined ? properties.lastSeenPlayerAt : null);

    this.heardNoiseCoords = properties.heardNoiseCoords !== undefined 
      ? properties.heardNoiseCoords 
      : null;

    // 3. Path caching array
    this.currentPath = properties.currentPath !== undefined 
      ? properties.currentPath 
      : [];

    // 4. Legacy fields preserved for backward compatibility
    this.alertLevel = properties.alertLevel !== undefined ? properties.alertLevel : 0;
  }

  // Getter/setter for 'state' (lowercased version of alertnessState for backward compatibility)
  get state() {
    return this.alertnessState.toLowerCase();
  }
  set state(val) {
    if (typeof val === 'string') {
      this.alertnessState = val.toUpperCase();
    }
  }

  // Getter/setter for 'lastSeenPlayerAt' (alias to lastSeenPlayerCoords for backward compatibility)
  get lastSeenPlayerAt() {
    return this.lastSeenPlayerCoords;
  }
  set lastSeenPlayerAt(val) {
    this.lastSeenPlayerCoords = val;
  }
}
