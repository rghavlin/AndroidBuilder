export class Position {
  constructor(properties = {}) {
    this.x = properties.x !== undefined ? properties.x : 0;
    this.y = properties.y !== undefined ? properties.y : 0;
    this.level = properties.level !== undefined ? properties.level : 0;
    this.facing = properties.facing !== undefined ? properties.facing : 'south';
  }
}
