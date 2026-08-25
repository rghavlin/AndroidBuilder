import { EntityType } from '../entities/Entity.js';
import { ItemDefs } from '../inventory/ItemDefs.js';
import { getNPCType } from '../entities/NPCTypes.js';
import { CombatResolver } from './CombatResolver.js';
import { DestructionSystem } from './DestructionSystem.js';
import { DestroyIntent } from '../components/DestroyIntent.js';
import { NPCAISystem } from './NPCAISystem.js';
import turnManager from '../managers/TurnManager.js';
import engine from '../GameEngine.js';
import Logger from '../utils/Logger.js';

const log = Logger.scope('ScriptedAttack');

// Entity types an authored attack may target: everything that has HP and can
// die. Structures are excluded on purpose (see performScriptedAttack).
const LIVING_TARGETS = new Set([EntityType.PLAYER, EntityType.NPC, EntityType.ZOMBIE, EntityType.RABBIT]);

/**
 * Authored (event-driven) attacks: one entity swings at another because a map
 * event said so, not because the AI decided to.
 *
 * This is the AI-free sibling of NPCAISystem.npcAttack. It deliberately differs
 * on four points, because a scripted attack is a cutscene beat rather than a
 * turn action:
 *   - it ALWAYS hits and can never be dodged (CombatResolver's `alwaysHit`):
 *     an authored blow that whiffs is a broken scene, not a dramatic near-miss.
 *     Damage, crits and afflictions still roll normally, so how hard it lands
 *     is still up to the dice,
 *   - no AP gate and no AP spend (the event fires between turns, and an author
 *     asking for a punch should always get one),
 *   - no range/line-of-sight check (the author already decided the shot is
 *     possible; distance no longer costs accuracy, only the damage table
 *     applies),
 *   - it resolves the whole beat itself — roll, animation, damage, death —
 *     because no simulation pass follows to clean up after it.
 *
 * Damage still lands on the PLAYBACK-FIRST schedule (see TurnManager's
 * damage-timing header): the action is handed to TurnManager, which applies
 * takeDamage() at the swing's impact frame exactly as it does for a queued one.
 */

/** Melee unless the attacker actually holds a gun; zombies are always melee. */
function resolveAttackMode(attacker, mode) {
  if (attacker.type === EntityType.ZOMBIE) return false;
  const weapon = typeof attacker.getEquippedWeapon === 'function' ? attacker.getEquippedWeapon() : null;
  const rangedStats = weapon ? (ItemDefs[weapon.defId]?.rangedStats || weapon.rangedStats) : null;
  if (mode === 'melee') return false;
  if (mode === 'ranged' && !rangedStats) {
    log.warn(`Entity "${attacker.name || attacker.id}" was told to shoot but holds no ranged weapon — falling back to melee`);
    return false;
  }
  return !!rangedStats;
}

/**
 * Roll a scripted attack and build the ATTACK action that plays it back.
 * Exported separately from performScriptedAttack so the outcome can be
 * inspected (and unit-tested) without running an animation.
 *
 * @returns {{ action: Object, isRanged: boolean }|null}
 */
export function buildScriptedAttackAction(attacker, target, mode = 'auto') {
  if (!attacker || !target) return null;

  const isRanged = resolveAttackMode(attacker, mode);
  const weapon = typeof attacker.getEquippedWeapon === 'function' ? attacker.getEquippedWeapon() : null;
  const weaponDef = weapon ? ItemDefs[weapon.defId] : null;

  const targetX = target.logicalX ?? target.x;
  const targetY = target.logicalY ?? target.y;
  const distance = isRanged ? attacker.getDistanceTo(targetX, targetY) : 0;

  let outcome;
  if (attacker.type === EntityType.ZOMBIE) {
    outcome = CombatResolver.rollZombie({
      alwaysHit: true,
      subtype: attacker.subtype,
      defenderType: target.type,
      defenderSubtype: target.subtype,
      defender: target
    });
  } else {
    const typeDef = getNPCType(attacker.typeId);
    outcome = CombatResolver.rollNpc({
      alwaysHit: true,
      isRanged,
      combatSkill: typeDef?.ai?.combatSkill || 0.5,
      weaponDef,
      weapon,
      distance,
      currentStrength: attacker.currentStrength,
      currentAgility: attacker.currentAgility,
      currentPerception: attacker.currentPerception,
      defenderType: target.type,
      defenderSubtype: target.subtype,
      defender: target
    });
  }

  // Muzzle flash on the shooter's own tile, matching npcAttack's presentation
  // (no tracer: a travelling sprite reads wrong for a bullet).
  const metadata = {};
  if (isRanged) metadata.muzzleFlash = { x: attacker.logicalX, y: attacker.logicalY };

  return {
    isRanged,
    action: {
      type: 'ATTACK',
      entityId: attacker.id,
      metadata,
      data: {
        targetId: target.id,
        targetType: target.type,
        success: outcome.hit,
        damage: outcome.damage,
        dodged: outcome.dodged,
        bleedingInflicted: !!outcome.bleedingInflicted,
        sickInflicted: !!outcome.sickInflicted,
        infectionInflicted: !!outcome.infectionInflicted,
        // weaponType/weaponId drive playback presentation: AudioContext picks
        // the gunshot sample per weaponId, EntityRenderer suppresses the melee
        // lunge for ranged attacks.
        weaponType: isRanged ? 'ranged' : 'melee',
        weaponId: weapon?.defId || null,
        from: { x: attacker.logicalX, y: attacker.logicalY },
        to: { x: targetX, y: targetY }
      }
    }
  };
}

/**
 * Remove a non-player entity that the scripted attack just killed, and play its
 * death. Normally SimulationManager.checkAndProcessDeaths does this at the end
 * of a turn; an event attack has no such pass behind it, so a corpse would
 * otherwise stand upright at 0 HP until the next turn ticked.
 */
async function resolveScriptedDeath(target, context) {
  const { gameMap, player } = context;
  if (!target || target === player || target.type === EntityType.PLAYER) return;
  if (typeof target.isDead === 'function' ? !target.isDead() : !(target.hp <= 0)) return;
  if (!gameMap.getEntity(target.id)) return; // already cleaned up

  const deathQueue = [];
  DestructionSystem.resolve(
    new DestroyIntent({ entityId: target.id }),
    Array.from(gameMap.entityMap.values()),
    gameMap,
    null,
    deathQueue
  );
  for (const action of deathQueue) {
    await turnManager.playScriptedAction(action, context);
  }
}

/**
 * Make `attacker` attack `target` right now, animation and all.
 *
 * @param {Entity} attacker - NPC or zombie doing the attacking
 * @param {Entity} target   - player, NPC or zombie on the receiving end
 * @param {'auto'|'melee'|'ranged'} mode
 * @returns {Promise<boolean>} true when the attack was played
 */
export async function performScriptedAttack(attacker, target, mode = 'auto') {
  const gameMap = engine.gameMap;
  const player = engine.player;
  if (!attacker || !target || !gameMap) return false;

  if (typeof attacker.isDead === 'function' && attacker.isDead()) {
    log.warn(`Attacker "${attacker.name || attacker.id}" is dead — skipping scripted attack`);
    return false;
  }
  if (typeof target.isDead === 'function' && target.isDead()) {
    log.warn(`Target "${target.name || target.id}" is already dead — skipping scripted attack`);
    return false;
  }
  // Structures resolve on the SIMULATION-FIRST schedule via STRUCTURE_INTERACT,
  // not through an ATTACK action. The editor's target picker already excludes
  // them; this catches a hand-edited event aimed at a door or window, which
  // wants the controlEntity step instead.
  if (!LIVING_TARGETS.has(target.type)) {
    log.warn(`Target "${target.name || target.id}" is a ${target.type}, not a living entity — use controlEntity for doors/windows`);
    return false;
  }

  const built = buildScriptedAttackAction(attacker, target, mode);
  if (!built) return false;

  // A gunshot is loud, exactly as loud as the AI's own shot would be.
  if (built.isRanged) {
    const weapon = typeof attacker.getEquippedWeapon === 'function' ? attacker.getEquippedWeapon() : null;
    const weaponDef = weapon ? ItemDefs[weapon.defId] : null;
    const radius = NPCAISystem.rangedNoiseRadius(weapon, weaponDef);
    if (typeof gameMap.emitNoise === 'function') gameMap.emitNoise(attacker.logicalX, attacker.logicalY, radius);
  }

  attacker.currentPath = null; // an attacking entity abandons its cached path

  const context = { gameMap, player };
  await turnManager.playScriptedAction(built.action, context);
  await resolveScriptedDeath(target, context);

  engine.notifyUpdate();
  return true;
}
