import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { usePlayer } from './PlayerContext.jsx';
import { useGameMap } from './GameMapContext.jsx';
import { useVisualEffects } from './VisualEffectsContext.jsx';
import { useGame } from './GameContext.jsx';
import { useInventory } from './InventoryContext.jsx';
import { useLog } from './LogContext.jsx';
import { useAudio } from './AudioContext.jsx';
import { ItemDefs, createItemFromDef } from '../game/inventory/ItemDefs.js';
import GameEvents, { GAME_EVENT } from '../game/utils/GameEvents.js';

import { ItemCategory, ItemTrait, FireMode } from '../game/inventory/traits.js';
import { LineOfSight } from '../game/utils/LineOfSight.js';
import { findEdgeStructure } from '../game/utils/EdgeStructure.js';
import { ProjectileManager } from '../game/utils/ProjectileManager.js';
import { EntityType } from '../game/entities/Entity.js';
import { getAttackableTurretOnTile, removeDestroyedTurret, escalateFactionAgainstPlayer } from '../game/ai/TurretCombat.js';
import engine from '../game/GameEngine.js';
import { IntentQueue } from '../game/managers/IntentQueue.js';
import { ExplosionIntent } from '../game/components/ExplosionIntent.js';
import { CombatResolver } from '../game/systems/CombatResolver.js';

const isWindowTile = (gameMap, x, y) => {
    const tile = gameMap?.getTile(x, y);
    return !!(tile && tile.contents.some(e => e.type === EntityType.WINDOW));
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
const resolveTileTarget = (gameMap, x, y, player, { includeTurret = true } = {}) => {
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

// Every zombie kill awards the player a single Earbuck.
const awardZombieEarbuck = () => {
    if (engine.player) {
        engine.player.earbucks = (engine.player.earbucks || 0) + 1;
    }
};

// RNG NOTE: player combat deliberately uses Math.random(), NOT the engine's
// seeded gameRandom. gameRandom must stay in lockstep across save/load for AI
// determinism; player actions fire in unpredictable order and count, so routing
// their hit/crit/damage rolls through gameRandom would desync that stream for the
// simulation/AI side. Keep the player-driven rolls below on Math.random — do NOT
// "fix" them to gameRandom.
const CombatContext = createContext();

export const useCombat = () => {
    const context = useContext(CombatContext);
    if (!context) {
        throw new Error('useCombat must be used within a CombatProvider');
    }
    return context;
};

export const CombatProvider = ({ children }) => {
    const [targetingWeapon, setTargetingWeapon] = useState(null); // { item, slot }
    const { playerRef, updatePlayerStats, playerStats, recordKill } = usePlayer();
    const { gameMapRef, lootGenerator, triggerMapUpdate } = useGameMap();
    const { addEffect } = useVisualEffects();
    const { forceRefresh, inventoryRef, destroyItem } = useInventory();
    const { addLog } = useLog();
    const { playSound } = useAudio();

    const toggleTargeting = useCallback((weapon, slot) => {
        setTargetingWeapon(prev => {
            if (prev && prev.item.instanceId === weapon.instanceId) {
                return null;
            }
            return { item: weapon, slot };
        });
    }, []);

    const cancelTargeting = useCallback(() => {
        setTargetingWeapon(null);
    }, []);

    const triggerAcidEffect = useCallback((zombie, isDeath) => {
        const gameMap = gameMapRef.current;
        if (!gameMap || zombie.subtype !== 'acid') return;

        const radius = 1.4;
        // Re-read: "When an acid zombie is attacked (and HIT), any entity within 1.4 squares takes 1-3 damage."
        // "When an acid zombie is killed, it explodes doing 2-5 damage"
        const dMin = isDeath ? 2 : 1;
        const dMax = isDeath ? 5 : 3;
        const color = '#86efac'; // light green

        console.log(`[Combat] Acid ${isDeath ? 'EXPLOSION' : 'SPLASH'} from zombie ${zombie.id} at (${zombie.x}, ${zombie.y})`);

        // 1. Visual Flashes
        for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
                const tx = zombie.x + dx;
                const ty = zombie.y + dy;
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
            
            const dist = Math.sqrt(Math.pow(entity.x - zombie.x, 2) + Math.pow(entity.y - zombie.y, 2));
            if (dist <= radius) {
                if (entity.type === EntityType.PLAYER || entity.type === EntityType.ZOMBIE) {
                    const damage = Math.floor(Math.random() * (dMax - dMin + 1)) + dMin;
                    
                    if (typeof entity.takeDamage === 'function') {
                        entity.takeDamage(damage, { id: zombie.id, type: EntityType.ZOMBIE, subtype: 'acid' });
                        
                        addEffect({
                            type: 'damage',
                            x: entity.x,
                            y: entity.y,
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
    }, [gameMapRef, addEffect, addLog, triggerMapUpdate, forceRefresh]);

    // Shared kill handling for direct player attacks (melee / ranged / thrown stone).
    // Handles the kill log, skill XP, faction-specific drops and the Earbuck award.
    // Per-site quirks are passed as flags so behavior stays byte-for-byte identical:
    //  - logLevelUp:           melee/ranged announce skill level-ups; stone does not.
    //  - lootToGroundIfOnPlayer: ranged drops loot into the ground container when the
    //                            target dies on the player's own tile (melee/stone don't).
    //  - clearNpcInventory:    melee/ranged clear the looted NPC inventory; stone doesn't.
    //  - cancelOnKill:         melee/ranged cancel targeting on kill; stone doesn't.
    const processEntityKill = useCallback((entity, lootX, lootY, {
        killType,
        logLevelUp = true,
        lootToGroundIfOnPlayer = false,
        clearNpcInventory = true,
        cancelOnKill = true,
    }) => {
        const gameMap = gameMapRef.current;
        const player = playerRef.current;

        addLog(`${entity.type.charAt(0).toUpperCase() + entity.type.slice(1)} killed!`, 'combat');
        const newLevel = recordKill(killType);
        if (logLevelUp && newLevel) {
            addLog(`LEVEL UP! ${killType.charAt(0).toUpperCase() + killType.slice(1)} skill is now level ${newLevel}!`, 'warning');
        }

        // Place dropped items either on the ground container (ranged-on-player-tile) or the map tile.
        const placeItems = (items) => {
            if (!items || items.length === 0) return;
            if (lootToGroundIfOnPlayer && player && entity.x === player.x && entity.y === player.y && engine.inventoryManager) {
                items.forEach(it => engine.inventoryManager.groundContainer.addItem(it, null, null, true));
                engine.inventoryManager.groundManager.updateCategoryAreas();
                engine.inventoryManager.emit('inventoryChanged');
            } else {
                gameMap.addItemsToTile(lootX, lootY, items);
            }
        };

        if (entity.type === EntityType.ZOMBIE) {
            if (entity.subtype === 'acid') triggerAcidEffect(entity, true);
            if (lootGenerator && !entity.noLoot && !isWindowTile(gameMap, lootX, lootY) && Math.random() < 0.75) {
                const loot = lootGenerator.generateZombieLoot(entity.subtype, gameMap.mapNumber);
                if (loot?.length > 0) placeItems(loot);
            }
            awardZombieEarbuck();
        } else if (entity.type === EntityType.NPC) {
            // NPCs drop their entire inventory on death
            if (typeof entity.die === 'function') entity.die(); // Emits npcDied event
            const items = entity.inventory.getAllItems();
            if (items.length > 0) {
                placeItems(items);
                if (clearNpcInventory) entity.inventory.clear();
            }
        } else if (entity.type === EntityType.RABBIT) {
            const meat = createItemFromDef('food.raw_meat');
            if (meat) placeItems([meat]);
        }

        gameMap.removeEntity(entity.id);
        if (cancelOnKill) cancelTargeting();
    }, [gameMapRef, playerRef, addLog, recordKill, lootGenerator, triggerAcidEffect, cancelTargeting]);

    // Shared playback for the action queue produced by an ExplosionIntent (grenades / molotovs).
    // The two callers differ only in the death-effect color and the structure-break source tag.
    const processExplosionActions = useCallback((actionQueue, { deathColor, source }) => {
        actionQueue.forEach(action => {
            if (action.type === 'TILE_FLASH') {
                addEffect({ type: 'tile_flash', x: action.data.x, y: action.data.y, color: action.data.color, duration: action.data.duration });
            } else if (action.type === 'DAMAGE_EFFECT') {
                addEffect({ type: 'damage', x: action.data.x, y: action.data.y, value: action.data.damage, color: action.data.color, duration: 1500 });
                addLog(action.data.log, 'combat');
            } else if (action.type === 'EXPLOSION_LOG') {
                addLog(action.data.log, 'combat');
            } else if (action.type === 'DEATH') {
                addEffect({ type: 'damage', x: action.data.x, y: action.data.y, value: 'Killed', color: deathColor, duration: 1500 });
                if (action.data.entityType === EntityType.ZOMBIE) awardZombieEarbuck();
            } else if (action.type === 'STRUCTURE_INTERACT') {
                if (action.data.broken) {
                    GameEvents.emit(action.data.targetType === 'window' ? GAME_EVENT.WINDOW_SMASH : GAME_EVENT.DOOR_BROKEN, {
                        windowPos: action.data.targetType === 'window' ? action.data.to : undefined,
                        doorPos: action.data.targetType === 'door' ? action.data.to : undefined,
                        source
                    });
                }
            } else if (action.type === 'SOUND') {
                if (action.metadata?.sound) playSound(action.metadata.sound, action.metadata.audioOptions);
            }
        });
    }, [addEffect, addLog, playSound]);

    const performMeleeAttack = useCallback((weapon, targetX, targetY) => {
        const player = playerRef.current;
        const gameMap = gameMapRef.current;
        if (!player || !gameMap) return { success: false, reason: 'System error' };

        // Guard: Prevent attack with broken weapon
        if (weapon && weapon.instanceId !== 'unarmed' && weapon.condition !== null && weapon.condition <= 0) {
            console.warn(`[Combat] Blocked attack with broken weapon: ${weapon.name}`);
            addEffect({
                type: 'damage',
                x: player.x,
                y: player.y,
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
        const { targetEntity, turret, structure, structureX, structureY } = resolveTileTarget(gameMap, targetX, targetY, player);

        if (!targetEntity && !turret && !structure) return { success: false, reason: 'No target here' };

        if (structure) {
            targetX = structureX;
            targetY = structureY;
        }

        const dx = Math.abs(player.x - targetX);
        const dy = Math.abs(player.y - targetY);
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
                if (inventoryRef.current) {
                    inventoryRef.current.emit('inventoryChanged');
                }
            }
        }

        // 1. Calculate Outcome
        const meleeLvl = playerStats.meleeLvl || 1;
        const isWindowTarget = structure && (structure.type === EntityType.WINDOW);
        const { hit, isCrit, damage, extraDamageApplied, stunDuration, dodged, defenseApSpent } = CombatResolver.rollPlayerMelee({
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
        // Player-attacking is fully synchronous (no deferred playback), so the
        // defender's active-defense AP cost applies immediately.
        if (defenseApSpent > 0 && targetEntity && typeof targetEntity.useAP === 'function') {
            targetEntity.useAP(defenseApSpent);
        }
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

        // 4. Detailed Logic Execution
        if (hit) {
            if (targetEntity) {
                const finalMeleeDamage = CombatResolver.applyArmorAbsorption(targetEntity, damage);
                if (finalMeleeDamage > 0) targetEntity.takeDamage(finalMeleeDamage);
                let logMsg = `${isCrit ? 'CRITICAL HIT! ' : ''}Player attacks ${targetEntity.type}: ${damage} damage (${weapon.name})`;
                if (stunApplied) {
                    logMsg += ` (Charged Strike! +${extraDamageApplied} damage, Stunned for ${stunDuration} turns!)`;
                }
                addLog(logMsg, 'combat');
                if (targetEntity.type === 'zombie' && targetEntity.subtype === 'acid') triggerAcidEffect(targetEntity, false);
                if (targetEntity.type === EntityType.NPC && (targetEntity.isShopkeeper || targetEntity.isTollGuard || targetEntity.getFaction?.() === 'town')) {
                    const escalated = escalateFactionAgainstPlayer(gameMap, 'town');
                    if (escalated > 0) addLog('The town turrets turn on you!', 'warning');
                }
            } else if (turret) {
                turret.takeDamage(damage);
                addLog(`${isCrit ? 'CRITICAL HIT! ' : ''}You hit the turret: ${damage} damage (${weapon.name})`, 'combat');
                // Attacking a faction's turret provokes that whole faction.
                const escalated = escalateFactionAgainstPlayer(gameMap, turret.getFaction?.());
                if (escalated > 0) addLog('The turrets turn on you!', 'warning');
            } else if (structure) {
                if (structure.type === 'window') {
                    structure.break();
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
                processEntityKill(targetEntity, targetX, targetY, { killType: 'melee' });
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
                addEffect({ type: 'damage', x: player.x, y: player.y, value: 'Broke!', color: '#fbbf24', duration: 1500 });
                destroyItem(weapon.instanceId);
                if (targetingWeapon?.item?.instanceId === weapon.instanceId) cancelTargeting();
                forceRefresh();
            }
        }

        return { success: true };
    }, [playerRef, gameMapRef, addEffect, forceRefresh, cancelTargeting, triggerMapUpdate, inventoryRef, targetingWeapon, triggerAcidEffect, updatePlayerStats, playerStats, destroyItem, processEntityKill]);

    const performRangedAttack = useCallback((weapon, targetX, targetY) => {
        const player = playerRef.current;
        const gameMap = gameMapRef.current;
        if (!player || !gameMap) return { success: false, reason: 'System error' };

        if (weapon && weapon.isDegradable() && weapon.condition !== null && weapon.condition <= 0) {
            addEffect({ type: 'damage', x: player.x, y: player.y, value: 'Broke!', color: '#ef4444', duration: 1000 });
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
            ammoFound = inventoryRef.current.hasItemByDefId('crafting.stone', 1);
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

        const distance = Math.sqrt(Math.pow(targetX - player.x, 2) + Math.pow(targetY - player.y, 2));
        if (stats.minRange && distance < stats.minRange) return { success: false, reason: 'Target too close' };

        const losResult = LineOfSight.hasLineOfSight(gameMap, player.x, player.y, targetX, targetY, { maxRange: 20 });
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
                ammoFound = inventoryRef.current.hasItemByDefId('crafting.stone', 1);
            } else {
                const isMagazine = magazine && magazine.hasTrait?.(ItemTrait.MAGAZINE);
                ammoFound = magazine && (isMagazine ? (magazine.ammoCount > 0) : (magazine.stackCount > 0));
            }

            if (!ammoFound) break; // End burst if out of ammo
            shotsFired++;

            // Resource Consumption
            if (isSling) {
                inventoryRef.current.consumeItemByDefId('crafting.stone', 1);
            } else {
                const isMagazine = magazine && magazine.hasTrait?.(ItemTrait.MAGAZINE);
                if (isMagazine) magazine.ammoCount--;
                else {
                    magazine.stackCount--;
                    if (magazine.stackCount <= 0 && ammoSlot) weapon.detachItem(ammoSlot.id);
                }
            }

            // Projectile Path Tracking
            ProjectileManager.processProjectilePath(gameMap, player.x, player.y, targetX, targetY);

            // Outcome Calculation
            const rangedLvl = playerStats.rangedLvl || 1;
            const squaresAway = Math.floor(distance);
            const sightSlot = weapon.attachmentSlots?.find(s => s.id === 'sight');
            const hasScope = sightSlot && weapon.attachments[sightSlot.id]?.categories?.includes(ItemCategory.RIFLE_SCOPE);
            const hasLaserSight = sightSlot && weapon.attachments[sightSlot.id]?.categories?.includes(ItemCategory.LASER_SIGHT);

            const isWindowTarget = structure && (structure.type === EntityType.WINDOW);
            const { hit, isCrit, damage, dodged, defenseApSpent } = CombatResolver.rollPlayerRanged({
                stats,
                skillLvl: rangedLvl,
                drunkenness: player.drunkenness || 0,
                squaresAway,
                isWindowTarget,
                hasScope,
                hasLaserSight,
                currentPerception: player.currentPerception,
                defenderType: targetEntity?.type,
                defenderSubtype: targetEntity?.subtype,
                defender: targetEntity
            });
            // Player-attacking is fully synchronous (no deferred playback), so the
            // defender's active-defense AP cost applies immediately.
            if (defenseApSpent > 0 && targetEntity && typeof targetEntity.useAP === 'function') {
                targetEntity.useAP(defenseApSpent);
            }
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
            if (gameMap.emitNoise) gameMap.emitNoise(player.x, player.y, noiseRadius);

            if (hit) {
                hits++;
                totalDamage += damage;
                if (targetEntity) {
                    const finalRangedDamage = CombatResolver.applyArmorAbsorption(targetEntity, damage);
                    if (finalRangedDamage > 0) targetEntity.takeDamage(finalRangedDamage);
                    addLog(`${isCrit ? 'CRITICAL HIT! ' : ''}Player attacks ${targetEntity.type}: ${damage} damage (${weapon.name})`, 'combat');
                    if (targetEntity.type === EntityType.ZOMBIE && targetEntity.subtype === 'acid') triggerAcidEffect(targetEntity, false);
                    if (targetEntity.type === EntityType.NPC && (targetEntity.isShopkeeper || targetEntity.isTollGuard || targetEntity.getFaction?.() === 'town')) {
                        const escalated = escalateFactionAgainstPlayer(gameMap, 'town');
                        if (escalated > 0) addLog('The town turrets turn on you!', 'warning');
                    }
                } else if (turret) {
                    turret.takeDamage(damage);
                    addLog(`${isCrit ? 'CRITICAL HIT! ' : ''}You hit the turret: ${damage} damage (${weapon.name})`, 'combat');
                    // Attacking a faction's turret provokes that whole faction.
                    const escalated = escalateFactionAgainstPlayer(gameMap, turret.getFaction?.());
                    if (escalated > 0) addLog('The turrets turn on you!', 'warning');
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
                    processEntityKill(targetEntity, targetEntity.x, targetEntity.y, { killType: 'ranged', lootToGroundIfOnPlayer: true });
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
                addEffect({ type: 'damage', x: player.x, y: player.y, value: 'Broke!', color: '#fbbf24', duration: 1500 });
                destroyItem(weapon.instanceId);
                if (targetingWeapon?.item?.instanceId === weapon.instanceId) cancelTargeting();
            }
        }

        forceRefresh();
        triggerMapUpdate();
        return { success: true };
    }, [playerRef, gameMapRef, addEffect, forceRefresh, cancelTargeting, triggerMapUpdate, inventoryRef, targetingWeapon, triggerAcidEffect, playerStats, destroyItem, processEntityKill]);

    const performGrenadeThrow = useCallback((item, targetX, targetY) => {
        const player = playerRef.current;
        const gameMap = gameMapRef.current;
        if (!player || !gameMap) return { success: false, reason: 'System error' };

        // 1. Check AP
        if (player.ap < 1) {
            return { success: false, reason: 'Not enough AP' };
        }

        // 2. Range Check (Matches Sight Range)
        const distance = Math.sqrt(Math.pow(targetX - player.x, 2) + Math.pow(targetY - player.y, 2));
        const maxRange = (engine._fovOptions?.maxRange || 15) + 0.5;
        if (distance > maxRange) {
            return { success: false, reason: `Target out of range (max ${Math.floor(maxRange)})` };
        }

        // 3. Line of Sight Check
        const losResult = LineOfSight.hasLineOfSight(gameMap, player.x, player.y, targetX, targetY, {
            maxRange: 20 // Ensure LOS check doesn't throttle the throw range
        });
        if (!losResult.hasLineOfSight) {
            return { success: false, reason: losResult.blockedBy?.message || 'No line of sight' };
        }

        // 4. Execution
        console.log(`[Combat] Throwing grenade at (${targetX}, ${targetY})`);
        player.useAP(1);

        // Consume 1 grenade
        if (item.stackCount > 1) {
            item.stackCount--;
        } else {
            destroyItem(item.instanceId);
        }

        // 5. ECS Explosion Logic via IntentQueue
        const intentQueue = new IntentQueue();
        const actionQueue = [];

        intentQueue.enqueue(null, 'ExplosionIntent', new ExplosionIntent({
            targetX,
            targetY,
            radius: 2,
            minDamage: 10,
            maxDamage: 30,
            isIncendiary: false,
            sourceEntityId: player.id
        }));

        const ecsEntities = [player, ...Array.from(gameMap.entityMap.values())];
        intentQueue.resolve(ecsEntities, engine.worldManager, engine, actionQueue);

        // 6. Process actions generated by ExplosionSystem
        processExplosionActions(actionQueue, { deathColor: '#ef4444', source: 'grenade' });

        triggerMapUpdate();
        forceRefresh();
        return { success: true };
    }, [playerRef, gameMapRef, triggerMapUpdate, forceRefresh, destroyItem, processExplosionActions]);
    
    const performStoneThrow = useCallback((item, targetX, targetY) => {
        const player = playerRef.current;
        const gameMap = gameMapRef.current;
        if (!player || !gameMap) return { success: false, reason: 'System error' };

        // 1. Check AP
        if (player.ap < 1) {
            return { success: false, reason: 'Not enough AP' };
        }

        // Resolve target first so an edge-aligned window/door retargets to its
        // anchor tile before the range and line-of-sight checks run.
        const { targetEntity, turret, structure, structureX, structureY } = resolveTileTarget(gameMap, targetX, targetY, player, { includeTurret: false });

        if (!targetEntity && !turret && !structure) {
            return { success: false, reason: 'No target at location' };
        }

        if (structure) {
            targetX = structureX;
            targetY = structureY;
        }

        // 2. Range Check (Matches Sight Range)
        const distance = Math.sqrt(Math.pow(targetX - player.x, 2) + Math.pow(targetY - player.y, 2));
        const maxRange = (engine._fovOptions?.maxRange || 15) + 0.5;
        if (distance > maxRange) {
            return { success: false, reason: `Target out of range (max ${Math.floor(maxRange)})` };
        }

        // 3. Line of Sight Check
        const losResult = LineOfSight.hasLineOfSight(gameMap, player.x, player.y, targetX, targetY, {
            maxRange: 20
        });
        if (!losResult.hasLineOfSight) {
            return { success: false, reason: losResult.blockedBy?.message || 'No line of sight' };
        }

        // 4. Execution
        console.log(`[Combat] Throwing stone at (${targetX}, ${targetY})`);
        player.useAP(1);

        // Consume 1 stone
        if (item.stackCount > 1) {
            item.stackCount--;
        } else {
            destroyItem(item.instanceId);
        }

        // 5. Accuracy Calculation (Sling accuracy)
        // baseHitChance = Math.max(0, 0.9 - (squaresAway - 2) * 0.1)
        const rangedLvl = playerStats.rangedLvl || 1;
        const accuracyBonus = (rangedLvl - (player.drunkenness || 0)) * 0.01;
        const squaresAway = Math.floor(distance);
        const baseHitChance = Math.max(0, 0.9 - (squaresAway - 2) * 0.1);
        const isWindowTarget = structure && (structure.type === EntityType.WINDOW);
        const hit = isWindowTarget ? true : Math.random() <= (baseHitChance + accuracyBonus);

        // 6. Projectile Path Tracking
        ProjectileManager.processProjectilePath(gameMap, player.x, player.y, targetX, targetY);

        if (hit) {
            const damage = Math.floor(Math.random() * 4) + 1; // 1-4 damage
            const isKillingBlow = targetEntity && targetEntity.hp <= damage;

            // Emit attack event for audio/visuals (using 'melee' type for hit/miss sounds)
            GameEvents.emit(GAME_EVENT.PLAYER_ATTACK, {
                weaponId: 'crafting.stone',
                weaponType: 'melee',
                hit: true,
                isKillingBlow,
                damage,
                targetX,
                targetY
            });

            if (targetEntity) {
                if (targetEntity.type === EntityType.ZOMBIE) {
                    GameEvents.emit(GAME_EVENT.ZOMBIE_DAMAGE, { 
                        zombieId: targetEntity.id, 
                        damage, 
                        isKillingBlow 
                    });
                }
                
                targetEntity.takeDamage(damage, { id: 'thrown_stone', type: 'weapon' });
                addLog(`Player throws stone: ${damage} damage`, 'combat');

                // Attacking a town shopkeeper or gatekeeper provokes the town's turrets.
                if (targetEntity.type === EntityType.NPC && (targetEntity.isShopkeeper || targetEntity.isTollGuard || targetEntity.getFaction?.() === 'town')) {
                    const escalated = escalateFactionAgainstPlayer(gameMap, 'town');
                    if (escalated > 0) addLog('The town turrets turn on you!', 'warning');
                }

                addEffect({
                    type: 'damage',
                    x: targetX,
                    y: targetY,
                    value: damage,
                    color: '#ef4444',
                    duration: 1200
                });

                if (targetEntity.isDead()) {
                    processEntityKill(targetEntity, targetX, targetY, {
                        killType: 'ranged',
                        logLevelUp: false,
                        clearNpcInventory: false,
                        cancelOnKill: false,
                    });
                }
            } else if (turret) {
                turret.takeDamage(damage);
                addLog(`You hit the turret with a stone: ${damage} damage`, 'combat');
                // Attacking a faction's turret provokes that whole faction.
                const escalated = escalateFactionAgainstPlayer(gameMap, turret.getFaction?.());
                if (escalated > 0) addLog('The turrets turn on you!', 'warning');

                addEffect({ type: 'damage', x: targetX, y: targetY, value: damage, color: '#ef4444', duration: 1200 });

                if (turret.isDead()) {
                    addLog('Turret destroyed!', 'combat');
                    removeDestroyedTurret(turret, gameMap, targetX, targetY);
                }
            } else if (structure) {
                if (structure.type === EntityType.WINDOW) {
                    structure.break();
                    GameEvents.emit(GAME_EVENT.WINDOW_SMASH, { windowPos: { x: targetX, y: targetY }, source: 'player' });
                    addLog('The window shatters!', 'combat');
                } else {
                    if (typeof structure.takeDamage === 'function') structure.takeDamage(damage);
                    GameEvents.emit(GAME_EVENT.STRUCTURE_INTERACT, { x: targetX, y: targetY });
                    addLog(`The stone hits the ${structure.type}!`, 'combat');
                }
            }
        } else {
            // Emit attack event for audio (miss sound)
            GameEvents.emit(GAME_EVENT.PLAYER_ATTACK, {
                weaponId: 'crafting.stone',
                weaponType: 'melee',
                hit: false,
                targetX,
                targetY
            });
            addLog('The stone misses the target.', 'combat');
            addEffect({ type: 'damage', x: targetX, y: targetY, value: 'Miss', color: '#9ca3af', duration: 1200 });
        }

        // Thrown stones are always recoverable: drop one on the target tile for
        // every outcome — hitting an entity/turret/structure OR missing. Previously
        // only entity and turret hits dropped a stone, silently losing it on
        // structure hits and misses.
        const droppedStone = createItemFromDef('crafting.stone');
        if (droppedStone) {
            gameMap.addItemsToTile(targetX, targetY, [droppedStone]);
        }

        // Noise
        gameMap.emitNoise(targetX, targetY, 3);
        gameMap.emitNoise(player.x, player.y, 1);

        triggerMapUpdate();
        forceRefresh();
        return { success: true };
    }, [playerRef, gameMapRef, addEffect, addLog, triggerMapUpdate, forceRefresh, destroyItem, playerStats, processEntityKill]);

    const performMolotovThrow = useCallback((item, targetX, targetY) => {
        const player = playerRef.current;
        const gameMap = gameMapRef.current;
        if (!player || !gameMap) return { success: false, reason: 'System error' };

        // 1. Check AP
        if (player.ap < 1) {
            return { success: false, reason: 'Not enough AP' };
        }

        // 2. Lighter / Matches Check & Charge consumption
        const inventoryManager = inventoryRef.current;
        if (!inventoryManager) return { success: false, reason: 'System error' };

        const availableIgniters = [];

        // Check containers
        for (const container of inventoryManager.containers.values()) {
            for (const it of container.items.values()) {
                if (it.defId === 'tool.lighter' || it.defId === 'tool.matchbook') {
                    if ((it.ammoCount || 0) > 0) {
                        availableIgniters.push({ item: it, container });
                    }
                }
            }
        }

        // Check equipment
        for (const slot in inventoryManager.equipment) {
            const it = inventoryManager.equipment[slot];
            if (it && (it.defId === 'tool.lighter' || it.defId === 'tool.matchbook')) {
                if ((it.ammoCount || 0) > 0) {
                    availableIgniters.push({ item: it, container: null });
                }
            }
        }

        if (availableIgniters.length === 0) {
            return { success: false, reason: 'Requires matches or lighter' };
        }

        // 3. Range Check (Matches Sight Range)
        const distance = Math.sqrt(Math.pow(targetX - player.x, 2) + Math.pow(targetY - player.y, 2));
        const maxRange = (engine._fovOptions?.maxRange || 15) + 0.5;
        if (distance > maxRange) {
            return { success: false, reason: `Target out of range (max ${Math.floor(maxRange)})` };
        }

        // 4. Line of Sight Check
        const losResult = LineOfSight.hasLineOfSight(gameMap, player.x, player.y, targetX, targetY, {
            maxRange: 20
        });
        if (!losResult.hasLineOfSight) {
            return { success: false, reason: losResult.blockedBy?.message || 'No line of sight' };
        }

        // 5. AP and Igniter consumption execution
        player.useAP(1);

        availableIgniters.sort((a, b) => (a.item.ammoCount || 0) - (b.item.ammoCount || 0));
        const selectedIgniter = availableIgniters[0].item;
        const igniterContainer = availableIgniters[0].container;

        selectedIgniter.consumeCharge(1);
        if ((selectedIgniter.ammoCount || 0) <= 0 && selectedIgniter.defId === 'tool.matchbook') {
            if (igniterContainer) {
                igniterContainer.removeItem(selectedIgniter.instanceId);
            } else {
                destroyItem(selectedIgniter.instanceId);
            }
            selectedIgniter.stackCount = 0;
            addLog('The matchbook is empty and discarded.', 'warning');
        }

        // Consume 1 Molotov
        if (item.stackCount > 1) {
            item.stackCount--;
        } else {
            destroyItem(item.instanceId);
        }

        // 6. ECS Explosion Logic via IntentQueue
        const intentQueue = new IntentQueue();
        const actionQueue = [];

        intentQueue.enqueue(null, 'ExplosionIntent', new ExplosionIntent({
            targetX,
            targetY,
            radius: 1.45,
            minDamage: 2,
            maxDamage: 7,
            isIncendiary: true,
            sourceEntityId: player.id
        }));

        const ecsEntities = [player, ...Array.from(gameMap.entityMap.values())];
        intentQueue.resolve(ecsEntities, engine.worldManager, engine, actionQueue);

        // 7. Process actions generated by ExplosionSystem
        processExplosionActions(actionQueue, { deathColor: '#f97316', source: 'molotov' });

        triggerMapUpdate();
        forceRefresh();
        return { success: true };
    }, [playerRef, gameMapRef, forceRefresh, triggerMapUpdate, inventoryRef, destroyItem, addLog, processExplosionActions]);

    useEffect(() => {
        const handleShutdown = () => {
            setTargetingWeapon(null);
        };
        window.addEventListener('game-shutdown', handleShutdown);
        return () => window.removeEventListener('game-shutdown', handleShutdown);
    }, []);

    return (
        <CombatContext.Provider value={{
            targetingWeapon,
            toggleTargeting,
            cancelTargeting,
            performMeleeAttack,
            performRangedAttack,
            performGrenadeThrow,
            performStoneThrow,
            performMolotovThrow
        }}>
            {children}
        </CombatContext.Provider>
    );
};
