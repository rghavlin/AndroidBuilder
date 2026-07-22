export class InventoryContainer {
  constructor(properties = {}) {
    this.slots = properties.slots !== undefined ? properties.slots : [];
    this.maxWeight = properties.maxWeight !== undefined ? properties.maxWeight : 50;
    this.currentWeight = properties.currentWeight !== undefined ? properties.currentWeight : 0;
  }

  toJSON() {
    // structuredClone so the serialized POJO never aliases the live slots
    // array (T8 shared-reference sweep).
    return structuredClone({ ...this });
  }
}
