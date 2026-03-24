import React, { createContext, useContext, useState, useCallback } from 'react';
import { usePlayer } from './PlayerContext.jsx';
import { useGameMap } from './GameMapContext.jsx';
import { useVisualEffects } from './VisualEffectsContext.jsx';
import { useGame } from './GameContext.jsx';
import { useInventory } from './InventoryContext.jsx';
import { useLog } from './LogContext.jsx';
import { ItemDefs } from '../game/inventory/ItemDefs.js';

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
    const { playerRef, updatePlayerStats } = usePlayer();
    const { gameMapRef, lootGenerator, triggerMapUpdate } = useGameMap();
    const { addEffect } = useVisualEffects();
    const { forceRefresh, inventoryRef, destroyItem } = useInventory();
    const { addLog } = useLog();

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
            // Try destroying it again if it somehow persisted
            destroyItem(weapon.instanceId);
            cancelTargeting();
            return { success: false, reason: 'Weapon is broken' };
        }

        // 1. Check AP
        if (player.ap < 1) {
            return { success: false, reason: 'Not enough AP' };
        }

        // 2. Validate Adjacency/Range
        const dx = Math.abs(player.x - targetX);
        const dy = Math.abs(player.y - targetY);
        
        const defStats = ItemDefs[weapon.defId]?.combat || {};
        const instanceStats = weapon.combat || {};
        const weaponStats = { ...defStats, ...instanceStats };
        // Priority: Balance changes in ItemDefs.range should always apply
        const weaponRange = defStats.range || instanceStats.range || 1.0;
        
        // Use Euclidean distance for range check
        const distance = Math.sqrt(dx * dx + dy * dy);
        const isInRange = distance <= weaponRange + 0.1; // Small threshold for floating point

        if (!isInRange) {
            console.warn(`[Combat] Target out of range: distance=${distance.toFixed(2)}, maxRange=${weaponRange}`);
            return { success: false, reason: 'Target out of range' };
        }

        // 3. Find Target (Zombie or Structure)
        const tile = gameMap.getTile(targetX, targetY);
        let zombie = tile?.contents.find(e => e.type === 'zombie');
        let structure = !zombie ? tile?.contents.find(e => e.type === 'window' || e.type === 'door') : null;

        if (!zombie && !structure) {
            return { success: false, reason: 'No target here' };
        }

        console.log(`[Combat] Attacking with ${weapon.name} (defId: ${weapon.defId})`);
        console.log(`[Combat] Stats: hitChance=${weaponStats.hitChance}, damage=${weaponStats.damage.min}-${weaponStats.damage.max}`);

        const roll = Math.random();
        const hit = roll <= weaponStats.hitChance;

        // 5. Apply Results
        player.useAP(1);

        if (hit) {
            const damage = Math.floor(Math.random() * (weaponStats.damage.max - weaponStats.damage.min + 1)) + weaponStats.damage.min;
            if (zombie) {
                console.log(`[Combat] HIT! ${weapon.name} dealt ${damage} damage to zombie ${zombie.id}`);
            } else if (structure) {
                console.log(`[Combat] HIT! ${weapon.name} dealt ${damage} damage to structure ${structure.type}`);
            }

            if (zombie) {
                zombie.takeDamage(damage);
                addLog(`Player attacks: ${damage} damage (${weapon.name})`, 'combat');

                // Acid Zombie Reactions
                if (zombie.subtype === 'acid') {
                    triggerAcidEffect(zombie, false); // Splash
                }
            } else if (structure) {
                if (structure.type === 'window') {
                    structure.break();
                    addLog(`You smash the window with your ${weapon.name}!`, 'combat');
                    
                    // Unarmed penalty: bleeding
                    if (weapon.instanceId === 'unarmed') {
                        if (typeof player?.setBleeding === 'function') {
                            player.setBleeding(true);
                        }
                        addLog('You cut your hands smashing the glass!', 'warning');
                        updatePlayerStats({ isBleeding: true });
                    }

                    gameMap.emitNoise(targetX, targetY, 5); // Breaking glass is noisy
                } else {
                    // Doors take damage but don't "break" into jagged fragments like windows
                    if (typeof structure.takeDamage === 'function') {
                        structure.takeDamage(damage);
                    } else {
                        // Fallback if takeDamage not implemented on Door yet
                        structure.hp = Math.max(0, (structure.hp || 10) - damage);
                        if (structure.hp <= 0 && typeof structure.break === 'function') {
                            structure.break();
                        }
                    }
                    addLog(`You hit the ${structure.type} with your ${weapon.name}!`, 'combat');
                    gameMap.emitNoise(targetX, targetY, 3);
                }
            }

            // Pop-up damage
            addEffect({
                type: 'damage',
                x: targetX,
                y: targetY,
                value: damage,
                color: '#ef4444',
                duration: 1200
            });

            if (zombie && zombie.isDead()) {
                console.log(`[Combat] Zombie ${zombie.id} is DEAD!`);
                addLog('Zombie killed!', 'combat');

                // Acid Zombie Death Reaction
                if (zombie.subtype === 'acid') {
                    triggerAcidEffect(zombie, true); // Explosion
                }

                // Zombie Loot Drop (75% chance)
                if (lootGenerator && Math.random() < 0.75) {
                    const loot = lootGenerator.generateZombieLoot(zombie.subtype);
                    if (loot && loot.length > 0) {
                        console.log(`[Combat] Zombie dropped ${loot.length} items:`, loot.map(i => i.name).join(', '));
                        gameMap.addItemsToTile(targetX, targetY, loot);
                    }
                }

                gameMap.removeEntity(zombie.id);
                cancelTargeting();
                triggerMapUpdate();
                forceRefresh(); // Trigger UI update to remove zombie icon
            } else {
                // If hit but not dead (or it was a structure), still trigger update
                triggerMapUpdate();
                forceRefresh();
            }
        } else {
            console.log(`[Combat] MISS! ${weapon.name} missed its target`);
            addLog(`Player attacks: miss (${weapon.name})`, 'combat');

            // Pop-up miss
            addEffect({
                type: 'damage', // Use damage effect type but with "Miss" text
                x: targetX,
                y: targetY,
                value: 'Miss',
                color: '#9ca3af',
                duration: 1200
            });
        }

        // 6. Weapon Degradation (Always occur after attack attempt if hit/miss processed)
        if (weapon.instanceId !== 'unarmed' && typeof weapon.degrade === 'function' && weapon.isDegradable()) {
            weapon.degrade(); // Uses its own fragility
            if (weapon.condition !== null && weapon.condition <= 0) {
                console.log(`[Combat] Weapon ${weapon.name} BROKE!`);
                addEffect({
                    type: 'damage',
                    x: player.x,
                    y: player.y,
                    value: 'Broke!',
                    color: '#fbbf24',
                    duration: 1500
                });
                
                // Destroy broken weapon
                destroyItem(weapon.instanceId);
                
                if (targetingWeapon?.item?.instanceId === weapon.instanceId) {
                    cancelTargeting();
                }
                forceRefresh();
            }
        }

        return { success: true };
    }, [playerRef, gameMapRef, lootGenerator, addEffect, forceRefresh, cancelTargeting, triggerMapUpdate, inventoryRef, targetingWeapon, triggerAcidEffect]);

    const performRangedAttack = useCallback((weapon, targetX, targetY) => {
        const player = playerRef.current;
        const gameMap = gameMapRef.current;
        if (!player || !gameMap) return { success: false, reason: 'System error' };

        // Guard: Prevent attack with broken firearm
        if (weapon && weapon.isDegradable() && weapon.condition !== null && weapon.condition <= 0) {
            console.warn(`[Combat] Blocked attack with broken firearm: ${weapon.name}`);
            addEffect({
                type: 'damage',
                x: player.x,
                y: player.y,
                value: 'Broke!',
                color: '#ef4444',
                duration: 1000
            });
            // Try destroying it again if it somehow persisted
            destroyItem(weapon.instanceId);
            cancelTargeting();
            return { success: false, reason: 'Weapon is broken' };
        }

        // 1. Check AP
        if (player.ap < 1) {
            return { success: false, reason: 'Not enough AP' };
        }

        // 2. Ammo Management
        const stats = ItemDefs[weapon.defId]?.rangedStats || {
            damage: { min: 4, max: 10 },
            accuracyFalloff: 0.1,
            minAccuracy: 0.01
        };

        const isSling = stats.isSling;
        let ammoFound = false;
        let magazine = null;
        let ammoSlot = null;

        if (isSling) {
            // Sling uses stones from inventory or ground
            ammoFound = inventoryRef.current.hasItemByDefId('crafting.stone', 1);
        } else {
            // Find attached magazine
            ammoSlot = weapon.attachmentSlots?.find(slot =>
                slot.id === 'ammo' || slot.allowedCategories?.includes(ItemCategory.AMMO)
            );
            magazine = ammoSlot ? weapon.attachments[ammoSlot.id] : null;

            const isMagazine = magazine && (typeof magazine.isMagazine === 'function' ? magazine.isMagazine() : (magazine.capacity > 0));
            const currentAmmo = isMagazine ? (magazine.ammoCount || 0) : (magazine?.stackCount || 0);
            ammoFound = magazine && currentAmmo > 0;
        }

        if (!ammoFound) {
            return { success: false, reason: 'Out of ammo' };
        }

        // 2b. Range Check
        const distance = Math.sqrt(Math.pow(targetX - player.x, 2) + Math.pow(targetY - player.y, 2));
        const squaresAway = Math.floor(distance);

        if (stats.minRange && distance < stats.minRange) {
            return { success: false, reason: 'Target too close' };
        }

        // 3. Visibility Check
        const losResult = LineOfSight.hasLineOfSight(gameMap, player.x, player.y, targetX, targetY, {
            maxRange: 20 // Reasonable max range for visibility
        });

        if (!losResult.hasLineOfSight) {
            return { success: false, reason: losResult.blockedBy?.message || 'No line of sight' };
        }

        // 4. Find Target (Zombie or Structure)
        const tile = gameMap.getTile(targetX, targetY);
        let zombie = tile?.contents.find(e => e.type === 'zombie');
        let structure = !zombie ? tile?.contents.find(e => e.type === 'window' || e.type === 'door') : null;

        if (!zombie && !structure) {
            return { success: false, reason: 'No target at location' };
        }

        // 5. Hit Calculation
        const sightSlot = weapon.attachmentSlots?.find(s => s.id === 'sight');
        const sightItem = sightSlot ? weapon.attachments[sightSlot.id] : null;
        const hasScope = sightItem && sightItem.categories?.includes(ItemCategory.RIFLE_SCOPE);

        let hitChance;
        if (isSling) {
            // Sling: 90% at 2 squares, -10% each square after
            hitChance = Math.max(0, 0.9 - (squaresAway - 2) * 0.1);
        } else if (stats.isShotgun) {
            if (squaresAway <= (stats.accuracyMaxRange || 5)) {
                hitChance = 1.0;
            } else {
                // Each square beyond 5 reduces accuracy by 20%
                hitChance = Math.max(stats.minAccuracy, 1.0 - (squaresAway - 5) * (stats.accuracyFalloff || 0.2));
            }
        } else if (hasScope) {
            if (squaresAway <= 15) {
                hitChance = 1.0;
            } else {
                // Falloff starts from 16
                hitChance = Math.max(stats.minAccuracy, 1.0 - (squaresAway - 15) * stats.accuracyFalloff);
            }
        } else {
            // 100% hit at distance 1. -Falloff for each square beyond that.
            hitChance = Math.max(stats.minAccuracy, 1.0 - (squaresAway - 1) * stats.accuracyFalloff);
        }

        console.log(`[Combat] Ranged attack with ${weapon.name} at distance ${distance.toFixed(2)} (${squaresAway} squares)${hasScope ? ' (Scoped)' : ''}`);
        console.log(`[Combat] Hit chance: ${(hitChance * 100).toFixed(1)}%`);

        const roll = Math.random();
        const hit = roll <= hitChance;

        // 5.5 Emit Noise
        // Suppressor check
        const barrelSlot = weapon.attachmentSlots?.find(s => s.id === 'barrel');
        const barrelItem = barrelSlot ? weapon.attachments[barrelSlot.id] : null;
        const isSuppressed = barrelItem && barrelItem.categories?.includes(ItemCategory.SUPPRESSOR);

        const baseNoiseRadius = stats.noiseRadius || 10;
        const actualNoiseRadius = isSuppressed ? 3 : baseNoiseRadius;

        if (gameMap.emitNoise) {
            gameMap.emitNoise(player.x, player.y, actualNoiseRadius);
        }

        // 6. Apply Results
        player.useAP(1);

        if (isSling) {
            inventoryRef.current.consumeItemByDefId('crafting.stone', 1);
        } else {
            const isMagazine = magazine && (typeof magazine.isMagazine === 'function' ? magazine.isMagazine() : (magazine.capacity > 0));
            if (isMagazine) {
                magazine.ammoCount--;
            } else {
                magazine.stackCount--;
                // If stack is empty, remove it from the weapon's ammo slot to prevent "ghost ammo" icons
                if (magazine.stackCount <= 0 && ammoSlot) {
                    console.log(`[Combat] Ammo stack empty, detaching from ${weapon.name} slot: ${ammoSlot.id}`);
                    weapon.detachItem(ammoSlot.id);
                }
            }
        }

        if (hit) {
            let damage;
            if (stats.isShotgun) {
                // Damage at 1 square is 20. Each additional square reduces by 10%
                let finalDamage = stats.damage.min; // 20
                if (squaresAway > 1) {
                    finalDamage *= Math.pow(1 - (stats.damageFalloff || 0.1), squaresAway - 1);
                }
                // Each square beyond 5 reduces damage by ANOTHER 10%
                if (squaresAway > 5) {
                    finalDamage *= Math.pow(1 - (stats.damageFalloffExtra || 0.1), squaresAway - 5);
                }
                damage = Math.floor(finalDamage);
            } else {
                damage = Math.floor(Math.random() * (stats.damage.max - stats.damage.min + 1)) + stats.damage.min;
            }
            if (zombie) {
                console.log(`[Combat] RANGED HIT! Dealt ${damage} damage to zombie ${zombie.id}`);
                zombie.takeDamage(damage);
                addLog(`Player attacks: ${damage} damage (${weapon.name})`, 'combat');

                // Acid Zombie Reactions
                if (zombie.subtype === 'acid') {
                    triggerAcidEffect(zombie, false); // Splash
                }
            } else if (structure) {
                console.log(`[Combat] RANGED HIT! Dealt ${damage} damage to structure ${structure.type}`);
                if (structure.type === 'window') {
                    structure.break();
                    addLog('The window shatters!', 'combat');
                    gameMap.emitNoise(targetX, targetY, 5);
                } else {
                    if (typeof structure.takeDamage === 'function') {
                        structure.takeDamage(damage);
                    } else {
                        structure.hp = Math.max(0, (structure.hp || 10) - damage);
                        if (structure.hp <= 0 && typeof structure.break === 'function') {
                            structure.break();
                        }
                    }
                    addLog(`You hit the ${structure.type} with a gunshot!`, 'combat');
                    gameMap.emitNoise(targetX, targetY, 3);
                }
            }

            addEffect({
                type: 'damage',
                x: targetX,
                y: targetY,
                value: damage,
                color: '#ef4444',
                duration: 1200
            });

            if (zombie && zombie.isDead()) {
                console.log(`[Combat] Zombie ${zombie.id} is DEAD!`);
                addLog('Zombie killed!', 'combat');

                // Acid Zombie Death Reaction
                if (zombie.subtype === 'acid') {
                    triggerAcidEffect(zombie, true); // Explosion
                }

                // Zombie Loot Drop (75% chance)
                if (lootGenerator && Math.random() < 0.75) {
                    const loot = lootGenerator.generateZombieLoot(zombie.subtype);
                    if (loot && loot.length > 0) {
                        console.log(`[Combat] Zombie dropped ${loot.length} items:`, loot.map(i => i.name).join(', '));
                        gameMap.addItemsToTile(targetX, targetY, loot);
                    }
                }

                gameMap.removeEntity(zombie.id);
                cancelTargeting();
                triggerMapUpdate();
                forceRefresh();
            } else {
                // If hit but not dead (or it was a structure), still trigger update
                triggerMapUpdate();
                forceRefresh();
            }
        } else {
            console.log(`[Combat] RANGED MISS!`);
            addLog(`Player attacks: miss (${weapon.name})`, 'combat');
            addEffect({
                type: 'damage',
                x: targetX,
                y: targetY,
                value: 'Miss',
                color: '#9ca3af',
                duration: 1200
            });
        }

        // 7. Weapon Degradation
        if (typeof weapon.degrade === 'function' && weapon.isDegradable()) {
            weapon.degrade();
            if (weapon.condition !== null && weapon.condition <= 0) {
                console.log(`[Combat] Firearm ${weapon.name} BROKE!`);
                addEffect({
                    type: 'damage',
                    x: player.x,
                    y: player.y,
                    value: 'Broke!',
                    color: '#fbbf24',
                    duration: 1500
                });
                
                // Destroy broken weapon
                destroyItem(weapon.instanceId);
                
                if (targetingWeapon?.item?.instanceId === weapon.instanceId) {
                    cancelTargeting();
                }
            }
        }

        // Always refresh UI after a ranged attack to update ammo counts and potentially removed ammo icons
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
            if (entity.type !== 'player' && entity.type !== 'zombie') return;

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

                addLog(`Explosion deals ${damage} damage to ${entity.type === 'player' ? 'you' : 'zombie'}`, 'combat');

                if (entity.type === 'zombie' && entity.isDead()) {
                    addLog('Zombie killed by grenade!', 'combat');
                    // Loot drop logic for zombies killed by grenade
                    if (lootGenerator && Math.random() < 0.75) {
                        const loot = lootGenerator.generateZombieLoot(entity.subtype);
                        if (loot?.length > 0) gameMap.addItemsToTile(entity.x, entity.y, loot);
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
