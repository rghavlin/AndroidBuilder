/**
 * Player-Centric Zombie Tracking System
 * Only tracks zombies that are visible to the player to optimize performance
 * and set LastSeen flags appropriately when zombies leave player's sight
 */

import { LineOfSight } from '../utils/LineOfSight.js';
import GameEvents, { GAME_EVENT } from '../utils/GameEvents.js';

export class PlayerZombieTracker {
  constructor() {
    // Map of zombie IDs that are currently spotted by the player
    // Key: zombieId, Value: { zombie, lastPlayerPos }
    this.spottedZombies = new Map();
  }

  /**
   * Update tracking based on player's current field of view
   * Called whenever the player moves or field of view changes
   * @param {GameMap} gameMap - The game map
   * @param {Player} player - The player entity
   * @param {Array} playerFieldOfView - Player's current field of view tiles
   * @param {Object} playerMovement - Player movement data {from, to} (optional)
   */
  updateTracking(gameMap, player, playerFieldOfView, playerMovement = null) {
    if (!gameMap || !player || !playerFieldOfView) {
      console.warn('[PlayerZombieTracker] Invalid parameters for updateTracking');
      return;
    }

    // Get all zombies currently visible to the player
    const currentlyVisibleZombies = this.getVisibleZombies(gameMap, player, playerFieldOfView);

    // Process newly spotted zombies
    this.processNewlySpottedZombies(currentlyVisibleZombies, player);

    // IMPORTANT: Update tracked zombies BEFORE checking for lost sight
    // This ensures we have the most recent player position for each zombie
    this.updateTrackedZombies(currentlyVisibleZombies, player);

    // Process zombies that have left player's sight
    this.processZombiesLostFromSight(currentlyVisibleZombies, player, playerMovement);
  }

  /**
   * Get all zombies visible to the player
   * @param {GameMap} gameMap - The game map
   * @param {Player} player - The player entity
   * @param {Array} playerFieldOfView - Player's current field of view tiles
   * @returns {Array} Array of visible zombie objects with sight info
   */
  getVisibleZombies(gameMap, player, playerFieldOfView) {
    const visibleZombies = [];

    // Check all zombies on the map to see if they can spot the player
    // This fixes the issue where zombies with longer sight range than the player's FOV were ignored
    const allZombies = gameMap.getEntitiesByType('zombie');
    
    allZombies.forEach(zombie => {
      const distanceToPlayer = zombie.getDistanceTo(player.x, player.y);

      // Fast-fail if player is outside this zombie's maximum sight range
      if (distanceToPlayer <= zombie.sightRange) {
        // Verify actual line of sight
        const zombieCanSeePlayer = zombie.canSeeEntity(gameMap, player);

        if (zombieCanSeePlayer) {
          visibleZombies.push({
            zombie,
            distance: distanceToPlayer,
            position: { x: zombie.x, y: zombie.y }
          });
        }
      }
    });

    return visibleZombies;
  }

  /**
   * Process zombies that are newly visible to the player
   * @param {Array} currentlyVisibleZombies - Zombies currently visible
   * @param {Player} player - The player entity
   */
  processNewlySpottedZombies(currentlyVisibleZombies, player) {
    currentlyVisibleZombies.forEach(({ zombie }) => {
      if (!this.spottedZombies.has(zombie.id)) {
        // Newly spotted zombie
        this.spottedZombies.set(zombie.id, {
          zombie,
          lastPlayerPos: { x: player.x, y: player.y }
        });

        // Trigger alert state
        if (!zombie.isAlerted) {
          zombie.isAlerted = true;
          GameEvents.emit(GAME_EVENT.ZOMBIE_ALERTED, { zombie });
        }

        // Reduced logging frequency - only log newly spotted zombies
        if (Math.random() < 0.1) { // Only log 10% of the time to reduce spam
          console.log(`[PlayerZombieTracker] Zombie ${zombie.id} newly spotted by player at (${player.x}, ${player.y})`);
        }
      }
    });
  }

  /**
   * Process zombies that have left the player's sight
   * @param {Array} currentlyVisibleZombies - Zombies currently visible
   * @param {Player} player - The player entity
   * @param {Object} playerMovement - Player movement data {from, to}
   */
  processZombiesLostFromSight(currentlyVisibleZombies, player, playerMovement) {
    const currentVisibleIds = new Set(currentlyVisibleZombies.map(({ zombie }) => zombie.id));

    // Check previously spotted zombies
    for (const [zombieId, trackedData] of this.spottedZombies.entries()) {
      if (!currentVisibleIds.has(zombieId)) {
        // Zombie is no longer visible - Trigger 'lastSeen' flag and record LKP
        // The zombie's own turn logic will now follow the scent trail or this LKP
        const { zombie, lastPlayerPos } = trackedData;
        zombie.setTargetSighted(lastPlayerPos.x, lastPlayerPos.y);
        
        console.log(`[PlayerZombieTracker] Zombie ${zombieId} lost sight of player at (${lastPlayerPos.x}, ${lastPlayerPos.y}), enabled search mode`);

        // Remove from tracking since no longer visible
        this.spottedZombies.delete(zombieId);
      }
    }
  }

  /**
   * Update tracking data for zombies still in sight
   * @param {Array} currentlyVisibleZombies - Zombies currently visible
   * @param {Player} player - The player entity
   */
  updateTrackedZombies(currentlyVisibleZombies, player) {
    currentlyVisibleZombies.forEach(({ zombie }) => {
      if (this.spottedZombies.has(zombie.id)) {
        // Update last known player position
        this.spottedZombies.set(zombie.id, {
          zombie,
          lastPlayerPos: { x: player.x, y: player.y }
        });
      }
    });
  }

  /**
   * Get list of currently spotted zombie IDs
   * @returns {Array} Array of zombie IDs currently being tracked
   */
  getSpottedZombieIds() {
    return Array.from(this.spottedZombies.keys());
  }

  /**
   * Check if a specific zombie is currently spotted
   * @param {string} zombieId - The zombie ID to check
   * @returns {boolean} Whether the zombie is currently spotted
   */
  isZombieSpotted(zombieId) {
    return this.spottedZombies.has(zombieId);
  }

  /**
   * Get count of currently spotted zombies
   * @returns {number} Number of zombies currently being tracked
   */
  getSpottedZombieCount() {
    return this.spottedZombies.size;
  }

  /**
   * Clear all tracking data (useful for game reset)
   */
  clearAllTracking() {
    this.spottedZombies.clear();
    console.log('[PlayerZombieTracker] All zombie tracking cleared');
  }

  /**
   * Update only current visibility tracking without setting LastSeen positions
   * Used after path-based LastSeen tracking has already been handled
   * @param {GameMap} gameMap - The game map
   * @param {Player} player - The player entity
   * @param {Array} playerFieldOfView - Player's current field of view tiles
   */
  updateCurrentVisibility(gameMap, player, playerFieldOfView) {
    if (!gameMap || !player || !playerFieldOfView) {
      console.warn('[PlayerZombieTracker] Invalid parameters for updateCurrentVisibility');
      return;
    }

    // Get all zombies currently visible to the player
    const currentlyVisibleZombies = this.getVisibleZombies(gameMap, player, playerFieldOfView);

    // Process newly spotted zombies
    this.processNewlySpottedZombies(currentlyVisibleZombies, player);

    // Update tracked zombies (but don't process lost sight - that was handled by path checking)
    this.updateTrackedZombies(currentlyVisibleZombies, player);

    // Remove zombies that are no longer visible (but don't set LastSeen again)
    const currentVisibleIds = new Set(currentlyVisibleZombies.map(({ zombie }) => zombie.id));
    for (const [zombieId, trackedData] of this.spottedZombies.entries()) {
      if (!currentVisibleIds.has(zombieId)) {
        // Zombie is no longer visible - just remove from tracking without setting LastSeen
        // (LastSeen was already set during path checking if appropriate)
        this.spottedZombies.delete(zombieId);
      }
    }
  }

  /**
   * Debug information about current tracking state
   */
  debugTracking() {
    console.log(`[PlayerZombieTracker] Currently tracking ${this.spottedZombies.size} zombies:`);
    for (const [zombieId, { zombie, lastPlayerPos }] of this.spottedZombies.entries()) {
      console.log(`  - ${zombieId} at (${zombie.x}, ${zombie.y}), last saw player at (${lastPlayerPos.x}, ${lastPlayerPos.y})`);
    }
  }
}