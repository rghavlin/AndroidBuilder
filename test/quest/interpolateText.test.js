import { describe, it, expect, beforeEach } from 'vitest';
// [name] token interpolation for dialog/speech copy (see interpolate.js).
import { interpolateText } from '../../client/src/game/quest/interpolate.js';
import QuestState from '../../client/src/game/quest/QuestState.js';

describe('interpolateText', () => {
  let qs;
  beforeEach(() => {
    qs = new QuestState();
    qs.setVar('playerName', 'Ash');
    qs.setVar('kills', 3);
    qs.setFlag('metMayor', true);
  });

  it('substitutes a string variable', () => {
    expect(interpolateText('How are you today, [playerName]?', qs)).toBe('How are you today, Ash?');
  });

  it('stringifies numbers and flags', () => {
    expect(interpolateText('You have [kills] kills.', qs)).toBe('You have 3 kills.');
    expect(interpolateText('Met mayor: [metMayor]', qs)).toBe('Met mayor: true');
  });

  it('handles multiple tokens and ignores surrounding whitespace in brackets', () => {
    expect(interpolateText('[playerName] has [ kills ] kills', qs)).toBe('Ash has 3 kills');
  });

  it('leaves unknown tokens untouched so typos are visible', () => {
    expect(interpolateText('Hi [notAVar]!', qs)).toBe('Hi [notAVar]!');
  });

  it('is a no-op for text without tokens, or missing text/questState', () => {
    expect(interpolateText('plain text', qs)).toBe('plain text');
    expect(interpolateText(undefined, qs)).toBe(undefined);
    expect(interpolateText('[playerName]', null)).toBe('[playerName]');
  });

  it('reflects the current value at call time', () => {
    const line = 'Name: [playerName]';
    expect(interpolateText(line, qs)).toBe('Name: Ash');
    qs.setVar('playerName', 'Nova');
    expect(interpolateText(line, qs)).toBe('Name: Nova');
  });
});
