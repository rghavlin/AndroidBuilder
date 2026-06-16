export class Burnable {
  constructor(properties = {}) {
    this.fireTurns = properties.fireTurns || 0;
    this.fireResistance = properties.fireResistance || 0;
  }

  toJSON() {
    return {
      fireTurns: this.fireTurns,
      fireResistance: this.fireResistance
    };
  }
}
