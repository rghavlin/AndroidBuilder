
import { useState } from "react";
import { useInventory } from "@/contexts/InventoryContext";
import { ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import UniversalGrid from "./UniversalGrid";

interface BeltContainerPanelProps {
  beltItem: any;
  isCollapsed?: boolean;
  onToggle?: () => void;
  className?: string;
}

export default function BeltContainerPanel({
  beltItem,
  isCollapsed: controlledIsCollapsed,
  onToggle,
  className = "",
}: BeltContainerPanelProps) {
  const { getContainer } = useInventory();
  const [internalIsCollapsed, setInternalIsCollapsed] = useState(false);

  const isCollapsed = controlledIsCollapsed !== undefined ? controlledIsCollapsed : internalIsCollapsed;
  const handleToggle = onToggle || (() => setInternalIsCollapsed(!internalIsCollapsed));

  if (!beltItem) return null;

  const getSlotContainer = (slotId: string) => {
    const attachedItem = beltItem.attachments[slotId];
    if (!attachedItem) return null;
    return getContainer(attachedItem.instanceId + '-grid');
  };

  const holsterLeft = getSlotContainer('holster_left');
  const holsterRight = getSlotContainer('holster_right');
  const ammoLeft = getSlotContainer('ammo_left');
  const ammoRight = getSlotContainer('ammo_right');
  const pouch = getSlotContainer('pouch');
  const toolRingLeft = getSlotContainer('tool_ring_left');
  const toolRingRight = getSlotContainer('tool_ring_right');

  const renderSlot = (container: any, label: string, subLabel?: string, labelBottom: boolean = false) => {
    if (!container) return null;
    const labelEl = (
      <div className="flex flex-col items-center leading-none">
        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-tight">{label}</span>
        {subLabel && <span className="text-[8px] text-zinc-500 font-medium italic">{subLabel}</span>}
      </div>
    );

    return (
      <div className="flex flex-col items-center gap-1">
        {!labelBottom && labelEl}
        <UniversalGrid
          containerId={container.id}
          width={container.width}
          height={container.height}
          gridType="fixed"
          enableScroll={false}
          className="mx-auto"
        />
        {labelBottom && labelEl}
      </div>
    );
  };

  return (
    <div className={cn("border-b border-border", className)}>
      {/* Header */}
      <button
        onClick={handleToggle}
        className="w-full px-3 py-2 flex items-center justify-between hover:bg-accent/50 transition-colors bg-zinc-900/40"
      >
        <span className="text-sm font-medium">
          Belt <span className="text-muted-foreground ml-2">({beltItem.name})</span>
        </span>
        {isCollapsed ? (
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        )}
      </button>

      {/* Content */}
      {!isCollapsed && (
        <div className="p-4 bg-black/20 flex flex-col items-center gap-6">
          {!holsterLeft && !holsterRight && !ammoLeft && !ammoRight && !pouch && !toolRingLeft && !toolRingRight ? (
            <div className="py-4 text-zinc-500 text-xs italic">No attachments equipped</div>
          ) : (
            <>
              {/* Top Row: Holsters and Ammo */}
              {(holsterLeft || holsterRight || ammoLeft || ammoRight) && (
                <div className="flex items-start justify-center gap-8 w-full">
                  <div className="w-[80px]">
                      {renderSlot(holsterLeft, "Holster", "Guns")}
                  </div>
                  
                  {(ammoLeft || ammoRight) && (
                    <div className="flex flex-col gap-1 min-w-[40px]">
                        <div className="flex flex-col items-center">
                            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-tight">Ammo</span>
                        </div>
                        <div className="flex flex-col gap-2 mt-1">
                            {ammoLeft && (
                                <UniversalGrid
                                    containerId={ammoLeft.id}
                                    width={ammoLeft.width}
                                    height={ammoLeft.height}
                                    gridType="fixed"
                                    enableScroll={false}
                                />
                            )}
                            {ammoRight && (
                                <UniversalGrid
                                    containerId={ammoRight.id}
                                    width={ammoRight.width}
                                    height={ammoRight.height}
                                    gridType="fixed"
                                    enableScroll={false}
                                />
                            )}
                        </div>
                    </div>
                  )}

                  <div className="w-[80px]">
                      {renderSlot(holsterRight, "Holster", "Guns")}
                  </div>
                </div>
              )}

              {/* Middle Row: Pouch */}
              {pouch && (
                <div className="w-full flex justify-center">
                  {renderSlot(pouch, "Pouch", "General Storage")}
                </div>
              )}

              {/* Bottom Row: Tool Rings */}
              {(toolRingLeft || toolRingRight) && (
                <div className="flex justify-between w-full px-4">
                  <div className="w-[80px]">
                      {renderSlot(toolRingLeft, "Tool ring", "Heavy Tools", true)}
                  </div>
                  <div className="w-[80px]">
                      {renderSlot(toolRingRight, "Tool ring", "Heavy Tools", true)}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
