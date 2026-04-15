import { MovementHelper } from '../utils/MovementHelper.js';
import { Pathfinding } from '../utils/Pathfinding.js';
import { ScentTrail } from '../utils/ScentTrail.js';
import audioManager from '../utils/AudioManager.js';

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
      // Zombie Behavior Loop (from ZombieInfo.md)

      // 1. Can see player - Highest priority
      if (zombie.canSeeEntity(gameMap, player)) {
        // Tag as alerted (immediate sound is handled in PlayerContext.jsx)
        zombie.isAlerted = true;
        
        // Update "Last Seen" coordinates so the zombie tracks the player if sight is lost later
        zombie.setTargetSighted(player.x, player.y);

        // PHASE 14: Scent Cancellation - Sync with player current sequence to "skip" old breadcrumbs
        const playerTile = gameMap.getTile(player.x, player.y);
        if (playerTile && playerTile.scentSequence) {
          zombie.lastScentSequence = Math.max(zombie.lastScentSequence || 0, playerTile.scentSequence);
        } else {
          // Fallback to global counter to skip everything up to this moment
          zombie.lastScentSequence = Math.max(zombie.lastScentSequence || 0, gameMap.scentSequenceCounter);
        }
        
        turnResult.behaviorTriggered = 'canSeePlayer';
        this.executeCanSeePlayerBehavior(zombie, gameMap, player, turnResult, playerCardinalPositions);
      }
      // 2. LastSeen is true - Move to last known position
      else if (zombie.lastSeen) {
        zombie.isAlerted = false;
        turnResult.behaviorTriggered = 'lastSeen';
        this.executeLastSeenBehavior(zombie, gameMap, turnResult, playerCardinalPositions, lastSeenTaggedTiles);
      }
      // 3. HeardNoise is true - Investigate noise
      else if (zombie.heardNoise) {
        zombie.isAlerted = false;
        turnResult.behaviorTriggered = 'heardNoise';
        this.executeHeardNoiseBehavior(zombie, gameMap, turnResult, playerCardinalPositions, lastSeenTaggedTiles);
      }
      // 4. Random wandering - Default behavior (only if no recent interactions)
      else if (zombie.interactionMemory <= 0) {
        zombie.isAlerted = false;
        turnResult.behaviorTriggered = 'randomWander';
        this.executeRandomWanderBehavior(zombie, gameMap, turnResult);
      }
      else {
        // Dwell at the structure for 1-2 turns
        zombie.isAlerted = false;
        zombie.behaviorState = 'investigating';
        console.log(`[ZombieAI] Zombie ${zombie.id} is dwelling at structure (memory=${zombie.interactionMemory})`);
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
      // We look in a tight radius (2) to find the player's specific path
      const nextScent = ScentTrail.findFreshestScent(gameMap, zombie.x, zombie.y, 2, zombie.lastScentSequence || 0);
      
      if (nextScent) {
        console.log(`[ZombieAI] Zombie ${zombie.id} following immediate breadcrumb at (${nextScent.x}, ${nextScent.y}), seq ${nextScent.sequence}`);
        
        // Find the single next step towards this specific scent tile
        const path = Pathfinding.findPath(gameMap, zombie.x, zombie.y, nextScent.x, nextScent.y, {
          allowDiagonal: true,
          entityFilter: (tile) => !['wall', 'fence', 'tree'].includes(tile.terrain), // Only block terrain
          isZombie: true
        });

        if (path && path.length > 1) {
          const nextStep = path[1];
          const nextTile = gameMap.getTile(nextStep.x, nextStep.y);
          
          // A. Check for blocking zombies (STRICT STACKING)
          const blockingZombie = nextTile?.contents.find(e => e.type === 'zombie');
          if (blockingZombie) {
            console.log(`[ZombieAI] Zombie ${zombie.id} trail blocked by zombie ${blockingZombie.id} at (${nextStep.x}, ${nextStep.y}), waiting...`);
            zombie.useAP(1.0);
            
            // Check if the blocked position is a structure (door/window)
            const isStructure = nextTile.contents.some(e => e.type === 'door' || e.type === 'window');
            
            turnResult.actions.push({
              type: 'wait',
              from: { x: zombie.x, y: zombie.y },
              to: { x: zombie.x, y: zombie.y },
              apCost: 1.0,
              reason: isStructure ? 'Blocked by zombie at structure' : 'Blocked by zombie on trail'
            });
            continue; // Wait this turn and try again next loop (if AP remains)
          }

          // B. Check for closed structures (STRICT ATTACHMENT / 1 AP Breach)
          const door = nextTile?.contents.find(e => e.type === 'door' && !e.isOpen);
          const window = nextTile?.contents.find(e => e.type === 'window' && !e.isBroken && !e.isOpen);

          if ((door || window) && zombie.currentAP >= 1.0) {
            console.log(`[ZombieAI] Zombie ${zombie.id} trail blocked by ${door ? 'door' : 'window'} (closed/unbroken), attacking...`);
            const structure = door || window;
            const damageResult = structure.takeDamage(1, true); // 1 damage per hit for zombies
            zombie.interactionMemory = 3;
            zombie.useAP(1.0);

            turnResult.actions.push({
              type: door ? 'attackDoor' : 'attackWindow',
              doorPos: door ? { x: nextStep.x, y: nextStep.y } : null,
              windowPos: window ? { x: nextStep.x, y: nextStep.y } : null,
              apCost: 1.0,
              doorBroken: door ? damageResult.isBroken : false,
              windowBroken: window ? damageResult.isBroken : false
            });

            zombie.lastScentSequence = nextScent.sequence;
            continue;
          }

          // C. Try normal move
          const subtypeMult = zombie.subtype === 'runner' ? 0.5 : (zombie.subtype === 'fat' ? 1.5 : 1);
          const moveDist = Pathfinding.getMovementCost(zombie.x, zombie.y, nextStep.x, nextStep.y, nextTile, { isZombie: true });
          const apCost = subtypeMult * moveDist;

          if (zombie.currentAP >= apCost) {
            const originalPos = { x: zombie.x, y: zombie.y };
            const moveSuccess = gameMap.moveEntity(zombie.id, nextStep.x, nextStep.y);
            if (moveSuccess) {
              zombie.useAP(apCost);
              zombie.movementPath.push({ x: nextStep.x, y: nextStep.y });
              zombie.lastScentSequence = nextScent.sequence;
              zombie.lastDirection = { x: nextStep.x - originalPos.x, y: nextStep.y - originalPos.y };
              
              turnResult.actions.push({
                type: 'move',
                from: originalPos,
                to: { x: nextStep.x, y: nextStep.y },
                apCost: apCost
              });

              // Check visibility
              const playerEntity = gameMap.getAllEntities().find(e => e.type === 'player');
              if (playerEntity && zombie.canSeeEntity(gameMap, playerEntity)) {
                zombie.setTargetSighted(playerEntity.x, playerEntity.y);
                this.executeCanSeePlayerBehavior(zombie, gameMap, playerEntity, turnResult, playerCardinalPositions);
                break;
              }
              continue;
            }
          }
        }
      }

      // 2. FALLBACK: Move towards last seen coordinates (A* only if trail is lost)
      let targetX = zombie.targetSightedCoords.x;
      let targetY = zombie.targetSightedCoords.y;
      console.log(`[ZombieAI] Zombie ${zombie.id} following LKP to (${targetX}, ${targetY})`);

      // Update target based on longer-range scent if no immediate scent found
      const distantScent = ScentTrail.findFreshestScent(gameMap, zombie.x, zombie.y, 5, zombie.lastScentSequence || 0);
      if (distantScent) {
        targetX = distantScent.x;
        targetY = distantScent.y;
        zombie.targetSightedCoords.x = targetX;
        zombie.targetSightedCoords.y = targetY;
      }

      if (zombie.x === targetX && zombie.y === targetY) {
        zombie.clearLastSeen();
        
        // If we reached our LKP at a door and can't see the player,
        // we "hear" ourselves and start investigating the noise.
        zombie.heardNoise = true;
        zombie.noiseCoords = { x: targetX, y: targetY };

        turnResult.actions.push({
          type: 'targetReached',
          coordinates: { x: targetX, y: targetY }
        });

        const player = gameMap.getAllEntities().find(e => e.type === 'player');
        if (player && zombie.canSeeEntity(gameMap, player)) {
          this.executeCanSeePlayerBehavior(zombie, gameMap, player, turnResult, playerCardinalPositions);
        } else if (zombie.lastDirection) {
          this.executeMomentumBehavior(zombie, gameMap, zombie.lastDirection, turnResult, playerCardinalPositions);
        }
        break;
      }

      const moveResult = this.attemptMoveTowards(zombie, gameMap, targetX, targetY);
      if (moveResult.success) {
        if (moveResult.from && moveResult.to) {
          zombie.lastDirection = { x: moveResult.to.x - moveResult.from.x, y: moveResult.to.y - moveResult.from.y };
        }
        turnResult.actions.push({
          type: moveResult.type || 'move',
          from: moveResult.from,
          to: moveResult.to,
          doorPos: moveResult.doorPos,
          apCost: moveResult.apCost,
          doorBroken: moveResult.doorBroken,
          windowPos: moveResult.windowPos,
          windowBroken: moveResult.windowBroken
        });

        const player = gameMap.getAllEntities().find(e => e.type === 'player');
        if (player && zombie.canSeeEntity(gameMap, player)) {
          zombie.setTargetSighted(player.x, player.y);
          this.executeCanSeePlayerBehavior(zombie, gameMap, player, turnResult, playerCardinalPositions);
          break;
        }
      } else {
        break; // Completely stuck - exit fallback loop
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

      // Spotted player?
      const player = gameMap.getEntitiesByType('player')[0];
      if (player && zombie.canSeeEntity(gameMap, player)) {
        zombie.setTargetSighted(player.x, player.y);
        break;
      }

      console.log(`[ZombieAI] Zombie ${zombie.id} investigating noise at (${targetX}, ${targetY}), AP: ${zombie.currentAP}`);

      const moveResult = this.attemptMoveTowards(zombie, gameMap, targetX, targetY);
      if (moveResult.success) {
        turnResult.actions.push({
          type: moveResult.type || 'move',
          from: moveResult.from,
          to: moveResult.to,
          doorPos: moveResult.doorPos,
          apCost: moveResult.apCost,
          doorBroken: moveResult.doorBroken,
          windowPos: moveResult.windowPos,
          windowBroken: moveResult.windowBroken
        });

        // Check if player is now visible after move or structure break
        const playerEntity = gameMap.getAllEntities().find(e => e.type === 'player');
        if (playerEntity && zombie.canSeeEntity(gameMap, playerEntity)) {
          console.log(`[ZombieAI] Zombie ${zombie.id} spotted player after action while investigating noise, switching to pursuit`);
          zombie.setTargetSighted(playerEntity.x, playerEntity.y);
          this.executeCanSeePlayerBehavior(zombie, gameMap, playerEntity, turnResult, playerCardinalPositions);
          break;
        }

        continue;
      } else {
        const path = Pathfinding.findPath(gameMap, zombie.x, zombie.y, targetX, targetY, {
          allowDiagonal: true,
          entityFilter: (tile) => !['wall', 'fence', 'tree'].includes(tile.terrain),
          isZombie: true
        });

        if (path && path.length > 1) {
          const nextStep = path[1];
          const nextTile = gameMap.getTile(nextStep.x, nextStep.y);
          const door = nextTile?.contents.find(e => e.type === 'door' && !e.isOpen);
          const window = nextTile?.contents.find(e => e.type === 'window' && (e.isReinforced || (!e.isBroken && !e.isOpen)));

          if ((door || window) && zombie.currentAP >= 1.0) {
            const structure = door || window;
            const damageAmount = door ? (5 + Math.floor(Math.random() * 6)) : (1 + Math.floor(Math.random() * 2));
            const damageResult = structure.takeDamage(damageAmount, true); // Silent for logic
            zombie.interactionMemory = 3;
            zombie.useAP(1.0);

            turnResult.actions.push({
              type: door ? 'attackDoor' : 'attackWindow',
              doorPos: door ? { x: nextStep.x, y: nextStep.y } : null,
              windowPos: window ? { x: nextStep.x, y: nextStep.y } : null,
              apCost: 1.0,
              doorBroken: door ? (structure.hp <= 0) : false,
              windowBroken: window ? damageResult.isBroken : false,
              windowReinforced: window ? damageResult.isReinforced : false
            });

            // Check if player is now visible after structure damage/break
            const playerEntity = gameMap.getAllEntities().find(e => e.type === 'player');
            if (playerEntity && zombie.canSeeEntity(gameMap, playerEntity)) {
              console.log(`[ZombieAI] Zombie ${zombie.id} spotted player after attacking structure, switching to pursuit`);
              zombie.setTargetSighted(playerEntity.x, playerEntity.y);
              this.executeCanSeePlayerBehavior(zombie, gameMap, playerEntity, turnResult, playerCardinalPositions);
              break;
            }

            continue;
          }
        }
        break; // Fallback: if no door/window, break the noise investigation
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
    console.log(`[ZombieAI] Zombie ${zombie.id} initiating momentum behavior in direction (${direction.x}, ${direction.y})`);

    zombie.behaviorState = 'investigating'; // Keep investigative state until turn ends or player seen

    while (zombie.currentAP > 0) {
      const nextX = zombie.x + direction.x;
      const nextY = zombie.y + direction.y;
      const subtypeMult = zombie.subtype === 'runner' ? 0.5 : (zombie.subtype === 'fat' ? 1.5 : 1);

      // Determine movement cost for this specific move
      const nextTile = gameMap.getTile(nextX, nextY);
      if (!nextTile) break; // Off map

      const moveDist = Pathfinding.getMovementCost(zombie.x, zombie.y, nextX, nextY, nextTile, { isZombie: true });
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
      const window = nextTile.contents.find(e => e.type === 'window' && !e.isBroken && !e.isOpen);
      if (door || window) {
        console.log(`[ZombieAI] momentum stopped: encountered ${door ? 'door' : 'window'} (closed/unbroken)`);
        break;
      }

      // Execute move
      const fromPos = { x: zombie.x, y: zombie.y };
      try {
        gameMap.moveEntity(zombie.id, nextX, nextY);
        zombie.useAP(apCost);
        zombie.movementPath.push({ x: nextX, y: nextY });

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
    // Create entity filters for two-pass pathfinding
    const createFilter = (ignoreZombies) => (tile) => {
      if (['wall', 'fence', 'tree', 'water'].includes(tile.terrain)) {
        const hasEntrableStructure = tile.contents.some(e => e.type === 'door' || e.type === 'window');
        if (!hasEntrableStructure) return false;
      }
      
      if (tile.terrain === 'building') {
        const hasEntrableStructure = tile.contents.some(e => e.type === 'door' || e.type === 'window');
        if (!hasEntrableStructure) return false;
      }

      const blockingEntities = tile.contents.filter(entity => {
        if (zombie.subtype === 'crawler' && entity.type === 'window') return true;
        if (entity.id === zombie.id) return false;
        if (entity.type === 'door' || entity.type === 'window') return false;
        
        // Pass 1: Treat other zombies as obstacles
        // Pass 2: Ignore other zombies
        if (entity.type === 'zombie') return !ignoreZombies;
        
        if (entity.type === 'player' && entity.x === targetX && entity.y === targetY) return false;
        return entity.blocksMovement;
      });
      return blockingEntities.length === 0;
    };

    // STUBBORNNESS LOGIC: Two-pass pathfinding with a "Detour Penalty"
    // PASS 1: Try to find a path AROUND other zombies (Optimization)
    const pass1 = Pathfinding.findPath(gameMap, zombie.x, zombie.y, targetX, targetY, {
      allowDiagonal: true,
      entityFilter: createFilter(false),
      maxDistance: 20,
      isZombie: true
    });

    // PASS 2: Find the DIRECT path (Ignoring other zombies)
    const pass2 = Pathfinding.findPath(gameMap, zombie.x, zombie.y, targetX, targetY, {
      allowDiagonal: true,
      entityFilter: createFilter(true),
      maxDistance: 20,
      isZombie: true
    });

    // Choose the best path based on "Stubbornness"
    let path = [];
    const DETOUR_PENALTY = 5; // How many extra tiles is a window worth?

    if (pass1.length > 1 && pass2.length > 1) {
      if (pass1.length <= pass2.length + DETOUR_PENALTY) {
        // Detour is reasonable, take it
        path = pass1;
      } else {
        // Detour is too long, stubbornly go to the blocked door
        console.log(`[ZombieAI] Detour to window is too long (${pass1.length} vs direct ${pass2.length}), choosing direct path instead.`);
        path = pass2;
      }
    } else {
      // Fallback to whichever one found a path
      path = pass1.length > 1 ? pass1 : pass2;
    }


    if (path.length > 1) {
      // Move to the next step in the path (path[0] is current position, path[1] is next step)
      const nextMove = path[1];

      console.log(`[ZombieAI] Following path step 1 of ${path.length - 1}: moving to (${nextMove.x}, ${nextMove.y})`);

      const nextTile = gameMap.getTile(nextMove.x, nextMove.y);

      const moveDist = Pathfinding.getMovementCost(fromPos.x, fromPos.y, nextMove.x, nextMove.y, nextTile, { isZombie: true });
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
        door.takeDamage(doorDamage, true); // Silent damage for logic only
        zombie.interactionMemory = 3; // Stay here for 3 turns (1 now + 2 more)

        console.log(`[ZombieAI] Zombie ${zombie.id} (at ${zombie.x},${zombie.y}) logically attacked door at (${nextMove.x}, ${nextMove.y}) for ${doorDamage} damage, remaining AP: ${zombie.currentAP}`);

        // Attract zombies (including ourselves) to the noise
        const otherZombies = gameMap.getEntitiesByType('zombie');
        otherZombies.forEach(z => {
          const distance = Math.abs(z.x - nextMove.x) + Math.abs(z.y - nextMove.y);
          if (distance <= 6) {
            z.setNoiseHeard(nextMove.x, nextMove.y);
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

      // ── PRIORITY 1b: Window in the way → break it (or destroy reinforcement) ─
      const window = nextTile?.contents.find(e => e.type === 'window');
      if (window && (window.isReinforced || (!window.isBroken && !window.isOpen))) {
        console.log(`[ZombieAI] Next path step blocked by window at (${nextMove.x}, ${nextMove.y}), attacking window`);

        // Spending 1 AP for the attack action
        const attackCost = 1.0;
        zombie.useAP(attackCost);

        // Attack the window (Logic handles glass vs reinforcement)
        const damageAmount = 1 + Math.floor(Math.random() * 2);
        const damageResult = window.takeDamage(damageAmount, true); 
        zombie.interactionMemory = 3;
        
        console.log(`[ZombieAI] Zombie ${zombie.id} attacked window, broken=${damageResult.isBroken}, reinforced=${damageResult.isReinforced}`);

        // Attract zombies (including ourselves) to the noise
        const otherZombies = gameMap.getEntitiesByType('zombie');
        otherZombies.forEach(z => {
          const distance = Math.abs(z.x - nextMove.x) + Math.abs(z.y - nextMove.y);
          if (distance <= 6) {
            z.setNoiseHeard(nextMove.x, nextMove.y);
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
          apCost: attackCost,
          windowBroken: damageResult.isBroken,
          windowReinforced: damageResult.isReinforced
        };
      }


      // ── PRIORITY 2: Normal movement check ──────────────────────────────────
      if (!ZombieAI.canMoveToTile(gameMap, nextMove.x, nextMove.y, zombie.subtype)) {
        // PACK LOGIC: If blocked by another zombie, just wait/shuffle instead of pathing around
        const targetTile = gameMap.getTile(nextMove.x, nextMove.y);
        const blockingZombie = targetTile?.contents.find(e => e.type === 'zombie');
        
        if (blockingZombie && zombie.currentAP >= 1.0) {
          console.log(`[ZombieAI] Zombie ${zombie.id} at (${zombie.x}, ${zombie.y}) blocked by zombie ${blockingZombie.id} at (${nextMove.x}, ${nextMove.y}), waiting for turn...`);
          zombie.useAP(1.0); // Spend 1 AP to "Wait"
          return {
            success: true,
            from: fromPos,
            to: fromPos,
            type: 'wait',
            apCost: 1.0,
            reason: 'Blocked by zombie'
          };
        }

        console.log(`[ZombieAI] Next path step blocked by non-door entity or terrain, cannot move`);
        return { success: false, reason: 'Next path step blocked' };
      }

      // Perform the move
      try {
        const moveSuccess = gameMap.moveEntity(zombie.id, nextMove.x, nextMove.y);
        
        if (moveSuccess) {
          zombie.useAP(apCost);
          zombie.movementPath.push({ x: nextMove.x, y: nextMove.y });
          console.log(`[ZombieAI] Move successful: ${fromPos.x},${fromPos.y} -> ${nextMove.x},${nextMove.y}, remaining AP: ${zombie.currentAP}`);

          return {
            success: true,
            from: fromPos,
            to: { x: nextMove.x, y: nextMove.y },
            apCost: apCost
          };
        } else {
          console.log(`[ZombieAI] gameMap.moveEntity failed to tile (${nextMove.x}, ${nextMove.y}) despite passing validation`);
          return { success: false, reason: 'Movement failed' };
        }
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
    if (!targetTile) return false;

    // Check terrain first (walls, buildings, etc. are always impassable for MOVE)
    if (['wall', 'building', 'fence', 'tree', 'water'].includes(targetTile.terrain)) {
      return false;
    }

    // Check for blocking entities
    const hasBlockingEntities = targetTile.contents.some(entity => {
      // CRAWLERS cannot use windows
      if (zombieSubtype === 'crawler' && entity.type === 'window') return true;

      // Doors, windows and player are handled by specific logic in attemptMoveTowards
      if (entity.type === 'door' || entity.type === 'window' || entity.type === 'player') return false;

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
      const hasInteractiveEnt = tile.contents.some(e => e.type === 'door' || e.type === 'window');
      
      return isTerrainWalkable || hasInteractiveEnt;
    });

    if (candidatePositions.length === 0) return [];

    const scoredPositions = candidatePositions.map(pos => {
      const tile = gameMap.getTile(pos.x, pos.y);
      // Actual occupancy check (other zombies block standing here)
      const isOccupied = tile?.contents.some(e => e.type === 'zombie' && e.id !== zombie.id);
      const distance = Math.abs(zombie.x - pos.x) + Math.abs(zombie.y - pos.y);

      // 2. Accessibility check (findPath now penalizes but doesn't block zombies/doors)
      const pathAround = Pathfinding.findPath(gameMap, zombie.x, zombie.y, pos.x, pos.y, {
        allowDiagonal: true,
        isZombie: true, // Enable AP penalties in Pathfinding.js
        entityFilter: (t) => {
          // Allow pathing through building/wall terrain ONLY if a door or window is present
          if (['wall', 'fence', 'tree', 'building', 'water', 'tent_wall'].includes(t.terrain)) {
            const hasEntrableStructure = t.contents.some(e => e.type === 'door' || e.type === 'window');
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
      const aHasStructure = aTile?.contents.some(e => e.type === 'door' || e.type === 'window');
      const bHasStructure = bTile?.contents.some(e => e.type === 'door' || e.type === 'window');
      
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
      const minDamage = zombie.subtype === 'acid' ? 2 : (zombie.subtype === 'fat' ? 3 : 1);
      damage = Math.floor(Math.random() * 4) + minDamage;

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