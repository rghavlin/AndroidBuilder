
import UniversalGrid from "./UniversalGrid";

export default function GroundItemsGrid() {
  // TODO: Connect to real InventoryManager ground container
  const handleSlotClick = (x: number, y: number) => {
    console.log(`Ground slot (${x}, ${y}) clicked`);
  };

  const handleSlotDrop = (x: number, y: number, event: React.DragEvent) => {
    event.preventDefault();
    console.log(`Item dropped on ground slot (${x}, ${y})`);
  };

  return (
    <div className="w-1/2 p-3 flex flex-col h-full" data-testid="ground-items-grid">
      <h3 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center justify-between flex-shrink-0">
        GROUND ITEMS
        <span className="text-xs text-accent">6-wide grid</span>
      </h3>

      <div className="flex-1 min-h-0">
        <UniversalGrid
          containerId="ground"
          width={6}
          height={25}
          gridType="scalable" // Explicitly use scalable for ground
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
