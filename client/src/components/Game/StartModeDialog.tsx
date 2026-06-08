import React from 'react';
import { Shield, Flame } from "lucide-react";

interface StartModeDialogProps {
  onSelect: (easyStart: boolean) => void;
}

export default function StartModeDialog({ onSelect }: StartModeDialogProps) {
  return (
    <div 
      className="fixed inset-0 z-[150] bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 pointer-events-auto animate-in fade-in duration-200"
      data-testid="start-mode-dialog"
    >
      <div className="bg-zinc-950 border border-zinc-800 p-6 rounded-2xl max-w-xs w-full shadow-[0_0_50px_rgba(0,0,0,0.85)] relative flex flex-col gap-3">
        
        <div className="flex flex-col gap-3">
          {/* Easy Start Option */}
          <button
            onClick={() => onSelect(true)}
            className="flex items-center gap-4 p-4 rounded-xl border border-emerald-500/20 bg-emerald-950/5 hover:bg-emerald-950/15 hover:border-emerald-500/50 transition-all duration-200 group text-left cursor-pointer w-full"
            data-testid="easy-start-option"
          >
            <div className="p-2.5 bg-emerald-500/10 rounded-lg border border-emerald-500/20 group-hover:scale-105 transition-transform duration-200 flex items-center justify-center">
              <Shield className="h-5 w-5 text-emerald-400" />
            </div>
            <h3 className="text-base font-black text-emerald-400 uppercase tracking-wider select-none">
              Easy Start
            </h3>
          </button>

          {/* Normal Start Option */}
          <button
            onClick={() => onSelect(false)}
            className="flex items-center gap-4 p-4 rounded-xl border border-zinc-800 bg-zinc-900/40 hover:bg-zinc-900/80 hover:border-zinc-700 transition-all duration-200 group text-left cursor-pointer w-full"
            data-testid="normal-start-option"
          >
            <div className="p-2.5 bg-zinc-800 rounded-lg border border-zinc-700 group-hover:scale-105 transition-transform duration-200 flex items-center justify-center">
              <Flame className="h-5 w-5 text-zinc-400" />
            </div>
            <h3 className="text-base font-black text-zinc-300 uppercase tracking-wider select-none">
              Normal Start
            </h3>
          </button>
        </div>
      </div>
    </div>
  );
}
