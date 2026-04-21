import { useInventory } from '../../contexts/InventoryContext';
import { useGame } from '../../contexts/GameContext.jsx';
import UniversalGrid from './UniversalGrid';
import WeaponModPanel from './WeaponModPanel';
import { Button } from '../ui/button';
import { cn } from '@/lib/utils';
import { Wrench, Zap } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipPortal } from "@/components/ui/tooltip";

interface FloatingContainerOverlayProps {
  item: any;
  slotSize: number;
  gapSize: number;
}

export default function FloatingContainerOverlay({ item, slotSize, gapSize }: FloatingContainerOverlayProps) {
  const { startDrag, stopDrag, openContainer, closeContainer, isContainerOpen } = useInventory();
  const { engine } = useGame();
  
  const modOverlayId = `mod-overlay:${item.instanceId}`;
  const showMods = isContainerOpen(modOverlayId);
  
  // Get the internal container of the wagon/sled
  const containerGrid = item.getContainerGrid?.();
  
  const isDragging = engine?.dragging?.item.instanceId === item.instanceId;
  const isWagon = item.isWagon;

  const handleTogglePull = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isDragging) {
      stopDrag();
    } else {
      // Logic to start dragging the wagon/sled
      // We use the startDrag mechanism from InventoryContext
      const ground = engine.inventoryManager.getContainer('ground');
      if (ground) {
        startDrag(item, 'ground', item.x, item.y);
      }
    }
  };

  const handleToggleMods = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (showMods) {
      closeContainer(modOverlayId);
    } else {
      openContainer(modOverlayId);
    }
  };

  if (!containerGrid) return null;

  const batteryPercent = item.getBatteryCharge?.() || 0;
  const isMotorized = item.isMotorized?.();

  // Calculate current AP penalty for tooltip
  const basePenalty = item.dragApPenalty || 2;
  const motorBonus = isMotorized ? 0.5 : 0;
  const currentPenalty = Math.max(0, basePenalty - motorBonus);

  return (
    <div 
      className="absolute inset-0 z-50 flex flex-col pointer-events-auto bg-black/40 backdrop-blur-[1px] border border-white/30 rounded-sm overflow-hidden"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Control Panel (Top Row) */}
      <div className="h-8 bg-black/60 border-b border-white/20 flex items-center justify-between p-1 px-1.5 flex-shrink-0">
        <div className="flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                size="sm" 
                variant={isDragging ? "destructive" : "secondary"}
                className="h-6 text-[10px] px-3 py-0 font-bold uppercase tracking-wider shadow-[0_0_10px_rgba(0,0,0,0.5)]"
                onClick={handleTogglePull}
              >
                {isDragging ? "Drop" : "Pull"}
              </Button>
            </TooltipTrigger>
            <TooltipPortal>
              <TooltipContent side="top" className="bg-black/90 border-white/20 p-2 z-[100]">
                <div className="flex flex-col gap-0.5">
                  <span className="text-[11px] font-black uppercase text-white tracking-widest">{item.name}</span>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[9px] text-zinc-400 font-bold uppercase">Drag Penalty:</span>
                    <span className={cn(
                      "text-xs font-black",
                      currentPenalty === 0 ? "text-green-400" : "text-yellow-400"
                    )}>
                      {currentPenalty.toFixed(1)} AP
                    </span>
                  </div>
                  {isMotorized && (
                    <div className="text-[8px] text-blue-400 font-bold uppercase mt-1 flex items-center gap-1">
                      <Zap className="h-2 w-2" />
                      Motorized Assist Active (-0.5 AP)
                    </div>
                  )}
                </div>
              </TooltipContent>
            </TooltipPortal>
          </Tooltip>

          {isWagon && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="icon"
                  variant="ghost"
                  className={cn(
                    "h-6 w-6 p-0 border border-white/10 transition-all text-white",
                    "hover:bg-white/10 hover:border-white/50 hover:text-white",
                    showMods && "bg-accent/80 hover:bg-accent/90 border-accent shadow-[0_0_10px_rgba(245,158,11,0.4)]"
                  )}
                  onClick={handleToggleMods}
                >
                  <Wrench className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipPortal>
                <TooltipContent side="top" className="bg-black/90 border-white/20 px-2 py-1 z-[100]">
                  <span className="text-[9px] font-bold uppercase text-white tracking-widest">
                    {showMods ? "View Inventory" : "System Modifications"}
                  </span>
                </TooltipContent>
              </TooltipPortal>
            </Tooltip>
          )}
        </div>

        {isWagon && (
          <div className="flex items-center gap-1 px-1.5 py-0.5 bg-black/40 rounded border border-white/5">
            <Zap className={cn(
              "h-3 w-3",
              batteryPercent > 20 ? "text-yellow-400" : batteryPercent > 0 ? "text-orange-500 animate-pulse" : "text-gray-500"
            )} />
            <span className={cn(
              "text-[9px] font-mono font-bold leading-none",
              batteryPercent > 20 ? "text-yellow-100" : batteryPercent > 0 ? "text-orange-200" : "text-gray-400"
            )}>
              {Math.floor(batteryPercent)}%
            </span>
          </div>
        )}
      </div>

      {/* Grid or Mod Overlay */}
      <div 
        className="flex-1 min-h-0 relative"
      >
        {showMods ? (
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md z-10 flex flex-col items-center justify-start p-2 pt-4">
             <WeaponModPanel weapon={item} className="w-full" />
             <div className="mt-auto text-[8px] text-white/40 uppercase font-bold tracking-tighter text-center w-full">
               {isMotorized ? "Motorized Assist Active" : "Manual Mode"}
             </div>
          </div>
        ) : (
          <UniversalGrid
            containerId={containerGrid.id}
            container={containerGrid}
            width={containerGrid.width}
            height={containerGrid.height}
            gridType="fixed"
            slotClassName="bg-white/5 border border-white/10"
            className="h-full w-full"
          />
        )}
      </div>
    </div>
  );
}
