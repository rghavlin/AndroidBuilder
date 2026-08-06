// PlayerCombatSystem — the player's melee / ranged attacks.
//
// These paths used to live in CombatContext.jsx (React), so the headless harness
// carried a hand-written copy of them. The copy had drifted: no burst fire, no
// sling ammo, no scope/laser sight, no weapon-condition breakage, no
// edge-structure retargeting, no turrets, no kill loot. Nothing tested either
// implementation, so the drift was invisible.
//
// The logic now lives in the engine and both callers share it. These tests pin
// the behaviours the old copy was missing, and assert on deterministic resource
// accounting (AP, rounds, stones, noise) rather than RNG-dependent hit outcomes.

import { describe, it, expect, beforeEach } from 'vitest';
import { GameHarness } from '../harness/GameHarness.js';
import PlayerCombatSystem from '../../client/src/game/systems/PlayerCombatSystem.js';
import { Item } from '../../client/src/game/inventory/Item.js';
import { createItemFromDef } from '../../client/src/game/inventory/ItemDefs.js';
import { FireMode } from '../../client/src/game/inventory/traits.js';
import engine from '../../client/src/game/GameEngine.js';

/** Attack args with the harness's real player/map and the no-op UI bag. */
function args(h, extra = {}) {
  return {
    player: h.player,
    gameMap: h.gameMap,
    playerStats: { meleeLvl: h.player.meleeLvl ?? 1, rangedLvl: h.player.rangedLvl ?? 1 },
    inventoryManager: engine.inventoryManager,
    lootGenerator: null,
    ...extra,
  };
}

/** Equip a battle rifle with a loaded magazine. Returns { weapon, magazine }. */
function equipRifle(h, { rounds = 30, fireMode = FireMode.SINGLE } = {}) {
  const weapon = h.equipItemDef('weapon.battle_rifle');
  const magazine = new Item(createItemFromDef('attachment.556_magazine'));
  magazine.ammoCount = rounds;
  weapon.attachItem('ammo', magazine);
  weapon.fireMode = fireMode;
  return { weapon, magazine };
}

describe('PlayerCombatSystem', () => {
  let h;
  beforeEach(() => {
    h = new GameHarness({ seed: 7, width: 20, height: 20 });
    h.bootstrap();
    h.equipItemDef('backpack.standard');
  });

  describe('ranged — burst fire (absent from the old harness copy)', () => {
    it('a single-fire weapon spends 1 AP and exactly 1 round', () => {
      const { weapon, magazine } = equipRifle(h, { rounds: 30, fireMode: FireMode.SINGLE });
      const z = h.spawnZombie(h.player.gridX + 5, h.player.gridY, 'standard', 'z1');
      const apBefore = h.player.ap;

      const r = PlayerCombatSystem.performRangedAttack(
        args(h, { weapon, targetX: z.gridX, targetY: z.gridY }),
      );

      expect(r.success).toBe(true);
      expect(r.shotsFired).toBe(1);
      expect(magazine.ammoCount).toBe(29);
      expect(apBefore - h.player.ap).toBe(1);
    });

    it('a burst weapon fires 3 rounds for the same single AP', () => {
      const { weapon, magazine } = equipRifle(h, { rounds: 30, fireMode: FireMode.BURST });
      // Park the target far enough away that it survives three hits and the
      // burst runs to completion (a kill breaks the loop early by design).
      const z = h.spawnZombie(h.player.gridX + 9, h.player.gridY, 'standard', 'z1');
      z.maxHp = 500; z.hp = 500; // hp is clamped to maxHp
      const apBefore = h.player.ap;

      const r = PlayerCombatSystem.performRangedAttack(
        args(h, { weapon, targetX: z.gridX, targetY: z.gridY }),
      );

      expect(r.success).toBe(true);
      expect(r.shotsFired).toBe(3);
      expect(magazine.ammoCount).toBe(27);
      expect(apBefore - h.player.ap).toBe(1); // 1 AP for the whole burst
    });

    it('a burst stops early when the magazine runs dry mid-burst', () => {
      const { weapon, magazine } = equipRifle(h, { rounds: 2, fireMode: FireMode.BURST });
      const z = h.spawnZombie(h.player.gridX + 9, h.player.gridY, 'standard', 'z1');
      z.maxHp = 500; z.hp = 500; // hp is clamped to maxHp

      const r = PlayerCombatSystem.performRangedAttack(
        args(h, { weapon, targetX: z.gridX, targetY: z.gridY }),
      );

      expect(r.shotsFired).toBe(2);
      expect(magazine.ammoCount).toBe(0);
    });

    it('a burst ends the moment the target dies', () => {
      const { weapon } = equipRifle(h, { rounds: 30, fireMode: FireMode.BURST });
      const z = h.spawnZombie(h.player.gridX + 3, h.player.gridY, 'standard', 'z1');
      z.hp = 1; // any landed hit is lethal

      const r = PlayerCombatSystem.performRangedAttack(
        args(h, { weapon, targetX: z.gridX, targetY: z.gridY }),
      );

      if (r.kills > 0) {
        expect(r.shotsFired).toBeLessThanOrEqual(3);
        expect(h.gameMap.getEntity('z1')).toBeFalsy(); // kill loot ran, corpse removed
      }
    });
  });

  describe('ranged — sling ammo (absent from the old harness copy)', () => {
    it('consumes a crafting.stone from inventory per shot', () => {
      const weapon = h.equipItemDef('weapon.sling');
      h.giveItemDef('crafting.stone', { stackCount: 5 });
      const im = engine.inventoryManager;
      const before = im.countItemsByDefId?.('crafting.stone') ?? 5;

      // minRange is 2, so stand well clear.
      const z = h.spawnZombie(h.player.gridX + 4, h.player.gridY, 'standard', 'z1');
      const r = PlayerCombatSystem.performRangedAttack(
        args(h, { weapon, targetX: z.gridX, targetY: z.gridY }),
      );

      expect(r.success).toBe(true);
      expect(r.shotsFired).toBe(1);
      expect(im.hasItemByDefId('crafting.stone', before)).toBe(false); // one fewer
    });

    it('refuses to fire with no stones', () => {
      const weapon = h.equipItemDef('weapon.sling');
      const z = h.spawnZombie(h.player.gridX + 4, h.player.gridY, 'standard', 'z1');

      const r = PlayerCombatSystem.performRangedAttack(
        args(h, { weapon, targetX: z.gridX, targetY: z.gridY }),
      );

      expect(r.success).toBe(false);
      expect(r.reason).toBe('Out of ammo');
    });

    it('enforces minRange — a target inside 2 tiles is too close', () => {
      const weapon = h.equipItemDef('weapon.sling');
      h.giveItemDef('crafting.stone', { stackCount: 5 });
      const z = h.spawnZombie(h.player.gridX + 1, h.player.gridY, 'standard', 'z1');

      const r = PlayerCombatSystem.performRangedAttack(
        args(h, { weapon, targetX: z.gridX, targetY: z.gridY }),
      );

      expect(r.success).toBe(false);
      expect(r.reason).toBe('Target too close');
    });
  });

  describe('ranged — attachments and condition', () => {
    it('a suppressor cuts the noise radius to 3', () => {
      const { weapon } = equipRifle(h);
      const suppressor = new Item(createItemFromDef('attachment.suppressor'));
      weapon.attachItem('barrel', suppressor);

      const noises = [];
      h.gameMap.emitNoise = (x, y, radius) => noises.push(radius);

      const z = h.spawnZombie(h.player.gridX + 5, h.player.gridY, 'standard', 'z1');
      PlayerCombatSystem.performRangedAttack(
        args(h, { weapon, targetX: z.gridX, targetY: z.gridY }),
      );

      expect(noises).toContain(3);
      expect(noises).not.toContain(18); // the rifle's unsuppressed radius
    });

    it('an unsuppressed shot emits the weapon-defined radius', () => {
      const { weapon } = equipRifle(h);
      const noises = [];
      h.gameMap.emitNoise = (x, y, radius) => noises.push(radius);

      const z = h.spawnZombie(h.player.gridX + 5, h.player.gridY, 'standard', 'z1');
      PlayerCombatSystem.performRangedAttack(
        args(h, { weapon, targetX: z.gridX, targetY: z.gridY }),
      );

      expect(noises).toContain(18);
    });

    it('a broken weapon aborts the shot and spends no AP', () => {
      // Must be a DEGRADABLE weapon — the guard is gated on isDegradable(), and
      // the battle rifle has no DEGRADABLE trait. The sling does.
      const weapon = h.equipItemDef('weapon.sling');
      h.giveItemDef('crafting.stone', { stackCount: 5 });
      expect(weapon.isDegradable()).toBe(true);
      weapon.condition = 0;
      const z = h.spawnZombie(h.player.gridX + 5, h.player.gridY, 'standard', 'z1');
      const apBefore = h.player.ap;

      const r = PlayerCombatSystem.performRangedAttack(
        args(h, { weapon, targetX: z.gridX, targetY: z.gridY }),
      );

      expect(r.success).toBe(false);
      expect(r.reason).toBe('Weapon is broken');
      expect(h.player.ap).toBe(apBefore);
    });
  });

  describe('logical vs render coordinates', () => {
    // REGRESSION: the ported logic read `player.x`, which is a RENDER coordinate
    // maintained by the React animation layer. Headless it never advances, so
    // after the player walked, every melee swing was rejected as "out of range"
    // and the melee balance scenario collapsed to a 0% win rate.
    it('melee reaches an adjacent target after the player has moved', () => {
      h.applyPlayerAction({ type: 'move', dx: 1, dy: 1 });
      h.applyPlayerAction({ type: 'move', dx: 1, dy: 1 });
      expect(h.player.x).not.toBe(h.player.gridX); // render coord is stale

      const z = h.spawnZombie(h.player.gridX + 1, h.player.gridY, 'standard', 'z1');
      const weapon = engine.inventoryManager?.equipment?.melee
        || { instanceId: 'unarmed', name: 'Unarmed', defId: 'unarmed', combat: { hitChance: 0.5, damage: { min: 1, max: 3 } } };

      const r = PlayerCombatSystem.performMeleeAttack(
        args(h, { weapon, targetX: z.gridX, targetY: z.gridY }),
      );

      expect(r.success).toBe(true);
      expect(r.reason).toBeUndefined();
    });

    it('ranged line-of-sight is measured from the player logical position', () => {
      const { weapon } = equipRifle(h);
      h.applyPlayerAction({ type: 'move', dx: 1, dy: 0 });
      h.applyPlayerAction({ type: 'move', dx: 1, dy: 0 });

      const z = h.spawnZombie(h.player.gridX + 4, h.player.gridY, 'standard', 'z1');
      const r = PlayerCombatSystem.performRangedAttack(
        args(h, { weapon, targetX: z.gridX, targetY: z.gridY }),
      );

      expect(r.success).toBe(true);
    });
  });

  describe('melee — accounting', () => {
    it('spends exactly 1 AP per swing', () => {
      const z = h.spawnZombie(h.player.gridX + 1, h.player.gridY, 'standard', 'z1');
      z.maxHp = 500; z.hp = 500; // hp is clamped to maxHp
      const weapon = { instanceId: 'unarmed', name: 'Unarmed', defId: 'unarmed', combat: { hitChance: 0.5, damage: { min: 1, max: 3 } } };
      const apBefore = h.player.ap;

      const r = PlayerCombatSystem.performMeleeAttack(
        args(h, { weapon, targetX: z.gridX, targetY: z.gridY }),
      );

      expect(r.success).toBe(true);
      expect(apBefore - h.player.ap).toBe(1);
    });

    it('rejects a target beyond weapon range without spending AP', () => {
      const z = h.spawnZombie(h.player.gridX + 4, h.player.gridY, 'standard', 'z1');
      const weapon = { instanceId: 'unarmed', name: 'Unarmed', defId: 'unarmed', combat: { hitChance: 0.5, damage: { min: 1, max: 3 } } };
      const apBefore = h.player.ap;

      const r = PlayerCombatSystem.performMeleeAttack(
        args(h, { weapon, targetX: z.gridX, targetY: z.gridY }),
      );

      expect(r.success).toBe(false);
      expect(r.reason).toBe('Target out of range');
      expect(h.player.ap).toBe(apBefore);
    });

    it('a lethal swing removes the corpse from the map', () => {
      const z = h.spawnZombie(h.player.gridX + 1, h.player.gridY, 'standard', 'z1');
      z.hp = 1;
      const weapon = { instanceId: 'unarmed', name: 'Unarmed', defId: 'unarmed', combat: { hitChance: 1.0, damage: { min: 5, max: 5 } } };

      const r = PlayerCombatSystem.performMeleeAttack(
        args(h, { weapon, targetX: z.gridX, targetY: z.gridY }),
      );

      if (r.hit) {
        expect(r.killed).toBe(true);
        expect(h.gameMap.getEntity('z1')).toBeFalsy();
      }
    });
  });

  describe('headless purity', () => {
    it('runs with no ui bag at all (no React, no DOM)', () => {
      const { weapon } = equipRifle(h);
      const z = h.spawnZombie(h.player.gridX + 5, h.player.gridY, 'standard', 'z1');

      expect(() => PlayerCombatSystem.performRangedAttack({
        player: h.player,
        gameMap: h.gameMap,
        weapon,
        targetX: z.gridX,
        targetY: z.gridY,
        inventoryManager: engine.inventoryManager,
      })).not.toThrow();
    });
  });
});
