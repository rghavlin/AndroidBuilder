
import UniversalGrid from "./UniversalGrid";

export default function BackpackGrid() {
  // TODO: Connect to real InventoryManager
  const handleSlotClick = (x: number, y: number) => {
    console.log(`Backpack slot (${x}, ${y}) clicked`);
  };

  const handleSlotDrop = (x: number, y: number, event: React.DragEvent) => {
    event.preventDefault();
    console.log(`Item dropped on backpack slot (${x}, ${y})`);
  };

  return (
    <div className="w-1/2 border-r border-border p-3 flex flex-col h-full" data-testid="backpack-grid">
      <h3 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center justify-between flex-shrink-0">
        TACTICAL BACKPACK
        <span className="text-xs text-accent">6x10 grid</span>
      </h3>

      <div className="flex-1 min-h-0">
        <UniversalGrid
          containerId="backpack"
          width={6}
          height={10}
          gridType="scalable" // Explicitly use scalable for backpack
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
