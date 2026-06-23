export class PlayerSkills {
  constructor(properties = {}) {
    this.meleeKills = properties.meleeKills !== undefined ? properties.meleeKills : 0;
    this.meleeLvl = properties.meleeLvl !== undefined ? properties.meleeLvl : 0;
    this.rangedKills = properties.rangedKills !== undefined ? properties.rangedKills : 0;
    this.rangedLvl = properties.rangedLvl !== undefined ? properties.rangedLvl : 0;
    this.craftingApUsed = properties.craftingApUsed !== undefined ? properties.craftingApUsed : 0;
    this.craftingLvl = properties.craftingLvl !== undefined ? properties.craftingLvl : 0;
  }

  static getNextCraftingTarget(level) {
    return 10 * Math.pow(2, level);
  }

  static getNextKillMilestone(level) {
    return 5 * Math.pow(2, level);
  }

  toJSON() {
    return { ...this };
  }
}
