
import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useGame } from '../../contexts/GameContext.jsx';
import { Terminal, Settings } from "lucide-react";
import OptionsWindow from './OptionsWindow';
import musicManager from '@/game/utils/MusicManager';

interface StartMenuProps {
  onStartGame: (mode?: boolean | string) => void;
}

export default function StartMenu({ onStartGame }: StartMenuProps) {
  // Phase 2: Only use GameContext for game lifecycle methods
  const { loadGame, initializeGame } = useGame();
  const [isLoading, setIsLoading] = useState(false);
  const [showOptions, setShowOptions] = useState(false);

  useEffect(() => {
    // Attempt to play the menu music on mount.
    // In environments where autoplay is allowed (or enabled like in Electron), this will work immediately.
    musicManager.playPlaylist('menu');

    // For environments with strict autoplay policies (like standard web browsers),
    // we listen for the first user interaction to start the menu music if it hasn't started yet.
    const handleInteraction = () => {
      // Only play the menu music if it's not already playing AND we haven't already started a game (which sets standard playlist)
      if (!musicManager.isPlaying && musicManager.currentPlaylist !== 'standard') {
        musicManager.playPlaylist('menu');
      }
      // Remove listeners after first interaction
      document.removeEventListener('click', handleInteraction);
      document.removeEventListener('keydown', handleInteraction);
    };

    document.addEventListener('click', handleInteraction);
    document.addEventListener('keydown', handleInteraction);

    return () => {
      document.removeEventListener('click', handleInteraction);
      document.removeEventListener('keydown', handleInteraction);
    };
  }, []);

  const handleNewGame = () => {
    console.log('[StartMenu] Starting new game...');
    musicManager.playPlaylist('standard');
    if (onStartGame) {
      onStartGame(false); // Indicate this is a new game
    }
  };

  const handleLoadGame = async () => {
    setIsLoading(true);
    console.log('[StartMenu] Requesting game initialization with post-load...');
    musicManager.playPlaylist('standard');
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
      <Card className="w-96 metal-panel border-border shadow-2xl">
        <CardHeader className="text-center pb-2">
          <CardTitle className="text-3xl font-black text-foreground drop-shadow-md tracking-wider uppercase">
            Zombie Road
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Button
            onClick={handleNewGame}
            disabled={isLoading}
            className="w-full py-6 text-xl font-bold metal-button-green uppercase tracking-wide"
            data-testid="button-new-game"
          >
            New Game
          </Button>
          
          <Button
            onClick={handleLoadGame}
            disabled={isLoading}
            className="w-full py-5 text-lg font-bold metal-button uppercase tracking-wide"
            data-testid="button-load-game"
          >
            {isLoading ? 'Loading...' : 'Load Game'}
          </Button>

          <Button
            onClick={() => setShowOptions(true)}
            disabled={isLoading}
            className="w-full py-5 text-lg font-bold metal-button uppercase tracking-wide flex items-center justify-center gap-2"
            data-testid="button-start-options"
          >
            <Settings className="h-5 w-5" />
            Options
          </Button>

          <div className="border-t border-border/50 my-2 pt-4">
            <Button
              onClick={() => {
                console.log('[StartMenu] 🖱️ Requesting Dev Console via global event');
                window.dispatchEvent(new CustomEvent('toggle-dev-console', { detail: true }));
              }}
              className="w-full py-4 text-md font-bold metal-button uppercase tracking-wide flex items-center justify-center gap-2"
              data-testid="button-start-dev-console"
            >
              <Terminal className="h-4 w-4" />
              Dev Console
            </Button>
          </div>
        </CardContent>
      </Card>

      {showOptions && <OptionsWindow onClose={() => setShowOptions(false)} />}
    </div>
  );
}
