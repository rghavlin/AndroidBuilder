// Balance simulator core — runs scripted combat scenarios headless over many
// seeds and aggregates outcomes. Built on GameHarness. See TESTING_STRATEGY_PLAN.md
// Phase 3. Importable (used by balance.mjs CLI and balance.test.js).
//
// A scenario pits a configured player against a group of zombies in an arena.
// The player follows a fixed greedy policy (shoot > melee > close in), so the
// numbers reflect weapon/enemy tuning rather than random play. Everything is
// deterministic per seed.

import { GameHarness } from '../harness/GameHarness.js';
import { SeededRandom } from '../../client/src/game/utils/SeededRandom.js';
import { deriveSecondaryStats } from '../../client/src/game/utils/SurvivalCascade.js';

// Configure the player's skills, attributes, and vitals for a scenario.
// Attributes are the faithful lever: they derive maxHp (from Constitution) and
// maxAp (from Agility + Perception) via the SAME formula the game uses
// (deriveSecondaryStats), and also feed the combat rolls (Str/Agi/Per). Direct
// maxHp/maxAp overrides are applied last for ad-hoc "what if HP were N" tests.
function configurePlayerVitals(player, cfg) {
  if (cfg.rangedLvl != null) player.rangedLvl = cfg.rangedLvl;
  if (cfg.meleeLvl != null) player.meleeLvl = cfg.meleeLvl;

  const a = cfg.attributes;
  if (a) {
    const setAttr = (base, cur, v) => { if (v != null) { player[base] = v; player[cur] = v; } };
    setAttr('baseConstitution', 'currentConstitution', a.constitution);
    setAttr('baseAgility', 'currentAgility', a.agility);
    setAttr('basePerception', 'currentPerception', a.perception);
    setAttr('baseStrength', 'currentStrength', a.strength);
    deriveSecondaryStats(player); // maxHp/maxAp from the attributes, exactly like gameplay
    player.hp = player.maxHp;
    player.ap = player.maxAp;
  }

  // Explicit HP/AP overrides win over attribute derivation.
  if (cfg.maxHp != null) { player.maxHp = cfg.maxHp; player.hp = cfg.maxHp; }
  if (cfg.maxAp != null) { player.maxAp = cfg.maxAp; player.ap = cfg.maxAp; }
}

const sign = (n) => (n > 0 ? 1 : n < 0 ? -1 : 0);

function livingZombies(h) {
  const out = [];
  for (const e of h.gameMap.entityMap.values()) {
    if (e.type === 'zombie' && e.hp > 0) out.push(e);
  }
  return out;
}

function nearest(from, entities) {
  let best = null;
  let bestD = Infinity;
  for (const e of entities) {
    const p = GameHarness.pos(e);
    const d = Math.max(Math.abs(p.x - from.x), Math.abs(p.y - from.y));
    if (d < bestD) { bestD = d; best = e; }
  }
  return best ? { entity: best, dist: bestD } : null;
}

/**
 * One greedy player turn: act until AP runs out or nothing useful remains.
 * Returns per-turn deltas { damageDealt, shots, swings }.
 */
function playerTurn(h) {
  const player = h.player;
  let damageDealt = 0;
  let shots = 0;
  let swings = 0;
  let guard = 0;

  while ((player.ap ?? 0) >= 1 && guard < 60) {
    guard++;
    const zs = livingZombies(h);
    if (zs.length === 0) break;

    const p = GameHarness.pos(player);
    const near = nearest(p, zs);
    const target = near.entity;

    const weapon = h.getRangedWeapon();
    const ammo = weapon ? h._weaponAmmo(weapon) : null;

    // Reload if the gun is dry but ammo is available.
    if (weapon && (!ammo || ammo.rounds <= 0) && h._findAmmoFor(weapon)) {
      const r = h.applyPlayerAction({ type: 'reload' });
      if (!r.ok) break;
      continue;
    }

    // Shoot if we have a loaded gun and line of sight.
    if (weapon && ammo && ammo.rounds > 0) {
      const shot = h.applyPlayerAction({ type: 'shoot', targetId: target.id });
      if (shot.ok) {
        shots++;
        if (shot.hit) damageDealt += shot.damage || 0;
        continue;
      }
      // fall through if the shot was rejected (e.g. no LOS)
    }

    // Melee if adjacent.
    if (near.dist === 1) {
      const m = h.applyPlayerAction({ type: 'attack', targetId: target.id });
      if (m.ok) {
        swings++;
        if (m.hit) damageDealt += m.damage || 0;
        continue;
      }
    }

    // Otherwise step toward the nearest zombie (try diagonal, then axis-aligned).
    const t = GameHarness.pos(target);
    const dx = sign(t.x - p.x);
    const dy = sign(t.y - p.y);
    const moves = [{ dx, dy }, { dx, dy: 0 }, { dx: 0, dy }].filter((m) => m.dx || m.dy);
    let moved = false;
    for (const m of moves) {
      if (h.applyPlayerAction({ type: 'move', ...m }).ok) { moved = true; break; }
    }
    if (!moved) break; // boxed in — end the turn
  }

  return { damageDealt, shots, swings };
}

/**
 * Run one scenario at one seed.
 * @returns {object} outcome + metrics
 */
export function runScenario(scenario, seed) {
  const {
    arena = { width: 25, height: 25 },
    player: playerCfg = {},
    zombies: zCfg = { count: 6, subtype: 'standard', spread: 8 },
    turnCap = 100,
  } = scenario;

  const h = new GameHarness({ seed, width: arena.width, height: arena.height }).bootstrap();
  const player = h.player;

  // Configure the player (skills, attributes -> derived HP/AP, direct overrides).
  configurePlayerVitals(player, playerCfg);
  const maxHp = player.maxHp;
  const maxAp = player.maxAp;

  let weapon = null;
  if (playerCfg.weapon) {
    if (playerCfg.backpack !== false) h.equipItemDef('backpack.standard');
    weapon = h.equipItemDef(playerCfg.weapon);
    if (weapon && playerCfg.ammo) {
      h.loadWeaponAmmo(weapon, playerCfg.ammo.defId, Math.min(playerCfg.ammo.count, 20));
      // Stash spare ammo in inventory so the reload policy can refill.
      const spare = playerCfg.ammo.count - Math.min(playerCfg.ammo.count, 20);
      if (spare > 0) h.giveItemDef(playerCfg.ammo.defId, { stackCount: spare });
    }
  }

  // Spawn zombies deterministically around the player.
  const spawnRng = new SeededRandom((seed ^ 0x85ebca6b) >>> 0);
  const p0 = GameHarness.pos(player);
  const spread = zCfg.spread ?? 8;
  const initialCount = zCfg.count;
  for (let i = 0; i < initialCount; i++) {
    let x;
    let y;
    let tries = 0;
    do {
      x = Math.max(0, Math.min(arena.width - 1, p0.x + spawnRng.nextInt(-spread, spread)));
      y = Math.max(0, Math.min(arena.height - 1, p0.y + spawnRng.nextInt(-spread, spread)));
      tries++;
    } while ((x === p0.x && y === p0.y) && tries < 20);
    h.spawnZombie(x, y, zCfg.subtype || 'standard', `bz-${i}`);
  }

  const hpStart = player.hp;
  let turns = 0;
  let damageDealt = 0;
  let shots = 0;
  let swings = 0;

  while (turns < turnCap) {
    if (player.hp <= 0) break;
    if (livingZombies(h).length === 0) break;

    const d = playerTurn(h);
    damageDealt += d.damageDealt;
    shots += d.shots;
    swings += d.swings;

    if (livingZombies(h).length === 0) break; // cleared before enemies act
    h.endTurn();
    turns++;
  }

  const remaining = livingZombies(h).length;
  const alive = player.hp > 0;
  let outcome;
  if (!alive) outcome = 'loss';
  else if (remaining === 0) outcome = 'win';
  else outcome = 'timeout';

  return {
    seed,
    outcome,
    turns,
    maxHp,
    maxAp,
    kills: initialCount - remaining,
    zombiesRemaining: remaining,
    hpStart,
    hpEnd: Math.max(0, player.hp),
    damageTaken: Math.max(0, hpStart - player.hp),
    damageDealt,
    shots,
    swings,
  };
}

function pct(n, total) {
  return total ? +(100 * n / total).toFixed(1) : 0;
}

function avg(nums) {
  return nums.length ? +(nums.reduce((a, b) => a + b, 0) / nums.length).toFixed(2) : 0;
}

/**
 * Run a scenario across many seeds and aggregate.
 * @param {object} scenario
 * @param {object} opts { runs, startSeed, onResult }
 */
export function runBalance(scenario, { runs = 1000, startSeed = 1, onResult = null } = {}) {
  const results = [];
  for (let i = 0; i < runs; i++) {
    const r = runScenario(scenario, startSeed + i);
    results.push(r);
    if (onResult) onResult(r);
  }

  const wins = results.filter((r) => r.outcome === 'win');
  const losses = results.filter((r) => r.outcome === 'loss');
  const timeouts = results.filter((r) => r.outcome === 'timeout');

  return {
    scenario: scenario.name || 'unnamed',
    runs,
    maxHp: results[0]?.maxHp,
    maxAp: results[0]?.maxAp,
    winRate: pct(wins.length, runs),
    lossRate: pct(losses.length, runs),
    timeoutRate: pct(timeouts.length, runs),
    avgTurns: avg(results.map((r) => r.turns)),
    avgTurnsToWin: avg(wins.map((r) => r.turns)),
    avgKills: avg(results.map((r) => r.kills)),
    avgHpEndOnWin: avg(wins.map((r) => r.hpEnd)),
    avgDamageDealt: avg(results.map((r) => r.damageDealt)),
    avgDamageTaken: avg(results.map((r) => r.damageTaken)),
    avgShots: avg(results.map((r) => r.shots)),
    avgSwings: avg(results.map((r) => r.swings)),
    results,
  };
}

/** Deep-ish clone so a sweep step doesn't mutate the shared scenario. */
function cloneScenario(s) {
  return {
    ...s,
    arena: { ...s.arena },
    player: { ...s.player, attributes: { ...(s.player?.attributes || {}) } },
    zombies: { ...s.zombies },
  };
}

const ATTR_KNOBS = new Set(['constitution', 'agility', 'perception', 'strength']);

/** Apply a swept knob value to a (cloned) scenario. */
function applyKnob(scenario, knob, value) {
  if (ATTR_KNOBS.has(knob)) {
    scenario.player.attributes = { ...(scenario.player.attributes || {}), [knob]: value };
  } else if (knob === 'maxHp' || knob === 'maxAp') {
    scenario.player[knob] = value;
  } else if (knob === 'zombies') {
    scenario.zombies.count = value;
  } else {
    throw new Error(`unknown sweep knob: ${knob} (use constitution|agility|perception|strength|maxHp|maxAp|zombies)`);
  }
}

/**
 * Sweep one knob across [from, to] by step, running a batch at each value.
 * Returns a compact row per value for a win-rate / survivability curve.
 * @returns {Array<{value:number, maxHp:number, maxAp:number, winRate:number, ...}>}
 */
export function runSweep(scenario, { knob, from, to, step = 1, runs = 200, startSeed = 1 }) {
  const rows = [];
  for (let v = from; v <= to; v += step) {
    const sc = cloneScenario(scenario);
    applyKnob(sc, knob, v);
    const s = runBalance(sc, { runs, startSeed });
    rows.push({
      value: v,
      maxHp: s.maxHp,
      maxAp: s.maxAp,
      winRate: s.winRate,
      lossRate: s.lossRate,
      timeoutRate: s.timeoutRate,
      avgTurns: s.avgTurns,
      avgDamageTaken: s.avgDamageTaken,
      avgHpEndOnWin: s.avgHpEndOnWin,
    });
  }
  return rows;
}
