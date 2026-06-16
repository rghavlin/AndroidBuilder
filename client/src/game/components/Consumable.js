export class Consumable {
  constructor(properties = {}) {
    this.nutrition = properties.nutrition !== undefined ? properties.nutrition : 0;
    this.hydration = properties.hydration !== undefined ? properties.hydration : 0;
  }

  toJSON() {
    return { ...this };
  }
}
