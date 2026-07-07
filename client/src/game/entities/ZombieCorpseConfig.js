export const ZombieCorpseConfig = {
  fat:    { name: 'Fat Zombie Corpse',    imageId: 'fatzombiecorpse', backgroundColor: '#833802' },
  mutant: { name: 'Mutant Corpse',        imageId: 'zombiemutantcorpse', backgroundColor: '#A10C00' },
  runner: { name: 'Runner Corpse',        backgroundColor: '#F6C915' },
  peeper: { name: 'Peeper Corpse',        backgroundColor: '#22536A' },
  spitter:{ name: 'Spitter Corpse',       backgroundColor: '#5A4858' },
  acid:   { name: 'Acid Zombie Corpse',   backgroundColor: '#6FD200' },
  // Non-special types get default corpse name + image:
  crawler:       { name: 'Crawler Corpse' },
  soldier:       { name: 'Soldier Corpse' },
  firefighter:   { name: 'Firefighter Corpse' },
  swat:          { name: 'SWAT Corpse' },
  bomb_disposal: { name: 'Bomb Disposal Corpse' }
};

export function getCorpseOverrides(zombieSubtype) {
  const config = ZombieCorpseConfig[zombieSubtype] || {};
  return {
    name: config.name || 'Zombie Corpse',
    zombieSubtype: zombieSubtype || 'basic',
    ...(config.imageId && { imageId: config.imageId }),
    ...(config.backgroundColor && { backgroundColor: config.backgroundColor })
  };
}

export function getBrainstemOverrides(zombieSubtype) {
  const config = ZombieCorpseConfig[zombieSubtype] || {};
  const hasColor = !!config.backgroundColor;
  const prettyName = hasColor
    ? `${zombieSubtype.charAt(0).toUpperCase() + zombieSubtype.slice(1)} zombie brainstem`
    : 'Zombie brainstem';
  return {
    name: prettyName,
    zombieSubtype: zombieSubtype || 'basic',
    ...(hasColor && { backgroundColor: config.backgroundColor }),
  };
}

export function getBrainPulpOverrides(zombieSubtype) {
  const config = ZombieCorpseConfig[zombieSubtype] || {};
  const hasColor = !!config.backgroundColor;
  const prettyName = hasColor
    ? `${zombieSubtype.charAt(0).toUpperCase() + zombieSubtype.slice(1)} zombie brain pulp`
    : 'Zombie brain pulp';
  return {
    name: prettyName,
    zombieSubtype: zombieSubtype || 'basic',
    ...(hasColor && { backgroundColor: config.backgroundColor }),
  };
}
