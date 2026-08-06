// PlayerCombatSystem — the player's direct attack actions (melee / ranged).
//
// WHY THIS FILE EXISTS
// This logic used to live inside `contexts/CombatContext.jsx`. Because it sat in
// React, the headless harness could not call it, so `test/harness/GameHarness.js`
// maintained a hand-written *copy* ("Mirrors CombatContext.performRangedAttack...").
// The copy drifted: it lacked burst fire, sling ammo, scope/laser-sight, weapon
// condition breakage, edge-structure retargeting, turrets and kill loot. Since the
// balance simulator's policy is "shoot > melee > close in", every number it printed
// described a weaker ranged model than the game actually ships.
//
// The logic now lives here, in the engine, and both the React context and the
// harness call it. There is exactly one implementation.
//
// PRESENTATION BOUNDARY
// This module must stay importable in plain Node: no React, no DOM, no `window`.
// It talks to the UI only through the optional `ui` callback bag below, which
// defaults to no-ops. That keeps side-effect *ordering* identical to the original
// inline code — an "collect effects and replay them later" design would have
// reordered logs relative to damage application, and this was a strict port.
//
// RNG NOTE: player combat rolls go through the seeded gameRandom, matching
// CombatResolver.rollPlayerMelee / rollPlayerRanged (which already do). This
// keeps every combat roll on one reproducible stream. It is NOT save-scummable:
// gameRandom's STATE is checkpointed on save (getState/setState) and resumed on
// load, rather than re-seeded from the original seed, so a reload continues the
// exact stream instead of replaying it. Keep the player-driven rolls below on
// gameRandom too — do NOT reintroduce Math.random (it desyncs headless
// simulation/replay and this combat stream).

import { ItemDefs, createItemFromDef } from '../inventory/ItemDefs.js';
import GameEvents, { GAME_EVENT } from '../utils/GameEvents.js';
import { dropZombieDeathLoot } from '../entities/ZombieCorpseConfig.js';
import { ItemCategory, ItemTrait, FireMode } from '../inventory/traits.js';
import { findEdgeStructure } from '../utils/EdgeStructure.js';
import { ProjectileManager } from '../utils/ProjectileManager.js';
import { EntityType } from '../entities/Entity.js';
import { Pathfinding } from '../utils/Pathfinding.js';
import { LineOfSight } from '../utils/LineOfSight.js';
import { getAttackableTurretOnTile, removeDestroyedTurret, provokeTargetFaction } from '../ai/TurretCombat.js';
import { CombatResolver } from './CombatResolver.js';
import { gameRandom } from '../utils/SeededRandom.js';
import engine from '../GameEngine.js';

// Every UI hook the attack paths need, defaulted to a no-op so headless callers
// (harness, fuzz, balance) can omit the whole bag. `recordHit` returns the new
// skill level or null/undefined when no level-up occurred.
const NOOP_UI = {
    addLog: () => {},
    addEffect: () => {},
    destroyItem: () => {},
    cancelTargeting: () => {},
    updatePlayerStats: () => {},
    forceRefresh: () => {},
    triggerMapUpdate: () => {},
    recordHit: () => null,
};

const withUi = (ui) => (ui ? { ...NOOP_UI, ...ui } : NOOP_UI);

// Authoritative LOGICAL position of an entity.
//
// Entities carry RENDER coords in `x`/`y`, which the React animation layer keeps
// in sync as tweens land. Headless there is no animation layer, so `x`/`y` go
// stale while `gridX`/`gridY` advance — a player who has walked three tiles still
// reports its starting `x`. This logic used to live in CombatContext and read
// `player.x` directly, which worked only because the UI happened to maintain it.
// GameContext.simulateTurn documents the same rule for the AI: "Use gridX/gridY
// (the authoritative logical position) NOT renderX/renderY ... Copying render
// coords into logicalX/Y poisons the AI."
const lx = (e) => e?.gridX ?? e?.logicalX ?? e?.x;
const ly = (e) => e?.gridY ?? e?.logicalY ?? e?.y;

export const isWindowTile = (gameMap, x, y) => {
    const tile = gameMap?.getTile(x, y);
    return !!(tile && tile.contents.some(e => e.type === EntityType.WINDOW));
};

// The player attacked an NPC or turret: provoke its faction (flip to attack-on-
// sight, faction-wide) and, only on the first flip, log the warning. Shared by
// the melee / ranged / thrown attack paths.
export const provokeAndWarn = (gameMap, target, addLog) => {
    const { faction, newlyHostile } = provokeTargetFaction(gameMap, target);
    if (faction && newlyHostile) {
        const label = faction === 'town'
            ? 'The town turrets turn on you!'
            : `The ${faction.charAt(0).toUpperCase() + faction.slice(1)} turn on you!`;
        addLog(label, 'warning');
    }
};

// Resolve the primary combat target for a click at (x, y), in priority order:
// living entity (zombie/rabbit/npc) > attackable turret > breakable structure
// (window/door). Edge-aligned windows/doors are anchored to a single tile but
// visually sit on the shared boundary between two tiles, so when no structure is
// found on the clicked tile we also check the four neighbors for an edge
// structure facing this tile. This lets the player smash a window while standing
// on its sill (clicking outward) instead of having to back up a tile first.
// structureX/structureY give the structure's true anchor tile, where damage,
// effects, and noise must be applied.
// Thrown stones can't target turrets, so callers pass includeTurret:false there.
export const resolveTileTarget = (gameMap, x, y, player, { includeTurret = true } = {}) => {
    const tile = gameMap?.getTile(x, y);
    const targetEntity = tile?.contents.find(
        e => e.type === EntityType.ZOMBIE || e.type === EntityType.RABBIT || e.type === EntityType.NPC
    ) || null;
    const turret = (includeTurret && !targetEntity) ? (getAttackableTurretOnTile(tile, player) || null) : null;

    let structure = null;
    let structureX = x;
    let structureY = y;
    if (!targetEntity && !turret) {
        ({ structure, structureX, structureY } = findEdgeStructure(gameMap, x, y));
    }
    return { targetEntity, turret, structure, structureX, structureY };
};

// Acid-zombie area effect. Splash (1-3) on a landed hit, explosion (2-5) on death.
// Consumes gameRandom once per damaged entity — keep the iteration order stable.
export const triggerAcidEffect = (gameMap, zombie, isDeath, ui) => {
    const { addEffect, addLog, triggerMapUpdate, forceRefresh } = withUi(ui);
    if (!gameMap || zombie.subtype !== 'acid') return;

    const radius = 1.4;
    // "When an acid zombie is attacked (and HIT), any entity within 1.4 squares takes 1-3 damage."
    // "When an acid zombie is killed, it explodes doing 2-5 damage"
    const dMin = isDeath ? 2 : 1;
    const dMax = isDeath ? 5 : 3;
    const color = '#86efac'; // light green

    // 1. Visual Flashes
    for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
            const tx = lx(zombie) + dx;
            const ty = ly(zombie) + dy;
            if (tx < 0 || tx >= gameMap.width || ty < 0 || ty >= gameMap.height) continue;

            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist <= radius) {
                addEffect({
                    type: 'tile_flash',
                    x: tx,
                    y: ty,
                    color: color,
                    duration: isDeath ? 800 : 400
                });
            }
        }
    }

    // 2. Damage Entities
    // Manual range check since getEntitiesInRange might not exist
    const allEntities = Array.from(gameMap.entityMap.values());
    allEntities.forEach(entity => {
        // Skip the source zombie for splash (it already took damage)
        if (entity.id === zombie.id && !isDeath) return;

        const dist = Math.sqrt(Math.pow(lx(entity) - lx(zombie), 2) + Math.pow(ly(entity) - ly(zombie), 2));
        if (dist <= radius) {
            if (entity.type === EntityType.PLAYER || entity.type === EntityType.ZOMBIE) {
                const damage = gameRandom.nextInt(dMin, dMax);

                if (typeof entity.takeDamage === 'function') {
                    entity.takeDamage(damage, { id: zombie.id, type: EntityType.ZOMBIE, subtype: 'acid' });

                    addEffect({
                        type: 'damage',
                        x: lx(entity),
                        y: ly(entity),
                        value: damage,
                        color: '#ef4444',
                        duration: 1200
                    });

                    addLog(`${isDeath ? 'Acid explosion' : 'Acid splash'} deals ${damage} damage to ${entity.type === EntityType.PLAYER ? 'you' : 'zombie'}`, 'combat');
                }
            }
        }
    });

    triggerMapUpdate();
    forceRefresh();
};

// Shared kill handling for direct player attacks (melee / ranged / thrown stone).
// Handles the kill log, faction-specific drops and the Earbuck award. Skill
// XP is no longer tied to kills at all — see applyHitProgression, called at
// hit time regardless of whether the hit was lethal.
// Per-site quirks are passed as flags so behavior stays byte-for-byte identical:
//  - lootToGroundIfOnPlayer: ranged drops loot into the ground container when the
//                            target dies on the player's own tile (melee/stone don't).
//  - clearNpcInventory:    melee/ranged clear the looted NPC inventory; stone doesn't.
//  - cancelOnKill:         melee/ranged cancel targeting on kill; stone doesn't.
export const processEntityKill = ({
    gameMap,
    player,
    entity,
    lootX,
    lootY,
    lootGenerator = null,
    lootToGroundIfOnPlayer = false,
    clearNpcInventory = true,
    cancelOnKill = true,
    ui,
}) => {
    const { addLog, cancelTargeting } = withUi(ui);

    addLog(`${entity.type.charAt(0).toUpperCase() + entity.type.slice(1)} killed!`, 'combat');

    // Place dropped items either on the ground container (ranged-on-player-tile) or the map tile.
    const placeItems = (items) => {
        if (!items || items.length === 0) return;
        if (lootToGroundIfOnPlayer && player && lx(entity) === lx(player) && ly(entity) === ly(player) && engine.inventoryManager) {
            items.forEach(it => engine.inventoryManager.groundContainer.addItem(it, null, null, true));
            engine.inventoryManager.groundManager.updateCategoryAreas();
            engine.inventoryManager.emit('inventoryChanged');
        } else {
            gameMap.addItemsToTile(lootX, lootY, items);
        }
    };

    if (entity.type === EntityType.ZOMBIE) {
        if (entity.subtype === 'acid') triggerAcidEffect(gameMap, entity, true, ui);
        dropZombieDeathLoot(entity, lootX, lootY, gameMap, lootGenerator, placeItems);
    } else if (entity.type === EntityType.NPC) {
        // NPCs drop their entire inventory on death
        if (typeof entity.die === 'function') entity.die(); // Emits npcDied event
        const items = entity.inventory.getAllItems();
        if (items.length > 0) {
            placeItems(items);
            if (clearNpcInventory) entity.inventory.clear();
        }
    } else if (entity.type === EntityType.RABBIT) {
        const carcass = createItemFromDef('food.rabbit_carcass');
        if (carcass) placeItems([carcass]);
    }

    gameMap.removeEntity(entity.id);
    if (cancelOnKill) cancelTargeting();
};

// Fires on every landed player hit (not just kills) — skill progress and its
// paired attribute-XP trickle are hit-driven now, decoupled from whether the
// hit happened to be lethal. `announce` preserves the original per-site
// level-up-log behavior (thrown stones historically stayed silent on level-up).
const applyHitProgression = (ui, type, announce = true) => {
    const newLevel = ui.recordHit(type);
    if (announce && newLevel) {
        ui.addLog(`LEVEL UP! ${type.charAt(0).toUpperCase() + type.slice(1)} skill is now level ${newLevel}!`, 'warning');
    }
};

/**
 * Player melee attack against a tile.
 *
 * @param {object}  o
 * @param {object}  o.player           player entity (authoritative)
 * @param {object}  o.gameMap
 * @param {object}  o.weapon           equipped melee Item, or the `unarmed` pseudo-weapon
 * @param {number}  o.targetX
 * @param {number}  o.targetY
 * @param {object}  [o.playerStats]    { meleeLvl } — React state in the UI, entity fields headless
 * @param {object}  [o.inventoryManager]
 * @param {object}  [o.lootGenerator]
 * @param {object}  [o.targetingWeapon] current targeting selection, for break-cancel parity
 * @param {object}  [o.ui]             callback bag; see NOOP_UI
 * @returns {{success: boolean, reason?: string, hit?: boolean, isCrit?: boolean, damage?: number, killed?: boolean}}
 */
export function performMeleeAttack({
    player,
    gameMap,
    weapon,
    targetX,
    targetY,
    playerStats = {},
    inventoryManager = null,
    lootGenerator = null,
    targetingWeapon = null,
    ui: rawUi,
}) {
    const ui = withUi(rawUi);
    const { addLog, addEffect, destroyItem, cancelTargeting, updatePlayerStats, forceRefresh, triggerMapUpdate } = ui;

    if (!player || !gameMap) return { success: false, reason: 'System error' };

    // Guard: Prevent attack with broken weapon
    if (weapon && weapon.instanceId !== 'unarmed' && weapon.condition !== null && weapon.condition <= 0) {
        addEffect({
            type: 'damage',
            x: lx(player),
            y: ly(player),
            value: 'Broke!',
            color: '#ef4444',
            duration: 1000
        });
        destroyItem(weapon.instanceId);
        cancelTargeting();
        return { success: false, reason: 'Weapon is broken' };
    }

    if (player.ap < 1) return { success: false, reason: 'Not enough AP' };

    // Resolve the target first so an edge-aligned window/door can be hit when
    // the player clicks the tile on their side of the wall (e.g. smashing a
    // window while standing on its sill). Retarget to the structure's anchor
    // tile so the range check, damage, effects, and noise all land correctly.
    let { targetEntity, turret, structure, structureX, structureY } = resolveTileTarget(gameMap, targetX, targetY, player);

    // Redirect melee attack to a closed window if targeting a zombie on the other side
    if (targetEntity && targetEntity.type === EntityType.ZOMBIE) {
        const blockingWin = Pathfinding.getBlockingStructure(gameMap, lx(player), ly(player), targetX, targetY);
        if (blockingWin && blockingWin.type === EntityType.WINDOW && !blockingWin.isOpen && !blockingWin.isBroken) {
            structure = blockingWin;
            structureX = blockingWin.x;
            structureY = blockingWin.y;
            targetEntity = null;
            turret = null;
        }
    }

    if (!targetEntity && !turret && !structure) return { success: false, reason: 'No target here' };

    if (structure) {
        targetX = structureX;
        targetY = structureY;
    }

    const dx = Math.abs(lx(player) - targetX);
    const dy = Math.abs(ly(player) - targetY);
    const defStats = ItemDefs[weapon.defId]?.combat || {};
    const instanceStats = weapon.combat || {};
    const weaponStats = { ...defStats, ...instanceStats };
    const weaponRange = defStats.range || instanceStats.range || 1.0;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance > weaponRange + 0.1) {
        return { success: false, reason: 'Target out of range' };
    }

    // Stun Rod battery charge check and consumption
    let isStunRodActive = false;
    if (weapon && weapon.defId === 'weapon.stun_rod') {
        const battery = typeof weapon.getBattery === 'function' ? weapon.getBattery() : null;
        if (battery && battery.ammoCount > 0) {
            isStunRodActive = true;
            battery.ammoCount = Math.max(0, battery.ammoCount - 1);
            // Trigger inventory changed event so the UI updates
            if (inventoryManager) {
                inventoryManager.emit('inventoryChanged');
            }
        }
    }

    // 1. Calculate Outcome
    const meleeLvl = playerStats.meleeLvl || 1;
    const isWindowTarget = structure && (structure.type === EntityType.WINDOW);
    const { hit, isCrit, damage, extraDamageApplied, stunDuration, dodged } = CombatResolver.rollPlayerMelee({
        weaponStats,
        skillLvl: meleeLvl,
        drunkenness: player.drunkenness || 0,
        isWindowTarget,
        isStunRodActive,
        hasTargetEntity: !!targetEntity,
        currentStrength: player.currentStrength,
        currentAgility: player.currentAgility,
        currentPerception: player.currentPerception,
        defenderType: targetEntity?.type,
        defenderSubtype: targetEntity?.subtype,
        defender: targetEntity
    });
    if (dodged && targetEntity) {
        addLog(`${targetEntity.name || targetEntity.type} dodges your attack!`, 'combat');
    }
    const stunApplied = stunDuration > 0;
    if (stunApplied && targetEntity) {
        targetEntity.stunnedTurns = stunDuration;
    }

    // Note: isKillingBlow is safe because Zombie/NPC takeDamage does not use armor or difficulty reductions
    const isKillingBlow = hit && targetEntity && targetEntity.hp <= damage;

    // 2. Event emission for UI and Audio
    const attackData = {
        weaponId: weapon.defId,
        weaponType: weapon.isRanged ? 'ranged' : 'melee',
        hit,
        isCrit,
        isKillingBlow,
        damage,
        targetX,
        targetY
    };
    GameEvents.emit(GAME_EVENT.PLAYER_ATTACK, attackData);

    if (hit && targetEntity) {
        GameEvents.emit(GAME_EVENT.ZOMBIE_DAMAGE, {
            zombieId: targetEntity.id,
            damage,
            isKillingBlow
        });
    }

    // 3. Apply AP Consumption (Primary state update)
    player.useAP(1);

    let killed = false;

    // 4. Detailed Logic Execution
    if (hit) {
        applyHitProgression(ui, 'melee');
        if (targetEntity) {
            const finalMeleeDamage = CombatResolver.applyArmorAbsorption(targetEntity, damage);
            if (finalMeleeDamage > 0) targetEntity.takeDamage(finalMeleeDamage, player);
            let logMsg = `${isCrit ? 'CRITICAL HIT! ' : ''}Player attacks ${targetEntity.type}: ${damage} damage (${weapon.name})`;
            if (stunApplied) {
                logMsg += ` (Charged Strike! +${extraDamageApplied} damage, Stunned for ${stunDuration} turns!)`;
            }
            addLog(logMsg, 'combat');
            if (targetEntity.type === 'zombie' && targetEntity.subtype === 'acid') triggerAcidEffect(gameMap, targetEntity, false, rawUi);
            if (targetEntity.type === EntityType.NPC) provokeAndWarn(gameMap, targetEntity, addLog);
        } else if (turret) {
            turret.takeDamage(damage);
            addLog(`${isCrit ? 'CRITICAL HIT! ' : ''}You hit the turret: ${damage} damage (${weapon.name})`, 'combat');
            // Attacking a faction's turret provokes that whole faction.
            provokeAndWarn(gameMap, turret, addLog);
        } else if (structure) {
            if (structure.type === 'window') {
                structure.break();
                if (structure.isReinforced) {
                    structure.isReinforced = false;
                    structure.reinforcementHp = 0;
                    structure.dirtyVision();
                    structure.emitEvent('windowReinforcementDestroyed');
                    structure.updateBlocking();
                }
                GameEvents.emit(GAME_EVENT.WINDOW_SMASH, { windowPos: { x: targetX, y: targetY }, source: 'player' });
                addLog(`You smash the window with your ${weapon.name}!`, 'combat');
                if (weapon.instanceId === 'unarmed') {
                    if (typeof player?.setBleeding === 'function') player.setBleeding(true);
                    updatePlayerStats({ isBleeding: true });
                    addLog('You cut your hands smashing the glass!', 'warning');
                }
                gameMap.emitNoise(targetX, targetY, 5);
            } else {
                if (typeof structure.takeDamage === 'function') structure.takeDamage(damage);
                else structure.hp = Math.max(0, (structure.hp || 10) - damage);
                addLog(`You hit the ${structure.type} with your ${weapon.name}!`, 'combat');
                gameMap.emitNoise(targetX, targetY, 3);
            }
        }

        addEffect({
            type: 'damage',
            x: targetX,
            y: targetY,
            value: isCrit ? `CRIT! ${damage}` : damage,
            color: isCrit ? '#facc15' : '#ef4444',
            duration: isCrit ? 1500 : 1200
        });

        if (targetEntity && targetEntity.isDead()) {
            killed = true;
            processEntityKill({
                gameMap, player, entity: targetEntity, lootX: targetX, lootY: targetY,
                lootGenerator, ui: rawUi,
            });
        }

        if (turret && turret.isDead()) {
            addLog('Turret destroyed!', 'combat');
            removeDestroyedTurret(turret, gameMap, targetX, targetY);
            cancelTargeting();
        }
        triggerMapUpdate();
        forceRefresh();
    } else {
        // Miss Logic
        addLog(`Player attacks: miss (${weapon.name})`, 'combat');
        addEffect({ type: 'damage', x: targetX, y: targetY, value: 'Miss', color: '#9ca3af', duration: 1200 });
    }

    // Weapon Degradation
    if (weapon.instanceId !== 'unarmed' && typeof weapon.degrade === 'function' && weapon.isDegradable()) {
        weapon.degrade();
        if (weapon.condition !== null && weapon.condition <= 0) {
            addEffect({ type: 'damage', x: lx(player), y: ly(player), value: 'Broke!', color: '#fbbf24', duration: 1500 });
            destroyItem(weapon.instanceId);
            if (targetingWeapon?.item?.instanceId === weapon.instanceId) cancelTargeting();
            forceRefresh();
        }
    }

    return { success: true, hit, isCrit, damage, killed };
}

/**
 * Player ranged attack against a tile. Handles burst fire, sling ammo, magazine
 * and loose-round consumption, scope / laser sight / suppressor attachments,
 * turrets and breakable structures.
 *
 * @param {object}  o                  see performMeleeAttack; adds:
 * @param {object}  [o.inventoryManager] required for sling (crafting.stone) weapons
 * @returns {{success: boolean, reason?: string, shotsFired?: number, hits?: number,
 *            kills?: number, totalDamage?: number}}
 */
export function performRangedAttack({
    player,
    gameMap,
    weapon,
    targetX,
    targetY,
    playerStats = {},
    inventoryManager = null,
    lootGenerator = null,
    targetingWeapon = null,
    ui: rawUi,
}) {
    const ui = withUi(rawUi);
    const { addLog, addEffect, destroyItem, cancelTargeting, forceRefresh, triggerMapUpdate } = ui;

    if (!player || !gameMap) return { success: false, reason: 'System error' };

    if (weapon && weapon.isDegradable() && weapon.condition !== null && weapon.condition <= 0) {
        addEffect({ type: 'damage', x: lx(player), y: ly(player), value: 'Broke!', color: '#ef4444', duration: 1000 });
        destroyItem(weapon.instanceId);
        cancelTargeting();
        return { success: false, reason: 'Weapon is broken' };
    }

    if (player.ap < 1) return { success: false, reason: 'Not enough AP' };

    const stats = ItemDefs[weapon.defId]?.rangedStats || { damage: { min: 4, max: 10 }, accuracyFalloff: 0.1, minAccuracy: 0.01 };
    const isSling = stats.isSling;
    let ammoFound = false;
    let magazine = null;
    let ammoSlot = null;

    const isBurst = weapon.fireMode === FireMode.BURST;
    const shotCount = isBurst ? 3 : 1;
    let shotsFired = 0;
    let totalDamage = 0;
    let hits = 0;
    let kills = 0;

    // 1. Initial Resource Check for the whole burst (or at least first shot)
    if (isSling) {
        ammoFound = inventoryManager.hasItemByDefId('crafting.stone', 1);
    } else {
        ammoSlot = weapon.attachmentSlots?.find(slot => slot.id === 'ammo' || slot.allowedCategories?.includes(ItemCategory.AMMO));
        magazine = ammoSlot ? weapon.attachments[ammoSlot.id] : null;
        const isMagazine = magazine && magazine.hasTrait?.(ItemTrait.MAGAZINE);
        ammoFound = magazine && (isMagazine ? (magazine.ammoCount > 0) : (magazine.stackCount > 0));
    }

    if (!ammoFound) return { success: false, reason: 'Out of ammo' };

    // Resolve target first so an edge-aligned window/door retargets to its
    // anchor tile before the distance and line-of-sight checks run.
    const { targetEntity, turret, structure, structureX, structureY } = resolveTileTarget(gameMap, targetX, targetY, player);

    if (!targetEntity && !turret && !structure) {
        cancelTargeting();
        return { success: false, reason: 'No target at location' };
    }

    if (structure) {
        targetX = structureX;
        targetY = structureY;
    }

    const distance = Math.sqrt(Math.pow(targetX - lx(player), 2) + Math.pow(targetY - ly(player), 2));
    if (stats.minRange && distance < stats.minRange) return { success: false, reason: 'Target too close' };

    const losResult = LineOfSight.hasLineOfSight(gameMap, lx(player), ly(player), targetX, targetY, { maxRange: 20 });
    if (!losResult.hasLineOfSight) return { success: false, reason: losResult.blockedBy?.message || 'No line of sight' };

    // 2. Event emission for UI and Audio (Emit once per burst for sound sync)
    const attackData = {
        weaponId: weapon.defId,
        weaponType: 'ranged',
        isBurst,
        targetX,
        targetY
    };
    GameEvents.emit(GAME_EVENT.PLAYER_ATTACK, attackData);

    // 3. Apply AP Consumption (1 AP for the whole burst)
    player.useAP(1);

    // 4. Burst Loop
    for (let i = 0; i < shotCount; i++) {
        // Re-check ammo for each shot in burst
        if (isSling) {
            ammoFound = inventoryManager.hasItemByDefId('crafting.stone', 1);
        } else {
            const isMagazine = magazine && magazine.hasTrait?.(ItemTrait.MAGAZINE);
            ammoFound = magazine && (isMagazine ? (magazine.ammoCount > 0) : (magazine.stackCount > 0));
        }

        if (!ammoFound) break; // End burst if out of ammo
        shotsFired++;

        // Resource Consumption
        if (isSling) {
            inventoryManager.consumeItemByDefId('crafting.stone', 1);
        } else {
            const isMagazine = magazine && magazine.hasTrait?.(ItemTrait.MAGAZINE);
            if (isMagazine) magazine.ammoCount--;
            else {
                magazine.stackCount--;
                if (magazine.stackCount <= 0 && ammoSlot) weapon.detachItem(ammoSlot.id);
            }
        }

        // Projectile Path Tracking
        ProjectileManager.processProjectilePath(gameMap, lx(player), ly(player), targetX, targetY);

        // Outcome Calculation
        const rangedLvl = playerStats.rangedLvl || 1;
        const squaresAway = Math.floor(distance);
        const sightSlot = weapon.attachmentSlots?.find(s => s.id === 'sight');
        const hasScope = sightSlot && weapon.attachments[sightSlot.id]?.categories?.includes(ItemCategory.RIFLE_SCOPE);
        const hasLaserSight = sightSlot && weapon.attachments[sightSlot.id]?.categories?.includes(ItemCategory.LASER_SIGHT);

        const isWindowTarget = structure && (structure.type === EntityType.WINDOW);
        const { hit, isCrit, damage, dodged } = CombatResolver.rollPlayerRanged({
            stats,
            skillLvl: rangedLvl,
            drunkenness: player.drunkenness || 0,
            squaresAway,
            isWindowTarget,
            hasScope,
            hasLaserSight,
            currentAgility: player.currentAgility,
            currentPerception: player.currentPerception,
            defenderType: targetEntity?.type,
            defenderSubtype: targetEntity?.subtype,
            defender: targetEntity
        });
        if (dodged && targetEntity) {
            addLog(`${targetEntity.name || targetEntity.type} dodges your attack!`, 'combat');
        }

        // Note: isKillingBlow is safe because Zombie/NPC takeDamage does not use armor or difficulty reductions
        const isKillingBlow = hit && targetEntity && targetEntity.hp <= damage;

        if (hit && targetEntity) {
            GameEvents.emit(GAME_EVENT.ZOMBIE_DAMAGE, {
                zombieId: targetEntity.id,
                damage,
                isKillingBlow
            });
        }

        // Emit Noise
        const barrelSlot = weapon.attachmentSlots?.find(s => s.id === 'barrel');
        const isSuppressed = barrelSlot && weapon.attachments[barrelSlot.id]?.categories?.includes(ItemCategory.SUPPRESSOR);
        const noiseRadius = isSuppressed ? 3 : (stats.noiseRadius || 10);
        if (gameMap.emitNoise) gameMap.emitNoise(lx(player), ly(player), noiseRadius);

        if (hit) {
            hits++;
            totalDamage += damage;
            applyHitProgression(ui, 'ranged');
            if (targetEntity) {
                const finalRangedDamage = CombatResolver.applyArmorAbsorption(targetEntity, damage);
                if (finalRangedDamage > 0) targetEntity.takeDamage(finalRangedDamage, player);
                addLog(`${isCrit ? 'CRITICAL HIT! ' : ''}Player attacks ${targetEntity.type}: ${damage} damage (${weapon.name})`, 'combat');
                if (targetEntity.type === EntityType.ZOMBIE && targetEntity.subtype === 'acid') triggerAcidEffect(gameMap, targetEntity, false, rawUi);
                if (targetEntity.type === EntityType.NPC) provokeAndWarn(gameMap, targetEntity, addLog);
            } else if (turret) {
                turret.takeDamage(damage);
                addLog(`${isCrit ? 'CRITICAL HIT! ' : ''}You hit the turret: ${damage} damage (${weapon.name})`, 'combat');
                // Attacking a faction's turret provokes that whole faction.
                provokeAndWarn(gameMap, turret, addLog);
            } else if (structure) {
                if (structure.type === EntityType.WINDOW) {
                    structure.break();
                    GameEvents.emit(GAME_EVENT.WINDOW_SMASH, { windowPos: { x: targetX, y: targetY }, source: 'player' });
                    addLog('The window shatters!', 'combat');
                    gameMap.emitNoise(targetX, targetY, 5);
                } else {
                    if (typeof structure.takeDamage === 'function') structure.takeDamage(damage);
                    else structure.hp = Math.max(0, (structure.hp || 10) - damage);
                    addLog(`You hit the ${structure.type} with a gunshot!`, 'combat');
                    gameMap.emitNoise(targetX, targetY, 3);
                }
            }

            addEffect({
                type: 'damage',
                x: targetX,
                y: targetY,
                value: isCrit ? `CRIT! ${damage}` : damage,
                color: isCrit ? '#facc15' : '#ef4444',
                duration: isCrit ? 1500 : 1200
            });

            if (targetEntity && targetEntity.isDead()) {
                kills++;
                processEntityKill({
                    gameMap, player, entity: targetEntity, lootX: lx(targetEntity), lootY: ly(targetEntity),
                    lootGenerator, lootToGroundIfOnPlayer: true, ui: rawUi,
                });
                break; // End burst if target dies
            }

            if (turret && turret.isDead()) {
                addLog('Turret destroyed!', 'combat');
                removeDestroyedTurret(turret, gameMap, targetX, targetY);
                cancelTargeting();
                break; // End burst if the turret is destroyed
            }
        } else {
            addLog(`Player attacks: miss (${weapon.name})`, 'combat');
            addEffect({ type: 'damage', x: targetX, y: targetY, value: 'Miss', color: '#9ca3af', duration: 1200 });
        }
    }

    if (typeof weapon.degrade === 'function' && weapon.isDegradable()) {
        weapon.degrade();
        if (weapon.condition !== null && weapon.condition <= 0) {
            addEffect({ type: 'damage', x: lx(player), y: ly(player), value: 'Broke!', color: '#fbbf24', duration: 1500 });
            destroyItem(weapon.instanceId);
            if (targetingWeapon?.item?.instanceId === weapon.instanceId) cancelTargeting();
        }
    }

    forceRefresh();
    triggerMapUpdate();
    return { success: true, shotsFired, hits, kills, totalDamage };
}

export const PlayerCombatSystem = {
    performMeleeAttack,
    performRangedAttack,
    processEntityKill,
    triggerAcidEffect,
    resolveTileTarget,
    provokeAndWarn,
    isWindowTile,
};

export default PlayerCombatSystem;
