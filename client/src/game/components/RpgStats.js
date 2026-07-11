export class RpgStats {
  constructor(properties = {}) {
    this.baseStrength = properties.baseStrength !== undefined ? properties.baseStrength : 20;
    this.currentStrength = properties.currentStrength !== undefined ? properties.currentStrength : this.baseStrength;
    this.baseAgility = properties.baseAgility !== undefined ? properties.baseAgility : 20;
    this.currentAgility = properties.currentAgility !== undefined ? properties.currentAgility : this.baseAgility;
    this.basePerception = properties.basePerception !== undefined ? properties.basePerception : 20;
    this.currentPerception = properties.currentPerception !== undefined ? properties.currentPerception : this.basePerception;
    this.baseConstitution = properties.baseConstitution !== undefined ? properties.baseConstitution : 20;
    this.currentConstitution = properties.currentConstitution !== undefined ? properties.currentConstitution : this.baseConstitution;

    // Attribute Experience
    this.strengthXP = properties.strengthXP || 0;
    this.agilityXP = properties.agilityXP || 0;
    this.perceptionXP = properties.perceptionXP || 0;
    this.constitutionXP = properties.constitutionXP || 0;

    this.strengthXpSpent = properties.strengthXpSpent || 0;
    this.agilityXpSpent = properties.agilityXpSpent || 0;
    this.perceptionXpSpent = properties.perceptionXpSpent || 0;
    this.constitutionXpSpent = properties.constitutionXpSpent || 0;

    // Infection & Treatment
    this.isInfected = properties.isInfected !== undefined ? properties.isInfected : false;
    this.infectionTicksRemaining = properties.infectionTicksRemaining !== undefined ? properties.infectionTicksRemaining : 24;
    this.treatmentTicksRemaining = properties.treatmentTicksRemaining !== undefined ? properties.treatmentTicksRemaining : 0;
    this.treatmentSubtype = properties.treatmentSubtype !== undefined ? properties.treatmentSubtype : null;
    this.treatmentEffects = properties.treatmentEffects !== undefined ? properties.treatmentEffects : null;
    this.treatmentColor = properties.treatmentColor !== undefined ? properties.treatmentColor : null;
    this.treatmentName = properties.treatmentName !== undefined ? properties.treatmentName : null;
  }

  toJSON() {
    return { ...this };
  }
}
