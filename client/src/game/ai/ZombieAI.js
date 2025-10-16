import { MovementHelper } from '../utils/MovementHelper.js';
import { Pathfinding } from '../utils/Pathfinding.js';

/**
 * Zombie AI system implementing the behavior loop from ZombieInfo.md
 * Handles zombie decision making and actions during their turn
 */
export class ZombieAI {
  /**
   * Execute zombie behavior loop for a single zombie's turn
   * @param {Zombie} zombie - The zombie taking its turn
   * @param {GameMap} gameMap - The game map
   * @param {Player} player - The player entity
   * @param {Array} playerCardinalPositions - Evaluated cardinal positions around player
   * @param {Set} lastSeenTaggedTiles - Set of tagged LastSeen tile coordinates as strings "x,y"
   * @returns {Object} - Result of the zombie's turn
   */
  static executeZombieTurn(zombie, gameMap, player, playerCardinalPositions = [], lastSeenTaggedTiles = new Set()) {
    if (!zombie || !gameMap || !player) {
      return { success: false, reason: 'Invalid parameters' };
    }

    zombie.startTurn();
    const turnResult = {
      zombieId: zombie.id,
      actions: [],
      apUsed: 0,
      behaviorTriggered: null
    };

    try {
      // Zombie Behavior Loop (from ZombieInfo.md)

      // 1. Can see player - Highest priority
      if (zombie.canSeeEntity(gameMap, player)) {
        turnResult.behaviorTriggered = 'canSeePlayer';
        this.executeCanSeePlayerBehavior(zombie, gameMap, player, turnResult, playerCardinalPositions);
      }
      // 2. LastSeen is true - Move to last known position
      else if (zombie.lastSeen) {
        turnResult.behaviorTriggered = 'lastSeen';
        this.executeLastSeenBehavior(zombie, gameMap, turnResult, playerCardinalPositions, lastSeenTaggedTiles);
      }
      // 3. HeardNoise is true - Investigate noise (not implemented yet)
      else if (zombie.heardNoise) {
        turnResult.behaviorTriggered = 'heardNoise';
        this.executeHeardNoiseBehavior(zombie, gameMap, turnResult);
      }
      // 4. Random wandering - Default behavior (not implemented yet)
      else {
        turnResult.behaviorTriggered = 'randomWander';
        this.executeRandomWanderBehavior(zombie, gameMap, turnResult);
      }

    } catch (error) {
      console.error('[ZombieAI] Error during zombie turn:', error);
      turnResult.success = false;
      turnResult.error = error.message;
    }

    zombie.endTurn();
    turnResult.apUsed = zombie.maxAP - zombie.currentAP;
    turnResult.success = true;

    return turnResult;
  }

  /**
   * Execute "can see player" behavior - use all AP to move towards and attack player
   * @param {Zombie} zombie - The zombie
   * @param {GameMap} gameMap - The game map
   * @param {Player} player - The player
   * @param {Object} turnResult - Result object to update
   * @param {Array} playerCardinalPositions - Evaluated cardinal positions around player
   */
  static executeCanSeePlayerBehavior(zombie, gameMap, player, turnResult, playerCardinalPositions = []) {
    zombie.behaviorState = 'pursuing';

    // Use all AP to move towards player
    while (zombie.currentAP > 0) {
      // Check if adjacent to player
      if (zombie.isAdjacentTo(player.x, player.y)) {
        // Attack player with remaining AP
        const attackResult = this.attemptAttack(zombie, player);
        turnResult.actions.push({
          type: 'attack',
          target: 'player',
          success: attackResult.success,
          damage: attackResult.damage || 0
        });
        break; // End turn after attack
      }

      const targetPosition = this.findBestCardinalPosition(zombie, playerCardinalPositions);

      if (!targetPosition) {
        // No accessible cardinal positions found - fall back to direct movement
        console.log(`[ZombieAI] No accessible cardinal positions available for zombie ${zombie.id}, trying direct approach to player`);

        const directMoveResult = this.attemptMoveTowards(zombie, gameMap, player.x, player.y);
        if (directMoveResult.success) {
          turnResult.actions.push({
            type: 'move',
            from: directMoveResult.from,
            to: directMoveResult.to,
            apCost: directMoveResult.apCost
          });
          console.log(`[ZombieAI] Zombie ${zombie.id} moved directly toward player, remaining AP: ${zombie.currentAP}`);
        } else {
          // Completely blocked
          turnResult.actions.push({
            type: 'blocked',
            reason: 'No accessible path to player'
          });
          console.log(`[ZombieAI] Zombie ${zombie.id} completely blocked: ${directMoveResult.reason}`);
          break;
        }
      } else {
        // Try to move towards the target cardinal position
        const moveResult = this.attemptMoveTowards(zombie, gameMap, targetPosition.x, targetPosition.y);
        if (moveResult.success) {
          turnResult.actions.push({
            type: 'move',
            from: moveResult.from,
            to: moveResult.to,
            apCost: moveResult.apCost
          });

          console.log(`[ZombieAI] Zombie ${zombie.id} moved toward cardinal position (${targetPosition.x}, ${targetPosition.y}), remaining AP: ${zombie.currentAP}`);
        } else {
          // Cardinal position blocked - try to find an alternative cardinal position
          console.log(`[ZombieAI] Zombie ${zombie.id} blocked moving to preferred cardinal position, trying alternatives`);

          const alternativePosition = this.findAlternativeCardinalPosition(zombie, playerCardinalPositions, targetPosition);

          if (alternativePosition) {
            console.log(`[ZombieAI] Found alternative cardinal position (${alternativePosition.x}, ${alternativePosition.y}) for zombie ${zombie.id}`);
            const altMoveResult = this.attemptMoveTowards(zombie, gameMap, alternativePosition.x, alternativePosition.y);

            if (altMoveResult.success) {
              turnResult.actions.push({
                type: 'move',
                from: altMoveResult.from,
                to: altMoveResult.to,
                apCost: altMoveResult.apCost
              });
              console.log(`[ZombieAI] Zombie ${zombie.id} moved toward alternative cardinal position, remaining AP: ${zombie.currentAP}`);
            } else {
              // Alternative also blocked, try direct movement as final fallback
              console.log(`[ZombieAI] Alternative cardinal position also blocked, trying direct approach`);
              const directMoveResult = this.attemptMoveTowards(zombie, gameMap, player.x, player.y);
              if (directMoveResult.success) {
                turnResult.actions.push({
                  type: 'move',
                  from: directMoveResult.from,
                  to: directMoveResult.to,
                  apCost: directMoveResult.apCost
                });
                console.log(`[ZombieAI] Zombie ${zombie.id} moved directly toward player as final fallback, remaining AP: ${zombie.currentAP}`);
              } else {
                turnResult.actions.push({
                  type: 'blocked',
                  reason: 'All movement options blocked'
                });
                console.log(`[ZombieAI] Zombie ${zombie.id} completely blocked: all movement options failed`);
                break;
              }
            }
          } else {
            // No alternative cardinal positions, try direct movement
            console.log(`[ZombieAI] No alternative cardinal positions available, trying direct approach`);
            const directMoveResult = this.attemptMoveTowards(zombie, gameMap, player.x, player.y);
            if (directMoveResult.success) {
              turnResult.actions.push({
                type: 'move',
                from: directMoveResult.from,
                to: directMoveResult.to,
                apCost: directMoveResult.apCost
              });
              console.log(`[ZombieAI] Zombie ${zombie.id} moved directly toward player, remaining AP: ${zombie.currentAP}`);
            } else {
              turnResult.actions.push({
                type: 'blocked',
                reason: 'All movement options blocked'
              });
              console.log(`[ZombieAI] Zombie ${zombie.id} completely blocked: ${directMoveResult.reason}`);
              break;
            }
          }
        }
      }
    }
  }

  /**
   * Execute "last seen" behavior - move to target sighted coordinates
   * @param {Zombie} zombie - The zombie
   * @param {GameMap} gameMap - The game map
   * @param {Object} turnResult - Result object to update
   * @param {Array} playerCardinalPositions - Evaluated cardinal positions around player
   * @param {Set} lastSeenTaggedTiles - Set of tagged LastSeen tile coordinates as strings "x,y"
   */
  static executeLastSeenBehavior(zombie, gameMap, turnResult, playerCardinalPositions = [], lastSeenTaggedTiles = new Set()) {
    zombie.behaviorState = 'investigating';

    let targetX = zombie.targetSightedCoords.x;
    let targetY = zombie.targetSightedCoords.y;
    const originalTarget = `${targetX},${targetY}`;

    // Check if the original LastSeen target is already tagged by another zombie
    if (lastSeenTaggedTiles.has(originalTarget)) {
      console.log(`[ZombieAI] Zombie ${zombie.id} found LastSeen target (${targetX}, ${targetY}) already tagged, searching for alternative`);
      
      const alternativeTarget = this.findAlternativeLastSeenTarget(gameMap, targetX, targetY, lastSeenTaggedTiles);
      if (alternativeTarget) {
        targetX = alternativeTarget.x;
        targetY = alternativeTarget.y;
        console.log(`[ZombieAI] Zombie ${zombie.id} using alternative LastSeen target (${targetX}, ${targetY})`);
      } else {
        console.log(`[ZombieAI] Zombie ${zombie.id} no alternative LastSeen target found, using original (${targetX}, ${targetY})`);
      }
    }

    // Tag the chosen target tile to prevent other zombies from clustering
    const chosenTarget = `${targetX},${targetY}`;
    lastSeenTaggedTiles.add(chosenTarget);
    console.log(`[ZombieAI] Zombie ${zombie.id} pursuing lastSeen target at (${targetX}, ${targetY}), current AP: ${zombie.currentAP}, tile tagged`);

    // Update zombie's target coordinates to the chosen target (in case alternative was selected)
    zombie.targetSightedCoords.x = targetX;
    zombie.targetSightedCoords.y = targetY;

    // Use all AP to move towards target coordinates (like pursuing behavior)
    while (zombie.currentAP > 0) {
      // Check if reached target
      if (zombie.x === targetX && zombie.y === targetY) {
        zombie.clearLastSeen();
        turnResult.actions.push({
          type: 'targetReached',
          coordinates: { x: targetX, y: targetY }
        });

        console.log(`[ZombieAI] Zombie ${zombie.id} reached lastSeen target at (${targetX}, ${targetY})`);

        // Now that we reached the target, check if we can see player
        const allEntities = gameMap.getAllEntities();
        const actualPlayer = allEntities.find(entity => entity.type === 'player');

        if (actualPlayer && zombie.canSeeEntity(gameMap, actualPlayer)) {
          console.log(`[ZombieAI] Zombie ${zombie.id} can see player after reaching target, switching to pursuit`);
          // Switch to pursuing behavior for remaining AP
          this.executeCanSeePlayerBehavior(zombie, gameMap, actualPlayer, turnResult, playerCardinalPositions);
        } else {
          // Can't see player from target location, end turn
          console.log(`[ZombieAI] Zombie ${zombie.id} reached target but cannot see player, ending turn`);
        }
        break; // Always break after reaching target
      }

      // Move towards target coordinates
      const moveResult = this.attemptMoveTowards(zombie, gameMap, targetX, targetY);
      if (moveResult.success) {
        turnResult.actions.push({
          type: 'move',
          from: moveResult.from,
          to: moveResult.to,
          apCost: moveResult.apCost
        });

        console.log(`[ZombieAI] Zombie ${zombie.id} moved toward lastSeen target (${targetX}, ${targetY}), now at (${zombie.x}, ${zombie.y}), remaining AP: ${zombie.currentAP}`);

        // Continue the loop to move again with remaining AP
      } else {
        // Can't move closer, end turn
        turnResult.actions.push({
          type: 'blocked',
          reason: moveResult.reason
        });
        console.log(`[ZombieAI] Zombie ${zombie.id} blocked moving to lastSeen: ${moveResult.reason}`);
        break;
      }
    }

    console.log(`[ZombieAI] Zombie ${zombie.id} lastSeen behavior complete, remaining AP: ${zombie.currentAP}`);
  }

  /**
   * Execute "heard noise" behavior - investigate noise location
   * @param {Zombie} zombie - The zombie
   * @param {GameMap} gameMap - The game map
   * @param {Object} turnResult - Result object to update
   */
  static executeHeardNoiseBehavior(zombie, gameMap, turnResult) {
    zombie.behaviorState = 'investigating';

    // TODO: Implement noise investigation
    // For now, just clear the noise flag and end turn
    zombie.clearNoiseHeard();
    turnResult.actions.push({
      type: 'noiseInvestigation',
      status: 'notImplemented'
    });
  }

  /**
   * Execute random wandering behavior
   * @param {Zombie} zombie - The zombie
   * @param {GameMap} gameMap - The game map
   * @param {Object} turnResult - Result object to update
   */
  static executeRandomWanderBehavior(zombie, gameMap, turnResult) {
    zombie.behaviorState = 'wandering';

    // TODO: Implement random wandering
    // For now, just end turn
    turnResult.actions.push({
      type: 'randomWander',
      status: 'notImplemented'
    });
  }

  /**
   * Attempt to move zombie towards target coordinates using consistent pathfinding
   * @param {Zombie} zombie - The zombie
   * @param {GameMap} gameMap - The game map
   * @param {number} targetX - Target X coordinate
   * @param {number} targetY - Target Y coordinate
   * @returns {Object} - Move result
   */
  static attemptMoveTowards(zombie, gameMap, targetX, targetY) {
    console.log(`[ZombieAI] attemptMoveTowards: zombie at (${zombie.x}, ${zombie.y}), target (${targetX}, ${targetY}), AP: ${zombie.currentAP}`);

    // Check if already at target
    if (zombie.x === targetX && zombie.y === targetY) {
      console.log(`[ZombieAI] Already at target`);
      return { success: false, reason: 'Already at target' };
    }

    const fromPos = { x: zombie.x, y: zombie.y };
    const apCost = 1;

    // Check if zombie has enough AP
    if (zombie.currentAP < apCost) {
      console.log(`[ZombieAI] Insufficient AP: has ${zombie.currentAP}, needs ${apCost}`);
      return { success: false, reason: 'Insufficient AP', apRequired: apCost };
    }

    // Always use pathfinding for consistent behavior
    // Create entity filter to ignore the zombie itself during pathfinding
    const entityFilter = (tile) => {
      const blockingEntities = tile.contents.filter(entity => {
        return entity.blocksMovement && entity.id !== zombie.id;
      });
      return blockingEntities.length === 0;
    };

    const path = Pathfinding.findPath(
      gameMap,
      zombie.x,
      zombie.y,
      targetX,
      targetY,
      {
        allowDiagonal: false,
        entityFilter: entityFilter,
        debug: false // Reduce console spam
      }
    );

    if (path.length > 1) {
      // Move to the next step in the path (path[0] is current position, path[1] is next step)
      const nextMove = path[1];

      console.log(`[ZombieAI] Following path step 1 of ${path.length - 1}: moving to (${nextMove.x}, ${nextMove.y})`);

      // Validate the next move is walkable
      if (!this.canMoveToTile(gameMap, nextMove.x, nextMove.y)) {
        console.log(`[ZombieAI] Next path step blocked, cannot move`);
        return { success: false, reason: 'Next path step blocked' };
      }

      // Perform the move
      try {
        gameMap.moveEntity(zombie.id, nextMove.x, nextMove.y);
        zombie.useAP(apCost);
        console.log(`[ZombieAI] Move successful: ${fromPos.x},${fromPos.y} -> ${nextMove.x},${nextMove.y}, remaining AP: ${zombie.currentAP}`);

        return {
          success: true,
          from: fromPos,
          to: { x: nextMove.x, y: nextMove.y },
          apCost: apCost
        };
      } catch (error) {
        console.log(`[ZombieAI] Move failed with error: ${error.message}`);
        return { success: false, reason: error.message };
      }
    }

    console.log(`[ZombieAI] No path found to target`);
    return { success: false, reason: 'No path to target' };
  }

  /**
   * Check if a zombie can move to a specific tile
   * @param {GameMap} gameMap - The game map
   * @param {number} x - Target X coordinate
   * @param {number} y - Target Y coordinate
   * @returns {boolean} - Whether the move is valid
   */
  static canMoveToTile(gameMap, x, y) {
    const targetTile = gameMap.getTile(x, y);
    if (!targetTile) {
      console.log(`[ZombieAI] canMoveToTile: No tile found at (${x}, ${y})`);
      return false;
    }

    // Check if target tile is passable (not blocked by entities or terrain)
    const hasBlockingEntities = targetTile.contents.some(entity => entity.blocksMovement);
    if (hasBlockingEntities) {
      const blockingEntities = targetTile.contents.filter(entity => entity.blocksMovement);
      console.log(`[ZombieAI] canMoveToTile: Tile (${x}, ${y}) blocked by entities:`, blockingEntities.map(e => `${e.id}(${e.type})`));
      return false;
    }

    // Check if terrain allows movement
    // Zombies can move on floor tiles (inside buildings), grass, road, sidewalk
    // But NOT on walls, buildings (exterior), fences, or trees
    if (targetTile.terrain === 'wall' || targetTile.terrain === 'building' || 
        targetTile.terrain === 'fence' || targetTile.terrain === 'tree') {
      console.log(`[ZombieAI] canMoveToTile: Tile (${x}, ${y}) blocked by terrain: ${targetTile.terrain}`);
      return false;
    }

    console.log(`[ZombieAI] canMoveToTile: Tile (${x}, ${y}) is passable, terrain: ${targetTile.terrain}, entities: ${targetTile.contents.length}`);
    return true;
  }

  /**
   * Find the best cardinal position using the pre-calculated cardinal positions system
   * @param {Zombie} zombie - The zombie
   * @param {Array} playerCardinalPositions - Pre-calculated cardinal positions around player
   * @returns {Object|null} - Best cardinal position {x, y} or null if none accessible
   */
  static findBestCardinalPosition(zombie, playerCardinalPositions) {
    if (!playerCardinalPositions || playerCardinalPositions.length === 0) {
      console.log(`[ZombieAI] No cardinal positions provided for zombie ${zombie.id}`);
      return null;
    }

    // Filter to only passable positions
    const passablePositions = playerCardinalPositions.filter(pos => pos.isPassable);

    if (passablePositions.length === 0) {
      console.log(`[ZombieAI] No passable cardinal positions for zombie ${zombie.id}`);
      return null;
    }

    // Calculate distance to each passable position
    const positionsWithDistance = passablePositions.map(pos => ({
      ...pos,
      distance: Math.abs(zombie.x - pos.x) + Math.abs(zombie.y - pos.y)
    }));

    // Sort by preference: unoccupied positions first, then by distance
    positionsWithDistance.sort((a, b) => {
      // Priority 1: Available positions (no zombie) come first
      if (!a.hasZombie && b.hasZombie) return -1;
      if (a.hasZombie && !b.hasZombie) return 1;

      // Priority 2: If both available or both occupied, sort by distance
      if (a.distance !== b.distance) return a.distance - b.distance;

      // Priority 3: If same distance, prefer positions not occupied by this zombie
      if (a.hasZombie && a.zombieId === zombie.id) return 1;
      if (b.hasZombie && b.zombieId === zombie.id) return -1;

      return 0;
    });

    const bestPosition = positionsWithDistance[0];

    console.log(`[ZombieAI] Selected cardinal position for zombie ${zombie.id}: ${bestPosition.direction}(${bestPosition.x},${bestPosition.y}) - distance: ${bestPosition.distance}, occupied: ${bestPosition.hasZombie ? `by ${bestPosition.zombieId}` : 'no'}`);

    return { x: bestPosition.x, y: bestPosition.y };
  }

  /**
   * Find an alternative cardinal position when the preferred one is blocked
   * @param {Zombie} zombie - The zombie
   * @param {Array} playerCardinalPositions - Pre-calculated cardinal positions around player
   * @param {Object} blockedPosition - The position that was blocked {x, y}
   * @returns {Object|null} - Alternative cardinal position {x, y} or null if none available
   */
  static findAlternativeCardinalPosition(zombie, playerCardinalPositions, blockedPosition) {
    if (!playerCardinalPositions || playerCardinalPositions.length === 0) {
      console.log(`[ZombieAI] No cardinal positions provided for alternative search`);
      return null;
    }

    // Filter to only passable positions, excluding the blocked one
    const alternativePositions = playerCardinalPositions.filter(pos => {
      return pos.isPassable && 
             !(pos.x === blockedPosition.x && pos.y === blockedPosition.y);
    });

    if (alternativePositions.length === 0) {
      console.log(`[ZombieAI] No alternative cardinal positions available for zombie ${zombie.id}`);
      return null;
    }

    // Calculate distance to each alternative position
    const positionsWithDistance = alternativePositions.map(pos => ({
      ...pos,
      distance: Math.abs(zombie.x - pos.x) + Math.abs(zombie.y - pos.y)
    }));

    // Sort by preference: unoccupied positions first, then by distance
    positionsWithDistance.sort((a, b) => {
      // Priority 1: Available positions (no zombie) come first
      if (!a.hasZombie && b.hasZombie) return -1;
      if (a.hasZombie && !b.hasZombie) return 1;

      // Priority 2: If both available or both occupied, sort by distance
      if (a.distance !== b.distance) return a.distance - b.distance;

      return 0;
    });

    const alternativePosition = positionsWithDistance[0];

    console.log(`[ZombieAI] Found alternative cardinal position for zombie ${zombie.id}: ${alternativePosition.direction}(${alternativePosition.x},${alternativePosition.y}) - distance: ${alternativePosition.distance}, occupied: ${alternativePosition.hasZombie ? `by ${alternativePosition.zombieId}` : 'no'}`);

    return { x: alternativePosition.x, y: alternativePosition.y };
  }

  /**
   * Find the best adjacent cardinal position to the player for zombie attack (legacy method)
   * @param {GameMap} gameMap - The game map
   * @param {Zombie} zombie - The zombie
   * @param {Player} player - The player
   * @returns {Object|null} - Best adjacent position {x, y} or null if none accessible
   */
  static findBestAdjacentPosition(gameMap, zombie, player) {
    // Get all cardinal adjacent positions to the player
    const adjacentPositions = [
      { x: player.x + 1, y: player.y }, // Right
      { x: player.x - 1, y: player.y }, // Left
      { x: player.x, y: player.y + 1 }, // Down
      { x: player.x, y: player.y - 1 }  // Up
    ];

    // Filter to only accessible positions (not blocked by terrain or entities)
    const accessiblePositions = adjacentPositions.filter(pos => {
      return this.canMoveToTile(gameMap, pos.x, pos.y);
    });

    if (accessiblePositions.length === 0) {
      console.log(`[ZombieAI] No accessible adjacent positions to player at (${player.x}, ${player.y})`);
      return null;
    }

    // Sort accessible positions by distance to this zombie (closest first)
    const sortedPositions = accessiblePositions
      .map(pos => ({
        ...pos,
        distance: Math.abs(zombie.x - pos.x) + Math.abs(zombie.y - pos.y)
      }))
      .sort((a, b) => a.distance - b.distance);

    // Try to find a position that doesn't already have a zombie
    for (const pos of sortedPositions) {
      const tile = gameMap.getTile(pos.x, pos.y);
      const hasZombie = tile.contents.some(entity => entity.type === 'zombie');

      if (!hasZombie) {
        console.log(`[ZombieAI] Found best unoccupied adjacent position (${pos.x}, ${pos.y}) for zombie ${zombie.id} to attack player at (${player.x}, ${player.y})`);
        return { x: pos.x, y: pos.y };
      } else {
        console.log(`[ZombieAI] Position (${pos.x}, ${pos.y}) already occupied by zombie, trying next closest`);
      }
    }

    // If all positions have zombies, return the closest one anyway
    // (zombie will just move as close as possible)
    const fallbackPosition = sortedPositions[0];
    console.log(`[ZombieAI] All adjacent positions occupied, using closest fallback (${fallbackPosition.x}, ${fallbackPosition.y}) for zombie ${zombie.id}`);
    return { x: fallbackPosition.x, y: fallbackPosition.y };
  }

  /**
   * Find an alternative LastSeen target when the original is already tagged
   * @param {GameMap} gameMap - The game map
   * @param {number} originalX - Original target X coordinate
   * @param {number} originalY - Original target Y coordinate
   * @param {Set} lastSeenTaggedTiles - Set of tagged LastSeen tile coordinates
   * @returns {Object|null} - Alternative target {x, y} or null if none found
   */
  static findAlternativeLastSeenTarget(gameMap, originalX, originalY, lastSeenTaggedTiles) {
    // Search in expanding rings around the original target
    const maxRadius = 3; // Don't search too far from original target
    
    for (let radius = 1; radius <= maxRadius; radius++) {
      // Get all tiles at this radius from the original target
      const candidatesAtRadius = [];
      
      for (let dx = -radius; dx <= radius; dx++) {
        for (let dy = -radius; dy <= radius; dy++) {
          // Only check tiles at exact radius (Manhattan distance)
          if (Math.abs(dx) + Math.abs(dy) !== radius) continue;
          
          const candidateX = originalX + dx;
          const candidateY = originalY + dy;
          const candidateKey = `${candidateX},${candidateY}`;
          
          // Skip if already tagged
          if (lastSeenTaggedTiles.has(candidateKey)) continue;
          
          // Check if tile is valid and walkable
          const tile = gameMap.getTile(candidateX, candidateY);
          if (!tile) continue;
          
          if (this.canMoveToTile(gameMap, candidateX, candidateY)) {
            candidatesAtRadius.push({ x: candidateX, y: candidateY, radius });
          }
        }
      }
      
      // If we found valid candidates at this radius, return the first one
      if (candidatesAtRadius.length > 0) {
        const chosen = candidatesAtRadius[0]; // Could randomize this if desired
        console.log(`[ZombieAI] Found alternative LastSeen target at radius ${radius}: (${chosen.x}, ${chosen.y})`);
        return chosen;
      }
    }
    
    console.log(`[ZombieAI] No alternative LastSeen target found within radius ${maxRadius} of (${originalX}, ${originalY})`);
    return null;
  }

  /**
   * Attempt to attack a target
   * @param {Zombie} zombie - The attacking zombie
   * @param {Entity} target - The target entity
   * @returns {Object} - Attack result
   */
  static attemptAttack(zombie, target) {
    // TODO: Implement combat system
    // For now, just use remaining AP
    const apToUse = zombie.currentAP;
    zombie.useAP(apToUse);

    return {
      success: true,
      damage: 0, // No damage system yet
      apUsed: apToUse
    };
  }


}