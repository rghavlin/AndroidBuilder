export class Burnable {
  constructor(properties = {}) {
    // `??` so an explicit 0 from a save is preserved (T1 falsy-default sweep).
    this.fireTurns = properties.fireTurns ?? 0;
    this.fireResistance = properties.fireResistance ?? 0;
  }

  toJSON() {
    return {
      fireTurns: this.fireTurns,
      fireResistance: this.fireResistance
    };
  }
}
