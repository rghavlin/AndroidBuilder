import { describe, it, expect } from 'vitest';
import { getTemplateForMapNumber, FIXED_TEMPLATE_ASSIGNMENTS, POST_MAP_7_CYCLE } from '../../client/src/game/config/TemplateConfig.js';

describe('Map Template Progression Order', () => {
  it('maps 1 through 7 follow the exact specified sequence', () => {
    expect(getTemplateForMapNumber(1)).toBe('branching_road');
    expect(getTemplateForMapNumber(2)).toBe('corridor');
    expect(getTemplateForMapNumber(3)).toBe('road');
    expect(getTemplateForMapNumber(4)).toBe('corridor');
    expect(getTemplateForMapNumber(5)).toBe('branching_road');
    expect(getTemplateForMapNumber(6)).toBe('corridor');
    expect(getTemplateForMapNumber(7)).toBe('lab');
  });

  it('post-map 7 follows the corridor -> straight road -> corridor -> branching road cycle indefinitely', () => {
    // Cycle 1 (Maps 8-11)
    expect(getTemplateForMapNumber(8)).toBe('corridor');
    expect(getTemplateForMapNumber(9)).toBe('road');
    expect(getTemplateForMapNumber(10)).toBe('corridor');
    expect(getTemplateForMapNumber(11)).toBe('branching_road');

    // Cycle 2 (Maps 12-15)
    expect(getTemplateForMapNumber(12)).toBe('corridor');
    expect(getTemplateForMapNumber(13)).toBe('road');
    expect(getTemplateForMapNumber(14)).toBe('corridor');
    expect(getTemplateForMapNumber(15)).toBe('branching_road');

    // Cycle 3 (Maps 16-19)
    expect(getTemplateForMapNumber(16)).toBe('corridor');
    expect(getTemplateForMapNumber(17)).toBe('road');
    expect(getTemplateForMapNumber(18)).toBe('corridor');
    expect(getTemplateForMapNumber(19)).toBe('branching_road');

    // Arbitrary future map (e.g. Map 100)
    // (100 - 8) % 4 = 92 % 4 = 0 -> 'corridor'
    expect(getTemplateForMapNumber(100)).toBe('corridor');
    // Map 101: 93 % 4 = 1 -> 'road'
    expect(getTemplateForMapNumber(101)).toBe('road');
    // Map 102: 94 % 4 = 2 -> 'corridor'
    expect(getTemplateForMapNumber(102)).toBe('corridor');
    // Map 103: 95 % 4 = 3 -> 'branching_road'
    expect(getTemplateForMapNumber(103)).toBe('branching_road');
  });

  it('honours devForceLab override for map 1', () => {
    expect(getTemplateForMapNumber(1, true)).toBe('lab');
  });
});
