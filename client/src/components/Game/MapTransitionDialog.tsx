import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Button } from '../ui/button';

interface MapTransitionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => Promise<boolean> | void;
  direction: 'north' | 'south';
  currentMapId: string;
  nextMapId: string;
  isCustom?: boolean;
}

export const MapTransitionDialog: React.FC<MapTransitionDialogProps> = ({
  open,
  onOpenChange,
  onConfirm,
  direction,
  currentMapId,
  nextMapId,
  isCustom = false,
}) => {
  const message = direction === 'north' 
    ? "Move on down the road?" 
    : "Return to previous area?";

  const handleYes = async () => {
    const success = await onConfirm();
    if (success !== false) {
      onOpenChange(false);
    }
  };

  const handleClose = (newOpen: boolean) => {
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[480px] bg-background border border-border text-foreground shadow-2xl backdrop-blur-md rounded-2xl p-6 transition-all duration-300 pointer-events-auto flex flex-col overflow-hidden">
        <DialogHeader className="space-y-3 flex-shrink-0">
          <DialogTitle className="text-xl font-bold tracking-tight text-center text-foreground">
            {message}
          </DialogTitle>
        </DialogHeader>
        <DialogFooter className="mt-6 flex gap-3 sm:justify-center flex-shrink-0">
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
      </DialogContent>
    </Dialog>
  );
};

