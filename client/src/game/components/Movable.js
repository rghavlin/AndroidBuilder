export class Movable {
  constructor(properties = {}) {
    this.apCost = properties.apCost !== undefined ? properties.apCost : 1;
    this.baseSpeed = properties.baseSpeed !== undefined ? properties.baseSpeed : 1;
  }

  toJSON() {
    return { ...this };
  }
}
