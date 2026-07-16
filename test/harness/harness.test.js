import { describe, it, expect } from 'vitest';
import { GameHarness } from './GameHarness.js';

describe('GameHarness (Phase 2 foundation)', () => {
  it('bootstraps a headless world with a player on the map', () => {
    const h = new GameHarness({ seed: 42, width: 20, height: 20 }).bootstrap();
    expect(h.player).toBeTruthy();
    expect(h.gameMap.getEntity(h.player.id)).toBe(h.player);
    expect(h.assertInvariants()).toEqual([]);
  });

  it('moves the player one step east via MovementSystem', () => {
    const h = new GameHarness({ seed: 1 }).bootstrap();
    const before = GameHarness.pos(h.player);
    const res = h.applyPlayerAction({ type: 'move', dx: 1, dy: 0 });
    expect(res.ok).toBe(true);
    const after = GameHarness.pos(h.player);
    expect(after.x).toBe(before.x + 1);
    expect(after.y).toBe(before.y);
    expect(h.player.ap).toBeLessThan(h.player.maxAp); // AP was spent
  });

  it('offers an attack action for an adjacent zombie and can kill it', () => {
    const h = new GameHarness({ seed: 7 }).bootstrap();
    const p = GameHarness.pos(h.player);
    const zombie = h.spawnZombie(p.x + 1, p.y, 'standard', 'target-z');

    const actions = h.enumerateValidActions();
    expect(actions.some((a) => a.type === 'attack' && a.targetId === 'target-z')).toBe(true);

    // Attack across turns until the zombie dies (bounded to avoid an infinite loop).
    let killed = false;
    for (let turn = 0; turn < 40 && !killed; turn++) {
      while ((h.player.ap ?? 0) >= 1 && zombie.hp > 0) {
        h.applyPlayerAction({ type: 'attack', targetId: 'target-z' });
      }
      expect(h.assertInvariants()).toEqual([]);
      if (zombie.hp <= 0) {
        killed = true;
        break;
      }
      h.endTurn();
    }
    expect(killed).toBe(true);
  });

  it('holds invariants across many end-turns with roaming zombies', () => {
    const h = new GameHarness({ seed: 123 }).bootstrap();
    const p = GameHarness.pos(h.player);
    h.spawnZombie(p.x + 3, p.y + 2, 'standard');
    h.spawnZombie(p.x - 4, p.y - 1, 'standard');

    for (let i = 0; i < 25; i++) {
      h.endTurn();
      expect(h.assertInvariants(), `turn ${i}`).toEqual([]);
    }
  });

  it('reloads a ranged weapon from inventory (spends AP, loads ammo)', () => {
    const h = new GameHarness({ seed: 11 }).bootstrap();
    h.equipItemDef('backpack.standard'); // inventory space
    const pistol = h.equipItemDef('weapon.357Pistol');
    expect(pistol, 'pistol equipped').toBeTruthy();
    h.giveItemDef('ammo.357', { stackCount: 6 });

    expect(h.getRangedWeapon()).toBe(pistol);
    const apBefore = h.player.ap;
    const res = h.applyPlayerAction({ type: 'reload' });
    expect(res.ok, res.reason).toBe(true);
    expect(h._weaponAmmo(pistol).rounds).toBeGreaterThan(0);
    expect(h.player.ap).toBe(apBefore - 1);
  });

  it('shoots an in-LOS zombie: consumes ammo, deals damage', () => {
    const h = new GameHarness({ seed: 13 }).bootstrap();
    const pistol = h.equipItemDef('weapon.357Pistol');
    h.loadWeaponAmmo(pistol, 'ammo.357', 6);

    const p = GameHarness.pos(h.player);
    const zombie = h.spawnZombie(p.x + 3, p.y, 'standard', 'shoot-z');
    const initialHp = zombie.hp;

    const actions = h.enumerateValidActions();
    expect(actions.some((a) => a.type === 'shoot' && a.targetId === 'shoot-z')).toBe(true);

    // Fire the whole magazine at the stationary target this turn.
    let shots = 0;
    while (h._weaponAmmo(pistol).rounds > 0 && zombie.hp > 0) {
      const res = h.applyPlayerAction({ type: 'shoot', targetId: 'shoot-z' });
      expect(res.ok, res.reason).toBe(true);
      shots++;
    }
    expect(shots).toBeGreaterThan(0);
    expect(zombie.hp).toBeLessThan(initialHp); // at least one of the shots hit
    expect(h.assertInvariants()).toEqual([]);
  });

  it('throws a grenade that damages a nearby zombie', () => {
    const h = new GameHarness({ seed: 17 }).bootstrap();
    h.equipItemDef('backpack.standard');
    const grenade = h.giveItemDef('weapon.grenade');

    const p = GameHarness.pos(h.player);
    const zombie = h.spawnZombie(p.x + 2, p.y, 'standard', 'nade-z');
    const initialHp = zombie.hp;
    const apBefore = h.player.ap;

    const res = h.applyPlayerAction({ type: 'throw', targetX: p.x + 2, targetY: p.y, itemInstanceId: grenade.instanceId });
    expect(res.ok, res.reason).toBe(true);
    expect(h.player.ap).toBe(apBefore - 1);
    // Zombie took blast damage (possibly lethal -> removed from map).
    const stillAlive = h.gameMap.getEntity('nade-z');
    expect(!stillAlive || stillAlive.hp < initialHp).toBe(true);
  });

  it('throws a stone that deterministically damages a zombie', () => {
    // Stone throws now roll on gameRandom (was Math.random), so two identical
    // seeded runs must produce the identical result.
    const run = () => {
      const h = new GameHarness({ seed: 21 }).bootstrap();
      h.equipItemDef('backpack.standard');
      const stone = h.giveItemDef('crafting.stone', { stackCount: 5 });
      const p = GameHarness.pos(h.player);
      const zombie = h.spawnZombie(p.x + 2, p.y, 'standard', 'stone-z');
      const before = zombie.hp;
      const res = h.applyPlayerAction({ type: 'throw', targetX: p.x + 2, targetY: p.y, itemInstanceId: stone.instanceId });
      return { ok: res.ok, hit: res.hit, damage: res.damage, hpDelta: before - zombie.hp, ap: h.player.ap };
    };
    const a = run();
    const b = run();
    expect(a.ok).toBe(true);
    expect(a).toEqual(b); // deterministic
  });

  it('is deterministic: same seed + same script -> identical outcome', () => {
    // NOTE: GameHarness drives the global engine/gameRandom singletons, so only
    // one harness may be live at a time — bootstrap re-seeds and resets. Runs
    // must therefore be executed sequentially to completion, not interleaved.
    const run = () => {
      const h = new GameHarness({ seed: 999 }).bootstrap();
      const p = GameHarness.pos(h.player);
      const z = h.spawnZombie(p.x + 1, p.y, 'standard', 'z');
      for (let i = 0; i < 5; i++) h.applyPlayerAction({ type: 'attack', targetId: 'z' });
      return z.hp;
    };

    expect(run()).toBe(run());
  });
});
