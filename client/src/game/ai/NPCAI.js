import { EntityType } from '../entities/Entity.js';
import { Pathfinding } from '../utils/Pathfinding.js';
import { LineOfSight } from '../utils/LineOfSight.js';
import { findSouthTransitionTile } from '../map/MapUtils.js';
import GameEvents, { GAME_EVENT } from '../utils/GameEvents.js';
import { ItemDefs } from '../inventory/ItemDefs.js';
import { getNPCType } from '../entities/NPCTypes.js';
import engine from '../GameEngine.js';
import { ScentTrail } from '../utils/ScentTrail.js';
import { DEFAULT_DANGER_RADIUS } from '../config/ProgressionConfig.js';

import { gameRandom } from '../utils/SeededRandom.js';
/**
 * NPCAI - Handles decision making for NPCs (Travelers heading south)
 */
export class NPCAI {
  static DEBUG = false;

  /**
   * Execute NPC turn logic
   */
  static executeNPCTurn(npc, gameMap, player, zombies = [], skipAPReset = false) {
    if (!npc || npc.hp <= 0) return { success: false };

    const turnResult = {
      npcId: npc.id,
      actions: [],
      apUsed: 0,
      success: true
    };

    try {
      // Clean up simulated HP from all zombies at the start of the turn
      zombies.forEach(z => {
        if (z) delete z.simulatedHp;
      });

      if (this.DEBUG) {
        console.log(`[NPCAI] --- Starting turn for NPC ${npc.name} (${npc.id}) --- AP: ${npc.ap}`);
      }

      let safetyCounter = 0;
      while (npc.ap >= 1.0 && safetyCounter < 20) {
        safetyCounter++;

        // 1. Evaluate Zombie Threats
        const threats = this.evaluateZombieThreats(npc, gameMap, zombies);

        // Priority 1: Flee from zombies (Avoidance)
        if (threats.length > 0) {
          const typeDef = getNPCType(npc.typeId);
          const dangerRadius = typeDef.ai?.dangerRadius || DEFAULT_DANGER_RADIUS;
          const surroundThreshold = typeDef.ai?.surroundThreshold || 3;
          
          const realThreatsInDangerZone = threats.filter(t => {
            if (t.type === 'memory') return false;
            return npc.getDistanceTo(t.logicalX, t.logicalY) <= dangerRadius;
          });

          const isSurrounded = realThreatsInDangerZone.length >= surroundThreshold;

          if (isSurrounded) {
            if (this.DEBUG) {
              console.log(`[NPCAI] NPC ${npc.name} is surrounded by ${realThreatsInDangerZone.length} zombies (threshold: ${surroundThreshold}). Skipping flee behavior to stand ground.`);
            }
          }

          if (!isSurrounded && this.processZombieAvoidance(npc, gameMap, threats, turnResult)) {
            continue;
          }
          
          // Priority 2: Last-Resort Combat (if fleeing failed / cornered / surrounded)
          if (this.DEBUG) console.log(`[NPCAI] Fleeing failed, cornered, or surrounded. Initiating Last-Resort Combat.`);
          if (this.processLastResortCombat(npc, gameMap, threats, turnResult)) {
            continue;
          }
          
          break; // AP spent or waited
        }

        // Priority 3: Hostile Player Interaction
        // Routed through the faction layer; for NPCs isHostileTo(player) folds in
        // the legacy isHostile flag, so behavior is unchanged in Phase 1.
        if (npc.isHostileTo(player) && npc.canSeeEntity(gameMap, player)) {
          if (this.DEBUG) console.log(`[NPCAI] Hostile NPC sees player. Initiating player interaction.`);
          if (this.processHostilePlayer(npc, gameMap, player, turnResult)) {
            continue;
          }
        }

        // Priority 4: Investigate Noise
        if (npc.heardNoise) {
          if (this.DEBUG) console.log(`[NPCAI] Noise heard at (${npc.noiseCoords.x}, ${npc.noiseCoords.y}). Investigating.`);
          if (this.processInvestigation(npc, gameMap, turnResult)) {
            continue;
          }
        }

        // Priority 5: Travel South (Default/Exit Goal)
        if (npc.behaviorState === 'fleeing') {
          if (this.DEBUG) console.log(`[NPCAI] NPC is in fleeing state. Aborting travel south to cool down.`);
          break;
        }

        if (this.DEBUG) console.log(`[NPCAI] No threats/noises. Traveling South.`);
        if (this.processTravelSouth(npc, gameMap, turnResult)) {
          continue;
        }

        // No actions possible or exited map
        break;
      }

    } catch (error) {
      console.error(`[NPCAI] Error in turn for ${npc.id}:`, error);
    }

    npc.ap = Math.max(0, npc.ap); // Ensure no negative AP
    turnResult.apUsed = npc.maxAp - npc.ap;
    turnResult.success = true;
    return turnResult;
  }

  /**
   * Scan for visible zombies within the danger radius, using threat memory to prevent mid-turn oscillation
   * @returns {Array} List of threat zombies/memories sorted by distance (closest first)
   */
  static evaluateZombieThreats(npc, gameMap, zombies) {
    const currentTurn = engine.turn || 1;
    const typeDef = getNPCType(npc.typeId);
    const dangerRadius = typeDef.ai?.dangerRadius || DEFAULT_DANGER_RADIUS;
    
    // Clean up old memory (older than 3 turns or simulated dead)
    npc.recentThreats = (npc.recentThreats || []).filter(t => {
      if ((currentTurn - t.turn) >= 3) return false;
      const deadZombie = zombies.find(z => z && z.logicalX === t.x && z.logicalY === t.y);
      if (deadZombie) {
        const simHp = deadZombie.simulatedHp !== undefined ? deadZombie.simulatedHp : deadZombie.hp;
        if (simHp <= 0) return false;
      }
      return true;
    });

    const threats = [];
    
    // 1. Process visible zombies and register all in threat memory (up to full sight range)
    zombies.forEach(zombie => {
      if (!zombie) return;
      const simHp = zombie.simulatedHp !== undefined ? zombie.simulatedHp : zombie.hp;
      if (simHp <= 0) return;

      const dist = npc.getDistanceTo(zombie.logicalX, zombie.logicalY);
      if (dist <= npc.sightRange && npc.canSeeEntity(gameMap, zombie)) {
        // Add or update recent threat memory
        const existing = npc.recentThreats.find(t => t.x === zombie.logicalX && t.y === zombie.logicalY);
        if (existing) {
          existing.turn = currentTurn;
        } else {
          npc.recentThreats.push({ x: zombie.logicalX, y: zombie.logicalY, turn: currentTurn });
        }
        
        // Active threat if within dangerRadius
        if (dist <= dangerRadius) {
          threats.push(zombie);
        }
      }
    });

    // 2. Clean up memory threats if we have clear line of sight to that tile and no zombie is present
    npc.recentThreats = (npc.recentThreats || []).filter(t => {
      if (npc.canSeePosition(gameMap, t.x, t.y)) {
        const tile = gameMap.getTile(t.x, t.y);
        const hasZombie = tile && tile.contents.some(e => e.type === EntityType.ZOMBIE);
        if (!hasZombie) {
          if (this.DEBUG) {
            console.log(`[NPCAI] Memory threat at (${t.x}, ${t.y}) cleared because tile is empty and in LOS.`);
          }
          return false;
        }
      }
      return true;
    });

    // 3. If no active visible threats, load from memory (construct virtual threats)
    if (threats.length === 0 && npc.recentThreats.length > 0) {
      const memoryDangerRadius = Math.max(3, dangerRadius - 1);
      npc.recentThreats.forEach(t => {
        const dist = npc.getDistanceTo(t.x, t.y);
        if (dist <= memoryDangerRadius) {
          threats.push({
            id: `memory_${t.x}_${t.y}`,
            type: 'memory',
            logicalX: t.x,
            logicalY: t.y,
            x: t.x,
            y: t.y
          });
        }
      });
    }

    // Sort by distance (closest first)
    threats.sort((a, b) => {
      const distA = npc.getDistanceTo(a.logicalX, a.logicalY);
      const distB = npc.getDistanceTo(b.logicalX, b.logicalY);
      return distA - distB;
    });

    return threats;
  }

  /**
   * Attempt to flee from the detected threats
   */
  static processZombieAvoidance(npc, gameMap, threats, turnResult) {
    return this.attemptFleeFrom(npc, gameMap, threats, turnResult);
  }

  /**
   * Calculate flee vector using distance-weighted influence vectors
   */
  static attemptFleeFrom(npc, gameMap, threats, turnResult) {
    if (npc.ap < 1.0) return false;

    // 1. Calculate the push vector from all threats
    let pushX = 0;
    let pushY = 0;

    threats.forEach(zombie => {
      const dx = npc.logicalX - zombie.logicalX;
      const dy = npc.logicalY - zombie.logicalY;
      const distSq = dx * dx + dy * dy;

      if (distSq === 0) return;

      const dist = Math.sqrt(distSq);
      // Push force is inversely proportional to squared distance
      const force = 1.0 / distSq;

      pushX += (dx / dist) * force;
      pushY += (dy / dist) * force;
    });

    if (pushX === 0 && pushY === 0) return false;

    // Normalize push vector
    const pushLength = Math.sqrt(pushX * pushX + pushY * pushY);
    const fleeVec = { x: pushX / pushLength, y: pushY / pushLength };

    // 2. Score cardinal neighbors based on similarity to the flee vector
    const neighbors = [
      { x: npc.logicalX + 1, y: npc.logicalY },
      { x: npc.logicalX - 1, y: npc.logicalY },
      { x: npc.logicalX, y: npc.logicalY + 1 },
      { x: npc.logicalX, y: npc.logicalY - 1 }
    ];

    const candidates = [];
    neighbors.forEach(neighbor => {
      const tile = gameMap.getTile(neighbor.x, neighbor.y);
      if (!tile) return;

      // Calculate direction from NPC to neighbor
      const nx = neighbor.x - npc.logicalX;
      const ny = neighbor.y - npc.logicalY;

      // Dot product representing how closely this neighbor aligns with fleeVec
      const score = nx * fleeVec.x + ny * fleeVec.y;
      candidates.push({ neighbor, score, tile });
    });

    // Sort candidates: highest score first
    candidates.sort((a, b) => b.score - a.score);

    // 3. Find the best safe, walkable neighbor
    for (const cand of candidates) {
      const { neighbor, tile } = cand;

      // Check edge blocking for solid walls (not breachable)
      const isEdgeBlocked = Pathfinding.isEdgeBlocked(gameMap, npc.logicalX, npc.logicalY, neighbor.x, neighbor.y, npc, { isPathfinding: true, allowBreaching: true });
      if (isEdgeBlocked) continue;

      // Check if tile has blocking entities (except breachable doors/windows)
      const hasBlockingEntity = tile.contents.some(e => e.blocksMovement && e.type !== 'door' && e.type !== 'window');
      if (hasBlockingEntity) continue;

      // Check if tile has already been visited this turn to prevent oscillation
      const alreadyVisited = npc.movementPath && npc.movementPath.some(pos => pos.x === neighbor.x && pos.y === neighbor.y);
      if (alreadyVisited) {
        if (this.DEBUG) {
          console.log(`[NPCAI] Flee candidate (${neighbor.x}, ${neighbor.y}) rejected: already visited this turn.`);
        }
        continue;
      }

      // Check walkability (in terrain/static obstacles, allowing breachable structures)
      const isBaseWalkable = tile.isWalkable(npc, { allowBreaching: true });
      if (!isBaseWalkable) continue;

      // Calculate total AP cost to move there (including interaction costs)
      let moveCost = 1.0;
      let interactionCost = 0;
      
      const structure = Pathfinding.getBlockingStructure(gameMap, npc.logicalX, npc.logicalY, neighbor.x, neighbor.y);
      if (structure) {
        if (structure.type === 'door' && !structure.isOpen) {
          interactionCost = structure.isLocked ? 2 : 1;
        } else if (structure.type === 'window' && !structure.isOpen && !structure.isBroken) {
          interactionCost = structure.isLocked ? 2 : 1;
          moveCost = 2.0; // Window climbing is 2 AP total
        }
      } else {
        const window = tile.contents.find(e => e.type === EntityType.WINDOW);
        if (window && (window.isOpen || window.isBroken)) {
          moveCost = 2.0; // Climb through open/broken window is 2 AP
        }
      }

      const totalCost = interactionCost + moveCost;

      // --- AP Economy & Look-ahead safety check ---
      if (npc.ap < totalCost) {
        // Find closest zombie distance
        let closestDist = Infinity;
        threats.forEach(z => {
          const dist = npc.getDistanceTo(z.logicalX, z.logicalY);
          if (dist < closestDist) closestDist = dist;
        });

        // If a zombie is 3 or fewer tiles away and we can't complete the traversal this turn,
        // it's highly unsafe to stand next to it. Skip this option!
        if (closestDist <= 3.0) {
          if (this.DEBUG) {
            console.log(`[NPCAI] Flee candidate (${neighbor.x}, ${neighbor.y}) rejected: insufficient AP (${npc.ap.toFixed(1)} < ${totalCost}) and closest zombie is too close (${closestDist.toFixed(1)} tiles).`);
          }
          continue;
        }
      }

      // 4. Execute move or interaction
      if (npc.ap < interactionCost) {
        // Not enough AP for interaction this turn, wait
        return false;
      }

      // Invalidate current cached travel path because we are fleeing
      npc.currentPath = null;

      if (structure) {
        npc.behaviorState = 'fleeing';
        return this.interactWithStructure(npc, gameMap, structure, neighbor.x, neighbor.y, interactionCost, turnResult);
      }

      if (npc.ap >= moveCost) {
        npc.behaviorState = 'fleeing';
        const fromPos = { x: npc.logicalX, y: npc.logicalY };
        if (gameMap.moveEntity(npc.id, neighbor.x, neighbor.y, { snap: false })) {
          npc.useAP(moveCost);
          
          if (!npc.movementPath || npc.movementPath.length === 0) {
            npc.movementPath = [{ x: fromPos.x, y: fromPos.y }];
          }
          npc.movementPath.push({ x: neighbor.x, y: neighbor.y });
          
          turnResult.actions.push({ 
            type: 'MOVE', 
            entityId: npc.id, 
            data: { from: fromPos, to: { x: neighbor.x, y: neighbor.y }, apCost: moveCost } 
          });
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Interact with a door or window
   */
  static interactWithStructure(npc, gameMap, structure, tx, ty, cost, turnResult) {
    npc.useAP(cost);

    const fromPos = { x: npc.logicalX, y: npc.logicalY };
    const toPos = { x: tx, y: ty };

    if (structure.type === 'door') {
      if (structure.isLocked) {
        structure.takeDamage(20); // Smash/pry locked door open
        if (gameMap.emitNoise) gameMap.emitNoise(tx, ty, 4);
        turnResult.actions.push({
          type: 'STRUCTURE_INTERACT',
          entityId: npc.id,
          data: { x: tx, y: ty, from: fromPos, to: toPos, interaction: 'pry_door', apCost: cost, success: true, targetId: structure.id, targetType: 'door', broken: true }
        });
      } else {
        structure.open(); // Slide unlocked door open
        turnResult.actions.push({
          type: 'STRUCTURE_INTERACT',
          entityId: npc.id,
          data: { x: tx, y: ty, from: fromPos, to: toPos, interaction: 'open_door', apCost: cost, success: true, targetId: structure.id, targetType: 'door' }
        });
      }
    } else if (structure.type === 'window') {
      if (structure.isLocked) {
        structure.break(); // Smash locked window
        if (gameMap.emitNoise) gameMap.emitNoise(tx, ty, 6);
        turnResult.actions.push({
          type: 'STRUCTURE_INTERACT',
          entityId: npc.id,
          data: { x: tx, y: ty, from: fromPos, to: toPos, interaction: 'break_window', apCost: cost, success: true, targetId: structure.id, targetType: 'window', broken: true }
        });
      } else {
        structure.open(); // Slide unlocked window open
        turnResult.actions.push({
          type: 'STRUCTURE_INTERACT',
          entityId: npc.id,
          data: { x: tx, y: ty, from: fromPos, to: toPos, interaction: 'open_window', apCost: cost, success: true, targetId: structure.id, targetType: 'window' }
        });
      }
    }

    return true;
  }

  /**
   * Melee adjacent zombie, or shoot if ranged weapon is held
   */
  static processLastResortCombat(npc, gameMap, threats, turnResult) {
    const realZombies = threats.filter(z => z.type === 'zombie');
    
    // 1. Melee attack if cardinally adjacent
    const adjacentZombie = realZombies.find(z => npc.isAdjacentTo(z.logicalX, z.logicalY));
    if (adjacentZombie) {
      if (this.DEBUG) console.log(`[NPCAI] Engaging adjacent zombie ${adjacentZombie.name} in melee combat.`);
      return this.performAttack(npc, adjacentZombie, turnResult, false);
    }

    // 2. Ranged attack if ranged weapon is held
    const weapon = npc.getEquippedWeapon();
    const isRanged = weapon && (ItemDefs[weapon.defId]?.rangedStats || weapon.rangedStats);
    if (isRanged) {
      const shootZombie = realZombies.find(z => npc.canSeeEntity(gameMap, z));
      if (shootZombie) {
        if (this.DEBUG) console.log(`[NPCAI] Shooting at zombie ${shootZombie.name} at distance ${npc.getDistanceTo(shootZombie.logicalX, shootZombie.logicalY).toFixed(1)}.`);
        return this.performAttack(npc, shootZombie, turnResult, true);
      }
    }

    // 3. Melee approach step: if not adjacent but we have a melee weapon (or unarmed) and AP, step towards the closest threat
    if (realZombies.length > 0 && npc.ap >= 1.0) {
      const closestZombie = realZombies[0]; // Sorted closest first
      const path = Pathfinding.findPath(gameMap, npc.logicalX, npc.logicalY, closestZombie.logicalX, closestZombie.logicalY, { 
        entity: npc,
        allowDiagonal: false 
      });
      if (path && path.length > 2) { // Need at least start, nextStep, and target
        const nextStep = path[1];
        if (this.DEBUG) {
          console.log(`[NPCAI] Cornered. Stepping towards closest threat at (${closestZombie.logicalX}, ${closestZombie.logicalY}) to engage. Next step: (${nextStep.x}, ${nextStep.y})`);
        }
        const success = this.performStepTowards(npc, gameMap, nextStep, turnResult);
        if (success) {
          return true;
        }
      }
    }

    // Burn remaining AP (wait/hunker down)
    if (this.DEBUG) console.log(`[NPCAI] No combat options available. Burning remaining ${npc.ap} AP.`);
    npc.ap = 0;
    return true;
  }

  /**
   * Hostile Extortion/Attack Loop
   */
  static processHostilePlayer(npc, gameMap, player, turnResult) {
    if (npc.hasExtorted) return false;
    if (npc.wasAttackedThisTurn) npc.behaviorState = 'attacking';

    const dist = npc.getDistanceTo(player.logicalX, player.logicalY);

    if (dist === 1) {
      if (!npc.hasDemanded) {
        npc.behaviorState = 'demanding';
        turnResult.actions.push({ 
          type: 'DEMAND', 
          entityId: npc.id, 
          data: { x: npc.logicalX, y: npc.logicalY } 
        });
        return false; // Yield turn but save AP
      } else {
        npc.behaviorState = 'attacking';
        return this.performAttack(npc, player, turnResult, false);
      }
    } else {
      if (npc.hasDemanded) {
        const weapon = npc.getEquippedWeapon();
        const weaponDef = weapon ? ItemDefs[weapon.defId] : null;
        const isRanged = weapon && (weaponDef?.rangedStats || weapon.rangedStats);
        if (isRanged) {
          const maxRange = weaponDef?.rangedStats?.maxRange ?? weapon?.rangedStats?.maxRange ?? 8;
          if (dist <= maxRange) {
            npc.behaviorState = 'attacking';
            return this.performAttack(npc, player, turnResult, true);
          }
        }
      }

      // Move toward player
      return this.attemptMoveTowards(npc, gameMap, player.logicalX, player.logicalY, turnResult);
    }
  }

  /**
   * Investigate noise coordinates, including a blacklist to prevent infinite loops
   */
  static processInvestigation(npc, gameMap, turnResult) {
    const currentTurn = engine.turn || 1;
    const nx = npc.noiseCoords.x;
    const ny = npc.noiseCoords.y;

    // Check if noise coordinate is blacklisted/recently investigated
    const isBlacklisted = npc.noiseBlacklist.some(b => b.x === nx && b.y === ny && (currentTurn - b.turn) < 5);
    if (isBlacklisted) {
      if (this.DEBUG) console.log(`[NPCAI] Noise coords (${nx}, ${ny}) are blacklisted. Clearing.`);
      npc.clearNoiseHeard();
      return false;
    }

    // Check if we arrived at noise source OR have LOS to a zombie/player at those coordinates
    const arrived = npc.logicalX === nx && npc.logicalY === ny;
    
    // Check if any entity is seen at the noise spot
    let sourceIdentified = false;
    if (npc.canSeePosition(gameMap, nx, ny)) {
      const tile = gameMap.getTile(nx, ny);
      if (tile && tile.contents.some(e => e.type === EntityType.PLAYER || e.type === EntityType.ZOMBIE)) {
        sourceIdentified = true;
      }
    }

    if (arrived || sourceIdentified) {
      if (this.DEBUG) {
        console.log(`[NPCAI] Noise source identified (arrived: ${arrived}, spotted: ${sourceIdentified}). Blacklisting.`);
      }
      npc.noiseBlacklist.push({ x: nx, y: ny, turn: currentTurn });
      npc.clearNoiseHeard();
      return false;
    }

    const success = this.attemptMoveTowards(npc, gameMap, nx, ny, turnResult);
    if (!success) {
      if (this.DEBUG) console.log(`[NPCAI] Noise at (${nx}, ${ny}) is unreachable. Blacklisting.`);
      npc.noiseBlacklist.push({ x: nx, y: ny, turn: currentTurn });
      npc.clearNoiseHeard();
      return false;
    }
    return true;
  }

  /**
   * Travel to goalTarget using cached path
   */
  static processTravelSouth(npc, gameMap, turnResult) {
    // 1. Locate exit goal if missing
    if (!npc.goalTarget) {
      const exit = findSouthTransitionTile(gameMap);
      if (exit) {
        npc.goalTarget = exit;
        if (this.DEBUG) console.log(`[NPCAI] Exit goal assigned at (${exit.x}, ${exit.y})`);
      } else {
        if (this.DEBUG) console.warn('[NPCAI] No exit tile found on map!');
        return false;
      }
    }

    // 2. Escape when at exit goal
    if (npc.logicalX === npc.goalTarget.x && npc.logicalY === npc.goalTarget.y) {
      if (this.DEBUG) console.log(`[NPCAI] NPC ${npc.name} reached exit goal. Escaping!`);
      npc.hasExited = true;
      turnResult.actions.push({
        type: 'ESCAPE',
        entityId: npc.id,
        data: { x: npc.logicalX, y: npc.logicalY }
      });
      return false; // Stops turn loop
    }

    // 3. Validate Cached Path
    let pathValid = npc.currentPath && npc.currentPath.length > 0;
    if (pathValid) {
      const nextStep = npc.currentPath[0];
      const dx = Math.abs(npc.logicalX - nextStep.x);
      const dy = Math.abs(npc.logicalY - nextStep.y);
      
      // Must be cardinally adjacent to next step
      if ((dx + dy) !== 1) {
        pathValid = false;
        if (this.DEBUG) console.log('[NPCAI] Cached path invalidated: NPC has drifted off path.');
      } else {
        const nextTile = gameMap.getTile(nextStep.x, nextStep.y);
        if (!nextTile) {
          pathValid = false;
        } else {
          // If the edge is blocked (by wall, not door/window)
          const edgeBlocked = Pathfinding.isEdgeBlocked(gameMap, npc.logicalX, npc.logicalY, nextStep.x, nextStep.y, npc, { isPathfinding: true, allowBreaching: true });
          const hasBlockingEntity = nextTile.contents.some(e => e.blocksMovement && e.type !== 'door' && e.type !== 'window');
          if (edgeBlocked || hasBlockingEntity) {
            pathValid = false;
            if (this.DEBUG) console.log(`[NPCAI] Cached path invalidated: next step (${nextStep.x}, ${nextStep.y}) is blocked.`);
          }
        }
      }
    }

    // 4. Recalculate path if invalid
    if (!pathValid) {
      if (this.DEBUG) console.log(`[NPCAI] Recalculating path to goal target (${npc.goalTarget.x}, ${npc.goalTarget.y})`);
      const rawPath = Pathfinding.findPath(gameMap, npc.logicalX, npc.logicalY, npc.goalTarget.x, npc.goalTarget.y, { entity: npc });
      if (rawPath && rawPath.length > 1) {
        npc.currentPath = rawPath.slice(1); // Exclude starting position
      } else {
        npc.currentPath = null;
        if (this.DEBUG) console.warn('[NPCAI] Recalculation failed: no path found to goal target.');
        return false;
      }
    }

    // 5. Take the next step from the cached path
    const nextStep = npc.currentPath[0];
    if (nextStep) {
      // Safety check: Does this next step put us within dangerRadius of a known threat?
      const typeDef = getNPCType(npc.typeId);
      const dangerRadius = typeDef.ai?.dangerRadius || DEFAULT_DANGER_RADIUS;
      const memoryDangerRadius = Math.max(3, dangerRadius - 1);
      
      const entersDangerZone = (npc.recentThreats || []).some(t => {
        const dx = nextStep.x - t.x;
        const dy = nextStep.y - t.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const isVisible = npc.canSeePosition(gameMap, t.x, t.y);
        const threshold = isVisible ? dangerRadius : memoryDangerRadius;
        return dist <= threshold;
      });

      if (entersDangerZone) {
        if (this.DEBUG) {
          console.log(`[NPCAI] Aborting travel step to (${nextStep.x}, ${nextStep.y}) for NPC ${npc.name}: enters danger zone of a known threat.`);
        }
        npc.currentPath = null; // Invalidate cached path
        return false;
      }

      const success = this.performStepTowards(npc, gameMap, nextStep, turnResult);
      if (success) {
        npc.currentPath.shift(); // Remove step since we moved
        return true;
      }
    }

    // Invalidate path on failure to move
    npc.currentPath = null;
    return false;
  }

  /**
   * Pathfind to coordinates and make a step
   */
  static attemptMoveTowards(npc, gameMap, targetX, targetY, turnResult) {
    const path = Pathfinding.findPath(gameMap, npc.logicalX, npc.logicalY, targetX, targetY, { entity: npc });
    if (path && path.length > 1) {
      return this.performStepTowards(npc, gameMap, path[1], turnResult);
    }
    return false;
  }

  /**
   * Perform single-step movement, resolving closed structures
   */
  static performStepTowards(npc, gameMap, nextStep, turnResult) {
    const tile = gameMap.getTile(nextStep.x, nextStep.y);
    if (!tile) return false;

    // Check for doors/windows blocking the edge
    const structure = Pathfinding.getBlockingStructure(gameMap, npc.logicalX, npc.logicalY, nextStep.x, nextStep.y);
    if (structure) {
      let cost = 1;
      if (structure.type === 'door' && !structure.isOpen) {
        cost = structure.isLocked ? 2 : 1;
      } else if (structure.type === 'window' && !structure.isOpen && !structure.isBroken) {
        cost = structure.isLocked ? 2 : 1;
      }

      if (npc.ap >= cost) {
        return this.interactWithStructure(npc, gameMap, structure, nextStep.x, nextStep.y, cost, turnResult);
      }
      return false;
    }

    // Calculate move cost
    let moveCost = 1.0;
    const window = tile.contents.find(e => e.type === EntityType.WINDOW);
    if (window && (window.isOpen || window.isBroken)) {
      moveCost = 2.0; // Climb cost
    }

    if (npc.ap >= moveCost) {
      const fromPos = { x: npc.logicalX, y: npc.logicalY };
      if (gameMap.moveEntity(npc.id, nextStep.x, nextStep.y, { snap: false })) {
        npc.useAP(moveCost);
        ScentTrail.dropScent(gameMap, nextStep.x, nextStep.y);
        
        if (!npc.movementPath || npc.movementPath.length === 0) {
          npc.movementPath = [{ x: fromPos.x, y: fromPos.y }];
        }
        npc.movementPath.push({ x: nextStep.x, y: nextStep.y });
        
        turnResult.actions.push({ 
          type: 'MOVE', 
          entityId: npc.id, 
          data: { from: fromPos, to: { x: nextStep.x, y: nextStep.y }, apCost: moveCost } 
        });
        return true;
      }
    }

    return false;
  }

  /**
   * Unified Attack Executor
   */
  static performAttack(npc, target, turnResult, isRanged) {
    const weapon = npc.getEquippedWeapon();
    const weaponDef = weapon ? ItemDefs[weapon.defId] : null;

    let apCost = 1.0;
    if (isRanged) {
      apCost = weaponDef?.rangedStats?.apCost ?? weapon?.rangedStats?.apCost ?? 2.0;
    } else {
      apCost = weaponDef?.combat?.apCost ?? weapon?.combat?.apCost ?? 1.0;
    }

    if (npc.ap < apCost) return false;

    npc.useAP(apCost);

    const typeDef = getNPCType(npc.typeId);
    const combatSkill = typeDef.ai?.combatSkill || 0.5;

    let hitChance = isRanged ? 0.70 : 0.75;

    if (isRanged) {
      const dist = npc.getDistanceTo(target.logicalX || target.x, target.logicalY || target.y);
      const stats = weaponDef?.rangedStats || {};
      const falloff = stats.accuracyFalloff || 0.1;
      const baseChance = Math.max(stats.minAccuracy || 0.1, 1.0 - (dist - 1) * falloff);
      hitChance = baseChance * (combatSkill * 2.0);
    } else {
      const baseChance = weaponDef?.combat?.hitChance || 0.75;
      hitChance = baseChance * (combatSkill * 2.0);
    }

    hitChance = Math.max(0.2, Math.min(0.95, hitChance));
    const hit = gameRandom.next() < hitChance;
    let damage = 0;

    if (hit) {
      const damageRange = isRanged 
        ? (weaponDef?.rangedStats?.damage || weapon?.rangedStats?.damage || { min: 2, max: 5 }) 
        : (weaponDef?.combat?.damage || weaponDef?.damage || weapon?.damage || { min: 1, max: 3 });
      damage = gameRandom.nextInt(damageRange.min, damageRange.max);
      
      // Update simulated HP
      target.simulatedHp = (target.simulatedHp !== undefined ? target.simulatedHp : target.hp) - damage;
    }

    // Invalidate path on attack
    npc.currentPath = null;

    turnResult.actions.push({
      type: 'ATTACK',
      entityId: npc.id,
      data: {
        targetId: target.id,
        targetType: target.type,
        success: hit,
        damage,
        from: { x: npc.logicalX, y: npc.logicalY },
        to: { x: target.logicalX || target.x, y: target.logicalY || target.y }
      }
    });

    return true;
  }

}
