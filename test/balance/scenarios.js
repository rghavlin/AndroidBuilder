// Built-in balance scenarios. Each is a data description consumed by
// runScenario() in balance.js.
//
// HP/AP: by default the player uses the real factory character, whose maxHp/maxAp
// are DERIVED from attributes (maxHp = 10 + floor(Con*0.4); maxAp = 10 +
// floor((Agi+Per)/5)) — so the baseline reflects current gameplay. To try other
// levels, set an `attributes: { constitution, agility, perception, strength }`
// block (faithful — also feeds combat rolls), or a direct `maxHp`/`maxAp`
// override, or sweep any of them from the CLI:
//   npm run balance -- --scenario=melee_vs_4 --sweep=constitution --from=15 --to=35 --step=5
//   npm run balance -- --scenario=pistol_vs_6 --sweep=maxAp --from=10 --to=24 --step=2

export const SCENARIOS = {
  shotgun_vs_10: {
    name: 'shotgun_vs_10',
    arena: { width: 25, height: 25 },
    player: {
      weapon: 'weapon.shotgun',
      ammo: { defId: 'ammo.shotgun_shells', count: 28 },
      rangedLvl: 5,
      meleeLvl: 3,
    },
    zombies: { count: 10, subtype: 'standard', spread: 9 },
    turnCap: 100,
  },

  pistol_vs_6: {
    name: 'pistol_vs_6',
    arena: { width: 25, height: 25 },
    player: {
      weapon: 'weapon.357Pistol',
      ammo: { defId: 'ammo.357', count: 30 },
      rangedLvl: 4,
      meleeLvl: 2,
    },
    zombies: { count: 6, subtype: 'standard', spread: 8 },
    turnCap: 100,
  },

  melee_vs_4: {
    name: 'melee_vs_4',
    arena: { width: 20, height: 20 },
    player: { meleeLvl: 4 },
    zombies: { count: 4, subtype: 'standard', spread: 6 },
    turnCap: 100,
  },
};

export function getScenario(name) {
  return SCENARIOS[name] || null;
}
