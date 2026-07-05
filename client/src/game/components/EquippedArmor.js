export class EquippedArmor {
  constructor(properties = {}) {
    this.absorption = properties.absorption !== undefined ? properties.absorption : 0;
    this.maxAbsorption = properties.maxAbsorption !== undefined ? properties.maxAbsorption : 0;
    this.weightRequirement = properties.weightRequirement !== undefined ? properties.weightRequirement : 0;
  }

  toJSON() {
    return { ...this };
  }
}
