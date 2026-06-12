export class LightEmitter {
  constructor(properties = {}) {
    this.radius = properties.radius !== undefined ? properties.radius : 5;
    this.intensity = properties.intensity !== undefined ? properties.intensity : 1.0;
    this.color = properties.color !== undefined ? properties.color : '#ffffff';
    this.isOn = properties.isOn !== undefined ? properties.isOn : false;
  }
}
