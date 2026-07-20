import { EntityType } from '../entities/Entity.js';
import { Pathfinding } from '../utils/Pathfinding.js';
import { findSouthTransitionTile } from '../map/MapUtils.js';
import { ItemDefs } from '../inventory/ItemDefs.js';
import { getNPCType } from '../entities/NPCTypes.js';
import engine from '../GameEngine.js';
import { DEFAULT_DANGER_RADIUS } from '../config/ProgressionConfig.js';
import { CombatResolver } from './CombatResolver.js';
import { MoveIntent } from '../components/MoveIntent.js';
import { isMeleeAttackPosition, findAttackSlotPath } from './AIHelpers.js';

// Legacy NPCAI allowed at most 20 actions per NPC per turn (safetyCounter); the
// surrounding AI cycle loop allows 50, so cap per-NPC cycles here to keep
// maxAP-20 survivors from becoming deadlier than they were pre-migration.
const MAX_NPC_CYCLES_PER_TURN = 20;

/**
 * NPCAISystem - intent-based NPC AI, one decision per entity per AI cycle.
 *
 * Mirrors AISystem's contract: process(...) returns the number of intents (or
 * fully-resolved actions) generated this cycle; SimulationManager keeps cycling
 * Vision -> NPCAISystem -> IntentQueue.resolve until a cycle emits nothing, so
 * NPCs drain their AP across cycles exactly like zombies do.
 *
 * Behavior priorities (ported from the legacy NPCAI turn loop):
 *   0. Attack-on-sight hostiles (AIState.attackOnSight) short-circuit the whole
 *      list: hunt and kill the player, fight zombies instead of fleeing them,
 *      and never escape off the map. See huntPlayer.
 *   1. Flee visible/remembered zombies (repulsion vector), stand ground when
 *      surrounded, last-resort melee/ranged combat when cornered.
 *   2. Hostile player interaction: walk to a cardinal attack slot, DEMAND once,
 *      then melee from the slot or shoot from range after refusal.
 *   3. Investigate heard noise (with a blacklist against loops).
 *   4. Travel south to the map exit and ESCAPE.
 *
 * Movement goes through MoveIntent -> MovementSystem. Attacks and door/window
 * interactions are resolved in-place (playback-first ATTACK / simulation-first
 * STRUCTURE_INTERACT actions), matching the spitter precedent in AISystem —
 * CombatSystem's DamageIntent branch is zombie-only and stays that way.
 *
 * A DEMAND is pushed as an action but NOT counted as an intent; it also sets
 * simContext.demandPending, which freezes all further NPC decision-making for
 * the turn so the UI can pause on the demand dialog (the legacy loop `break`).
 */
export class NPCAISystem {
  static DEBUG = false;

  static process(entities, worldManager, engine_, actionQueue = [], intentQueue = null, simContext = {}) {
    let intentsGenerated = 0;

    // A pending demand freezes the whole NPC phase until the dialog resolves.
    if (simContext.demandPending) return intentsGenerated;

    const entityList = Array.isArray(entities)
      ? entities
      : (entities instanceof Map ? Array.from(entities.values()) : Object.values(entities));

    const player = entityList.find(e => e.type === 'player' && e.hasComponent('Position'));
    if (!player) return intentsGenerated;

    const gameMap = engine_ ? engine_.gameMap : null;
    if (!gameMap) return intentsGenerated;

    const zombies = entityList.filter(e => e.type === 'zombie');
    if (!simContext.npcCycles) simContext.npcCycles = {};

    for (const npc of entityList) {
      if (npc.type !== 'npc' || npc.hp <= 0 || npc.hasExited) continue;
      // Scripted/quest NPCs: skip all autonomous behavior (wandering, fleeing,
      // combat, investigation) so they stay exactly where the map author or an
      // event's moveEntity step put them. See AIState.aiDisabled.
      if (npc.aiDisabled) continue;
      if (!npc.hasComponent('Position') || !npc.hasComponent('AIBehavior')) continue;
      if (npc.hasComponent('MoveIntent') || npc.hasComponent('DamageIntent')) continue;
      if ((npc.ap ?? 0) < 1.0) continue;
      if ((simContext.npcCycles[npc.id] || 0) >= MAX_NPC_CYCLES_PER_TURN) continue;

      const ctx = {
        npc, gameMap, player, zombies,
        enqueue(intentType, intent) {
          if (intentQueue) {
            intentQueue.enqueue(npc.id, intentType, intent);
          } else {
            npc.addComponent(intent);
          }
          simContext.npcCycles[npc.id] = (simContext.npcCycles[npc.id] || 0) + 1;
          intentsGenerated++;
        },
        // Fully-resolved action (attack, structure interaction, escape) pushed
        // straight to the action queue; counts as activity so the cycle loop
        // keeps running while the NPC still has AP.
        pushAction(action) {
          actionQueue.push(action);
          simContext.npcCycles[npc.id] = (simContext.npcCycles[npc.id] || 0) + 1;
          intentsGenerated++;
        },
        // DEMAND only: reaches the queue (the UI scans for it) but does NOT
        // count as an intent — the turn's NPC phase ends on it.
        pushUncounted(action) {
          actionQueue.push(action);
        }
      };

      try {
        this.decide(ctx, simContext);
      } catch (err) {
        console.error(`[NPCAISystem] Error processing NPC ${npc.id}:`, err);
      }

      // Stop giving decisions to the remaining NPCs the moment one demands.
      if (simContext.demandPending) break;
    }

    return intentsGenerated;
  }

  /**
   * One prioritized decision for one NPC. Emits at most one intent/action via
   * ctx (every emission is followed by a return); emitting nothing yields the
   * NPC's turn (loop-safe: the cycle loop stops when nobody emits).
   */
  static decide(ctx, simContext) {
    const { npc, gameMap, player, zombies } = ctx;

    // Priority 0: attack-on-sight hostiles. No extortion, no fleeing and no
    // escaping off the map — they close on the player and fight to the death
    // with whatever they hold. When the player is unknown or unreachable they
    // fall through to fight zombies / investigate, but never travel south.
    if (npc.attackOnSight && npc.isHostileTo(player)) {
      if (this.huntPlayer(ctx)) return;

      const aggroThreats = this.evaluateZombieThreats(npc, gameMap, zombies);
      if (aggroThreats.length > 0) {
        this.lastResortCombat(ctx, aggroThreats);
        return;
      }
      if (npc.heardNoise) this.investigate(ctx);
      return;
    }

    // Priority 1/2: zombie threats — flee, stand ground when surrounded,
    // last-resort combat when cornered.
    const threats = this.evaluateZombieThreats(npc, gameMap, zombies);
    if (threats.length > 0) {
      const typeDef = getNPCType(npc.typeId);
      const dangerRadius = typeDef.ai?.dangerRadius || DEFAULT_DANGER_RADIUS;
      const surroundThreshold = typeDef.ai?.surroundThreshold || 3;

      const realThreatsInDangerZone = threats.filter(t => {
        if (t.type === 'memory') return false;
        return npc.getDistanceTo(t.logicalX, t.logicalY) <= dangerRadius;
      });
      const isSurrounded = realThreatsInDangerZone.length >= surroundThreshold;

      if (!isSurrounded && this.tryFlee(ctx, threats)) return;
      this.lastResortCombat(ctx, threats);
      return;
    }

    // Priority 3: hostile player interaction.
    if (!npc.hasExtorted && npc.isHostileTo(player) && this.canSeePlayer(npc, gameMap, player)) {
      if (this.hostilePlayer(ctx, simContext)) return;
    }

    // Priority 4: investigate noise.
    if (npc.heardNoise) {
      if (this.investigate(ctx)) return;
    }

    // Priority 5: travel south — skipped while cooling down from a flee.
    if (npc.behaviorState === 'fleeing') return;
    this.travelSouth(ctx);
  }

  /** Prefer the cached Vision component, fall back to direct LOS. */
  static canSeePlayer(npc, gameMap, player) {
    const vision = npc.getComponent('Vision');
    return vision
      ? vision.visibleEntities.includes(player.id)
      : npc.canSeeEntity(gameMap, player);
  }

  /**
   * Scan for visible zombies within the danger radius, using threat memory to
   * prevent mid-turn oscillation. Direct port of NPCAI.evaluateZombieThreats.
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
        const existing = npc.recentThreats.find(t => t.x === zombie.logicalX && t.y === zombie.logicalY);
        if (existing) {
          existing.turn = currentTurn;
        } else {
          npc.recentThreats.push({ x: zombie.logicalX, y: zombie.logicalY, turn: currentTurn });
        }

        if (dist <= dangerRadius) {
          threats.push(zombie);
        }
      }
    });

    // 2. Clear memory threats we have clear line of sight to with no zombie present
    npc.recentThreats = (npc.recentThreats || []).filter(t => {
      if (npc.canSeePosition(gameMap, t.x, t.y)) {
        const tile = gameMap.getTile(t.x, t.y);
        const hasZombie = tile && tile.contents.some(e => e.type === EntityType.ZOMBIE);
        if (!hasZombie) return false;
      }
      return true;
    });

    // 3. If no active visible threats, load virtual threats from memory
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

    threats.sort((a, b) => {
      const distA = npc.getDistanceTo(a.logicalX, a.logicalY);
      const distB = npc.getDistanceTo(b.logicalX, b.logicalY);
      return distA - distB;
    });

    return threats;
  }

  /**
   * Flee using distance-weighted repulsion vectors scored against cardinal
   * neighbors. Port of NPCAI.attemptFleeFrom; movement goes through MoveIntent.
   * @returns {boolean} true when a flee move/interaction was emitted
   */
  static tryFlee(ctx, threats) {
    const { npc, gameMap } = ctx;
    if (npc.ap < 1.0) return false;

    // 1. Push vector from all threats (force ~ 1/distSq)
    let pushX = 0;
    let pushY = 0;
    threats.forEach(zombie => {
      const dx = npc.logicalX - zombie.logicalX;
      const dy = npc.logicalY - zombie.logicalY;
      const distSq = dx * dx + dy * dy;
      if (distSq === 0) return;
      const dist = Math.sqrt(distSq);
      const force = 1.0 / distSq;
      pushX += (dx / dist) * force;
      pushY += (dy / dist) * force;
    });
    if (pushX === 0 && pushY === 0) return false;

    const pushLength = Math.sqrt(pushX * pushX + pushY * pushY);
    const fleeVec = { x: pushX / pushLength, y: pushY / pushLength };

    // 2. Score cardinal neighbors by alignment with the flee vector
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
      const nx = neighbor.x - npc.logicalX;
      const ny = neighbor.y - npc.logicalY;
      const score = nx * fleeVec.x + ny * fleeVec.y;
      candidates.push({ neighbor, score, tile });
    });
    candidates.sort((a, b) => b.score - a.score);

    // 3. First safe, walkable neighbor wins
    for (const cand of candidates) {
      const { neighbor, tile } = cand;

      const isEdgeBlocked = Pathfinding.isEdgeBlocked(gameMap, npc.logicalX, npc.logicalY, neighbor.x, neighbor.y, npc, { isPathfinding: true, allowBreaching: true });
      if (isEdgeBlocked) continue;

      const hasBlockingEntity = tile.contents.some(e => e.blocksMovement && e.type !== 'door' && e.type !== 'window');
      if (hasBlockingEntity) continue;

      // Skip tiles already visited this turn to prevent oscillation
      const alreadyVisited = npc.movementPath && npc.movementPath.some(pos => pos.x === neighbor.x && pos.y === neighbor.y);
      if (alreadyVisited) continue;

      const isBaseWalkable = tile.isWalkable(npc, { allowBreaching: true });
      if (!isBaseWalkable) continue;

      // Total AP cost including structure interaction and window climbing
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

      // AP economy & look-ahead: don't start a traversal we can't finish while
      // a zombie is breathing down our neck.
      if (npc.ap < totalCost) {
        let closestDist = Infinity;
        threats.forEach(z => {
          const dist = npc.getDistanceTo(z.logicalX, z.logicalY);
          if (dist < closestDist) closestDist = dist;
        });
        if (closestDist <= 3.0) continue;
      }

      if (npc.ap < interactionCost) return false; // wait

      // Invalidate cached travel path because we are fleeing
      npc.currentPath = null;

      if (structure) {
        npc.behaviorState = 'fleeing';
        return this.interactWithStructure(ctx, structure, neighbor.x, neighbor.y, interactionCost);
      }

      if (npc.ap >= moveCost) {
        npc.behaviorState = 'fleeing';
        return this.emitMove(ctx, neighbor.x, neighbor.y, moveCost);
      }
    }

    return false;
  }

  /**
   * Melee adjacent zombie, shoot a visible one, or step toward the closest to
   * engage; burns remaining AP when nothing is possible (hunker down).
   * Port of NPCAI.processLastResortCombat — always concludes the NPC's options
   * for this cycle.
   */
  static lastResortCombat(ctx, threats) {
    const { npc, gameMap } = ctx;
    const realZombies = threats.filter(z => z.type === 'zombie');

    // 1. Melee attack if cardinally adjacent
    const adjacentZombie = realZombies.find(z => npc.isAdjacentTo(z.logicalX, z.logicalY));
    if (adjacentZombie) {
      if (this.npcAttack(ctx, adjacentZombie, false)) return;
    }

    // 2. Ranged attack if a ranged weapon is held
    const weapon = npc.getEquippedWeapon();
    const isRanged = weapon && (ItemDefs[weapon.defId]?.rangedStats || weapon.rangedStats);
    if (isRanged) {
      const shootZombie = realZombies.find(z => npc.canSeeEntity(gameMap, z));
      if (shootZombie) {
        if (this.npcAttack(ctx, shootZombie, true)) return;
      }
    }

    // 3. Step toward the closest threat to engage
    if (realZombies.length > 0 && npc.ap >= 1.0) {
      const closestZombie = realZombies[0]; // sorted closest first
      const path = Pathfinding.findPath(gameMap, npc.logicalX, npc.logicalY, closestZombie.logicalX, closestZombie.logicalY, {
        entity: npc,
        allowDiagonal: false
      });
      if (path && path.length > 2) { // need start, nextStep, and target
        if (this.stepAlongPath(ctx, path[1])) return;
      }
    }

    // Burn remaining AP (wait/hunker down); emits nothing, ending this NPC's turn.
    npc.ap = 0;
  }

  /**
   * Attack-on-sight hunting: engage the player immediately, no demand and no
   * disengaging. Shoots from range when armed, melees from a cardinal attack
   * slot otherwise, and pursues the last known position once line of sight
   * breaks so cover only buys the player a moment.
   *
   * Unlike hostilePlayer this never sets simContext.demandPending, so several
   * attack-on-sight NPCs all act in the same turn.
   *
   * @returns {boolean} true when this branch acted; false when the player has
   *   never been seen or is currently unreachable.
   */
  static huntPlayer(ctx) {
    const { npc, gameMap, player } = ctx;

    const canSee = this.canSeePlayer(npc, gameMap, player);
    if (canSee) {
      // Refresh the last known position directly rather than through
      // Entity.setTargetSighted, which fires a zombie-specific event.
      npc.lastSeen = true;
      npc.targetSightedCoords = { x: player.logicalX, y: player.logicalY };
    }

    // 1. Melee from an adjacent attack position.
    if (isMeleeAttackPosition(npc, gameMap, npc.logicalX, npc.logicalY, player)) {
      npc.behaviorState = 'attacking';
      if (this.npcAttack(ctx, player, false)) return true;
    }

    // 2. Shoot on sight when holding a ranged weapon and inside its range.
    if (canSee) {
      const weapon = npc.getEquippedWeapon();
      const weaponDef = weapon ? ItemDefs[weapon.defId] : null;
      const isRanged = weapon && (weaponDef?.rangedStats || weapon.rangedStats);
      if (isRanged) {
        const maxRange = weaponDef?.rangedStats?.maxRange ?? weapon?.rangedStats?.maxRange ?? 8;
        if (npc.getDistanceTo(player.logicalX, player.logicalY) <= maxRange) {
          npc.behaviorState = 'attacking';
          if (this.npcAttack(ctx, player, true)) return true;
        }
      }
    }

    // 3. Close on the player: a free cardinal slot beside them while visible.
    if (canSee) {
      npc.behaviorState = 'hunting';
      const slotPath = findAttackSlotPath(gameMap, npc, player);
      if (slotPath && slotPath.path.length > 1) {
        return this.stepAlongPath(ctx, slotPath.path[1]);
      }
      return false;
    }

    // 4. Out of sight: press on toward the last known position, forgetting it
    //    on arrival so the NPC doesn't loop on an empty tile.
    if (!npc.lastSeen) return false;
    const lkp = npc.targetSightedCoords;
    if (!lkp || (npc.logicalX === lkp.x && npc.logicalY === lkp.y)) {
      npc.lastSeen = false;
      return false;
    }

    npc.behaviorState = 'hunting';
    const path = Pathfinding.findPath(gameMap, npc.logicalX, npc.logicalY, lkp.x, lkp.y, { entity: npc });
    if (path && path.length > 1 && this.stepAlongPath(ctx, path[1])) return true;

    npc.lastSeen = false; // unreachable — stop chasing a ghost
    return false;
  }

  /**
   * Hostile extortion/attack behavior with smart attack-slot positioning.
   * @returns {boolean} true when this branch acted (or demanded); false to
   *   fall through to lower priorities.
   */
  static hostilePlayer(ctx, simContext) {
    const { npc, gameMap, player } = ctx;
    if (npc.wasAttackedThisTurn) npc.behaviorState = 'attacking';

    // In a melee attack position (cardinally adjacent, no wall/closed structure
    // on the shared edge): demand first, attack once the demand has been made.
    if (isMeleeAttackPosition(npc, gameMap, npc.logicalX, npc.logicalY, player)) {
      if (!npc.hasDemanded) {
        npc.behaviorState = 'demanding';
        ctx.pushUncounted({
          type: 'DEMAND',
          entityId: npc.id,
          data: { x: npc.logicalX, y: npc.logicalY }
        });
        // Yield the turn but save AP; freeze the rest of the NPC phase so the
        // demand dialog is the next thing the player sees.
        simContext.demandPending = npc.id;
        return true;
      }
      npc.behaviorState = 'attacking';
      return this.npcAttack(ctx, player, false);
    }

    // Shoot from range once the demand has been made and a ranged weapon is held
    if (npc.hasDemanded) {
      const weapon = npc.getEquippedWeapon();
      const weaponDef = weapon ? ItemDefs[weapon.defId] : null;
      const isRanged = weapon && (weaponDef?.rangedStats || weapon.rangedStats);
      if (isRanged) {
        const maxRange = weaponDef?.rangedStats?.maxRange ?? weapon?.rangedStats?.maxRange ?? 8;
        const dist = npc.getDistanceTo(player.logicalX, player.logicalY);
        if (dist <= maxRange) {
          npc.behaviorState = 'attacking';
          return this.npcAttack(ctx, player, true);
        }
      }
    }

    // Approach: step along a path to a free cardinal attack slot next to the
    // player — never toward the player's own unwalkable tile.
    const slotPath = findAttackSlotPath(gameMap, npc, player);
    if (slotPath && slotPath.path.length > 1) {
      return this.stepAlongPath(ctx, slotPath.path[1]);
    }

    // No reachable attack slot: yield to lower priorities instead of freezing.
    return false;
  }

  /**
   * Walk toward heard noise, blacklisting sources that are resolved, stale, or
   * unreachable. Port of NPCAI.processInvestigation.
   * @returns {boolean} true when an investigation step was emitted
   */
  static investigate(ctx) {
    const { npc, gameMap } = ctx;
    const currentTurn = engine.turn || 1;
    const nx = npc.noiseCoords.x;
    const ny = npc.noiseCoords.y;

    const isBlacklisted = npc.noiseBlacklist.some(b => b.x === nx && b.y === ny && (currentTurn - b.turn) < 5);
    if (isBlacklisted) {
      npc.clearNoiseHeard();
      return false;
    }

    const arrived = npc.logicalX === nx && npc.logicalY === ny;
    let sourceIdentified = false;
    if (npc.canSeePosition(gameMap, nx, ny)) {
      const tile = gameMap.getTile(nx, ny);
      if (tile && tile.contents.some(e => e.type === EntityType.PLAYER || e.type === EntityType.ZOMBIE)) {
        sourceIdentified = true;
      }
    }

    if (arrived || sourceIdentified) {
      npc.noiseBlacklist.push({ x: nx, y: ny, turn: currentTurn });
      npc.clearNoiseHeard();
      return false;
    }

    const path = Pathfinding.findPath(gameMap, npc.logicalX, npc.logicalY, nx, ny, { entity: npc });
    if (path && path.length > 1 && this.stepAlongPath(ctx, path[1])) {
      return true;
    }

    npc.noiseBlacklist.push({ x: nx, y: ny, turn: currentTurn });
    npc.clearNoiseHeard();
    return false;
  }

  /**
   * Travel to the south map exit along a cached path; ESCAPE on arrival.
   * Port of NPCAI.processTravelSouth.
   */
  static travelSouth(ctx) {
    const { npc, gameMap } = ctx;

    // 1. Locate exit goal if missing
    if (!npc.goalTarget) {
      const exit = findSouthTransitionTile(gameMap);
      if (exit) {
        npc.goalTarget = exit;
      } else {
        return;
      }
    }

    // 2. Escape when standing on the exit goal
    if (npc.logicalX === npc.goalTarget.x && npc.logicalY === npc.goalTarget.y) {
      npc.hasExited = true;
      ctx.pushAction({
        type: 'ESCAPE',
        entityId: npc.id,
        data: { x: npc.logicalX, y: npc.logicalY }
      });
      return;
    }

    // 3. Validate cached path
    let pathValid = npc.currentPath && npc.currentPath.length > 0;
    if (pathValid) {
      const nextStep = npc.currentPath[0];
      const dx = Math.abs(npc.logicalX - nextStep.x);
      const dy = Math.abs(npc.logicalY - nextStep.y);

      if ((dx + dy) !== 1) {
        pathValid = false; // drifted off path
      } else {
        const nextTile = gameMap.getTile(nextStep.x, nextStep.y);
        if (!nextTile) {
          pathValid = false;
        } else {
          const edgeBlocked = Pathfinding.isEdgeBlocked(gameMap, npc.logicalX, npc.logicalY, nextStep.x, nextStep.y, npc, { isPathfinding: true, allowBreaching: true });
          const hasBlockingEntity = nextTile.contents.some(e => e.blocksMovement && e.type !== 'door' && e.type !== 'window');
          if (edgeBlocked || hasBlockingEntity) pathValid = false;
        }
      }
    }

    // 4. Recalculate path if invalid
    if (!pathValid) {
      const rawPath = Pathfinding.findPath(gameMap, npc.logicalX, npc.logicalY, npc.goalTarget.x, npc.goalTarget.y, { entity: npc });
      if (rawPath && rawPath.length > 1) {
        npc.currentPath = rawPath.slice(1); // exclude starting position
      } else {
        npc.currentPath = null;
        return;
      }
    }

    // 5. Take the next step, unless it enters a known threat's danger zone
    const nextStep = npc.currentPath[0];
    if (nextStep) {
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
        npc.currentPath = null;
        return;
      }

      if (this.stepAlongPath(ctx, nextStep)) {
        npc.currentPath.shift();
        return;
      }
    }

    npc.currentPath = null;
  }

  /**
   * Take one step toward an adjacent tile, opening/prying any door or window on
   * the way. Port of NPCAI.performStepTowards; the move itself is a MoveIntent.
   * @returns {boolean} true when a move/interaction was emitted
   */
  static stepAlongPath(ctx, nextStep) {
    const { npc, gameMap } = ctx;
    const tile = gameMap.getTile(nextStep.x, nextStep.y);
    if (!tile) return false;

    const structure = Pathfinding.getBlockingStructure(gameMap, npc.logicalX, npc.logicalY, nextStep.x, nextStep.y);
    if (structure) {
      let cost = 1;
      if (structure.type === 'door' && !structure.isOpen) {
        cost = structure.isLocked ? 2 : 1;
      } else if (structure.type === 'window' && !structure.isOpen && !structure.isBroken) {
        cost = structure.isLocked ? 2 : 1;
      }
      if (npc.ap >= cost) {
        return this.interactWithStructure(ctx, structure, nextStep.x, nextStep.y, cost);
      }
      return false;
    }

    let moveCost = 1.0;
    const window = tile.contents.find(e => e.type === EntityType.WINDOW);
    if (window && (window.isOpen || window.isBroken)) {
      moveCost = 2.0; // climb cost
    }

    if (npc.ap >= moveCost) {
      return this.emitMove(ctx, nextStep.x, nextStep.y, moveCost);
    }
    return false;
  }

  /**
   * Enqueue a MoveIntent to an adjacent tile. MovementSystem deducts the
   * Movable.apCost (1.0); any extra cost (window climbing at 2.0 total) is
   * pre-deducted here to match legacy AP totals. The destination is recorded
   * in movementPath immediately so flee scoring won't revisit it this turn.
   */
  static emitMove(ctx, toX, toY, moveCost) {
    const { npc } = ctx;
    const movable = npc.getComponent('Movable');
    const baseCost = movable ? movable.apCost : 1.0;
    const extraCost = Math.max(0, moveCost - baseCost);
    if (npc.ap < baseCost + extraCost) return false;
    if (extraCost > 0) npc.useAP(extraCost);

    if (!npc.movementPath || npc.movementPath.length === 0) {
      npc.movementPath = [{ x: npc.logicalX, y: npc.logicalY }];
    }
    npc.movementPath.push({ x: toX, y: toY });

    ctx.enqueue('MoveIntent', new MoveIntent({ dx: toX - npc.logicalX, dy: toY - npc.logicalY }));
    return true;
  }

  /**
   * Open or pry a door/window (simulation-first: state mutates now, the
   * STRUCTURE_INTERACT action is cosmetic at playback). Port of
   * NPCAI.interactWithStructure.
   */
  static interactWithStructure(ctx, structure, tx, ty, cost) {
    const { npc, gameMap } = ctx;
    npc.useAP(cost);

    const fromPos = { x: npc.logicalX, y: npc.logicalY };
    const toPos = { x: tx, y: ty };

    if (structure.type === 'door') {
      if (structure.isLocked) {
        structure.takeDamage(20); // Smash/pry locked door open
        if (gameMap.emitNoise) gameMap.emitNoise(tx, ty, 4);
        ctx.pushAction({
          type: 'STRUCTURE_INTERACT',
          entityId: npc.id,
          data: { x: tx, y: ty, from: fromPos, to: toPos, interaction: 'pry_door', apCost: cost, success: true, targetId: structure.id, targetType: 'door', broken: true }
        });
      } else {
        structure.open(); // Slide unlocked door open
        ctx.pushAction({
          type: 'STRUCTURE_INTERACT',
          entityId: npc.id,
          data: { x: tx, y: ty, from: fromPos, to: toPos, interaction: 'open_door', apCost: cost, success: true, targetId: structure.id, targetType: 'door' }
        });
      }
    } else if (structure.type === 'window') {
      if (structure.isLocked) {
        structure.break(); // Smash locked window
        if (gameMap.emitNoise) gameMap.emitNoise(tx, ty, 6);
        ctx.pushAction({
          type: 'STRUCTURE_INTERACT',
          entityId: npc.id,
          data: { x: tx, y: ty, from: fromPos, to: toPos, interaction: 'break_window', apCost: cost, success: true, targetId: structure.id, targetType: 'window', broken: true }
        });
      } else {
        structure.open(); // Slide unlocked window open
        ctx.pushAction({
          type: 'STRUCTURE_INTERACT',
          entityId: npc.id,
          data: { x: tx, y: ty, from: fromPos, to: toPos, interaction: 'open_window', apCost: cost, success: true, targetId: structure.id, targetType: 'window' }
        });
      }
    }

    return true;
  }

  /**
   * Roll and push a playback-first ATTACK action (melee or ranged) with the
   * legacy data shape TurnManager and SleepContext expect. Port of
   * NPCAI.performAttack.
   */
  static npcAttack(ctx, target, isRanged) {
    const { npc } = ctx;
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

    const dist = isRanged ? npc.getDistanceTo(target.logicalX || target.x, target.logicalY || target.y) : 0;
    const { hit, damage, dodged } = CombatResolver.rollNpc({
      isRanged,
      combatSkill,
      weaponDef,
      weapon,
      distance: dist,
      currentStrength: npc.currentStrength,
      currentAgility: npc.currentAgility,
      currentPerception: npc.currentPerception,
      defenderType: target.type,
      defenderSubtype: target.subtype,
      defender: target
    });

    if (hit) {
      // Simulated HP so later decisions this turn see pending deaths
      target.simulatedHp = (target.simulatedHp !== undefined ? target.simulatedHp : target.hp) - damage;
    }

    // Invalidate path on attack
    npc.currentPath = null;

    ctx.pushAction({
      type: 'ATTACK',
      entityId: npc.id,
      data: {
        targetId: target.id,
        targetType: target.type,
        success: hit,
        damage,
        dodged,
        from: { x: npc.logicalX, y: npc.logicalY },
        to: { x: target.logicalX || target.x, y: target.logicalY || target.y }
      }
    });

    return true;
  }
}
