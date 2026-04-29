import React, { useEffect, useState } from 'react';
import { useInventory } from '@/contexts/InventoryContext';
import { useAudio } from '@/contexts/AudioContext.jsx';
import { useLog } from '@/contexts/LogContext.jsx';
import ContainerGrid from '../Inventory/ContainerGrid';
import engine from '@/game/GameEngine.js';
import tradingSystem from '@/game/systems/TradingSystem.js';
import { X } from 'lucide-react';
import { cn } from "@/lib/utils";
import { GridSizeProvider } from "@/contexts/GridSizeContext";

interface BarterWindowProps {
  npc: any;
  onClose: () => void;
}

/**
 * BarterWindow - Advanced trading interface with point-based value system.
 * Now acts as a "dumb" visual representation of the TradingSystem's state.
 */
export default function BarterWindow({ npc, onClose }: BarterWindowProps) {
  const { inventoryVersion } = useInventory();
  const { playSound } = useAudio();
  const { addLog } = useLog();

  // Initialize trade session on mount
  useEffect(() => {
    tradingSystem.startTrade(npc);
    // Cleanup happens in handleCancel/handleTrade usually, but safety cleanup here
    return () => {
      // If the window unmounts without a formal cancel/confirm (e.g. forced close)
      // we might want to cancel but startTrade handles overlapping sessions.
    };
  }, [npc]);

  // Derived state from TradingSystem
  const tradeState = tradingSystem.getTradeState();
  
  if (!tradeState) {
    return null; // Or a loader
  }

  const { 
    youPoints, 
    theyPoints, 
    acceptancePercent, 
    canTrade, 
    youOfferContainerId, 
    theyOfferContainerId,
    npcInventoryId 
  } = tradeState;

  // Trade Execution
  const handleTrade = () => {
    const result = tradingSystem.executeTrade();
    if (result.success) {
      playSound('Craft');
      addLog('Trade finalized with survivor.', 'item');
      onClose();
    }
  };

  // Cancellation
  const handleCancel = () => {
    tradingSystem.cancelTrade();
    onClose();
  };

  // Drag & Drop Validators (Delegated to TradingSystem)
  const validateMove = (itemId: string, fromId: string, toId: string) => {
    return tradingSystem.validateMove(itemId, fromId, toId);
  };

  return (
    <GridSizeProvider>
      <div className="absolute inset-2 z-[12000] flex items-center justify-center bg-black/20 backdrop-blur-sm animate-in fade-in duration-500 overflow-hidden">
        <div className="bg-[#0f0f0f] border border-white/10 rounded-xl shadow-2xl w-full h-full flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
          
          {/* Header - Compact */}
          <div className="px-4 py-2 border-b border-white/5 flex justify-between items-center bg-zinc-950/80">
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-black text-white tracking-tighter uppercase italic">
                Barter <span className="text-[9px] not-italic font-bold text-zinc-500 ml-2">SURVIVOR: {npc.name}</span>
              </h2>
            </div>
            <button 
              onClick={handleCancel}
              className="w-7 h-7 flex items-center justify-center bg-white/5 hover:bg-red-500/20 border border-white/10 rounded-lg transition-all"
            >
              <X className="w-4 h-4 text-zinc-400" />
            </button>
          </div>

          {/* Grid Area - Two Columns */}
          <div className="flex-1 p-3 flex gap-4 min-h-0 overflow-hidden justify-center">
            
            {/* Left Column: Survivor Stock */}
            <div className="flex-none w-fit flex flex-col min-w-0 h-full">
              <div className="px-1 mb-1">
                <h3 className="text-[8px] font-black text-zinc-500 uppercase tracking-widest">Survivor Stock</h3>
              </div>
              <div className="flex-1 bg-black/40 border border-white/5 rounded-lg overflow-hidden flex flex-col p-1.5 min-h-0">
                <ContainerGrid 
                  containerId={npcInventoryId} 
                  enableScroll 
                  maxHeight="320px" 
                  onBeforeDrop={validateMove}
                />
              </div>
            </div>

            {/* Right Column: Offer Grids (Stacked) */}
            <div className="flex-none w-fit flex flex-col gap-3 min-w-0 h-full">
              
              {/* You Offer */}
              <div className="flex-1 flex flex-col min-h-0">
                <div className="px-1 mb-1 flex justify-between">
                  <h3 className="text-[8px] font-black text-emerald-500/70 uppercase tracking-widest">You Offer</h3>
                  <span className="text-[8px] font-black text-white">{youPoints} Pts</span>
                </div>
                <div className="flex-1 bg-emerald-500/[0.01] border border-emerald-500/10 rounded-lg overflow-hidden flex flex-col p-1.5 min-h-0">
                  <ContainerGrid 
                    containerId={youOfferContainerId} 
                    enableScroll 
                    maxHeight="250px"
                    onBeforeDrop={validateMove}
                  />
                </div>
              </div>

              {/* They Offer */}
              <div className="flex-1 flex flex-col min-h-0">
                <div className="px-1 mb-1 flex justify-between">
                  <h3 className="text-[8px] font-black text-zinc-500 uppercase tracking-widest">They Offer</h3>
                  <span className="text-[8px] font-black text-white">{theyPoints} Pts</span>
                </div>
                <div className="flex-1 bg-white/[0.01] border border-white/5 rounded-lg overflow-hidden flex flex-col p-1.5 min-h-0">
                  <ContainerGrid 
                    containerId={theyOfferContainerId} 
                    enableScroll 
                    maxHeight="250px"
                    onBeforeDrop={validateMove}
                  />
                </div>
              </div>

            </div>
          </div>

          {/* Footer Bar - Very Compact */}
          <div className="px-4 py-3 border-t border-white/5 bg-zinc-950 flex items-center gap-6">
            <div className="flex-1 flex flex-col gap-1.5">
              <div className="flex justify-between items-center px-1">
                <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Trade Progress</span>
                <span className={cn(
                  "text-[9px] font-black uppercase tracking-tighter",
                  canTrade ? "text-emerald-400" : "text-amber-500"
                )}>
                  {canTrade ? "Accepted" : `${theyPoints - youPoints} Pts Remaining`}
                </span>
              </div>
              <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden p-0.5 border border-white/5">
                <div 
                  className={cn(
                    "h-full rounded-full transition-all duration-500",
                    canTrade ? "bg-emerald-500" : "bg-amber-500"
                  )}
                  style={{ width: `${acceptancePercent}%` }}
                />
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleCancel}
                className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-500 hover:text-white font-black rounded-lg transition-all uppercase tracking-widest text-[9px] border border-white/5"
              >
                Cancel
              </button>
              <button
                disabled={!canTrade}
                onClick={handleTrade}
                className={cn(
                  "px-6 py-2 font-black rounded-lg transition-all uppercase tracking-widest text-[9px] shadow-lg",
                  canTrade 
                    ? "bg-emerald-600 hover:bg-emerald-500 text-white" 
                    : "bg-zinc-800 text-zinc-600 cursor-not-allowed"
                )}
              >
                Confirm Deal
              </button>
            </div>
          </div>

        </div>
      </div>
    </GridSizeProvider>
  );
}
