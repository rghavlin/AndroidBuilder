export class ExplosionIntent {
  constructor(properties = {}) {
    this.targetX = properties.targetX !== undefined ? properties.targetX : 0;
    this.targetY = properties.targetY !== undefined ? properties.targetY : 0;
    this.radius = properties.radius !== undefined ? properties.radius : 2;
    this.minDamage = properties.minDamage !== undefined ? properties.minDamage : 10;
    this.maxDamage = properties.maxDamage !== undefined ? properties.maxDamage : 30;
    this.isIncendiary = properties.isIncendiary !== undefined ? properties.isIncendiary : false;
    this.sourceEntityId = properties.sourceEntityId !== undefined ? properties.sourceEntityId : null;
  }
}
