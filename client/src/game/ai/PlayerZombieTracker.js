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

    const pX = player.logicalX !== undefined ? player.logicalX : player.x;
    const pY = player.logicalY !== undefined ? player.logicalY : player.y;
    console.log(`[PlayerZombieTracker] updateTracking called. Player pos: (${pX}, ${pY}). stack: ${new Error().stack.split('\n')[2]}`);

    // Get all zombies currently visible to the player
    const currentlyVisibleZombies = this.getVisibleZombies(gameMap, player, playerFieldOfView);
    if (currentlyVisibleZombies.length > 0) {
      console.log(`[PlayerZombieTracker] currentlyVisibleZombies:`, currentlyVisibleZombies.map(z => `${z.zombie.id} at (${z.zombie.logicalX}, ${z.zombie.logicalY})`));
    }

    // Process newly spotted zombies
    this.processNewlySpottedZombies(currentlyVisibleZombies, player);

    // CRITICAL ORDER FIX: Process lost-sight BEFORE updating tracked positions.
    // If we updated positions first, the LKP would be poisoned with the player's
    // new hidden coordinates instead of the last confirmed visible position.
    this.processZombiesLostFromSight(currentlyVisibleZombies, player, playerMovement);

    // Only AFTER recording LKPs for lost-sight zombies, update positions for
    // zombies that still have confirmed LOS at the player's new location.
    this.updateTrackedZombies(currentlyVisibleZombies, player);
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
      const pX = player.logicalX !== undefined ? player.logicalX : player.x;
      const pY = player.logicalY !== undefined ? player.logicalY : player.y;
      const distanceToPlayer = zombie.getDistanceTo(pX, pY);

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
    const pX = Math.round(player.logicalX !== undefined ? player.logicalX : player.x);
    const pY = Math.round(player.logicalY !== undefined ? player.logicalY : player.y);

    currentlyVisibleZombies.forEach(({ zombie }) => {
      if (!this.spottedZombies.has(zombie.id)) {
        // Newly spotted zombie
        this.spottedZombies.set(zombie.id, {
          zombie,
          lastPlayerPos: { x: pX, y: pY }
        });

        // Trigger alert state
        if (!zombie.isAlerted) {
          zombie.isAlerted = true;
          GameEvents.emit(GAME_EVENT.ZOMBIE_ALERTED, { zombie });
        }

        console.log(`[PlayerZombieTracker] Zombie ${zombie.id} newly spotted by player at (${pX}, ${pY})`);
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
        const { zombie, lastPlayerPos } = trackedData;
        
        // BUG FIX: Capture the player's precise logical position at the moment sight was lost
        zombie.setTargetSighted(lastPlayerPos.x, lastPlayerPos.y);
        
        // Reset alerted state so they growl/alert again when they spot the player next time
        zombie.isAlerted = false;
        
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
    const pX = Math.round(player.logicalX !== undefined ? player.logicalX : player.x);
    const pY = Math.round(player.logicalY !== undefined ? player.logicalY : player.y);

    // Only update lastPlayerPos for zombies that are CONFIRMED still visible at the
    // player's new position. This set only contains zombies with active LOS.
    const confirmedVisibleIds = new Set(currentlyVisibleZombies.map(({ zombie }) => zombie.id));

    currentlyVisibleZombies.forEach(({ zombie }) => {
      if (this.spottedZombies.has(zombie.id) && confirmedVisibleIds.has(zombie.id)) {
        // Safe to update: zombie has confirmed LOS to the player's new position
        this.spottedZombies.set(zombie.id, {
          zombie,
          lastPlayerPos: { x: pX, y: pY }
        });
      }
      // If not in confirmedVisibleIds, processZombiesLostFromSight already
      // handled this zombie and recorded the correct lastPlayerPos.
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