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
      // 3. HeardNoise is true - Investigate noise
      else if (zombie.heardNoise) {
        turnResult.behaviorTriggered = 'heardNoise';
        this.executeHeardNoiseBehavior(zombie, gameMap, turnResult, playerCardinalPositions, lastSeenTaggedTiles);
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

    // Use all AP moving toward and attacking the player
    while (zombie.currentAP > 0) {
      // 1. If adjacent to player → attack
      if (zombie.isAdjacentTo(player.x, player.y)) {
        const attackResult = this.attemptAttack(zombie, player);
        turnResult.actions.push({
          type: 'attack',
          target: 'player',
          success: attackResult.success,
          damage: attackResult.damage || 0
        });

        if (!attackResult.success && attackResult.reason === 'Insufficient AP') {
          console.log(`[ZombieAI] Zombie ${zombie.id} insufficient AP to attack, ending pursuit loop`);
          break;
        }
        continue;
      }

      // 2. Move directly toward player using A* pathfinding.
      // This is now the primary strategy — no more fragile 3-level cardinal fallback.
      const moveResult = this.attemptMoveTowards(zombie, gameMap, player.x, player.y);

      if (moveResult.success) {
        turnResult.actions.push({
          type: moveResult.type || 'move',
          from: moveResult.from,
          to: moveResult.to,
          apCost: moveResult.apCost,
          doorPos: moveResult.doorPos,
          doorBroken: moveResult.doorBroken
        });
        console.log(`[ZombieAI] Zombie ${zombie.id} moved toward player, remaining AP: ${zombie.currentAP}`);
      } else {
        // Truly blocked (wall, impassable terrain, enemy grid lock)
        turnResult.actions.push({
          type: 'blocked',
          reason: moveResult.reason || 'No path to player'
        });
        console.log(`[ZombieAI] Zombie ${zombie.id} blocked: ${moveResult.reason}`);
        break;
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

      const alternativeTarget = this.findAlternativeInvestigationTarget(gameMap, targetX, targetY, lastSeenTaggedTiles);
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

    // Track movement direction to support "momentum" behavior if target is reached but player not seen
    let lastDirection = null;

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
          // Momentum behavior: keep moving in the same direction if we have AP and momentum
          if (lastDirection && zombie.currentAP > 0) {
            console.log(`[ZombieAI] Zombie ${zombie.id} reached target but cannot see player, initiating momentum behavior`);
            this.executeMomentumBehavior(zombie, gameMap, lastDirection, turnResult, playerCardinalPositions);
          } else {
            console.log(`[ZombieAI] Zombie ${zombie.id} reached target but cannot see player, no momentum or AP, ending turn`);
          }
        }
        break; // Always break after reaching target
      }

      // Move towards target coordinates
      const moveResult = this.attemptMoveTowards(zombie, gameMap, targetX, targetY);
      if (moveResult.success) {
        // Update lastDirection on successful move
        if (moveResult.from && moveResult.to && (moveResult.from.x !== moveResult.to.x || moveResult.from.y !== moveResult.to.y)) {
          lastDirection = {
            x: moveResult.to.x - moveResult.from.x,
            y: moveResult.to.y - moveResult.from.y
          };
        }

        turnResult.actions.push({
          type: moveResult.type || 'move',
          from: moveResult.from,
          to: moveResult.to,
          apCost: moveResult.apCost,
          doorPos: moveResult.doorPos,
          doorBroken: moveResult.doorBroken
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
   * @param {Array} playerCardinalPositions - Evaluated cardinal positions around player
   * @param {Set} investigationTaggedTiles - Set of tagged investigation tiles
   */
  static executeHeardNoiseBehavior(zombie, gameMap, turnResult, playerCardinalPositions = [], investigationTaggedTiles = new Set()) {
    let targetX = zombie.noiseCoords.x;
    let targetY = zombie.noiseCoords.y;
    const originalTarget = `${targetX},${targetY}`;

    console.log(`[ZombieAI] Zombie ${zombie.id} evaluating noise at (${targetX}, ${targetY})`);

    zombie.behaviorState = 'investigating';

    // 1. Spreading logic: If original noise target is tagged, find alternative
    if (investigationTaggedTiles.has(originalTarget)) {
      const alternativeTarget = this.findAlternativeInvestigationTarget(gameMap, targetX, targetY, investigationTaggedTiles);
      if (alternativeTarget) {
        targetX = alternativeTarget.x;
        targetY = alternativeTarget.y;
        console.log(`[ZombieAI] Zombie ${zombie.id} using alternative noise target (${targetX}, ${targetY})`);
      }
    }

    // 2. Tag the chosen target
    const chosenTarget = `${targetX},${targetY}`;
    investigationTaggedTiles.add(chosenTarget);

    // 3. Update zombie's noise target
    zombie.noiseCoords.x = targetX;
    zombie.noiseCoords.y = targetY;

    // Move towards noise coordinates until reached or out of AP
    while (zombie.currentAP > 0) {
      // If we spot the player during investigation, switch to pursue
      const player = gameMap.getEntitiesByType('player')[0];
      if (player && zombie.canSeeEntity(gameMap, player)) {
        console.log(`[ZombieAI] Zombie ${zombie.id} spotted player while investigating noise, switching to pursuePlayer`);
        zombie.setTargetSighted(player.x, player.y);
        break;
      }

      const moveResult = this.attemptMoveTowards(zombie, gameMap, targetX, targetY);

      if (moveResult.success) {
        turnResult.actions.push({
          type: moveResult.type || 'move',
          from: moveResult.from,
          to: moveResult.to,
          apCost: moveResult.apCost,
          actionType: moveResult.type || 'move',
          doorPos: moveResult.doorPos,
          doorBroken: moveResult.doorBroken
        });

        // If at target point, stop and clear
        if (zombie.x === targetX && zombie.y === targetY) {
          console.log(`[ZombieAI] Zombie ${zombie.id} reached investigation target (${targetX}, ${targetY})`);
          zombie.clearNoiseHeard();
          break;
        }
      } else {
        // Can't move closer (blocked), end turn
        turnResult.actions.push({
          type: 'blocked',
          reason: moveResult.reason
        });
        console.log(`[ZombieAI] Zombie ${zombie.id} blocked investigating: ${moveResult.reason}`);

        // If blocked and very close to the source, maybe we give up
        const dist = Math.abs(zombie.x - targetX) + Math.abs(zombie.y - targetY);
        if (dist <= 1) {
          console.log(`[ZombieAI] Zombie ${zombie.id} blocked at destination, clearing target`);
          zombie.clearNoiseHeard();
        }
        break;
      }
    }

    console.log(`[ZombieAI] Zombie ${zombie.id} noise investigation complete, remaining AP: ${zombie.currentAP}`);
  }

  /**
   * Execute "momentum" behavior - continue moving in the last known direction
   * when the player is no longer visible at the target location.
   * @param {Zombie} zombie - The zombie
   * @param {GameMap} gameMap - The game map
   * @param {Object} direction - The direction of the last move {x, y}
   * @param {Object} turnResult - Result object to update
   * @param {Array} playerCardinalPositions - Evaluated cardinal positions around player
   */
  static executeMomentumBehavior(zombie, gameMap, direction, turnResult, playerCardinalPositions = []) {
    console.log(`[ZombieAI] Zombie ${zombie.id} initiating momentum behavior in direction (${direction.x}, ${direction.y})`);

    zombie.behaviorState = 'investigating'; // Keep investigative state until turn ends or player seen

    while (zombie.currentAP > 0) {
      const nextX = zombie.x + direction.x;
      const nextY = zombie.y + direction.y;
      const subtypeMult = zombie.subtype === 'runner' ? 0.5 : (zombie.subtype === 'fat' ? 1.5 : 1);

      // Determine movement cost for this specific move
      const nextTile = gameMap.getTile(nextX, nextY);
      if (!nextTile) break; // Off map

      const moveDist = Pathfinding.getMovementCost(zombie.x, zombie.y, nextX, nextY, nextTile);
      const apCost = subtypeMult * moveDist;

      if (zombie.currentAP < apCost) {
        console.log(`[ZombieAI] Zombie ${zombie.id} momentum stopped: insufficient AP`);
        break;
      }

      // Check if the move is valid (terrain/blocking entities)
      if (!this.canMoveToTile(gameMap, nextX, nextY, zombie.subtype)) {
        console.log(`[ZombieAI] Zombie ${zombie.id} momentum stopped: path blocked at (${nextX}, ${nextY})`);
        break;
      }

      // Check for closed doors/unbroken windows (obstacles)
      const door = nextTile.contents.find(e => e.type === 'door' && !e.isOpen);
      const window = nextTile.contents.find(e => e.type === 'window' && !e.isBroken);
      if (door || window) {
        console.log(`[ZombieAI] Zombie ${zombie.id} momentum stopped: encountered ${door ? 'door' : 'window'}`);
        break;
      }

      // Execute move
      const fromPos = { x: zombie.x, y: zombie.y };
      try {
        gameMap.moveEntity(zombie.id, nextX, nextY);
        zombie.useAP(apCost);

        turnResult.actions.push({
          type: 'momentum_move',
          from: fromPos,
          to: { x: nextX, y: nextY },
          apCost: apCost
        });

        console.log(`[ZombieAI] Zombie ${zombie.id} momentum move to (${nextX}, ${nextY}), remaining AP: ${zombie.currentAP}`);

        // Check if player is visible after the move
        const actualPlayer = gameMap.getEntitiesByType('player')[0];
        if (actualPlayer && zombie.canSeeEntity(gameMap, actualPlayer)) {
          console.log(`[ZombieAI] Zombie ${zombie.id} spotted player during momentum, switching to pursuit`);
          zombie.setTargetSighted(actualPlayer.x, actualPlayer.y);
          this.executeCanSeePlayerBehavior(zombie, gameMap, actualPlayer, turnResult, playerCardinalPositions);
          break; // Stop momentum loop as behavior shifted to pursuit
        }
      } catch (e) {
        console.error(`[ZombieAI] Momentum move failed:`, e);
        break;
      }
    }
  }

  /**
   * Execute random wandering behavior
   * @param {Zombie} zombie - The zombie
   * @param {GameMap} gameMap - The game map
   * @param {Object} turnResult - Result object to update
   */
  static executeRandomWanderBehavior(zombie, gameMap, turnResult) {
    zombie.behaviorState = 'wandering';

    // Take 1-2 random steps per turn
    const stepsToTake = Math.floor(Math.random() * 2) + 1;

    for (let step = 0; step < stepsToTake; step++) {
      const minMoveCost = zombie.subtype === 'runner' ? 0.5 : (zombie.subtype === 'fat' ? 1.5 : 1);
      if (zombie.currentAP < minMoveCost) {
        console.log(`[ZombieAI] Zombie ${zombie.id} insufficient AP to wander (${zombie.currentAP} < ${minMoveCost}), breaking`);
        break;
      }

      // Pick a random direction (including diagonals)
      const directions = [
        { x: zombie.x + 1, y: zombie.y },     // Right
        { x: zombie.x - 1, y: zombie.y },     // Left
        { x: zombie.x, y: zombie.y + 1 },     // Down
        { x: zombie.x, y: zombie.y - 1 },     // Up
        { x: zombie.x + 1, y: zombie.y + 1 }, // Down-Right
        { x: zombie.x + 1, y: zombie.y - 1 }, // Up-Right
        { x: zombie.x - 1, y: zombie.y + 1 }, // Down-Left
        { x: zombie.x - 1, y: zombie.y - 1 }  // Up-Left
      ];

      // Shuffle and pick the first walkable direction
      const shuffled = directions.sort(() => Math.random() - 0.5);
      let moved = false;
      for (const dir of shuffled) {
        if (this.canMoveToTile(gameMap, dir.x, dir.y)) {
          // Additional check for diagonal moves: avoid cutting corners
          if (Math.abs(dir.x - zombie.x) === 1 && Math.abs(dir.y - zombie.y) === 1) {
            if (!Pathfinding.canMoveDiagonally(gameMap, zombie.x, zombie.y, dir.x, dir.y)) {
              continue;
            }
          }

          // Make sure no closed door is in the way (don't break doors while wandering)
          const tile = gameMap.getTile(dir.x, dir.y);
          const hasDoor = tile?.contents.some(e => e.type === 'door' && !e.isOpen);
          if (hasDoor) continue;

          const fromPos = { x: zombie.x, y: zombie.y };
          try {
            const subtypeMult = zombie.subtype === 'runner' ? 0.5 : (zombie.subtype === 'fat' ? 1.5 : 1);
            const moveDist = Pathfinding.getMovementCost(zombie.x, zombie.y, dir.x, dir.y);
            const apCost = subtypeMult * moveDist;
            
            if (zombie.currentAP < apCost) continue;

            gameMap.moveEntity(zombie.id, dir.x, dir.y);
            zombie.useAP(apCost);
            turnResult.actions.push({
              type: 'wander',
              from: fromPos,
              to: { x: dir.x, y: dir.y },
              apCost: apCost
            });
            moved = true;
          } catch (e) {
            // Ignore move errors during wander
          }
          break;
        }
      }

      if (!moved) break; // No walkable tiles found, stop wandering
    }
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
    const subtypeMult = zombie.subtype === 'runner' ? 0.5 : (zombie.subtype === 'fat' ? 1.5 : 1);
    const minMoveCost = subtypeMult * 1.0; // Minimum cardinal cost

    // Check if zombie has enough AP for at least one cardinal step
    if (zombie.currentAP < minMoveCost) {
      console.log(`[ZombieAI] Insufficient AP for any move: has ${zombie.currentAP}, needs ${minMoveCost}`);
      return { success: false, reason: 'Insufficient AP', apRequired: minMoveCost };
    }

    // Create entity filter to ignore the zombie itself during pathfinding
    // Update: Also allow pathing THROUGH doors (while still being blocked for actual move)
    // This ensures zombies track to last seen/heard positions behind closed doors
    const entityFilter = (tile) => {
      // High-priority: Terrain blocking (Zombies can't walk through walls)
      if (['wall', 'building', 'fence', 'tree', 'water'].includes(tile.terrain)) {
        return false;
      }

      const blockingEntities = tile.contents.filter(entity => {
        // CRAWLERS cannot use windows
        if (zombie.subtype === 'crawler' && entity.type === 'window') return true;

        // ALLOW pathfinding to CONSIDER tiles with doors, players, or other zombies
        // The actual movement will still be blocked by canMoveToTile,
        // which prevents overlapping but allows the AI to "plan" a path to the area.
        return entity.blocksMovement &&
          entity.id !== zombie.id &&
          entity.type !== 'door' &&
          entity.type !== 'window' &&
          entity.type !== 'player' &&
          entity.type !== 'zombie';
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
        allowDiagonal: true,
        entityFilter: entityFilter,
        debug: false // Reduce console spam
      }
    );

    if (path.length > 1) {
      // Move to the next step in the path (path[0] is current position, path[1] is next step)
      const nextMove = path[1];

      console.log(`[ZombieAI] Following path step 1 of ${path.length - 1}: moving to (${nextMove.x}, ${nextMove.y})`);

      const nextTile = gameMap.getTile(nextMove.x, nextMove.y);

      const moveDist = Pathfinding.getMovementCost(fromPos.x, fromPos.y, nextMove.x, nextMove.y, nextTile);
      const apCost = subtypeMult * moveDist;

      // Final dynamic AP check for this specific move
      if (zombie.currentAP < apCost) {
        console.log(`[ZombieAI] Insufficient AP for specific move: has ${zombie.currentAP}, needs ${apCost}`);
        return { success: false, reason: 'Insufficient AP', apRequired: apCost };
      }

      // ── PRIORITY 1: Closed door in the way → attack it ──────────────────────
      // Check this BEFORE canMoveToTile because canMoveToTile now correctly
      // returns true for door tiles (letting pathfinding route through them),
      // which means we must intercept the closed-door case here first.
      const door = nextTile?.contents.find(e => e.type === 'door');
      if (door && !door.isOpen) {
        console.log(`[ZombieAI] Next path step blocked by closed door at (${nextMove.x}, ${nextMove.y}), attacking door`);

        // Zombie attacks the door (costing cardinal AP cost)
        const cardinalCost = subtypeMult * 1.0;
        zombie.useAP(cardinalCost);

        // Zombies do 1-2 damage to doors per attack
        const doorDamage = Math.floor(Math.random() * 2) + 1;
        door.takeDamage(doorDamage);

        console.log(`[ZombieAI] Zombie ${zombie.id} attacked door for ${doorDamage} damage (HP left: ${door.hp ?? '?'}), remaining AP: ${zombie.currentAP}`);

        // Attract nearby zombies to the noise
        const otherZombies = gameMap.getEntitiesByType('zombie');
        otherZombies.forEach(z => {
          if (z.id !== zombie.id) {
            const distance = Math.abs(z.x - nextMove.x) + Math.abs(z.y - nextMove.y);
            if (distance <= 6) {
              z.setNoiseHeard(nextMove.x, nextMove.y);
            }
          }
        });

        return {
          success: true,
          from: fromPos,
          to: fromPos, // Zombie didn't move
          type: 'attackDoor',
          doorPos: { x: nextMove.x, y: nextMove.y },
          apCost: cardinalCost,
          doorBroken: door.hp <= 0
        };
      }

      // ── PRIORITY 1b: Window in the way → break it ───────────────────────────
      const window = nextTile?.contents.find(e => e.type === 'window');
      if (window && !window.isBroken) {
        console.log(`[ZombieAI] Next path step blocked by window at (${nextMove.x}, ${nextMove.y}), breaking window`);

        // Spending 1 AP for the break action
        const breakCost = 1.0;
        zombie.useAP(breakCost);

        // Break the window
        window.break();
        console.log(`[ZombieAI] Zombie ${zombie.id} smashed the window, remaining AP: ${zombie.currentAP}`);

        // Attract nearby zombies to the noise
        const otherZombies = gameMap.getEntitiesByType('zombie');
        otherZombies.forEach(z => {
          if (z.id !== zombie.id) {
            const distance = Math.abs(z.x - nextMove.x) + Math.abs(z.y - nextMove.y);
            if (distance <= 6) {
              z.setNoiseHeard(nextMove.x, nextMove.y);
            }
          }
        });

        // Noise on map
        if (gameMap.emitNoise) {
            gameMap.emitNoise(nextMove.x, nextMove.y, 6);
        }

        return {
          success: true,
          from: fromPos,
          to: fromPos, // Zombie didn't move yet
          type: 'attackWindow',
          windowPos: { x: nextMove.x, y: nextMove.y },
          apCost: breakCost,
          windowBroken: true
        };
      }

      // ── PRIORITY 2: Normal movement check ──────────────────────────────────
      if (!ZombieAI.canMoveToTile(gameMap, nextMove.x, nextMove.y, zombie.subtype)) {
        console.log(`[ZombieAI] Next path step blocked by non-door entity or terrain, cannot move`);
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
   * @param {string} zombieSubtype - Optional zombie subtype for specific restrictions
   * @returns {boolean} - Whether the move is valid
   */
  static canMoveToTile(gameMap, x, y, zombieSubtype = null) {
    const targetTile = gameMap.getTile(x, y);
    if (!targetTile) {
      return false;
    }

    // Check terrain first — zombies can never walk through walls/buildings/fences/trees
    if (targetTile.terrain === 'wall' || targetTile.terrain === 'building' ||
      targetTile.terrain === 'fence' || targetTile.terrain === 'tree') {
      return false;
    }

    // Check for blocking entities — but intentionally EXCLUDE:
    //   - doors: handled separately by the door-attack branch
    //   - players: attacked when adjacent; zombies should be able to path into player tile
    //   - zombies: zombies should not block each other for movement checks here
    const hasBlockingEntities = targetTile.contents.some(entity => {
      // CRAWLERS cannot use windows
      if (zombieSubtype === 'crawler' && entity.type === 'window') return true;

      return entity.blocksMovement &&
        entity.type !== 'door' &&
        entity.type !== 'window' &&
        entity.type !== 'player';
    });

    if (hasBlockingEntities) {
      return false;
    }

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
   * Find an alternative investigation target (LastSeen or Noise) when the original is already tagged
   * @param {GameMap} gameMap - The game map
   * @param {number} originalX - Original target X coordinate
   * @param {number} originalY - Original target Y coordinate
   * @param {Set} investigationTaggedTiles - Set of tagged investigation tiles
   * @returns {Object|null} - Alternative target {x, y} or null if none found
   */
  static findAlternativeInvestigationTarget(gameMap, originalX, originalY, investigationTaggedTiles) {
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
          if (investigationTaggedTiles.has(candidateKey)) continue;

          // Check if tile is valid and walkable
          const tile = gameMap.getTile(candidateX, candidateY);
          if (!tile) continue;

          if (this.canMoveToTile(gameMap, candidateX, candidateY)) {
            candidatesAtRadius.push({ x: candidateX, y: candidateY, radius });
          }
        }
      }

      // If we found valid candidates at this radius, return a random one
      if (candidatesAtRadius.length > 0) {
        const randomIndex = Math.floor(Math.random() * candidatesAtRadius.length);
        const chosen = candidatesAtRadius[randomIndex];
        console.log(`[ZombieAI] Found alternative investigation target at radius ${radius}: (${chosen.x}, ${chosen.y}) from ${candidatesAtRadius.length} candidates`);
        return chosen;
      }
    }

    console.log(`[ZombieAI] No alternative investigation target found within radius ${maxRadius} of (${originalX}, ${originalY})`);
    return null;
  }

  /**
   * Attempt to attack a target
   * @param {Zombie} zombie - The attacking zombie
   * @param {Entity} target - The target entity
   * @returns {Object} - Attack result
   */
  static attemptAttack(zombie, target) {
    const apCost = 1;

    if (zombie.currentAP < apCost) {
      return {
        success: false,
        reason: 'Insufficient AP'
      };
    }

    zombie.useAP(apCost);

    // 50/50 chance to hit as requested
    const hit = Math.random() < 0.5;
    let damage = 0;

    if (hit) {
      // Standard zombie attack does 1 to 4 damage. Acid zombies do 2 to 5. Fat zombies do 3-6.
      const minDamage = zombie.subtype === 'acid' ? 2 : (zombie.subtype === 'fat' ? 3 : 1);
      damage = Math.floor(Math.random() * 4) + minDamage;

      if (typeof target.takeDamage === 'function') {
        target.takeDamage(damage, zombie);

        // 5% chance to inflict bleeding on player
        if (target.type === 'player' && Math.random() < 0.05) {
          target.setBleeding(true);
          console.log(`[ZombieAI] Zombie ${zombie.id} inflicted bleeding on player`);
        }
      }
    }

    console.log(`[ZombieAI] Zombie ${zombie.id} attacked player. Hit: ${hit}, Damage: ${damage}, AP left: ${zombie.currentAP}`);

    return {
      success: hit,
      damage: damage,
      apUsed: apCost
    };
  }


}