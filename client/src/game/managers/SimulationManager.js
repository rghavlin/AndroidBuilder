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

    if (typeof gameMap.processTileFires === 'function') {
      gameMap.processTileFires();
    }

    GameMap.isSimulating = true;

    // Strict UI Decoupling: Ensure UI dirty flag is false during simulation
    if (engine) {
      engine._uiDirty = false;
    }

    try {
      let npcs = gameMap.getEntitiesByType(EntityType.NPC || 'npc') || [];
      let zombies = gameMap.getEntitiesByType(EntityType.ZOMBIE || 'zombie') || [];

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

      const checkAndProcessDeaths = () => {
        const allEntities = Array.from(gameMap.entityMap.values());
        const checkList = allEntities.filter(e => 
          e && e.id !== player.id && (e.type === 'zombie' || e.type === 'npc' || e.type === 'rabbit' || e.type === EntityType.ZOMBIE || e.type === EntityType.NPC || e.type === EntityType.RABBIT)
        );

        let diedAny = false;
        for (const entity of checkList) {
          if (entity.hp <= 0 || (typeof entity.isDead === 'function' && entity.isDead())) {
            if (gameMap.getEntity(entity.id)) {
              console.log(`[SimulationManager] Entity ${entity.id} (${entity.type}) died during turn simulation.`);

              if (typeof entity.die === 'function') {
                entity.die();
              }

              const ex = entity.logicalX !== undefined ? entity.logicalX : (entity.x || 0);
              const ey = entity.logicalY !== undefined ? entity.logicalY : (entity.y || 0);

              if (entity.type === 'zombie' || entity.type === EntityType.ZOMBIE) {
                const lootGenerator = engine.lootGenerator;
                const hasWindow = gameMap.getTile(ex, ey)?.contents.some(e => e.type === 'window' || e.type === EntityType.WINDOW);
                if (lootGenerator && !hasWindow && Math.random() < 0.75) {
                  const loot = lootGenerator.generateZombieLoot(entity.subtype, gameMap.mapNumber);
                  if (loot && loot.length > 0) {
                    gameMap.addItemsToTile(ex, ey, loot);
                  }
                }
              } else if (entity.type === 'npc' || entity.type === EntityType.NPC) {
                const items = entity.inventory ? entity.inventory.getAllItems() : [];
                if (items.length > 0) {
                  gameMap.addItemsToTile(ex, ey, items);
                  entity.inventory.clear();
                }
              } else if (entity.type === 'rabbit' || entity.type === EntityType.RABBIT) {
                const meat = createItemFromDef('food.raw_meat');
                if (meat) {
                  gameMap.addItemsToTile(ex, ey, [meat]);
                }
              }

              gameMap.removeEntity(entity.id);

              actionQueue.push({
                type: 'DEATH',
                entityId: entity.id,
                data: {
                  x: ex,
                  y: ey,
                  entityType: entity.type
                }
              });

              diedAny = true;
            }
          }
        }

        if (diedAny) {
          activeZombies = activeZombies.filter(z => z.hp > 0);
          npcs = npcs.filter(n => n.hp > 0);
          zombies = zombies.filter(z => z.hp > 0);
          ecsEntities = ecsEntities.filter(e => e.id === player.id || e.hp > 0);

          const remainingZombies = gameMap.getEntitiesByType('zombie');
          remainingZombies.forEach(z => {
            if (z.currentTarget && !gameMap.getEntity(z.currentTarget.id)) {
              z.currentTarget = null;
              z.behaviorState = 'idle';
            }
          });
        }
      };

      // --- 1. Turret Turns ---
      // Runs first, immediately after the player's turn (before zombies, rabbits, NPCs)
      const playerX = player ? player.logicalX : null;
      const playerY = player ? player.logicalY : null;
      const groundItems = (engine && engine.inventoryManager && engine.inventoryManager.groundContainer)
        ? engine.inventoryManager.groundContainer.getAllItems()
        : [];

      for (let y = 0; y < gameMap.height; y++) {
        for (let x = 0; x < gameMap.width; x++) {
          const tile = gameMap.getTile(x, y);
          if (tile) {
            const isPlayerTile = (playerX !== null && playerY !== null && x === playerX && y === playerY);
            const items = isPlayerTile ? groundItems : (tile.inventoryItems || []);
            
            if (items && items.length > 0) {
              for (const item of items) {
                 if (item.defId === 'placeable.auto_turret' && item.isOn) {
                    const result = TurretAI.executeTurretTurn(item, x, y, gameMap, zombies);
                    if (result.actions?.length) actionQueue.push(...result.actions);
                 } else if (item.containerGrid) {
                    // Check inside vehicle's container grid for turrets
                    const nestedItems = item.containerGrid.items instanceof Map 
                       ? Array.from(item.containerGrid.items.values()) 
                       : (Array.isArray(item.containerGrid.items) ? item.containerGrid.items : Object.values(item.containerGrid.items || {}));
                    
                    for (const nestedItem of nestedItems) {
                       if (nestedItem.defId === 'placeable.auto_turret' && nestedItem.isOn) {
                          const result = TurretAI.executeTurretTurn(nestedItem, x, y, gameMap, zombies);
                          if (result.actions?.length) actionQueue.push(...result.actions);
                       }
                    }
                 }
              }
            }
          }
        }
      }
      checkAndProcessDeaths();

      // --- 2. Replenish AP for active zombies ---
      activeZombies.forEach(z => {
        if (typeof z.startTurn === 'function') z.startTurn();
      });

      // Check for deaths after startTurn fire damage
      checkAndProcessDeaths();

      // Instantiate the centralized Intent Queue
      const intentQueue = new IntentQueue();

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

        // Check for deaths after move intents (which might trigger stepping on fire/hazards)
        checkAndProcessDeaths();

        newIntentsGenerated = true;
        aiCycleCounter++;
      }

      // 2. Legacy Processing (Rabbit Turns) - Runs ONLY after IntentQueue has completely resolved
      const rabbits = gameMap.getEntitiesByType(EntityType.RABBIT || 'rabbit') || [];
      const rabbitsToProcess = [...rabbits];
      rabbitsToProcess.forEach(rabbit => {
        if (rabbit.hp <= 0) return;
        try {
          if (typeof rabbit.startTurn === 'function') rabbit.startTurn();
          if (rabbit.hp <= 0) {
            checkAndProcessDeaths();
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
      checkAndProcessDeaths();

      // 3. Legacy Processing (NPC Turns) - Runs ONLY after IntentQueue has completely resolved
      const npcsToProcess = [...npcs];
      for (const npc of npcsToProcess) {
        if (npc.hp <= 0) continue;

        try {
          if (typeof npc.startTurn === 'function') npc.startTurn();
          if (npc.hp <= 0) {
            checkAndProcessDeaths();
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
      checkAndProcessDeaths();

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
}
