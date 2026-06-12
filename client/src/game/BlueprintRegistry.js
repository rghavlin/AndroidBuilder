export class BlueprintRegistry {
  static blueprints = new Map();

  static register(blueprint) {
    if (blueprint && blueprint.id) {
      this.blueprints.set(blueprint.id, blueprint);
    }
  }

  static load(blueprintsArray) {
    if (Array.isArray(blueprintsArray)) {
      blueprintsArray.forEach(bp => this.register(bp));
    }
  }

  static get(blueprintId) {
    return this.blueprints.get(blueprintId);
  }

  static has(blueprintId) {
    return this.blueprints.has(blueprintId);
  }

  static clear() {
    this.blueprints.clear();
  }
}
