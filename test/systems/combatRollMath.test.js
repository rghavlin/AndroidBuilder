import { describe, it, expect } from 'vitest';
import { CombatResolver, ZOMBIE_INFECTION_CHANCE } from '../../client/src/game/systems/CombatResolver.js';
import { gameRandom } from '../../client/src/game/utils/SeededRandom.js';

describe('CombatResolver Pure Math Unit Tests', () => {
  describe('Attribute Conversion Helpers', () => {
    it('attrMod returns 0 at baseline (20) and scales linearly', () => {
      expect(CombatResolver.attrMod(20)).toBe(0);
      expect(CombatResolver.attrMod(30)).toBeCloseTo(0.015);
      expect(CombatResolver.attrMod(10)).toBeCloseTo(-0.015);
      expect(CombatResolver.attrMod(0)).toBeCloseTo(-0.03);
      expect(CombatResolver.attrMod(undefined)).toBeCloseTo(-0.03);
    });

    it('seedLevel calculates starting skill level from attribute pair', () => {
      expect(CombatResolver.seedLevel(20, 20)).toBe(0);
      expect(CombatResolver.seedLevel(50, 50)).toBe(6);
      expect(CombatResolver.seedLevel(10, 10)).toBe(0); // clamped at 0
    });

    it('meleeAimBonus and perceptionAimBonus average two attribute nudges', () => {
      expect(CombatResolver.meleeAimBonus(20, 20)).toBe(0);
      expect(CombatResolver.meleeAimBonus(40, 20)).toBeCloseTo(0.015);

      expect(CombatResolver.perceptionAimBonus(20, 20)).toBe(0);
      expect(CombatResolver.perceptionAimBonus(20, 40)).toBeCloseTo(0.015);
    });

    it('strengthDamageBonus caps at +5', () => {
      expect(CombatResolver.strengthDamageBonus(20)).toBe(0);
      expect(CombatResolver.strengthDamageBonus(40)).toBe(1);
      expect(CombatResolver.strengthDamageBonus(200)).toBe(5); // capped
    });

    it('sicknessResistFraction caps at 0.6 and applySicknessResistance leaves at least 1 turn', () => {
      expect(CombatResolver.sicknessResistFraction(20)).toBe(0);
      expect(CombatResolver.sicknessResistFraction(100)).toBe(0.6); // capped

      expect(CombatResolver.applySicknessResistance(10, 20)).toBe(10);
      expect(CombatResolver.applySicknessResistance(10, 100)).toBe(4); // 10 * (1 - 0.6) = 4
      expect(CombatResolver.applySicknessResistance(1, 100)).toBe(1); // minimum 1
      expect(CombatResolver.applySicknessResistance(0, 100)).toBe(0);
    });

    it('armorWeightPenalty returns excess weight requirement over strength', () => {
      expect(CombatResolver.armorWeightPenalty(20, 15)).toBe(0);
      expect(CombatResolver.armorWeightPenalty(20, 30)).toBe(10);
    });
  });

  describe('Armor Absorption', () => {
    it('drains defender absorption pool 1:1 and returns unabsorbed damage', () => {
      const defender = { absorption: 10, maxAbsorption: 10, weightRequirement: 5 };
      const remainingDamage = CombatResolver.applyArmorAbsorption(defender, 6);

      expect(remainingDamage).toBe(0);
      expect(defender.absorption).toBe(4);
    });

    it('overflows damage when absorption pool is depleted', () => {
      const defender = { absorption: 10, maxAbsorption: 10, weightRequirement: 5 };
      const remainingDamage = CombatResolver.applyArmorAbsorption(defender, 15);

      expect(remainingDamage).toBe(5);
      expect(defender.absorption).toBe(0);
    });
  });

  describe('Melee Roll Calculations', () => {
    it('calculates player melee hit, crit, damage, and drunkenness bonus', () => {
      gameRandom.seed(1234);

      const weaponStats = { damage: { min: 4, max: 8 } };
      const result = CombatResolver.rollPlayerMelee({
        weaponStats,
        skillLvl: 10,
        drunkenness: 2,
        isWindowTarget: false,
        isStunRodActive: false,
        hasTargetEntity: true,
        currentStrength: 30,
        currentAgility: 20,
        defenderType: 'structure' // structure can't evade
      });

      expect(typeof result.hit).toBe('boolean');
      expect(typeof result.isCrit).toBe('boolean');
      expect(typeof result.damage).toBe('number');
      expect(Number.isNaN(result.damage)).toBe(false);
    });

    it('always hits window targets', () => {
      const weaponStats = { damage: { min: 2, max: 4 } };
      const result = CombatResolver.rollPlayerMelee({
        weaponStats,
        skillLvl: 0,
        isWindowTarget: true,
        defenderType: 'structure'
      });

      expect(result.hit).toBe(true);
    });
  });

  describe('Ranged Roll Calculations', () => {
    it('applies distance falloff and minAccuracy correctly', () => {
      gameRandom.seed(42);
      const stats = { damage: { min: 5, max: 10 }, accuracyFalloff: 0.1, minAccuracy: 0.2 };

      const closeResult = CombatResolver.rollPlayerRanged({
        stats,
        skillLvl: 0,
        squaresAway: 1,
        defenderType: 'structure'
      });

      const farResult = CombatResolver.rollPlayerRanged({
        stats,
        skillLvl: 0,
        squaresAway: 15,
        defenderType: 'structure'
      });

      expect(Number.isNaN(closeResult.damage)).toBe(false);
      expect(Number.isNaN(farResult.damage)).toBe(false);
    });

    it('handles scoped weapons up to 15 tile max accuracy range', () => {
      gameRandom.seed(100);
      const stats = { damage: { min: 10, max: 20 }, accuracyFalloff: 0.2, minAccuracy: 0.1 };

      const scopedResult = CombatResolver.rollPlayerRanged({
        stats,
        skillLvl: 0,
        squaresAway: 12,
        hasScope: true,
        defenderType: 'structure'
      });

      expect(scopedResult.hit).toBe(true);
    });
  });

  describe('Zombie Roll Calculations', () => {
    it('rolls zombie attack and checks for bleed, sick, and infection flags', () => {
      gameRandom.seed(999);

      const result = CombatResolver.rollZombie({
        subtype: 'standard',
        defenderType: 'structure'
      });

      expect(typeof result.hit).toBe('boolean');
      expect(typeof result.damage).toBe('number');
      expect(typeof result.bleedingInflicted).toBe('boolean');
      expect(typeof result.sickInflicted).toBe('boolean');
      expect(typeof result.infectionInflicted).toBe('boolean');
      expect(ZOMBIE_INFECTION_CHANCE).toBe(0.1);
    });
  });
});
