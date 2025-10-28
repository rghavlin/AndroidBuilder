
import { useInventory } from "@/contexts/InventoryContext";
import UniversalGrid from "./UniversalGrid";

interface ContainerGridProps {
  containerId: string;
  title?: string;
  className?: string;
  enableScroll?: boolean;
  maxHeight?: string;
  maxWidth?: string;
  enableHorizontalScroll?: boolean;
}

export default function ContainerGrid({
  containerId,
  title,
  className = "",
  enableScroll = false,
  maxHeight = "200px",
  maxWidth = "100%",
  enableHorizontalScroll = false
}: ContainerGridProps) {
  const { getContainer } = useInventory();
  const container = getContainer(containerId);

  const handleSlotClick = (x: number, y: number) => {
    console.log(`Container ${containerId} slot (${x}, ${y}) clicked`);
  };

  const handleSlotDrop = (x: number, y: number, event: React.DragEvent) => {
    event.preventDefault();
    console.log(`Item dropped on ${containerId} slot (${x}, ${y})`);
    // Phase 5F will implement actual moveItem logic
  };

  if (!container) {
    return (
      <div className={className}>
        <div className="text-sm text-muted-foreground p-2">
          Container not found: {containerId}
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      <UniversalGrid
        containerId={containerId}
        title={title || container.name}
        width={container.width}
        height={container.height}
        items={container.items}
        grid={container.grid}
        gridType="fixed" // Always use fixed size for containers
        maxHeight={maxHeight}
        maxWidth={maxWidth}
        enableScroll={enableScroll}
        enableHorizontalScroll={enableHorizontalScroll}
        onSlotClick={handleSlotClick}
        onSlotDrop={handleSlotDrop}
      />
    </div>
  );
}
