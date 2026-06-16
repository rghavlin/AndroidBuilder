export class Item {
  constructor(properties = {}) {
    this.name = properties.name !== undefined ? properties.name : 'Item';
    this.weight = properties.weight !== undefined ? properties.weight : 0;
    this.description = properties.description !== undefined ? properties.description : '';
  }

  toJSON() {
    return { ...this };
  }
}
