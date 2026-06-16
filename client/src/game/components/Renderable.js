export class Renderable {
  constructor(properties = {}) {
    this.spriteId = properties.spriteId !== undefined ? properties.spriteId : '';
    this.iconId = properties.iconId !== undefined ? properties.iconId : '';
    this.svgPath = properties.svgPath !== undefined ? properties.svgPath : '';
    this.color = properties.color !== undefined ? properties.color : '#ffffff';
    this.backgroundColor = properties.backgroundColor !== undefined ? properties.backgroundColor : '#000000';
    this.zIndex = properties.zIndex !== undefined ? properties.zIndex : 1;
    this.isVisible = properties.isVisible !== undefined ? properties.isVisible : true;
  }

  toJSON() {
    return { ...this };
  }
}
