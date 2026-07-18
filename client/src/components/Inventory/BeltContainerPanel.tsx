import { useState } from "react";
import { useInventory } from "@/contexts/InventoryContext";
import { ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import UniversalGrid from "./UniversalGrid";
import { useGridSize } from "@/contexts/GridSizeContext";

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
  const { fixedSlotSize } = useGridSize();
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

    const slotWidth = container.width * fixedSlotSize + (container.width - 1) * 2;

    return (
      <div className="flex flex-col items-center gap-1 flex-shrink-0" style={{ width: `${slotWidth}px` }}>
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

  const ringWidth = (toolRingLeft || toolRingRight)?.width || 2;

  return (
    <div className={cn("border-b border-border", className)}>
      {/* Header */}
      <button
        onClick={handleToggle}
        className="w-full px-3 py-2 flex items-center justify-between hover:bg-accent/50 transition-colors bg-muted/40"
      >
        <span className="text-sm font-medium section-plaque">
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
        <div className="p-4 bg-muted/20 flex flex-col items-center gap-6">
          {!holsterLeft && !holsterRight && !ammoLeft && !ammoRight && !pouch && !toolRingLeft && !toolRingRight ? (
            <div className="py-4 text-muted-foreground text-xs italic">No attachments equipped</div>
          ) : (
            <>
              {/* Top Row: Holsters and Ammo */}
              {(holsterLeft || holsterRight || ammoLeft || ammoRight) && (
                <div className="flex items-start justify-center gap-6 w-full">
                  {renderSlot(holsterLeft, "Holster", "Guns")}
                  
                  {(ammoLeft || ammoRight) && (
                    <div 
                      className="flex flex-col gap-1 flex-shrink-0"
                      style={{ width: `${Math.max(ammoLeft?.width || 0, ammoRight?.width || 0) * fixedSlotSize + (Math.max(ammoLeft?.width || 0, ammoRight?.width || 0) - 1) * 2}px` }}
                    >
                        <div className="flex flex-col items-center">
                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-tight">Ammo</span>
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

                  {renderSlot(holsterRight, "Holster", "Guns")}
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
                <div 
                  className="flex justify-center w-full"
                  style={{ gap: `${fixedSlotSize + 48}px` }}
                >
                  {toolRingLeft ? (
                    renderSlot(toolRingLeft, "Tool ring", "Heavy Tools", true)
                  ) : (
                    <div className="flex-shrink-0" style={{ width: `${ringWidth * fixedSlotSize + (ringWidth - 1) * 2}px` }} />
                  )}
                  {toolRingRight ? (
                    renderSlot(toolRingRight, "Tool ring", "Heavy Tools", true)
                  ) : (
                    <div className="flex-shrink-0" style={{ width: `${ringWidth * fixedSlotSize + (ringWidth - 1) * 2}px` }} />
                  )}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
