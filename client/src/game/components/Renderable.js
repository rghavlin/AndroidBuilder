export class Renderable {
  constructor(properties = {}) {
    this.spriteId = properties.spriteId !== undefined ? properties.spriteId : '';
    this.color = properties.color !== undefined ? properties.color : '#fff';
    this.zIndex = properties.zIndex !== undefined ? properties.zIndex : 1;
    this.isVisible = properties.isVisible !== undefined ? properties.isVisible : true;
  }
}
