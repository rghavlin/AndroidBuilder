import { EntityType } from '../entities/Entity.js';
import { createItemFromDef } from '../inventory/ItemDefs.js';
import { NoiseEvent } from '../components/NoiseEvent.js';
import { DestroyIntent } from '../components/DestroyIntent.js';

export class ExplosionSystem {
  /**
   * Resolve an ExplosionIntent.
   * @param {Object} explosionIntent - The ExplosionIntent component details.
   * @param {Array} entities - Active entities list.
   * @param {GameMap} gameMap - Current game map.
   * @param {IntentQueue} intentQueue - Central intent queue.
   * @param {Array} actionQueue - Turn playback action queue.
   * @param {Object|null} engine - Game engine instance.
   * @param {Object|null} parentEnvelope - Parent envelope for cascade depth tracking.
   */
  static resolve(explosionIntent, entities, gameMap, intentQueue, actionQueue = [], engine = null, parentEnvelope = null) {
    const { targetX, targetY, radius, minDamage, maxDamage, isIncendiary, sourceEntityId } = explosionIntent;
    if (!gameMap) return;

    console.log(`[ExplosionSystem] Resolving explosion at (${targetX}, ${targetY}), radius: ${radius}, incendiary: ${isIncendiary}`);

    // 1. Emit NoiseEvent
    if (intentQueue) {
      intentQueue.enqueue(null, 'NoiseEvent', new NoiseEvent({
        x: targetX,
        y: targetY,
        volume: 10,
        sourceEntityId: sourceEntityId
      }), parentEnvelope);
    } else if (typeof gameMap.emitNoise === 'function') {
      gameMap.emitNoise(targetX, targetY, 10);
    }

    // 2. Play explosion sound in sync with playback
    if (actionQueue) {
      actionQueue.push({
        type: 'SOUND',
        entityId: sourceEntityId || 'global',
        data: { x: targetX, y: targetY },
        metadata: {
          sound: isIncendiary ? 'Molotov' : 'Explosion1',
          audioOptions: { volume: 1.0 }
        }
      });
    }

    // 2. Queue TILE_FLASH actions
    const flashColor = isIncendiary ? 'rgba(249, 115, 22, 0.6)' : 'rgba(255, 255, 255, 0.8)';
    const flashDuration = isIncendiary ? 800 : 600;

    for (let dy = -Math.ceil(radius); dy <= Math.ceil(radius); dy++) {
      for (let dx = -Math.ceil(radius); dx <= Math.ceil(radius); dx++) {
        const tx = targetX + dx;
        const ty = targetY + dy;
        if (tx < 0 || tx >= gameMap.width || ty < 0 || ty >= gameMap.height) continue;

        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist <= radius + 0.1) {
          actionQueue.push({
            type: 'TILE_FLASH',
            data: { x: tx, y: ty, color: flashColor, duration: flashDuration }
          });

          // Set fire for Molotovs
          if (isIncendiary && dist <= radius) {
            const tile = gameMap.getTile(tx, ty);
            if (tile) {
              tile.fireTurns = 2;
              if (gameMap.activeFires && typeof gameMap.activeFires.add === 'function') {
                gameMap.activeFires.add(`${tx},${ty}`);
              }
            }
          }
        }
      }
    }

    // 3. Damage & Ignite living entities
    entities.forEach(entity => {
      if (
        entity.type !== EntityType.PLAYER &&
        entity.type !== EntityType.ZOMBIE &&
        entity.type !== EntityType.RABBIT &&
        entity.type !== EntityType.NPC &&
        entity.type !== 'player' &&
        entity.type !== 'zombie' &&
        entity.type !== 'rabbit' &&
        entity.type !== 'npc'
      ) return;

      const entityX = entity.logicalX !== undefined ? entity.logicalX : entity.x;
      const entityY = entity.logicalY !== undefined ? entity.logicalY : entity.y;
      const dist = Math.sqrt(Math.pow(entityX - targetX, 2) + Math.pow(entityY - targetY, 2));

      // Molotov checks exact radius, grenade checks radius + 0.1
      const maxDistance = isIncendiary ? radius : radius + 0.1;
      if (dist > maxDistance) return;

      let damage;
      if (isIncendiary) {
        // Molotov damage: 2-7
        damage = Math.floor(Math.random() * (maxDamage - minDamage + 1)) + minDamage;
        entity.fireTurns = 2;
      } else {
        // Grenade damage scaling:
        // Target (dist < 0.5): 20-30
        // 1 tile (0.5 <= dist < 1.5): 15-20
        // 2 tiles (1.5 <= dist < 2.5): 10-15
        if (dist < 0.5) {
          damage = Math.floor(Math.random() * 11) + 20; // 20-30
        } else if (dist < 1.5) {
          damage = Math.floor(Math.random() * 6) + 15;  // 15-20
        } else {
          damage = Math.floor(Math.random() * 6) + 10;  // 10-15
        }
      }

      if (typeof entity.takeDamage === 'function') {
        entity.takeDamage(damage, { id: isIncendiary ? 'molotov' : 'grenade', type: 'weapon' });

        actionQueue.push({
          type: 'DAMAGE_EFFECT',
          data: {
            x: entityX,
            y: entityY,
            damage: damage,
            color: isIncendiary ? '#f97316' : '#ef4444',
            log: `${isIncendiary ? 'Molotov blast' : 'Explosion'} deals ${damage} damage to ${entity.type}${isIncendiary ? ' and sets them on fire!' : ''}`
          }
        });

        // Handle death
        if (entity.hp <= 0 || (typeof entity.isDead === 'function' && entity.isDead())) {
          actionQueue.push({
            type: 'EXPLOSION_LOG',
            data: {
              log: `${entity.type.charAt(0).toUpperCase() + entity.type.slice(1)} killed by ${isIncendiary ? 'Molotov' : 'grenade'}!`
            }
          });

          // Spawning loot
          if ((entity.type === 'zombie' || entity.type === EntityType.ZOMBIE) && engine?.lootGenerator) {
            const hasWindow = gameMap.getTile(entityX, entityY)?.contents.some(e => e.type === 'window' || e.type === EntityType.WINDOW);
            if (!hasWindow && Math.random() < 0.75) {
              const loot = engine.lootGenerator.generateZombieLoot(entity.subtype, gameMap.mapNumber);
              if (loot && loot.length > 0) {
                gameMap.addItemsToTile(entityX, entityY, loot);
              }
            }
          } else if (entity.type === 'npc' || entity.type === EntityType.NPC) {
            if (typeof entity.die === 'function') {
              entity.die();
            }
            const items = entity.inventory ? entity.inventory.getAllItems() : [];
            if (items.length > 0) {
              gameMap.addItemsToTile(entityX, entityY, items);
              entity.inventory.clear();
            }
          } else if (entity.type === 'rabbit' || entity.type === EntityType.RABBIT) {
            const meat = createItemFromDef('food.raw_meat');
            if (meat) {
              gameMap.addItemsToTile(entityX, entityY, [meat]);
            }
          }

          gameMap.removeEntity(entity.id);

          actionQueue.push({
            type: 'DEATH',
            entityId: entity.id,
            data: {
              x: entityX,
              y: entityY,
              entityType: entity.type
            }
          });
        }
      }
    });

    // 4. Doors within blast radius
    const allDoors = entities.filter(e => e.type === 'door' || e.type === EntityType.DOOR);
    allDoors.forEach(door => {
      const doorX = door.logicalX !== undefined ? door.logicalX : door.x;
      const doorY = door.logicalY !== undefined ? door.logicalY : door.y;
      const dist = Math.sqrt(Math.pow(doorX - targetX, 2) + Math.pow(doorY - targetY, 2));

      if (dist <= radius + 0.1 && !door.isDamaged) {
        door.takeDamage(999, true); // silent = true
        if (intentQueue) {
          intentQueue.enqueue(door.id, 'DestroyIntent', new DestroyIntent({ entityId: door.id }), parentEnvelope);
        } else {
          gameMap.removeEntity(door.id);
          gameMap._visionDirty = true;
        }

        actionQueue.push({
          type: 'STRUCTURE_INTERACT',
          entityId: sourceEntityId || 'player',
          data: {
            targetId: door.id,
            targetType: 'door',
            broken: true,
            success: true,
            damage: 999,
            to: { x: doorX, y: doorY }
          }
        });

        actionQueue.push({
          type: 'EXPLOSION_LOG',
          data: { log: 'Explosion blasts open a door!' }
        });
      }
    });

    // 5. Windows within blast radius
    const allWindows = entities.filter(e => e.type === 'window' || e.type === EntityType.WINDOW);
    allWindows.forEach(win => {
      const winX = win.logicalX !== undefined ? win.logicalX : win.x;
      const winY = win.logicalY !== undefined ? win.logicalY : win.y;
      const dist = Math.sqrt(Math.pow(winX - targetX, 2) + Math.pow(winY - targetY, 2));

      if (dist <= radius + 0.1 && !win.isBroken) {
        win.break(true); // silent = true
        if (intentQueue) {
          intentQueue.enqueue(win.id, 'DestroyIntent', new DestroyIntent({ entityId: win.id }), parentEnvelope);
        } else {
          gameMap._visionDirty = true;
        }

        actionQueue.push({
          type: 'STRUCTURE_INTERACT',
          entityId: sourceEntityId || 'player',
          data: {
            targetId: win.id,
            targetType: 'window',
            broken: true,
            success: true,
            to: { x: winX, y: winY }
          }
        });

        actionQueue.push({
          type: 'EXPLOSION_LOG',
          data: { log: 'Explosion shatters a window!' }
        });
      }
    });

    // 6. Breach Wall / Building tiles / Edge Walls within 1.45 tiles (catches all diagonals)
    let destroyedWall = false;
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        const tx = targetX + dx;
        const ty = targetY + dy;
        if (tx < 0 || tx >= gameMap.width || ty < 0 || ty >= gameMap.height) continue;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > 1.45) continue; // Catches diagonals (sqrt(2) ≈ 1.414)

        const tile = gameMap.getTile(tx, ty);
        if (!tile) continue;

        // A. Check if it's a solid wall/building tile
        if (tile.terrain === 'wall' || tile.terrain === 'building') {
          gameMap.setTerrain(tx, ty, 'floor');
          destroyedWall = true;
        }

        // B. Check if it has any edge walls
        if (tile.edgeWalls) {
          if (tile.edgeWalls.n || tile.edgeWalls.e || tile.edgeWalls.s || tile.edgeWalls.w) {
            tile.edgeWalls = { n: false, e: false, s: false, w: false };
            destroyedWall = true;
          }
        }

        // C. Clear the inward-facing edge wall on each cardinal neighbor
        const neighborDirs = [
          { nx: tx,     ny: ty - 1, edge: 's' }, // tile to the north has a south edge wall toward us
          { nx: tx,     ny: ty + 1, edge: 'n' }, // tile to the south has a north edge wall toward us
          { nx: tx - 1, ny: ty,     edge: 'e' }, // tile to the west has an east edge wall toward us
          { nx: tx + 1, ny: ty,     edge: 'w' }, // tile to the east has a west edge wall toward us
        ];
        neighborDirs.forEach(({ nx, ny, edge }) => {
          const neighborTile = gameMap.getTile(nx, ny);
          if (neighborTile && neighborTile.edgeWalls && neighborTile.edgeWalls[edge]) {
            neighborTile.edgeWalls[edge] = false;
            destroyedWall = true;
          }
        });
      }
    }

    if (destroyedWall) {
      gameMap._visionDirty = true;
      actionQueue.push({
        type: 'EXPLOSION_LOG',
        data: { log: 'Explosion blasts through a wall!' }
      });
    }

    // 7. Destroy items on the ground within blast radius
    let itemsDestroyed = false;
    for (let dy = -Math.ceil(radius); dy <= Math.ceil(radius); dy++) {
      for (let dx = -Math.ceil(radius); dx <= Math.ceil(radius); dx++) {
        const tx = targetX + dx;
        const ty = targetY + dy;
        if (tx < 0 || tx >= gameMap.width || ty < 0 || ty >= gameMap.height) continue;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > radius + 0.1) continue;
        const tile = gameMap.getTile(tx, ty);
        if (tile && tile.inventoryItems && tile.inventoryItems.length > 0) {
          gameMap.setItemsOnTile(tx, ty, []);
          itemsDestroyed = true;
        }
      }
    }

    if (itemsDestroyed) {
      actionQueue.push({
        type: 'EXPLOSION_LOG',
        data: { log: 'Explosion destroys items on the ground!' }
      });
    }
  }
}
