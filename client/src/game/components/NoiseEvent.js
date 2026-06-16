export class NoiseEvent {
  constructor(properties = {}) {
    this.x = properties.x !== undefined ? properties.x : 0;
    this.y = properties.y !== undefined ? properties.y : 0;
    this.volume = properties.volume !== undefined ? properties.volume : 0;
    this.sourceEntityId = properties.sourceEntityId !== undefined ? properties.sourceEntityId : null;
  }

  toJSON() {
    return { ...this };
  }
}
