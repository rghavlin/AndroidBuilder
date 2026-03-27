/**
 * Player-Centric Zombie Tracking System
 * Only tracks zombies that are visible to the player to optimize performance
 * and set LastSeen flags appropriately when zombies leave player's sight
 */

import { LineOfSight } from '../utils/LineOfSight.js';

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

    // Check each tile in player's field of view for zombies
    playerFieldOfView.forEach(tile => {
      const mapTile = gameMap.getTile(tile.x, tile.y);
      if (!mapTile || !mapTile.contents.length) return;

      // Find zombies on this tile
      const zombiesOnTile = mapTile.contents.filter(entity => entity.type === 'zombie');

      zombiesOnTile.forEach(zombie => {
        // Double-check that the zombie can actually see the player
        // (player sees zombie AND zombie is within sight range of player)
        const distanceToPlayer = zombie.getDistanceTo(player.x, player.y);

        if (distanceToPlayer <= zombie.sightRange) {
          // Verify mutual line of sight
          const zombieCanSeePlayer = zombie.canSeeEntity(gameMap, player);

          if (zombieCanSeePlayer) {
            visibleZombies.push({
              zombie,
              distance: distanceToPlayer,
              position: { x: tile.x, y: tile.y }
            });
          }
        }
      });
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
        // Zombie is no longer visible - set LastSeen to the player's CURRENT position.
        // We use 'to' (where the player just arrived), not 'from' (where they left),
        // so zombies always chase towards the player's actual location.
        const { zombie, lastPlayerPos } = trackedData;

        let lastSeenPos;

        if (playerMovement && playerMovement.to) {
          // Player moved — chase where they went
          lastSeenPos = playerMovement.to;
          
          // Check if the player just entered a building through a door/window
          const toTile = gameMap.getTile(playerMovement.to.x, playerMovement.to.y);
          const hasDoor = toTile?.contents.some(e => e.type === 'door');
          const hasWindow = toTile?.contents.some(e => e.type === 'window');

          if (hasDoor || hasWindow) {
             console.log(`[PlayerZombieTracker] Zombie ${zombieId} tracking player through ${hasDoor ? 'door' : 'window'} at (${lastSeenPos.x}, ${lastSeenPos.y})`);
          }
        } else {
          // No movement data available, use last stored position
          lastSeenPos = lastPlayerPos;
        }

        zombie.setTargetSighted(lastSeenPos.x, lastSeenPos.y);

        console.log(`[PlayerZombieTracker] Zombie ${zombieId} lost sight of player, set LastSeen to (${lastSeenPos.x}, ${lastSeenPos.y}) [player's current position]`);

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