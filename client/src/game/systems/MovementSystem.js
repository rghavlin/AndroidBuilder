export class MovementSystem {
  static process(entities, worldManager, engine, actionQueue = []) {
    const gameMap = engine ? engine.gameMap : null;
    if (!gameMap) return;

    const entityList = Array.isArray(entities)
      ? entities
      : (entities instanceof Map ? Array.from(entities.values()) : Object.values(entities));

    for (const entity of entityList) {
      if (entity.hasComponent('Position') && entity.hasComponent('Movable') && entity.hasComponent('MoveIntent')) {
        const position = entity.getComponent('Position');
        const movable = entity.getComponent('Movable');
        const moveIntent = entity.getComponent('MoveIntent');

        const targetX = position.x + moveIntent.dx;
        const targetY = position.y + moveIntent.dy;

        const oldX = position.x;
        const oldY = position.y;

        let moved = false;
        if (typeof gameMap.moveEntity === 'function') {
          moved = gameMap.moveEntity(entity.id, targetX, targetY, { snap: false });
        } else {
          position.x = targetX;
          position.y = targetY;
          moved = true;
        }

        if (moved) {
          actionQueue.push({
            type: 'MOVE',
            entityId: entity.id,
            data: {
              from: { x: oldX, y: oldY },
              to: { x: targetX, y: targetY }
            }
          });

          // Deduct Movable.apCost from action points if tracked
          if (entity.ap !== undefined) {
            entity.ap = Math.max(0, entity.ap - movable.apCost);
          } else if (entity.currentAP !== undefined) {
            entity.currentAP = Math.max(0, entity.currentAP - movable.apCost);
          }
        }

        // Cleanup: Remove MoveIntent regardless of success or failure
        entity.removeComponent('MoveIntent');
      }
    }
  }
}
