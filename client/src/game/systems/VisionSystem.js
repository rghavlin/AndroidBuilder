export class VisionSystem {
  static process(entities, worldManager, engine) {
    const entityList = Array.isArray(entities)
      ? entities
      : (entities instanceof Map ? Array.from(entities.values()) : Object.values(entities));

    for (const entity of entityList) {
      if (entity.hasComponent('Position') && entity.hasComponent('LightEmitter')) {
        const position = entity.getComponent('Position');
        const lightEmitter = entity.getComponent('LightEmitter');

        if (lightEmitter.isOn) {
          if (worldManager && typeof worldManager.recalculateLighting === 'function') {
            worldManager.recalculateLighting(position.x, position.y, lightEmitter.radius, lightEmitter.intensity);
          } else if (engine && typeof engine.recalculateFOV === 'function') {
            engine.recalculateFOV({ x: position.x, y: position.y });
          }
        }
      }
    }
  }
}
