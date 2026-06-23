import { LineOfSight } from '../utils/LineOfSight.js';
import { ItemDefs } from '../inventory/ItemDefs.js';

export class TurretAI {
  /**
   * Execute one full turret turn.
   * @param {Object} turretItem  - The Item instance (placeable.auto_turret)
   * @param {number} turretX     - Logical X of the turret's tile
   * @param {number} turretY     - Logical Y
   * @param {GameMap} gameMap
   * @param {Array}  candidates  - Potential target entities (player, zombies,
   *   npcs, exposed turret entities). Filtered to faction-hostile targets here.
   * @returns {{ actions: Array }} - Action records for TurnManager
   */
  static executeTurretTurn(turretItem, turretX, turretY, gameMap, candidates) {
    const actions = [];

    // Neutral/non-player turrets have infinite power + ammo and are always on,
    // so they bypass the battery/magazine gates and never consume resources.
    const infinite = typeof turretItem.isInfiniteTurret === 'function'
      ? turretItem.isInfiniteTurret()
      : (turretItem.factionId && turretItem.factionId !== 'player');

    const mag = turretItem.attachments?.['ammo'];

    if (!infinite) {
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

      // Gate: must have a magazine with ammo. Out of ammo => auto power-down
      // (turret goes inert: untargetable and walkable by all).
      if (!mag || (mag.ammoCount || 0) <= 0) {
        turretItem.isOn = false;
        actions.push({
          type: 'SOUND',
          entityId: `turret_${turretItem.instanceId}`,
          metadata: { sound: 'power_down' },
          data: { x: turretX, y: turretY }
        });
        return { actions };
      }
    }

    // Ammo availability + consumption: unlimited for infinite turrets.
    const hasAmmo = () => infinite || (mag && (mag.ammoCount || 0) > 0);
    const consumeAmmo = () => { if (!infinite && mag) mag.ammoCount = Math.max(0, mag.ammoCount - 1); };

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

    // Build list of in-range, visible, faction-HOSTILE targets sorted nearest-first.
    const inRange = (candidates || [])
      .map(c => {
        if (!c || c === turretItem) return null;
        if (c.hp !== undefined && c.hp <= 0) return null;
        if (!turretItem.isHostileTo(c)) return null;
        const cx = c.logicalX !== undefined ? c.logicalX : c.x;
        const cy = c.logicalY !== undefined ? c.logicalY : c.y;
        const dx = cx - turretX;
        const dy = cy - turretY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        return { target: c, dist, cx, cy };
      })
      .filter(entry => {
        if (!entry) return false;
        if (entry.dist > turretStats.maxRange) return false;
        const los = LineOfSight.hasLineOfSight(gameMap, turretX, turretY, entry.cx, entry.cy, { maxRange: turretStats.maxRange });
        return los.hasLineOfSight;
      })
      .sort((a, b) => a.dist - b.dist);

    for (const entry of inRange) {
      const target = entry.target;
      let dist = entry.dist;

      if (ap <= 0) break;
      if (!hasAmmo()) break;
      if (target.hp <= 0) continue;

      // Fire until target dead, out of AP, or out of ammo
      while (ap >= turretStats.apPerShot && hasAmmo() && target.hp > 0) {
        ap -= turretStats.apPerShot;
        consumeAmmo();

        const squaresAway = Math.floor(dist);
        const baseHit     = Math.max(turretStats.minAccuracy, 1.0 - (squaresAway - 1) * turretStats.accuracyFalloff);
        const hit         = Math.random() <= (baseHit + accuracyBonus);
        const isCrit      = hit && Math.random() <= critChance;
        let damage = 0;

        if (hit) {
          damage = isCrit
            ? Math.floor(turretStats.damage.max * 1.5)
            : Math.floor(Math.random() * (turretStats.damage.max - turretStats.damage.min + 1)) + turretStats.damage.min;
          target.takeDamage(damage);
        }

        // Noise
        if (gameMap.emitNoise) gameMap.emitNoise(turretX, turretY, noiseRadius);

        actions.push({
          type:     'TURRET_SHOT',
          entityId: `turret_${turretItem.instanceId}`,
          data: {
            turretX, turretY,
            targetId:    target.id,
            targetType:  target.type,
            targetX:     entry.cx,
            targetY:     entry.cy,
            hit, isCrit, damage,
            isDead:      target.hp <= 0
          }
        });

        if (target.hp <= 0) break;
      }
    }

    return { actions };
  }
}
