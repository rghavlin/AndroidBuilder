import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import GameEvents, { GAME_EVENT } from '../game/utils/GameEvents.js';
import engine from '../game/GameEngine.js';

const VisualEffectsContext = createContext();

export const useVisualEffects = () => {
    const context = useContext(VisualEffectsContext);
    if (!context) {
        // Return a dummy object if context is missing (prevents crashes during initialization)
        return {
            effects: [],
            addEffect: () => { }
        };
    }
    return context;
};

/**
 * VisualEffectsProvider - Manages temporary visual effects like damage numbers and flashes
 */
export const VisualEffectsProvider = ({ children }) => {
    const [effects, setEffects] = useState([]);
    const effectsRef = useRef([]);

    /**
     * Add a new visual effect
     * @param {Object} effect - Effect properties { type, x, y, value, color, duration }
     */
    const addEffect = useCallback((effect) => {
        const newEffect = {
            id: `eff_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
            startTime: performance.now(),
            duration: 1000, // Default duration 1s
            ...effect
        };

        effectsRef.current = [...effectsRef.current, newEffect];
        setEffects(effectsRef.current);

        console.debug(`[VisualEffects] Added effect: ${newEffect.type} at (${newEffect.x}, ${newEffect.y})`);
    }, []);

    // Animation and cleanup loop
    useEffect(() => {
        if (effects.length === 0) return;

        let animationFrame;

        const animate = () => {
            const now = performance.now();
            const initialCount = effectsRef.current.length;

            // Filter out expired effects
            effectsRef.current = effectsRef.current.filter(e => now - e.startTime < e.duration);

            // Perf Phase 4: only push React state when the effect set actually
            // changed (something expired). We no longer force a per-frame
            // re-render (the old setTick) — the canvas render loop animates live
            // effects itself by reading each effect's startTime/duration, and
            // Phase 1 keeps it painting while effects.length > 0. This keeps a
            // burst of damage numbers/flashes from thrashing every context
            // consumer 60x/sec.
            if (effectsRef.current.length !== initialCount) {
                setEffects([...effectsRef.current]);
            }

            // Keep polling for expiry while any effect is alive (cheap: just the
            // filter above, no setState unless something expired).
            if (effectsRef.current.length > 0) {
                animationFrame = requestAnimationFrame(animate);
            } else {
                animationFrame = null;
            }
        };

        animationFrame = requestAnimationFrame(animate);

        return () => {
            if (animationFrame) cancelAnimationFrame(animationFrame);
        };
    }, [effects.length]);

    // Listen for global game events that trigger visual effects
    useEffect(() => {
        const handleProjectile = (data) => {
            console.log('[VisualEffects] Projectile event received:', data);
            addEffect({
                type: 'projectile',
                x: data.x,
                y: data.y,
                targetX: data.targetX,
                targetY: data.targetY,
                color: data.color || '#a855f7',
                duration: data.duration || 400,
                startTime: performance.now()
            });
        };

        const handleBlink = (data) => {
            addEffect({
                type: 'flicker',
                x: data.x,
                y: data.y,
                duration: data.duration || 500,
                startTime: performance.now()
            });
        };

        // Gunshot: one bright warm snap on the shooter's tile, short enough to
        // read as a muzzle flash rather than a lingering highlight.
        const handleMuzzleFlash = (data) => {
            addEffect({
                type: 'tile_flash',
                x: data.x,
                y: data.y,
                color: data.color || 'rgba(255, 231, 156, 0.9)',
                duration: data.duration || 160,
                startTime: performance.now()
            });
        };

        const handleTurretFired = (data) => {
            console.log('[VisualEffects] Turret fired event received:', data);
            addEffect({
                type: 'tile_flash',
                x: data.turretX,
                y: data.turretY,
                color: 'rgba(255, 255, 255, 0.8)',
                duration: 300,
                startTime: performance.now()
            });
        };

        const handleZombieKilled = (data) => {
            console.log('[VisualEffects] Zombie killed event received:', data);
            addEffect({
                type: 'tile_flash',
                x: data.x,
                y: data.y,
                color: 'rgba(139, 0, 0, 0.7)',
                duration: 800,
                startTime: performance.now()
            });
        };

        const handleZombieDiedRealTime = (data) => {
            const isSimulating = engine?.gameMap?.constructor?.isSimulating || false;
            if (!isSimulating && data.entity) {
                console.log('[VisualEffects] Zombie died in real-time:', data.entity.id);
                addEffect({
                    type: 'tile_flash',
                    x: data.entity.logicalX ?? data.entity.x,
                    y: data.entity.logicalY ?? data.entity.y,
                    color: 'rgba(139, 0, 0, 0.7)',
                    duration: 800,
                    startTime: performance.now()
                });
            }
        };

        GameEvents.on(GAME_EVENT.PROJECTILE_FIRED, handleProjectile);
        GameEvents.on(GAME_EVENT.MUZZLE_FLASH, handleMuzzleFlash);
        GameEvents.on(GAME_EVENT.ENTITY_BLINK, handleBlink);
        GameEvents.on(GAME_EVENT.TURRET_FIRED, handleTurretFired);
        GameEvents.on(GAME_EVENT.ZOMBIE_KILLED, handleZombieKilled);
        GameEvents.on(GAME_EVENT.ZOMBIE_DIED, handleZombieDiedRealTime);
        return () => {
            GameEvents.off(GAME_EVENT.PROJECTILE_FIRED, handleProjectile);
            GameEvents.off(GAME_EVENT.MUZZLE_FLASH, handleMuzzleFlash);
            GameEvents.off(GAME_EVENT.ENTITY_BLINK, handleBlink);
            GameEvents.off(GAME_EVENT.TURRET_FIRED, handleTurretFired);
            GameEvents.off(GAME_EVENT.ZOMBIE_KILLED, handleZombieKilled);
            GameEvents.off(GAME_EVENT.ZOMBIE_DIED, handleZombieDiedRealTime);
        };
    }, [addEffect]);

    return (
        <VisualEffectsContext.Provider value={{ effects, addEffect }}>
            {children}
        </VisualEffectsContext.Provider>
    );
};
