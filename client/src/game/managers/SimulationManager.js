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
      const npcs = gameMap.getEntitiesByType(EntityType.NPC || 'npc');

      // 1. Zombie Turns
      const zombies = gameMap.getEntitiesByType(EntityType.ZOMBIE || 'zombie');
      const activeZombies = isSleeping
        ? zombies
        : zombies.filter(z => {
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

