
import { useState } from "react";
import { useInventory } from "@/contexts/InventoryContext";
import UniversalGrid from "./UniversalGrid";
import { ChevronDown, ChevronUp } from "lucide-react";

export default function BackpackGrid() {
  const { getEquippedBackpackContainer, inventoryVersion, moveItem } = useInventory();
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  // Get equipped backpack container (triggers re-render when inventoryVersion changes)
  const backpackContainer = getEquippedBackpackContainer();
  
  const handleSlotClick = (x: number, y: number) => {
    console.log(`Backpack slot (${x}, ${y}) clicked`);
  };

  const handleSlotDrop = (x: number, y: number, event: React.DragEvent) => {
    event.preventDefault();
    const itemId = event.dataTransfer.getData('itemId');
    const fromContainerId = event.dataTransfer.getData('fromContainerId');
    
    if (!itemId || !fromContainerId || !backpackContainer) {
      console.warn('[BackpackGrid] Invalid drop data');
      return;
    }
    
    console.log(`[BackpackGrid] Moving item ${itemId} from ${fromContainerId} to backpack at (${x}, ${y})`);
    const result = moveItem(itemId, fromContainerId, backpackContainer.id, x, y);
    
    if (!result.success) {
      console.warn('[BackpackGrid] Move failed:', result.reason);
    } else {
      console.log('[BackpackGrid] Move successful');
    }
  };

  // Show "No backpack equipped" state
  if (!backpackContainer) {
    return (
      <div className="w-1/2 border-r border-border p-3 flex flex-col h-full items-center justify-center" data-testid="backpack-grid">
        <div className="text-muted-foreground text-sm">
          No backpack equipped
        </div>
      </div>
    );
  }

  return (
    <div className="w-1/2 border-r border-border p-3 flex flex-col h-full" data-testid="backpack-grid">
      <div 
        className="flex items-center justify-between flex-shrink-0 mb-3 cursor-pointer select-none"
        onClick={() => setIsCollapsed(!isCollapsed)}
        title={isCollapsed ? "Expand backpack" : "Collapse backpack"}
      >
        <h3 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
          {(backpackContainer.name || 'BACKPACK').toUpperCase()}
          {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
        </h3>
        <span className="text-xs text-accent">
          {backpackContainer.width}x{backpackContainer.height} grid
        </span>
      </div>

      {!isCollapsed && (
        <div className="flex-1 min-h-0">
          <UniversalGrid
            containerId={backpackContainer.id}
            width={backpackContainer.width}
            height={backpackContainer.height}
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
