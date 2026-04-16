import { cn } from "@/lib/utils";
import { useState, useEffect, useCallback, useMemo } from "react";
import GridSlot from "./GridSlot";
import { useGridSize } from "@/contexts/GridSizeContext";
import { useInventory } from "@/contexts/InventoryContext";
import { imageLoader } from "@/game/utils/ImageLoader";
import { useGame } from "../../contexts/GameContext.jsx";
import { useAction } from "../../contexts/ActionContext.jsx";
import { useAudio } from "../../contexts/AudioContext.jsx";
import { useCombat } from "../../contexts/CombatContext.jsx";
import { ItemTrait } from "../../game/inventory/traits.js";

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
  const GAP_SIZE = 2;
  const totalSlots = width * height;
  const { scalableSlotSize, fixedSlotSize, isCalculated } = useGridSize();
  const { getContainer, canOpenContainer, openContainer, inventoryVersion, closeContainer, selectedItem, selectItem, rotateSelected, clearSelected, placeSelected, getPlacementPreview, depositSelectedInto, attachSelectedInto, loadAmmoInto, loadAmmoDirectly, fuelCampfire } = useInventory();
  const { targetingItem, startTargetingItem, cancelTargetingItem, digHole, plantSeed, harvestPlant } = useAction();
  const { targetingWeapon, cancelTargeting } = useCombat();
  const { playSound } = useAudio();
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
    let isMounted = true;
    const loadImages = async () => {
      const itemsToProcess = items instanceof Map ? items : new Map(Object.entries(items || {}));
      
      // Filter out items already in the state map to avoid redundant work
      const missingItems = Array.from(itemsToProcess.entries()).filter(([instanceId]) => !itemImages.has(instanceId));
      
      if (missingItems.length === 0) return;

      const imageMap = new Map(itemImages);
      let changed = false;

      for (const [instanceId, item] of missingItems) {
        try {
          const imageId = item.imageId || item.defId;
          const img = await imageLoader.getItemImage(imageId);
          if (img && isMounted) {
            imageMap.set(instanceId, img.src);
            changed = true;
          }
        } catch (error) {
          console.warn('[UniversalGrid] Failed to load image for item:', item.name, error);
        }
      }
      
      if (changed && isMounted) {
        setItemImages(imageMap);
      }
    };
    loadImages();
    return () => { isMounted = false; };
  }, [items, inventoryVersion, itemImages]);


  const handleItemClick = useCallback((item: any, x: number, y: number, event: React.MouseEvent) => {
    console.warn('[UniversalGrid] handleItemClick triggered:', { 
      containerId, 
      itemId: item?.instanceId, 
      x, y, 
      hasSelectedItem: !!selectedItem 
    });
    event.preventDefault();
    event.stopPropagation();

    // Play tactile feedback sound
    playSound('Click');

    // Case 0: Handling Targeting (e.g. Shovel Digging)
    if (targetingItem) {
      if (targetingItem.hasTrait(ItemTrait.CAN_DIG) && containerId === 'ground') {
        const canDig = x <= width - 2 && y <= height - 2;
        if (!canDig) {
          console.warn('[UniversalGrid] Cannot dig: Too close to edge');
          return;
        }

        // Check 2x2 area
        let allEmpty = true;
        for (let dy = 0; dy < 2; dy++) {
          for (let dx = 0; dx < 2; dx++) {
            if (grid[y + dy]?.[x + dx]) {
              allEmpty = false;
              break;
            }
          }
          if (!allEmpty) break;
        }

        if (allEmpty) {
          console.debug('[UniversalGrid] Digging 2x2 hole at:', x, y);
          digHole(x, y);
        } else {
          console.warn('[UniversalGrid] Cannot dig: Area is occupied');
        }
        return;
      }

      const seedTypes = ['food.cornseeds', 'food.tomatoseeds', 'food.carrotseeds'];
      if (seedTypes.includes(targetingItem.defId) && containerId === 'ground') {
        // Seeds are planted in 2x2 holes
        const result = plantSeed(x, y);
        if (result.success) {
          console.debug('[UniversalGrid] Planted seeds at:', x, y);
        } else {
          // If planting failed (e.g. clicking a non-hole), cancel targeting/selection
          cancelTargetingItem();
        }
        return;
      }
    }

    // Harvest logic
    const harvestableTypes = ['provision.harvestable_corn', 'provision.harvestable_tomato', 'provision.harvestable_carrot'];
    if (item && harvestableTypes.includes(item.defId)) {
       console.debug(`[UniversalGrid] Harvesting ${item.name} at:`, x, y);
       harvestPlant(item);
       return;
    }

    // Case 1: An item is already selected/carried
    if (selectedItem) {
      // If clicking the EXACT SAME item we are carrying, just deselect it (toggle)
      if (item && item.instanceId === selectedItem.item.instanceId) {
        console.debug('[UniversalGrid] Toggle-deselecting item:', item.name);
        clearSelected();
        return;
      }

      // SPECIAL CASE: Fueling a campfire
      const isFuel = selectedItem.item.hasCategory?.('fuel') || selectedItem.item.categories?.includes('fuel');
      const isCampfire = item?.defId === 'placeable.campfire';
      if (isFuel && isCampfire) {
        console.debug('[UniversalGrid] Fueling campfire with:', selectedItem.item.name);
        fuelCampfire(selectedItem.item, item);
        return;
      }

      // Try to place or stack the selected item at the clicked coordinates
      
      // Phase 7: Special behavior for planting seeds (left-click cursor interaction)
      const seedTypes = ['food.cornseeds', 'food.tomatoseeds', 'food.carrotseeds'];
      const isSeedSelected = seedTypes.includes(selectedItem.item.defId);
      const isHoleClicked = item?.defId === 'provision.hole';
      
      if (isSeedSelected && isHoleClicked && containerId === 'ground') {
        console.debug('[UniversalGrid] Quick planting selected seeds into hole at:', x, y);
        const result = plantSeed(x, y, selectedItem.item);
        if (result.success) {
           playSound('Click');
           // If the last seed was used, clear the selection state
           if (selectedItem.item.stackCount <= 0) {
             console.debug('[UniversalGrid] Last seed planted, clearing selection');
             clearSelected();
           }
           return;
        }
      }

      const result = placeSelected(containerId, x, y);

      // If placement/stacking succeeded, we're done
      if (result.success) {
        return;
      }

      // Quick Attachment: If clicking on a weapon while carrying an item, try to attach it
      const isWeapon = item?.isWeapon?.() || (item?.attachmentSlots && item.attachmentSlots.length > 0);
      if (item && isWeapon) {
        // Direct-load guns (.357, Hunting Rifle, Shotgun) bypass the accessibility guard
        // so that ammo can be loaded whether the gun is equipped, in backpack, or on ground.
        const directLoadDefs = ['weapon.357Pistol', 'weapon.hunting_rifle', 'weapon.shotgun'];
        const isDirectLoadGun = directLoadDefs.includes(item.defId);
        const isAmmoSelected = selectedItem?.item?.isAmmo?.() ?? false;

        if (isDirectLoadGun && isAmmoSelected) {
          console.debug('[UniversalGrid] Direct-loading ammo into gun:', item.name);
          const loadResult = loadAmmoDirectly(item);
          if (loadResult.success) return;
        } else {
          console.debug('[UniversalGrid] Clicking weapon with selection - attempting quick attach into:', item.name);
          const attachResult = attachSelectedInto(item);
          if (attachResult.success) {
            return;
          }
        }
      }

      // Quick Deposit: If clicking on a container while carrying an item, try to deposit it
      const isContainer = item?.isContainer?.() || (item?.getPocketContainers && item.getPocketContainers().length > 0);
      if (item && isContainer) {
        console.debug('[UniversalGrid] Clicking container with selection - attempting quick deposit into:', item.name);
        const depositResult = depositSelectedInto(item);
        if (depositResult.success) {
          return;
        }
      }

      // Ammo Loading: If clicking on a magazine while carrying ammo, try to load it
      if (item && item.isMagazine && item.isMagazine() && selectedItem.item.isAmmo && selectedItem.item.isAmmo()) {
        console.debug('[UniversalGrid] Clicking magazine with ammo selection - attempting load into:', item.name);
        const loadResult = loadAmmoInto(item);
        if (loadResult.success) {
          return;
        }
      }

      // If placement failed (e.g. occupied by another item), and that item is NOT stackable with ours,
      // then the user likely wants to SWITCH their selection to the clicked item.
      if (item && item.instanceId) {
        // Phase 7 Fix: Prevent switching selection to ground-only items (holes, beds, etc.)
        const isGroundOnly = item.hasTrait?.('ground_only') || item.traits?.includes('ground_only') || (typeof item.isGroundOnly === 'function' && item.isGroundOnly());
        
        if (isGroundOnly) {
           console.debug('[UniversalGrid] Cannot switch selection to ground-only item:', item.name);
           return;
        }

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
      const isGroundOnly = item.hasTrait?.('ground_only') || item.traits?.includes('ground_only') || (typeof item.isGroundOnly === 'function' && item.isGroundOnly());
      
      if (isGroundOnly) {
        console.debug('[UniversalGrid] Cannot pick up ground-only item:', item.name);
        return;
      }
      console.debug('[UniversalGrid] Selecting item:', item.name, 'at grid pos:', item.x, item.y);
      selectItem(item, containerId, item.x, item.y);
      return;
    }

    // Case 3: Clicking empty space with no selection
    onSlotClick?.(x, y);
  }, [containerId, grid, width, height, targetingItem, selectedItem, items, playSound, digHole, plantSeed, harvestPlant, clearSelected, fuelCampfire, placeSelected, loadAmmoDirectly, attachSelectedInto, depositSelectedInto, loadAmmoInto, selectItem, inventoryVersion]);

  const handleItemContextMenu = useCallback((item: any, x: number, y: number, event: React.MouseEvent) => {
    // If an item is selected, right-click on it rotates it
    if (selectedItem && item && item.instanceId === selectedItem.item.instanceId) {
      event.preventDefault();
      console.debug('[UniversalGrid] Right-click on selected item - rotating');
      rotateSelected();
      return;
    }

    // Do NOT call event.preventDefault() here.
    // This allows the Radix ContextMenu to trigger for the item.
  }, [selectedItem, rotateSelected]);

  const handleGridContextMenu = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    // 1. Priority: Handle active targeting (e.g. Shovel Digging)
    if (targetingItem || targetingWeapon) {
      event.preventDefault();
      event.stopPropagation();
      console.log('[UniversalGrid] Right-click while targeting - canceling');
      if (targetingItem) cancelTargetingItem();
      if (targetingWeapon) cancelTargeting();
      playSound('Click');
      return;
    }

    // 2. Secondary: If we have a selected item, right-click anywhere rotates it
    if (selectedItem) {
      event.preventDefault();
      console.log('[UniversalGrid] Right-click on grid - rotating selected item');
      rotateSelected();
    }
  }, [targetingItem, targetingWeapon, selectedItem, cancelTargetingItem, cancelTargeting, rotateSelected, playSound]);

  const handleMouseMove = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    if (targetingItem) {
      if (targetingItem.hasTrait(ItemTrait.CAN_DIG) && containerId === 'ground') {
        const rect = event.currentTarget.getBoundingClientRect();
        const screenX = event.clientX - rect.left;
        const screenY = event.clientY - rect.top;
        const slotWithGap = slotSize + GAP_SIZE;
        const gridX = Math.floor(screenX / slotWithGap);
        const gridY = Math.floor(screenY / slotWithGap);

        if (gridX >= 0 && gridX <= width - 2 && gridY >= 0 && gridY <= height - 2) {
          // Check 2x2 area
          let allEmpty = true;
          for (let dy = 0; dy < 2; dy++) {
            for (let dx = 0; dx < 2; dx++) {
              if (grid[gridY + dy]?.[gridX + dx]) {
                allEmpty = false;
                break;
              }
            }
            if (!allEmpty) break;
          }

          setPreviewOverlay({
            gridX,
            gridY,
            width: 2,
            height: 2,
            valid: allEmpty
          });
        } else {
          setPreviewOverlay(null);
        }
        return;
      }

      const seedTypes = ['food.cornseeds', 'food.tomatoseeds', 'food.carrotseeds'];
      if (seedTypes.includes(targetingItem.defId) && containerId === 'ground') {
        const rect = event.currentTarget.getBoundingClientRect();
        const screenX = event.clientX - rect.left;
        const screenY = event.clientY - rect.top;
        const slotWithGap = slotSize + GAP_SIZE;
        const gridX = Math.floor(screenX / slotWithGap);
        const gridY = Math.floor(screenY / slotWithGap);

        if (gridX >= 0 && gridX < width && gridY >= 0 && gridY < height) {
          // Valid if there is a hole at this position
          const holeId = grid[gridY]?.[gridX];
          const holeItem = holeId ? items.get(holeId) : null;
          const isValid = holeItem?.defId === 'provision.hole' && holeItem.x === gridX && holeItem.y === gridY;

          setPreviewOverlay({
            gridX,
            gridY,
            width: 2,
            height: 2,
            valid: isValid
          });
        } else {
          setPreviewOverlay(null);
        }
        return;
      }
    }

    if (!selectedItem) {
      setPreviewOverlay(null);
      return;
    }

    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

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
  }, [targetingItem, containerId, slotSize, width, height, grid, items, selectedItem, getPlacementPreview, inventoryVersion]);

  // Dynamic grid dimensions based on calculated slot size (+ gaps)
  const totalGridWidth = (width * slotSize) + ((width - 1) * GAP_SIZE);
  const totalGridHeight = (height * slotSize) + ((height - 1) * GAP_SIZE);


  // For fixed grids, don't wait for calculation - they use a constant size
  // For scalable grids, wait for calculation to prevent layout shifts

  const handleGridContainerClick = useCallback((e: React.MouseEvent) => {
    // Prevent clicks in the gaps between slots from bubbling to the map
    e.stopPropagation();
  }, []);

  const gridSlots = useMemo(() => {
    return Array.from({ length: totalSlots }, (_, index) => {
      const x = index % width;
      const y = Math.floor(index / width);
      const itemId = grid[y]?.[x];
      const item = itemId ? items.get(itemId) : null;

      // Determine if this is the top-left cell for this item
      let isTopLeft = false;
      if (item && itemId) {
          isTopLeft = (x === item.x && y === item.y);
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
  }, [totalSlots, width, grid, items, gridType, hoveredItem, previewOverlay, containerId, handleItemClick, handleItemContextMenu, inventoryVersion]);

  const overlays = useMemo(() => {
    const result: JSX.Element[] = [];
    
    // We only need to iterate over UNIQUE items to create overlays
    const itemsToProcess = items instanceof Map ? Array.from(items.values()) : Object.values(items || {});
    
    itemsToProcess.forEach((item: any) => {
      const itemId = item.instanceId;
      
      // START OPTIMIZATION: Synchronous Cache Check
      let itemImageSrc = itemImages.get(itemId) || null;
      
      if (!itemImageSrc) {
          // If not in state yet, check the raw ImageLoader cache synchronously
          // This prevents the "flash" when opening containers with known items
          const imageId = item.imageId || item.defId;
          // casting as any because we know 'images' exists on the singleton
          const cached = (imageLoader as any).images[`item_${imageId}`];
          if (cached && cached.src) {
              itemImageSrc = cached.src;
          }
      }
      
      if (!itemImageSrc) return;
      // END OPTIMIZATION

      // Position logic from the original loop
      const topLeftX = item.x;
      const topLeftY = item.y;

      // Safety check: is this item actually in THIS grid?
      if (grid[topLeftY]?.[topLeftX] !== itemId) return;

      const imageWidth = (item.width * slotSize) + ((item.width - 1) * GAP_SIZE);
      const imageHeight = (item.height * slotSize) + ((item.height - 1) * GAP_SIZE);
      const rotation = item.rotation || 0;
      const itemActualWidth = item.getActualWidth();
      const itemActualHeight = item.getActualHeight();
      const gridWidth = (itemActualWidth * slotSize) + ((itemActualWidth - 1) * GAP_SIZE);
      const gridHeight = (itemActualHeight * slotSize) + ((itemActualHeight - 1) * GAP_SIZE);

      const leftPos = topLeftX * (slotSize + GAP_SIZE);
      const topPos = topLeftY * (slotSize + GAP_SIZE);

      let transformStyle = '';
      let adjustedLeft = leftPos;
      let adjustedTop = topPos;

      if (rotation === 90) {
        transformStyle = 'rotate(90deg)';
        adjustedLeft = leftPos + gridWidth;
        adjustedTop = topPos;
      } else if (rotation === 180) {
        transformStyle = 'rotate(180deg)';
        adjustedLeft = leftPos + gridWidth;
        adjustedTop = topPos + gridHeight;
      } else if (rotation === 270) {
        transformStyle = 'rotate(270deg)';
        adjustedLeft = leftPos;
        adjustedTop = topPos + gridHeight;
      }

      const isItemSelected = selectedItem && item.instanceId === selectedItem.item.instanceId;

      result.push(
        <div
          key={`overlay-${itemId}`}
          className={cn(
            "absolute pointer-events-none select-none z-10 border border-white/20",
            isItemSelected && "border-white/10"
          )}
          onClick={handleGridContainerClick}
          data-inventory-ui="true"
          style={{
            left: `${leftPos}px`,
            top: `${topPos}px`,
            width: `${gridWidth}px`,
            height: `${gridHeight}px`,
          }}
        >
          <img
            src={itemImageSrc}
            className={cn(
              "absolute pointer-events-none select-none transition-opacity duration-200 max-w-none",
              isItemSelected && "opacity-40"
            )}
            style={{
              left: `${adjustedLeft - leftPos}px`,
              top: `${adjustedTop - topPos}px`,
              width: `${imageWidth}px`,
              height: `${imageHeight}px`,
              objectFit: 'cover',
              transform: transformStyle,
              transformOrigin: 'top left',
            }}
            alt={item.name}
          />

          {item.stackCount > 1 && (
            <div className="absolute inset-0 pointer-events-none z-20">
              <span className="absolute top-0 right-0 text-[0.65rem] leading-none font-bold text-white bg-black/85 px-[2px] py-[1px] rounded-bl-sm shadow-sm border-b border-l border-white/20 whitespace-nowrap">
                {item.stackCount}
              </span>
            </div>
          )}

          {item.defId === 'placeable.campfire' && item.lifetimeTurns !== null && (
            <div className="absolute inset-0 pointer-events-none z-20">
              <span className="absolute top-0 right-0 text-[0.65rem] leading-none font-black text-orange-400 bg-black/90 px-[3px] py-[1.5px] rounded-bl-sm shadow-[0_0_5px_rgba(251,146,60,0.4)] border-b border-l border-orange-500/30 whitespace-nowrap flex items-center gap-0.5">
                <span className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-pulse" />
                {item.lifetimeTurns.toFixed(1)}
              </span>
            </div>
          )}

          {typeof item.getDisplayAmmoCount === 'function' && item.getDisplayAmmoCount() !== null && (
            <div className="absolute inset-0 pointer-events-none z-20">
              <span className="absolute bottom-0 right-0 text-[0.65rem] leading-none font-bold text-white bg-black/85 px-[2px] py-[1px] rounded-tl-sm shadow-sm border-t border-l border-white/20 whitespace-nowrap">
                {item.getDisplayAmmoCount()}
              </span>
            </div>
          )}

          {item.isSpoiled && (
            <div className="absolute inset-0 pointer-events-none z-30 flex items-center justify-center">
              <span className="text-[10px] font-black text-red-500 bg-black/80 px-1 py-0.5 rounded border border-red-500/50 shadow-[0_0_10px_rgba(239,68,68,0.5)] rotate-[-15deg] uppercase tracking-tighter">
                Spoiled
              </span>
            </div>
          )}

          {item.isWaterBottle && item.isWaterBottle() && (
            <div className="absolute bottom-0.5 left-0.5 right-0.5 h-1 bg-black/50 overflow-hidden rounded-full z-20 border-[0.5px] border-white/20">
              <div
                className={cn(
                  "h-full shadow-[0_0_4px_rgba(96,165,250,0.6)]",
                  item.waterQuality === 'dirty' ? "bg-[#8B4513]" : "bg-blue-400"
                )}
                style={{ width: `${item.getWaterPercent()}%` }}
              />
            </div>
          )}
        </div>
      );
    });

    return result;
  }, [items, itemImages, grid, slotSize, GAP_SIZE, selectedItem, handleGridContainerClick, inventoryVersion]);

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
    return (
      <div className="relative overflow-visible">
        <div
          className="grid flex-shrink-0"
          style={{
            gridTemplateColumns: `repeat(${width}, ${slotSize}px)`,
            gridTemplateRows: `repeat(${height}, ${slotSize}px)`,
            width: `${totalGridWidth}px`,
            height: `${totalGridHeight}px`,
            gap: `${GAP_SIZE}px`,
          }}
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setPreviewOverlay(null)}
          onContextMenu={handleGridContextMenu}
          data-testid={testId || `grid-${containerId}`}
          data-inventory-ui="true"
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
          width: gridType === 'fixed' ? `${totalGridWidth}px` : undefined,
          height: gridType === 'fixed' ? `${totalGridHeight}px` : undefined,
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