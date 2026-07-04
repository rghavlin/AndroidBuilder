import React, { useEffect } from 'react';
import { useInventory } from '@/contexts/InventoryContext';
import { useAudio } from '@/contexts/AudioContext.jsx';
import ContainerGrid from '../Inventory/ContainerGrid';
import { tollGateSystem } from '@/game/systems/TollGateSystem.js';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { GridSizeProvider } from '@/contexts/GridSizeContext';

interface TollWindowProps {
  guard: any;
  onClose: () => void;
}

/**
 * TollWindow - exit-toll payment interface.
 *
 * Header mirrors the Earbucks shop window; below it is a large scrollable grid
 * (the gatekeeper's deposit) where the player drops items. A progress bar shows
 * how close they are to the (hidden) target; the Pay button only enables once
 * they're there. Cancelling leaves the deposited items in place for later.
 */
export default function TollWindow({ guard, onClose }: TollWindowProps) {
  // Re-render on inventory changes (drops into/out of the deposit grid).
  const { inventoryVersion } = useInventory();
  const { playSound } = useAudio();

  // Begin the session on mount; clean up if the window unmounts unexpectedly.
  useEffect(() => {
    tollGateSystem.startToll(guard);
    return () => {
      if (tollGateSystem.activeGuard === guard) tollGateSystem.cancel();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [guard]);

  // inventoryVersion is read so the component re-renders when the deposit changes.
  void inventoryVersion;
  const state = tollGateSystem.getState();

  if (!state || !state.containerId) {
    return null;
  }

  const { containerId, progressPercent, canPay } = state;

  const handlePay = () => {
    const result = tollGateSystem.pay();
    if (result.success) {
      playSound('Craft');
      onClose();
    } else {
      playSound('Fail');
    }
  };

  const handleCancel = () => {
    tollGateSystem.cancel();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 pointer-events-none">
      {/* Backdrop covers the map area */}
      <div
        className="absolute left-0 w-1/2 bg-black/50 pointer-events-auto"
        style={{ top: 'var(--header-height)', bottom: 'var(--controls-height)' }}
        onClick={handleCancel}
      />

      {/* Toll panel */}
      <GridSizeProvider>
        <div
          className="absolute left-0 w-1/2 bg-card border-r border-border flex flex-col p-0 overflow-hidden pointer-events-auto animate-in slide-in-from-left duration-300"
          style={{ top: 'var(--header-height)', bottom: 'var(--controls-height)' }}
          data-testid="toll-window"
          data-inventory-ui="true"
        >
          {/* Header (same shape as the Earbucks shop window) */}
          <div className="px-4 py-3 border-b border-border flex justify-between items-center bg-muted/80">
            <div className="flex-1 mr-4">
              <p className="text-xs text-foreground font-medium italic leading-relaxed">
                "Nobody passes without paying the toll. Leave enough and I'll let you through."
              </p>
            </div>
            <button
              onClick={handleCancel}
              className="w-8 h-8 flex items-center justify-center bg-secondary hover:bg-red-500/20 border border-border rounded-lg transition-all"
            >
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>

          {/* Deposit grid (large, scrollable) */}
          <div className="flex-1 p-4 flex flex-col min-h-0 overflow-hidden bg-muted/20">
            <div className="px-1 mb-1">
              <h3 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Toll Payment</h3>
            </div>
            <div className="flex-1 bg-background/40 border border-border rounded-lg overflow-hidden flex flex-col p-1 min-h-0">
              <ContainerGrid
                containerId={containerId}
                enableScroll
                maxHeight="calc(100vh - 320px)"
                scrollbarGutter={true}
                className="flex justify-center w-full flex-1 min-h-0"
              />
            </div>
          </div>

          {/* Footer: hidden-target progress bar + Pay */}
          <div className="px-6 py-3 border-t border-border bg-muted/80 flex items-center gap-6">
            <div className="flex-1 flex flex-col gap-2">
              <div className="flex justify-between items-center px-1">
                <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Toll Progress</span>
                <span className={cn(
                  "text-[10px] font-black uppercase tracking-tighter",
                  canPay ? "text-emerald-400" : "text-amber-500"
                )}>
                  {canPay ? "Enough" : "Not enough"}
                </span>
              </div>
              <div className="h-2.5 w-full bg-background rounded-full overflow-hidden p-0.5 border border-border">
                <div
                  className={cn(
                    "h-full rounded-full transition-all duration-500",
                    canPay ? "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]" : "bg-amber-500"
                  )}
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>

            <button
              disabled={!canPay}
              onClick={handlePay}
              className={cn(
                "px-8 py-3 font-black rounded-lg transition-all uppercase tracking-widest text-[10px] shadow-lg flex-shrink-0 min-w-[140px]",
                canPay
                  ? "bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/20"
                  : "bg-muted text-muted-foreground cursor-not-allowed"
              )}
            >
              Pay
            </button>
          </div>
        </div>
      </GridSizeProvider>
    </div>
  );
}
