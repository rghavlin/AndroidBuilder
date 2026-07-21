import { describe, it, expect, beforeEach } from 'vitest';
import { Entity, EntityType } from '../../client/src/game/entities/Entity.js';
import { EntityFactory } from '../../client/src/game/EntityFactory.js';
import { FactionRegistry } from '../../client/src/game/ai/FactionRegistry.js';

// Entity.isHostile and Entity.attackOnSight are DERIVED from the entity's faction
// player-disposition (with optional per-entity overrides), replacing the old
// authored booleans. These tests pin the derivation + the legacy back-compat.

function npc(factionId) {
  const e = EntityFactory.createNPC(0, 0, factionId, 'survivor');
  return e;
}

describe('Entity faction-derived hostility', () => {
  beforeEach(() => {
    FactionRegistry.reset();
  });

  it('an extort-faction NPC reads hostile but not attack-on-sight', () => {
    const bandit = npc('bandits');
    expect(bandit.isHostile).toBe(true);
    expect(bandit.attackOnSight).toBe(false);
  });

  it('an independent NPC reads neither hostile nor attack-on-sight', () => {
    const ind = npc('independent');
    expect(ind.isHostile).toBe(false);
    expect(ind.attackOnSight).toBe(false);
  });

  it('an authored attackOnSight faction reads both true', () => {
    FactionRegistry.loadDefinitions({
      factions: [{ id: 'hunters', name: 'Hunters' }],
      factionStances: { hunters: { player: 'attackOnSight' } },
    });
    const hunter = npc('hunters');
    expect(hunter.isHostile).toBe(true);
    expect(hunter.attackOnSight).toBe(true);
  });

  it('resolves isHostileTo the player through the faction table', () => {
    const player = EntityFactory.createPlayer(1, 1);
    expect(npc('bandits').isHostileTo(player)).toBe(true);
    expect(npc('independent').isHostileTo(player)).toBe(false);
  });

  it('a per-entity attackOnSight override wins over a neutral faction', () => {
    const ind = npc('independent');
    ind.attackOnSight = true;
    expect(ind.attackOnSight).toBe(true);
    // isHostile is a separate override channel — still neutral until set.
    expect(ind.isHostile).toBe(false);
    ind.isHostile = true;
    expect(ind.isHostile).toBe(true);
  });

  it('legacy { isHostile: true } with no faction deserializes to bandits', () => {
    const e = Entity.fromJSON({ id: 'l1', type: 'npc', isHostile: true });
    expect(e.factionId).toBe('bandits');
    expect(e.isHostile).toBe(true);
  });

  it('legacy attackOnSight deserializes as a per-entity override', () => {
    const e = Entity.fromJSON({
      id: 'a1', type: 'npc', factionId: 'independent',
      components: { AIState: { attackOnSight: true } },
    });
    expect(e.attackOnSight).toBe(true);
    expect(e.isHostile).toBe(false);
  });

  it('serializes the hostility override, not the derived value', () => {
    const bandit = npc('bandits');
    const json = JSON.parse(JSON.stringify(bandit.toJSON()));
    // Faction drives hostility; no explicit override was set.
    expect(json._hostileToPlayerOverride).toBeNull();
    expect(json.factionId).toBe('bandits');
  });

  it('a turret item is hostile to a rival authored faction', () => {
    FactionRegistry.loadDefinitions({
      factions: [{ id: 'ironworks', name: 'Ironworks' }, { id: 'farmers', name: 'Farmers' }],
      factionStances: { ironworks: { farmers: 'hostile' } },
    });
    const turret = { getFaction: () => 'ironworks' };
    const farmer = npc('farmers');
    expect(FactionRegistry.isHostile(turret.getFaction(), farmer.getFaction())).toBe(true);
  });

  it('the attack-flip makes a second faction member read attack-on-sight', () => {
    FactionRegistry.loadDefinitions({
      factions: [{ id: 'farmers', name: 'Farmers' }],
      factionStances: { farmers: { player: 'neutral' } },
    });
    const a = npc('farmers');
    const b = npc('farmers');
    expect(a.attackOnSight).toBe(false);
    // Player attacks member `a` → whole faction flips.
    FactionRegistry.escalateToAttackOnSight('farmers');
    expect(a.attackOnSight).toBe(true);
    expect(b.attackOnSight).toBe(true); // previously-passive member now hunts
    expect(b.isHostile).toBe(true);
  });
});
