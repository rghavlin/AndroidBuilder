import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';

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
    const [tick, setTick] = useState(0);

    /**
     * Add a new visual effect
     * @param {Object} effect - Effect properties { type, x, y, value, color, duration }
     */
    const addEffect = useCallback((effect) => {
        const newEffect = {
            id: `eff_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
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
        let lastTime = performance.now();

        const animate = (currentTime) => {
            const now = performance.now();
            const initialCount = effectsRef.current.length;

            // Filter out expired effects
            effectsRef.current = effectsRef.current.filter(e => now - e.startTime < e.duration);

            // If any effects were removed, update state
            if (effectsRef.current.length !== initialCount) {
                setEffects([...effectsRef.current]);
            }

            // If we still have effects, trigger a re-render for movement animation
            if (effectsRef.current.length > 0) {
                setTick(t => t + 1);
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

    return (
        <VisualEffectsContext.Provider value={{ effects, addEffect, tick }}>
            {children}
        </VisualEffectsContext.Provider>
    );
};
