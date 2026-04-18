import { EntityType } from '../entities/Entity.js';
import { MovementHelper } from '../utils/MovementHelper.js';
import { Pathfinding } from '../utils/Pathfinding.js';
import { ScentTrail } from '../utils/ScentTrail.js';
import audioManager from '../utils/AudioManager.js';
import { getZombieType } from '../entities/ZombieTypes.js';

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
    
    // Decrement persistence memory
    if (zombie.interactionMemory > 0) {
      zombie.interactionMemory--;
    }

    const turnResult = {
      zombieId: zombie.id,
      actions: [],
      apUsed: 0,
      behaviorTriggered: null
    };

    try {
      // 0. PASSIVE BREACH CHECK: If we are already adjacent to a closed mission structure, attack it!
      // This catches cases where the zombie is already at the door but lost direct sight of the player.
      if (zombie.currentTarget && zombie.currentTarget.type === 'structure') {
        const tile = gameMap.getTile(zombie.currentTarget.x, zombie.currentTarget.y);
        const structure = tile?.contents.find(e => (e.type === EntityType.DOOR || e.type === EntityType.WINDOW) && e.id === zombie.currentTarget.id);
        const isClosed = structure && (structure.type === EntityType.DOOR ? !structure.isOpen : (structure.isReinforced || (!structure.isBroken && !structure.isOpen)));
        
        if (isClosed && Math.abs(zombie.x - zombie.currentTarget.x) + Math.abs(zombie.y - zombie.currentTarget.y) === 1) {
          // Adjacent to mission door! Dump AP into it.
          while (zombie.currentAP > 0 && turnResult.actions.length < 20) {
            const attackResult = this.executeStructureAttack(zombie, gameMap, structure, { x: zombie.currentTarget.x, y: zombie.currentTarget.y }, { x: zombie.x, y: zombie.y });
            if (attackResult.success) {
              turnResult.actions.push(attackResult);
      // 1. Can see player - Highest priority
      const canSee = zombie.canSeeEntity(gameMap, player);
      if (canSee) {
        zombie.currentTarget = null;
        zombie.setTargetSighted(player.x, player.y);
        console.log(`[ZombieAI] Zombie ${zombie.id} sees player at (${player.x}, ${player.y})`);
        
        const playerTile = gameMap.getTile(player.x, player.y);
        if (playerTile && playerTile.scentSequence) {
          zombie.lastScentSequence = Math.max(zombie.lastScentSequence || 0, playerTile.scentSequence);
        } else {
          zombie.lastScentSequence = Math.max(zombie.lastScentSequence || 0, gameMap.scentSequenceCounter);
        }

        turnResult.behaviorTriggered = 'canSeePlayer';
        this.executeCanSeePlayerBehavior(zombie, gameMap, player, turnResult, playerCardinalPositions);
      }
      // 2. Mission Target (e.g. Breaching a door identified in a previous action)
      else if (zombie.currentTarget && zombie.currentTarget.type === 'structure') {
        console.log(`[ZombieAI] Zombie ${zombie.id} continuing mission on structure at (${zombie.currentTarget.x}, ${zombie.currentTarget.y})`);
        turnResult.behaviorTriggered = 'breaching';
        zombie.behaviorState = 'pursuing'; // Actively trying to kill something
        
        while (zombie.currentAP > 0 && turnResult.actions.length < 20) {
          const moveResult = this.attemptMoveTowards(zombie, gameMap, zombie.currentTarget.x, zombie.currentTarget.y);
          if (moveResult.success) {
            turnResult.actions.push(moveResult);
          } else {
            break;
          }
        }
      }
      // 3. LastSeen is true - Move to last known position
      else if (zombie.lastSeen) {
        console.log(`[ZombieAI] Zombie ${zombie.id} lost player, entering LastSeen behavior targeting (${zombie.targetSightedCoords.x}, ${zombie.targetSightedCoords.y})`);
        zombie.isAlerted = false;
        turnResult.behaviorTriggered = 'lastSeen';
        this.executeLastSeenBehavior(zombie, gameMap, turnResult, playerCardinalPositions, lastSeenTaggedTiles);
      }
      // 4. HeardNoise is true - Investigate noise
      else if (zombie.heardNoise) {
        console.log(`[ZombieAI] Zombie ${zombie.id} investigating noise at (${zombie.noiseCoords.x}, ${zombie.noiseCoords.y})`);
        zombie.isAlerted = false;
        turnResult.behaviorTriggered = 'heardNoise';
        this.executeHeardNoiseBehavior(zombie, gameMap, turnResult, playerCardinalPositions, lastSeenTaggedTiles);
      }
      // 5. Random wandering or Dwelling
      else if (zombie.interactionMemory <= 0) {
        console.log(`[ZombieAI] Zombie ${zombie.id} idling/wandering`);
        zombie.isAlerted = false;
        turnResult.behaviorTriggered = 'randomWander';
        this.executeRandomWanderBehavior(zombie, gameMap, turnResult);
      }
      else {
        // Dwell at the structure (e.g. just finished breaching or reached last seen)
        console.log(`[ZombieAI] Zombie ${zombie.id} dwelling (interactionMemory: ${zombie.interactionMemory})`);
        zombie.isAlerted = false;
        zombie.behaviorState = 'investigating';
        turnResult.behaviorTriggered = 'dwell';
        zombie.useAP(1.0);
        turnResult.actions.push({
          type: 'wait',
          from: { x: zombie.x, y: zombie.y },
          to: { x: zombie.x, y: zombie.y },
          apCost: 1.0,
          reason: 'Dwelling at structure'
        });
      }

    } catch (error) {
      console.error('[ZombieAI] Error during zombie turn:', error);
      turnResult.success = false;
      turnResult.error = error.message;
    }

    zombie.endTurn();
    turnResult.apUsed = zombie.maxAP - zombie.currentAP;
    turnResult.success = true;

    console.log(`[ZombieAI] --- Zombie ${zombie.id} Turn End. Actions: ${turnResult.actions.length} ---`);
    return turnResult;
  }

  /**
   * Execute "can see player" behavior - use all AP to move towards and attack player
   * @param {Zombie} zombie - The zombie
   * @param {GameMap} gameMap - The game map
   * @param {Player} player - The player
   * @param {Object} turnResult - Result object to update
   */
  static executeCanSeePlayerBehavior(zombie, gameMap, player, turnResult, playerCardinalPositions = []) {
    zombie.behaviorState = 'pursuing';

    // 1. Mission override: If we see the player, the door mission is aborted!
    if (zombie.currentTarget) {
      console.log(`[ZombieAI] Zombie ${zombie.id} spotted player! Aborting mission at (${zombie.currentTarget.x}, ${zombie.currentTarget.y})`);
      zombie.currentTarget = null;
    }

    // 2. Alert sound (only if not already alerted this turn)
    if (!zombie.isAlerted) {
      if (gameMap.emitNoise) gameMap.emitNoise(zombie.x, zombie.y, 10);
      zombie.isAlerted = true;
      turnResult.actions.push({
        type: 'alert',
        from: { x: zombie.x, y: zombie.y },
        zombieId: zombie.id
      });
    }

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

      // 2. Move toward the best available cardinal tile adjacent to the player.
      // We target a neighbor instead of the player tile to avoid "stepping on" the player.
      const candidatePositions = this.findBestCardinalPositions(zombie, playerCardinalPositions, gameMap);
      
      let moved = false;
      for (const targetPos of candidatePositions) {
        const targetX = targetPos.x;
        const targetY = targetPos.y;

        const moveResult = this.attemptMoveTowards(zombie, gameMap, targetX, targetY);

        if (moveResult.success) {
          // Update persistent tracking info as we move closer
          zombie.setTargetSighted(player.x, player.y);
          
          turnResult.actions.push({
            type: moveResult.type || 'move',
            from: moveResult.from,
            to: moveResult.to,
            apCost: moveResult.apCost,
            doorPos: moveResult.doorPos,
            doorBroken: moveResult.doorBroken,
            windowPos: moveResult.windowPos,
            windowBroken: moveResult.windowBroken
          });
          console.log(`[ZombieAI] Zombie ${zombie.id} moved toward player neighbor (${targetX}, ${targetY}), remaining AP: ${zombie.currentAP}`);
          moved = true;
          break; // Moved successfully, continue the while loop for next action
        } else {
          console.log(`[ZombieAI] Zombie ${zombie.id} move to (${targetX}, ${targetY}) failed: ${moveResult.reason}, trying next candidate...`);
        }
      }

      if (!moved) {
        console.log(`[ZombieAI] Zombie ${zombie.id} could not move to ANY cardinal position around player, ending turn`);
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
   */
  static executeLastSeenBehavior(zombie, gameMap, turnResult, playerCardinalPositions = [], lastSeenTaggedTiles = new Set()) {
    zombie.behaviorState = 'investigating';
    
    // Use all AP to move strictly following the scent trail or towards last seen target
    let safetyCounter = 0;
    while (zombie.currentAP > 0 && turnResult.actions.length < 20 && safetyCounter < 30) {
      safetyCounter++;
      
      // 1. LOOK FOR IMMEDIATE BREADCRUMBS (Scent Trail)
      const nextScent = ScentTrail.findFreshestScent(gameMap, zombie.x, zombie.y, 3, zombie.lastScentSequence || 0);
      
      let targetX, targetY;
      let isBreadcrumb = false;

      if (nextScent) {
        // If we're already standing on the freshest scent we found, consume it and look for the next one
        if (zombie.x === nextScent.x && zombie.y === nextScent.y) {
          zombie.lastScentSequence = nextScent.sequence;
          continue; 
        }
        targetX = nextScent.x;
        targetY = nextScent.y;
        isBreadcrumb = true;
        console.log(`[ZombieAI] Zombie ${zombie.id} found scent breadcrumb at (${targetX}, ${targetY}) sequence ${nextScent.sequence}`);
      } else {
        // 2. FALLBACK: Move towards last seen coordinates
        targetX = zombie.targetSightedCoords.x;
        targetY = zombie.targetSightedCoords.y;
        console.log(`[ZombieAI] Zombie ${zombie.id} following LKP fallback to (${targetX}, ${targetY})`);

        // If we've reached the last seen spot and still have no new scent, we are done
        if (zombie.x === targetX && zombie.y === targetY) {
          console.log(`[ZombieAI] Zombie ${zombie.id} reached LKP, ending search`);
          zombie.lastSeen = false;
          break;
        }
      }

      const moveResult = this.attemptMoveTowards(zombie, gameMap, targetX, targetY);

      if (moveResult.success) {
        // Record action
        turnResult.actions.push({
          type: moveResult.type || 'move',
          from: moveResult.from,
          to: moveResult.to,
          apCost: moveResult.apCost,
          doorPos: moveResult.doorPos,
          doorBroken: moveResult.doorBroken,
          windowPos: moveResult.windowPos,
          windowBroken: moveResult.windowBroken
        });

        // Update scent sequence ONLY if we actually moved onto a tile (not just attacked a door)
        if (isBreadcrumb && (moveResult.to.x !== moveResult.from.x || moveResult.to.y !== moveResult.from.y)) {
          zombie.lastScentSequence = nextScent.sequence;
          zombie.lastDirection = { x: moveResult.to.x - moveResult.from.x, y: moveResult.to.y - moveResult.from.y };
        }

        // Check if we can now see the player
        const player = gameMap.getAllEntities().find(e => e.type === EntityType.PLAYER);
        if (player && zombie.canSeeEntity(gameMap, player)) {
          zombie.setTargetSighted(player.x, player.y);
          this.executeCanSeePlayerBehavior(zombie, gameMap, player, turnResult, playerCardinalPositions);
          break;
        }

        // If we reached our final target (not a breadcrumb), end investigating
        if (!isBreadcrumb && zombie.x === targetX && zombie.y === targetY) {
          zombie.lastSeen = false;
          break;
        }
      } else {
        // Path blocked or no path found
        console.log(`[ZombieAI] Investigation path to (${targetX}, ${targetY}) blocked: ${moveResult.reason}`);
        break;
      }
    }
    if (safetyCounter >= 30) {
      console.warn(`[ZombieAI] Zombie ${zombie.id} hit hard loop limit in executeLastSeenBehavior`);
    }
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
    let noiseSafety = 0;
    while (zombie.currentAP > 0 && turnResult.actions.length < 20 && noiseSafety < 30) {
      noiseSafety++;
      if (zombie.x === targetX && zombie.y === targetY) {
        zombie.clearNoiseHeard();
        break;
      }

      const moveResult = this.attemptMoveTowards(zombie, gameMap, targetX, targetY);

      if (moveResult.success) {
        turnResult.actions.push({
          type: moveResult.type || 'move',
          from: moveResult.from,
          to: moveResult.to,
          apCost: moveResult.apCost,
          doorPos: moveResult.doorPos,
          doorBroken: moveResult.doorBroken,
          windowPos: moveResult.windowPos,
          windowBroken: moveResult.windowBroken
        });

        // Update direction for momentum if it was a real move
        if (moveResult.to.x !== moveResult.from.x || moveResult.to.y !== moveResult.from.y) {
           zombie.lastDirection = { x: moveResult.to.x - moveResult.from.x, y: moveResult.to.y - moveResult.from.y };
        }

        // Check if player is now visible
        const playerEntity = gameMap.getAllEntities().find(e => e.type === EntityType.PLAYER);
        if (playerEntity && zombie.canSeeEntity(gameMap, playerEntity)) {
          zombie.setTargetSighted(playerEntity.x, playerEntity.y);
          this.executeCanSeePlayerBehavior(zombie, gameMap, playerEntity, turnResult, playerCardinalPositions);
          break;
        }
      } else {
        console.log(`[ZombieAI] Noise investigation to (${targetX}, ${targetY}) blocked: ${moveResult.reason}`);
        break;
      }
    }
    if (noiseSafety >= 30) {
      console.warn(`[ZombieAI] Zombie ${zombie.id} hit hard loop limit in executeHeardNoiseBehavior`);
    }
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
    zombie.behaviorState = 'investigating';

    while (zombie.currentAP > 0) {
      const nextX = zombie.x + direction.x;
      const nextY = zombie.y + direction.y;

      const moveResult = this.attemptMoveTowards(zombie, gameMap, nextX, nextY);

      if (moveResult.success) {
        turnResult.actions.push({
          type: moveResult.type || 'move',
          from: moveResult.from,
          to: moveResult.to,
          apCost: moveResult.apCost,
          doorPos: moveResult.doorPos,
          doorBroken: moveResult.doorBroken,
          windowPos: moveResult.windowPos,
          windowBroken: moveResult.windowBroken
        });

        // Check for player visibility
        const player = gameMap.getAllEntities().find(e => e.type === EntityType.PLAYER);
        if (player && zombie.canSeeEntity(gameMap, player)) {
          zombie.setTargetSighted(player.x, player.y);
          this.executeCanSeePlayerBehavior(zombie, gameMap, player, turnResult, playerCardinalPositions);
          break;
        }
      } else {
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
      const minMoveCost = zombie.getMovementMultiplier();
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
          const hasDoor = tile?.contents.some(e => e.type === EntityType.DOOR && !e.isOpen);
          if (hasDoor) continue;

          const fromPos = { x: zombie.x, y: zombie.y };
          try {
            const subtypeMult = zombie.getMovementMultiplier();
            const moveDist = Pathfinding.getMovementCost(zombie.x, zombie.y, dir.x, dir.y, null, { isZombie: true });
            const apCost = subtypeMult * moveDist;
            
            if (zombie.currentAP < apCost) continue;

            gameMap.moveEntity(zombie.id, dir.x, dir.y);
            zombie.useAP(apCost);
            zombie.movementPath.push({ x: dir.x, y: dir.y });

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
   */  static attemptMoveTowards(zombie, gameMap, targetX, targetY, options = {}) {
    console.log(`[ZombieAI] attemptMoveTowards: zombie at (${zombie.x}, ${zombie.y}), target (${targetX}, ${targetY}), AP: ${zombie.currentAP}`);

    // 1. Check if we already have a mission target (e.g. a door we are breaching)
    if (zombie.currentTarget && zombie.currentTarget.type === 'structure') {
      const tile = gameMap.getTile(zombie.currentTarget.x, zombie.currentTarget.y);
      const structure = tile?.contents.find(e => (e.type === EntityType.DOOR || e.type === EntityType.WINDOW) && e.id === zombie.currentTarget.id);
      
      const isClosed = structure && (structure.type === EntityType.DOOR ? !structure.isOpen : (structure.isReinforced || (!structure.isBroken && !structure.isOpen)));
      
      if (isClosed) {
        // We have a door to kill! Are we targeting it right now?
        if (targetX !== zombie.currentTarget.x || targetY !== zombie.currentTarget.y) {
           console.log(`[ZombieAI] Zombie ${zombie.id} overriding target (${targetX}, ${targetY}) to focus on mission door at (${zombie.currentTarget.x}, ${zombie.currentTarget.y})`);
           return this.attemptMoveTowards(zombie, gameMap, zombie.currentTarget.x, zombie.currentTarget.y, options);
        }
      } else {
        // Mission complete! Door is dead/open.
        console.log(`[ZombieAI] Zombie ${zombie.id} mission door at (${zombie.currentTarget.x}, ${zombie.currentTarget.y}) is breached. Clearing target.`);
        zombie.currentTarget = null;
        // Proceed with original target (e.g. player)
      }
    }

    // Check if already at target
    if (zombie.x === targetX && zombie.y === targetY) {
      return { success: false, reason: 'Already at target' };
    }

    const fromPos = { x: zombie.x, y: zombie.y };
    const subtypeMult = zombie.getMovementMultiplier();
    const minMoveCost = subtypeMult * 1.0;

    if (zombie.currentAP < minMoveCost) {
      return { success: false, reason: 'Insufficient AP' };
    }

    // --- MYOPIC FILTER: Closed doors and windows are SOLID WALLS ---
    const myopicFilter = (tile) => {
      // 1. Interactive structures take precedence (allow pathing TO them)
      const door = tile.contents.find(e => e.type === EntityType.DOOR);
      if (door) return door.isOpen;

      const window = tile.contents.find(e => e.type === EntityType.WINDOW);
      if (window) return window.isBroken || window.isOpen;

      // 2. Terrain blocks
      if (['wall', 'fence', 'tree', 'water', 'building', 'tent_wall'].includes(tile.terrain)) return false;
      
      // 3. Other zombies block pathfinding
      const hasOtherZombie = tile.contents.some(e => e.type === EntityType.ZOMBIE && e.id !== zombie.id);
      if (hasOtherZombie) return false;

      return !tile.unwalkable;
    };

    // Attempt Primary Path (Doors = Walls)
    let path = Pathfinding.findPath(gameMap, zombie.x, zombie.y, targetX, targetY, {
      allowDiagonal: true,
      entityFilter: myopicFilter,
      maxDistance: 25,
      isZombie: true
    });

    // --- GHOST PATH FALLBACK: Identify the door to kill ---
    if (path.length <= 1) {
      console.log(`[ZombieAI] Myopic path blocked. Identifying obstacle target...`);
      
      const ghostFilter = (tile) => !['water', 'deep_water'].includes(tile.terrain);

      const ghostPath = Pathfinding.findPath(gameMap, zombie.x, zombie.y, targetX, targetY, {
        allowDiagonal: true,
        entityFilter: ghostFilter,
        maxDistance: 25,
        isZombie: true
      });

      console.log(`[ZombieAI] Ghost path to (${targetX}, ${targetY}): length ${ghostPath.length}`);

      if (ghostPath.length > 1) {
        let obstacleIndex = -1;
        let structure = null;

        for (let i = 1; i < ghostPath.length; i++) {
          const step = ghostPath[i];
          const stepTile = gameMap.getTile(step.x, step.y);
          const s = stepTile?.contents.find(e => e.type === EntityType.DOOR || e.type === EntityType.WINDOW);
          const isClosed = s && (s.type === EntityType.DOOR ? !s.isOpen : (s.isReinforced || (!s.isBroken && !s.isOpen)));
          
          if (isClosed) {
            obstacleIndex = i;
            structure = s;
            break;
          }
          if (stepTile?.contents.some(e => e.type === EntityType.ZOMBIE && e.id !== zombie.id)) {
            obstacleIndex = i;
            break;
          }
        }

        if (obstacleIndex !== -1) {
          const obstaclePos = ghostPath[obstacleIndex];
          
          if (obstacleIndex === 1) {
            if (structure) {
              // SET AS MISSION TARGET
              zombie.currentTarget = { type: 'structure', id: structure.id, x: obstaclePos.x, y: obstaclePos.y };
              
              // Cardinal attack only
              if (Math.abs(zombie.x - obstaclePos.x) + Math.abs(zombie.y - obstaclePos.y) === 1) {
                return this.executeStructureAttack(zombie, gameMap, structure, obstaclePos, fromPos);
              } else {
                // Diagonal: Move cardinal
                const candidates = [{ x: obstaclePos.x, y: zombie.y }, { x: zombie.x, y: obstaclePos.y }];
                for (const cand of candidates) {
                  if (this.canMoveToTile(gameMap, cand.x, cand.y, zombie.subtype)) {
                    const moveDist = Pathfinding.getMovementCost(zombie.x, zombie.y, cand.x, cand.y, gameMap.getTile(cand.x, cand.y), { isZombie: true });
                    const apCost = subtypeMult * moveDist;
                    if (zombie.currentAP >= apCost) {
                      if (gameMap.moveEntity(zombie.id, cand.x, cand.y)) {
                        zombie.useAP(apCost);
                        zombie.movementPath.push({ x: cand.x, y: cand.y });
                        return { success: true, from: fromPos, to: { x: cand.x, y: cand.y }, apCost: apCost };
                      }
                    }
                  }
                }
                zombie.useAP(1.0);
                return { success: true, from: fromPos, to: fromPos, type: 'wait', apCost: 1.0, reason: 'Waiting to engage structure' };
              }
            } else {
              zombie.useAP(1.0);
              return { success: true, from: fromPos, to: fromPos, type: 'wait', apCost: 1.0, reason: 'Waiting for horde' };
            }
          } else {
            // Obstacle is further away.
            path = Pathfinding.findPath(gameMap, zombie.x, zombie.y, ghostPath[obstacleIndex - 1].x, ghostPath[obstacleIndex - 1].y, {
              allowDiagonal: true,
              entityFilter: myopicFilter,
              maxDistance: 25,
              isZombie: true
            });
          }
        } else {
          path = ghostPath;
        }
      }
    }

    // Execute Move
    if (path.length > 1) {
      const nextMove = path[1];
      const nextTile = gameMap.getTile(nextMove.x, nextMove.y);
      const apCost = subtypeMult * Pathfinding.getMovementCost(zombie.x, zombie.y, nextMove.x, nextMove.y, nextTile, { isZombie: true });

      if (zombie.currentAP >= apCost) {
        if (gameMap.moveEntity(zombie.id, nextMove.x, nextMove.y)) {
          zombie.useAP(apCost);
          zombie.movementPath.push({ x: nextMove.x, y: nextMove.y });
          return { success: true, from: fromPos, to: { x: nextMove.x, y: nextMove.y }, apCost: apCost };
        }
      }
    }

    return { success: false, reason: 'No path found' };
  }


  /**
   * Helper to execute attack on a structure (door/window)
   */
  static executeStructureAttack(zombie, gameMap, structure, pos, fromPos) {
    const subtypeMult = zombie.getMovementMultiplier();
    const cost = structure.type === EntityType.DOOR ? (subtypeMult * 1.0) : 1.0;

    if (zombie.currentAP < cost) return { success: false, reason: 'Insufficient AP' };

    zombie.useAP(cost);
    const result = structure.takeDamage(1, false); // Loud attack (triggers sounds and UI events)
    zombie.interactionMemory = 0; // No delay while breaching

    // Noise propagation
    if (gameMap.emitNoise) gameMap.emitNoise(pos.x, pos.y, 6);

    return {
      success: true,
      from: fromPos,
      to: fromPos,
      type: structure.type === EntityType.DOOR ? 'attackDoor' : 'attackWindow',
      doorPos: structure.type === EntityType.DOOR ? pos : null,
      windowPos: structure.type === EntityType.WINDOW ? pos : null,
      apCost: cost,
      doorBroken: structure.type === EntityType.DOOR ? structure.hp <= 0 : false,
      windowBroken: structure.type === EntityType.WINDOW ? result.isBroken : false
    };
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
    if (!targetTile) return false;

    // Check terrain first (walls, buildings, etc. are always impassable for MOVE)
    if (['wall', 'building', 'fence', 'tree', 'water'].includes(targetTile.terrain)) {
      return false;
    }

    // Check for blocking entities
    const hasBlockingEntities = targetTile.contents.some(entity => {
      // CRAWLERS cannot use windows
      if (zombieSubtype === 'crawler' && entity.type === EntityType.WINDOW) return true;

      // Closed structures block movement
      if (entity.type === EntityType.DOOR && !entity.isOpen) return true;
      if (entity.type === EntityType.WINDOW && (entity.isReinforced || (!entity.isBroken && !entity.isOpen))) return true;

      // Player and open structures are NOT blocking for move validation (handled by attemptMoveTowards)
      if (entity.type === EntityType.DOOR || entity.type === EntityType.WINDOW || entity.type === EntityType.PLAYER) return false;

      // Other zombies block actual movement
      return entity.blocksMovement;
    });

    return !hasBlockingEntities;
  }

  /**
   * Find all suitable cardinal positions sorted by preference and accessibility
   * @param {Zombie} zombie - The zombie
   * @param {Array} playerCardinalPositions - Pre-calculated cardinal positions around player
   * @param {GameMap} gameMap - The game map
   * @returns {Array} - Sorted array of candidate positions
   */
  static findBestCardinalPositions(zombie, playerCardinalPositions, gameMap) {
    if (!playerCardinalPositions || playerCardinalPositions.length === 0) return [];

    // 1. Filter candidates (dynamic re-validation of stale playerCardinalPositions)
    const candidatePositions = playerCardinalPositions.filter(pos => {
      const tile = gameMap.getTile(pos.x, pos.y);
      if (!tile) return false;

      // A tile is a candidate if it's walkable (floor/grass) OR contains a door/window
      const isTerrainWalkable = !['wall', 'building', 'fence', 'tree', 'water'].includes(tile.terrain);
      const hasInteractiveEnt = tile.contents.some(e => e.type === EntityType.DOOR || e.type === EntityType.WINDOW);
      
      return isTerrainWalkable || hasInteractiveEnt;
    });

    if (candidatePositions.length === 0) return [];

    const scoredPositions = candidatePositions.map(pos => {
      const tile = gameMap.getTile(pos.x, pos.y);
      // Actual occupancy check (other zombies block standing here)
      const isOccupied = tile?.contents.some(e => e.type === EntityType.ZOMBIE && e.id !== zombie.id);
      const distance = Math.abs(zombie.x - pos.x) + Math.abs(zombie.y - pos.y);

      // 2. Accessibility check (findPath now penalizes but doesn't block zombies/doors)
      const pathAround = Pathfinding.findPath(gameMap, zombie.x, zombie.y, pos.x, pos.y, {
        allowDiagonal: true,
        isZombie: true, // Enable AP penalties in Pathfinding.js
        entityFilter: (t) => {
          // Allow pathing through building/wall terrain ONLY if a door or window is present
          if (['wall', 'fence', 'tree', 'building', 'water', 'tent_wall'].includes(t.terrain)) {
            const hasEntrableStructure = t.contents.some(e => e.type === EntityType.DOOR || e.type === EntityType.WINDOW);
            if (!hasEntrableStructure) return false;
          }
          return true;
        },
        maxDistance: 20
      });

      return {
        ...pos,
        isOccupied,
        hasClearPath: pathAround.length > 0,
        pathLength: pathAround.length > 0 ? pathAround.length : 999, // Store actual walking distance
        distance
      };
    });

    scoredPositions.sort((a, b) => {
      // 1. Prefer reachable spots (no other zombies blocking the path)
      if (a.hasClearPath && !b.hasClearPath) return -1;
      if (!a.hasClearPath && b.hasClearPath) return 1;

      // 2. Prefer unoccupied spots
      if (!a.isOccupied && b.isOccupied) return -1;
      if (a.isOccupied && !b.isOccupied) return 1;

      // 3. Primary: Prefer shortest WALKING distance (pathAround length)
      // This solves the "back window detour" issue by preferring the most direct entry point
      if (a.pathLength !== b.pathLength) {
        return a.pathLength - b.pathLength;
      }

      // 4. Secondary: Tie-breaker - prefer tiles containing interactive structures (engagement points)
      const aTile = gameMap.getTile(a.x, a.y);
      const bTile = gameMap.getTile(b.x, b.y);
      const aHasStructure = aTile?.contents.some(e => e.type === EntityType.DOOR || e.type === EntityType.WINDOW);
      const bHasStructure = bTile?.contents.some(e => e.type === EntityType.DOOR || e.type === EntityType.WINDOW);
      
      if (aHasStructure && !bHasStructure) return -1;
      if (!aHasStructure && bHasStructure) return 1;

      // 5. Tertiary: Fallback to Manhattan distance
      return a.distance - b.distance;
    });

    return scoredPositions;
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
    const maxRadius = 3;
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
    const apCost = 1.0;
    if (zombie.currentAP < apCost) return { success: false, reason: 'Insufficient AP' };

    zombie.useAP(apCost);

    const hit = Math.random() < 0.5;
    let damage = 0;
    let bleedingInflicted = false;

    if (hit) {
      const typeDef = getZombieType(zombie.subtype);
      const { min, max } = typeDef.combat.damage;
      damage = Math.floor(Math.random() * (max - min + 1)) + min;

      // Logic check for bleeding (don't apply it yet)
      if (target.type === 'player' && Math.random() < 0.05) {
        bleedingInflicted = true;
      }
    }

    console.log(`[ZombieAI] Zombie ${zombie.id} calculated attack on player. Hit: ${hit}, Damage: ${damage}, Bleeding: ${bleedingInflicted}`);

    return {
      success: hit,
      damage: damage,
      bleedingInflicted: bleedingInflicted,
      apUsed: apCost
    };
  }


}