export class MoveIntent {
  constructor(properties = {}) {
    this.dx = properties.dx !== undefined ? properties.dx : 0;
    this.dy = properties.dy !== undefined ? properties.dy : 0;
  }

  toJSON() {
    return { ...this };
  }
}
