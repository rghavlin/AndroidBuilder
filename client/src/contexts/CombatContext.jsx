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

import { ItemCategory } from '../game/inventory/traits.js';
import { LineOfSight } from '../game/utils/LineOfSight.js';

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
        const damageMin = isDeath ? 2 : 5; // Wait, request said 2-5 for death, 1-3 for hit
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
                if (entity.type === 'player' || entity.type === 'zombie') {
                    const damage = Math.floor(Math.random() * (dMax - dMin + 1)) + dMin;
                    
                    if (typeof entity.takeDamage === 'function') {
                        entity.takeDamage(damage, { id: zombie.id, type: 'zombie', subtype: 'acid' });
                        
                        addEffect({
                            type: 'damage',
                            x: entity.x,
                            y: entity.y,
                            value: damage,
                            color: '#ef4444',
                            duration: 1200
                        });

                        addLog(`${isDeath ? 'Acid explosion' : 'Acid splash'} deals ${damage} damage to ${entity.type === 'player' ? 'you' : 'zombie'}`, 'combat');
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
        const targetEntity = tile?.contents.find(e => e.type === 'zombie' || e.type === 'rabbit');
        const structure = !targetEntity ? tile?.contents.find(e => e.type === 'window' || e.type === 'door') : null;

        if (!targetEntity && !structure) return { success: false, reason: 'No target here' };

        // 1. Calculate Outcome
        const meleeLvl = playerStats.meleeLvl || 1;
        const accuracyBonus = meleeLvl * 0.01;
        const hit = Math.random() <= (weaponStats.hitChance + accuracyBonus);
        
        const critChance = 0.05 + (meleeLvl - 1) * 0.05;
        const isCrit = hit && Math.random() <= critChance;
        
        const damage = isCrit 
            ? Math.floor(weaponStats.damage.max * 1.5)
            : (hit ? Math.floor(Math.random() * (weaponStats.damage.max - weaponStats.damage.min + 1)) + weaponStats.damage.min : 0);

        // 2. Event emission for UI and Audio
        const attackData = { 
            weaponId: weapon.defId, 
            weaponType: weapon.isRanged ? 'ranged' : 'melee',
            hit,
            isCrit,
            damage,
            targetX,
            targetY
        };
        GameEvents.emit(GAME_EVENT.PLAYER_ATTACK, attackData);

        if (hit && targetEntity) {
            GameEvents.emit(GAME_EVENT.ZOMBIE_DAMAGE, { 
                zombieId: targetEntity.id, 
                damage, 
                isKillingBlow: targetEntity.hp <= damage 
            });
        }

        // 3. Apply AP Consumption (Primary state update)
        player.useAP(1);

        // 4. Detailed Logic Execution
        if (hit) {
            if (targetEntity) {
                targetEntity.takeDamage(damage);
                addLog(`${isCrit ? 'CRITICAL HIT! ' : ''}Player attacks ${targetEntity.type}: ${damage} damage (${weapon.name})`, 'combat');
                if (targetEntity.type === 'zombie' && targetEntity.subtype === 'acid') triggerAcidEffect(targetEntity, false);
            } else if (structure) {
                if (structure.type === 'window') {
                    structure.break();
                    GameEvents.emit(GAME_EVENT.WINDOW_SMASH, { windowPos: { x: targetX, y: targetY } });
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
                
                if (targetEntity.type === 'zombie') {
                    if (targetEntity.subtype === 'acid') triggerAcidEffect(targetEntity, true);
                    if (lootGenerator && Math.random() < 0.75) {
                        const loot = lootGenerator.generateZombieLoot(targetEntity.subtype);
                        if (loot?.length > 0) gameMap.addItemsToTile(targetX, targetY, loot);
                    }
                } else if (targetEntity.type === 'rabbit') {
                    // Rabbits always drop 1 raw meat
                    const meat = createItemFromDef('food.raw_meat');
                    if (meat) gameMap.addItemsToTile(targetX, targetY, [meat]);
                }
                
                gameMap.removeEntity(targetEntity.id);
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
    }, [playerRef, gameMapRef, lootGenerator, addEffect, forceRefresh, cancelTargeting, triggerMapUpdate, inventoryRef, targetingWeapon, triggerAcidEffect, updatePlayerStats]);

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

        if (isSling) {
            ammoFound = inventoryRef.current.hasItemByDefId('crafting.stone', 1);
        } else {
            ammoSlot = weapon.attachmentSlots?.find(slot => slot.id === 'ammo' || slot.allowedCategories?.includes(ItemCategory.AMMO));
            magazine = ammoSlot ? weapon.attachments[ammoSlot.id] : null;
            const isMagazine = magazine && (typeof magazine.isMagazine === 'function' ? magazine.isMagazine() : (magazine.capacity > 0));
            ammoFound = magazine && (isMagazine ? (magazine.ammoCount > 0) : (magazine.stackCount > 0));
        }

        if (!ammoFound) return { success: false, reason: 'Out of ammo' };

        const distance = Math.sqrt(Math.pow(targetX - player.x, 2) + Math.pow(targetY - player.y, 2));
        if (stats.minRange && distance < stats.minRange) return { success: false, reason: 'Target too close' };

        const losResult = LineOfSight.hasLineOfSight(gameMap, player.x, player.y, targetX, targetY, { maxRange: 20 });
        if (!losResult.hasLineOfSight) return { success: false, reason: losResult.blockedBy?.message || 'No line of sight' };

        const tile = gameMap.getTile(targetX, targetY);
        const targetEntity = tile?.contents.find(e => e.type === 'zombie' || e.type === 'rabbit');
        const structure = !targetEntity ? tile?.contents.find(e => e.type === 'window' || e.type === 'door') : null;
        if (!targetEntity && !structure) return { success: false, reason: 'No target at location' };

        // 1. Calculate Outcome
        const rangedLvl = playerStats.rangedLvl || 1;
        const accuracyBonus = rangedLvl * 0.01;
        const squaresAway = Math.floor(distance);
        const sightSlot = weapon.attachmentSlots?.find(s => s.id === 'sight');
        const hasScope = sightSlot && weapon.attachments[sightSlot.id]?.categories?.includes(ItemCategory.RIFLE_SCOPE);

        let baseHitChance = 1.0;
        if (isSling) baseHitChance = Math.max(0, 0.9 - (squaresAway - 2) * 0.1);
        else if (stats.isShotgun) baseHitChance = squaresAway <= (stats.accuracyMaxRange || 5) ? 1.0 : Math.max(stats.minAccuracy, 1.0 - (squaresAway - 5) * (stats.accuracyFalloff || 0.2));
        else if (hasScope) baseHitChance = squaresAway <= 15 ? 1.0 : Math.max(stats.minAccuracy, 1.0 - (squaresAway - 15) * stats.accuracyFalloff);
        else baseHitChance = Math.max(stats.minAccuracy, 1.0 - (squaresAway - 1) * stats.accuracyFalloff);

        const hit = Math.random() <= (baseHitChance + accuracyBonus);
        
        const critChance = 0.05 + (rangedLvl - 1) * 0.05;
        const isCrit = hit && Math.random() <= critChance;

        // Calculate damage before sounds for "killing blow" check
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

        // 2. Event emission for UI and Audio
        const attackData = { 
            weaponId: weapon.defId, 
            weaponType: 'ranged',
            hit,
            isCrit,
            damage,
            targetX,
            targetY
        };
        GameEvents.emit(GAME_EVENT.PLAYER_ATTACK, attackData);

        if (hit && targetEntity) {
            GameEvents.emit(GAME_EVENT.ZOMBIE_DAMAGE, { 
                zombieId: targetEntity.id, 
                damage, 
                isKillingBlow: targetEntity.hp <= damage 
            });
        }

        // 3. Apply AP Consumption
        player.useAP(1);

        // 4. Resource Consumption
        if (isSling) {
            inventoryRef.current.consumeItemByDefId('crafting.stone', 1);
        } else {
            const isMagazine = magazine && (typeof magazine.isMagazine === 'function' ? magazine.isMagazine() : (magazine.capacity > 0));
            if (isMagazine) magazine.ammoCount--;
            else {
                magazine.stackCount--;
                if (magazine.stackCount <= 0 && ammoSlot) weapon.detachItem(ammoSlot.id);
            }
        }

        // 5. Emit Noise
        const barrelSlot = weapon.attachmentSlots?.find(s => s.id === 'barrel');
        const isSuppressed = barrelSlot && weapon.attachments[barrelSlot.id]?.categories?.includes(ItemCategory.SUPPRESSOR);
        const noiseRadius = isSuppressed ? 3 : (stats.noiseRadius || 10);
        if (gameMap.emitNoise) gameMap.emitNoise(player.x, player.y, noiseRadius);

        // 6. Detailed Logic
        if (hit) {
            if (targetEntity) {
                targetEntity.takeDamage(damage);
                addLog(`${isCrit ? 'CRITICAL HIT! ' : ''}Player attacks ${targetEntity.type}: ${damage} damage (${weapon.name})`, 'combat');
                if (targetEntity.type === 'zombie' && targetEntity.subtype === 'acid') triggerAcidEffect(targetEntity, false);
            } else if (structure) {
                if (structure.type === 'window') {
                    structure.break();
                    GameEvents.emit(GAME_EVENT.WINDOW_SMASH, { windowPos: { x: targetX, y: targetY } });
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
                addLog(`${targetEntity.type.charAt(0).toUpperCase() + targetEntity.type.slice(1)} killed!`, 'combat');
                const newLevel = recordKill('ranged');
                if (newLevel) {
                    addLog(`LEVEL UP! Ranged skill is now level ${newLevel}!`, 'warning');
                }
                
                if (targetEntity.type === 'zombie') {
                    if (targetEntity.subtype === 'acid') triggerAcidEffect(targetEntity, true);
                    if (lootGenerator && Math.random() < 0.75) {
                        const loot = lootGenerator.generateZombieLoot(targetEntity.subtype);
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
                } else if (targetEntity.type === 'rabbit') {
                    // Rabbits always drop 1 raw meat
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
            }
            triggerMapUpdate();
        } else {
            addLog(`Player attacks: miss (${weapon.name})`, 'combat');
            addEffect({ type: 'damage', x: targetX, y: targetY, value: 'Miss', color: '#9ca3af', duration: 1200 });
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
        return { success: true };
    }, [playerRef, gameMapRef, lootGenerator, addEffect, forceRefresh, cancelTargeting, triggerMapUpdate, inventoryRef, targetingWeapon, triggerAcidEffect]);

    const performGrenadeThrow = useCallback((item, targetX, targetY) => {
        const player = playerRef.current;
        const gameMap = gameMapRef.current;
        if (!player || !gameMap) return { success: false, reason: 'System error' };

        // 1. Check AP
        if (player.ap < 1) {
            return { success: false, reason: 'Not enough AP' };
        }

        // 2. Range Check (Max 10 tiles)
        const distance = Math.sqrt(Math.pow(targetX - player.x, 2) + Math.pow(targetY - player.y, 2));
        if (distance > 10.5) { // Small buffer for diagonal/floating point
            return { success: false, reason: 'Target out of range (max 10)' };
        }

        // 3. Line of Sight Check
        const losResult = LineOfSight.hasLineOfSight(gameMap, player.x, player.y, targetX, targetY, {
            maxRange: 12
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

        // 5. AoE Explosion Logic
        const radius = 2;
        const FLASH_COLOR = 'rgba(255, 255, 255, 0.8)';

        addLog(`Grenade thrown at (${targetX}, ${targetY})!`, 'combat');
        
        // Emit explosion event for Audio
        GameEvents.emit(GAME_EVENT.NOISE_EMITTED, { x: targetX, y: targetY, radius: 10, type: 'explosion' });

        // Visual Flash on target and within 2 tiles
        for (let dy = -radius; dy <= radius; dy++) {
            for (let dx = -radius; dx <= radius; dx++) {
                const tx = targetX + dx;
                const ty = targetY + dy;
                if (tx < 0 || tx >= gameMap.width || ty < 0 || ty >= gameMap.height) continue;

                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist <= radius + 0.1) {
                    addEffect({
                        type: 'tile_flash',
                        x: tx,
                        y: ty,
                        color: FLASH_COLOR,
                        duration: 600
                    });
                }
            }
        }

        // Damage Entities within 2 tiles
        const allEntities = Array.from(gameMap.entityMap.values());
        allEntities.forEach(entity => {
            if (entity.type !== 'player' && entity.type !== 'zombie' && entity.type !== 'rabbit') return;

            const dist = Math.sqrt(Math.pow(entity.x - targetX, 2) + Math.pow(entity.y - targetY, 2));
            if (dist > radius + 0.1) return;

            // Damage scaling:
            // Target (dist < 0.5): 20-30
            // 1 tile (0.5 <= dist < 1.5): 15-20
            // 2 tiles (1.5 <= dist < 2.5): 10-15
            let dMin, dMax;
            if (dist < 0.5) {
                dMin = 20; dMax = 30;
            } else if (dist < 1.5) {
                dMin = 15; dMax = 20;
            } else {
                dMin = 10; dMax = 15;
            }

            const damage = Math.floor(Math.random() * (dMax - dMin + 1)) + dMin;
            
            if (typeof entity.takeDamage === 'function') {
                entity.takeDamage(damage, { id: 'grenade', type: 'weapon' });

                addEffect({
                    type: 'damage',
                    x: entity.x,
                    y: entity.y,
                    value: damage,
                    color: '#ef4444',
                    duration: 1500
                });

                addLog(`Explosion deals ${damage} damage to ${entity.type}`, 'combat');

                if (entity.isDead()) {
                    addLog(`${entity.type.charAt(0).toUpperCase() + entity.type.slice(1)} killed by grenade!`, 'combat');
                    // Loot drop logic for zombies killed by grenade
                    if (entity.type === 'zombie' && lootGenerator && Math.random() < 0.75) {
                        const loot = lootGenerator.generateZombieLoot(entity.subtype);
                        if (loot?.length > 0) gameMap.addItemsToTile(entity.x, entity.y, loot);
                    } else if (entity.type === 'rabbit') {
                        const meat = createItemFromDef('food.raw_meat');
                        if (meat) gameMap.addItemsToTile(entity.x, entity.y, [meat]);
                    }
                    gameMap.removeEntity(entity.id);
                }
            }
        });

        triggerMapUpdate();
        forceRefresh();
        return { success: true };
    }, [playerRef, gameMapRef, addEffect, addLog, triggerMapUpdate, forceRefresh, destroyItem, lootGenerator]);

    return (
        <CombatContext.Provider value={{
            targetingWeapon,
            toggleTargeting,
            cancelTargeting,
            performMeleeAttack,
            performRangedAttack,
            performGrenadeThrow
        }}>
            {children}
        </CombatContext.Provider>
    );
};
