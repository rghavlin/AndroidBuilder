// GameHarness — headless driver for the game's simulation core.
//
// This is the shared foundation for Phase 2 (fuzz / random-walker bot) and
// Phase 3 (balance simulator). See TESTING_STRATEGY_PLAN.md.
//
// It bootstraps the `engine` singleton against a minimal generated map, lets a
// script drive the player through the SAME systems the UI uses, and steps the
// world a turn at a time — all deterministically from a seed.
//
// CONCURRENCY: the harness drives PROCESS-GLOBAL singletons (the `engine`
// instance and the `gameRandom` PRNG). Only ONE harness may be live at a time —
// bootstrap() re-seeds gameRandom and resets the engine. Run scenarios
// sequentially to completion; never interleave two live harnesses (their RNG
// streams would cross). Determinism holds per sequential run from a given seed.
//
// Fidelity notes (where the adapter mirrors real UI code):
//   - move   -> MovementSystem.resolve (the exact mover the AI uses;
//               validates via gameMap.moveEntity and deducts Movable.apCost)
//   - attack -> CombatResolver.rollPlayerMelee + applyArmorAbsorption +
//               target.takeDamage + player.useAP(1), mirroring
//               CombatContext.performMeleeAttack's core (minus stun-rod, acid,
//               skill progression, UI events/logs).
//   - endTurn -> SimulationManager.runTurn (authoritative enemy/AI turn) plus a
//               distilled version of GameContext.simulateTurn's player upkeep.
//
// KNOWN SIMPLIFICATIONS (intentional for v1, tracked for follow-up):
//   - reload and ranged/thrown attacks are not implemented yet (see applyPlayerAction).
//   - endTurn upkeep is distilled: it does NOT run the full survival/infection
//     cascade; it refills AP with the same injury penalty the game uses.
//   The right long-term fix is to extract GameContext.simulateTurn's pure core
//   into a shared module both the UI and this harness call.

import { gameRandom } from '../../client/src/game/utils/SeededRandom.js';
import { GameMap } from '../../client/src/game/map/GameMap.js';
import { EntityFactory } from '../../client/src/game/EntityFactory.js';
import { WorldManager } from '../../client/src/game/WorldManager.js';
import { SimulationManager } from '../../client/src/game/managers/SimulationManager.js';
import { IntentQueue } from '../../client/src/game/managers/IntentQueue.js';
import { MovementSystem } from '../../client/src/game/systems/MovementSystem.js';
import { CombatResolver } from '../../client/src/game/systems/CombatResolver.js';
import { SICKNESS_TURNS } from '../../client/src/game/systems/CombatSystem.js';
import { ExplosionSystem } from '../../client/src/game/systems/ExplosionSystem.js';
import { ItemDefs, createItemFromDef } from '../../client/src/game/inventory/ItemDefs.js';
import { Item } from '../../client/src/game/inventory/Item.js';
import { ItemTrait, ItemCategory } from '../../client/src/game/inventory/traits.js';
import { LineOfSight } from '../../client/src/game/utils/LineOfSight.js';
import engine from '../../client/src/game/GameEngine.js';

// The UI's unarmed pseudo-weapon (ActionSlotButton.tsx). Used when the player
// has nothing equipped in the melee slot.
const UNARMED_WEAPON = {
  instanceId: 'unarmed',
  name: 'Unarmed',
  defId: 'unarmed',
  combat: { hitChance: 0.5, damage: { min: 1, max: 3 } },
};

const ENEMY_TYPES = new Set(['zombie', 'npc', 'rabbit']);

export class GameHarness {
  /**
   * @param {object} [opts]
   * @param {number} [opts.seed=1] deterministic seed
   * @param {number} [opts.width=20]
   * @param {number} [opts.height=20]
   * @param {string} [opts.terrain='floor']
   */
  constructor({ seed = 1, width = 20, height = 20, terrain = 'floor' } = {}) {
    this.seed = seed;
    this.width = width;
    this.height = height;
    this.terrain = terrain;
    this.turn = 1;
    this.gameMap = null;
    this.player = null;
  }

  /** Build a clean minimal world and wire up the engine singleton. */
  bootstrap() {
    gameRandom.seed(this.seed);
    engine.reset(); // resets inventoryManager, nulls player/gameMap/worldManager

    const map = new GameMap(this.width, this.height);
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        map.setTerrain(x, y, this.terrain);
      }
    }

    const player = EntityFactory.createPlayer(Math.floor(this.width / 2), Math.floor(this.height / 2));
    map.addEntity(player, player.x ?? player.logicalX, player.y ?? player.logicalY);

    engine.gameMap = map;
    engine.player = player;
    engine.worldManager = new WorldManager();

    this.gameMap = map;
    this.player = player;
    this.turn = 1;
    return this;
  }

  /**
   * Spawn a zombie at (x,y). Returns the entity.
   * @param {number} x @param {number} y @param {string} [subtype='standard']
   */
  spawnZombie(x, y, subtype = 'standard', id = null) {
    const z = EntityFactory.createZombie(x, y, subtype, id || `z-${x}-${y}-${this.gameMap.entityMap.size}`);
    this.gameMap.addEntity(z, x, y);
    return z;
  }

  /** Current logical position of an entity (falls back to render coords). */
  static pos(e) {
    return { x: e.logicalX ?? e.x, y: e.logicalY ?? e.y };
  }

  /**
   * Apply a single player action WITHIN the current turn (spends AP, does not
   * advance the world). Call endTurn() to run the enemy/AI phase.
   * @param {object} action
   *   { type:'move', dx, dy } single step, dx/dy in {-1,0,1}
   *   { type:'attack', targetId }  melee an adjacent entity
   *   { type:'wait' }
   * @returns {{ok:boolean, reason?:string}}
   */
  applyPlayerAction(action) {
    const player = this.player;
    if (!player) return { ok: false, reason: 'not bootstrapped' };

    switch (action.type) {
      case 'wait':
        return { ok: true };

      case 'move': {
        const { dx, dy } = action;
        if (!Number.isInteger(dx) || !Number.isInteger(dy) || (dx === 0 && dy === 0)) {
          return { ok: false, reason: 'invalid move delta' };
        }
        const movable = player.getComponent ? player.getComponent('Movable') : null;
        const apCost = movable?.apCost ?? 1;
        if ((player.ap ?? 0) < apCost) return { ok: false, reason: 'not enough AP' };

        const before = GameHarness.pos(player);
        MovementSystem.resolve(player, { dx, dy }, this.gameMap, []);
        const after = GameHarness.pos(player);
        const moved = after.x !== before.x || after.y !== before.y;
        return moved ? { ok: true } : { ok: false, reason: 'blocked' };
      }

      case 'attack':
        return this._meleeAttack(action.targetId);

      case 'shoot':
        return this._rangedAttack(action.targetId);

      case 'throw':
        return this._throw(action.targetX, action.targetY, action.itemInstanceId);

      case 'reload':
        return this._reload();

      default:
        return { ok: false, reason: `unknown action ${action.type}` };
    }
  }

  /** Mirrors CombatContext.performMeleeAttack's core against the real resolver. */
  _meleeAttack(targetId) {
    const player = this.player;
    if ((player.ap ?? 0) < 1) return { ok: false, reason: 'not enough AP' };

    const target = this.gameMap.getEntity(targetId);
    if (!target || target.hp <= 0) return { ok: false, reason: 'no living target' };

    // Melee weapon = equipped melee slot, else unarmed.
    const equipped = engine.inventoryManager?.equipment?.melee || null;
    const weapon = equipped || UNARMED_WEAPON;
    const defStats = ItemDefs[weapon.defId]?.combat || {};
    const instanceStats = weapon.combat || {};
    const weaponStats = { ...defStats, ...instanceStats };
    const range = defStats.range || instanceStats.range || 1.0;

    const p = GameHarness.pos(player);
    const t = GameHarness.pos(target);
    const distance = Math.sqrt((p.x - t.x) ** 2 + (p.y - t.y) ** 2);
    if (distance > range + 0.1) return { ok: false, reason: 'out of range' };

    const { hit, isCrit, damage } = CombatResolver.rollPlayerMelee({
      weaponStats,
      skillLvl: player.meleeLvl ?? 1,
      drunkenness: player.drunkenness || 0,
      isWindowTarget: false,
      isStunRodActive: false,
      hasTargetEntity: true,
      currentStrength: player.currentStrength,
      currentAgility: player.currentAgility,
      currentPerception: player.currentPerception,
      defenderType: target.type,
      defenderSubtype: target.subtype,
      defender: target,
    });

    player.useAP(1);
    if (hit) {
      const finalDamage = CombatResolver.applyArmorAbsorption(target, damage);
      if (finalDamage > 0) target.takeDamage(finalDamage, player);
    }
    // Melee vs an entity emits no noise in the live game (CombatContext only
    // emits for structure hits), so nothing to mirror here.
    return { ok: true, hit, isCrit, damage };
  }

  /** The equipped weapon that has rangedStats, or null. */
  getRangedWeapon() {
    const eq = engine.inventoryManager?.equipment || {};
    for (const item of Object.values(eq)) {
      if (item && ItemDefs[item.defId]?.rangedStats) return item;
    }
    return null;
  }

  /** Resolve the weapon's loaded ammo item (magazine or ammo stack), or null. */
  _weaponAmmo(weapon) {
    const ammoSlot = weapon.attachmentSlots?.find((s) => s.id === 'ammo');
    const mag = ammoSlot ? weapon.attachments?.[ammoSlot.id] : null;
    if (!mag) return null;
    const isMagazine = mag.hasTrait?.(ItemTrait.MAGAZINE);
    const rounds = isMagazine ? (mag.ammoCount ?? 0) : (mag.stackCount ?? 0);
    return { ammoSlot, mag, isMagazine, rounds };
  }

  /** Mirrors CombatContext.performRangedAttack (single shot; no burst/sling/scope). */
  _rangedAttack(targetId) {
    const player = this.player;
    const weapon = this.getRangedWeapon();
    if (!weapon) return { ok: false, reason: 'no ranged weapon' };
    if ((player.ap ?? 0) < 1) return { ok: false, reason: 'not enough AP' };

    const stats = ItemDefs[weapon.defId]?.rangedStats || { damage: { min: 4, max: 10 }, accuracyFalloff: 0.1, minAccuracy: 0.01 };
    const ammo = this._weaponAmmo(weapon);
    if (!ammo || ammo.rounds <= 0) return { ok: false, reason: 'out of ammo' };

    const target = this.gameMap.getEntity(targetId);
    if (!target || target.hp <= 0) return { ok: false, reason: 'no living target' };

    const p = GameHarness.pos(player);
    const t = GameHarness.pos(target);
    const distance = Math.hypot(t.x - p.x, t.y - p.y);
    if (stats.minRange && distance < stats.minRange) return { ok: false, reason: 'target too close' };
    const los = LineOfSight.hasLineOfSight(this.gameMap, p.x, p.y, t.x, t.y, { maxRange: 20 });
    if (!los.hasLineOfSight) return { ok: false, reason: 'no line of sight' };

    player.useAP(1);
    // Consume one round.
    if (ammo.isMagazine) {
      ammo.mag.ammoCount--;
    } else {
      ammo.mag.stackCount--;
      if (ammo.mag.stackCount <= 0) weapon.detachItem?.(ammo.ammoSlot.id);
    }

    const { hit, isCrit, damage } = CombatResolver.rollPlayerRanged({
      stats,
      skillLvl: player.rangedLvl ?? 1,
      drunkenness: player.drunkenness || 0,
      squaresAway: Math.floor(distance),
      isWindowTarget: false,
      hasScope: false,
      hasLaserSight: false,
      currentAgility: player.currentAgility,
      currentPerception: player.currentPerception,
      defenderType: target.type,
      defenderSubtype: target.subtype,
      defender: target,
    });

    if (hit) {
      const finalDamage = CombatResolver.applyArmorAbsorption(target, damage);
      if (finalDamage > 0) target.takeDamage(finalDamage, player);
    }

    // Mirror CombatContext.performRangedAttack: every shot emits noise at the
    // PLAYER's position (suppressor cuts the radius to 3). This is what pulls
    // nearby zombies toward gunfire — without it, balance sims understate
    // ranged difficulty.
    const barrelSlot = weapon.attachmentSlots?.find((s) => s.id === 'barrel');
    const isSuppressed = barrelSlot && weapon.attachments?.[barrelSlot.id]?.categories?.includes(ItemCategory.SUPPRESSOR);
    const noiseRadius = isSuppressed ? 3 : (stats.noiseRadius || 10);
    this.gameMap.emitNoise?.(p.x, p.y, noiseRadius);

    return { ok: true, hit, isCrit, damage };
  }

  /**
   * Reload the equipped ranged weapon from inventory, mirroring
   * InventoryContext.loadAmmoDirectly (attachItemToWeapon on the 'ammo' slot +
   * useAP(1)).
   */
  _reload() {
    const player = this.player;
    const weapon = this.getRangedWeapon();
    if (!weapon) return { ok: false, reason: 'no ranged weapon' };
    if ((player.ap ?? 0) < 1) return { ok: false, reason: 'not enough AP' };

    const ammoSlot = weapon.attachmentSlots?.find((s) => s.id === 'ammo');
    if (!ammoSlot) return { ok: false, reason: 'weapon has no ammo slot' };

    const found = this._findAmmoFor(weapon);
    if (!found) return { ok: false, reason: 'no compatible ammo' };

    const result = engine.inventoryManager.attachItemToWeapon(weapon, ammoSlot.id, found.item, found.containerId);
    if (result?.success) {
      player.useAP(1);
      return { ok: true };
    }
    return { ok: false, reason: result?.reason || 'reload failed' };
  }

  /** Find a compatible ammo/magazine item for a weapon anywhere in inventory. */
  _findAmmoFor(weapon) {
    const ammoSlot = weapon.attachmentSlots?.find((s) => s.id === 'ammo');
    const allowed = new Set(ammoSlot?.allowedItems || []);
    const containers = new Set();
    const bp = engine.inventoryManager?.getBackpackContainer?.();
    if (bp) containers.add(bp);
    if (engine.inventoryManager?.containers) {
      for (const c of engine.inventoryManager.containers.values()) containers.add(c);
    }
    for (const c of containers) {
      const items = c.getAllItems?.() || [];
      for (const it of items) {
        if (allowed.has(it.defId)) return { item: it, containerId: c.id };
      }
    }
    return null;
  }

  /**
   * Throw an item at a tile. Mirrors CombatContext's throw handlers (LOS check,
   * useAP(1), consume one). Both roll on the seeded gameRandom now, so throws
   * are reproducible:
   *   - grenade (weapon.grenade)  -> performGrenadeThrow: ExplosionSystem blast.
   *   - stone   (crafting.stone)  -> performStoneThrow: falloff hit roll + 1-4 dmg
   *                                  to the enemy on the target tile.
   * Molotov is not modelled (needs an igniter + fire propagation).
   */
  _throw(targetX, targetY, itemInstanceId) {
    const player = this.player;
    if ((player.ap ?? 0) < 1) return { ok: false, reason: 'not enough AP' };

    const found = itemInstanceId ? engine.inventoryManager?.findItem?.(itemInstanceId) : null;
    const item = found?.item;
    if (!item) return { ok: false, reason: 'no throwable item' };

    const isGrenade = item.defId === 'weapon.grenade';
    const isStone = item.defId === 'crafting.stone';
    if (!isGrenade && !isStone) {
      return { ok: false, reason: `throw supports grenades and stones (got ${item.defId})` };
    }

    const p = GameHarness.pos(player);
    const los = LineOfSight.hasLineOfSight(this.gameMap, p.x, p.y, targetX, targetY, { maxRange: 20 });
    if (!los.hasLineOfSight) return { ok: false, reason: 'no line of sight' };

    // A stone needs a living enemy on the target tile.
    let target = null;
    if (isStone) {
      for (const e of this.gameMap.entityMap.values()) {
        if (!ENEMY_TYPES.has(e.type) || e.hp <= 0) continue;
        const t = GameHarness.pos(e);
        if (t.x === targetX && t.y === targetY) { target = e; break; }
      }
      if (!target) return { ok: false, reason: 'no target at location' };
    }

    player.useAP(1);
    if ((item.stackCount ?? 1) > 1) item.stackCount--;
    else engine.inventoryManager.destroyItem(item.instanceId);

    if (isGrenade) {
      ExplosionSystem.resolve(
        { targetX, targetY, radius: 2, minDamage: 10, maxDamage: 30, isIncendiary: false, sourceEntityId: player.id },
        [player, ...this.gameMap.entityMap.values()],
        this.gameMap,
        new IntentQueue(),
        [],
        engine,
      );
      return { ok: true };
    }

    // Stone: sling-style falloff accuracy + 1-4 damage (matches performStoneThrow).
    const distance = Math.hypot(targetX - p.x, targetY - p.y);
    const squaresAway = Math.floor(distance);
    const baseHitChance = Math.max(0, 0.9 - (squaresAway - 2) * 0.1);
    const accuracyBonus = ((player.rangedLvl ?? 1) - (player.drunkenness || 0)) * 0.01;
    const hit = gameRandom.next() <= baseHitChance + accuracyBonus;
    let damage = 0;
    if (hit) {
      damage = gameRandom.nextInt(1, 4);
      target.takeDamage(damage, player);
    }
    // Mirror performStoneThrow's noise: impact at the target tile, plus a
    // quieter grunt/throw sound at the player's tile.
    this.gameMap.emitNoise?.(targetX, targetY, 3);
    this.gameMap.emitNoise?.(p.x, p.y, 1);
    return { ok: true, hit, damage };
  }

  // --- Scenario helpers (for tests / balance sims) ---

  /** Equip an item by defId (e.g. a weapon or backpack). Returns the item or null. */
  equipItemDef(defId, slot = null) {
    const item = new Item(createItemFromDef(defId));
    const res = engine.inventoryManager.equipItem(item, slot);
    return res?.success ? item : null;
  }

  /** Add an item by defId to inventory (needs a backpack for space). */
  giveItemDef(defId, { stackCount = null } = {}) {
    const item = new Item(createItemFromDef(defId));
    if (stackCount != null) item.stackCount = stackCount;
    engine.inventoryManager.addItem(item);
    return item;
  }

  /** Directly load rounds into a weapon's ammo slot (bypasses the reload action). */
  loadWeaponAmmo(weapon, ammoDefId, count) {
    const ammo = new Item(createItemFromDef(ammoDefId));
    ammo.stackCount = count;
    weapon.attachItem('ammo', ammo);
    return ammo;
  }

  /**
   * Run the enemy/AI turn and the distilled player upkeep, then refill AP.
   * @returns {Array} the sim action queue (for inspection/replay).
   */
  endTurn() {
    const map = this.gameMap;
    const player = this.player;

    // Snapshot logical positions from authoritative coords (mirrors simulateTurn).
    map.entityMap.forEach((e) => {
      if (e.gridX !== undefined) {
        e.logicalX = e.gridX;
        e.logicalY = e.gridY;
      } else {
        e.logicalX = e.x;
        e.logicalY = e.y;
      }
    });

    let actionQueue = [];
    if (typeof map.processTurn === 'function') {
      const mapActions = map.processTurn(player, false, this.turn, [], new Set());
      if (mapActions) actionQueue.push(...mapActions);
    }

    const simActions = SimulationManager.runTurn(map, { player, isSleeping: false, turn: this.turn });
    if (simActions) actionQueue = actionQueue.concat(simActions);

    // CRITICAL: entity-vs-entity combat is PLAYBACK-FIRST. CombatSystem.resolve
    // computes the hit but does NOT apply damage when an actionQueue is present —
    // TurnManager applies takeDamage() during the swing animation. Headless, we
    // must play those effects back ourselves or enemy attacks never land.
    this._applyPlaybackDamage(actionQueue);

    // Any entity killed during playback (e.g. the player is handled by callers;
    // a downed NPC) is cleaned up + drops loot, mirroring the sim's death checks.
    SimulationManager.checkAndProcessDeaths(map, [...map.entityMap.values()], new IntentQueue(), [], player);

    // Distilled AP refill: same injury penalty the game applies (missing HP / 5).
    const injuryPenalty = Math.floor(Math.max(0, (player.maxHp ?? 0) - (player.hp ?? 0)) / 5);
    player.ap = Math.max(0, (player.maxAp ?? 0) - injuryPenalty);

    this.turn += 1;
    return actionQueue;
  }

  /**
   * Apply the damage/affliction effects of a resolved action queue, mirroring
   * TurnManager's ATTACK case (minus animations/events). Entity-vs-entity
   * combat defers damage to this playback step; all other action types apply
   * their damage during simulation, so only ATTACK needs replaying here.
   */
  _applyPlaybackDamage(actionQueue) {
    const map = this.gameMap;
    const player = this.player;
    for (const action of actionQueue) {
      if (!action || action.type !== 'ATTACK') continue;
      const data = action.data || {};
      const attacker = map.getEntity(action.entityId);
      const target = data.targetType === 'player' ? player : map.getEntity(data.targetId);
      if (!target || !data.success || !(data.damage > 0)) continue;

      const finalDamage = CombatResolver.applyArmorAbsorption(target, data.damage, engine?.inventoryManager);
      if (finalDamage > 0 && typeof target.takeDamage === 'function') target.takeDamage(finalDamage, attacker);
      if (data.bleedingInflicted && typeof target.setBleeding === 'function') target.setBleeding(true);
      if (data.sickInflicted && typeof target.inflictSickness === 'function') target.inflictSickness(SICKNESS_TURNS);
      if (data.infectionInflicted && typeof target.inflictInfection === 'function') target.inflictInfection();
    }
  }

  /**
   * Enumerate currently-legal player actions for the fuzzer / balance sim.
   * Best-effort: move directions are in-bounds + affordable (MovementSystem will
   * no-op on walls); attacks are living enemies within melee range.
   */
  enumerateValidActions() {
    const player = this.player;
    const actions = [{ type: 'wait' }];
    const movable = player.getComponent ? player.getComponent('Movable') : null;
    const apCost = movable?.apCost ?? 1;
    const p = GameHarness.pos(player);

    if ((player.ap ?? 0) >= apCost) {
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          if (dx === 0 && dy === 0) continue;
          const nx = p.x + dx;
          const ny = p.y + dy;
          if (nx < 0 || ny < 0 || nx >= this.width || ny >= this.height) continue;
          actions.push({ type: 'move', dx, dy });
        }
      }
    }

    if ((player.ap ?? 0) >= 1) {
      const weapon = this.getRangedWeapon();
      const ammo = weapon ? this._weaponAmmo(weapon) : null;
      const canShoot = ammo && ammo.rounds > 0;

      for (const e of this.gameMap.entityMap.values()) {
        if (!ENEMY_TYPES.has(e.type) || e.hp <= 0) continue;
        const t = GameHarness.pos(e);
        const dist = Math.max(Math.abs(t.x - p.x), Math.abs(t.y - p.y));
        if (dist === 1) actions.push({ type: 'attack', targetId: e.id });
        if (canShoot && dist > 1 && LineOfSight.hasLineOfSight(this.gameMap, p.x, p.y, t.x, t.y, { maxRange: 20 }).hasLineOfSight) {
          actions.push({ type: 'shoot', targetId: e.id });
        }
      }

      // Reload when a gun isn't fully out but has compatible ammo waiting.
      if (weapon && (!ammo || ammo.rounds <= 0) && this._findAmmoFor(weapon)) {
        actions.push({ type: 'reload' });
      }
    }
    return actions;
  }

  /** Lightweight, serializable snapshot for crash dumps / replay. */
  snapshotState() {
    const p = GameHarness.pos(this.player);
    return {
      seed: this.seed,
      turn: this.turn,
      rngState: gameRandom.getState(),
      player: { x: p.x, y: p.y, hp: this.player.hp, ap: this.player.ap, maxHp: this.player.maxHp, maxAp: this.player.maxAp },
      entityCount: this.gameMap.entityMap.size,
      livingEnemies: [...this.gameMap.entityMap.values()].filter((e) => ENEMY_TYPES.has(e.type) && e.hp > 0).length,
    };
  }

  /**
   * Cheap per-turn invariants for the fuzzer. Returns an array of violation
   * strings (empty === healthy). Also runs the map's own component audit.
   */
  assertInvariants() {
    const issues = [];
    const player = this.player;

    if (!Number.isFinite(player.hp)) issues.push('player.hp is not finite');
    if (player.maxHp !== undefined && player.hp > player.maxHp) issues.push('player.hp exceeds maxHp');
    if (!Number.isFinite(player.ap)) issues.push('player.ap is not finite');
    if (player.ap < 0) issues.push('player.ap is negative');
    if (player.maxAp !== undefined && player.ap > player.maxAp + 0.001) issues.push('player.ap exceeds maxAp');

    for (const e of this.gameMap.entityMap.values()) {
      if (e.hp !== undefined && !Number.isFinite(e.hp)) {
        issues.push(`entity ${e.id} (${e.type}) has non-finite hp`);
      }
    }

    if (typeof this.gameMap.auditEntityComponents === 'function') {
      const healed = this.gameMap.auditEntityComponents('harness');
      if (Array.isArray(healed) && healed.length > 0) {
        issues.push(`auditEntityComponents healed ${healed.length} malformed entity(ies)`);
      }
    }
    return issues;
  }
}
