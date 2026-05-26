
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useGame } from '../../contexts/GameContext.jsx';
import OptionsWindow from './OptionsWindow';
import HelpWindow from './HelpWindow';
import { X, Settings, HelpCircle } from "lucide-react";

interface MainMenuWindowProps {
    onClose: () => void;
}

export default function MainMenuWindow({ onClose }: MainMenuWindowProps) {
    const { initializeGame, loadGameDirect } = useGame();
    const [isLoading, setIsLoading] = useState(false);
    const [showOptions, setShowOptions] = useState(false);
    const [showHelp, setShowHelp] = useState(false);

    const handleNewGame = async () => {
        setIsLoading(true);
        console.log('[MainMenuWindow] Starting new game...');
        // Initialize new game logic
        await initializeGame();
        onClose(); // Close menu after action
        setIsLoading(false);
    };

    const handleCustomLaunch = async (config: any) => {
        // Now handled by GameScreen global render
    };

    const handleLoadGame = async () => {
        setIsLoading(true);
        console.log('[MainMenuWindow] Loading saved game...');
        // Load game logic - using same 'autosave' default as GameScreen
        const success = await loadGameDirect('autosave');
        if (success) {
            console.log('[MainMenuWindow] Load successful');
            onClose();
        } else {
            console.warn('[MainMenuWindow] Load failed');
            // Optionally show feedback, for now just log
        }
        setIsLoading(false);
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-sm pointer-events-auto">
            <Card className="w-96 metal-panel border-border shadow-2xl relative">
                <Button
                    className="absolute right-2 top-2 h-6 w-6 p-0 rounded-full"
                    variant="ghost"
                    onClick={onClose}
                    title="Close Menu"
                >
                    <X className="h-4 w-4" />
                </Button>
                <CardHeader className="text-center pt-8 pb-2">
                    <CardTitle className="text-3xl font-black text-foreground drop-shadow-md tracking-wider uppercase">
                        Main Menu
                    </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-4 pb-8">
                    <Button
                        onClick={handleNewGame}
                        disabled={isLoading}
                        className="w-full py-6 text-xl font-bold metal-button-green uppercase tracking-wide"
                        data-testid="button-menu-new-game"
                    >
                        New Game
                    </Button>

                    <Button
                        onClick={handleLoadGame}
                        disabled={isLoading}
                        className="w-full py-5 text-lg font-bold metal-button uppercase tracking-wide"
                        data-testid="button-menu-load-game"
                    >
                        {isLoading ? 'Loading...' : 'Continue'}
                    </Button>

                    <Button
                        onClick={() => setShowOptions(true)}
                        disabled={isLoading}
                        className="w-full py-5 text-lg font-bold metal-button uppercase tracking-wide flex items-center justify-center gap-2"
                        data-testid="button-menu-options"
                    >
                        <Settings className="h-5 w-5" />
                        Options
                    </Button>

                    <Button
                        onClick={() => setShowHelp(true)}
                        disabled={isLoading}
                        className="w-full py-5 text-lg font-bold metal-button uppercase tracking-wide flex items-center justify-center gap-2"
                        data-testid="button-menu-help"
                    >
                        <HelpCircle className="h-5 w-5" />
                        Help
                    </Button>

                </CardContent>
            </Card>

            {showOptions && <OptionsWindow onClose={() => setShowOptions(false)} />}
            {showHelp && <HelpWindow onClose={() => setShowHelp(false)} />}
        </div>
    );
}
