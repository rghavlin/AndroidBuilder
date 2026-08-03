// ============================================================================
// ⚠️  GOD-OBJECT UNDER MANAGED DECOMPOSITION — see AGENTS.md §6.
// Do NOT add new responsibilities here. Put new behavior in a system/module
// operating on components, and extract the nearest seam when you touch this
// file. Extraction targets: CODE_QUALITY_ACTION_PLAN.md (Wave 4).
// ============================================================================
import { AISystem } from '../systems/AISystem.js';
import { NPCAISystem } from '../systems/NPCAISystem.js';
import { MovementSystem } from '../systems/MovementSystem.js';
import { CombatSystem } from '../systems/CombatSystem.js';
import { VisionSystem } from '../systems/VisionSystem.js';
import { GameMap } from '../map/GameMap.js';
import engine from '../GameEngine.js';
import { RabbitAI } from '../ai/RabbitAI.js';
import { EntityType } from '../entities/Entity.js';
import { IntentQueue } from './IntentQueue.js';
import { TurretSystem } from '../systems/TurretSystem.js';
import { DroneSystem } from '../systems/DroneSystem.js';
import { FireSystem } from '../systems/FireSystem.js';
import { DestructionSystem } from '../systems/DestructionSystem.js';
import { DestroyIntent } from '../components/DestroyIntent.js';
import { computeHearingZone } from '../utils/PlayerHearing.js';

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

    GameMap.isSimulating = true;

    // Strict UI Decoupling: Ensure UI dirty flag is false during simulation
    if (engine) {
      engine._uiDirty = false;
    }

    try {
      // Fire processing runs under isSimulating so its damage/visual events are
      // deferred to playback like every other system, instead of flashing
      // on-screen before the turn animates.
      // gameMap.processTileFires() ticks only the sparse activeFires index and
      // self-cleans extinguished tiles (vs the old FireSystem full-map scan that
      // leaked activeFires into saves). Entity fires stay on FireSystem.
      gameMap.processTileFires();
      FireSystem.processEntityFires(gameMap);

      const intentQueue = new IntentQueue();
      let npcs = gameMap.getEntitiesByType(EntityType.NPC) || [];
      let zombies = gameMap.getEntitiesByType(EntityType.ZOMBIE) || [];

      // Sensory cleanup: wipe last turn's "heard but not seen" ghost flags so
      // only zombies that are noisy again THIS turn render as silhouettes.
      for (const zombie of zombies) {
        zombie.heardByPlayer = false;
      }

      // Snapshot the player's hearing zone now, before zombies/NPCs act this
      // turn, so noise checks during their phase read a frozen distance map
      // instead of live-recomputing against a moving reference point.
      player.hearingZone = computeHearingZone(player);

      // Performance filter: only process active zombies within sight/range
      const activeDistance = isSleeping ? 80 : 60;
      const npcDistance = isSleeping ? 40 : 30;

      let activeZombies = zombies.filter(z => {
        if (z.hp <= 0) return false;
        const zX = z.logicalX !== undefined ? z.logicalX : z.x;
        const zY = z.logicalY !== undefined ? z.logicalY : z.y;
        const pX = player.logicalX !== undefined ? player.logicalX : player.x;
        const pY = player.logicalY !== undefined ? player.logicalY : player.y;
        
        const dx = Math.abs(zX - pX);
        const dy = Math.abs(zY - pY);
        if (dx < activeDistance && dy < activeDistance) return true;

        return npcs.some(npc => {
          if (!npc || npc.hp <= 0 || npc.hasExited) return false;
          const nX = npc.logicalX !== undefined ? npc.logicalX : npc.x;
          const nY = npc.logicalY !== undefined ? npc.logicalY : npc.y;
          return Math.abs(zX - nX) < npcDistance && Math.abs(zY - nY) < npcDistance;
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

      // --- 0. Drone upkeep ---
      // Runs before turrets so a future autonomous drone can carry a turret
      // into range before it fires this same turn (see systems/DroneSystem.js).
      DroneSystem.process(gameMap, engine, actionQueue);

      // --- 1. Turret Turns ---
      // Runs first, immediately after the player's turn (before zombies, rabbits, NPCs)
      TurretSystem.process(gameMap, engine, actionQueue, { player, zombies, npcs });

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

      // R29#2: the cap used to exit silently — a truncated horde turn dropped
      // entity actions with no signal ("zombies seem sluggish", no evidence).
      if (aiCycleCounter >= maxAICycles && newIntentsGenerated) {
        console.warn(`[SimulationManager] Zombie AI cycle cap (${maxAICycles}) reached with intents still pending — ${ecsEntities.length} entities may have unspent AP this turn.`);
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

      // 3. NPC Turns (ECS intent cycle loop, mirroring the zombie loop above) -
      // runs ONLY after the zombie IntentQueue has completely resolved.
      // Wipe last turn's simulated HP so NPC combat rolls start from real HP.
      zombies.forEach(z => {
        if (z) delete z.simulatedHp;
      });
      for (const npc of npcs) {
        if (npc.hp <= 0) continue;
        if (typeof npc.startTurn === 'function') npc.startTurn();
      }

      // The zombie phase moved entities around, so NPC Vision caches are stale;
      // force a full recompute before any NPC decision is made.
      gameMap._visionDirty = true;

      const npcSimContext = {};
      let npcCycleCounter = 0;
      let npcIntentsGenerated = true;

      while (npcIntentsGenerated && npcCycleCounter < maxAICycles) {
        npcIntentsGenerated = false;

        VisionSystem.process(ecsEntities, engine.worldManager, engine, actionQueue);

        const npcIntentCount = NPCAISystem.process(ecsEntities, engine.worldManager, engine, actionQueue, intentQueue, npcSimContext);

        if (npcIntentCount === 0) {
          break;
        }

        intentQueue.resolve(ecsEntities, engine.worldManager, engine, actionQueue);

        npcIntentsGenerated = true;
        npcCycleCounter++;

        // A pending demand ends the whole NPC phase: the UI pauses on the
        // demand dialog and resumes via executeNPCFollowUp after the response.
        if (npcSimContext.demandPending) {
          console.log(`[SimulationManager] 🚨 NPC Demand detected for NPC ${npcSimContext.demandPending}`);
          break;
        }
      }

      // R29#2: warn on cap overrun (a pending demand is a legitimate early exit,
      // not a truncation).
      if (npcCycleCounter >= maxAICycles && npcIntentsGenerated && !npcSimContext.demandPending) {
        console.warn(`[SimulationManager] NPC AI cycle cap (${maxAICycles}) reached with intents still pending — some NPCs may have unspent AP this turn.`);
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
   * Run a single NPC's remaining turn through the intent pipeline — used for
   * the retaliation that follows a refused demand. Returns the same
   * { success, actions } shape the demand-response UI plays back.
   */
  static executeNPCFollowUp(npc, gameMap, player) {
    const actionQueue = [];
    if (!npc || npc.hp <= 0 || !player || !gameMap) {
      return { success: false, actions: actionQueue };
    }

    GameMap.isSimulating = true;
    try {
      const intentQueue = new IntentQueue();
      const zombies = (gameMap.getEntitiesByType(EntityType.ZOMBIE) || []).filter(z => z && z.hp > 0);
      zombies.forEach(z => delete z.simulatedHp);
      const ecsEntities = [player, npc, ...zombies];
      const simContext = {};

      gameMap._visionDirty = true;

      let cycles = 0;
      const maxCycles = 25;
      while (cycles < maxCycles) {
        VisionSystem.process(ecsEntities, engine.worldManager, engine, actionQueue);
        const intentCount = NPCAISystem.process(ecsEntities, engine.worldManager, engine, actionQueue, intentQueue, simContext);
        if (intentCount === 0) break;
        intentQueue.resolve(ecsEntities, engine.worldManager, engine, actionQueue);
        cycles++;
      }

      // R29#2: warn if the follow-up mini-sim truncated with work still pending.
      if (cycles >= maxCycles) {
        console.warn(`[SimulationManager] NPC follow-up cycle cap (${maxCycles}) reached for ${npc.id} — intents may remain unresolved.`);
      }

      SimulationManager.checkAndProcessDeaths(gameMap, ecsEntities, intentQueue, actionQueue, player);
    } catch (err) {
      console.error(`[SimulationManager] Error in NPC follow-up for ${npc.id}:`, err);
    } finally {
      GameMap.isSimulating = false;
    }

    return { success: true, actions: actionQueue };
  }

  static checkAndProcessDeaths(gameMap, ecsEntities, intentQueue, actionQueue, player) {
    const allEntities = Array.from(gameMap.entityMap.values());
    const checkList = allEntities.filter(e => 
      e && e.id !== player.id && (e.type === EntityType.ZOMBIE || e.type === EntityType.NPC || e.type === EntityType.RABBIT)
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

    // --- Turret Death Cleanup (P2-01) ---
    if (TurretSystem.cleanupDestroyed(gameMap, engine, player)) {
      diedAny = true;
    }

    return diedAny;
  }
}
