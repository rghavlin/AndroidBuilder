import { Entity, COMPONENT_CLASSES } from './entities/Entity.js';
import { Position } from './components/Position.js';
import { Health } from './components/Health.js';
import { Renderable } from './components/Renderable.js';
import { Movable } from './components/Movable.js';
import { InventoryContainer } from './components/InventoryContainer.js';
import { AIBehavior } from './components/AIBehavior.js';
import { AIState } from './components/AIState.js';
import { LightEmitter } from './components/LightEmitter.js';
import { Vision } from './components/Vision.js';
import { Inventory } from './components/Inventory.js';
import { ActionPoints } from './components/ActionPoints.js';
import { SurvivalStats } from './components/SurvivalStats.js';
import { PlayerSkills } from './components/PlayerSkills.js';
import { PlayerWallet } from './components/PlayerWallet.js';
import { Burnable } from './components/Burnable.js';
import { RpgStats } from './components/RpgStats.js';
import { ActiveDefense } from './components/ActiveDefense.js';

import { getZombieType } from './entities/ZombieTypes.js';
import { getNPCType } from './entities/NPCTypes.js';
import { Container } from './inventory/Container.js';
import { BlueprintRegistry } from './BlueprintRegistry.js';

export const EntityFactory = {
  createPlayer(x, y) {
    const entity = new Entity(null, 'player', x, y);
    entity.type = 'player';
    entity.name = 'Player';
    entity.factionId = 'player';
    entity.blocksMovement = true;

    // Components
    entity.addComponent(new Position({ x, y, level: 0 }));
    entity.addComponent(new Health({ current: 20, max: 20 }));
    entity.addComponent(new Renderable({ spriteId: 'player', color: '#ffffff', zIndex: 2 }));
    entity.addComponent(new Movable({ apCost: 1, baseSpeed: 1 }));
    entity.addComponent(new InventoryContainer({ slots: [], maxWeight: 50, currentWeight: 0 }));
    entity.addComponent(new Inventory({ items: [], maxWeight: 50, maxSlots: 20 }));
    entity.addComponent(new Vision({ range: 15 }));
    entity.addComponent(new ActionPoints({ current: 20, max: 20 }));
    entity.addComponent(new SurvivalStats({
      nutrition: 25,
      maxNutrition: 25,
      hydration: 25,
      maxHydration: 25,
      energy: 25,
      maxEnergy: 25,
      condition: 'Normal',
      sickness: 0,
      isBleeding: false,
      isStarving: false,
      isDehydrated: false
    }));
    entity.addComponent(new PlayerSkills({
      meleeKills: 0,
      meleeLvl: 0,
      rangedKills: 0,
      rangedLvl: 0,
      craftingApUsed: 0,
      craftingLvl: 0
    }));
    entity.addComponent(new PlayerWallet({ earbucks: 0 }));
    entity.addComponent(new Burnable({ fireTurns: 0 }));
    entity.addComponent(new RpgStats({
      baseStrength: 20,
      currentStrength: 20,
      baseAgility: 40,
      currentAgility: 40,
      basePerception: 20,
      currentPerception: 20
    }));
    entity.addComponent(new ActiveDefense({ defensesThisTurn: 0, diminishingRate: 0.10 }));

    return entity;
  },

  createZombie(x, y, subtype = 'basic', id = null) {
    const typeDef = getZombieType(subtype);
    const entity = new Entity(id, 'zombie', x, y, subtype);
    entity.type = 'zombie';
    entity.subtype = subtype;
    entity.name = typeDef.name;
    entity.factionId = 'zombies';
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
    entity.addComponent(new AIState({ behaviorState: 'idle' }));
    entity.addComponent(new Vision({ range: typeDef.sightRange || 15 }));
    entity.addComponent(new ActionPoints({ current: typeDef.maxAP, max: typeDef.maxAP }));
    entity.addComponent(new Burnable({ fireTurns: 0, fireResistance: subtype === 'firefighter' ? 2 : 0 }));

    // Backing stats matching legacy Zombie constructor
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
    entity.factionId = typeDef.factionId || 'survivors';
    entity.blocksMovement = true;

    // Components
    entity.addComponent(new Position({ x, y, level: 0 }));
    entity.addComponent(new Health({ current: typeDef.hp, max: typeDef.hp }));
    entity.addComponent(new Movable({ apCost: 1, baseSpeed: 1 }));
    entity.addComponent(new Renderable({ spriteId: 'npc', color: '#ffb37e', zIndex: 1 }));
    entity.addComponent(new AIBehavior({ state: 'idle' }));
    entity.addComponent(new AIState({ behaviorState: 'idle' }));
    entity.addComponent(new Vision({ range: typeDef.sightRange || 18 }));
    entity.addComponent(new ActionPoints({ current: typeDef.maxAP, max: typeDef.maxAP }));
    entity.addComponent(new Burnable({ fireTurns: 0 }));
    entity.addComponent(new RpgStats({
      baseStrength: 20,
      currentStrength: 20,
      baseAgility: 40,
      currentAgility: 40,
      basePerception: 20,
      currentPerception: 20
    }));
    entity.addComponent(new ActiveDefense({ defensesThisTurn: 0, diminishingRate: 0.10 }));

    // Backing stats matching legacy NPC constructor
    entity.fleeRecoverChance = typeDef.fleeRecoverChance;
    entity.sightRange = typeDef.sightRange || 18;

    // NPC Inventory
    const isTollGuard = typeId === 'gatekeeper' || (id && id.startsWith('tollguard_'));
    entity.inventory = new Container({
      id: `${entity.id}_inventory`,
      type: 'npc_inventory',
      name: `${entity.name}'s Inventory`,
      width: isTollGuard ? 12 : 6,
      height: isTollGuard ? 8 : 15,
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
    entity.precomputeItemFlags();
    return entity;
  },

  assembleFromBlueprint(blueprintId) {
    const blueprint = BlueprintRegistry.get(blueprintId);
    if (!blueprint) {
      throw new Error(`Blueprint ${blueprintId} not found in BlueprintRegistry`);
    }

    const type = blueprint.type || (blueprint.components && blueprint.components.Item ? 'item' : 'npc');
    const entity = new Entity(null, type);
    entity.defId = blueprintId;
    entity.name = blueprint.name || blueprint.id;
    if (blueprint.subtype) {
      entity.subtype = blueprint.subtype;
    }

    if (blueprint.components) {
      for (const [componentName, componentData] of Object.entries(blueprint.components)) {
        const ComponentClass = COMPONENT_CLASSES[componentName];
        if (ComponentClass) {
          let finalData = { ...componentData };
          if (componentName === 'Renderable') {
            if (componentData.sprite && !componentData.spriteId) {
              finalData.spriteId = componentData.sprite;
            }
          }
          entity.addComponent(new ComponentClass(finalData));
        } else {
          entity.addComponent(componentName, componentData);
        }
      }
    }

    if (entity.type === 'item') {
      entity.precomputeItemFlags();
    }

    return entity;
  }
};
