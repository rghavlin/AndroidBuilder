import { AISystem } from '../systems/AISystem.js';
import { MovementSystem } from '../systems/MovementSystem.js';
import { CombatSystem } from '../systems/CombatSystem.js';
import { VisionSystem } from '../systems/VisionSystem.js';
import { GameMap } from '../map/GameMap.js';
import engine from '../GameEngine.js';
import { NPCAI } from '../ai/NPCAI.js';
import { RabbitAI } from '../ai/RabbitAI.js';
import { EntityType } from '../entities/Entity.js';
import { IntentQueue } from './IntentQueue.js';
import { createItemFromDef } from '../inventory/ItemDefs.js';
import { TurretAI } from '../ai/TurretAI.js';
import { FireSystem } from '../systems/FireSystem.js';
import { DestructionSystem } from '../systems/DestructionSystem.js';
import { DestroyIntent } from '../components/DestroyIntent.js';

export class SimulationManager {
  /**
   * Run the turn processing for all systems sequentially.
   * @param {GameMap} gameMap - The current map instance
   * @param {Object} context - The simulation context
   * @param {Player} context.player - Current player
   */
  static runTurn(gameMap, context) {
    const { player, isSleeping } = context;
    const actionQueue = [];
    if (!player) return actionQueue;

    if (player) {
      FireSystem.processTileFires(gameMap);
      FireSystem.processEntityFires(gameMap);
    }

    GameMap.isSimulating = true;

    // Strict UI Decoupling: Ensure UI dirty flag is false during simulation
    if (engine) {
      engine._uiDirty = false;
    }

    try {
      const intentQueue = new IntentQueue();
      let npcs = gameMap.getEntitiesByType(EntityType.NPC) || [];
      let zombies = gameMap.getEntitiesByType(EntityType.ZOMBIE) || [];

      // Performance filter: only process active zombies within sight/range
      let activeZombies = isSleeping
        ? zombies
        : zombies.filter(z => {
            if (z.hp <= 0) return false;
            const zX = z.logicalX !== undefined ? z.logicalX : z.x;
            const zY = z.logicalY !== undefined ? z.logicalY : z.y;
            const pX = player.logicalX !== undefined ? player.logicalX : player.x;
            const pY = player.logicalY !== undefined ? player.logicalY : player.y;
            
            const dx = Math.abs(zX - pX);
            const dy = Math.abs(zY - pY);
            if (dx < 60 && dy < 60) return true;

            return npcs.some(npc => {
              if (!npc || npc.hp <= 0 || npc.hasExited) return false;
              const nX = npc.logicalX !== undefined ? npc.logicalX : npc.x;
              const nY = npc.logicalY !== undefined ? npc.logicalY : npc.y;
              return Math.abs(zX - nX) < 30 && Math.abs(zY - nY) < 30;
            });
          });

      // Construct entity list for ECS systems
      let ecsEntities = [player, ...activeZombies, ...npcs];

      const runDeathCheck = () => {
        if (SimulationManager.checkAndProcessDeaths(gameMap, ecsEntities, intentQueue, actionQueue, player)) {
          activeZombies = activeZombies.filter(z => z.hp > 0 && gameMap.getEntity(z.id));
          npcs = npcs.filter(n => n.hp > 0 && gameMap.getEntity(n.id));
          zombies = zombies.filter(z => z.hp > 0 && gameMap.getEntity(z.id));
          ecsEntities = ecsEntities.filter(e => e.id === player.id || (e.hp > 0 && gameMap.getEntity(e.id)));
        }
      };

      // --- 1. Turret Turns ---
      // Runs first, immediately after the player's turn (before zombies, rabbits, NPCs)
      const playerX = player ? player.logicalX : null;
      const playerY = player ? player.logicalY : null;
      // Fire one item if it is an active turret, OR recurse into its container
      // (vehicles/wagons can carry a turret in their grid). Shared by the on-map
      // scan and the ground-container scan so both behave identically.
      const fireTurretFromItem = (item, atX, atY) => {
        if (!item) return;
        if (item.defId === 'placeable.auto_turret' && item.isOn) {
          const result = TurretAI.executeTurretTurn(item, atX, atY, gameMap, zombies);
          if (result.actions?.length) actionQueue.push(...result.actions);
          return;
        }
        if (item.containerGrid) {
          const nestedItems = item.containerGrid.items instanceof Map
            ? Array.from(item.containerGrid.items.values())
            : (Array.isArray(item.containerGrid.items) ? item.containerGrid.items : Object.values(item.containerGrid.items || {}));
          for (const nestedItem of nestedItems) {
            fireTurretFromItem(nestedItem, atX, atY);
          }
        }
      };

      // On-map items (placed turrets, vehicles on the ground away from the player).
      for (const item of gameMap.getEntitiesByType('item')) {
        if (!item) continue;
        const itemX = item.logicalX !== undefined ? item.logicalX : playerX;
        const itemY = item.logicalY !== undefined ? item.logicalY : playerY;
        fireTurretFromItem(item, itemX, itemY);
      }

      // Player's ground container. When the player stands ON a turret's tile (or a
      // wagon carrying one), that tile's items are loaded into the ground container
      // and detached from the map's entityMap, so the on-map scan above would miss
      // them. Fire those from the player's tile, recursing into wagons/containers.
      const groundItems = engine?.inventoryManager?.groundContainer?.getAllItems?.() || [];
      for (const item of groundItems) {
        fireTurretFromItem(item, playerX, playerY);
      }

      // --- 2. Replenish AP for active zombies ---
      activeZombies.forEach(z => {
        if (typeof z.startTurn === 'function') z.startTurn();
      });

      // Checkpoint 1: Run death check after startTurn fire damage and turret turns
      runDeathCheck();

      // Force a full vision refresh at the start of the turn. The player's move
      // happened on the player's turn and does NOT dirty stationary entities'
      // Vision components (only an entity's own movement / door / explosion does).
      // Without this, a stationary zombie's cached visibleEntities is stale and
      // excludes the player even when it now has clear line of sight, so it never
      // enters HUNTING and just stands there. Dirtying globally makes VisionSystem
      // recompute every active entity once before any AI decision is made.
      gameMap._visionDirty = true;

      // Sequential system execution in a loop to handle multi-step turns (AI AP consumption)
      let aiCycleCounter = 0;
      const maxAICycles = 50; // Allow entities to take up to 50 steps if they have AP (safely breaks early if AP spent)
      let newIntentsGenerated = true;

      while (newIntentsGenerated && aiCycleCounter < maxAICycles) {
        newIntentsGenerated = false;

        // Run VisionSystem to update entity visibility arrays before AI makes decisions
        VisionSystem.process(ecsEntities, engine.worldManager, engine, actionQueue);

        // Run the AISystem to evaluate behaviors and queue MoveIntent / DamageIntent directly
        const initialIntentCount = AISystem.process(ecsEntities, engine.worldManager, engine, actionQueue, intentQueue);

        // If no intents were generated, we are done with AI decision cycles
        if (initialIntentCount === 0) {
          break;
        }

        // Run the IntentQueue to absolute completion (resolving all starting and cascading intents)
        intentQueue.resolve(ecsEntities, engine.worldManager, engine, actionQueue);

        newIntentsGenerated = true;
        aiCycleCounter++;
      }

      // Checkpoint 2: Run death check after AI cycle loop completes
      runDeathCheck();

      // 2. Legacy Processing (Rabbit Turns) - Runs ONLY after IntentQueue has completely resolved
      const rabbits = gameMap.getEntitiesByType(EntityType.RABBIT) || [];
      const rabbitsToProcess = [...rabbits];
      rabbitsToProcess.forEach(rabbit => {
        if (rabbit.hp <= 0) return;
        try {
          if (typeof rabbit.startTurn === 'function') rabbit.startTurn();
          if (rabbit.hp <= 0) {
            return;
          }
          const turnResult = RabbitAI.executeRabbitTurn(rabbit, gameMap, player, zombies);
          if (turnResult.success && turnResult.actions) {
            actionQueue.push(...turnResult.actions);
          }
        } catch (err) {
          console.error(`[SimulationManager] Error processing rabbit ${rabbit.id}:`, err);
        }
      });

      // 3. Legacy Processing (NPC Turns) - Runs ONLY after IntentQueue has completely resolved
      const npcsToProcess = [...npcs];
      for (const npc of npcsToProcess) {
        if (npc.hp <= 0) continue;

        try {
          if (typeof npc.startTurn === 'function') npc.startTurn();
          if (npc.hp <= 0) {
            continue;
          }
          const turnResult = NPCAI.executeNPCTurn(npc, gameMap, player, zombies);

          if (turnResult.success && turnResult.actions) {
            actionQueue.push(...turnResult.actions);
            const hasDemand = turnResult.actions.some(a => a.type === 'DEMAND');
            if (hasDemand) {
              console.log(`[SimulationManager] 🚨 NPC Demand detected for NPC ${npc.id}`);
              break;
            }
          }
        } catch (err) {
          console.error(`[SimulationManager] Error processing NPC ${npc.id}:`, err);
        }
      }

      // Checkpoint 3: Run death check at the end of the simulation
      runDeathCheck();

      // 5. Vision System Update
      VisionSystem.process(ecsEntities, engine.worldManager, engine, actionQueue);

    } catch (err) {
      console.error(`[SimulationManager] Error running systems turn processing:`, err);
    } finally {
      GameMap.isSimulating = false;
      
      // Strict UI Decoupling: simulation is absolute, flip _uiDirty to true
      if (engine) {
        engine._uiDirty = true;
      }
    }

    return actionQueue;
  }

  /**
   * Pass-through for single NPC turn execution (e.g. for retaliation retry)
   */
  static executeNPCTurn(npc, gameMap, player, zombies, skipAPReset = false) {
    return NPCAI.executeNPCTurn(npc, gameMap, player, zombies, skipAPReset);
  }

  /**
   * Statically processes deaths for all entities except the player.
   */
  static checkAndProcessDeaths(gameMap, ecsEntities, intentQueue, actionQueue, player) {
    const allEntities = Array.from(gameMap.entityMap.values());
    const checkList = allEntities.filter(e => 
      e && e.id !== player.id && (e.type === 'zombie' || e.type === 'npc' || e.type === 'rabbit' || e.type === EntityType.ZOMBIE || e.type === EntityType.NPC || e.type === EntityType.RABBIT)
    );

    let diedAny = false;
    for (const entity of checkList) {
      if (entity.hp <= 0 || (typeof entity.isDead === 'function' && entity.isDead())) {
        if (gameMap.getEntity(entity.id)) {
          console.log(`[SimulationManager] Entity ${entity.id} (${entity.type}) died during turn simulation.`);
          DestructionSystem.resolve(
            new DestroyIntent({ entityId: entity.id }),
            ecsEntities,
            gameMap,
            intentQueue,
            actionQueue
          );
          diedAny = true;
        }
      }
    }
    return diedAny;
  }
}
