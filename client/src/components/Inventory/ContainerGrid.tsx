
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
  const { getContainer, moveItem } = useInventory();
  const container = getContainer(containerId);

  const handleSlotClick = (x: number, y: number) => {
    console.log(`Container ${containerId} slot (${x}, ${y}) clicked`);
  };

  const handleSlotDrop = (x: number, y: number, event: React.DragEvent) => {
    event.preventDefault();
    const itemId = event.dataTransfer.getData('itemId');
    const fromContainerId = event.dataTransfer.getData('fromContainerId');

    if (!itemId || !fromContainerId || !container) {
      console.warn('[ContainerGrid] Invalid drop data - drop rejected', { itemId, fromContainerId, hasContainer: !!container });
      return;
    }

    // Verify item exists in source container before attempting move
    const sourceContainer = getContainer(fromContainerId);
    if (!sourceContainer) {
      console.error('[ContainerGrid] Source container not found:', fromContainerId);
      return;
    }

    const item = sourceContainer.items.get(itemId);
    if (!item) {
      console.error('[ContainerGrid] Item not found in source container:', itemId);
      return;
    }

    if (!item.instanceId) {
      console.error('[ContainerGrid] REJECT DROP: Item has no instanceId:', item.name);
      return;
    }

    console.log(`[ContainerGrid] Attempting move: item ${itemId} (${item.name}) from ${fromContainerId} to ${containerId} at (${x}, ${y})`);
    
    const result = moveItem(itemId, fromContainerId, containerId, x, y);

    if (!result.success) {
      console.error('[ContainerGrid] Move FAILED:', result.reason, '- item should remain in source container');
    } else {
      console.log('[ContainerGrid] Move SUCCESS - item now in', containerId);
    }
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
