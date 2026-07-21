/**
 * FactionRegistry - Central, directional stance table for AI hostility.
 *
 * Stances are DIRECTIONAL: stance(A, B) is "how A regards B" and may differ from
 * stance(B, A). This matters for cases like turrets vs zombies, where a turret is
 * HOSTILE toward zombies (it shoots them) but a zombie IGNORES turrets (NEUTRAL),
 * so zombies never retaliate.
 *
 * The table is now DATA-DRIVEN. Built-in factions/stances below reproduce the
 * historical hardcoded behavior, and a map's authored factions/stances are merged
 * on top via loadDefinitions() at map load. Runtime mutations (the setFactionStance
 * event step, and the "player attacked a faction member" escalation) go through
 * setStance()/escalateToAttackOnSight() and are captured as deltas by toJSON() so
 * they survive save/reload.
 *
 * PLAYER DISPOSITION: a faction's stance toward the built-in `player` faction is a
 * three-way disposition rather than a plain stance:
 *   'neutral'       -> stance NEUTRAL (ignores the player)
 *   'extort'        -> stance HOSTILE, demand-first behavior
 *   'attackOnSight' -> stance HOSTILE, hunt-to-the-death behavior
 * `extort`/`attackOnSight` both read as HOSTILE for isHostile()/targeting; the mode
 * only changes NPC behavior (see Entity.isHostile / Entity.attackOnSight getters and
 * getPlayerDisposition() below).
 *
 * Per-entity runtime escalation (a specific entity or entity id going hostile) is
 * layered on top via Entity.hostileOverrides and consulted by Entity.isHostileTo()
 * — NOT stored here. This table is the static, group-level baseline plus its
 * faction-wide runtime deltas.
 */

export const STANCE = {
  ALLY: 'ally',
  NEUTRAL: 'neutral',
  HOSTILE: 'hostile'
};

// Player-directed disposition values (the special `-> player` column).
export const DISPOSITION = {
  NEUTRAL: 'neutral',
  EXTORT: 'extort',
  ATTACK_ON_SIGHT: 'attackOnSight'
};
const DISPOSITIONS = new Set(Object.values(DISPOSITION));

// Convenience ids for engine code that references factions by name.
export const FACTIONS = {
  PLAYER: 'player',
  ZOMBIES: 'zombies',
  SURVIVORS: 'survivors',   // legacy generic NPCs (friendly by default)
  INDEPENDENT: 'independent', // default for peaceful wandering NPCs
  BANDITS: 'bandits',       // default for hostile NPCs (extort-first)
  TOWN: 'town',             // shopkeeper + their defensive turrets
  WILDLIFE: 'wildlife',     // rabbits, animals
  NEUTRAL: 'neutral'        // fallback for unaffiliated entities/items
};

const H = STANCE.HOSTILE;

// Built-in factions — always present, never removable. Authored factions are
// merged on top of these. Exported so the map editor can list them alongside
// authored factions without depending on mutable runtime state.
export const BUILTIN_FACTIONS = [
  { id: 'player', name: 'Player', builtin: true },
  { id: 'independent', name: 'Independent', builtin: true },
  { id: 'bandits', name: 'Bandits', builtin: true },
  { id: 'zombies', name: 'Zombies', builtin: true },
  { id: 'wildlife', name: 'Wildlife', builtin: true },
  { id: 'survivors', name: 'Survivors', builtin: true },
  { id: 'town', name: 'Town', builtin: true },
  { id: 'neutral', name: 'Neutral', builtin: true }
];

// Built-in directional stances: BUILTIN_STANCES[from][to]. Any pair not listed
// defaults to NEUTRAL (see stance()); same-faction defaults to ALLY. The `player`
// column holds a disposition string (see DISPOSITION); everything else is a STANCE.
const BUILTIN_STANCES = {
  zombies: {
    player: DISPOSITION.ATTACK_ON_SIGHT, // zombies hunt the player on sight
    survivors: H,
    independent: H,
    bandits: H,
    town: H
    // wildlife + turrets/neutral intentionally NEUTRAL: zombies never attack turrets.
  },
  player: {
    zombies: H
    // Player targeting is manual (clicks), not AI-driven — for completeness.
  },
  town: {
    zombies: H
    // town -> player stays neutral here; escalation is runtime via the attack flip.
  },
  bandits: {
    player: DISPOSITION.EXTORT, // approach, DEMAND, then fight on refusal
    zombies: H
  },
  independent: {
    zombies: H
    // independent -> player stays neutral (default).
  },
  survivors: {
    zombies: H
  }
};

/**
 * Raw built-in table value for a directional pair, ignoring authored/runtime
 * deltas. Returns a STANCE, a DISPOSITION (player column), or undefined when the
 * pair is unset. Pure — used by the map editor to show the baseline a map's
 * authored deltas sit on top of.
 */
export function builtinStanceValue(from, to) {
  if (!from || !to) return undefined;
  if (from === to) return STANCE.ALLY;
  return BUILTIN_STANCES[from]?.[to];
}

// ─── Mutable runtime state ─────────────────────────────────────────────────
// factions: id -> FactionDef. stances: from -> { to -> stance|disposition }.
// deltaKeys: "from>to" pairs mutated at runtime (setStance/escalate), so toJSON
// serializes ONLY runtime changes (not the authored/builtin baseline).
let factions = new Map();
let stances = {};
let deltaKeys = new Set();

function cloneStances(src) {
  const out = {};
  for (const from of Object.keys(src)) out[from] = { ...src[from] };
  return out;
}

function resetToBuiltins() {
  factions = new Map(BUILTIN_FACTIONS.map(f => [f.id, { ...f }]));
  stances = cloneStances(BUILTIN_STANCES);
  deltaKeys = new Set();
}
resetToBuiltins();

const isDev = typeof import.meta !== 'undefined' && import.meta.env
  ? import.meta.env.DEV
  : (typeof process !== 'undefined' && process.env?.NODE_ENV === 'development');

function warnUnknown(role, id) {
  if (isDev && id && !factions.has(id)) {
    console.warn(`[FactionRegistry] Unrecognized '${role}' faction ID: "${id}"`);
  }
}

// Normalize a raw table value into a plain STANCE for stance(): the player column
// stores dispositions, which collapse to HOSTILE (extort/attackOnSight) or NEUTRAL.
function toStance(value, to) {
  if (to === 'player' && DISPOSITIONS.has(value)) {
    return value === DISPOSITION.NEUTRAL ? STANCE.NEUTRAL : STANCE.HOSTILE;
  }
  return value;
}

export const FactionRegistry = {
  STANCE,
  DISPOSITION,

  /**
   * How `from` faction regards `to` faction.
   * @returns {'ally'|'neutral'|'hostile'}
   */
  stance(from, to) {
    warnUnknown('from', from);
    warnUnknown('to', to);
    if (!from || !to) return STANCE.NEUTRAL;
    if (from === to) return STANCE.ALLY;
    const raw = stances[from]?.[to];
    if (raw === undefined) return STANCE.NEUTRAL;
    return toStance(raw, to);
  },

  isHostile(from, to) {
    return this.stance(from, to) === STANCE.HOSTILE;
  },

  isAlly(from, to) {
    return this.stance(from, to) === STANCE.ALLY;
  },

  /**
   * A faction's behavioral disposition toward the player.
   * @returns {'neutral'|'extort'|'attackOnSight'}
   */
  getPlayerDisposition(factionId) {
    if (!factionId) return DISPOSITION.NEUTRAL;
    const raw = stances[factionId]?.player;
    if (DISPOSITIONS.has(raw)) return raw;
    // A non-disposition HOSTILE value (shouldn't normally occur for the player
    // column) still implies extort-first behavior; anything else is neutral.
    return raw === STANCE.HOSTILE ? DISPOSITION.EXTORT : DISPOSITION.NEUTRAL;
  },

  /**
   * Merge authored map definitions over the built-in baseline. Idempotent — safe
   * to call on every map load. Does NOT clear runtime deltas; call reset() first
   * on a new game/load if a clean baseline is required.
   * @param {{factions?: Array, factionStances?: Object}} def
   */
  loadDefinitions(def) {
    if (!def) return;
    for (const f of def.factions || []) {
      if (!f || !f.id) continue;
      if (factions.get(f.id)?.builtin) continue; // never override a builtin def
      factions.set(f.id, { id: f.id, name: f.name || f.id, description: f.description });
    }
    const authored = def.factionStances || {};
    for (const from of Object.keys(authored)) {
      for (const to of Object.keys(authored[from] || {})) {
        const value = authored[from][to];
        if (value == null) continue;
        if (!stances[from]) stances[from] = {};
        stances[from][to] = value;
      }
    }
  },

  /** Restore the built-in baseline, discarding authored data and runtime deltas. */
  reset() {
    resetToBuiltins();
  },

  /**
   * Runtime stance mutation (setFactionStance event step, attack-flip). When
   * `to === 'player'`, `value` may be a disposition (neutral/extort/attackOnSight).
   * Recorded as a delta so it persists in saves.
   */
  setStance(from, to, value) {
    if (!from || !to || !value) return;
    if (!stances[from]) stances[from] = {};
    stances[from][to] = value;
    deltaKeys.add(`${from}>${to}`);
  },

  /**
   * Flip a faction's player disposition to attackOnSight — the "player attacked a
   * member" escalation. Idempotent.
   */
  escalateToAttackOnSight(factionId) {
    if (!factionId || factionId === 'player') return;
    if (this.getPlayerDisposition(factionId) === DISPOSITION.ATTACK_ON_SIGHT) return;
    this.setStance(factionId, 'player', DISPOSITION.ATTACK_ON_SIGHT);
  },

  /** All known factions (builtin + authored), as FactionDef objects. */
  listFactions() {
    return Array.from(factions.values());
  },

  /** Serialize ONLY runtime deltas (not the authored/builtin baseline). */
  toJSON() {
    const out = {};
    for (const key of deltaKeys) {
      const [from, to] = key.split('>');
      const value = stances[from]?.[to];
      if (value === undefined) continue;
      if (!out[from]) out[from] = {};
      out[from][to] = value;
    }
    return { stanceDeltas: out };
  },

  /** Restore runtime deltas from a save. Call AFTER loadDefinitions(map data). */
  fromJSON(data) {
    if (!data || !data.stanceDeltas) return;
    for (const from of Object.keys(data.stanceDeltas)) {
      for (const to of Object.keys(data.stanceDeltas[from] || {})) {
        this.setStance(from, to, data.stanceDeltas[from][to]);
      }
    }
  }
};
