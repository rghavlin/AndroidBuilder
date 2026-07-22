export class Inventory {
  constructor(properties = {}) {
    this.items = properties.items !== undefined ? properties.items : [];
    this.maxWeight = properties.maxWeight !== undefined ? properties.maxWeight : 50;
    this.maxSlots = properties.maxSlots !== undefined ? properties.maxSlots : 20;
  }

  toJSON() {
    // structuredClone so the serialized POJO never aliases the live items
    // array (T8 shared-reference sweep).
    return structuredClone({ ...this });
  }
}
