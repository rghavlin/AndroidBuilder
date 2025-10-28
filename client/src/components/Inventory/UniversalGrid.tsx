
import { cn } from "@/lib/utils";
import GridSlot from "./GridSlot";
import { useGridSize } from "@/contexts/GridSizeContext";
import { useInventory } from "@/contexts/InventoryContext";

interface UniversalGridProps {
  containerId: string;
  title?: string;
  width: number;
  height: number;
  items?: Map<string, any>;
  grid?: any[][];
  maxHeight?: string;
  maxWidth?: string;
  minVisibleRows?: number;
  minVisibleCols?: number;
  enableScroll?: boolean;
  enableHorizontalScroll?: boolean;
  className?: string;
  gridType?: 'scalable' | 'fixed'; // New prop for grid type
  onSlotClick?: (x: number, y: number) => void;
  onSlotDrop?: (x: number, y: number, event: React.DragEvent) => void;
  "data-testid"?: string;
}

export default function UniversalGrid({
  containerId,
  title,
  width,
  height,
  items = new Map(),
  grid = [],
  maxHeight = "400px",
  maxWidth = "100%",
  minVisibleRows = 3,
  minVisibleCols = 3,
  enableScroll = true,
  enableHorizontalScroll = false,
  className,
  gridType = 'scalable', // Default to scalable for backward compatibility
  onSlotClick,
  onSlotDrop,
  "data-testid": testId,
}: UniversalGridProps) {
  const totalSlots = width * height;
  const { scalableSlotSize, fixedSlotSize, isCalculated } = useGridSize();
  const { canOpenContainer, openContainer } = useInventory();
  
  // Choose slot size based on grid type
  const slotSize = gridType === 'fixed' ? fixedSlotSize : scalableSlotSize;

  const handleItemClick = (item: any, x: number, y: number) => {
    // First call any custom slot click handler
    onSlotClick?.(x, y);

    // Then check if this item is a container that can be opened
    if (item && canOpenContainer(item)) {
      const itemContainer = item.getContainerGrid();
      if (itemContainer) {
        openContainer(itemContainer.id);
        console.log('[UniversalGrid] Opening container:', item.name, itemContainer.id);
      } else {
        console.warn('[UniversalGrid] Container has no grid:', item.name);
      }
    } else if (item) {
      console.debug('[UniversalGrid] Item cannot be opened inline:', item.name);
    }
  };
  
  // Dynamic grid dimensions based on calculated slot size
  const gridWidth = width * slotSize;
  const gridHeight = height * slotSize;

  // For fixed grids, don't wait for calculation - they use a constant size
  // For scalable grids, wait for calculation to prevent layout shifts
  if (gridType === 'scalable' && !isCalculated) {
    return (
      <div className={cn("flex flex-col h-full", className)}>
        {title && (
          <h4 className="text-xs font-medium text-muted-foreground mb-2 text-center flex-shrink-0">
            {title}
          </h4>
        )}
        <div className="border rounded bg-card flex-1 min-h-0 flex items-center justify-center">
          <div className="text-sm text-muted-foreground">Calculating grid size...</div>
        </div>
      </div>
    );
  }

  const renderGrid = () => (
    <div
      className="grid flex-shrink-0"
      style={{
        gridTemplateColumns: `repeat(${width}, ${slotSize}px)`,
        gridTemplateRows: `repeat(${height}, ${slotSize}px)`,
        width: `${gridWidth}px`,
        height: `${gridHeight}px`,
        gap: '2px', // 2px spacing between all grid slots
      }}
      data-testid={testId || `grid-${containerId}`}
    >
      {Array.from({ length: totalSlots }, (_, index) => {
        const x = index % width;
        const y = Math.floor(index / width);
        const item = grid[y]?.[x] ? items.get(grid[y][x]) : null;

        return (
          <GridSlot
            key={`${x}-${y}`}
            item={item}
            isEmpty={!item}
            gridType={gridType}
            onClick={() => handleItemClick(item, x, y)}
            onDrop={(e) => onSlotDrop?.(x, y, e)}
            onDragOver={(e) => e.preventDefault()}
            data-testid={`${containerId}-slot-${x}-${y}`}
          />
        );
      })}
    </div>
  );

  return (
    <div className={cn("flex flex-col", gridType === 'fixed' ? 'flex-shrink-0' : 'h-full', className)}>
      {title && (
        <h4 className="text-xs font-medium text-muted-foreground mb-2 text-center flex-shrink-0">
          {title}
        </h4>
      )}

      <div 
        className={cn(
          // No background - let parent container background show through
          gridType === 'fixed' ? 'flex-shrink-0' : 'flex-1 min-h-0'
        )}
        style={{
          maxHeight: gridType === 'fixed' ? 'none' : maxHeight,
          maxWidth: gridType === 'fixed' ? 'none' : maxWidth,
          width: gridType === 'fixed' ? `${gridWidth}px` : undefined, // Remove extra border padding
          height: gridType === 'fixed' ? `${gridHeight}px` : undefined, // Remove extra border padding
        }}
      >
        <div className={cn(
          "h-full w-full flex items-start justify-center",
          gridType === 'scalable' ? 'overflow-auto custom-scrollbar' : 'overflow-visible'
        )}>
          {renderGrid()}
        </div>
      </div>
    </div>
  );
}
