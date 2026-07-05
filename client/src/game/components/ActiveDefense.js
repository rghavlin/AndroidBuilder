export class ActiveDefense {
  constructor(properties = {}) {
    this.defensesThisTurn = properties.defensesThisTurn !== undefined ? properties.defensesThisTurn : 0;
    this.diminishingRate = properties.diminishingRate !== undefined ? properties.diminishingRate : 0.10;
  }

  toJSON() {
    return { ...this };
  }
}
