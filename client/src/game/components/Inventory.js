export class Inventory {
  constructor(properties = {}) {
    this.items = properties.items !== undefined ? properties.items : [];
    this.maxWeight = properties.maxWeight !== undefined ? properties.maxWeight : 50;
    this.maxSlots = properties.maxSlots !== undefined ? properties.maxSlots : 20;
  }
}
