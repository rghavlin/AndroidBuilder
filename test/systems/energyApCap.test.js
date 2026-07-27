import { describe, it, expect } from 'vitest';
// Energy used to reach max AP only indirectly, through the survival cascade's blended
// three-need deficit, so a player at 0 energy could still act at nearly full tilt.
// applyEnergyApCap is the direct brake: max AP <= energy * 4, never below 3.
import {
  applyEnergyApCap,
  AP_PER_ENERGY,
  AP_ENERGY_FLOOR,
  previewDerivedStats,
  recalcCharacter
} from '../../client/src/game/utils/SurvivalCascade.js';
import { Entity } from '../../client/src/game/entities/Entity.js';

describe('applyEnergyApCap', () => {
  it('leaves max AP untouched while energy is plentiful', () => {
    expect(applyEnergyApCap(18, 25)).toBe(18);
    expect(applyEnergyApCap(18, 5)).toBe(18); // 5 * 4 = 20, still slack
  });

  it('caps at energy * AP_PER_ENERGY once energy drops below the attribute total', () => {
    expect(applyEnergyApCap(18, 4)).toBe(4 * AP_PER_ENERGY);
    expect(applyEnergyApCap(18, 2)).toBe(2 * AP_PER_ENERGY);
    expect(applyEnergyApCap(18, 1)).toBe(AP_PER_ENERGY);
  });

  it('never falls below the floor, even at zero or negative energy', () => {
    expect(applyEnergyApCap(18, 0)).toBe(AP_ENERGY_FLOOR);
    expect(applyEnergyApCap(18, -5)).toBe(AP_ENERGY_FLOOR);
  });

  it('is a ceiling only — it never raises an already-low max AP', () => {
    expect(applyEnergyApCap(2, 25)).toBe(2);
  });

  it('ignores absent energy (character-creation previews a rested character)', () => {
    expect(applyEnergyApCap(18, undefined)).toBe(18);
    expect(previewDerivedStats({ constitution: 20, agility: 20, perception: 20 }).maxAp)
      .toBe(previewDerivedStats({ constitution: 20, agility: 20, perception: 20, energy: 25 }).maxAp);
  });
});

describe('recalcCharacter — energy brake on the live player', () => {
  const makePlayer = (energy) => {
    const p = new Entity('p', 'player');
    p.maxNutrition = 25; p.nutrition = 25;
    p.maxHydration = 25; p.hydration = 25;
    p.maxEnergy = 25; p.energy = energy;
    p.baseStrength = 20; p.baseAgility = 20; p.basePerception = 20; p.baseConstitution = 20;
    return p;
  };

  it('collapses max AP as energy nears zero and holds the floor at zero', () => {
    const rested = makePlayer(25);
    recalcCharacter(rested);

    const tired = makePlayer(4);
    recalcCharacter(tired);

    const spent = makePlayer(0);
    recalcCharacter(spent);

    expect(tired.maxAp).toBeLessThan(rested.maxAp);
    expect(tired.maxAp).toBe(4 * AP_PER_ENERGY);
    expect(spent.maxAp).toBe(AP_ENERGY_FLOOR);
    expect(spent.ap).toBeLessThanOrEqual(AP_ENERGY_FLOOR);
  });
});
