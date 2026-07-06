import { gameRandom } from '../utils/SeededRandom.js';
import { getZombieType } from '../entities/ZombieTypes.js';
import engine from '../GameEngine.js';
import GameEvents, { GAME_EVENT } from '../utils/GameEvents.js';

// Single shared home for combat dice-rolling math, used by every attacker type
// (player, NPC, zombie, turret). Combat capability tiers:
//   - Active Defender (player, NPCs) — automatically spends 1 banked AP per
//     incoming hit to attempt a dodge, with diminishing returns per dodge this
//     turn. There is no reactive prompt: because AP left unspent at end-of-turn
//     just sits idle during the zombie/NPC/turret phase anyway, "how much AP to
//     hold back before ending your turn" IS the player's defensive choice.
//   - Passive Evader (zombies) — flat "stumble" evasion from their type def,
//     no AP, no agency, since they're mindless.
//   - Defenseless (turrets, structures) — never evades.
//
// AP-spend timing: many attacks against the player/NPCs resolve during the
// SIMULATION phase (all at once) but only become visible during a separate,
// slower PLAYBACK phase seconds later (see TurnManager's "PLAYBACK-FIRST"
// damage model). If a dodge attempt mutated the defender's real `ap` the
// instant it was decided, the AP gauge would visibly drop right when the
// player clicks End Turn — before the attack that "caused" it has even
// animated. So rollActiveDefense decides against a per-turn shadow AP pool
// (`defender.pendingDefenseAp`, reset alongside defensesThisTurn at the start
// of each turn) and reports how much AP *should* be spent; callers on a
// deferred-playback path (zombies/NPCs attacking) apply that real AP
// deduction at playback time, in step with the animation and log line.
// Synchronous callers (the player directly clicking to attack, and turrets,
// which already apply damage during simulation) apply it immediately.
export class CombatResolver {
  /** Base crit chance from a weapon/turret stats block, defaulting to 5% if unset. */
  static weaponCritChance(statsBlock) {
    return statsBlock?.critChance !== undefined ? statsBlock.critChance : 0.05;
  }

  /** Perception's precision bonus on top of a weapon's base crit chance. */
  static perceptionCritBonus(currentPerception = 0) {
    return Math.floor(currentPerception / 15) * 0.05;
  }

  /**
   * Perception's aim bonus added to RANGED hit chance, and Agility's to MELEE hit
   * chance. Deliberately light (≈+2% at baseline, stepping up with the attribute) so
   * the trained melee/ranged skill remains the dominant hit-chance lever, with the
   * attribute a small innate floor on top. Divisors chosen so the default attributes
   * (Per 20, Agi 40) sit comfortably inside a step rather than on a cliff edge.
   */
  static perceptionAimBonus(currentPerception = 0) {
    return Math.floor((currentPerception || 0) / 15) * 0.02;
  }

  static meleeAimBonus(currentAgility = 0) {
    return Math.floor((currentAgility || 0) / 25) * 0.02;
  }

  /** Strength's flat melee damage bonus, capped at +5. */
  static strengthDamageBonus(currentStrength = 0) {
    return Math.min(5, Math.floor(currentStrength / 20));
  }

  /** Constitution's sickness/disease resistance level, in integer steps (one per 20 points). */
  static sicknessResistLevel(currentConstitution = 0) {
    return Math.floor((currentConstitution || 0) / 20);
  }

  /** Fraction (0-1) of an inflicted sickness duration that Constitution shrugs off, capped. */
  static sicknessResistFraction(currentConstitution = 0) {
    return Math.min(0.6, CombatResolver.sicknessResistLevel(currentConstitution) * 0.15);
  }

  /**
   * Shortens an inflicted sickness duration by Constitution's resistance. Applied at
   * the single inflictSickness choke point, so it covers every source (zombie bites,
   * spoiled food, dirty water). Always leaves at least 1 turn if any was inflicted —
   * a hardy character shrugs sickness off faster, never becomes fully immune.
   */
  static applySicknessResistance(amount, currentConstitution = 0) {
    if (!(amount > 0)) return amount;
    const reduced = amount * (1 - CombatResolver.sicknessResistFraction(currentConstitution));
    return Math.max(1, Math.round(reduced));
  }

  /** Agility penalty, in agility percentage points, from armor heavier than the defender can handle. */
  static armorWeightPenalty(currentStrength = 0, weightRequirement = 0) {
    return Math.max(0, weightRequirement - currentStrength);
  }

  /**
   * Routes incoming combat damage through the defender's worn armor first:
   * drains the absorption pool 1:1, spills whatever's left over to HP, and
   * breaks (deletes) the armor at 0. Only ever called from combat call sites —
   * fire/starvation/disease damage never routes through this, by design.
   * Returns the post-armor damage to actually apply.
   */
  static applyArmorAbsorption(defender, incomingDamage, inventoryManager = null) {
    if (!defender || !(incomingDamage > 0)) return incomingDamage;

    const absorption = defender.absorption || 0;
    if (absorption <= 0) return incomingDamage;

    const absorbed = Math.min(incomingDamage, absorption);
    defender.absorption = absorption - absorbed;
    GameEvents.emit(GAME_EVENT.ARMOR_ABSORBED, { absorbed, remaining: defender.absorption });

    if (defender.absorption <= 0) {
      CombatResolver.breakEquippedArmor(defender, inventoryManager);
    }

    return incomingDamage - absorbed;
  }

  /** Destroys the defender's equipped armor item and clears their armor component. */
  static breakEquippedArmor(defender, inventoryManager = null) {
    if (defender && defender.type === 'player') {
      const inv = inventoryManager || engine.inventoryManager;
      const armorItem = inv?.equipment?.armor;
      if (armorItem && inv) {
        inv.destroyItem(armorItem.instanceId);
      }
    }
    if (defender) {
      defender.absorption = 0;
      defender.maxAbsorption = 0;
      defender.weightRequirement = 0;
    }
  }

  /**
   * Active Defender dodge attempt: reserves 1 AP from the defender's per-turn
   * shadow AP pool and rolls against a dodge target built from current Agility,
   * minus the over-weight-armor penalty and a per-dodge diminishing-returns
   * penalty (both expressed in the same 0-100 scale as Agility). Only
   * attempted when the defender has shadow AP banked to spend. Does NOT mutate
   * the defender's real `ap` — callers apply `apCost` themselves, at whatever
   * point (immediate or deferred to playback) matches their execution model.
   */
  static rollActiveDefense(defender) {
    const availableAp = defender?.pendingDefenseAp !== undefined ? defender.pendingDefenseAp : (defender?.ap || 0);
    if (!defender || availableAp < 1) return { attempted: false, evaded: false, apCost: 0 };

    // Penalty is based on dodges already spent THIS turn before this one, so the
    // first dodge attempt is never penalized — only repeat dodges in the same
    // turn get progressively worse.
    const priorDefenses = defender.defensesThisTurn || 0;

    defender.pendingDefenseAp = availableAp - 1;
    defender.defensesThisTurn = priorDefenses + 1;

    const armorPenalty = CombatResolver.armorWeightPenalty(defender.currentStrength, defender.weightRequirement);
    const diminishingPenalty = priorDefenses * ((defender.diminishingRate ?? 0.15) * 100);
    const baseDodge = (defender.currentAgility || 0) * 0.5;
    const dodgeTarget = Math.max(0, baseDodge - armorPenalty - diminishingPenalty);

    const evaded = gameRandom.next() * 100 < dodgeTarget;
    return { attempted: true, evaded, apCost: 1 };
  }

  /**
   * Resolves which combat capability tier a defender falls into and rolls its
   * evasion accordingly: Passive Evaders roll their flat stumble chance,
   * Active Defenders attempt a banked-AP dodge, Defenseless targets never evade.
   */
  static resolveDefenseTier({ defenderType, defenderSubtype, defender }) {
    if (defenderType === 'zombie') {
      const stumbleEvasion = getZombieType(defenderSubtype)?.stumbleEvasion || 0;
      const evaded = stumbleEvasion > 0 && gameRandom.next() < stumbleEvasion;
      return { tier: 'passiveEvader', evaded, apCost: 0 };
    }
    if (defenderType === 'player' || defenderType === 'npc') {
      const { evaded, apCost } = CombatResolver.rollActiveDefense(defender);
      return { tier: 'activeDefender', evaded, apCost };
    }
    return { tier: 'defenseless', evaded: false, apCost: 0 };
  }

  /** Player melee attack roll. */
  static rollPlayerMelee({ weaponStats, skillLvl, drunkenness = 0, isWindowTarget, isStunRodActive, hasTargetEntity, currentStrength = 20, currentAgility = 40, currentPerception = 20, defenderType, defenderSubtype, defender }) {
    const accuracyBonus = (skillLvl - drunkenness) * 0.01;
    const attributeAim = CombatResolver.meleeAimBonus(currentAgility);
    let hit = isWindowTarget ? true : gameRandom.next() <= (weaponStats.hitChance + accuracyBonus + attributeAim);

    const critChance = CombatResolver.weaponCritChance(weaponStats) + CombatResolver.perceptionCritBonus(currentPerception);
    let isCrit = hit && gameRandom.next() <= critChance;

    let baseDamage = isCrit
      ? Math.floor(weaponStats.damage.max * 1.5)
      : (hit ? gameRandom.nextInt(weaponStats.damage.min, weaponStats.damage.max) : 0);

    let damage = baseDamage;
    if (hit) damage += CombatResolver.strengthDamageBonus(currentStrength);
    // Drunkenness increases melee damage (brawling bonus) while reducing accuracy
    if (hit && drunkenness > 0) damage += drunkenness;

    let extraDamageApplied = 0;
    let stunDuration = 0;
    if (hit && isStunRodActive && hasTargetEntity) {
      extraDamageApplied = gameRandom.nextInt(1, 5);
      damage += extraDamageApplied;
      stunDuration = gameRandom.nextInt(1, 3);
    }

    let dodged = false;
    let defenseApSpent = 0;
    if (hit) {
      const { evaded, apCost } = CombatResolver.resolveDefenseTier({ defenderType, defenderSubtype, defender });
      defenseApSpent = apCost;
      if (evaded) {
        dodged = true;
        hit = false;
        isCrit = false;
        damage = 0;
        extraDamageApplied = 0;
        stunDuration = 0;
      }
    }

    return { hit, isCrit, damage, extraDamageApplied, stunDuration, dodged, defenseApSpent };
  }

  /** Player ranged single-shot roll. */
  static rollPlayerRanged({ stats, skillLvl, drunkenness = 0, squaresAway, isWindowTarget, hasScope, hasLaserSight, currentPerception = 20, defenderType, defenderSubtype, defender }) {
    const accuracyBonus = (skillLvl - drunkenness) * 0.01;
    const isSling = stats.isSling;

    let baseHitChance = 1.0;
    if (isSling) {
      baseHitChance = Math.max(0, 0.9 - (squaresAway - 2) * 0.1);
    } else if (stats.isShotgun) {
      baseHitChance = squaresAway <= (stats.accuracyMaxRange || 5) ? 1.0
        : Math.max(stats.minAccuracy, 1.0 - (squaresAway - 5) * (stats.accuracyFalloff || 0.2));
    } else if (hasScope) {
      baseHitChance = squaresAway <= 15 ? 1.0
        : Math.max(stats.minAccuracy, 1.0 - (squaresAway - 15) * stats.accuracyFalloff);
    } else if (hasLaserSight) {
      baseHitChance = squaresAway <= 10 ? 1.0
        : Math.max(stats.minAccuracy, 1.0 - (squaresAway - 10) * stats.accuracyFalloff);
    } else {
      baseHitChance = Math.max(stats.minAccuracy, 1.0 - (squaresAway - 1) * stats.accuracyFalloff);
    }

    const attributeAim = CombatResolver.perceptionAimBonus(currentPerception);
    let hit = isWindowTarget ? true : gameRandom.next() <= (baseHitChance + accuracyBonus + attributeAim);
    const critChance = CombatResolver.weaponCritChance(stats) + CombatResolver.perceptionCritBonus(currentPerception);
    let isCrit = hit && gameRandom.next() <= critChance;

    let damage = 0;
    if (hit) {
      if (stats.isShotgun) {
        // Shotgun pellets lose energy with distance, so damage falls off for both
        // crits and normal hits. A crit starts from the boosted max, a normal hit
        // from the base min; then both decay by range.
        let finalDamage = isCrit ? (stats.damage.max * 1.5) : stats.damage.min;
        if (squaresAway > 1) finalDamage *= Math.pow(1 - (stats.damageFalloff || 0.1), squaresAway - 1);
        if (squaresAway > 5) finalDamage *= Math.pow(1 - (stats.damageFalloffExtra || 0.1), squaresAway - 5);
        damage = Math.floor(finalDamage);
      } else {
        damage = isCrit
          ? Math.floor(stats.damage.max * 1.5)
          : gameRandom.nextInt(stats.damage.min, stats.damage.max);
      }
    }

    let dodged = false;
    let defenseApSpent = 0;
    if (hit) {
      const { evaded, apCost } = CombatResolver.resolveDefenseTier({ defenderType, defenderSubtype, defender });
      defenseApSpent = apCost;
      if (evaded) {
        dodged = true;
        hit = false;
        isCrit = false;
        damage = 0;
      }
    }

    return { hit, isCrit, damage, dodged, defenseApSpent };
  }

  /**
   * NPC melee/ranged roll. Hit chance is now additive (weapon base + a skill
   * modifier derived from combatSkill) so it has the same shape as the player's
   * formula — combatSkill plays the same role for NPCs that meleeLvl/rangedLvl
   * play for the player. combatSkill 0.5 (today's universal default) produces a
   * zero modifier, so existing NPC balance is unchanged until NPC types are
   * tuned with different combatSkill values.
   */
  static rollNpc({ isRanged, combatSkill, weaponDef, weapon, distance, currentStrength = 20, currentAgility = 40, currentPerception = 20, defenderType, defenderSubtype, defender }) {
    const skillModifier = (combatSkill - 0.5) * 0.5;

    let baseChance;
    if (isRanged) {
      const stats = weaponDef?.rangedStats || {};
      const falloff = stats.accuracyFalloff || 0.1;
      baseChance = Math.max(stats.minAccuracy || 0.1, 1.0 - (distance - 1) * falloff);
    } else {
      baseChance = weaponDef?.combat?.hitChance || 0.75;
    }

    const attributeAim = isRanged
      ? CombatResolver.perceptionAimBonus(currentPerception)
      : CombatResolver.meleeAimBonus(currentAgility);
    const hitChance = Math.max(0.2, Math.min(0.95, baseChance + skillModifier + attributeAim));
    let hit = gameRandom.next() < hitChance;

    const critStatsBlock = isRanged ? (weaponDef?.rangedStats || {}) : (weaponDef?.combat || {});
    const critChance = CombatResolver.weaponCritChance(critStatsBlock) + CombatResolver.perceptionCritBonus(currentPerception);
    let isCrit = hit && gameRandom.next() < critChance;

    let damage = 0;
    let dodged = false;
    let defenseApSpent = 0;
    if (hit) {
      const damageRange = isRanged
        ? (weaponDef?.rangedStats?.damage || weapon?.rangedStats?.damage || { min: 2, max: 5 })
        : (weaponDef?.combat?.damage || weaponDef?.damage || weapon?.damage || { min: 1, max: 3 });
      damage = isCrit ? Math.floor(damageRange.max * 1.5) : gameRandom.nextInt(damageRange.min, damageRange.max);
      if (!isRanged) damage += CombatResolver.strengthDamageBonus(currentStrength);

      const { evaded, apCost } = CombatResolver.resolveDefenseTier({ defenderType, defenderSubtype, defender });
      defenseApSpent = apCost;
      if (evaded) {
        dodged = true;
        hit = false;
        isCrit = false;
        damage = 0;
      }
    }

    return { hit, isCrit, damage, dodged, defenseApSpent };
  }

  /** Zombie melee roll. Attack accuracy stays a flat 50% — only the defender's evasion is new. */
  static rollZombie({ subtype, defenderType, defenderSubtype, defender }) {
    let hit = gameRandom.next() < 0.50;
    let damage = 0;
    let bleedingInflicted = false;
    let sickInflicted = false;
    let dodged = false;
    let defenseApSpent = 0;

    if (hit) {
      const combat = getZombieType(subtype)?.combat || {};
      if (combat.damage && typeof combat.damage.min === 'number' && typeof combat.damage.max === 'number') {
        damage = gameRandom.nextInt(combat.damage.min, combat.damage.max);
      }
      if (combat.bleedChance && gameRandom.next() < combat.bleedChance) bleedingInflicted = true;
      if (combat.sickChance && gameRandom.next() < combat.sickChance) sickInflicted = true;

      const { evaded, apCost } = CombatResolver.resolveDefenseTier({ defenderType, defenderSubtype, defender });
      defenseApSpent = apCost;
      if (evaded) {
        dodged = true;
        hit = false;
        damage = 0;
        bleedingInflicted = false;
        sickInflicted = false;
      }
    }

    return { hit, damage, bleedingInflicted, sickInflicted, dodged, defenseApSpent };
  }

  /** Turret ranged roll. Turrets have no Perception/Strength — crit stays rangedLvl-based. */
  static rollTurret({ turretStats, rangedLvl, squaresAway, defenderType, defenderSubtype, defender }) {
    const accuracyBonus = rangedLvl * 0.01;
    const critChance = 0.05 + (rangedLvl - 1) * 0.05;
    const baseHit = Math.max(turretStats.minAccuracy, 1.0 - (squaresAway - 1) * turretStats.accuracyFalloff);
    let hit = gameRandom.next() <= (baseHit + accuracyBonus);
    let isCrit = hit && gameRandom.next() <= critChance;

    let damage = 0;
    let dodged = false;
    let defenseApSpent = 0;
    if (hit) {
      damage = isCrit
        ? Math.floor(turretStats.damage.max * 1.5)
        : gameRandom.nextInt(turretStats.damage.min, turretStats.damage.max);

      const { evaded, apCost } = CombatResolver.resolveDefenseTier({ defenderType, defenderSubtype, defender });
      defenseApSpent = apCost;
      if (evaded) {
        dodged = true;
        hit = false;
        isCrit = false;
        damage = 0;
      }
    }

    return { hit, isCrit, damage, dodged, defenseApSpent };
  }
}
