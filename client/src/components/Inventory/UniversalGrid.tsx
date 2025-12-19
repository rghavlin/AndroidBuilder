import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import GridSlot from "./GridSlot";
import { useGridSize } from "@/contexts/GridSizeContext";
import { useInventory } from "@/contexts/InventoryContext";
import { imageLoader } from "@/game/utils/ImageLoader";

interface UniversalGridProps {
  containerId: string;
  container?: any; // Direct container object fallback
  title?: string;
  width: number;
  height: number;
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
  container: directContainer, // Destructure direct container
  title,
  width,
  height,
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
  const { getContainer, canOpenContainer, openContainer, inventoryVersion, closeContainer, selectedItem, selectItem, rotateSelected, clearSelected, placeSelected, getPlacementPreview } = useInventory();
  const [itemImages, setItemImages] = useState<Map<string, string>>(new Map());
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [previewOverlay, setPreviewOverlay] = useState<any>(null);
  const gridRef = useState<HTMLDivElement | null>(null);

  // Get fresh container data from context on every render, OR use direct container
  const container = directContainer || getContainer(containerId);
  const items = container?.items || new Map();
  const grid = container?.grid || [];

  // Choose slot size based on grid type
  const slotSize = gridType === 'fixed' ? fixedSlotSize : scalableSlotSize;

  // Handle rotation with R key
  useEffect(() => {
    if (!selectedItem) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        console.log('[UniversalGrid] R key - rotating selected item');
        rotateSelected();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        console.log('[UniversalGrid] Escape - clearing selection');
        clearSelected();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [selectedItem, rotateSelected, clearSelected]);

  // Force preview recalculation when selection rotation changes
  useEffect(() => {
    if (selectedItem) {
      console.debug('[UniversalGrid] Selection rotation changed:', selectedItem.rotation, '- preview will update on next mouse move');
    }
  }, [selectedItem?.rotation]);

  // Load item images when inventory changes (using inventoryVersion for stable dependency)
  useEffect(() => {
    const loadImages = async () => {
      const imageMap = new Map<string, string>();

      console.debug(`[UniversalGrid] Loading images for ${items.size} items in container ${containerId}`);

      for (const [mapKey, item] of items.entries()) {
        console.debug(`[UniversalGrid] Item Map entry - key: ${mapKey}, item.instanceId: ${item.instanceId}, item.id: ${item.id}, item.name: ${item.name}`);

        if (item.imageId) {
          try {
            const img = await imageLoader.getItemImage(item.imageId);
            if (img) {
              // CRITICAL: Store using the Map key (which should be instanceId)
              imageMap.set(mapKey, img.src);
              console.debug(`[UniversalGrid] Stored image for key: ${mapKey}`);
            }
          } catch (error) {
            console.warn('[UniversalGrid] Failed to load image for item:', item.name, error);
          }
        }
      }

      console.debug(`[UniversalGrid] Image map populated with ${imageMap.size} images`);
      setItemImages(imageMap);
    };

    if (items.size > 0) {
      loadImages();
    } else {
      // Clear images when container is empty
      setItemImages(new Map());
    }
  }, [inventoryVersion, containerId]); // Use inventoryVersion for stable dependency

  const handleItemClick = (item: any, x: number, y: number, event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();

    // Case 1: An item is already selected/carried
    if (selectedItem) {
      // If clicking the EXACT SAME item we are carrying, just deselect it (toggle)
      if (item && item.instanceId === selectedItem.item.instanceId) {
        console.debug('[UniversalGrid] Toggle-deselecting item:', item.name);
        clearSelected();
        return;
      }

      // Try to place or stack the selected item at the clicked coordinates
      const result = placeSelected(containerId, x, y);

      // If placement/stacking succeeded, we're done
      if (result.success) {
        return;
      }

      // If placement failed (e.g. occupied by another item), and that item is NOT stackable with ours,
      // then the user likely wants to SWITCH their selection to the clicked item.
      if (item && item.instanceId) {
        console.debug('[UniversalGrid] Placement failed, switching selection to:', item.name);
        // Important: use item.x/y for the origin coordinates, not the clicked x/y
        selectItem(item, containerId, item.x, item.y);
        return;
      }

      // If placement failed on empty space, just log a warning (or stay selected)
      console.warn('[UniversalGrid] Placement failed:', result.reason);
      return;
    }

    // Case 2: No item selected, so we select the clicked item
    if (item && item.instanceId) {
      console.debug('[UniversalGrid] Selecting item:', item.name, 'at grid pos:', item.x, item.y);
      selectItem(item, containerId, item.x, item.y);
      return;
    }

    // Case 3: Clicking empty space with no selection
    onSlotClick?.(x, y);
  };

  const handleItemContextMenu = async (item: any, x: number, y: number, event: React.MouseEvent) => {
    event.preventDefault(); // Prevent browser context menu

    console.debug('[UniversalGrid] Right-click on item:', {
      name: item?.name,
      instanceId: item?.instanceId,
      isContainer: item?.isContainer?.(),
      canOpen: item ? canOpenContainer(item) : false,
      isSelected: selectedItem && item && item.instanceId === selectedItem.item.instanceId
    });

    // If an item is selected, right-click rotates it
    if (selectedItem && item && item.instanceId === selectedItem.item.instanceId) {
      console.debug('[UniversalGrid] Right-click on selected item - rotating');
      rotateSelected();
      return;
    }

    // Right-click opens container if applicable
    console.debug('[UniversalGrid] Checking if item can be opened:', item?.name);
    if (item && canOpenContainer(item)) {
      try {
        console.debug('[UniversalGrid] Opening container item:', {
          name: item.name,
          instanceId: item.instanceId,
          hasContainerGrid: !!item.containerGrid,
          hasContainerGridData: !!item._containerGridData,
          containerGridData: item._containerGridData
        });

        // Force container initialization if needed
        if (item.isContainer() && !item.containerGrid) {
          console.debug('[UniversalGrid] Container grid not initialized, initializing now:', item.name);
          const result = item.initializeContainerGrid();
          console.debug('[UniversalGrid] Initialization result:', result);
        }

        const itemContainer = item.getContainerGrid();

        // 1. Standard Container (Backpack)
        if (itemContainer) {
          console.log('[UniversalGrid] Opening container via right-click:', item.name, 'ID:', itemContainer.id);
          // Register container with InventoryManager if not already registered
          const manager = (window as any).__inventoryManager;
          if (manager && !manager.getContainer(itemContainer.id)) {
            console.debug('[UniversalGrid] Registering container:', itemContainer.id);
            manager.addContainer(itemContainer);
          }
          openContainer(itemContainer.id);
          return;
        }

        // 2. Clothing with Pockets
        // If we get here, it means canOpenContainer was true, but getContainerGrid() was null.
        if (item.getPocketContainerIds) {
          const pocketIds = item.getPocketContainerIds();
          if (pocketIds && pocketIds.length > 0) {
            console.log('[UniversalGrid] Opening clothing item with pockets:', item.name);
            // Use a special prefix to tell InventoryPanel to treat this as a clothing item opener
            openContainer(`clothing:${item.instanceId}`);
            return;
          }
        }

        console.error('[UniversalGrid] Failed to get container grid for:', item.name, {
          hasContainerGridData: !!item._containerGridData,
          containerGridValue: item.containerGrid,
          containerGridDataContent: item._containerGridData
        });
        return;

        // 2. Clothing with Pockets
        // If we get here, it means canOpenContainer was true, but getContainerGrid() was null.
        // This likely means it's a clothing item with pockets.
        if (item.getPocketContainerIds) {
          const pocketIds = item.getPocketContainerIds();
          if (pocketIds && pocketIds.length > 0) {
            console.log('[UniversalGrid] Opening clothing item with pockets:', item.name);
            // Use a special prefix to tell InventoryPanel to treat this as a clothing item opener
            openContainer(`clothing:${item.instanceId}`);
            return;
          }
        }

        console.warn('[UniversalGrid] Item allowed to open but no container/pockets found:', item.name);
      } catch (error) {
        console.error('[UniversalGrid] Error getting container grid:', item.name, error);
      }
    } else if (item) {
      console.debug('[UniversalGrid] Item cannot be opened (not a container or not permitted):', item.name);
    }
  };

  const handleGridContextMenu = (event: React.MouseEvent<HTMLDivElement>) => {
    event.preventDefault();

    // If we have a selected item, right-click anywhere rotates it
    if (selectedItem) {
      console.log('[UniversalGrid] Right-click on grid - rotating selected item');
      rotateSelected();
    }
  };

  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!selectedItem) {
      setPreviewOverlay(null);
      return;
    }

    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const GAP_SIZE = 2;
    const slotWithGap = slotSize + GAP_SIZE;

    const gridX = Math.floor(x / slotWithGap);
    const gridY = Math.floor(y / slotWithGap);

    if (gridX >= 0 && gridX < width && gridY >= 0 && gridY < height) {
      // Recalculate preview with current selection rotation
      const preview = getPlacementPreview(containerId, gridX, gridY);
      setPreviewOverlay(preview);
    } else {
      setPreviewOverlay(null);
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

  const renderGrid = () => {
    const GAP_SIZE = 2; // Must match grid gap in style
    const overlays: JSX.Element[] = [];

    const gridSlots = Array.from({ length: totalSlots }, (_, index) => {
      const x = index % width;
      const y = Math.floor(index / width);
      const itemId = grid[y]?.[x];
      const item = itemId ? items.get(itemId) : null;

      // Prevent containers from being placed inside themselves
      // Check if the current item being rendered is a container and if its parent container's ID matches its own ID
      if (item && item.isContainer && item.isContainer()) {
        const itemContainer = item.getContainerGrid();
        if (itemContainer && itemContainer.id === containerId) {
          console.warn('[UniversalGrid] Preventing container from being placed inside itself:', item.name, 'containerId:', containerId);
          // Optionally, you could mark this slot as invalid or visually indicate the issue
          // For now, we'll just log a warning and let the drag/drop logic handle prevention
        }
      }

      // Determine if this is the top-left cell for this item
      let isTopLeft = false;
      let topLeftX = x;
      let topLeftY = y;

      if (item && itemId) {
        // Find the top-left cell of this item in the grid
        // Scan backwards to find where this itemId first appears
        let foundTopLeft = false;
        for (let scanY = 0; scanY <= y && !foundTopLeft; scanY++) {
          for (let scanX = 0; scanX < width; scanX++) {
            if (grid[scanY]?.[scanX] === itemId) {
              topLeftX = scanX;
              topLeftY = scanY;
              foundTopLeft = true;
              break;
            }
          }
        }
        isTopLeft = (x === topLeftX && y === topLeftY);
      }

      // Calculate image dimensions and create overlay if this is top-left
      if (item && isTopLeft && itemId) {
        // CRITICAL: Always use item.width and item.height (the ORIGINAL dimensions)
        // for the image container. CSS transform: rotate() handles the visual rotation.
        // Total width = (slots * slotSize) + (gaps between slots)
        const imageWidth = (item.width * slotSize) + ((item.width - 1) * GAP_SIZE);
        const imageHeight = (item.height * slotSize) + ((item.height - 1) * GAP_SIZE);

        // Use itemId from grid cell for image lookup
        const itemImageSrc = itemImages.get(itemId) || null;

        if (itemImageSrc) {
          // Calculate position accounting for grid gap
          // Position = (coordinate * slotSize) + (coordinate * gap) = coordinate * (slotSize + gap)
          const leftPos = topLeftX * (slotSize + GAP_SIZE);
          const topPos = topLeftY * (slotSize + GAP_SIZE);

          // Get rotation for CSS transform
          const rotation = item.rotation || 0;

          // Calculate grid footprint dimensions (what space the item actually occupies)
          const itemActualWidth = item.getActualWidth();
          const itemActualHeight = item.getActualHeight();
          const gridWidth = (itemActualWidth * slotSize) + ((itemActualWidth - 1) * GAP_SIZE);
          const gridHeight = (itemActualHeight * slotSize) + ((itemActualHeight - 1) * GAP_SIZE);

          // Calculate transform origin and position adjustments for rotation
          // Position adjustments based on grid footprint (actual occupied space)
          let transformStyle = '';
          let adjustedLeft = leftPos;
          let adjustedTop = topPos;

          if (rotation === 90) {
            // Rotate 90° clockwise - pivot from top-left, then shift right by grid width
            transformStyle = 'rotate(90deg)';
            adjustedLeft = leftPos + gridWidth;
            adjustedTop = topPos;
          } else if (rotation === 180) {
            // Rotate 180° - shift right and down by grid dimensions
            transformStyle = 'rotate(180deg)';
            adjustedLeft = leftPos + gridWidth;
            adjustedTop = topPos + gridHeight;
          } else if (rotation === 270) {
            // Rotate 270° clockwise (90° counter-clockwise) - pivot from top-left, then shift down
            transformStyle = 'rotate(270deg)';
            adjustedLeft = leftPos;
            adjustedTop = topPos + gridHeight;
          }

          console.debug('[UniversalGrid] Rendering overlay:', {
            itemName: item.name,
            rotation,
            topLeftX, topLeftY,
            slotSize, GAP_SIZE,
            leftPos, topPos,
            adjustedLeft, adjustedTop,
            imageWidth, imageHeight,
            gridWidth, gridHeight
          });

          // Check if this item is selected for movement
          const isItemSelected = selectedItem && item.instanceId === selectedItem.item.instanceId;

          overlays.push(
            <img
              key={itemId}
              src={itemImageSrc}
              className={cn(
                "absolute pointer-events-none select-none transition-opacity duration-200 max-w-none",
                isItemSelected && "opacity-40"
              )}
              style={{
                left: `${adjustedLeft}px`,
                top: `${adjustedTop}px`,
                width: `${imageWidth}px`,
                height: `${imageHeight}px`,
                objectFit: 'contain',
                transform: transformStyle,
                transformOrigin: 'top left',
              }}
              alt={item.name}
            />
          );
        }
      }

      // Show preview overlay for valid/invalid placement
      const isPreviewCell = previewOverlay &&
        x >= previewOverlay.gridX &&
        x < previewOverlay.gridX + previewOverlay.width &&
        y >= previewOverlay.gridY &&
        y < previewOverlay.gridY + previewOverlay.height;

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
          onClick={(e) => handleItemClick(item, x, y, e)}
          onContextMenu={(e) => handleItemContextMenu(item, x, y, e)}
          onMouseEnter={() => item && setHoveredItem(item.instanceId)}
          onMouseLeave={() => setHoveredItem(null)}
          data-testid={`${containerId}-slot-${x}-${y}`}
          className={cn(
            isPreviewCell && (previewOverlay.valid ? 'bg-green-500/20' : 'bg-red-500/20')
          )}
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
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setPreviewOverlay(null)}
          onContextMenu={handleGridContextMenu}
          data-testid={testId || `grid-${containerId}`}
        >
          {gridSlots}
        </div>
        {overlays}
      </div>
    );
  };

  return (
    <div
      className={cn("flex flex-col", gridType === 'fixed' ? 'flex-shrink-0' : 'h-full', className)}
      data-inventory-ui="true"
    >
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