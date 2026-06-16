export class PickupIntent {
  constructor(properties = {}) {
    this.itemId = properties.itemId !== undefined ? properties.itemId : '';
  }

  toJSON() {
    return { ...this };
  }
}
