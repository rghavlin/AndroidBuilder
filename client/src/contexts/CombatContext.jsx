import React, { createContext, useContext, useState, useCallback } from 'react';
import { usePlayer } from './PlayerContext.jsx';
import { useGameMap } from './GameMapContext.jsx';
import { useVisualEffects } from './VisualEffectsContext.jsx';
import { useGame } from './GameContext.jsx';
import { ItemDefs } from '../game/inventory/ItemDefs.js';

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

    return (
        <CombatContext.Provider value={{
            targetingWeapon,
            toggleTargeting,
            cancelTargeting,
            performMeleeAttack
        }}>
            {children}
        </CombatContext.Provider>
    );
};
