import React, { useEffect } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ShieldAlert, Skull, Hand, Sword } from "lucide-react";
import { useAudio } from '../../contexts/AudioContext.jsx';

interface NPCDemandDialogProps {
  npc: any;
  onResponse: (choice: 'surrender' | 'refuse') => void;
}

export const NPCDemandDialog: React.FC<NPCDemandDialogProps> = ({ npc, onResponse }) => {
  const { playSound } = useAudio();

  useEffect(() => {
    // Play a warning or tension sound when the dialog appears
    playSound('Click'); // Replace with a better "threat" sound if available
  }, []);

  return (
    <Dialog open={true} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md bg-card border-[#ef4444] border-2 shadow-[0_0_20px_rgba(239,68,68,0.3)]">
        <DialogHeader className="space-y-3">
          <div className="mx-auto w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center border border-red-500/50">
            <ShieldAlert className="w-8 h-8 text-red-500 animate-pulse" />
          </div>
          <DialogTitle className="text-2xl font-bold text-center text-foreground uppercase tracking-tighter">
            Hostile Confrontation
          </DialogTitle>
          <DialogDescription className="text-center text-muted-foreground text-base">
            <span className="text-red-400 font-bold">{npc.name}</span> has cornered you and made a clear demand.
          </DialogDescription>
        </DialogHeader>

        <div className="bg-muted border border-border rounded-lg p-6 my-4 italic text-foreground text-lg text-center leading-relaxed">
          "Drop everything you've got right now, and maybe I'll let you walk away with your life. Don't make this difficult."
        </div>

        <div className="grid grid-cols-1 gap-4 text-sm text-muted-foreground px-2">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
            <p>Refusing will lead to immediate combat.</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            <p>Surrendering will transfer all your gear (except clothing) to them.</p>
          </div>
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-3 pt-4">
          <Button 
            variant="outline"
            className="flex-1 bg-transparent border-border text-muted-foreground hover:bg-secondary hover:text-foreground h-12 font-bold transition-all group"
            onClick={() => onResponse('refuse')}
          >
            <Sword className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" />
            REFUSE & FIGHT
          </Button>
          <Button 
            className="flex-1 bg-red-600 hover:bg-red-700 text-white h-12 font-bold shadow-lg shadow-red-900/20 transition-all group"
            onClick={() => onResponse('surrender')}
          >
            <Hand className="w-4 h-4 mr-2 group-hover:-translate-y-1 transition-transform" />
            SURRENDER GEAR
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
