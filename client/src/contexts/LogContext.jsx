import React, { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react';
import GameEvents, { GAME_EVENT } from '../game/utils/GameEvents.js';
import { EntityType } from '../game/entities/Entity.js';

const LogContext = createContext();

export const useLog = () => {
    const context = useContext(LogContext);
    if (!context) {
        throw new Error('useLog must be used within a LogProvider');
    }
    return context;
};

export const LogProvider = ({ children }) => {
    const [logs, setLogs] = useState([]);
    const MAX_LOGS = 100;
    
    // Ref to throttle atmospheric messages (prevent spamming the same message multiple times per turn)
    const lastAtmosphereLogTime = React.useRef(0);

    const addLog = useCallback((message, type = 'info') => {
        const id = Math.random().toString(36).substr(2, 9);
        const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
        
        // Define colors/styles based on type
        let color = '#ffffff'; // Default white
        switch (type) {
            case 'combat':
                color = '#ef4444'; // Red
                break;
            case 'item':
                color = '#4ade80'; // Green
                break;
            case 'world':
                color = '#fbbf24'; // Amber/Yellow
                break;
            case 'system':
                color = '#9ca3af'; // Gray
                break;
            case 'warning':
                color = '#f97316'; // Orange
                break;
            default:
                color = '#ffffff';
        }

        const newLog = {
            id,
            message,
            type,
            color,
            timestamp
        };

        setLogs(prevLogs => {
            const updatedLogs = [...prevLogs, newLog];
            if (updatedLogs.length > MAX_LOGS) {
                return updatedLogs.slice(updatedLogs.length - MAX_LOGS);
            }
            return updatedLogs;
        });

        // Also log to console for debugging
        console.log(`[GameLog:${type}] ${message}`);
    }, []);

    // Listen for global game events and add to log automatically
    useEffect(() => {
        const handleCombatAttack = (data) => {
            console.log('[LogContext] ⚔️ Combat event received:', data);
            
            // Normalize data between ZOMBIE_ATTACK and NPC_ATTACK structures
            const entity = data.zombie || data.entity || data.npc;
            const isNPC = entity && (entity.type === 'npc' || entity.type === EntityType.NPC);
            const entityName = isNPC ? (entity.name || 'Survivor') : 'Zombie';
            
            const isSuccess = data.success !== undefined ? data.success : data.hit;
            const damage = data.damage || 0;

            if (isSuccess) {
                const hitTimes = data.hitCount > 1 ? ` ${data.hitCount} times` : '';
                addLog(`${entityName} hits${hitTimes} (${damage} damage)`, 'combat');
            } else {
                const attackTimes = data.attackCount > 1 ? `${data.attackCount} times ` : '';
                addLog(`${entityName} attacks ${attackTimes}but misses all!`, 'combat');
            }
            
            if (data.bleedingInflicted) {
                addLog('You have started to bleed!', 'warning');
            }
        };

        const handleStructureDamage = (data) => {
            // If the source is player, don't write a duplicate log since CombatContext handles player logs
            if (data.source === 'player') return;

            const actorName = data.source === 'npc' ? 'Survivor' : 'Zombie';

            if (data.type === 'attackDoor' || data.doorPos) {
                addLog(data.doorBroken || data.broken ? `${actorName} breaks door!` : `${actorName} bangs door!`, 'combat');
            } else if (data.type === 'attackWindow' || data.windowPos) {
                addLog(`${actorName} smashes a window!`, 'combat');
            }
        };

        const handleStructureInteract = (data) => {
            if (data.source === 'player') return;
            const actorName = data.entity?.type === 'npc' ? 'Survivor' : 'Zombie';
            const targetType = data.targetType;
            if (targetType === EntityType.DOOR || targetType === 'door') {
                addLog(`${actorName} bangs on the door!`, 'world');
            } else if (targetType === EntityType.WINDOW || targetType === 'window') {
                addLog(`${actorName} smashes against the window!`, 'world');
            }
        };

        const handlePlayerDamage = (data) => {
            if (data.source?.id === 'disease') {
                addLog('You feel the disease ravaging your body...', 'warning');
            } else if (data.source?.id === 'bleeding') {
                addLog('You are bleeding!', 'warning');
            } else if (data.source?.id === 'glass') {
                addLog('You cut yourself on the broken glass!', 'warning');
            }
        };

        const handleZombieWait = (data) => {
            const now = performance.now();
            // Only log if it's a structural block AND we haven't logged an atmosphere message recently (1.5s)
            if (data.reason === 'Blocked by zombie at structure') {
                if (now - lastAtmosphereLogTime.current > 1500) {
                    addLog('Zombies are stacking up behind the door...', 'world');
                    lastAtmosphereLogTime.current = now;
                }
            }
            // User requested NO message for generic trail blocking, so we suppress it entirely
        };

        GameEvents.on(GAME_EVENT.ZOMBIE_ATTACK, handleCombatAttack);
        GameEvents.on(GAME_EVENT.NPC_ATTACK, handleCombatAttack);
        GameEvents.on(GAME_EVENT.ZOMBIE_WAIT, handleZombieWait);
        GameEvents.on(GAME_EVENT.DOOR_BANG, handleStructureDamage);
        GameEvents.on(GAME_EVENT.DOOR_BROKEN, handleStructureDamage);
        GameEvents.on(GAME_EVENT.WINDOW_SMASH, handleStructureDamage);
        GameEvents.on(GAME_EVENT.STRUCTURE_INTERACT, handleStructureInteract);
        GameEvents.on(GAME_EVENT.PLAYER_DAMAGE, handlePlayerDamage);

        return () => {
            GameEvents.off(GAME_EVENT.ZOMBIE_ATTACK, handleCombatAttack);
            GameEvents.off(GAME_EVENT.NPC_ATTACK, handleCombatAttack);
            GameEvents.off(GAME_EVENT.ZOMBIE_WAIT, handleZombieWait);
            GameEvents.off(GAME_EVENT.DOOR_BANG, handleStructureDamage);
            GameEvents.off(GAME_EVENT.DOOR_BROKEN, handleStructureDamage);
            GameEvents.off(GAME_EVENT.WINDOW_SMASH, handleStructureDamage);
            GameEvents.off(GAME_EVENT.STRUCTURE_INTERACT, handleStructureInteract);
            GameEvents.off(GAME_EVENT.PLAYER_DAMAGE, handlePlayerDamage);
        };
    }, [addLog]);

    const clearLogs = useCallback(() => {
        setLogs([]);
    }, []);

    const value = useMemo(() => ({
        logs,
        addLog,
        clearLogs
    }), [logs, addLog, clearLogs]);

    return (
        <LogContext.Provider value={value}>
            {children}
        </LogContext.Provider>
    );
};
