import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Progress } from '../ui/progress';
import { Trophy, Compass, Clock, Skull, ArrowRight } from 'lucide-react';
import engine from '../../game/GameEngine.js';

interface MapTransitionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  direction: 'north' | 'south';
  currentMapId: string;
  nextMapId: string;
}

export const MapTransitionDialog: React.FC<MapTransitionDialogProps> = ({
  open,
  onOpenChange,
  onConfirm,
  direction,
  currentMapId,
  nextMapId,
}) => {
  const [showStats, setShowStats] = useState(false);

  const message = direction === 'north' 
    ? "Move on down the road?" 
    : "Return to previous area?";

  const handleYes = async () => {
    if (direction === 'south') {
      const success = await onConfirm();
      if (success !== false) {
        onOpenChange(false);
      }
    } else {
      if (engine.worldManager) {
        engine.worldManager.markMapCompleted(currentMapId, engine.turn);
      }
      setShowStats(true);
    }
  };

  const handleProceed = async () => {
    const success = await onConfirm();
    if (success !== false) {
      onOpenChange(false);
      setShowStats(false);
    } else {
      console.error('[MapTransitionDialog] Transition failed, keeping dialog open');
    }
  };

  const handleClose = (newOpen: boolean) => {
    onOpenChange(newOpen);
    if (!newOpen) {
      setShowStats(false);
    }
  };

  // Compute stats if showing stats screen
  let totalCompleted = 1;
  let turnsElapsed = 0;
  let exploredPercent = 0;
  let zombiesPercent = 0;

  if (showStats) {
    if (engine.worldManager) {
      totalCompleted = engine.worldManager.completedMaps.length;
      const frozenTurns = engine.worldManager.turnsFromEntryToExit?.[currentMapId];
      if (frozenTurns !== undefined) {
        turnsElapsed = frozenTurns;
      } else {
        const entryTurn = engine.worldManager.firstEntryTurn[currentMapId] || 1;
        turnsElapsed = Math.max(0, engine.turn - entryTurn);
      }
      zombiesPercent = engine.worldManager.getZombieKillsPercentage(currentMapId);
    }
    if (engine.gameMap) {
      exploredPercent = engine.gameMap.getExplorationPercentage();
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[480px] bg-background border border-border text-foreground shadow-2xl backdrop-blur-md rounded-2xl p-6 transition-all duration-300 pointer-events-auto">
        {!showStats ? (
          <>
            <DialogHeader className="space-y-3">
              <DialogTitle className="text-xl font-bold tracking-tight text-center text-foreground">
                {message}
              </DialogTitle>
            </DialogHeader>
            <DialogFooter className="mt-6 flex gap-3 sm:justify-center">
              <Button
                onClick={() => handleClose(false)}
                className="flex-1 py-5 text-md font-bold metal-button uppercase tracking-wide border-none"
              >
                No
              </Button>
              <Button 
                type="button" 
                onClick={handleYes}
                className="flex-1 py-5 text-md font-bold metal-button-green uppercase tracking-wide border-none"
              >
                Yes
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader className="space-y-1 text-center">
              <div className="mx-auto w-12 h-12 rounded-full bg-muted border border-border flex items-center justify-center mb-2">
                <Trophy className="w-6 h-6 text-foreground" />
              </div>
              <DialogTitle className="text-2xl font-black tracking-wider text-foreground">
                MAP COMPLETED
              </DialogTitle>
            </DialogHeader>

            <div className="my-6 space-y-4">
              {/* Stat Card 1: Total Maps Completed */}
              <div className="flex items-center gap-4 bg-muted/30 border border-border/50 rounded-xl p-3.5 hover:border-border transition-all duration-200">
                <div className="w-10 h-10 rounded-lg bg-muted border border-border flex items-center justify-center shrink-0">
                  <Trophy className="w-5 h-5 text-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground font-semibold tracking-wide">Total Maps Completed</p>
                  <p className="text-lg font-black text-foreground">{totalCompleted}</p>
                </div>
              </div>

              {/* Stat Card 2: Turns to Traverse */}
              <div className="flex items-center gap-4 bg-muted/30 border border-border/50 rounded-xl p-3.5 hover:border-border transition-all duration-200">
                <div className="w-10 h-10 rounded-lg bg-muted border border-border flex items-center justify-center shrink-0">
                  <Clock className="w-5 h-5 text-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground font-semibold tracking-wide">Turns from entry to exit</p>
                  <p className="text-lg font-black text-foreground">{turnsElapsed} {turnsElapsed === 1 ? 'Turn' : 'Turns'}</p>
                </div>
              </div>

              {/* Stat Card 3: Map Explored */}
              <div className="bg-muted/30 border border-border/50 rounded-xl p-3.5 space-y-2.5 hover:border-border transition-all duration-200">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-muted border border-border flex items-center justify-center shrink-0">
                    <Compass className="w-5 h-5 text-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground font-semibold tracking-wide">Map Explored</p>
                    <p className="text-lg font-black text-foreground">{exploredPercent}%</p>
                  </div>
                </div>
                <Progress value={exploredPercent} className="h-1.5 bg-muted" />
              </div>

              {/* Stat Card 4: Zombies Defeated */}
              <div className="bg-muted/30 border border-border/50 rounded-xl p-3.5 space-y-2.5 hover:border-border transition-all duration-200">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-muted border border-border flex items-center justify-center shrink-0">
                    <Skull className="w-5 h-5 text-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground font-semibold tracking-wide">Zombies Defeated</p>
                    <p className="text-lg font-black text-foreground">{zombiesPercent}%</p>
                  </div>
                </div>
                <Progress value={zombiesPercent} className="h-1.5 bg-muted" />
              </div>
            </div>

            <DialogFooter className="flex gap-3 sm:justify-center mt-6">
              <Button
                onClick={() => handleClose(false)}
                className="flex-1 py-5 text-md font-bold metal-button uppercase tracking-wide border-none"
              >
                Cancel
              </Button>
              <Button 
                type="button" 
                onClick={handleProceed}
                className="flex-1 py-5 text-md font-bold metal-button-green uppercase tracking-wide border-none flex items-center justify-center gap-1.5 group"
              >
                Continue
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};
