
import { useInventory } from "@/contexts/InventoryContext";
import UniversalGrid from "./UniversalGrid";

export default function BackpackGrid() {
  const { getEquippedBackpackContainer, inventoryVersion } = useInventory();
  
  // Get equipped backpack container (triggers re-render when inventoryVersion changes)
  const backpackContainer = getEquippedBackpackContainer();
  
  const handleSlotClick = (x: number, y: number) => {
    console.log(`Backpack slot (${x}, ${y}) clicked`);
  };

  const handleSlotDrop = (x: number, y: number, event: React.DragEvent) => {
    event.preventDefault();
    console.log(`Item dropped on backpack slot (${x}, ${y})`);
    // TODO: Implement moveItem call in next phase
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
      <h3 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center justify-between flex-shrink-0">
        {backpackContainer.name.toUpperCase()}
        <span className="text-xs text-accent">
          {backpackContainer.width}x{backpackContainer.height} grid
        </span>
      </h3>

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
          className="h-full"
        />
      </div>
    </div>
  );
}
