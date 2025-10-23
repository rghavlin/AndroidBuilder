
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useGame } from '../../contexts/GameContext.jsx';

interface StartMenuProps {
  onStartGame: (mode?: boolean | string) => void;
}

export default function StartMenu({ onStartGame }: StartMenuProps) {
  // Phase 2: Only use GameContext for game lifecycle methods
  const { initializeGame, loadGame } = useGame();
  const [isLoading, setIsLoading] = useState(false);

  const handleNewGame = async () => {
    setIsLoading(true);
    console.log('[StartMenu] Initializing new game...');
    
    // Initialize the game first
    const { initializeGame } = useGame();
    await initializeGame(false); // false = no post-load
    
    console.log('[StartMenu] Game initialized, starting...');
    if (onStartGame) {
      onStartGame(false); // Indicate this is a new game
    }
    setIsLoading(false);
  };

  const handleLoadGame = async () => {
    setIsLoading(true);
    console.log('[StartMenu] Requesting game initialization with post-load...');
    if (onStartGame) {
      onStartGame('load'); // Pass 'load' to indicate we want to load after init
    }
    setIsLoading(false);
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
            {isLoading ? 'Initializing...' : 'New Game'}
          </Button>
          
          <Button
            onClick={handleLoadGame}
            disabled={isLoading}
            className="w-full py-3 text-lg bg-secondary hover:bg-secondary/90 text-secondary-foreground"
            data-testid="button-load-game"
          >
            {isLoading ? 'Loading...' : 'Load Game'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
