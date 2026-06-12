import { Entity } from './entities/Entity.js';
import { Position } from './components/Position.js';
import { Health } from './components/Health.js';
import { Renderable } from './components/Renderable.js';
import { Movable } from './components/Movable.js';
import { InventoryContainer } from './components/InventoryContainer.js';
import { AIBehavior } from './components/AIBehavior.js';
import { LightEmitter } from './components/LightEmitter.js';

import { getZombieType } from './entities/ZombieTypes.js';
import { getNPCType } from './entities/NPCTypes.js';
import { Container } from './inventory/Container.js';

export const EntityFactory = {
  createPlayer(x, y) {
    const entity = new Entity(null, 'player', x, y);
    entity.type = 'player';
    entity.name = 'Player';
    entity.blocksMovement = true;

    // Components
    entity.addComponent(new Position({ x, y, level: 0 }));
    entity.addComponent(new Health({ current: 20, max: 20 }));
    entity.addComponent(new Renderable({ spriteId: 'player', color: '#ffffff', zIndex: 2 }));
    entity.addComponent(new Movable({ apCost: 1, baseSpeed: 1 }));
    entity.addComponent(new InventoryContainer({ slots: [], maxWeight: 50, currentWeight: 0 }));

    // Backing stats matching legacy Player constructor
    entity._hp = 20;
    entity.maxHp = 20;
    entity._ap = 20;
    entity.maxAp = 20;
    entity.currentAP = 20;
    entity.maxAP = 20;
    entity._nutrition = 25;
    entity.maxNutrition = 25;
    entity._hydration = 25;
    entity.maxHydration = 25;
    entity._energy = 25;
    entity.maxEnergy = 25;
    entity._condition = 'Normal';
    entity.sickness = 0;
    entity.isBleeding = false;
    entity.isStarving = false;
    entity.isDehydrated = false;
    entity.pendingAPRefill = null;
    
    entity._meleeKills = 0;
    entity.meleeLvl = 0;
    entity._rangedKills = 0;
    entity.rangedLvl = 0;
    entity._craftingApUsed = 0;
    entity.craftingLvl = 0;

    return entity;
  },

  createZombie(x, y, subtype = 'basic', id = null) {
    const typeDef = getZombieType(subtype);
    const entity = new Entity(id, 'zombie', x, y, subtype);
    entity.type = 'zombie';
    entity.subtype = subtype;
    entity.name = typeDef.name;
    entity.blocksMovement = true;

    // Subtype-specific colors for rendering
    let color = '#a6b09c'; // basic grayish green
    if (subtype === 'runner') color = '#e8a3a3'; // reddish
    else if (subtype === 'crawler') color = '#c3b4e6'; // purplish
    else if (subtype === 'fat') color = '#b0c3d9'; // bluish gray
    else if (subtype === 'soldier') color = '#99b898'; // military green
    else if (subtype === 'firefighter') color = '#fecea8'; // bright orange/peach
    else if (subtype === 'swat') color = '#4f5d75'; // dark steel gray
    else if (subtype === 'acid') color = '#a8e6cf'; // toxic green
    else if (subtype === 'spitter') color = '#ffd3b6'; // pale yellow
    else if (subtype === 'bomb_disposal') color = '#393e46'; // charcoal black
    else if (subtype === 'mutant') color = '#ff8b94'; // hot pink/red

    // Components
    entity.addComponent(new Position({ x, y, level: 0 }));
    entity.addComponent(new Health({ current: typeDef.hp, max: typeDef.hp }));
    entity.addComponent(new Movable({ apCost: typeDef.moveCostMultiplier, baseSpeed: 1 }));
    entity.addComponent(new Renderable({ spriteId: typeDef.spriteKey, color: color, zIndex: 1 }));
    entity.addComponent(new AIBehavior({ state: 'idle' }));

    // Backing stats matching legacy Zombie constructor
    entity._hp = typeDef.hp;
    entity.maxHp = typeDef.hp;
    entity._ap = typeDef.maxAP;
    entity.maxAp = typeDef.maxAP;
    entity.currentAP = typeDef.maxAP;
    entity.maxAP = typeDef.maxAP;
    entity.sightRange = typeDef.sightRange || 15;

    return entity;
  },

  createNPC(x, y, isHostile = false, typeId = 'survivor', name = null, id = null) {
    const typeDef = getNPCType(typeId);
    const entity = new Entity(id, 'npc', x, y);
    entity.type = 'npc';
    entity.typeId = typeId;
    entity.name = name || typeDef.name;
    entity.isHostile = isHostile;
    entity.blocksMovement = true;

    // Components
    entity.addComponent(new Position({ x, y, level: 0 }));
    entity.addComponent(new Health({ current: typeDef.hp, max: typeDef.hp }));
    entity.addComponent(new Movable({ apCost: 1, baseSpeed: 1 }));
    entity.addComponent(new Renderable({ spriteId: 'npc', color: '#ffb37e', zIndex: 1 }));
    entity.addComponent(new AIBehavior({ state: 'idle' }));

    // Backing stats matching legacy NPC constructor
    entity._hp = typeDef.hp;
    entity.maxHp = typeDef.hp;
    entity._ap = typeDef.maxAP;
    entity.maxAp = typeDef.maxAP;
    entity.currentAP = typeDef.maxAP;
    entity.maxAP = typeDef.maxAP;
    entity.fleeRecoverChance = typeDef.fleeRecoverChance;
    entity.sightRange = typeDef.sightRange || 18;

    // NPC Inventory
    entity.inventory = new Container({
      id: `${entity.id}_inventory`,
      type: 'npc_inventory',
      name: `${entity.name}'s Inventory`,
      width: 6,
      height: 15,
      autoSort: true
    });

    return entity;
  },

  createFlashlight(x = 0, y = 0) {
    const entity = new Entity(null, 'item', x, y, 'flashlight');
    entity.type = 'item';
    entity.subtype = 'flashlight';
    entity.addComponent(new Position({ x, y, level: 0 }));
    entity.addComponent(new Renderable({ spriteId: 'flashlight', color: '#ffffff', zIndex: 0 }));
    entity.addComponent(new LightEmitter({ radius: 5, intensity: 1.0, color: '#ffffff', isOn: false }));
    entity.addComponent('ItemData', { defId: 'flashlight', weight: 1 });
    return entity;
  }
};
