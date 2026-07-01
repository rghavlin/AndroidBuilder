import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '../ui/dialog';
import { Button } from '../ui/button';

interface TutorialEndDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onContinue: () => Promise<boolean> | void;
  onNewGame: () => void;
}

export const TutorialEndDialog: React.FC<TutorialEndDialogProps> = ({
  open,
  onOpenChange,
  onContinue,
  onNewGame,
}) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleContinue = async () => {
    setIsLoading(true);
    const success = await onContinue();
    setIsLoading(false);
    if (success !== false) onOpenChange(false);
  };

  const handleNewGame = () => {
    onOpenChange(false);
    onNewGame();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !isLoading && onOpenChange(o)}>
      <DialogContent className="sm:max-w-[480px] bg-background border border-border text-foreground shadow-2xl backdrop-blur-md rounded-2xl p-6 transition-all duration-300 pointer-events-auto flex flex-col overflow-hidden">
        <DialogHeader className="space-y-3 flex-shrink-0">
          <DialogTitle className="text-xl font-bold tracking-tight text-center text-foreground">
            Tutorial Complete
          </DialogTitle>
          <DialogDescription className="text-center text-muted-foreground">
            How would you like to continue?
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3 mt-4">
          <Button
            type="button"
            onClick={handleContinue}
            disabled={isLoading}
            className="w-full py-5 text-md font-bold metal-button-green uppercase tracking-wide border-none"
          >
            {isLoading ? 'Loading…' : 'Continue from here'}
          </Button>
          <p className="text-xs text-muted-foreground text-center px-2">
            Keep your items and head into the world.
          </p>

          <Button
            type="button"
            onClick={handleNewGame}
            disabled={isLoading}
            className="w-full py-5 text-md font-bold metal-button uppercase tracking-wide border-none"
          >
            Start from scratch
          </Button>
          <p className="text-xs text-muted-foreground text-center px-2">
            Begin a fresh game without tutorial items.
          </p>
        </div>

        <DialogFooter className="mt-4 flex-shrink-0">
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
            className="w-full text-sm text-muted-foreground"
          >
            Go back
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
