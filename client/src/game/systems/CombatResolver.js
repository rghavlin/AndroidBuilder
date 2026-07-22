import { gameRandom } from '../utils/SeededRandom.js';
import { getZombieType } from '../entities/ZombieTypes.js';
import engine from '../GameEngine.js';
import GameEvents, { GAME_EVENT } from '../utils/GameEvents.js';

// Shared continuous attribute->bonus conversion. Every "attribute nudges a
// probability" site (melee/ranged aim, Defense, sickness resist) routes
// through this one function instead of inventing its own bucket size, so a
// one-point nutrition-cascade dip always moves the modifier a little instead
// of doing nothing until it crosses an arbitrary threshold. BASELINE=20
// matches the default value shared by Strength/Agility/Perception/Constitution.
// STEP is a provisional magnitude, expected to be retuned from playtesting.
const ATTR_MOD_BASELINE = 20;
const ATTR_MOD_STEP = 0.0015;

// Melee no longer reads a per-weapon accuracy stat (removed design decision:
// weapon-level hitChance stacked unclamped on top of skill/attribute and, per
// the itemization data, correlated WITH damage rather than trading off
// against it — so it wasn't creating a meaningful choice, just quietly
// contradicting "trained skill is the dominant hit-chance lever." Every melee
// weapon now shares this flat base; weapons differentiate on damage, crit,
// and (later) speed/AP cost instead. Provisional, tune from playtesting.
const BASE_MELEE_HIT_CHANCE = 0.6;

// Crit is a degree-of-success on the hit roll itself, not a separate roll:
// the engine already rolls low-is-good (gameRandom.next() <= hitChance), so
// landing WELL under that threshold (not just under it) is a crit. Perception
// still matters for crit, but only indirectly — it's already folded into
// hitChance via the aim nudge, which widens the crit band along with the hit
// band. Replaces the old separate weaponCritChance + perceptionCritBonus
// roll, and with it, any per-weapon crit-chance override — crit is now purely
// a function of margin, not an item stat. Provisional divisor, tune later.
const CRIT_DIVISOR = 5;

// Every successful zombie attack (melee or Spitter's ranged spit) has a flat
// chance to transmit the zombie-virus infection — this is deliberately
// universal to all zombie types, not per-type data like bleedChance/sickChance,
// since it's meant to be an eventual inevitability of fighting zombies at all,
// not a special trait of any one archetype. Exported so AISystem.js's separate
// Spitter-ranged-attack path (spitAtPlayer) can reuse the same constant instead
// of hardcoding a second copy.
export const ZOMBIE_INFECTION_CHANCE = 0.1;

// Defense is a skill every entity capable of evading has (player, NPC), no AP
// cost — passive and free on every incoming attack, resolved as a single roll
// against a defense chance built the same way melee/ranged hit chance is
// (a flat base + skillLvl*0.01 + an attrMod nudge from Agility+Perception).
// There is no banked-AP dodge, no per-turn diminishing returns for repeat
// defenses — those existed solely to gate the old AP-spend model, which is
// gone. Zombies use a flat, per-type, non-growing value instead (see
// ZombieTypes.js `defense`) since they have no attributes/skill at all.
// Turrets/structures are Defenseless — a fixed target, like a door or
// window, resolved as a bare attacker-hit-chance check with no defender roll.
// Provisional base chance, tune from playtesting.
const BASE_DEFENSE_CHANCE = 0.15;

// Single shared home for combat dice-rolling math, used by every attacker type
// (player, NPC, zombie, turret).
export class CombatResolver {

  /**
   * Shared continuous attribute->bonus conversion (see module-level comment).
   * Positive above baseline, negative below it, never bucketed/stepped.
   */
  static attrMod(attr = 0, step = ATTR_MOD_STEP) {
    return ((attr || 0) - ATTR_MOD_BASELINE) * step;
  }

  /**
   * Mythras-style one-time skill seed: a combat skill starts pre-leveled from
   * the two attributes it's trained on (Melee←Str+Agi, Ranged/Defense←Agi+Per),
   * reusing the same BASELINE=20 convention as attrMod. Deliberately small
   * relative to earned progression — because getNextHitMilestone (12.5*2^level)
   * is steep, a realistic 80-point creation allocation caps out around a 0-6
   * level head start, nudging the starting line without substituting for the
   * grind. Reads narratively as natural aptitude, not trained competency.
   * Applied once at character creation, never re-derived from live attributes.
   */
  static seedLevel(attr1 = 0, attr2 = 0) {
    return Math.max(0, Math.floor((((attr1 || 0) - ATTR_MOD_BASELINE) + ((attr2 || 0) - ATTR_MOD_BASELINE)) / 10));
  }

  /**
   * Melee hit-chance nudge from Strength+Agility (averaged), and Ranged's from
   * Agility+Perception (averaged) — deliberately light so the trained melee/ranged
   * skill remains the dominant hit-chance lever, with the attributes a small innate
   * floor on top. `meleeAimBonus`/`perceptionAimBonus` names kept for call-site
   * continuity even though both are now two-attribute averages, not single-attribute.
   */
  static meleeAimBonus(currentStrength = 0, currentAgility = 0) {
    return (CombatResolver.attrMod(currentStrength) + CombatResolver.attrMod(currentAgility)) / 2;
  }

  static perceptionAimBonus(currentAgility = 0, currentPerception = 0) {
    return (CombatResolver.attrMod(currentAgility) + CombatResolver.attrMod(currentPerception)) / 2;
  }

  /** Defense's attribute nudge — same Agility+Perception average as Ranged's, since Defense shares that seed pair. */
  static defenseBonus(currentAgility = 0, currentPerception = 0) {
    return (CombatResolver.attrMod(currentAgility) + CombatResolver.attrMod(currentPerception)) / 2;
  }

  /** Strength's flat melee damage bonus, capped at +5. Provisional magnitude, tune later. */
  static strengthDamageBonus(currentStrength = 0) {
    return Math.min(5, Math.max(0, (currentStrength - ATTR_MOD_BASELINE) * 0.05));
  }

  /** Fraction (0-1) of an inflicted sickness duration that Constitution shrugs off, capped. */
  static sicknessResistFraction(currentConstitution = 0) {
    return Math.min(0.6, Math.max(0, CombatResolver.attrMod(currentConstitution) * 5));
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
   * Player/NPC total Defense chance: a flat base + defenseLvl*0.01 (same shape
   * as melee/ranged's skill-driven hit chance) + an Agility+Perception attrMod
   * nudge, minus an over-weight-armor penalty. Single source of truth for both
   * the actual combat roll (rollDefense) and UI previews (CharacterCreator/
   * PlayerSkillsUI) — nothing hardcodes this formula a second time.
   */
  static totalDefenseChance({ defenseLvl = 0, currentAgility = 0, currentPerception = 0, currentStrength = 0, weightRequirement = 0 } = {}) {
    const skillBonus = (defenseLvl || 0) * 0.01;
    const attrNudge = CombatResolver.defenseBonus(currentAgility, currentPerception);
    const armorPenalty = CombatResolver.armorWeightPenalty(currentStrength, weightRequirement) / 100;
    return Math.max(0, BASE_DEFENSE_CHANCE + skillBonus + attrNudge - armorPenalty);
  }

  /**
   * Player/NPC Defense roll, passive and free — no AP spent, no diminishing
   * returns for repeat defenses in a turn (those existed only to gate the old
   * banked-AP model). On a successful evade, records the defense against the
   * defender's own Defense skill/attribute progression — only reached when
   * the attacker's hit roll already succeeded (every caller gates this behind
   * `if (hit)`), so an attack that would have missed anyway never grants
   * Defense progress.
   */
  static rollDefense(defender) {
    if (!defender) return false;
    const defenseChance = CombatResolver.totalDefenseChance({
      defenseLvl: defender.defenseLvl,
      currentAgility: defender.currentAgility,
      currentPerception: defender.currentPerception,
      currentStrength: defender.currentStrength,
      weightRequirement: defender.weightRequirement
    });

    const evaded = gameRandom.next() < defenseChance;
    if (evaded && typeof defender.recordDefense === 'function') {
      defender.recordDefense();
    }
    return evaded;
  }

  /**
   * Resolves a defender's evasion: zombies roll their flat per-type `defense`
   * value (no growth, no attributes); player/NPC roll the skill-driven
   * Defense above; turrets/structures are Defenseless (a fixed target, like a
   * door or window) and never evade.
   */
  static resolveDefense({ defenderType, defenderSubtype, defender }) {
    if (defenderType === 'zombie') {
      const defense = getZombieType(defenderSubtype)?.defense || 0;
      return { evaded: defense > 0 && gameRandom.next() < defense };
    }
    if (defenderType === 'player' || defenderType === 'npc') {
      return { evaded: CombatResolver.rollDefense(defender) };
    }
    return { evaded: false };
  }

  /** Player melee attack roll. */
  static rollPlayerMelee({ weaponStats, skillLvl, drunkenness = 0, isWindowTarget, isStunRodActive, hasTargetEntity, currentStrength = 20, currentAgility = 20, currentPerception = 20, defenderType, defenderSubtype, defender }) {
    const accuracyBonus = (skillLvl - drunkenness) * 0.01;
    const attributeAim = CombatResolver.meleeAimBonus(currentStrength, currentAgility);
    const hitChance = BASE_MELEE_HIT_CHANCE + accuracyBonus + attributeAim;
    const roll = gameRandom.next();
    let hit = isWindowTarget ? true : roll <= hitChance;
    let isCrit = hit && roll <= hitChance / CRIT_DIVISOR;

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
    if (hit) {
      const { evaded } = CombatResolver.resolveDefense({ defenderType, defenderSubtype, defender });
      if (evaded) {
        dodged = true;
        hit = false;
        isCrit = false;
        damage = 0;
        extraDamageApplied = 0;
        stunDuration = 0;
      }
    }

    return { hit, isCrit, damage, extraDamageApplied, stunDuration, dodged };
  }

  /** Player ranged single-shot roll. */
  static rollPlayerRanged({ stats, skillLvl, drunkenness = 0, squaresAway, isWindowTarget, hasScope, hasLaserSight, currentAgility = 20, currentPerception = 20, defenderType, defenderSubtype, defender }) {
    const accuracyBonus = (skillLvl - drunkenness) * 0.01;
    const isSling = stats.isSling;

    // R20#5: guard the falloff/floor stats so a weapon whose rangedStats omit
    // them can't produce NaN hitChance (every shot silently misses past range).
    // Only the shotgun branch had a fallback; scope/laser/default did not.
    // `??` preserves a deliberate 0 (no falloff / can-miss-to-zero) per T1.
    const minAccuracy = stats.minAccuracy ?? 0.1;
    const accuracyFalloff = stats.accuracyFalloff ?? 0.2;

    let baseHitChance = 1.0;
    if (isSling) {
      baseHitChance = Math.max(0, 0.9 - (squaresAway - 2) * 0.1);
    } else if (stats.isShotgun) {
      baseHitChance = squaresAway <= (stats.accuracyMaxRange || 5) ? 1.0
        : Math.max(minAccuracy, 1.0 - (squaresAway - 5) * accuracyFalloff);
    } else if (hasScope) {
      baseHitChance = squaresAway <= 15 ? 1.0
        : Math.max(minAccuracy, 1.0 - (squaresAway - 15) * accuracyFalloff);
    } else if (hasLaserSight) {
      baseHitChance = squaresAway <= 10 ? 1.0
        : Math.max(minAccuracy, 1.0 - (squaresAway - 10) * accuracyFalloff);
    } else {
      baseHitChance = Math.max(minAccuracy, 1.0 - (squaresAway - 1) * accuracyFalloff);
    }

    const attributeAim = CombatResolver.perceptionAimBonus(currentAgility, currentPerception);
    const hitChance = baseHitChance + accuracyBonus + attributeAim;
    const roll = gameRandom.next();
    let hit = isWindowTarget ? true : roll <= hitChance;
    let isCrit = hit && roll <= hitChance / CRIT_DIVISOR;

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
    if (hit) {
      const { evaded } = CombatResolver.resolveDefense({ defenderType, defenderSubtype, defender });
      if (evaded) {
        dodged = true;
        hit = false;
        isCrit = false;
        damage = 0;
      }
    }

    return { hit, isCrit, damage, dodged };
  }

  /**
   * NPC melee/ranged roll. Hit chance is now additive (weapon base + a skill
   * modifier derived from combatSkill) so it has the same shape as the player's
   * formula — combatSkill plays the same role for NPCs that meleeLvl/rangedLvl
   * play for the player. combatSkill 0.5 (today's universal default) produces a
   * zero modifier, so existing NPC balance is unchanged until NPC types are
   * tuned with different combatSkill values.
   */
  static rollNpc({ isRanged, combatSkill, weaponDef, weapon, distance, currentStrength = 20, currentAgility = 20, currentPerception = 20, defenderType, defenderSubtype, defender }) {
    const skillModifier = (combatSkill - 0.5) * 0.5;

    let baseChance;
    if (isRanged) {
      const stats = weaponDef?.rangedStats || {};
      const falloff = stats.accuracyFalloff || 0.1;
      baseChance = Math.max(stats.minAccuracy || 0.1, 1.0 - (distance - 1) * falloff);
    } else {
      baseChance = BASE_MELEE_HIT_CHANCE;
    }

    const attributeAim = isRanged
      ? CombatResolver.perceptionAimBonus(currentAgility, currentPerception)
      : CombatResolver.meleeAimBonus(currentStrength, currentAgility);
    const hitChance = Math.max(0.2, Math.min(0.95, baseChance + skillModifier + attributeAim));
    const roll = gameRandom.next();
    let hit = roll < hitChance;
    let isCrit = hit && roll < hitChance / CRIT_DIVISOR;

    let damage = 0;
    let dodged = false;
    if (hit) {
      const damageRange = isRanged
        ? (weaponDef?.rangedStats?.damage || weapon?.rangedStats?.damage || { min: 2, max: 5 })
        : (weaponDef?.combat?.damage || weaponDef?.damage || weapon?.damage || { min: 1, max: 3 });
      damage = isCrit ? Math.floor(damageRange.max * 1.5) : gameRandom.nextInt(damageRange.min, damageRange.max);
      if (!isRanged) damage += CombatResolver.strengthDamageBonus(currentStrength);

      const { evaded } = CombatResolver.resolveDefense({ defenderType, defenderSubtype, defender });
      if (evaded) {
        dodged = true;
        hit = false;
        isCrit = false;
        damage = 0;
      }
    }

    return { hit, isCrit, damage, dodged };
  }

  /** Zombie melee roll. Attack accuracy stays a flat 50% — only the defender's evasion is new. */
  static rollZombie({ subtype, defenderType, defenderSubtype, defender }) {
    let hit = gameRandom.next() < 0.50;
    let damage = 0;
    let bleedingInflicted = false;
    let sickInflicted = false;
    let infectionInflicted = false;
    let dodged = false;

    if (hit) {
      const combat = getZombieType(subtype)?.combat || {};
      if (combat.damage && typeof combat.damage.min === 'number' && typeof combat.damage.max === 'number') {
        damage = gameRandom.nextInt(combat.damage.min, combat.damage.max);
      }
      if (combat.bleedChance && gameRandom.next() < combat.bleedChance) bleedingInflicted = true;
      if (combat.sickChance && gameRandom.next() < combat.sickChance) sickInflicted = true;
      if (gameRandom.next() < ZOMBIE_INFECTION_CHANCE) infectionInflicted = true;

      const { evaded } = CombatResolver.resolveDefense({ defenderType, defenderSubtype, defender });
      if (evaded) {
        dodged = true;
        hit = false;
        damage = 0;
        bleedingInflicted = false;
        sickInflicted = false;
        infectionInflicted = false;
      }
    }

    return { hit, damage, bleedingInflicted, sickInflicted, infectionInflicted, dodged };
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
    if (hit) {
      damage = isCrit
        ? Math.floor(turretStats.damage.max * 1.5)
        : gameRandom.nextInt(turretStats.damage.min, turretStats.damage.max);

      const { evaded } = CombatResolver.resolveDefense({ defenderType, defenderSubtype, defender });
      if (evaded) {
        dodged = true;
        hit = false;
        isCrit = false;
        damage = 0;
      }
    }

    return { hit, isCrit, damage, dodged };
  }
}
