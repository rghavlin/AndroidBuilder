import React, { createContext, useContext, useState, useCallback } from 'react';
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
import { ProjectileManager } from '../game/utils/ProjectileManager.js';
import { EntityType } from '../game/entities/Entity.js';
import { getAttackableTurretOnTile, removeDestroyedTurret, escalateTurretsAgainstPlayer } from '../game/ai/TurretCombat.js';
import engine from '../game/GameEngine.js';
import { IntentQueue } from '../game/managers/IntentQueue.js';
import { ExplosionIntent } from '../game/components/ExplosionIntent.js';

const isWindowTile = (gameMap, x, y) => {
    const tile = gameMap?.getTile(x, y);
    return !!(tile && tile.contents.some(e => e.type === EntityType.WINDOW));
};

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

        const tile = gameMap.getTile(targetX, targetY);
        const targetEntity = tile?.contents.find(e => e.type === EntityType.ZOMBIE || e.type === EntityType.RABBIT || e.type === EntityType.NPC);
        const turret = !targetEntity ? getAttackableTurretOnTile(tile, player) : null;
        const structure = (!targetEntity && !turret) ? tile?.contents.find(e => e.type === EntityType.WINDOW || e.type === EntityType.DOOR) : null;

        if (!targetEntity && !turret && !structure) return { success: false, reason: 'No target here' };

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
        const accuracyBonus = (meleeLvl - (player.drunkenness || 0)) * 0.01;
        const isWindowTarget = structure && (structure.type === EntityType.WINDOW);
        const hit = isWindowTarget ? true : Math.random() <= (weaponStats.hitChance + accuracyBonus);
        
        const critChance = 0.05 + (meleeLvl - 1) * 0.05;
        const isCrit = hit && Math.random() <= critChance;
        
        let baseDamage = isCrit 
            ? Math.floor(weaponStats.damage.max * 1.5)
            : (hit ? Math.floor(Math.random() * (weaponStats.damage.max - weaponStats.damage.min + 1)) + weaponStats.damage.min : 0);

        let damage = baseDamage;
        if (hit && player.drunkenness > 0) {
            damage += player.drunkenness;
        }
        let extraDamageApplied = 0;
        let stunApplied = false;
        let stunDuration = 0;

        if (hit && isStunRodActive && targetEntity) {
            extraDamageApplied = Math.floor(Math.random() * 5) + 1;
            damage += extraDamageApplied;
            stunDuration = Math.floor(Math.random() * 3) + 1;
            targetEntity.stunnedTurns = stunDuration;
            stunApplied = true;
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
                targetEntity.takeDamage(damage);
                let logMsg = `${isCrit ? 'CRITICAL HIT! ' : ''}Player attacks ${targetEntity.type}: ${damage} damage (${weapon.name})`;
                if (stunApplied) {
                    logMsg += ` (Charged Strike! +${extraDamageApplied} damage, Stunned for ${stunDuration} turns!)`;
                }
                addLog(logMsg, 'combat');
                if (targetEntity.type === 'zombie' && targetEntity.subtype === 'acid') triggerAcidEffect(targetEntity, false);
                if (targetEntity.type === EntityType.NPC && targetEntity.isShopkeeper) {
                    const escalated = escalateTurretsAgainstPlayer(gameMap, 'town');
                    if (escalated > 0) addLog('The town turrets turn on you!', 'warning');
                }
            } else if (turret) {
                turret.takeDamage(damage);
                addLog(`${isCrit ? 'CRITICAL HIT! ' : ''}You hit the turret: ${damage} damage (${weapon.name})`, 'combat');
                // Attacking a faction's turret provokes that whole faction.
                const escalated = escalateTurretsAgainstPlayer(gameMap, turret.getFaction?.());
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
                addLog(`${targetEntity.type.charAt(0).toUpperCase() + targetEntity.type.slice(1)} killed!`, 'combat');
                const newLevel = recordKill('melee');
                if (newLevel) {
                    addLog(`LEVEL UP! Melee skill is now level ${newLevel}!`, 'warning');
                }
                
                if (targetEntity.type === EntityType.ZOMBIE) {
                    if (targetEntity.subtype === 'acid') triggerAcidEffect(targetEntity, true);
                    if (lootGenerator && !isWindowTile(gameMap, targetX, targetY) && Math.random() < 0.75) {
                        const loot = lootGenerator.generateZombieLoot(targetEntity.subtype, gameMap.mapNumber);
                        if (loot?.length > 0) gameMap.addItemsToTile(targetX, targetY, loot);
                    }
                    // Award 1 Earbuck per zombie kill
                    if (engine.player) {
                        engine.player.earbucks = (engine.player.earbucks || 0) + 1;
                    }
                } else if (targetEntity.type === EntityType.NPC) {
                    // NPCs drop their entire inventory on death
                    if (typeof targetEntity.die === 'function') {
                        targetEntity.die(); // Emits npcDied event
                    }
                    const items = targetEntity.inventory.getAllItems();
                    if (items.length > 0) {
                        gameMap.addItemsToTile(targetX, targetY, items);
                        targetEntity.inventory.clear();
                    }
                } else if (targetEntity.type === 'rabbit') {
                    // Rabbits always drop 1 raw meat
                    const meat = createItemFromDef('food.raw_meat');
                    if (meat) gameMap.addItemsToTile(targetX, targetY, [meat]);
                }
                
                gameMap.removeEntity(targetEntity.id);
                cancelTargeting();
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
    }, [playerRef, gameMapRef, lootGenerator, addEffect, forceRefresh, cancelTargeting, triggerMapUpdate, inventoryRef, targetingWeapon, triggerAcidEffect, updatePlayerStats, playerStats]);

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

        const distance = Math.sqrt(Math.pow(targetX - player.x, 2) + Math.pow(targetY - player.y, 2));
        if (stats.minRange && distance < stats.minRange) return { success: false, reason: 'Target too close' };

        const losResult = LineOfSight.hasLineOfSight(gameMap, player.x, player.y, targetX, targetY, { maxRange: 20 });
        if (!losResult.hasLineOfSight) return { success: false, reason: losResult.blockedBy?.message || 'No line of sight' };

        const tile = gameMap.getTile(targetX, targetY);
        const targetEntity = tile?.contents.find(e => e.type === EntityType.ZOMBIE || e.type === EntityType.RABBIT || e.type === EntityType.NPC);
        const turret = !targetEntity ? getAttackableTurretOnTile(tile, player) : null;
        const structure = (!targetEntity && !turret) ? tile?.contents.find(e => e.type === EntityType.WINDOW || e.type === EntityType.DOOR) : null;

        if (!targetEntity && !turret && !structure) {
            cancelTargeting();
            return { success: false, reason: 'No target at location' };
        }

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
            const accuracyBonus = (rangedLvl - (player.drunkenness || 0)) * 0.01;
            const squaresAway = Math.floor(distance);
            const sightSlot = weapon.attachmentSlots?.find(s => s.id === 'sight');
            const hasScope = sightSlot && weapon.attachments[sightSlot.id]?.categories?.includes(ItemCategory.RIFLE_SCOPE);
            const hasLaserSight = sightSlot && weapon.attachments[sightSlot.id]?.categories?.includes(ItemCategory.LASER_SIGHT);

            let baseHitChance = 1.0;
            if (isSling) baseHitChance = Math.max(0, 0.9 - (squaresAway - 2) * 0.1);
            else if (stats.isShotgun) baseHitChance = squaresAway <= (stats.accuracyMaxRange || 5) ? 1.0 : Math.max(stats.minAccuracy, 1.0 - (squaresAway - 5) * (stats.accuracyFalloff || 0.2));
            else if (hasScope) baseHitChance = squaresAway <= 15 ? 1.0 : Math.max(stats.minAccuracy, 1.0 - (squaresAway - 15) * stats.accuracyFalloff);
            else if (hasLaserSight) baseHitChance = squaresAway <= 10 ? 1.0 : Math.max(stats.minAccuracy, 1.0 - (squaresAway - 10) * stats.accuracyFalloff);
            else baseHitChance = Math.max(stats.minAccuracy, 1.0 - (squaresAway - 1) * stats.accuracyFalloff);

            const isWindowTarget = structure && (structure.type === EntityType.WINDOW);
            const hit = isWindowTarget ? true : Math.random() <= (baseHitChance + accuracyBonus);
            const critChance = 0.05 + (rangedLvl - 1) * 0.05;
            const isCrit = hit && Math.random() <= critChance;

            let damage = 0;
            if (hit) {
                damage = isCrit 
                    ? Math.floor(stats.damage.max * 1.5)
                    : Math.floor(Math.random() * (stats.damage.max - stats.damage.min + 1)) + stats.damage.min;
                    
                if (!isCrit && stats.isShotgun) {
                    let finalDamage = stats.damage.min;
                    if (squaresAway > 1) finalDamage *= Math.pow(1 - (stats.damageFalloff || 0.1), squaresAway - 1);
                    if (squaresAway > 5) finalDamage *= Math.pow(1 - (stats.damageFalloffExtra || 0.1), squaresAway - 5);
                    damage = Math.floor(finalDamage);
                }
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
                    targetEntity.takeDamage(damage);
                    addLog(`${isCrit ? 'CRITICAL HIT! ' : ''}Player attacks ${targetEntity.type}: ${damage} damage (${weapon.name})`, 'combat');
                    if (targetEntity.type === EntityType.ZOMBIE && targetEntity.subtype === 'acid') triggerAcidEffect(targetEntity, false);
                    if (targetEntity.type === EntityType.NPC && targetEntity.isShopkeeper) {
                        const escalated = escalateTurretsAgainstPlayer(gameMap, 'town');
                        if (escalated > 0) addLog('The town turrets turn on you!', 'warning');
                    }
                } else if (turret) {
                    turret.takeDamage(damage);
                    addLog(`${isCrit ? 'CRITICAL HIT! ' : ''}You hit the turret: ${damage} damage (${weapon.name})`, 'combat');
                    // Attacking a faction's turret provokes that whole faction.
                    const escalated = escalateTurretsAgainstPlayer(gameMap, turret.getFaction?.());
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
                    addLog(`${targetEntity.type.charAt(0).toUpperCase() + targetEntity.type.slice(1)} killed!`, 'combat');
                    const newLevel = recordKill('ranged');
                    if (newLevel) {
                        addLog(`LEVEL UP! Ranged skill is now level ${newLevel}!`, 'warning');
                    }
                    
                    if (targetEntity.type === EntityType.ZOMBIE) {
                        if (targetEntity.subtype === 'acid') triggerAcidEffect(targetEntity, true);
                        if (lootGenerator && !isWindowTile(gameMap, targetEntity.x, targetEntity.y) && Math.random() < 0.75) {
                            const loot = lootGenerator.generateZombieLoot(targetEntity.subtype, gameMap.mapNumber);
                            if (loot?.length > 0) {
                                if (targetEntity.x === player.x && targetEntity.y === player.y && engine.inventoryManager) {
                                    loot.forEach(item => engine.inventoryManager.groundContainer.addItem(item, null, null, true));
                                    engine.inventoryManager.groundManager.updateCategoryAreas();
                                    engine.inventoryManager.emit('inventoryChanged');
                                } else {
                                    gameMap.addItemsToTile(targetEntity.x, targetEntity.y, loot);
                                }
                            }
                        }
                        // Award 1 Earbuck per zombie kill
                        if (engine.player) {
                            engine.player.earbucks = (engine.player.earbucks || 0) + 1;
                        }
                    } else if (targetEntity.type === EntityType.NPC) {
                        // NPCs drop their entire inventory on death
                        if (typeof targetEntity.die === 'function') {
                            targetEntity.die(); // Emits npcDied event
                        }
                        const items = targetEntity.inventory.getAllItems();
                        if (items.length > 0) {
                            gameMap.addItemsToTile(targetEntity.x, targetEntity.y, items);
                            targetEntity.inventory.clear();
                        }
                    } else if (targetEntity.type === EntityType.RABBIT) {
                        const meat = createItemFromDef('food.raw_meat');
                        if (meat) {
                            if (targetEntity.x === player.x && targetEntity.y === player.y && engine.inventoryManager) {
                                engine.inventoryManager.groundContainer.addItem(meat, null, null, true);
                                engine.inventoryManager.groundManager.updateCategoryAreas();
                                engine.inventoryManager.emit('inventoryChanged');
                            } else {
                                gameMap.addItemsToTile(targetEntity.x, targetEntity.y, [meat]);
                            }
                        }
                    }
                    
                    gameMap.removeEntity(targetEntity.id);
                    cancelTargeting();
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
    }, [playerRef, gameMapRef, lootGenerator, addEffect, forceRefresh, cancelTargeting, triggerMapUpdate, inventoryRef, targetingWeapon, triggerAcidEffect, playerStats]);

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
        actionQueue.forEach(action => {
            if (action.type === 'TILE_FLASH') {
                addEffect({
                    type: 'tile_flash',
                    x: action.data.x,
                    y: action.data.y,
                    color: action.data.color,
                    duration: action.data.duration
                });
            } else if (action.type === 'DAMAGE_EFFECT') {
                addEffect({
                    type: 'damage',
                    x: action.data.x,
                    y: action.data.y,
                    value: action.data.damage,
                    color: action.data.color,
                    duration: 1500
                });
                addLog(action.data.log, 'combat');
            } else if (action.type === 'EXPLOSION_LOG') {
                addLog(action.data.log, 'combat');
            } else if (action.type === 'DEATH') {
                addEffect({
                    type: 'damage',
                    x: action.data.x,
                    y: action.data.y,
                    value: 'Killed',
                    color: '#ef4444',
                    duration: 1500
                });
                if (action.data.entityType === EntityType.ZOMBIE) {
                    if (engine.player) {
                        engine.player.earbucks = (engine.player.earbucks || 0) + 1;
                    }
                }
            } else if (action.type === 'STRUCTURE_INTERACT') {
                if (action.data.broken) {
                    GameEvents.emit(action.data.targetType === 'window' ? GAME_EVENT.WINDOW_SMASH : GAME_EVENT.DOOR_BROKEN, {
                        windowPos: action.data.targetType === 'window' ? action.data.to : undefined,
                        doorPos: action.data.targetType === 'door' ? action.data.to : undefined,
                        source: 'grenade'
                    });
                }
            } else if (action.type === 'SOUND') {
                if (action.metadata?.sound) {
                    playSound(action.metadata.sound, action.metadata.audioOptions);
                }
            }
        });

        triggerMapUpdate();
        forceRefresh();
        return { success: true };
    }, [playerRef, gameMapRef, addEffect, addLog, triggerMapUpdate, forceRefresh, destroyItem, lootGenerator, playSound]);
    
    const performStoneThrow = useCallback((item, targetX, targetY) => {
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
            maxRange: 20
        });
        if (!losResult.hasLineOfSight) {
            return { success: false, reason: losResult.blockedBy?.message || 'No line of sight' };
        }

        const tile = gameMap.getTile(targetX, targetY);
        const targetEntity = tile?.contents.find(e => e.type === EntityType.ZOMBIE || e.type === EntityType.RABBIT || e.type === EntityType.NPC);
        const structure = !targetEntity ? tile?.contents.find(e => e.type === EntityType.WINDOW || e.type === EntityType.DOOR) : null;
        
        if (!targetEntity && !structure) {
            return { success: false, reason: 'No target at location' };
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

                // Spawn a recoverable stone on the hit tile
                const droppedStone = createItemFromDef('crafting.stone');
                if (droppedStone) {
                    gameMap.addItemsToTile(targetX, targetY, [droppedStone]);
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
                    addLog(`${targetEntity.type.charAt(0).toUpperCase() + targetEntity.type.slice(1)} killed!`, 'combat');
                    recordKill('ranged');
                    
                    if (targetEntity.type === EntityType.ZOMBIE) {
                        if (targetEntity.subtype === 'acid') triggerAcidEffect(targetEntity, true);
                        if (lootGenerator && !isWindowTile(gameMap, targetX, targetY) && Math.random() < 0.75) {
                            const loot = lootGenerator.generateZombieLoot(targetEntity.subtype, gameMap.mapNumber);
                            if (loot?.length > 0) gameMap.addItemsToTile(targetX, targetY, loot);
                        }
                        // Award 1 Earbuck per zombie kill
                        if (engine.player) {
                            engine.player.earbucks = (engine.player.earbucks || 0) + 1;
                        }
                    } else if (targetEntity.type === EntityType.NPC) {
                        if (typeof targetEntity.die === 'function') targetEntity.die();
                        const items = targetEntity.inventory.getAllItems();
                        if (items.length > 0) gameMap.addItemsToTile(targetX, targetY, items);
                    } else if (targetEntity.type === 'rabbit') {
                        const meat = createItemFromDef('food.raw_meat');
                        if (meat) gameMap.addItemsToTile(targetX, targetY, [meat]);
                    }
                    gameMap.removeEntity(targetEntity.id);
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

        // Noise
        gameMap.emitNoise(targetX, targetY, 3);
        gameMap.emitNoise(player.x, player.y, 1);

        triggerMapUpdate();
        forceRefresh();
        return { success: true };
    }, [playerRef, gameMapRef, addEffect, addLog, triggerMapUpdate, forceRefresh, destroyItem, lootGenerator, playerStats, recordKill, triggerAcidEffect]);

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
        actionQueue.forEach(action => {
            if (action.type === 'TILE_FLASH') {
                addEffect({
                    type: 'tile_flash',
                    x: action.data.x,
                    y: action.data.y,
                    color: action.data.color,
                    duration: action.data.duration
                });
            } else if (action.type === 'DAMAGE_EFFECT') {
                addEffect({
                    type: 'damage',
                    x: action.data.x,
                    y: action.data.y,
                    value: action.data.damage,
                    color: action.data.color,
                    duration: 1500
                });
                addLog(action.data.log, 'combat');
            } else if (action.type === 'EXPLOSION_LOG') {
                addLog(action.data.log, 'combat');
            } else if (action.type === 'DEATH') {
                addEffect({
                    type: 'damage',
                    x: action.data.x,
                    y: action.data.y,
                    value: 'Killed',
                    color: '#f97316',
                    duration: 1500
                });
                if (action.data.entityType === EntityType.ZOMBIE) {
                    if (engine.player) {
                        engine.player.earbucks = (engine.player.earbucks || 0) + 1;
                    }
                }
            } else if (action.type === 'STRUCTURE_INTERACT') {
                if (action.data.broken) {
                    GameEvents.emit(action.data.targetType === 'window' ? GAME_EVENT.WINDOW_SMASH : GAME_EVENT.DOOR_BROKEN, {
                        windowPos: action.data.targetType === 'window' ? action.data.to : undefined,
                        doorPos: action.data.targetType === 'door' ? action.data.to : undefined,
                        source: 'molotov'
                    });
                }
            } else if (action.type === 'SOUND') {
                if (action.metadata?.sound) {
                    playSound(action.metadata.sound, action.metadata.audioOptions);
                }
            }
        });

        triggerMapUpdate();
        forceRefresh();
        return { success: true };
    }, [playerRef, gameMapRef, lootGenerator, addEffect, forceRefresh, cancelTargeting, triggerMapUpdate, inventoryRef, targetingWeapon, triggerAcidEffect, playerStats, destroyItem, addLog, playSound]);

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
