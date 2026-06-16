import fs from 'fs';
import path from 'path';

const filepath = path.resolve('client/src/game/entities/Entity.js');
let content = fs.readFileSync(filepath, 'utf8');

// Normalize line endings
content = content.replace(/\r\n/g, '\n');

// Phase 1: Sync inventory restore
content = content.replace(
`    if (data.inventory) {
      import('../inventory/Container.js').then(({ Container }) => {
        entity.inventory = Container.fromJSON(data.inventory);
      }).catch(err => console.error("Failed to load Container:", err));
    }`,
`    if (data.inventory) {
      entity.inventory = Container.fromJSON(data.inventory);
    }`
);

// Phase 2B: recordKill and onItemCrafted
content = content.replace(
`  onItemCrafted(apUsed = 1) {
    this.craftingApUsed += apUsed;
    const nextTarget = 10 * Math.pow(2, this.craftingLvl);
    if (this.craftingApUsed >= nextTarget) {
      this.craftingLvl++;
    }
    this.notifyChange();
  }`,
`  onItemCrafted(apUsed = 1) {
    this.craftingApUsed += apUsed;
    const nextTarget = PlayerSkills.getNextCraftingTarget(this.craftingLvl);
    if (this.craftingApUsed >= nextTarget) {
      this.craftingLvl++;
    }
    this.notifyChange();
  }`
);

content = content.replace(
`  recordKill(type) {
    const isMelee = type === 'melee';
    const currentLevel = isMelee ? this.meleeLvl : this.rangedLvl;
    this.modifyStat(isMelee ? 'meleeKills' : 'rangedKills', 1);
    
    const nextMilestone = 5 * Math.pow(2, currentLevel);
    if (this[isMelee ? 'meleeKills' : 'rangedKills'] >= nextMilestone) {
      const newLevel = currentLevel + 1;
      this.setStat(isMelee ? 'meleeLvl' : 'rangedLvl', newLevel);
      return newLevel;
    }
    return null;
  }`,
`  recordKill(type) {
    const isMelee = type === 'melee';
    const currentLevel = isMelee ? this.meleeLvl : this.rangedLvl;
    this.modifyStat(isMelee ? 'meleeKills' : 'rangedKills', 1);
    const nextMilestone = PlayerSkills.getNextKillMilestone(currentLevel);
    if (this[isMelee ? 'meleeKills' : 'rangedKills'] >= nextMilestone) {
      const newLevel = currentLevel + 1;
      this.setStat(isMelee ? 'meleeLvl' : 'rangedLvl', newLevel);
      return newLevel;
    }
    return null;
  }`
);

// Phase 2C: toJSON component iteration
content = content.replace(
`    return {
      id: this.id,
      type: this.type,
      x: this.gridX,
      y: this.gridY,`,
`    return {
      id: this.id,
      type: this.type,
      x: this.gridX,
      y: this.gridY,
      components: Object.fromEntries(
        [...this.components].map(([name, comp]) => [name, typeof comp.toJSON === 'function' ? comp.toJSON() : comp])
      ),`
);

// Phase 3: Burnable component registration
content = content.replace(
`  PlayerSkills,
  AIState,`,
`  PlayerSkills,
  AIState,
  Burnable,`
);

if (!content.includes('import { Burnable }')) {
  content = content.replace(
    `import { AIState } from '../components/AIState.js';`,
    `import { AIState } from '../components/AIState.js';\nimport { Burnable } from '../components/Burnable.js';`
  );
}

// Phase 3: Burnable Facade and constructor removal
content = content.replace(`    this.fireTurns = 0;\n`, ``);
content = content.replace(`      fireTurns: this.fireTurns,\n`, ``);
content = content.replace(`    if (data.fireTurns !== undefined) entity.fireTurns = data.fireTurns;\n`, ``);

const burnableFacade = `
  // Burnable Facades
  get fireTurns() { const b = this.getComponent('Burnable'); return b ? b.fireTurns : 0; }
  set fireTurns(val) { 
    const b = this.getComponent('Burnable'); 
    if (b) { 
      b.fireTurns = val; 
      this.notifyChange(); 
    } else { 
      this.addComponent(new Burnable({fireTurns: val})); 
    }
  }
`;

content = content.replace(
  `  get stunnedTurns() { const ai = this.getComponent('AIState'); return ai ? ai.stunnedTurns : 0; }\n  set stunnedTurns(val) { const ai = this.getComponent('AIState'); if (ai) { ai.stunnedTurns = val; this.notifyChange(); } }`,
  `  get stunnedTurns() { const ai = this.getComponent('AIState'); return ai ? ai.stunnedTurns : 0; }\n  set stunnedTurns(val) { const ai = this.getComponent('AIState'); if (ai) { ai.stunnedTurns = val; this.notifyChange(); } }\n${burnableFacade}`
);

// Phase 3: Remove fire logic from startTurn
content = content.replace(
`    if (this.fireTurns > 0 && (this.type === 'player' || this.type === 'zombie' || this.type === 'npc' || this.type === 'rabbit')) {
      this.fireTurns--;
      const fireDamage = Math.floor(Math.random() * 4) + 2; // 2-5 damage
      this.takeDamage(fireDamage, { id: 'fire', type: 'hazard' });
    }`,
``
);

// Phase 3: Remove fire logic from moveTo
content = content.replace(
`    const gameMap = engine ? engine.gameMap : null;
    if (gameMap && (this.type === 'player' || this.type === 'zombie' || this.type === 'npc' || this.type === 'rabbit')) {
      const tile = gameMap.getTile(x, y);
      if (tile && tile.fireTurns > 0) {
        this.fireTurns = 2;
        const fireDamage = Math.floor(Math.random() * 4) + 2; // 2-5 damage
        this.takeDamage(fireDamage, { id: 'fire_tile', type: 'hazard' });
      }
    }`,
``
);

fs.writeFileSync(filepath, content, 'utf8');
console.log("Done fixing Entity.js");
