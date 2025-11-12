
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

  const isCollapsed = controlledIsCollapsed !== undefined ? controlledIsCollapsed : internalIsCollapsed;
  const handleToggle = onToggle || (() => setInternalIsCollapsed(!internalIsCollapsed));

  const container = containerId ? getContainer(containerId) : null;
  const hasPockets = pocketContainerIds.length > 0;

  const handleSlotClick = (x: number, y: number) => {
    console.log(`${title} slot (${x}, ${y}) clicked`);
  };

  const handleSlotDrop = (x: number, y: number, event: React.DragEvent) => {
    event.preventDefault();
    const itemId = event.dataTransfer.getData('itemId');
    const fromContainerId = event.dataTransfer.getData('fromContainerId');
    
    const targetContainerId = container?.id || (pocketContainerIds.length > 0 ? pocketContainerIds[0] : null);

    if (!itemId || !fromContainerId || !targetContainerId) {
      console.warn(`[${title}] Invalid drop data - drop rejected`, { itemId, fromContainerId, targetContainerId });
      return;
    }

    const result = moveItem(itemId, fromContainerId, targetContainerId, x, y);
    
    if (!result.success) {
      console.error(`[${title}] Move FAILED:`, result.reason);
    } else {
      console.log(`[${title}] Move SUCCESS`);
    }
  };

  const displayTitle = equippedItem 
    ? `${title.toUpperCase()} (${equippedItem.name})`
    : title.toUpperCase();

  const renderContent = () => {
    if (container) {
      return (
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
      );
    }

    if (hasPockets) {
      return (
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
                  onSlotDrop={(x, y, e) => handleSlotDrop(x, y, e)} // Pass drop to unified handler
                />
              </div>
            );
          })}
        </div>
      );
    }

    if (equippedItem) {
      return (
        <div className="text-xs text-muted-foreground italic py-3 text-center border border-dashed border-border/50 rounded bg-background/50">
          This item has no pockets.
        </div>
      );
    }

    return (
      <div className="text-xs text-muted-foreground italic py-3 text-center border border-dashed border-border/50 rounded bg-background/50">
        {emptyMessage}
      </div>
    );
  };

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
          {renderContent()}
        </div>
      )}
    </div>
  );
}
