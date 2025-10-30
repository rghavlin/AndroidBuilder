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
            console.log(`[UniversalGrid] Loading image for item: ${item.name}, imageId: ${item.imageId}`);
            const img = await imageLoader.getItemImage(item.imageId);
            if (img) {
              // Store using itemId (the Map key), not item.instanceId
              imageMap.set(itemId, img.src);
              console.log(`[UniversalGrid] Image loaded for ${item.name}: ${img.src}`);
            }
          } catch (error) {
            console.warn('[UniversalGrid] Failed to load image for item:', item.name, error);
          }
        } else {
          console.warn(`[UniversalGrid] Item has no imageId:`, item.name, item);
        }
      }

      setItemImages(imageMap);
    };

    if (items.size > 0) {
      loadImages();
    } else {
      // Clear images when container is empty
      setItemImages(new Map());
    }
  }, [items.size]); // Only re-run when item count changes, not the Map reference itself

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

  const handleItemMouseDown = (item: any, x: number, y: number, event: React.MouseEvent) => {
    // Prevent text selection during drag
    event.preventDefault();

    if (onSlotClick) { // Changed from onItemClick to onSlotClick as per common usage
      onSlotClick(x, y);
    }
  };

  const handleDragStart = (item: any, event: React.DragEvent) => {
    // Set drag data for drop handlers
    event.dataTransfer.setData('itemId', item.instanceId);
    event.dataTransfer.setData('fromContainerId', containerId);
    event.dataTransfer.effectAllowed = 'move';
    console.log(`[UniversalGrid] Drag started: ${item.instanceId} from ${containerId}`);
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

  const renderGrid = () => {
    const GAP_SIZE = 2; // Must match grid gap in style
    const overlays: JSX.Element[] = [];

    const gridSlots = Array.from({ length: totalSlots }, (_, index) => {
      const x = index % width;
      const y = Math.floor(index / width);
      const itemId = grid[y]?.[x];
      const item = itemId ? items.get(itemId) : null;

      // Determine if this is the top-left cell for this item
      let isTopLeft = false;
      let topLeftX = x;
      let topLeftY = y;

      if (item && itemId) {
        // Find the top-left occurrence of this item in the grid
        let foundTopLeft = false;
        for (let scanY = 0; scanY < height && !foundTopLeft; scanY++) {
          for (let scanX = 0; scanX < width && !foundTopLeft; scanX++) {
            if (grid[scanY]?.[scanX] === itemId) {
              topLeftX = scanX;
              topLeftY = scanY;
              foundTopLeft = true;
            }
          }
        }
        isTopLeft = (x === topLeftX && y === topLeftY);
      }

      // Calculate image dimensions and create overlay if this is top-left
      if (item && isTopLeft && itemId) {
        const itemActualWidth = item.getActualWidth();
        const itemActualHeight = item.getActualHeight();
        // Total width = (slots * slotSize) + (gaps between slots)
        const imageWidth = (itemActualWidth * slotSize) + ((itemActualWidth - 1) * GAP_SIZE);
        const imageHeight = (itemActualHeight * slotSize) + ((itemActualHeight - 1) * GAP_SIZE);

        // Use itemId from grid cell for image lookup
        const itemImageSrc = itemImages.get(itemId) || null;

        if (itemImageSrc) {
          overlays.push(
            <img
              key={itemId}
              src={itemImageSrc}
              className="absolute pointer-events-none select-none"
              style={{
                left: `${topLeftX * (slotSize + GAP_SIZE)}px`,
                top: `${topLeftY * (slotSize + GAP_SIZE)}px`,
                width: `${imageWidth}px`,
                height: `${imageHeight}px`,
                objectFit: 'contain',
              }}
              alt={item.name}
            />
          );
        }
      }

      return (
        <GridSlot
          key={`${x}-${y}`}
          item={item}
          isEmpty={!item}
          gridType={gridType}
          isTopLeft={isTopLeft}
          itemImageSrc={null}
          imageWidth={0}
          imageHeight={0}
          isHovered={item?.instanceId === hoveredItem}
          onClick={() => handleItemClick(item, x, y)}
          onDrop={(e) => onSlotDrop?.(x, y, e)}
          onDragOver={(e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
          }}
          onDragStart={handleDragStart}
          onMouseEnter={() => item && setHoveredItem(item.instanceId)}
          onMouseLeave={() => setHoveredItem(null)}
          data-testid={`${containerId}-slot-${x}-${y}`}
        />
      );
    });

    return (
      <div className="relative overflow-visible">
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
          {gridSlots}
        </div>
        {overlays}
      </div>
    );
  };

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