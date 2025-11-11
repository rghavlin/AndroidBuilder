
import { useState } from "react";
import { useInventory } from "@/contexts/InventoryContext";
import UniversalGrid from "./UniversalGrid";
import { ChevronDown, ChevronUp } from "lucide-react";

interface ClothingContainerPanelProps {
  title: string;
  containerId: string | null;
  emptyMessage?: string;
  isCollapsed?: boolean;
  onToggle?: () => void;
  className?: string;
}

export default function ClothingContainerPanel({
  title,
  containerId,
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

  const container = containerId ? getContainer(containerId) : null;

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

  // Show empty state if no container
  if (!container) {
    return (
      <div className={`border-b border-border p-3 ${className}`}>
        <div 
          className="flex items-center justify-between flex-shrink-0 mb-3 cursor-pointer select-none"
          onClick={handleToggle}
          title={isCollapsed ? `Expand ${title.toLowerCase()}` : `Collapse ${title.toLowerCase()}`}
        >
          <h3 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
            {title.toUpperCase()} ({emptyMessage.toLowerCase()})
            {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </h3>
        </div>
        {!isCollapsed && (
          <div className="text-xs text-muted-foreground italic py-4 text-center">
            No item equipped
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`border-b border-border p-3 flex flex-col ${className}`}>
      <div 
        className="flex items-center justify-between flex-shrink-0 mb-3 cursor-pointer select-none"
        onClick={handleToggle}
        title={isCollapsed ? `Expand ${title.toLowerCase()}` : `Collapse ${title.toLowerCase()}`}
      >
        <h3 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
          {title.toUpperCase()}
          {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
        </h3>
      </div>

      {!isCollapsed && (
        <div className="flex-1 min-h-0">
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
        </div>
      )}
    </div>
  );
}
