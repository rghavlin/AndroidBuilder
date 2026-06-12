export class DamageIntent {
  constructor(properties = {}) {
    this.amount = properties.amount !== undefined ? properties.amount : 0;
    this.targetId = properties.targetId !== undefined ? properties.targetId : null;
    this.isStructure = properties.isStructure !== undefined ? properties.isStructure : false;
    this.targetX = properties.targetX !== undefined ? properties.targetX : null;
    this.targetY = properties.targetY !== undefined ? properties.targetY : null;
  }
}

