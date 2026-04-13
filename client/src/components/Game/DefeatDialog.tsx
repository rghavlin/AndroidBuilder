import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useGame } from '../../contexts/GameContext.jsx';
import { Skull, RotateCcw, Plus, XCircle } from "lucide-react";

export default function DefeatDialog() {
    const { isDefeated, loadGameDirect, initializeGame, setIsDefeated } = useGame();
    const [isLoading, setIsLoading] = useState(false);

    if (!isDefeated) return null;

    const handleReplay = async () => {
        setIsLoading(true);
        console.log('[DefeatDialog] Replaying last turn - loading autosave...');
        const success = await loadGameDirect('autosave');
        if (success) {
            setIsDefeated(false);
        } else {
            console.error('[DefeatDialog] Failed to load autosave for replay');
            // Fallback: stay on defeat screen if load fails for some reason
        }
        setIsLoading(false);
    };

    const handleNewGame = async () => {
        setIsLoading(true);
        console.log('[DefeatDialog] Starting new game...');
        await initializeGame();
        setIsDefeated(false);
        setIsLoading(false);
    };

    const handleQuit = () => {
        console.log('[DefeatDialog] Quitting app...');
        // Attempt to close the window
        window.close();
        
        // Fallback: Refresh/Home redirect if close is blocked
        setTimeout(() => {
            window.location.href = '/';
        }, 100);
    };

    return (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/90 backdrop-blur-md animate-in fade-in duration-500">
            <Card className="w-[400px] bg-zinc-950 border-red-900/50 shadow-[0_0_50px_rgba(153,27,27,0.3)]">
                <CardHeader className="text-center pt-8">
                    <div className="flex justify-center mb-4">
                        <div className="bg-red-900/20 p-4 rounded-full border border-red-900/30">
                            <Skull className="h-12 w-12 text-red-600 animate-pulse" />
                        </div>
                    </div>
                    <CardTitle className="text-3xl font-black text-red-600 tracking-tighter uppercase italic">
                        YOU ARE DEAD
                    </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-3 pb-8 px-8">
                    <Button
                        onClick={handleReplay}
                        disabled={isLoading}
                        className="w-full py-6 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-white font-bold flex items-center justify-center gap-2 group transition-all"
                    >
                        <RotateCcw className="h-4 w-4 group-hover:rotate-[-45deg] transition-transform" />
                        Replay Last Turn
                    </Button>

                    <Button
                        onClick={handleNewGame}
                        disabled={isLoading}
                        className="w-full py-6 bg-red-950/40 hover:bg-red-900/60 border border-red-900/20 text-red-100 font-bold flex items-center justify-center gap-2 group transition-all"
                    >
                        <Plus className="h-4 w-4 group-hover:scale-110 transition-transform" />
                        New Game
                    </Button>

                    <Button
                        onClick={handleQuit}
                        disabled={isLoading}
                        variant="ghost"
                        className="w-full py-4 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/50 flex items-center justify-center gap-2 text-xs uppercase tracking-widest"
                    >
                        <XCircle className="h-3 w-3" />
                        Quit
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
