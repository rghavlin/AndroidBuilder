import React from 'react';
import { cn } from "@/lib/utils";
import { X } from "lucide-react";

interface TradeDialogProps {
  npc: any;
  onClose: () => void;
  onStartBarter: () => void;
}

/**
 * TradeDialog - High-impact modal for NPC interactions
 * Handles both neutral trading and hostile demands
 */
export function TradeDialog({ npc, onClose, onStartBarter }: TradeDialogProps) {
  if (!npc) return null;

  const isHostile = npc.isHostile;

  return (
    <div className="fixed inset-0 z-[11000] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-300">
      {/* Click outside to close (neutral only maybe? but keeping simple for now) */}
      <div className="absolute inset-0" onClick={onClose} />
      
      <div className="relative bg-[#121212] border border-white/10 rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.5)] max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header Header Header */}
        <div className={cn(
          "h-1.5 w-full",
          isHostile ? "bg-red-600 shadow-[0_0_15px_rgba(220,38,38,0.5)]" : "bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)]"
        )} />
        
        <div className="p-8">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h3 className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.3em] mb-1">
                Interaction: {isHostile ? 'Threat' : 'Barter'}
              </h3>
              <h2 className="text-3xl font-black text-white tracking-tighter uppercase italic">
                {npc.name}
              </h2>
            </div>
            <button 
              onClick={onClose}
              className="p-1 hover:bg-white/10 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-zinc-500" />
            </button>
          </div>
          
          <div className="bg-white/5 border border-white/5 rounded-xl p-5 mb-8 relative">
             <div className="absolute -top-3 left-4 bg-[#121212] px-2 text-[9px] font-bold text-zinc-600 uppercase tracking-widest italic">Message</div>
             <p className="text-zinc-200 leading-relaxed font-medium">
              {isHostile 
                ? "\"I'm only going to say this once. Give me everything you've got. Backpack, weapons, all of it. Now. Or we find out how fast you bleed.\""
                : "\"Hey there. Glad to see another face that isn't rotting. I've got a few supplies to spare if you've got the coin or trade. Interested?\""}
            </p>
          </div>
          
          <div className="space-y-3">
            {!isHostile ? (
              <button 
                onClick={onStartBarter}
                className="group relative w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-lg transition-all active:scale-[0.98] uppercase tracking-widest text-xs overflow-hidden"
              >
                <div className="relative z-10 flex items-center justify-center gap-2">
                  Barter
                </div>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-shimmer" />
              </button>
            ) : (
              <button 
                onClick={onClose}
                className="group relative w-full py-4 bg-red-600 hover:bg-red-500 text-white font-black rounded-lg transition-all active:scale-[0.98] uppercase tracking-widest text-xs overflow-hidden"
              >
                <div className="relative z-10 flex items-center justify-center gap-2">
                  Comply (Coming Soon)
                </div>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-shimmer" />
              </button>
            )}
            
            <button 
              onClick={onClose}
              className="w-full py-4 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white font-black rounded-lg transition-all uppercase tracking-widest text-[10px]"
            >
              Decline & Walk Away
            </button>
          </div>
        </div>
        
        {/* Footer decoration */}
        <div className="bg-zinc-950 p-3 flex justify-center">
            <span className="text-[8px] text-zinc-800 font-bold uppercase tracking-[0.5em]">End of Transmission</span>
        </div>
      </div>
    </div>
  );
}
