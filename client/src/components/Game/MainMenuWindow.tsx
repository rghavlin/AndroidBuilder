
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useGame } from '../../contexts/GameContext.jsx';
import { X } from "lucide-react";

interface MainMenuWindowProps {
    onClose: () => void;
}

export default function MainMenuWindow({ onClose }: MainMenuWindowProps) {
    const { initializeGame, loadGameDirect } = useGame();
    const [isLoading, setIsLoading] = useState(false);

    const handleNewGame = async () => {
        setIsLoading(true);
        console.log('[MainMenuWindow] Starting new game...');
        // Initialize new game logic
        await initializeGame();
        onClose(); // Close menu after action
        setIsLoading(false);
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
            <Card className="w-96 bg-card border border-border relative">
                <Button
                    className="absolute right-2 top-2 h-6 w-6 p-0 rounded-full"
                    variant="ghost"
                    onClick={onClose}
                    title="Close Menu"
                >
                    <X className="h-4 w-4" />
                </Button>
                <CardHeader className="text-center pt-8">
                    <CardTitle className="text-2xl font-bold text-foreground">
                        Main Menu
                    </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-4 pb-8">
                    <Button
                        onClick={handleNewGame}
                        disabled={isLoading}
                        className="w-full py-3 text-lg bg-primary hover:bg-primary/90 text-primary-foreground"
                        data-testid="button-menu-new-game"
                    >
                        New Game
                    </Button>

                    <Button
                        onClick={handleLoadGame}
                        disabled={isLoading}
                        className="w-full py-3 text-lg bg-secondary hover:bg-secondary/90 text-secondary-foreground"
                        data-testid="button-menu-load-game"
                    >
                        {isLoading ? 'Loading...' : 'Load Game'}
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
