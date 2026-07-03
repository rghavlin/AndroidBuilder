import { NoiseEvent } from '../components/NoiseEvent.js';
import { DestroyIntent } from '../components/DestroyIntent.js';
import { getZombieType } from '../entities/ZombieTypes.js';
import { gameRandom } from '../utils/SeededRandom.js';

// Turns of sickness applied by an infecting hit (matches TurnManager playback).
const SICKNESS_TURNS = 24;

export class CombatSystem {
  static resolve(attacker, damageIntent, entities, gameMap, intentQueue, actionQueue = [], engine = null, parentEnvelope = null) {
    if (!attacker) return;

    let target = entities.find(e => e.id === damageIntent.targetId);
    let isStructure = false;

    if (!target && damageIntent.isStructure && gameMap) {
      const targetTile = gameMap.getTile(damageIntent.targetX, damageIntent.targetY);
      target = targetTile?.contents.find(e => e.id === damageIntent.targetId);
      if (!target) {
        const attackerPos = attacker.getComponent('Position') || { x: attacker.x, y: attacker.y };
        const sourceTile = gameMap.getTile(attackerPos.x, attackerPos.y);
        target = sourceTile?.contents.find(e => e.id === damageIntent.targetId);
      }
      if (target) {
        isStructure = true;
      }
    }

    if (target) {
      if (isStructure) {
        // If the structure is already open or broken, skip the attack intent
        if (target.isOpen || target.isBroken || target.isDamaged) {
          attacker.removeComponent('DamageIntent');
          return;
        }

        // Calculate Bulk Math
        const ATTACK_AP_COST = 1.0;
        const targetHealth = target.health !== undefined ? target.health : (target.hp !== undefined ? target.hp : 0);
        const damageAmount = attacker.damageAmount !== undefined ? attacker.damageAmount : damageIntent.amount;
        const attackerAp = attacker.ap !== undefined ? attacker.ap : (attacker.currentAP !== undefined ? attacker.currentAP : 0);

        const hitsToDestroy = Math.ceil(targetHealth / damageAmount);
        const maxHitsPossible = Math.floor(attackerAp / ATTACK_AP_COST);
        const actualHits = Math.min(hitsToDestroy, maxHitsPossible);

        if (actualHits <= 0) {
          attacker.removeComponent('DamageIntent');
          return;
        }

        const totalDamage = actualHits * damageAmount;
        const totalApCost = actualHits * ATTACK_AP_COST;

        // Apply Bulk State Changes
        // SIMULATION-FIRST damage (see TurnManager damage-timing models): structures
        // take the full damage now (silent=true), and the STRUCTURE_INTERACT action
        // queued below is cosmetic — TurnManager must NOT re-apply it during playback.
        const damageResult = target.takeDamage(totalDamage, true);
        const broken = !!(damageResult && damageResult.isBroken);

        attacker.useAP(totalApCost);

        // Cascade: Enqueue NoiseEvent
        if (intentQueue) {
          intentQueue.enqueue(null, 'NoiseEvent', new NoiseEvent({
            x: damageIntent.targetX,
            y: damageIntent.targetY,
            volume: broken ? 10 : 6,
            sourceEntityId: attacker.id
          }), parentEnvelope);

          // Cascade: If broken and NOT a door or window, enqueue DestroyIntent
          if (broken && target.type !== 'door' && target.type !== 'window') {
            intentQueue.enqueue(target.id, 'DestroyIntent', new DestroyIntent({
              entityId: target.id
            }), parentEnvelope);
          }
        } else if (gameMap && typeof gameMap.emitNoise === 'function') {
          gameMap.emitNoise(damageIntent.targetX, damageIntent.targetY, 6);
        }

        if (actionQueue) {
          const attackerPos = attacker.getComponent('Position') || { x: attacker.x, y: attacker.y };
          actionQueue.push({
            type: 'STRUCTURE_INTERACT',
            entityId: attacker.id,
            data: {
              success: true,
              damage: totalDamage,
              broken: broken,
              targetId: target.id,
              targetType: target.type,
              from: { x: attackerPos.x, y: attackerPos.y },
              to: { x: damageIntent.targetX, y: damageIntent.targetY }
            }
          });
        }
      } else {
        // Normal entity combat.
        // Roll the outcome ONCE here (simulation phase) so playback and the
        // direct/test path agree on the same numbers. Per-type damage and
        // afflictions come from the attacking zombie's ZombieTypes.combat block;
        // any non-zombie attacker falls back to the intent's flat amount and
        // inflicts no afflictions.
        let damage = damageIntent.amount;
        let bleedingInflicted = false;
        let sickInflicted = false;
        if (attacker.type === 'zombie') {
          const combat = getZombieType(attacker.subtype)?.combat || {};
          if (combat.damage && typeof combat.damage.min === 'number' && typeof combat.damage.max === 'number') {
            damage = gameRandom.nextInt(combat.damage.min, combat.damage.max);
          }
          if (combat.bleedChance && gameRandom.next() < combat.bleedChance) bleedingInflicted = true;
          if (combat.sickChance && gameRandom.next() < combat.sickChance) sickInflicted = true;
        }

        if (actionQueue) {
          const attackerPos = attacker.getComponent('Position') || { x: attacker.x, y: attacker.y };
          const targetPos = target.getComponent('Position') || { x: target.x, y: target.y };
          // PLAYBACK-FIRST damage (see TurnManager damage-timing models): for
          // entity-vs-entity combat we do NOT apply damage here. TurnManager's
          // ATTACK case calls takeDamage() and applies bleeding/sickness after the
          // swing animation so the hit lands when the animation connects. The
          // `else` branch below is the direct/test path (no actionQueue).
          actionQueue.push({
            type: 'ATTACK',
            entityId: attacker.id,
            data: {
              targetId: target.id,
              targetType: target.type,
              success: true,
              damage,
              bleedingInflicted,
              sickInflicted,
              from: { x: attackerPos.x, y: attackerPos.y },
              to: { x: targetPos.x, y: targetPos.y }
            }
          });
        } else {
          // direct/test execution: apply damage + afflictions immediately.
          if (typeof target.takeDamage === 'function') {
            target.takeDamage(damage, attacker);
          } else if (target.hasComponent('Health')) {
            const health = target.getComponent('Health');
            health.current = Math.max(0, health.current - damage);
            if (health.current <= 0) {
              health.isDead = true;
            }
          }
          if (bleedingInflicted && typeof target.setBleeding === 'function') target.setBleeding(true);
          if (sickInflicted && typeof target.inflictSickness === 'function') target.inflictSickness(SICKNESS_TURNS);
        }

        // Deduct AP for attacking
        const apCost = 2.0;
        attacker.useAP(apCost);

        // State Sync: If the target is the player (has InventoryContainer), flag engine._uiDirty = true
        const isPlayer = target.hasComponent('InventoryContainer');
        if (isPlayer && engine) {
          engine._uiDirty = true;
        }
      }
    }

    // Cleanup: Remove DamageIntent from attacker
    attacker.removeComponent('DamageIntent');
  }

  static process(entities, worldManager, engine, actionQueue = null) {
    const entityList = Array.isArray(entities)
      ? entities
      : (entities instanceof Map ? Array.from(entities.values()) : Object.values(entities));

    for (const attacker of entityList) {
      if (attacker.hasComponent('DamageIntent')) {
        const damageIntent = attacker.getComponent('DamageIntent');
        this.resolve(attacker, damageIntent, entityList, engine?.gameMap, null, actionQueue, engine);
      }
    }
  }
}
