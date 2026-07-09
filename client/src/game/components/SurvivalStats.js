export class SurvivalStats {
  constructor(properties = {}) {
    this.nutrition = properties.nutrition !== undefined ? properties.nutrition : 25;
    this.maxNutrition = properties.maxNutrition !== undefined ? properties.maxNutrition : 25;
    this.hydration = properties.hydration !== undefined ? properties.hydration : 25;
    this.maxHydration = properties.maxHydration !== undefined ? properties.maxHydration : 25;
    this.energy = properties.energy !== undefined ? properties.energy : 25;
    this.maxEnergy = properties.maxEnergy !== undefined ? properties.maxEnergy : 25;
    this.condition = properties.condition !== undefined ? properties.condition : 'Normal';
    this.sickness = properties.sickness !== undefined ? properties.sickness : 0;
    this.isBleeding = properties.isBleeding !== undefined ? properties.isBleeding : false;
    // Wound infection: a recoverable, non-lethal condition contracted by binding a
    // bleeding wound with a dirty rag. Behaves like sickness (saps attributes) but
    // persists until a Constitution roll, antibiotics, or antiseptic clears it.
    // Entirely separate from the zombie viral infection (RpgStats.isInfected).
    this.woundInfection = properties.woundInfection !== undefined ? properties.woundInfection : false;
    this.drunkenness = properties.drunkenness !== undefined ? properties.drunkenness : 0;
    this.isStarving = properties.isStarving !== undefined ? properties.isStarving : false;
    this.isDehydrated = properties.isDehydrated !== undefined ? properties.isDehydrated : false;
  }

  toJSON() {
    return { ...this };
  }
}
