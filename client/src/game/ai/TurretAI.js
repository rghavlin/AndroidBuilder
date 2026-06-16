import { LineOfSight } from '../utils/LineOfSight.js';
import { ItemDefs } from '../inventory/ItemDefs.js';

export class TurretAI {
  /**
   * Execute one full turret turn.
   * @param {Object} turretItem  - The Item instance (placeable.auto_turret)
   * @param {number} turretX     - Logical X of the turret's tile
   * @param {number} turretY     - Logical Y
   * @param {GameMap} gameMap
   * @param {Array}  zombies     - All living zombie entities on map
   * @returns {{ actions: Array }} - Action records for TurnManager
   */
  static executeTurretTurn(turretItem, turretX, turretY, gameMap, zombies) {
    const actions = [];

    // Gate: must be on and have battery
    if (!turretItem.isOn) return { actions };

    const battery = turretItem.attachments?.['battery'];
    if (!battery || (battery.ammoCount || 0) <= 0) {
      turretItem.isOn = false;
      actions.push({
        type: 'SOUND',
        entityId: `turret_${turretItem.instanceId}`,
        metadata: { sound: 'power_down' }, // Example sound trigger
        data: { x: turretX, y: turretY }
      });
      return { actions };
    }

    // Gate: must have a magazine with ammo
    const mag = turretItem.attachments?.['ammo'];
    if (!mag || (mag.ammoCount || 0) <= 0) return { actions };

    const def = turretItem.defId ? ItemDefs[turretItem.defId] : null;
    const turretStats = def?.turretStats || {
      maxRange: 15,
      apPerShot: 1,
      maxAp: 10,
      rangedLvl: 5,
      damage: { min: 5, max: 18 },
      accuracyFalloff: 0.05,
      minAccuracy: 0.05,
      noiseRadius: 18
    };

    // Check for suppressor
    const barrel = turretItem.attachments?.['barrel'];
    const isSuppressed = barrel?.categories?.includes('suppressor');
    const noiseRadius = isSuppressed ? 3 : turretStats.noiseRadius;

    let ap = turretStats.maxAp;
    const accuracyBonus = turretStats.rangedLvl * 0.01;
    const critChance = 0.05 + (turretStats.rangedLvl - 1) * 0.05;

    // Build list of zombies in range, mapping distance to avoid recomputation
    const inRange = zombies
      .map(z => {
        if (z.hp <= 0) return null;
        const dx = z.logicalX - turretX;
        const dy = z.logicalY - turretY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        return { zombie: z, dist };
      })
      .filter(entry => {
        if (!entry) return false;
        if (entry.dist > turretStats.maxRange) return false;
        const los = LineOfSight.hasLineOfSight(gameMap, turretX, turretY, entry.zombie.logicalX, entry.zombie.logicalY, { maxRange: turretStats.maxRange });
        return los.hasLineOfSight;
      })
      .sort((a, b) => a.dist - b.dist);

    for (const entry of inRange) {
      const zombie = entry.zombie;
      let dist = entry.dist;

      if (ap <= 0) break;
      if ((mag.ammoCount || 0) <= 0) break;
      if (zombie.hp <= 0) continue;

      // Fire until zombie dead, out of AP, or out of ammo
      while (ap >= turretStats.apPerShot && (mag.ammoCount || 0) > 0 && zombie.hp > 0) {
        ap -= turretStats.apPerShot;
        mag.ammoCount = Math.max(0, mag.ammoCount - 1);

        const squaresAway = Math.floor(dist);
        const baseHit     = Math.max(turretStats.minAccuracy, 1.0 - (squaresAway - 1) * turretStats.accuracyFalloff);
        const hit         = Math.random() <= (baseHit + accuracyBonus);
        const isCrit      = hit && Math.random() <= critChance;
        let damage = 0;

        if (hit) {
          damage = isCrit
            ? Math.floor(turretStats.damage.max * 1.5)
            : Math.floor(Math.random() * (turretStats.damage.max - turretStats.damage.min + 1)) + turretStats.damage.min;
          zombie.takeDamage(damage);
        }

        // Noise
        if (gameMap.emitNoise) gameMap.emitNoise(turretX, turretY, noiseRadius);

        actions.push({
          type:     'TURRET_SHOT',
          entityId: `turret_${turretItem.instanceId}`,
          data: {
            turretX, turretY,
            targetId:    zombie.id,
            targetX:     zombie.logicalX,
            targetY:     zombie.logicalY,
            hit, isCrit, damage,
            isDead:      zombie.hp <= 0
          }
        });

        if (zombie.hp <= 0) break;
      }
    }

    return { actions };
  }
}
