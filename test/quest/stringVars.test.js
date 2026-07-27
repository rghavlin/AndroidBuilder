import { describe, it, expect, beforeEach } from 'vitest';
// String-typed global variables (see eventTypes.ts VarType). QuestState is
// type-agnostic: a string var is stored/compared as a string, a number var
// behaves exactly as before. The declared type lives only in the map registry
// and drives seeding defaults + the editor's value widget.
import QuestState from '../../client/src/game/quest/QuestState.js';
import { evalCondition } from '../../client/src/game/quest/conditions.js';

describe('QuestState · string variables', () => {
  let qs;
  beforeEach(() => { qs = new QuestState(); });

  it('setVar keeps a string as-is and still coerces numbers', () => {
    qs.setVar('branch', 'north');
    expect(qs.getVar('branch')).toBe('north');
    qs.setVar('kills', 3);
    expect(qs.getVar('kills')).toBe(3);
    qs.setVar('kills', '7'); // numeric-looking string stays a string via setVar
    expect(qs.getVar('kills')).toBe('7');
  });

  it('seedFromRegistry defaults per declared type and honours initialValue', () => {
    qs.seedFromRegistry({
      flags: [],
      vars: [
        { name: 'playerName', type: 'string', initialValue: 'Ash' },
        { name: 'branch', type: 'string' },            // no initial → ''
        { name: 'rep', initialValue: 5 },              // legacy numeric
        { name: 'kills' },                             // number → 0
      ],
    });
    expect(qs.getVar('playerName')).toBe('Ash');
    expect(qs.getVar('branch')).toBe('');
    expect(qs.getVar('rep')).toBe(5);
    expect(qs.getVar('kills')).toBe(0);
  });

  it('does not clobber a var the player already changed', () => {
    qs.setVar('branch', 'south');
    qs.seedFromRegistry({ flags: [], vars: [{ name: 'branch', type: 'string', initialValue: 'north' }] });
    expect(qs.getVar('branch')).toBe('south');
  });

  it('var conditions compare strings with == / !=', () => {
    qs.setVar('branch', 'north');
    const ctx = { questState: qs };
    expect(evalCondition({ kind: 'var', var: 'branch', op: '==', value: 'north' }, ctx)).toBe(true);
    expect(evalCondition({ kind: 'var', var: 'branch', op: '==', value: 'south' }, ctx)).toBe(false);
    expect(evalCondition({ kind: 'var', var: 'branch', op: '!=', value: 'south' }, ctx)).toBe(true);
  });

  it('addVar stays numeric even if the current value is a stray string', () => {
    qs.setVar('rep', '10');   // stored as string
    qs.addVar('rep', 5);      // coerces both sides
    expect(qs.getVar('rep')).toBe(15);
  });

  it('survives a toJSON/fromJSON round-trip with mixed types', () => {
    qs.setVar('playerName', 'Ash');
    qs.setVar('kills', 4);
    const snap = JSON.parse(JSON.stringify(qs.toJSON()));
    const qs2 = new QuestState();
    qs2.fromJSON(snap);
    expect(qs2.getVar('playerName')).toBe('Ash');
    expect(qs2.getVar('kills')).toBe(4);
  });
});
