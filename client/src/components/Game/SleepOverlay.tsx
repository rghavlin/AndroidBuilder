import React from 'react';
import { useGame } from '../../contexts/GameContext.jsx';

export default function SleepOverlay() {
    const { isSleeping, sleepProgress } = useGame();

    if (!isSleeping) return null;

    return (
        <div className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center pointer-events-auto">
            <div className="text-white text-4xl font-bold mb-4 animate-pulse">
                Sleeping...
            </div>
            <div className="text-white/60 text-xl">
                {sleepProgress} hours remaining
            </div>
        </div>
    );
}
