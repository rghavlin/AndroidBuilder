
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import GridSlot from "./GridSlot";
import { useGridSize } from "@/contexts/GridSizeContext";
import { useInventory } from "@/contexts/InventoryContext";
import { imageLoader } from "@/game/utils/ImageLoader";

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
  gridType?: 'scalable' | 'fixed';
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
  gridType = 'scalable',
  onSlotClick,
  onSlotDrop,
  "data-testid": testId,
}: UniversalGridProps) {
  const totalSlots = width * height;
  const { scalableSlotSize, fixedSlotSize, isCalculated } = useGridSize();
  const { canOpenContainer, openContainer } = useInventory();
  const [itemImages, setItemImages] = useState<Map<string, string>>(new Map());
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  // Choose slot size based on grid type
  const slotSize = gridType === 'fixed' ? fixedSlotSize : scalableSlotSize;

  // Load item images
  useEffect(() => {
    const loadImages = async () => {
      const imageMap = new Map<string, string>();
      
      for (const [itemId, item] of items.entries()) {
        if (item.imageId) {
          try {
            const img = await imageLoader.getItemImage(item.imageId);
            if (img) {
              imageMap.set(itemId, img.src);
            }
          } catch (error) {
            console.warn('[UniversalGrid] Failed to load image for item:', item.name, error);
          }
        }
      }
      
      setItemImages(imageMap);
    };

    if (items.size > 0) {
      loadImages();
    }
  }, [items]);

  const handleItemClick = async (item: any, x: number, y: number) => {
    // First call any custom slot click handler
    onSlotClick?.(x, y);

    // Then check if this item is a container that can be opened
    if (item && canOpenContainer(item)) {
      try {
        const itemContainer = await item.getContainerGrid();
        if (itemContainer) {
          console.log('[UniversalGrid] Opening container:', item.name, 'ID:', itemContainer.id);
          openContainer(itemContainer.id);
        } else {
          console.warn('[UniversalGrid] Container has no grid:', item.name);
        }
      } catch (error) {
        console.error('[UniversalGrid] Error getting container grid:', item.name, error);
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

  // Helper to check if a slot is the top-left corner of an item
  const isTopLeftOfItem = (x: number, y: number, item: any): boolean => {
    return item && item.x === x && item.y === y;
  };

  const renderGrid = () => (
    <div
      className="grid flex-shrink-0"
      style={{
        gridTemplateColumns: `repeat(${width}, ${slotSize}px)`,
        gridTemplateRows: `repeat(${height}, ${slotSize}px)`,
        width: `${gridWidth}px`,
        height: `${gridHeight}px`,
        gap: '2px',
      }}
      data-testid={testId || `grid-${containerId}`}
    >
      {Array.from({ length: totalSlots }, (_, index) => {
        const x = index % width;
        const y = Math.floor(index / width);
        const item = grid[y]?.[x] ? items.get(grid[y][x]) : null;
        
        // Check if this is the top-left cell of the item
        const isTopLeft = item ? isTopLeftOfItem(x, y, item) : false;
        
        // Calculate image dimensions if this is top-left
        let imageWidth = 0;
        let imageHeight = 0;
        const GAP_SIZE = 2; // Must match grid gap in style
        if (item && isTopLeft) {
          const itemActualWidth = item.getActualWidth();
          const itemActualHeight = item.getActualHeight();
          // Total width = (slots * slotSize) + (gaps between slots)
          imageWidth = (itemActualWidth * slotSize) + ((itemActualWidth - 1) * GAP_SIZE);
          imageHeight = (itemActualHeight * slotSize) + ((itemActualHeight - 1) * GAP_SIZE);
        }

        const itemImageSrc = item ? itemImages.get(item.instanceId) || null : null;

        return (
          <GridSlot
            key={`${x}-${y}`}
            item={item}
            isEmpty={!item}
            gridType={gridType}
            isTopLeft={isTopLeft}
            itemImageSrc={itemImageSrc}
            imageWidth={imageWidth}
            imageHeight={imageHeight}
            isHovered={item?.instanceId === hoveredItem}
            onClick={() => handleItemClick(item, x, y)}
            onDrop={(e) => onSlotDrop?.(x, y, e)}
            onDragOver={(e) => e.preventDefault()}
            onMouseEnter={() => item && setHoveredItem(item.instanceId)}
            onMouseLeave={() => setHoveredItem(null)}
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
          gridType === 'fixed' ? 'flex-shrink-0' : 'flex-1 min-h-0'
        )}
        style={{
          maxHeight: gridType === 'fixed' ? 'none' : maxHeight,
          maxWidth: gridType === 'fixed' ? 'none' : maxWidth,
          width: gridType === 'fixed' ? `${gridWidth}px` : undefined,
          height: gridType === 'fixed' ? `${gridHeight}px` : undefined,
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
