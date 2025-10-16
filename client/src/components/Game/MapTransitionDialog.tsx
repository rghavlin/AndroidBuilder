
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Button } from '../ui/button';

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
  const message = direction === 'north' 
    ? "Move on down the road?" 
    : `Return to ${nextMapId}?`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Map Transition</DialogTitle>
          <DialogDescription>
            {message}
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <p className="text-sm text-muted-foreground">
            Current map: {currentMapId}
          </p>
          <p className="text-sm text-muted-foreground">
            {direction === 'north' ? 'Next' : 'Previous'} map: {nextMapId}
          </p>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            No
          </Button>
          <Button 
            type="button" 
            onClick={async () => {
              await onConfirm();
              onOpenChange(false);
            }}
          >
            Yes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
