import React, { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react';
import GameEvents, { GAME_EVENT } from '../game/utils/GameEvents.js';

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
        const handleZombieAttack = (data) => {
            if (data.success) {
                addLog(`Zombie attacks: ${data.damage} damage`, 'combat');
            } else {
                addLog('Zombie attacks but misses!', 'combat');
            }
            if (data.bleedingInflicted) {
                addLog('You have started to bleed!', 'warning');
            }
        };

        const handleStructureDamage = (data) => {
            // Check both the emitted event type (if any) and the action type
            if (data.type === 'attackDoor' || data.doorPos) {
                addLog(data.doorBroken ? 'Zombie breaks door!' : 'Zombie bangs door!', 'combat');
            } else if (data.type === 'attackWindow' || data.windowPos) {
                addLog('Zombie smashes a window!', 'combat');
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
            // Only log if it's a specific "blocked" wait to avoid spamming general waits
            if (data.reason === 'Blocked by zombie on trail') {
                addLog('Zombies are stacking up behind the door...', 'world');
            }
        };

        GameEvents.on(GAME_EVENT.ZOMBIE_ATTACK, handleZombieAttack);
        GameEvents.on(GAME_EVENT.ZOMBIE_WAIT, handleZombieWait);
        GameEvents.on(GAME_EVENT.DOOR_BANG, handleStructureDamage);
        GameEvents.on(GAME_EVENT.DOOR_BROKEN, handleStructureDamage);
        GameEvents.on(GAME_EVENT.WINDOW_SMASH, handleStructureDamage);
        GameEvents.on(GAME_EVENT.PLAYER_DAMAGE, handlePlayerDamage);

        return () => {
            GameEvents.off(GAME_EVENT.ZOMBIE_ATTACK, handleZombieAttack);
            GameEvents.off(GAME_EVENT.ZOMBIE_WAIT, handleZombieWait);
            GameEvents.off(GAME_EVENT.DOOR_BANG, handleStructureDamage);
            GameEvents.off(GAME_EVENT.DOOR_BROKEN, handleStructureDamage);
            GameEvents.off(GAME_EVENT.WINDOW_SMASH, handleStructureDamage);
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
