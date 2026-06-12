export class Health {
  constructor(properties = {}) {
    this.current = properties.current !== undefined ? properties.current : 100;
    this.max = properties.max !== undefined ? properties.max : 100;
    this.isDead = properties.isDead !== undefined ? properties.isDead : false;
  }
}
