export class MeleeWeapon {
  constructor(properties = {}) {
    this.damage = properties.damage !== undefined ? properties.damage : 0;
  }

  toJSON() {
    return { ...this };
  }
}
