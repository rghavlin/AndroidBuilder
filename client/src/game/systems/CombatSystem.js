export class CombatSystem {
  static process(entities, worldManager, engine, actionQueue = null) {
    const entityList = Array.isArray(entities)
      ? entities
      : (entities instanceof Map ? Array.from(entities.values()) : Object.values(entities));

    for (const attacker of entityList) {
      if (attacker.hasComponent('DamageIntent')) {
        const damageIntent = attacker.getComponent('DamageIntent');
        
        // Find target
        let target = entityList.find(e => e.id === damageIntent.targetId);
        let isStructure = false;

        if (!target && damageIntent.isStructure && engine && engine.gameMap) {
          const targetTile = engine.gameMap.getTile(damageIntent.targetX, damageIntent.targetY);
          target = targetTile?.contents.find(e => e.id === damageIntent.targetId);
          if (!target) {
            const attackerPos = attacker.getComponent('Position') || { x: attacker.x, y: attacker.y };
            const sourceTile = engine.gameMap.getTile(attackerPos.x, attackerPos.y);
            target = sourceTile?.contents.find(e => e.id === damageIntent.targetId);
          }
          if (target) {
            isStructure = true;
          }
        }

        if (target) {
          if (isStructure) {
            // If the structure is already open or broken, skip the attack intent
            if (target.isOpen || target.isBroken || target.isDamaged) {
              attacker.removeComponent('DamageIntent');
              continue;
            }

            // Apply damage silently during simulation
            const damageResult = target.takeDamage(damageIntent.amount, true);
            const broken = !!(damageResult && damageResult.isBroken);

            if (engine.gameMap && typeof engine.gameMap.emitNoise === 'function') {
              engine.gameMap.emitNoise(damageIntent.targetX, damageIntent.targetY, 6);
            }

            if (actionQueue) {
              const attackerPos = attacker.getComponent('Position') || { x: attacker.x, y: attacker.y };
              actionQueue.push({
                type: 'STRUCTURE_INTERACT',
                entityId: attacker.id,
                data: {
                  success: true,
                  damage: damageIntent.amount,
                  broken: broken,
                  targetId: target.id,
                  targetType: target.type,
                  from: { x: attackerPos.x, y: attackerPos.y },
                  to: { x: damageIntent.targetX, y: damageIntent.targetY }
                }
              });
            }

            // Deduct AP for attacking a structure (1.0 AP in legacy game)
            const apCost = 1.0;
            if (attacker.ap !== undefined) {
              attacker.ap = Math.max(0, attacker.ap - apCost);
            } else if (attacker.currentAP !== undefined) {
              attacker.currentAP = Math.max(0, attacker.currentAP - apCost);
            }
          } else {
            // Normal entity combat
            if (actionQueue) {
              const attackerPos = attacker.getComponent('Position') || { x: attacker.x, y: attacker.y };
              const targetPos = target.getComponent('Position') || { x: target.x, y: target.y };
              // In the real game, defer damage application to visual playback
              actionQueue.push({
                type: 'ATTACK',
                entityId: attacker.id,
                data: {
                  targetId: target.id,
                  targetType: target.type,
                  success: true,
                  damage: damageIntent.amount,
                  from: { x: attackerPos.x, y: attackerPos.y },
                  to: { x: targetPos.x, y: targetPos.y }
                }
              });
            } else {
              // direct/test execution
              if (typeof target.takeDamage === 'function') {
                target.takeDamage(damageIntent.amount, attacker);
              } else if (target.hasComponent('Health')) {
                const health = target.getComponent('Health');
                health.current = Math.max(0, health.current - damageIntent.amount);
                if (health.current <= 0) {
                  health.isDead = true;
                }
              }
            }

            // Deduct AP for attacking
            const apCost = 2.0;
            if (attacker.ap !== undefined) {
              attacker.ap = Math.max(0, attacker.ap - apCost);
            } else if (attacker.currentAP !== undefined) {
              attacker.currentAP = Math.max(0, attacker.currentAP - apCost);
            }

            // State Sync: If the target is the player (has InventoryContainer), flag engine._uiDirty = true
            const isPlayer = target.hasComponent('InventoryContainer');
            if (isPlayer && engine) {
              engine._uiDirty = true;
            }
          }
        }

        // Cleanup: Remove DamageIntent from attacker
        attacker.removeComponent('DamageIntent');
      }
    }
  }
}
