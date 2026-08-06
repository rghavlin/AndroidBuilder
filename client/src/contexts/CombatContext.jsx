import React, { createContext, useContext, useState, useCallback, useEffect, useMemo } from 'react';
import { usePlayer } from './PlayerContext.jsx';
import { useGameMap } from './GameMapContext.jsx';
import { useVisualEffects } from './VisualEffectsContext.jsx';
import { useGame } from './GameContext.jsx';
import { useInventory } from './InventoryContext.jsx';
import { useLog } from './LogContext.jsx';
import { useAudio } from './AudioContext.jsx';
import { createItemFromDef } from '../game/inventory/ItemDefs.js';
import GameEvents, { GAME_EVENT } from '../game/utils/GameEvents.js';

import { LineOfSight } from '../game/utils/LineOfSight.js';
import { ProjectileManager } from '../game/utils/ProjectileManager.js';
import { EntityType } from '../game/entities/Entity.js';
import { removeDestroyedTurret } from '../game/ai/TurretCombat.js';
import engine from '../game/GameEngine.js';
import { IntentQueue } from '../game/managers/IntentQueue.js';
import { ExplosionIntent } from '../game/components/ExplosionIntent.js';
import { CombatResolver } from '../game/systems/CombatResolver.js';
import { gameRandom } from '../game/utils/SeededRandom.js';
// Player melee/ranged attacks live in the engine so the headless harness runs the
// SAME code the UI does (see PlayerCombatSystem's header). This context is the
// presentation adapter: it supplies the `ui` callback bag and React-only state.
import PlayerCombatSystem, {
    resolveTileTarget,
    provokeAndWarn,
} from '../game/systems/PlayerCombatSystem.js';

// Every zombie kill awards the player a single Earbuck (now disabled in favor of corpse collection).
const awardZombieEarbuck = () => {
    // Disabled - earbucks are now harvested from corpses by left-clicking them.
};

// RNG NOTE: player combat rolls go through the seeded gameRandom, matching
// CombatResolver.rollPlayerMelee / rollPlayerRanged (which already do). This
// keeps every combat roll on one reproducible stream. It is NOT save-scummable:
// gameRandom's STATE is checkpointed on save (getState/setState) and resumed on
// load, rather than re-seeded from the original seed, so a reload continues the
// exact stream instead of replaying it. Keep the player-driven rolls below on
// gameRandom too — do NOT reintroduce Math.random (it desyncs headless
// simulation/replay and this combat stream).
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
    const { playerRef, updatePlayerStats, playerStats, recordHit } = usePlayer();
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

    // The presentation bag handed to PlayerCombatSystem. Everything in here is
    // React-side; the engine calls these but never depends on them (they all
    // default to no-ops headlessly).
    const combatUi = useMemo(() => ({
        addLog,
        addEffect,
        destroyItem,
        cancelTargeting,
        updatePlayerStats,
        forceRefresh,
        triggerMapUpdate,
        recordHit,
    }), [addLog, addEffect, destroyItem, cancelTargeting, updatePlayerStats, forceRefresh, triggerMapUpdate, recordHit]);

    const triggerAcidEffect = useCallback((zombie, isDeath) => {
        PlayerCombatSystem.triggerAcidEffect(gameMapRef.current, zombie, isDeath, combatUi);
    }, [gameMapRef, combatUi]);

    // Fires on every landed player hit (not just kills) — skill progress and its
    // paired attribute-XP trickle are hit-driven now, decoupled from whether the
    // hit happened to be lethal. `announce` preserves the original per-site
    // level-up-log behavior (thrown stones historically stayed silent on level-up).
    const applyHitProgression = useCallback((type, announce = true) => {
        const newLevel = recordHit(type);
        if (announce && newLevel) {
            addLog(`LEVEL UP! ${type.charAt(0).toUpperCase() + type.slice(1)} skill is now level ${newLevel}!`, 'warning');
        }
    }, [recordHit, addLog]);

    // Shared kill handling for direct player attacks (melee / ranged / thrown stone).
    // Handles the kill log, faction-specific drops and the Earbuck award. Skill
    // XP is no longer tied to kills at all — see applyHitProgression, called at
    // hit time regardless of whether the hit was lethal.
    // Per-site quirks are passed as flags so behavior stays byte-for-byte identical:
    //  - lootToGroundIfOnPlayer: ranged drops loot into the ground container when the
    //                            target dies on the player's own tile (melee/stone don't).
    //  - clearNpcInventory:    melee/ranged clear the looted NPC inventory; stone doesn't.
    //  - cancelOnKill:         melee/ranged cancel targeting on kill; stone doesn't.
    const processEntityKill = useCallback((entity, lootX, lootY, flags = {}) => {
        PlayerCombatSystem.processEntityKill({
            gameMap: gameMapRef.current,
            player: playerRef.current,
            entity,
            lootX,
            lootY,
            lootGenerator,
            ...flags,
            ui: combatUi,
        });
    }, [gameMapRef, playerRef, lootGenerator, combatUi]);

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
            } else if (action.type === 'STRUCTURE_INTERACT') {
                if (action.data.broken) {
                    GameEvents.emit(action.data.targetType === 'window' ? GAME_EVENT.WINDOW_SMASH : GAME_EVENT.DOOR_BROKEN, {
                        windowPos: action.data.targetType === 'window' ? action.data.to : undefined,
                        doorPos: (action.data.targetType === 'door' || action.data.targetType === 'garage_door') ? action.data.to : undefined,
                        source
                    });
                }
            } else if (action.type === 'SOUND') {
                if (action.metadata?.sound) playSound(action.metadata.sound, action.metadata.audioOptions);
            }
        });
    }, [addEffect, addLog, playSound]);

    // Thin adapters over the engine. All the combat logic (burst fire, sling ammo,
    // attachments, edge-structure retargeting, turrets, kill loot, degradation)
    // lives in PlayerCombatSystem so the headless harness runs the identical path.
    const performMeleeAttack = useCallback((weapon, targetX, targetY) => {
        return PlayerCombatSystem.performMeleeAttack({
            player: playerRef.current,
            gameMap: gameMapRef.current,
            weapon,
            targetX,
            targetY,
            playerStats,
            inventoryManager: inventoryRef.current,
            lootGenerator,
            targetingWeapon,
            ui: combatUi,
        });
    }, [playerRef, gameMapRef, playerStats, inventoryRef, lootGenerator, targetingWeapon, combatUi]);

    const performRangedAttack = useCallback((weapon, targetX, targetY) => {
        return PlayerCombatSystem.performRangedAttack({
            player: playerRef.current,
            gameMap: gameMapRef.current,
            weapon,
            targetX,
            targetY,
            playerStats,
            inventoryManager: inventoryRef.current,
            lootGenerator,
            targetingWeapon,
            ui: combatUi,
        });
    }, [playerRef, gameMapRef, playerStats, inventoryRef, lootGenerator, targetingWeapon, combatUi]);

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
        const hit = isWindowTarget ? true : gameRandom.next() <= (baseHitChance + accuracyBonus);

        // 6. Projectile Path Tracking
        ProjectileManager.processProjectilePath(gameMap, player.x, player.y, targetX, targetY);

        if (hit) {
            applyHitProgression('ranged', false);
            const damage = gameRandom.nextInt(1, 4); // 1-4 damage
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
                
                targetEntity.takeDamage(damage, player);
                addLog(`Player throws stone: ${damage} damage`, 'combat');

                // Attacking any faction member provokes that whole faction.
                if (targetEntity.type === EntityType.NPC) provokeAndWarn(gameMap, targetEntity, addLog);

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
                        clearNpcInventory: false,
                        cancelOnKill: false,
                    });
                }
            } else if (turret) {
                turret.takeDamage(damage);
                addLog(`You hit the turret with a stone: ${damage} damage`, 'combat');
                // Attacking a faction's turret provokes that whole faction.
                provokeAndWarn(gameMap, turret, addLog);

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
    }, [playerRef, gameMapRef, addEffect, addLog, triggerMapUpdate, forceRefresh, destroyItem, playerStats, processEntityKill, applyHitProgression]);

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
                if (it.defId === 'tool.lighter' || it.defId === 'tool.matchbook' || it.defId === 'tool.bowdrill') {
                    if ((it.ammoCount || 0) > 0) {
                        availableIgniters.push({ item: it, container });
                    }
                }
            }
        }

        // Check equipment
        for (const slot in inventoryManager.equipment) {
            const it = inventoryManager.equipment[slot];
            if (it && (it.defId === 'tool.lighter' || it.defId === 'tool.matchbook' || it.defId === 'tool.bowdrill')) {
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
        if ((selectedIgniter.ammoCount || 0) <= 0 && (selectedIgniter.defId === 'tool.matchbook' || selectedIgniter.defId === 'tool.lighter' || selectedIgniter.defId === 'tool.bowdrill')) {
            if (igniterContainer) {
                igniterContainer.removeItem(selectedIgniter.instanceId);
            } else {
                destroyItem(selectedIgniter.instanceId);
            }
            selectedIgniter.stackCount = 0;
            addLog(`The ${selectedIgniter.name.toLowerCase()} is empty and discarded.`, 'warning');
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
