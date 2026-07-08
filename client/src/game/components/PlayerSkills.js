export class PlayerSkills {
  constructor(properties = {}) {
    this.meleeHits = properties.meleeHits !== undefined ? properties.meleeHits : 0;
    this.meleeLvl = properties.meleeLvl !== undefined ? properties.meleeLvl : 0;
    this.rangedHits = properties.rangedHits !== undefined ? properties.rangedHits : 0;
    this.rangedLvl = properties.rangedLvl !== undefined ? properties.rangedLvl : 0;
    this.defenseHits = properties.defenseHits !== undefined ? properties.defenseHits : 0;
    this.defenseLvl = properties.defenseLvl !== undefined ? properties.defenseLvl : 0;
    this.craftingApUsed = properties.craftingApUsed !== undefined ? properties.craftingApUsed : 0;
    this.craftingLvl = properties.craftingLvl !== undefined ? properties.craftingLvl : 0;
  }

  static getNextCraftingTarget(level) {
    return 10 * Math.pow(2, level);
  }

  /**
   * Melee/Ranged now level from successful hits landed, not kills — rescaled
   * from the old `5 * 2^level` kill milestone by ~2.5x (the average hits-to-kill
   * for a regular zombie across common weapons), so average leveling pace stays
   * close to the old system's for typical play.
   */
  static getNextHitMilestone(level) {
    return Math.round(12.5 * Math.pow(2, level));
  }

  toJSON() {
    return { ...this };
  }
}
