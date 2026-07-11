import { ItemDefs } from '../inventory/ItemDefs.js';
import { AITargeting } from './AITargeting.js';
import { CombatResolver } from '../systems/CombatResolver.js';
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
    const turretStats = def?.turretStats;
    if (!turretStats) {
      console.warn(`[TurretAI] No turretStats found for item defId "${turretItem.defId}"`);
      return { actions };
    }

    // Check for suppressor
    const barrel = turretItem.attachments?.['barrel'];
    const isSuppressed = barrel?.categories?.includes('suppressor');
    const noiseRadius = isSuppressed ? 3 : turretStats.noiseRadius;

    let ap = turretStats.maxAp;

    // In-range, visible, faction-HOSTILE targets sorted nearest-first. The turret
    // is an Item placed at (turretX, turretY), so we measure distance/LOS from that
    // tile via the `origin` option rather than the attacker's own position.
    const targets = AITargeting.acquireTargets(turretItem, candidates || [], {
      gameMap,
      maxRange: turretStats.maxRange,
      requireLineOfSight: true,
      origin: { x: turretX, y: turretY }
    });

    for (const target of targets) {
      if (ap <= 0) break;
      if (!hasAmmo()) break;
      if (target.hp <= 0) continue;

      const cx = target.logicalX !== undefined ? target.logicalX : target.x;
      const cy = target.logicalY !== undefined ? target.logicalY : target.y;
      const dist = Math.sqrt((cx - turretX) ** 2 + (cy - turretY) ** 2);

      // Fire until target dead, out of AP, or out of ammo
      while (ap >= turretStats.apPerShot && hasAmmo() && target.hp > 0) {
        ap -= turretStats.apPerShot;
        consumeAmmo();

        const squaresAway = Math.floor(dist);
        const { hit, isCrit, damage, dodged } = CombatResolver.rollTurret({
          turretStats,
          rangedLvl: turretStats.rangedLvl,
          squaresAway,
          defenderType: target.type,
          defenderSubtype: target.subtype,
          defender: target
        });

        if (hit) {
          // SIMULATION-FIRST damage (see TurnManager damage-timing models): apply
          // now so the while-loop above sees the post-hit HP and stops firing once
          // the target dies. The TURRET_SHOT action below is cosmetic only —
          // TurnManager must NOT re-apply this damage during playback.
          const finalDamage = CombatResolver.applyArmorAbsorption(target, damage);
          if (finalDamage > 0) target.takeDamage(finalDamage, turretItem);
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
            targetX:     cx,
            targetY:     cy,
            hit, isCrit, damage, dodged,
            isDead:      target.hp <= 0
          }
        });

        if (target.hp <= 0) break;
      }
    }

    return { actions };
  }
}
