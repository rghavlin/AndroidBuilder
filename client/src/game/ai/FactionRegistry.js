/**
 * FactionRegistry - Central, directional stance table for AI hostility.
 *
 * Stances are DIRECTIONAL: stance(A, B) is "how A regards B" and may differ from
 * stance(B, A). This matters for cases like turrets vs zombies, where a turret is
 * HOSTILE toward zombies (it shoots them) but a zombie IGNORES turrets (NEUTRAL),
 * so zombies never retaliate.
 *
 * Per-entity runtime escalation (e.g. a town becoming hostile to the player after
 * the player attacks the shopkeeper) is layered on top via Entity.hostileOverrides
 * and is consulted by Entity.isHostileTo() — NOT stored here. This table is the
 * static, group-level baseline.
 *
 * Phase 1: stances are configured so the only entries exercised by current AI
 * wiring (zombies->player HOSTILE, survivors->player NEUTRAL) reproduce existing
 * behavior exactly. Other entries describe the intended end-state and become
 * active only as later phases route more candidates through AITargeting.
 */

export const FACTIONS = {
  PLAYER: 'player',
  ZOMBIES: 'zombies',
  SURVIVORS: 'survivors', // generic NPCs (friendly by default)
  TOWN: 'town',           // shopkeeper + their defensive turrets
  WILDLIFE: 'wildlife',   // rabbits, animals
  NEUTRAL: 'neutral'      // fallback for unaffiliated entities/items
};

export const STANCE = {
  ALLY: 'ally',
  NEUTRAL: 'neutral',
  HOSTILE: 'hostile'
};

const H = STANCE.HOSTILE;
const N = STANCE.NEUTRAL;

// Directional stance table: STANCES[from][to]. Any pair not listed defaults to
// NEUTRAL (see stance()). Same-faction defaults to ALLY (see stance()).
const STANCES = {
  [FACTIONS.ZOMBIES]: {
    [FACTIONS.PLAYER]: H,
    [FACTIONS.SURVIVORS]: H,
    [FACTIONS.TOWN]: H,
    // wildlife + turrets/neutral intentionally NEUTRAL: zombies never attack turrets.
  },
  [FACTIONS.PLAYER]: {
    [FACTIONS.ZOMBIES]: H,
    // Player targeting is manual (clicks), not AI-driven — these are for completeness.
  },
  [FACTIONS.TOWN]: {
    [FACTIONS.ZOMBIES]: H,
    // TOWN -> PLAYER stays NEUTRAL here; escalation is per-entity via hostileOverrides.
  },
  // SURVIVORS default to NEUTRAL toward everyone at the group level. Individual
  // hostile NPCs are handled per-entity (legacy isHostile / hostileOverrides).
};

const VALID_FACTIONS = new Set(Object.values(FACTIONS));
const isDev = typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env.DEV : (typeof process !== 'undefined' && process.env?.NODE_ENV === 'development');

export const FactionRegistry = {
  /**
   * How `from` faction regards `to` faction.
   * @returns {'ally'|'neutral'|'hostile'}
   */
  stance(from, to) {
    if (isDev) {
      if (from && !VALID_FACTIONS.has(from)) {
        console.warn(`[FactionRegistry] Unrecognized 'from' faction ID: "${from}"`);
      }
      if (to && !VALID_FACTIONS.has(to)) {
        console.warn(`[FactionRegistry] Unrecognized 'to' faction ID: "${to}"`);
      }
    }
    if (!from || !to) return STANCE.NEUTRAL;
    if (from === to) return STANCE.ALLY;
    return STANCES[from]?.[to] ?? STANCE.NEUTRAL;
  },

  isHostile(from, to) {
    return this.stance(from, to) === STANCE.HOSTILE;
  },

  isAlly(from, to) {
    return this.stance(from, to) === STANCE.ALLY;
  }
};
