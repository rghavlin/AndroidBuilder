import { EntityType } from '../entities/Entity.js';
import { MovementHelper } from '../utils/MovementHelper.js';
import { Pathfinding } from '../utils/Pathfinding.js';
import { ScentTrail } from '../utils/ScentTrail.js';
import { LineOfSight } from '../utils/LineOfSight.js';
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
    // BUG 8 FIX: Removed interactionMemory decrementing which was causing unexplained stalls.
    // We now rely on active behavior states.

    const turnResult = {
      zombieId: zombie.id,
      actions: [],
      apUsed: 0,
      behaviorTriggered: null
    };

    try {
      // VISION-FIRST: Player visibility is ALWAYS checked first, no pre-emption.

      // 1. Can see player - Highest priority
      const canSee = zombie.canSeeEntity(gameMap, player);
      if (canSee) {
        zombie.currentTarget = null;
        zombie.setTargetSighted(player.x, player.y);
        console.log(`[ZombieAI] Zombie ${zombie.id} sees player at (${player.x}, ${player.y})`);
        
        // Update momentum tracking
        const dx = Math.sign(player.x - zombie.x);
        const dy = Math.sign(player.y - zombie.y);
        zombie.lastDirection = { x: dx, y: dy };
        zombie.momentumSteps = 1 + Math.floor(Math.random() * 2);

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
        zombie.behaviorState = 'pursuing'; 
        
        while (zombie.currentAP > 0 && turnResult.actions.length < 20) {
          // VISION CHECK: If we can now see the player, abandon the door immediately
          if (zombie.canSeeEntity(gameMap, player)) {
            console.log(`[ZombieAI] Zombie ${zombie.id} spotted player mid-breach! Abandoning structure mission.`);
            zombie.currentTarget = null;
            zombie.setTargetSighted(player.x, player.y);
            turnResult.behaviorTriggered = 'canSeePlayer';
            this.executeCanSeePlayerBehavior(zombie, gameMap, player, turnResult, playerCardinalPositions);
            break;
          }
          const moveResult = this.attemptMoveTowards(zombie, gameMap, zombie.currentTarget.x, zombie.currentTarget.y);
          if (moveResult.success) {
            turnResult.actions.push(moveResult);
          } else break;
        }
      }
      // 3. LastSeen is true - Move to last known position
      else if (zombie.lastSeen) {
        console.log(`[ZombieAI] Zombie ${zombie.id} following LKP targeting (${zombie.targetSightedCoords.x}, ${zombie.targetSightedCoords.y})`);
        zombie.isAlerted = false;
        turnResult.behaviorTriggered = 'lastSeen';
        this.executeLastSeenBehavior(zombie, gameMap, turnResult, playerCardinalPositions, lastSeenTaggedTiles);
      }
      // 4. Momentum - Keep moving in last direction
      else if (zombie.momentumSteps > 0 && zombie.lastDirection) {
        console.log(`[ZombieAI] Zombie ${zombie.id} executing momentum move: ${zombie.momentumSteps} steps left`);
        zombie.isAlerted = false;
        turnResult.behaviorTriggered = 'momentum';
        this.executeMomentumBehavior(zombie, gameMap, zombie.lastDirection, turnResult, playerCardinalPositions);
      }
      // 5. HeardNoise is true - Investigate noise
      else if (zombie.heardNoise) {
        console.log(`[ZombieAI] Zombie ${zombie.id} investigating noise at (${zombie.noiseCoords.x}, ${zombie.noiseCoords.y})`);
        zombie.isAlerted = false;
        turnResult.behaviorTriggered = 'heardNoise';
        this.executeHeardNoiseBehavior(zombie, gameMap, turnResult, playerCardinalPositions, lastSeenTaggedTiles);
      }
      // 6. Random wandering
      else {
        console.log(`[ZombieAI] Zombie ${zombie.id} idling/wandering`);
        zombie.isAlerted = false;
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

    // 1. Mission override: If we see the player, ANY door mission is aborted!
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

    const subtypeMult = zombie.getMovementMultiplier();

    // --- REACTIVE BRESENHAM-FIRST PURSUIT ---
    // Each step, the zombie looks at the player and takes one step toward them.
    // No persistent mission targets. No pre-selected cardinal positions.
    // The zombie follows its line of sight.
    let safetyCounter = 0;
    while (zombie.currentAP > 0 && safetyCounter < 20) {
      safetyCounter++;
      const fromPos = { x: zombie.x, y: zombie.y };

      // A) Cardinal adjacent to player → ATTACK
      if (zombie.isAdjacentTo(player.x, player.y)) {
        const attackResult = this.attemptAttack(zombie, player);
        turnResult.actions.push({
          type: 'attack',
          target: 'player',
          success: attackResult.success,
          damage: attackResult.damage || 0
        });

        if (!attackResult.success && attackResult.reason === 'Insufficient AP') break;

        // Re-check vision after attack
        if (!zombie.canSeeEntity(gameMap, player)) {
          this.executeLastSeenBehavior(zombie, gameMap, turnResult, playerCardinalPositions);
          return;
        }
        continue;
      }

      // B) Diagonally adjacent to player → SIDESTEP to cardinal position
      if (this.isDiagonallyAdjacentToPlayer(zombie, player)) {
        const cardinalPos = this.findOpenCardinalFromDiagonal(zombie, player, gameMap);
        if (cardinalPos) {
          const cardinalTile = gameMap.getTile(cardinalPos.x, cardinalPos.y);
          const apCost = subtypeMult * Pathfinding.getMovementCost(zombie.x, zombie.y, cardinalPos.x, cardinalPos.y, cardinalTile, { isZombie: true });
          if (zombie.currentAP >= apCost && gameMap.moveEntity(zombie.id, cardinalPos.x, cardinalPos.y)) {
            zombie.useAP(apCost);
            zombie.movementPath.push({ x: cardinalPos.x, y: cardinalPos.y });
            turnResult.actions.push({
              type: 'move',
              from: fromPos,
              to: { x: cardinalPos.x, y: cardinalPos.y },
              apCost: apCost
            });
            console.log(`[ZombieAI] Zombie ${zombie.id} sidestepped to cardinal (${cardinalPos.x}, ${cardinalPos.y})`);
            continue;
          }
        }
        // Both cardinal positions blocked — wait
        console.log(`[ZombieAI] Zombie ${zombie.id} diagonal to player, no open cardinal. Waiting.`);
        zombie.useAP(1.0);
        turnResult.actions.push({ type: 'wait', from: fromPos, to: fromPos, apCost: 1.0, reason: 'Waiting for cardinal opening' });
        break;
      }

      // C) Not adjacent → APPROACH using Bresenham line toward player
      let moved = false;
      const line = LineOfSight.getLinePath(zombie.x, zombie.y, player.x, player.y);

      if (line.length > 1) {
        const nextStep = line[1];
        const nextTile = gameMap.getTile(nextStep.x, nextStep.y);

        if (nextTile) {
          // Check for closed structure in the Bresenham path (e.g. window zombie sees player through)
          const structure = nextTile.contents.find(e => {
            if (e.type === EntityType.WINDOW) {
              if (e.isReinforced) return true;
              return !e.isBroken && !e.isOpen;
            }
            return false;
          });

          if (structure) {
            // Window in sightline → attack it (zombie sees player through it)
            const isCardinalToStructure = (zombie.x === nextStep.x || zombie.y === nextStep.y) &&
              Math.abs(zombie.x - nextStep.x) + Math.abs(zombie.y - nextStep.y) === 1;

            if (isCardinalToStructure) {
              console.log(`[ZombieAI] Zombie ${zombie.id} attacking window in sightline at (${nextStep.x}, ${nextStep.y})`);
              const attackResult = this.executeStructureAttack(zombie, gameMap, structure, nextStep, fromPos);
              if (attackResult.success) {
                turnResult.actions.push(attackResult);
                moved = true;
              }
            } else {
              // Diagonal to window — move to a cardinal neighbor of the window
              const windowNeighbors = [
                { x: nextStep.x + 1, y: nextStep.y },
                { x: nextStep.x - 1, y: nextStep.y },
                { x: nextStep.x, y: nextStep.y + 1 },
                { x: nextStep.x, y: nextStep.y - 1 }
              ].filter(pos => {
                const t = gameMap.getTile(pos.x, pos.y);
                return t && t.isWalkable(zombie) &&
                  !t.contents.some(e => e.type === EntityType.ZOMBIE && e.id !== zombie.id);
              }).sort((a, b) => {
                const distA = Math.abs(zombie.x - a.x) + Math.abs(zombie.y - a.y);
                const distB = Math.abs(zombie.x - b.x) + Math.abs(zombie.y - b.y);
                return distA - distB;
              });

              if (windowNeighbors.length > 0) {
                const nbr = windowNeighbors[0];
                const nbrTile = gameMap.getTile(nbr.x, nbr.y);
                const apCost = subtypeMult * Pathfinding.getMovementCost(zombie.x, zombie.y, nbr.x, nbr.y, nbrTile, { isZombie: true });
                if (zombie.currentAP >= apCost && gameMap.moveEntity(zombie.id, nbr.x, nbr.y)) {
                  zombie.useAP(apCost);
                  zombie.movementPath.push({ x: nbr.x, y: nbr.y });
                  turnResult.actions.push({ type: 'move', from: fromPos, to: { x: nbr.x, y: nbr.y }, apCost });
                  console.log(`[ZombieAI] Zombie ${zombie.id} repositioned to (${nbr.x}, ${nbr.y}) to attack window`);
                  moved = true;
                }
              }
            }
          } else if (nextTile.isWalkable(zombie) &&
            !nextTile.contents.some(e => e.type === EntityType.ZOMBIE && e.id !== zombie.id) &&
            !(nextStep.x === player.x && nextStep.y === player.y)) {
            // Clear tile, not occupied by another zombie, not the player's tile → move
            const isDiag = zombie.x !== nextStep.x && zombie.y !== nextStep.y;
            if (!isDiag || Pathfinding.canMoveDiagonally(gameMap, zombie.x, zombie.y, nextStep.x, nextStep.y)) {
              const apCost = subtypeMult * Pathfinding.getMovementCost(zombie.x, zombie.y, nextStep.x, nextStep.y, nextTile, { isZombie: true });
              if (zombie.currentAP >= apCost && gameMap.moveEntity(zombie.id, nextStep.x, nextStep.y)) {
                zombie.useAP(apCost);
                zombie.movementPath.push({ x: nextStep.x, y: nextStep.y });
                turnResult.actions.push({ type: 'move', from: fromPos, to: { x: nextStep.x, y: nextStep.y }, apCost });
                console.log(`[ZombieAI] Zombie ${zombie.id} Bresenham move to (${nextStep.x}, ${nextStep.y})`);
                moved = true;
              }
            }
          }
        }
      }

      // D) Bresenham step failed → A* FALLBACK toward nearest approach tile
      if (!moved) {
        const approachTiles = this.findBestApproachTile(zombie, player, gameMap);
        let astarMoved = false;

        for (const approachTile of approachTiles) {
          // If we're already at this tile, skip (we handled adjacency above)
          if (zombie.x === approachTile.x && zombie.y === approachTile.y) continue;

          const myopicFilter = (tile) => {
            const door = tile.contents.find(e => e.type === EntityType.DOOR);
            if (door) return door.isOpen;
            const window = tile.contents.find(e => e.type === EntityType.WINDOW);
            if (window) return window.isBroken || window.isOpen;
            if (['wall', 'fence', 'tree', 'water', 'building', 'tent_wall'].includes(tile.terrain)) return false;
            const hasOtherZombie = tile.contents.some(e => e.type === EntityType.ZOMBIE && e.id !== zombie.id);
            if (hasOtherZombie) return false;
            return !tile.unwalkable;
          };

          const path = Pathfinding.findPath(gameMap, zombie.x, zombie.y, approachTile.x, approachTile.y, {
            allowDiagonal: true,
            entityFilter: myopicFilter,
            maxDistance: 25,
            isZombie: true
          });

          if (path.length > 1) {
            const nextMove = path[1];
            const nextMoveTile = gameMap.getTile(nextMove.x, nextMove.y);
            const apCost = subtypeMult * Pathfinding.getMovementCost(zombie.x, zombie.y, nextMove.x, nextMove.y, nextMoveTile, { isZombie: true });
            if (zombie.currentAP >= apCost && gameMap.moveEntity(zombie.id, nextMove.x, nextMove.y)) {
              zombie.useAP(apCost);
              zombie.movementPath.push({ x: nextMove.x, y: nextMove.y });
              turnResult.actions.push({ type: 'move', from: fromPos, to: { x: nextMove.x, y: nextMove.y }, apCost });
              console.log(`[ZombieAI] Zombie ${zombie.id} A* fallback to (${nextMove.x}, ${nextMove.y})`);
              astarMoved = true;
              break;
            }
          }
        }

        if (!astarMoved) {
          console.log(`[ZombieAI] Zombie ${zombie.id} could not move toward player, ending pursuit.`);
          zombie.useAP(1.0);
          turnResult.actions.push({ type: 'wait', from: fromPos, to: fromPos, apCost: 1.0, reason: 'No path to player' });
          break;
        }
      }

      // E) Re-check vision after each step
      if (zombie.canSeeEntity(gameMap, player)) {
        zombie.setTargetSighted(player.x, player.y);
        // Update momentum tracking
        const dx = Math.sign(player.x - zombie.x);
        const dy = Math.sign(player.y - zombie.y);
        zombie.lastDirection = { x: dx, y: dy };
        zombie.momentumSteps = 1 + Math.floor(Math.random() * 2);
      } else {
        console.log(`[ZombieAI] Zombie ${zombie.id} lost sight mid-pursuit. Switching to investigation.`);
        this.executeLastSeenBehavior(zombie, gameMap, turnResult, playerCardinalPositions);
        return;
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
        targetX = nextScent.x;
        targetY = nextScent.y;
        isBreadcrumb = true;
        console.log(`[ZombieAI] Zombie ${zombie.id} found scent breadcrumb at (${targetX}, ${targetY}) sequence ${nextScent.sequence}`);
      } else {
        // BUG 9 FIX: Prioritize investigating the EXACT tile where the player was last seen.
        // Previously, zombies targeted a neighbor, causing them to stop 1 tile short of the actual LKP.
        const lkpX = zombie.targetSightedCoords.x;
        const lkpY = zombie.targetSightedCoords.y;
        const lkpTile = gameMap.getTile(lkpX, lkpY);
        
        // Check if the LKP tile itself is walkable and unoccupied
        const isOccupied = lkpTile?.contents.some(e => e.type === EntityType.ZOMBIE && e.id !== zombie.id);
        const isTerrainPassable = lkpTile && !['wall', 'fence', 'tree', 'water', 'building', 'tent_wall'].includes(lkpTile.terrain);
        
        if (isTerrainPassable && !isOccupied) {
          targetX = lkpX;
          targetY = lkpY;
          console.log(`[ZombieAI] Zombie ${zombie.id} investigating exact LKP: (${targetX}, ${targetY})`);
        } else {
          // Fallback to best neighbor if LKP is blocked/impassable
          const bestPositions = this.findBestNeighborForPosition(gameMap, zombie, lkpX, lkpY);
          if (bestPositions.length > 0) {
            const best = bestPositions[0];
            targetX = best.x;
            targetY = best.y;
            console.log(`[ZombieAI] Zombie ${zombie.id} LKP blocked, targeting neighbor: (${targetX}, ${targetY})`);
          } else {
            targetX = lkpX;
            targetY = lkpY;
          }
        }

        // If we've reached the target position and still have no new scent, we are done with LKP
        if (zombie.x === targetX && zombie.y === targetY) {
          console.log(`[ZombieAI] Zombie ${zombie.id} reached investigation target, clearing lastSeen`);
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

    while (zombie.currentAP >= 1.0 && zombie.momentumSteps > 0 && turnResult.actions.length < 20) {
      zombie.momentumSteps--;
      
      const nextX = zombie.x + direction.x;
      const nextY = zombie.y + direction.y;

      console.log(`[ZombieAI] Momentum move for ${zombie.id} towards (${nextX}, ${nextY}). Steps remaining: ${zombie.momentumSteps}`);

      const moveResult = this.attemptMoveTowards(zombie, gameMap, nextX, nextY);

      if (moveResult.success) {
        turnResult.actions.push({
          type: moveResult.type === 'move' ? 'momentum_move' : moveResult.type,
          from: moveResult.from,
          to: moveResult.to,
          apCost: moveResult.apCost,
          zombieId: zombie.id,
          doorPos: moveResult.doorPos,
          doorBroken: moveResult.doorBroken,
          windowPos: moveResult.windowPos,
          windowBroken: moveResult.windowBroken
        });

        // Check for player visibility — if found, immediately switch to pursuit
        const player = gameMap.getAllEntities().find(e => e.type === EntityType.PLAYER);
        if (player && zombie.canSeeEntity(gameMap, player)) {
          console.log(`[ZombieAI] Zombie ${zombie.id} re-acquired player during momentum! Switching to pursuit.`);
          zombie.setTargetSighted(player.x, player.y);
          zombie.momentumSteps = 0;
          this.executeCanSeePlayerBehavior(zombie, gameMap, player, turnResult, playerCardinalPositions);
          return;
        }
      } else {
        console.log(`[ZombieAI] Momentum move blocked for ${zombie.id}: ${moveResult.reason}`);
        zombie.momentumSteps = 0;
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

    // Check for existing mission targets — if the structure is already breached, clear it.
    // NOTE: We no longer override the caller's target. The caller decides what to target.
    if (zombie.currentTarget && zombie.currentTarget.type === 'structure') {
      const tile = gameMap.getTile(zombie.currentTarget.x, zombie.currentTarget.y);
      const structure = tile?.contents.find(e => (e.type === EntityType.DOOR || e.type === EntityType.WINDOW) && e.id === zombie.currentTarget.id);
      const isClosed = structure && (structure.type === EntityType.DOOR ? !structure.isOpen : (structure.isReinforced || (!structure.isBroken && !structure.isOpen)));
      
      if (!isClosed) {
        // Mission complete! Door is dead/open.
        console.log(`[ZombieAI] Zombie ${zombie.id} mission door at (${zombie.currentTarget.x}, ${zombie.currentTarget.y}) is breached. Clearing target.`);
        zombie.currentTarget = null;
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

    // --- LOS DIRECT MOVEMENT ---
    // If the zombie can see the target, walk directly toward it using Bresenham's line.
    // This ensures zombies break through windows instead of detouring around buildings.
    if (zombie.canSeePosition(gameMap, targetX, targetY)) {
      const line = LineOfSight.getLinePath(zombie.x, zombie.y, targetX, targetY);

      if (line.length > 1) {
        const nextStep = line[1];
        const nextTile = gameMap.getTile(nextStep.x, nextStep.y);

        if (nextTile) {
          // Check for closed structures (windows/doors) blocking the direct path
          const structure = nextTile.contents.find(e => {
            if (e.type === EntityType.DOOR) return !e.isOpen && !e.isDamaged;
            if (e.type === EntityType.WINDOW) {
              if (e.isReinforced) return true;
              return !e.isBroken && !e.isOpen;
            }
            return false;
          });

          if (structure) {
            // Structure in the way — set as mission target if allowed
            const { allowMissionTarget = true } = options;
            if (allowMissionTarget) {
              zombie.currentTarget = { type: 'structure', id: structure.id, x: nextStep.x, y: nextStep.y };
            }
            const isCardinal = (zombie.x === nextStep.x || zombie.y === nextStep.y) &&
              Math.abs(zombie.x - nextStep.x) + Math.abs(zombie.y - nextStep.y) === 1;

            if (isCardinal) {
              // Cardinally adjacent — attack directly
              console.log(`[ZombieAI] LOS direct: Zombie ${zombie.id} attacking structure at (${nextStep.x}, ${nextStep.y})`);
              return this.executeStructureAttack(zombie, gameMap, structure, nextStep, fromPos);
            } else {
              // Diagonal to structure — move to nearest cardinal neighbor first
              const neighbors = [
                { x: nextStep.x + 1, y: nextStep.y },
                { x: nextStep.x - 1, y: nextStep.y },
                { x: nextStep.x, y: nextStep.y + 1 },
                { x: nextStep.x, y: nextStep.y - 1 }
              ].filter(pos => {
                const t = gameMap.getTile(pos.x, pos.y);
                return t && t.isWalkable(zombie) &&
                  !t.contents.some(e => e.type === EntityType.ZOMBIE && e.id !== zombie.id);
              }).sort((a, b) => {
                const distA = Math.abs(zombie.x - a.x) + Math.abs(zombie.y - a.y);
                const distB = Math.abs(zombie.x - b.x) + Math.abs(zombie.y - b.y);
                return distA - distB;
              });

              if (neighbors.length > 0) {
                const nbr = neighbors[0];
                if (zombie.x === nbr.x && zombie.y === nbr.y) {
                  // Already at a cardinal neighbor — attack
                  return this.executeStructureAttack(zombie, gameMap, structure, nextStep, fromPos);
                }
                const nbrTile = gameMap.getTile(nbr.x, nbr.y);
                const apCost = subtypeMult * Pathfinding.getMovementCost(zombie.x, zombie.y, nbr.x, nbr.y, nbrTile, { isZombie: true });
                if (zombie.currentAP >= apCost && gameMap.moveEntity(zombie.id, nbr.x, nbr.y)) {
                  zombie.useAP(apCost);
                  zombie.movementPath.push({ x: nbr.x, y: nbr.y });
                  console.log(`[ZombieAI] LOS direct: Zombie ${zombie.id} repositioned to (${nbr.x}, ${nbr.y}) to attack structure`);
                  return { success: true, from: fromPos, to: { x: nbr.x, y: nbr.y }, apCost, type: 'move' };
                }
              }
              // Fall through to A* if repositioning failed
            }
          } else {
            // No structure — try to move to that tile directly
            if (nextTile.isWalkable(zombie)) {
              // Check diagonal corner-cutting
              const isDiag = zombie.x !== nextStep.x && zombie.y !== nextStep.y;
              if (isDiag && !Pathfinding.canMoveDiagonally(gameMap, zombie.x, zombie.y, nextStep.x, nextStep.y)) {
                // Can't cut corners — fall through to A*
                console.log(`[ZombieAI] LOS direct: diagonal blocked by corner at (${nextStep.x}, ${nextStep.y}), falling through to A*`);
              } else {
                const apCost = subtypeMult * Pathfinding.getMovementCost(zombie.x, zombie.y, nextStep.x, nextStep.y, nextTile, { isZombie: true });
                if (zombie.currentAP >= apCost && gameMap.moveEntity(zombie.id, nextStep.x, nextStep.y)) {
                  zombie.useAP(apCost);
                  zombie.movementPath.push({ x: nextStep.x, y: nextStep.y });
                  console.log(`[ZombieAI] LOS direct: Zombie ${zombie.id} moved to (${nextStep.x}, ${nextStep.y})`);
                  return { success: true, from: fromPos, to: { x: nextStep.x, y: nextStep.y }, apCost, type: 'move' };
                }
              }
            }
            // Tile not walkable (solid wall) or move failed — fall through to A*
          }
        }
      }
    }

    // --- A* PATHFINDING FALLBACK ---
    // Used when the zombie has no LOS to the target or the direct path is blocked by a solid wall.

    // --- MYOPIC FILTER: Closed doors and windows are SOLID WALLS ---
    const myopicFilter = (tile) => {
      const door = tile.contents.find(e => e.type === EntityType.DOOR);
      if (door) return door.isOpen;

      const window = tile.contents.find(e => e.type === EntityType.WINDOW);
      if (window) return window.isBroken || window.isOpen;

      if (['wall', 'fence', 'tree', 'water', 'building', 'tent_wall'].includes(tile.terrain)) return false;

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
      
      const ghostFilter = (tile) => {
        // BUG 3 FIX: Previously this ignored all terrain except water (omniscient routing through walls).
        // Now it respects walls/fences, but allows pathing through doors and windows to find entry points.
        if (['wall', 'fence', 'tree', 'building', 'water', 'tent_wall'].includes(tile.terrain)) {
          const hasEntrableStructure = tile.contents.some(e => e.type === EntityType.DOOR || e.type === EntityType.WINDOW);
          if (!hasEntrableStructure) return false;
        }
        return true;
      };

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
                // BUG 5 FIX: Diagonal stuck state.
                // We previously only checked the two "shared" cardinal neighbors.
                // If those were walls, the zombie got stuck.
                // Now we check all 4 neighbors of the door to find a way in.
                const structureNeighbors = [
                  { x: obstaclePos.x + 1, y: obstaclePos.y },
                  { x: obstaclePos.x - 1, y: obstaclePos.y },
                  { x: obstaclePos.x, y: obstaclePos.y + 1 },
                  { x: obstaclePos.x, y: obstaclePos.y - 1 }
                ];
                
                const bestPositions = this.findBestCardinalPositions(zombie, structureNeighbors, gameMap);
                
                if (bestPositions.length > 0) {
                  const target = bestPositions[0];
                  // If the best position is one of our immediate neighbors, we can move there directly
                  // Otherwise, findPath will give us the first step of a longer route
                  const subPath = Pathfinding.findPath(gameMap, zombie.x, zombie.y, target.x, target.y, {
                    allowDiagonal: true,
                    entityFilter: myopicFilter,
                    maxDistance: 10,
                    isZombie: true
                  });
                  
                  if (subPath.length > 1) {
                    path = subPath; // Fall through to execute move below
                  } else {
                    zombie.useAP(1.0);
                    return { success: true, from: fromPos, to: fromPos, type: 'wait', apCost: 1.0, reason: 'Waiting to engage structure' };
                  }
                } else {
                  zombie.useAP(1.0);
                  return { success: true, from: fromPos, to: fromPos, type: 'wait', apCost: 1.0, reason: 'Unreachable structure' };
                }
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
    // interactionMemory was removed here as part of Bug 8 fix.

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

      const canSeePos = zombie.canSeePosition(gameMap, pos.x, pos.y);

      return {
        ...pos,
        isOccupied,
        hasClearPath: pathAround.length > 0,
        pathLength: pathAround.length > 0 ? pathAround.length : 999, // Store actual walking distance
        distance,
        canSeePos
      };
    });

    scoredPositions.sort((a, b) => {
      // 0. TOP PRIORITY: Favor spots that maintain direct line of sight!
      // If a zombie can see a spot, it should prefer it over any detour (e.g. through a door).
      // This ensures zombies try to break through windows if they see the player through them.
      if (a.canSeePos && !b.canSeePos) return -1;
      if (!a.canSeePos && b.canSeePos) return 1;

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

  /**
   * Helper to find the best neighbor to target around a specific coordinate.
   * Unifies seen-player and last-seen pathing logic.
   */
  static findBestNeighborForPosition(gameMap, zombie, targetX, targetY) {
    const cardinalPositions = [
      { x: targetX + 1, y: targetY },
      { x: targetX - 1, y: targetY },
      { x: targetX, y: targetY + 1 },
      { x: targetX, y: targetY - 1 }
    ];
    return this.findBestCardinalPositions(zombie, cardinalPositions, gameMap);
  }

  /**
   * Check if a zombie is diagonally adjacent to the player (not cardinal).
   * @param {Zombie} zombie - The zombie
   * @param {Player} player - The player
   * @returns {boolean} - True if diagonally adjacent
   */
  static isDiagonallyAdjacentToPlayer(zombie, player) {
    const dx = Math.abs(zombie.x - player.x);
    const dy = Math.abs(zombie.y - player.y);
    return dx === 1 && dy === 1;
  }

  /**
   * Find an open cardinal attack position from a diagonal position relative to the player.
   * When a zombie is diagonally adjacent, there are exactly 2 cardinal positions
   * shared between the zombie and the player (1 step each).
   * @param {Zombie} zombie - The zombie (diagonally adjacent to player)
   * @param {Player} player - The player
   * @param {GameMap} gameMap - The game map
   * @returns {Object|null} - {x, y} of open cardinal position, or null if both blocked
   */
  static findOpenCardinalFromDiagonal(zombie, player, gameMap) {
    // From diagonal, the 2 shared cardinal positions are:
    // (zombie.x, player.y) and (player.x, zombie.y)
    const candidates = [
      { x: zombie.x, y: player.y },
      { x: player.x, y: zombie.y }
    ];

    // Sort by distance to zombie (both are 1 step, so sort by walkability and occupancy)
    const valid = candidates.filter(pos => {
      const tile = gameMap.getTile(pos.x, pos.y);
      if (!tile) return false;
      if (['wall', 'building', 'fence', 'tree', 'water', 'tent_wall'].includes(tile.terrain)) return false;
      // Check for blocking entities (other zombies, closed doors/windows)
      const hasBlocker = tile.contents.some(e => {
        if (e.type === EntityType.ZOMBIE && e.id !== zombie.id) return true;
        if (e.type === EntityType.DOOR && !e.isOpen) return true;
        if (e.type === EntityType.WINDOW && !e.isBroken && !e.isOpen) return true;
        return false;
      });
      return !hasBlocker;
    });

    if (valid.length === 0) return null;

    // Prefer the one closer to the zombie (both should be 1 step away, but sort by Manhattan distance)
    valid.sort((a, b) => {
      const distA = Math.abs(zombie.x - a.x) + Math.abs(zombie.y - a.y);
      const distB = Math.abs(zombie.x - b.x) + Math.abs(zombie.y - b.y);
      return distA - distB;
    });

    return valid[0];
  }

  /**
   * Find the best approach tiles around a player for A* fallback during pursuit.
   * Evaluates all 8 neighbors (cardinal preferred, diagonal accepted).
   * Returns sorted array of valid approach positions.
   * @param {Zombie} zombie - The zombie
   * @param {Player} player - The player
   * @param {GameMap} gameMap - The game map
   * @returns {Array} - Sorted array of {x, y, cardinal} positions
   */
  static findBestApproachTile(zombie, player, gameMap) {
    const adjacent = [
      // Cardinal (preferred — can attack from here)
      { x: player.x + 1, y: player.y, cardinal: true },
      { x: player.x - 1, y: player.y, cardinal: true },
      { x: player.x, y: player.y + 1, cardinal: true },
      { x: player.x, y: player.y - 1, cardinal: true },
      // Diagonal (fallback — need 1 more sidestep to attack)
      { x: player.x + 1, y: player.y + 1, cardinal: false },
      { x: player.x + 1, y: player.y - 1, cardinal: false },
      { x: player.x - 1, y: player.y + 1, cardinal: false },
      { x: player.x - 1, y: player.y - 1, cardinal: false },
    ];

    return adjacent
      .filter(pos => {
        const tile = gameMap.getTile(pos.x, pos.y);
        if (!tile) return false;
        if (['wall', 'building', 'fence', 'tree', 'water', 'tent_wall'].includes(tile.terrain)) return false;
        // Allow tiles with doors/windows (those are interaction points, not walk-to destinations during pursuit)
        // But filter out tiles occupied by other zombies
        if (tile.contents.some(e => e.type === EntityType.ZOMBIE && e.id !== zombie.id)) return false;
        return true;
      })
      .sort((a, b) => {
        // 1. Prefer cardinal (can attack immediately)
        if (a.cardinal && !b.cardinal) return -1;
        if (!a.cardinal && b.cardinal) return 1;
        // 2. Prefer closer to zombie (Manhattan distance)
        const distA = Math.abs(zombie.x - a.x) + Math.abs(zombie.y - a.y);
        const distB = Math.abs(zombie.x - b.x) + Math.abs(zombie.y - b.y);
        return distA - distB;
      });
  }

}