import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';

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
        const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        
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
