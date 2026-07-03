import { useInventory } from '../../contexts/InventoryContext';
import { useGame } from '../../contexts/GameContext.jsx';
import { useAction } from '../../contexts/ActionContext.jsx';
import { useAudio } from '../../contexts/AudioContext.jsx';
import UniversalGrid from './UniversalGrid';
import { getScaleFactor } from '@/hooks/useWindowSize';
import WeaponModPanel from './WeaponModPanel';
import { Button } from '../ui/button';
import { cn } from '@/lib/utils';
import { Wrench, Zap, Power, Battery } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipPortal } from "@/components/ui/tooltip";
import { ItemTrait } from '../../game/inventory/traits.js';
import { TURRET_DEF_ID } from '../../game/ai/TurretCombat.js';

interface FloatingContainerOverlayProps {
  item: any;
  slotSize: number;
  gapSize: number;
  containerId?: string;
  onSlotClick?: (x: number, y: number) => void;
  onSlotContextMenu?: (item: any, x: number, y: number, event: React.MouseEvent) => void;
}

export default function FloatingContainerOverlay({ 
  item, 
  slotSize, 
  gapSize, 
  containerId = 'ground',
  onSlotClick,
  onSlotContextMenu
}: FloatingContainerOverlayProps) {
  const { selectItem, stopDrag, isContainerOpen, selectedItem, startDrag, openContainer, closeContainer, stopRiding } = useInventory();
  const { engine } = useGame();
  const { harvestPlant } = useAction();
  const { playSound } = useAudio();
  
  const isDraggingSeed = selectedItem?.item.defId?.endsWith('seeds');
  
  const modOverlayId = `mod-overlay:${item.instanceId}`;
  const showMods = isContainerOpen(modOverlayId);
  
  // Get the internal container of the wagon/sled
  const containerGrid = item.getContainerGrid?.();
  
   const isDragging = engine?.dragging?.item?.instanceId === item.instanceId;
   const isRidden = engine?.riding?.item?.instanceId === item.instanceId;
   const isWagon = item.hasTrait?.(ItemTrait.VEHICLE);
   const isPlanter = item.hasTrait?.(ItemTrait.PLANTER);
   const isScooter = item.hasTrait?.(ItemTrait.SCOOTER);
   const isHotplate = item.defId === 'tool.battery_powered_hotplate';
   const isAutoTurret = item.defId === TURRET_DEF_ID;

  const handleSelectPlanter = (e: React.MouseEvent) => {
    if (!isPlanter || isDragging || isDraggingSeed) return;
    e.stopPropagation();

    // 1. Try to harvest if clicking on a plant
    if (containerGrid) {
      const rect = e.currentTarget.getBoundingClientRect();
      const scale = getScaleFactor();
      const x = (e.clientX - rect.left) / scale;
      const y = (e.clientY - rect.top) / scale;
      const slotWithGap = slotSize + gapSize;
      const gridX = Math.floor(x / slotWithGap);
      const gridY = Math.floor(y / slotWithGap);
      
      const itemId = containerGrid.grid[gridY]?.[gridX];
      if (itemId) {
        const nestedItem = containerGrid.items.get(itemId);
        // If it's a harvestable plant, harvest it and return
        if (nestedItem && nestedItem.produce) {
          harvestPlant(nestedItem);
          return;
        }
      }
    }

    // 2. Otherwise select the planter box itself
    console.debug('[FloatingContainerOverlay] Selecting planter:', item.name, 'from container:', containerId);
    selectItem(item, containerId, item.x, item.y);
  };

  const handleTogglePull = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isDragging) {
      stopDrag(item);
    } else {
      if (isRidden) {
        // If we are riding this item and want to pull it instead, stop riding first
        stopRiding(item);
      }
      if (isScooter) item.scooterMode = 'pull';
      startDrag(item, 'ground', item.x, item.y);
    }
  };

  const handleToggleRide = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isRidden) {
      stopRiding(item);
    } else {
      const batteryPercent = item.getBatteryCharge?.() || 0;
      if (batteryPercent <= 0) return;
      
      if (isDragging) {
        // If we are pulling this item and want to ride it instead, stop pulling first
        stopDrag(item);
      }

      item.scooterMode = 'ride';
      startDrag(item, 'ground', item.x, item.y);
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

  if (!containerGrid && !isScooter && !isHotplate && !isAutoTurret) return null;

  const batteryStatuses = item.getBatteryStatuses?.() || [];
  const batteryPercent = item.getBatteryCharge?.() || 0;
  const motorBonus = item.getMotorizedBonus?.() || 0;
  const isMotorized = motorBonus > 0;

  // Calculate current AP penalty for tooltip
  const basePenalty = item.dragApPenalty || 2;
  const currentPenalty = Math.max(0, basePenalty - motorBonus);

  return (
    <div 
      className={cn(
        "absolute inset-0 z-50 flex flex-col overflow-hidden pointer-events-none",
        isPlanter 
          ? "" 
          : ""
      )}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Selection Handles for Planter Box Frame */}
      {isPlanter && !isDraggingSeed && (
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-0 right-0 h-4 pointer-events-auto cursor-pointer" onClick={handleSelectPlanter} />
          <div className="absolute bottom-0 left-0 right-0 h-4 pointer-events-auto cursor-pointer" onClick={handleSelectPlanter} />
          <div className="absolute top-4 bottom-4 left-0 w-4 pointer-events-auto cursor-pointer" onClick={handleSelectPlanter} />
          <div className="absolute top-4 bottom-4 right-0 w-4 pointer-events-auto cursor-pointer" onClick={handleSelectPlanter} />
        </div>
      )}

      {/* Control Panel (Top Row) */}
      {!isPlanter && (
        <div className={cn(
          "bg-black/80 backdrop-blur-sm border-b border-white/30 flex items-center justify-between flex-shrink-0 pointer-events-auto",
          (isHotplate || isAutoTurret) ? "h-[20px] p-0.5 px-1.5" : "h-8 p-1 px-1.5"
        )}>
        <div className={cn("flex items-center", (isHotplate || isAutoTurret) ? "gap-1" : "gap-2")}>
          {!isScooter && !isHotplate && !isAutoTurret && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  size="sm" 
                  variant={isDragging ? "destructive" : "secondary"}
                  className="h-6 text-[9px] px-1.5 py-0 font-bold uppercase tracking-tighter shadow-[0_0_10px_rgba(0,0,0,0.5)]"
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
                        Motorized Assist Active (-{motorBonus.toFixed(1)} AP)
                      </div>
                    )}
                  </div>
                </TooltipContent>
              </TooltipPortal>
            </Tooltip>
          )}

          {isScooter && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  size="sm" 
                  variant={isRidden ? "destructive" : "secondary"}
                  className="h-6 text-[9px] px-1.5 py-0 font-bold uppercase tracking-tighter shadow-[0_0_10px_rgba(0,0,0,0.5)]"
                  onClick={handleToggleRide}
                  disabled={(batteryPercent <= 0 && !isRidden) || containerId !== 'ground'}
                >
                  {isRidden ? "Stop" : "Ride"}
                </Button>
              </TooltipTrigger>
              <TooltipPortal>
                <TooltipContent side="top" className="bg-black/90 border-white/20 p-2 z-[100]">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[11px] font-black uppercase text-white tracking-widest">Ride Mode</span>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[9px] text-zinc-400 font-bold uppercase">Ride Bonus:</span>
                      <span className="text-xs font-black text-green-400">-{item.rideApBonus || 0.5} AP</span>
                    </div>
                    {batteryPercent <= 0 && (
                      <div className="text-[8px] text-red-400 font-bold uppercase mt-1">
                        Requires Charged Battery
                      </div>
                    )}
                    {containerId !== 'ground' && (
                      <div className="text-[8px] text-yellow-400 font-bold uppercase mt-1">
                        Must be on ground to ride
                      </div>
                    )}
                  </div>
                </TooltipContent>
              </TooltipPortal>
            </Tooltip>
          )}

          {(isHotplate || isAutoTurret) && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  size="icon" 
                  variant="ghost"
                  className={cn(
                    "h-4 w-4 p-0 transition-all text-white rounded-[3px]",
                    item.isOn 
                      ? "bg-red-600/90 border border-red-500 text-white hover:bg-red-700 shadow-[0_0_8px_rgba(239,68,68,0.5)]" 
                      : "bg-zinc-800/80 border border-zinc-700 text-zinc-400 hover:bg-zinc-700 hover:text-white"
                  )}
                  onClick={(e) => {
                    e.stopPropagation();
                    const battery = item.getBattery?.();
                    const chargeCost = isAutoTurret ? 1 : 10;
                    if (item.isOn) {
                      item.isOn = false;
                      playSound('SwitchOff');
                      engine.notifyUpdate();
                    } else if (battery && battery.ammoCount >= chargeCost) {
                      battery.ammoCount = Math.max(0, battery.ammoCount - chargeCost);
                      item.isOn = true;
                      playSound('SwitchOn');
                      engine.notifyUpdate();
                    }
                  }}
                  disabled={(!item.isOn && (!item.getBattery?.() || item.getBattery?.()?.ammoCount < (isAutoTurret ? 1 : 10))) || (isHotplate && containerId !== 'ground')}
                >
                  <Power className="h-2.5 w-2.5" />
                </Button>
              </TooltipTrigger>
              <TooltipPortal>
                <TooltipContent side="top" className="bg-black/90 border-white/20 p-2 z-[100]">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[11px] font-black uppercase text-white tracking-widest">Power Control</span>
                    {isHotplate && containerId !== 'ground' && (
                      <div className="text-[8px] text-yellow-400 font-bold uppercase mt-1">
                        Must be on ground to operate
                      </div>
                    )}
                    {!item.isOn && (!item.getBattery?.() || item.getBattery?.()?.ammoCount < (isAutoTurret ? 1 : 10)) && (
                      <div className="text-[8px] text-red-400 font-bold uppercase mt-1">
                        {`Requires Charged Battery (>= ${isAutoTurret ? 1 : 10} charges)`}
                      </div>
                    )}
                  </div>
                </TooltipContent>
              </TooltipPortal>
            </Tooltip>
          )}

          {isWagon && item.attachmentSlots && item.attachmentSlots.length > 0 && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="icon"
                  variant="ghost"
                  className={cn(
                    "h-6 w-6 p-0 border border-white/10 hover:bg-white/10 hover:border-white/50 hover:text-white rounded-[3px]",
                    "transition-all text-white",
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
                    {showMods ? "View Inventory" : "Battery Compartment"}
                  </span>
                </TooltipContent>
              </TooltipPortal>
            </Tooltip>
          )}
        </div>

        {(isHotplate || isAutoTurret) ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon"
                variant="ghost"
                className={cn(
                  "h-4 w-4 p-0 bg-zinc-800/80 border border-zinc-700 hover:bg-zinc-700 hover:text-white rounded-[3px]",
                  "transition-all text-white",
                  showMods && "bg-accent/80 hover:bg-accent/90 border-accent shadow-[0_0_10px_rgba(245,158,11,0.4)]"
                )}
                onClick={handleToggleMods}
              >
                <Wrench className="h-2.5 w-2.5" />
              </Button>
            </TooltipTrigger>
            <TooltipPortal>
              <TooltipContent side="top" className="bg-black/90 border-white/20 px-2 py-1 z-[100]">
                <span className="text-[9px] font-bold uppercase text-white tracking-widest">
                  {showMods ? "View Inventory" : isAutoTurret ? "Attachments" : "Battery Compartment"}
                </span>
              </TooltipContent>
            </TooltipPortal>
          </Tooltip>
        ) : (
          isWagon && (item.attachmentSlots?.some((s: any) => s.id.includes('battery')) || item.getBatteryStatuses?.().length > 0 || item.getBatteryCharge?.() > 0) && (
            <div className="flex items-center gap-1.5 px-0.5">
              {batteryStatuses.length > 0 ? (
                batteryStatuses.map((status: any) => (
                  <div 
                    key={status.slotId} 
                    className="flex items-center justify-center bg-black/40 rounded border border-white/5 gap-1 px-1 py-0.5 min-w-[32px] justify-center"
                  >
                    <Battery className={cn(
                      "h-3 w-3",
                      status.percent > 20 ? "text-yellow-400" : status.percent > 0 ? "text-orange-500 animate-pulse" : "text-gray-500"
                    )} />
                    <span className={cn(
                      "font-mono font-bold leading-none text-[8px]",
                      status.percent > 20 ? "text-yellow-100" : status.percent > 0 ? "text-orange-200" : "text-gray-400"
                    )}>
                      {Math.floor(status.percent)}%
                    </span>
                  </div>
                ))
              ) : (
                <div className="flex items-center bg-black/40 rounded border border-white/5 gap-1 px-1.5 py-0.5">
                  <Battery className={cn(
                    "h-3 w-3",
                    batteryPercent > 20 ? "text-yellow-400" : batteryPercent > 0 ? "text-orange-500 animate-pulse" : "text-gray-500"
                  )} />
                  <span className={cn(
                    "font-mono font-bold leading-none text-[9px]",
                    batteryPercent > 20 ? "text-yellow-100" : batteryPercent > 0 ? "text-orange-200" : "text-gray-400"
                  )}>
                    {Math.floor(batteryPercent)}%
                  </span>
                </div>
              )}
            </div>
          )
        )}
      </div>
      )}

      {/* Grid or Mod Overlay */}
      <div 
        className="flex-1 min-h-0 relative"
      >
        {showMods ? (
          <div className="absolute inset-0 bg-black/95 backdrop-blur-md z-10 flex flex-col items-center justify-start p-1 pt-2 pointer-events-auto border border-white/20 rounded-sm">
             <WeaponModPanel weapon={item} className="w-full" />
             {isMotorized && (
               <div className="mt-auto text-[8px] text-white/40 uppercase font-bold tracking-tighter text-center w-full">
                 Motorized Assist Active
               </div>
             )}
          </div>
        ) : (
          containerGrid && (
            <div className={cn(
              isPlanter 
                ? "absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" 
                : "flex-1 min-h-0 w-full flex items-center justify-center pointer-events-auto"
            )}>
              <div className={cn(
                "pointer-events-auto",
                isPlanter && "bg-black/40 backdrop-blur-[1px] border border-white/20 rounded-sm p-1 shadow-2xl"
              )}>
                <UniversalGrid
                  containerId={containerGrid.id}
                  container={containerGrid}
                  width={containerGrid.width}
                  height={containerGrid.height}
                  gridType="fixed"
                  slotClassName={cn(isPlanter ? "bg-white/10 border border-white/30" : "!bg-none !bg-black/20 !shadow-[inset_0_1px_2px_rgba(0,0,0,0.5)] !border-white/10 hover:!bg-black/40")}
                  className={isPlanter ? "" : "h-full w-full"}
                  onSlotClick={onSlotClick}
                />
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
}
