export class ActionPoints {
  constructor(properties = {}) {
    this.current = properties.current !== undefined ? properties.current : 20;
    this.max = properties.max !== undefined ? properties.max : 20;
  }

  toJSON() {
    return { ...this };
  }
}
