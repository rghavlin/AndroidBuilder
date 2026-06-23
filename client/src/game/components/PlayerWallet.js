export class PlayerWallet {
  constructor(properties = {}) {
    this.earbucks = properties.earbucks !== undefined ? properties.earbucks : 0;
  }

  toJSON() {
    return { ...this };
  }
}
