import { useInventory } from "@/contexts/InventoryContext";
import UniversalGrid from "./UniversalGrid";
import { Button } from "@/components/ui/button";

export default function GroundItemsGrid() {
  const { getContainer, inventoryVersion, moveItem } = useInventory();

  // Get ground container (triggers re-render when inventoryVersion changes)
  const groundContainer = getContainer('ground');

  const handleSlotClick = (x: number, y: number) => {
    console.log(`Ground slot (${x}, ${y}) clicked`);
  };

  const handleSlotDrop = (x: number, y: number, event: React.DragEvent) => {
    event.preventDefault();
    const itemId = event.dataTransfer.getData('itemId');
    const fromContainerId = event.dataTransfer.getData('fromContainerId');

    if (!itemId || !fromContainerId || !groundContainer) {
      console.warn('[GroundItemsGrid] Invalid drop data');
      return;
    }

    console.log(`[GroundItemsGrid] Moving item ${itemId} from ${fromContainerId} to ground at (${x}, ${y})`);
    const result = moveItem(itemId, fromContainerId, groundContainer.id, x, y);

    if (!result.success) {
      console.warn('[GroundItemsGrid] Move failed:', result.reason);
    } else {
      console.log('[GroundItemsGrid] Move successful');
    }
  };

  const handleOrganize = () => {
    if (inventoryRef.current) {
      const result = inventoryRef.current.organizeGroundItems();
      console.log('Ground items organized:', result);
    }
  };

  const handleQuickPickup = (category: string) => {
    if (inventoryRef.current) {
      const result = inventoryRef.current.quickPickupByCategory(category);
      console.log(`Quick pickup ${category}:`, result);
    }
  };

  // Show empty state if no ground container
  if (!groundContainer) {
    return (
      <div className="w-1/2 p-3 flex flex-col h-full items-center justify-center" data-testid="ground-items-grid">
        <div className="text-muted-foreground text-sm">
          No ground container available
        </div>
      </div>
    );
  }

  return (
    <div className="w-1/2 p-3 flex flex-col h-full" data-testid="ground-items-grid">
      <div className="flex items-center justify-between mb-3 flex-shrink-0">
        <h3 className="text-sm font-semibold text-muted-foreground">
          GROUND ITEMS
          <span className="text-xs text-accent ml-2">
            {groundContainer.width}x{groundContainer.height} grid
          </span>
        </h3>

        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => handleQuickPickup('weapons')}
            className="text-xs h-7"
          >
            Quick Pickup
          </Button>
        </div>
      </div>

      <div className="flex-1 min-h-0">
        <UniversalGrid
          key={`ground-${inventoryVersion}`}
          containerId={groundContainer.id}
          width={groundContainer.width}
          height={groundContainer.height}
          items={groundContainer.items}
          grid={groundContainer.grid}
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
    </div>
  );
}