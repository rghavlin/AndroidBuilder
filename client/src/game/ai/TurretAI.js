import { LineOfSight } from '../utils/LineOfSight.js';
import { ItemDefs } from '../inventory/ItemDefs.js';

// Accuracy & crit at player level 5 ranged combat:
//   rangedLvl = 5
//   accuracyBonus = (5 - 0) * 0.01 = 0.05
//   baseHitChance (no scope, no laser, battle rifle stats):
//     1.0 - (squaresAway - 1) * 0.05,  minAccuracy: 0.05
//   critChance = 0.05 + (5 - 1) * 0.05 = 0.25

const TURRET_RANGED_LVL = 5;
const TURRET_MAX_RANGE  = 15; // tiles
const TURRET_MAX_AP     = 10;
const TURRET_AP_PER_SHOT = 1;
const BATTLE_RIFLE_STATS = {
  damage:          { min: 5, max: 18 },
  accuracyFalloff: 0.05,
  minAccuracy:     0.05,
  noiseRadius:     18
};

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
      return { actions };
    }

    // Gate: must have a magazine with ammo
    const mag = turretItem.attachments?.['ammo'];
    if (!mag || (mag.ammoCount || 0) <= 0) return { actions };

    // Check for suppressor
    const barrel = turretItem.attachments?.['barrel'];
    const isSuppressed = barrel?.categories?.includes('suppressor');
    const noiseRadius = isSuppressed ? 3 : BATTLE_RIFLE_STATS.noiseRadius;

    let ap = TURRET_MAX_AP;
    const accuracyBonus = TURRET_RANGED_LVL * 0.01; // 0.05
    const critChance = 0.05 + (TURRET_RANGED_LVL - 1) * 0.05; // 0.25

    // Build list of zombies in range, sorted nearest-first
    const inRange = zombies
      .filter(z => {
        if (z.hp <= 0) return false;
        const dx = z.logicalX - turretX;
        const dy = z.logicalY - turretY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > TURRET_MAX_RANGE) return false;
        const los = LineOfSight.hasLineOfSight(gameMap, turretX, turretY, z.logicalX, z.logicalY, { maxRange: TURRET_MAX_RANGE });
        return los.hasLineOfSight;
      })
      .sort((a, b) => {
        const dA = Math.sqrt(Math.pow(a.logicalX - turretX, 2) + Math.pow(a.logicalY - turretY, 2));
        const dB = Math.sqrt(Math.pow(b.logicalX - turretX, 2) + Math.pow(b.logicalY - turretY, 2));
        return dA - dB;
      });

    const zombieSimulatedHps = new Map();
    for (const z of inRange) {
      zombieSimulatedHps.set(z.id, z.hp);
    }

    for (const zombie of inRange) {
      if (ap <= 0) break;
      if ((mag.ammoCount || 0) <= 0) break;
      let currentHp = zombieSimulatedHps.get(zombie.id);
      if (currentHp <= 0) continue;

      // Fire until zombie dead, out of AP, or out of ammo
      while (ap >= TURRET_AP_PER_SHOT && (mag.ammoCount || 0) > 0 && currentHp > 0) {
        ap -= TURRET_AP_PER_SHOT;
        mag.ammoCount = Math.max(0, mag.ammoCount - 1);

        const distance    = Math.sqrt(Math.pow(zombie.logicalX - turretX, 2) + Math.pow(zombie.logicalY - turretY, 2));
        const squaresAway = Math.floor(distance);
        const baseHit     = Math.max(BATTLE_RIFLE_STATS.minAccuracy, 1.0 - (squaresAway - 1) * BATTLE_RIFLE_STATS.accuracyFalloff);
        const hit         = Math.random() <= (baseHit + accuracyBonus);
        const isCrit      = hit && Math.random() <= critChance;
        let damage = 0;

        if (hit) {
          damage = isCrit
            ? Math.floor(BATTLE_RIFLE_STATS.damage.max * 1.5)
            : Math.floor(Math.random() * (BATTLE_RIFLE_STATS.damage.max - BATTLE_RIFLE_STATS.damage.min + 1)) + BATTLE_RIFLE_STATS.damage.min;
          currentHp = Math.max(0, currentHp - damage);
          zombieSimulatedHps.set(zombie.id, currentHp);
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
            isDead:      currentHp <= 0
          }
        });

        if (currentHp <= 0) break;
      }
    }

    return { actions };
  }
}
