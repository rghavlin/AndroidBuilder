import React, { createContext, useContext, useState, useCallback } from 'react';
import { usePlayer } from './PlayerContext.jsx';
import { useGameMap } from './GameMapContext.jsx';
import { useVisualEffects } from './VisualEffectsContext.jsx';
import { useGame } from './GameContext.jsx';
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
    const { playerRef } = usePlayer();
    const { gameMapRef } = useGameMap();
    const { addEffect } = useVisualEffects();
    const { forceRefresh } = useGame();

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

    const performMeleeAttack = useCallback((weapon, targetX, targetY) => {
        const player = playerRef.current;
        const gameMap = gameMapRef.current;
        if (!player || !gameMap) return { success: false, reason: 'System error' };

        // 1. Check AP
        if (player.ap < 1) {
            return { success: false, reason: 'Not enough AP' };
        }

        // 2. Validate Adjacency (Cardinal only)
        const dx = Math.abs(player.x - targetX);
        const dy = Math.abs(player.y - targetY);
        const isAdjacent = (dx === 1 && dy === 0) || (dx === 0 && dy === 1);

        if (!isAdjacent) {
            return { success: false, reason: 'Target out of range' };
        }

        // 3. Find Zombie
        const tile = gameMap.getTile(targetX, targetY);
        const zombie = tile?.contents.find(e => e.type === 'zombie');

        if (!zombie) {
            return { success: false, reason: 'No zombie at target' };
        }

        // 4. Hit Calculation
        // Fallback chain: weapon instance -> item definition -> hardcoded defaults
        const weaponStats = weapon.combat || ItemDefs[weapon.defId]?.combat || { hitChance: 0.5, damage: { min: 1, max: 2 } };

        console.log(`[Combat] Attacking with ${weapon.name} (defId: ${weapon.defId})`);
        console.log(`[Combat] Stats: hitChance=${weaponStats.hitChance}, damage=${weaponStats.damage.min}-${weaponStats.damage.max}`);

        const roll = Math.random();
        const hit = roll <= weaponStats.hitChance;

        // 5. Apply Results
        player.useAP(1);

        if (hit) {
            const damage = Math.floor(Math.random() * (weaponStats.damage.max - weaponStats.damage.min + 1)) + weaponStats.damage.min;
            console.log(`[Combat] HIT! ${weapon.name} dealt ${damage} damage to zombie ${zombie.id}`);

            zombie.takeDamage(damage);

            // Pop-up damage
            addEffect({
                type: 'damage',
                x: targetX,
                y: targetY,
                value: damage,
                color: '#ef4444',
                duration: 1200
            });

            if (zombie.isDead()) {
                console.log(`[Combat] Zombie ${zombie.id} is DEAD!`);
                gameMap.removeEntity(zombie.id);
                cancelTargeting();
                forceRefresh(); // Trigger UI update to remove zombie icon
            }
        } else {
            console.log(`[Combat] MISS! ${weapon.name} missed zombie ${zombie.id}`);

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

        return { success: true };
    }, [playerRef, gameMapRef, addEffect, cancelTargeting]);

    const performRangedAttack = useCallback((weapon, targetX, targetY) => {
        const player = playerRef.current;
        const gameMap = gameMapRef.current;
        if (!player || !gameMap) return { success: false, reason: 'System error' };

        // 1. Check AP
        if (player.ap < 1) {
            return { success: false, reason: 'Not enough AP' };
        }

        // 2. Ammo Management
        // Find attached magazine
        const ammoSlot = weapon.attachmentSlots?.find(slot =>
            slot.id === 'ammo' || slot.allowedCategories?.includes(ItemCategory.AMMO)
        );
        const magazine = ammoSlot ? weapon.attachments[ammoSlot.id] : null;

        if (!magazine || magazine.ammoCount <= 0) {
            return { success: false, reason: 'Out of ammo' };
        }

        // 3. Visibility Check
        const losResult = LineOfSight.hasLineOfSight(gameMap, player.x, player.y, targetX, targetY, {
            maxRange: 20 // Reasonable max range for visibility
        });

        if (!losResult.hasLineOfSight) {
            return { success: false, reason: losResult.blockedBy?.message || 'No line of sight' };
        }

        // 4. Find Zombie
        const tile = gameMap.getTile(targetX, targetY);
        const zombie = tile?.contents.find(e => e.type === 'zombie');

        if (!zombie) {
            return { success: false, reason: 'No target at location' };
        }

        // 5. Hit Calculation
        const stats = ItemDefs[weapon.defId]?.rangedStats || {
            damage: { min: 4, max: 10 },
            accuracyFalloff: 0.1,
            minAccuracy: 0.01
        };

        const distance = Math.sqrt(Math.pow(targetX - player.x, 2) + Math.pow(targetY - player.y, 2));
        const squaresAway = Math.floor(distance);

        // 100% hit at distance 1. -Falloff for each square beyond that.
        const hitChance = Math.max(stats.minAccuracy, 1.0 - (squaresAway - 1) * stats.accuracyFalloff);

        console.log(`[Combat] Ranged attack with ${weapon.name} at distance ${distance.toFixed(2)} (${squaresAway} squares)`);
        console.log(`[Combat] Hit chance: ${(hitChance * 100).toFixed(1)}%`);

        const roll = Math.random();
        const hit = roll <= hitChance;

        // 6. Apply Results
        player.useAP(1);
        magazine.ammoCount--; // Consume 1 bullet

        if (hit) {
            const damage = Math.floor(Math.random() * (stats.damage.max - stats.damage.min + 1)) + stats.damage.min;
            console.log(`[Combat] RANGED HIT! Dealt ${damage} damage to zombie ${zombie.id}`);

            zombie.takeDamage(damage);

            addEffect({
                type: 'damage',
                x: targetX,
                y: targetY,
                value: damage,
                color: '#ef4444',
                duration: 1200
            });

            if (zombie.isDead()) {
                gameMap.removeEntity(zombie.id);
                cancelTargeting();
                forceRefresh();
            }
        } else {
            console.log(`[Combat] RANGED MISS!`);
            addEffect({
                type: 'damage',
                x: targetX,
                y: targetY,
                value: 'Miss',
                color: '#9ca3af',
                duration: 1200
            });
        }

        return { success: true };
    }, [playerRef, gameMapRef, addEffect, forceRefresh, cancelTargeting]);

    return (
        <CombatContext.Provider value={{
            targetingWeapon,
            toggleTargeting,
            cancelTargeting,
            performMeleeAttack,
            performRangedAttack
        }}>
            {children}
        </CombatContext.Provider>
    );
};
