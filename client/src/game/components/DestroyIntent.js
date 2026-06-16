export class DestroyIntent {
  constructor(properties = {}) {
    this.entityId = properties.entityId !== undefined ? properties.entityId : null;
  }

  toJSON() {
    return { ...this };
  }
}
