import { describe, it, expect, beforeEach } from 'vitest';
import { FactionRegistry, builtinStanceValue } from '../../client/src/game/ai/FactionRegistry.js';

// FactionRegistry is a data-driven, directional stance table: built-in factions
// reproduce the historical hardcoded behavior, a loaded map merges authored
// factions/stances on top, and runtime mutations (setStance / the attack-flip)
// are captured as deltas so they persist across save/reload.

describe('FactionRegistry', () => {
  beforeEach(() => {
    FactionRegistry.reset();
  });

  it('keeps built-in stances after reset', () => {
    expect(FactionRegistry.isHostile('zombies', 'player')).toBe(true);
    expect(FactionRegistry.isHostile('zombies', 'town')).toBe(true);
    expect(FactionRegistry.isHostile('bandits', 'player')).toBe(true);
    expect(FactionRegistry.isHostile('independent', 'player')).toBe(false);
    expect(FactionRegistry.stance('town', 'town')).toBe('ally');
    expect(FactionRegistry.stance('independent', 'town')).toBe('neutral');
  });

  it('maps player dispositions to hostile/neutral stances', () => {
    expect(FactionRegistry.getPlayerDisposition('bandits')).toBe('extort');
    expect(FactionRegistry.getPlayerDisposition('independent')).toBe('neutral');
    expect(FactionRegistry.getPlayerDisposition('zombies')).toBe('attackOnSight');
    // extort + attackOnSight both read HOSTILE to isHostile().
    expect(FactionRegistry.isHostile('bandits', 'player')).toBe(true);
    expect(FactionRegistry.isHostile('zombies', 'player')).toBe(true);
  });

  it('merges authored factions and stances, idempotently', () => {
    const def = {
      factions: [{ id: 'ironworks', name: 'Ironworks' }, { id: 'farmers', name: 'Farmers' }],
      factionStances: {
        ironworks: { player: 'extort', farmers: 'hostile' },
        farmers: { ironworks: 'hostile', player: 'neutral' },
      },
    };
    FactionRegistry.loadDefinitions(def);
    FactionRegistry.loadDefinitions(def); // idempotent

    expect(FactionRegistry.listFactions().filter(f => f.id === 'ironworks')).toHaveLength(1);
    expect(FactionRegistry.isHostile('ironworks', 'player')).toBe(true);
    expect(FactionRegistry.getPlayerDisposition('ironworks')).toBe('extort');
    expect(FactionRegistry.isHostile('farmers', 'ironworks')).toBe(true);
    expect(FactionRegistry.isHostile('ironworks', 'farmers')).toBe(true);
    expect(FactionRegistry.isHostile('farmers', 'player')).toBe(false);
  });

  it('never lets authored data override a built-in faction definition', () => {
    FactionRegistry.loadDefinitions({ factions: [{ id: 'player', name: 'HACKED' }], factionStances: {} });
    expect(FactionRegistry.listFactions().find(f => f.id === 'player').name).toBe('Player');
  });

  it('setStance is directional', () => {
    FactionRegistry.loadDefinitions({ factions: [{ id: 'a', name: 'A' }, { id: 'b', name: 'B' }], factionStances: {} });
    FactionRegistry.setStance('a', 'b', 'hostile');
    expect(FactionRegistry.isHostile('a', 'b')).toBe(true);
    expect(FactionRegistry.isHostile('b', 'a')).toBe(false);
  });

  it('escalateToAttackOnSight flips a faction hostile and is idempotent', () => {
    FactionRegistry.loadDefinitions({ factions: [{ id: 'farmers', name: 'Farmers' }], factionStances: { farmers: { player: 'neutral' } } });
    expect(FactionRegistry.isHostile('farmers', 'player')).toBe(false);
    FactionRegistry.escalateToAttackOnSight('farmers');
    FactionRegistry.escalateToAttackOnSight('farmers');
    expect(FactionRegistry.getPlayerDisposition('farmers')).toBe('attackOnSight');
    expect(FactionRegistry.isHostile('farmers', 'player')).toBe(true);
    // never escalates the player faction itself
    FactionRegistry.escalateToAttackOnSight('player');
    expect(FactionRegistry.getPlayerDisposition('player')).toBe('neutral');
  });

  it('serializes ONLY runtime deltas and round-trips them in load order', () => {
    FactionRegistry.loadDefinitions({ factions: [{ id: 'farmers', name: 'Farmers' }], factionStances: { farmers: { player: 'neutral' } } });
    FactionRegistry.escalateToAttackOnSight('farmers');

    const json = FactionRegistry.toJSON();
    // Authored baseline (farmers->player neutral) is NOT a delta; only the flip is.
    expect(json.stanceDeltas).toEqual({ farmers: { player: 'attackOnSight' } });

    // Reset, re-apply the map's authored defs, THEN the save deltas: delta wins.
    FactionRegistry.reset();
    expect(FactionRegistry.getPlayerDisposition('farmers')).toBe('neutral');
    FactionRegistry.loadDefinitions({ factions: [{ id: 'farmers', name: 'Farmers' }], factionStances: { farmers: { player: 'neutral' } } });
    FactionRegistry.fromJSON(json);
    expect(FactionRegistry.getPlayerDisposition('farmers')).toBe('attackOnSight');
  });

  it('exposes built-in baseline values for the editor', () => {
    expect(builtinStanceValue('bandits', 'player')).toBe('extort');
    expect(builtinStanceValue('zombies', 'town')).toBe('hostile');
    expect(builtinStanceValue('town', 'town')).toBe('ally');
    expect(builtinStanceValue('independent', 'town')).toBeUndefined();
  });
});
