import { ZombieAI } from '../ai/ZombieAI.js';
import { NPCAI } from '../ai/NPCAI.js';
import { RabbitAI } from '../ai/RabbitAI.js';
import { EntityType } from '../entities/Entity.js';
import { GameMap } from '../map/GameMap.js';

export class SimulationManager {
  /**
   * Run the AI turns for all entities on the map.
   * @param {GameMap} gameMap - The current map instance
   * @param {Object} context - The simulation context
   * @param {Player} context.player - Current player
   * @param {boolean} context.isSleeping - Whether the player is sleeping
   * @param {number} context.turn - The current turn number
   * @param {Array} context.playerCardinalPositions - Player cardinal positions
   * @param {Set} context.lastSeenTaggedTiles - Sighted tile set
   * @param {Array} context.actionQueue - Queue to push actions into
   */
  static runTurn(gameMap, context) {
    const {
      player,
      isSleeping,
      playerCardinalPositions = [],
      lastSeenTaggedTiles = new Set()
    } = context;

    const actionQueue = [];
    if (!player) return actionQueue;

    GameMap.isSimulating = true;

    try {
      // 1. Zombie Turns
      const zombies = gameMap.getEntitiesByType(EntityType.ZOMBIE || 'zombie');
      const activeZombies = isSleeping
        ? zombies
        : zombies.filter(z => {
            const dx = Math.abs(z.x - player.x);
            const dy = Math.abs(z.y - player.y);
            return dx < 60 && dy < 60;
          });

      activeZombies.forEach(zombie => {
        try {
          zombie.startTurn();
          const turnResult = ZombieAI.executeZombieTurn(
            zombie,
            gameMap,
            player,
            playerCardinalPositions,
            lastSeenTaggedTiles
          );

          if (turnResult.success && turnResult.actions) {
            actionQueue.push(...turnResult.actions);
          }
        } catch (err) {
          console.error(`[SimulationManager] Error processing zombie ${zombie.id}:`, err);
        }
      });

      // 2. Rabbit Turns
      const rabbits = gameMap.getEntitiesByType(EntityType.RABBIT || 'rabbit');
      rabbits.forEach(rabbit => {
        try {
          rabbit.startTurn();
          const turnResult = RabbitAI.executeRabbitTurn(rabbit, gameMap, player, zombies);
          if (turnResult.success && turnResult.actions) {
            actionQueue.push(...turnResult.actions);
          }
        } catch (err) {
          console.error(`[SimulationManager] Error processing rabbit ${rabbit.id}:`, err);
        }
      });

      // 3. NPC Turns
      const npcs = gameMap.getEntitiesByType(EntityType.NPC || 'npc');
      for (const npc of npcs) {
        if (npc.hp <= 0) continue;

        try {
          npc.startTurn();
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
    } finally {
      GameMap.isSimulating = false;
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

