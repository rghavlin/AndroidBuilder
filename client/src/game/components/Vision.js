export class Vision {
  constructor(properties = {}) {
    this.range = properties.range !== undefined ? properties.range : 10;
    this.visibleTiles = properties.visibleTiles !== undefined ? properties.visibleTiles : [];
    this.visibleEntities = properties.visibleEntities !== undefined ? properties.visibleEntities : [];
    this._visionDirty = properties._visionDirty !== undefined ? properties._visionDirty : true;
  }

  toJSON() {
    // structuredClone so the serialized POJO never aliases the live
    // visibleTiles/visibleEntities arrays (T8 shared-reference sweep).
    return structuredClone({ ...this });
  }
}
