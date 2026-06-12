export class AIBehavior {
  constructor(properties = {}) {
    this.state = properties.state !== undefined ? properties.state : 'idle';
    this.lastSeenPlayerAt = properties.lastSeenPlayerAt !== undefined ? properties.lastSeenPlayerAt : null;
    this.alertLevel = properties.alertLevel !== undefined ? properties.alertLevel : 0;
  }
}
