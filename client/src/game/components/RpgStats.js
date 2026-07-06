export class RpgStats {
  constructor(properties = {}) {
    this.baseStrength = properties.baseStrength !== undefined ? properties.baseStrength : 20;
    this.currentStrength = properties.currentStrength !== undefined ? properties.currentStrength : this.baseStrength;
    this.baseAgility = properties.baseAgility !== undefined ? properties.baseAgility : 40;
    this.currentAgility = properties.currentAgility !== undefined ? properties.currentAgility : this.baseAgility;
    this.basePerception = properties.basePerception !== undefined ? properties.basePerception : 20;
    this.currentPerception = properties.currentPerception !== undefined ? properties.currentPerception : this.basePerception;
    this.baseConstitution = properties.baseConstitution !== undefined ? properties.baseConstitution : 20;
    this.currentConstitution = properties.currentConstitution !== undefined ? properties.currentConstitution : this.baseConstitution;
  }

  toJSON() {
    return { ...this };
  }
}
