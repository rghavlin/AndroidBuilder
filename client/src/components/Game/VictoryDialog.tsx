import React, { useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useGame } from '../../contexts/GameContext.jsx';
import { useAudio } from '../../contexts/AudioContext.jsx';
import GameEvents, { GAME_EVENT } from '../../game/utils/GameEvents.js';
import { Trophy, Play, LogOut } from "lucide-react";

/**
 * VictoryDialog - full-screen win popup. Opens when GAME_EVENT.GAME_WON fires
 * (synthesizing the Zombie Virus Cure from Patient Zero's head) and plays the
 * victory fanfare. Self-contained: listens on the event bus, owns its own
 * open state, so the engine side only has to emit the event.
 */
export default function VictoryDialog() {
    const { shutdownGame } = useGame();
    const { playSound } = useAudio();
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        const handleGameWon = () => setIsOpen(true);
        GameEvents.on(GAME_EVENT.GAME_WON, handleGameWon);
        return () => {
            GameEvents.off(GAME_EVENT.GAME_WON, handleGameWon);
        };
    }, []);

    useEffect(() => {
        if (isOpen) playSound('Victory');
    }, [isOpen, playSound]);

    if (!isOpen) return null;

    const handleReturnToMenu = () => {
        setIsOpen(false);
        if (shutdownGame) shutdownGame();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md animate-in fade-in duration-500 pointer-events-auto">
            <Card className="w-[440px] bg-zinc-950 border-emerald-800/50 shadow-[0_0_50px_rgba(16,185,129,0.3)]">
                <CardHeader className="text-center pt-8">
                    <div className="flex justify-center mb-4">
                        <div className="bg-emerald-900/20 p-4 rounded-full border border-emerald-800/30">
                            <Trophy className="h-12 w-12 text-emerald-400 animate-pulse" />
                        </div>
                    </div>
                    <CardTitle className="text-3xl font-black text-emerald-400 tracking-tighter uppercase italic">
                        Victory!
                    </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-4 pb-8 px-8">
                    <p className="text-center text-lg text-zinc-100 leading-snug">
                        You've created a cure for the zombie virus! You've won the game! Of life!
                    </p>

                    <Button
                        onClick={() => setIsOpen(false)}
                        className="w-full py-6 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-white font-bold flex items-center justify-center gap-2 transition-all"
                    >
                        <Play className="h-4 w-4" />
                        Keep Playing
                    </Button>

                    <Button
                        onClick={handleReturnToMenu}
                        className="w-full py-6 bg-emerald-950/40 hover:bg-emerald-900/60 border border-emerald-900/20 text-emerald-100 font-bold flex items-center justify-center gap-2 transition-all"
                    >
                        <LogOut className="h-4 w-4" />
                        Return to Main Menu
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
