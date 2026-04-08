
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useGame } from '../../contexts/GameContext.jsx';
import { Terminal } from "lucide-react";
import DevConsole from './DevConsole';

interface StartMenuProps {
  onStartGame: (mode?: boolean | string) => void;
}

export default function StartMenu({ onStartGame }: StartMenuProps) {
  // Phase 2: Only use GameContext for game lifecycle methods
  const { loadGame, initializeGame, toggleDevConsole } = useGame();
  const [isLoading, setIsLoading] = useState(false);

  const handleNewGame = () => {
    console.log('[StartMenu] Starting new game...');
    if (onStartGame) {
      onStartGame(false); // Indicate this is a new game
    }
  };

  const handleLoadGame = async () => {
    setIsLoading(true);
    console.log('[StartMenu] Requesting game initialization with post-load...');
    if (onStartGame) {
      onStartGame('load'); // Pass 'load' to indicate we want to load after init
    }
    setIsLoading(false);
  };

  const handleCustomLaunch = async (config: any) => {
    // This is now handled by the parent GameScreen, but we keep the prop for internal state if needed
    // Actually, we should just call the parent's launch if we were still using local state, 
    // but we are switching strictly to global.
  };

  return (
    <div className="h-screen w-screen bg-background flex items-center justify-center">
      <Card className="w-96 bg-card border border-border">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-foreground">
            Zombie Road
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Button
            onClick={handleNewGame}
            disabled={isLoading}
            className="w-full py-3 text-lg bg-primary hover:bg-primary/90 text-primary-foreground"
            data-testid="button-new-game"
          >
            New Game
          </Button>
          
          <Button
            onClick={handleLoadGame}
            disabled={isLoading}
            className="w-full py-3 text-lg bg-secondary hover:bg-secondary/90 text-secondary-foreground"
            data-testid="button-load-game"
          >
            {isLoading ? 'Loading...' : 'Load Game'}
          </Button>

          <div className="border-t border-border/50 my-2 pt-4">
            <Button
              onClick={() => {
                console.log('[StartMenu] 🖱️ Requesting Dev Console via context');
                toggleDevConsole(true);
              }}
              variant="outline"
              className="w-full flex items-center justify-center gap-2 border-primary/30 text-primary/80 hover:text-primary hover:border-primary transition-all"
              data-testid="button-start-dev-console"
            >
              <Terminal className="h-4 w-4" />
              Dev Console
            </Button>
          </div>
        </CardContent>
      </Card>


    </div>
  );
}
