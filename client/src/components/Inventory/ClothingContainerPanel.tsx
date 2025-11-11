
import { useState } from "react";
import { useInventory } from "@/contexts/InventoryContext";
import UniversalGrid from "./UniversalGrid";
import { ChevronDown, ChevronUp } from "lucide-react";

interface ClothingContainerPanelProps {
  title: string;
  containerId?: string | null;
  equippedItem?: any;
  pocketContainerIds?: string[];
  emptyMessage?: string;
  isCollapsed?: boolean;
  onToggle?: () => void;
  className?: string;
}

export default function ClothingContainerPanel({
  title,
  containerId,
  equippedItem,
  pocketContainerIds = [],
  emptyMessage = "None equipped",
  isCollapsed: controlledIsCollapsed,
  onToggle,
  className = "",
}: ClothingContainerPanelProps) {
  const { getContainer, moveItem } = useInventory();
  const [internalIsCollapsed, setInternalIsCollapsed] = useState(false);

  // Use controlled collapse state if provided, otherwise use internal state
  const isCollapsed = controlledIsCollapsed !== undefined ? controlledIsCollapsed : internalIsCollapsed;
  const handleToggle = onToggle || (() => setInternalIsCollapsed(!internalIsCollapsed));

  // For backpacks, use containerId. For clothing, use pocketContainerIds
  const container = containerId ? getContainer(containerId) : null;
  const hasPockets = pocketContainerIds.length > 0;
  const hasContent = container || hasPockets;

  const handleSlotClick = (x: number, y: number) => {
    console.log(`${title} slot (${x}, ${y}) clicked`);
  };

  const handleSlotDrop = (x: number, y: number, event: React.DragEvent) => {
    event.preventDefault();
    const itemId = event.dataTransfer.getData('itemId');
    const fromContainerId = event.dataTransfer.getData('fromContainerId');
    
    if (!itemId || !fromContainerId || !container) {
      console.warn(`[${title}] Invalid drop data - drop rejected`, { itemId, fromContainerId, hasContainer: !!container });
      return;
    }

    // Verify item exists in source container before attempting move
    const sourceContainer = getContainer(fromContainerId);
    if (!sourceContainer) {
      console.error(`[${title}] Source container not found:`, fromContainerId);
      return;
    }

    const item = sourceContainer.items.get(itemId);
    if (!item) {
      console.error(`[${title}] Item not found in source container:`, itemId);
      return;
    }

    if (!item.instanceId) {
      console.error(`[${title}] REJECT DROP: Item has no instanceId:`, item.name);
      return;
    }
    
    console.log(`[${title}] Attempting move: item ${itemId} (${item.name}) from ${fromContainerId} to ${container.id} at (${x}, ${y})`);
    const result = moveItem(itemId, fromContainerId, container.id, x, y);
    
    if (!result.success) {
      console.error(`[${title}] Move FAILED:`, result.reason, '- item should remain in source container');
    } else {
      console.log(`[${title}] Move SUCCESS - item now in container`);
    }
  };

  // Show empty state if no container and no equipped clothing item
  if (!hasContent && !equippedItem) {
    console.log(`[ClothingContainerPanel] Rendering empty state for ${title}`, { emptyMessage, isCollapsed });
    return (
      <div className={`border-b border-border p-3 ${className}`}>
        <div 
          className="flex items-center justify-between mb-2 cursor-pointer select-none"
          onClick={handleToggle}
          title={isCollapsed ? `Expand ${title.toLowerCase()}` : `Collapse ${title.toLowerCase()}`}
        >
          <h3 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
            {title.toUpperCase()}
            {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </h3>
        </div>
        {!isCollapsed && (
          <div className="text-xs text-muted-foreground italic py-3 text-center border border-dashed border-border/50 rounded bg-background/50">
            {emptyMessage}
          </div>
        )}
      </div>
    );
  }

  // Determine display title - show equipped item name if available
  const displayTitle = equippedItem 
    ? `${title.toUpperCase()} (${equippedItem.name})`
    : title.toUpperCase();

  console.log(`[ClothingContainerPanel] Rendering ${title}:`, {
    hasContainer: !!container,
    hasPockets,
    pocketCount: pocketContainerIds.length,
    equippedItem: equippedItem?.name || 'none',
    isCollapsed
  });

  return (
    <div className={`border-b border-border p-3 flex flex-col ${className}`}>
      <div 
        className="flex items-center justify-between flex-shrink-0 mb-3 cursor-pointer select-none"
        onClick={handleToggle}
        title={isCollapsed ? `Expand ${title.toLowerCase()}` : `Collapse ${title.toLowerCase()}`}
      >
        <h3 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
          {displayTitle}
          {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
        </h3>
      </div>

      {!isCollapsed && (
        <div className="flex-1 min-h-0">
          {/* Render backpack container grid */}
          {container && (
            <UniversalGrid
              containerId={container.id}
              width={container.width}
              height={container.height}
              gridType="scalable"
              maxHeight="100%"
              maxWidth="100%"
              enableScroll={true}
              enableHorizontalScroll={true}
              onSlotClick={handleSlotClick}
              onSlotDrop={handleSlotDrop}
              className="h-full"
            />
          )}

          {/* Render clothing pocket grids */}
          {hasPockets && (
            <div className="space-y-2">
              {pocketContainerIds.map((pocketId, index) => {
                const pocketContainer = getContainer(pocketId);
                if (!pocketContainer) return null;

                return (
                  <div key={pocketId} className="border border-border/50 rounded p-2">
                    <div className="text-xs text-muted-foreground mb-1">
                      Pocket {index + 1}
                    </div>
                    <UniversalGrid
                      containerId={pocketId}
                      width={pocketContainer.width}
                      height={pocketContainer.height}
                      gridType="scalable"
                      maxHeight="100%"
                      maxWidth="100%"
                      enableScroll={false}
                      enableHorizontalScroll={false}
                      onSlotClick={handleSlotClick}
                      onSlotDrop={handleSlotDrop}
                    />
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
