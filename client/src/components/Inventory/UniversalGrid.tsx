import { cn } from "@/lib/utils";
import { getCategoryClass } from "@/lib/utils";
import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import GridSlot from "./GridSlot";
import { ItemContextMenu } from "./ItemContextMenu";
import { ItemTooltip } from "./ItemTooltip";
import FloatingContainerOverlay from "./FloatingContainerOverlay";
import { useGridSize } from "@/contexts/GridSizeContext";
import { useInventory } from "@/contexts/InventoryContext";
import { imageLoader } from "@/game/utils/ImageLoader";
import { useGame } from "../../contexts/GameContext.jsx";
import { useGameMap } from "../../contexts/GameMapContext.jsx";
import { useAction } from "../../contexts/ActionContext.jsx";
import { useAudio } from "../../contexts/AudioContext.jsx";
import { useCombat } from "../../contexts/CombatContext.jsx";
import { ItemTrait, ItemCategory } from "../../game/inventory/traits.js";
import { TURRET_DEF_ID } from "../../game/ai/TurretCombat.js";
import { getScaleFactor } from "@/hooks/useWindowSize";
import { Item, createItemFromDef } from "../../game/inventory/index.js";
import { ItemDefs } from "../../game/inventory/ItemDefs.js";
import { useLog } from "../../contexts/LogContext.jsx";
import engine from "../../game/GameEngine.js";
import { AttributeProgressionManager } from "../../game/systems/AttributeProgressionManager.js";
import { GAP_SIZE } from "./constants";
import { useTheme } from "../../contexts/ThemeContext";
import { rainbowBackground } from "@/lib/utils";

const getAdjustedBgColor = (bgColor: string | null, theme: string) => {
  if (!bgColor) {
    if (theme === 'light2') return 'rgba(255, 255, 255, 0.15)';
    if (theme === 'steampunk') return 'var(--sp-slab)';
    if (theme === 'metallic') return 'var(--metallic-slab)';
    return 'var(--card)';
  }
  const lower = bgColor.toLowerCase();
  if (theme === 'light2') {
    if (lower === '#006b18') return '#7BA899';
    if (lower === '#8a0303') return '#D48989';
    if (lower === '#0a2e5c') return '#6B9BC3';
    if (lower === '#5c653a') return '#8B956C';
    if (lower === '#1e1b4b') return '#A5B4FC';
  } else if (theme === 'light') {
    if (lower === '#006b18') return '#639A88';
    if (lower === '#8a0303') return '#C15C5C';
    if (lower === '#0a2e5c') return '#5C8AB3';
    if (lower === '#1e1b4b') return '#C7D2FE';
  } else if (theme === 'steampunk') {
    if (lower === '#006b18') return '#2e9e4f';
    if (lower === '#8a0303') return '#c0392b';
    if (lower === '#0a2e5c') return '#3a6ea5';
    if (lower === '#5c653a') return '#7a8450';
    if (lower === '#1e1b4b') return '#5c5a8a';
  }
  return bgColor;
};

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
  scrollbarGutter?: boolean;
  className?: string;
  gridType?: 'scalable' | 'fixed';
  slotClassName?: string;
  onSlotClick?: (x: number, y: number) => void;
  onSlotDrop?: (x: number, y: number, event: React.DragEvent) => void;
  onBeforeDrop?: (itemId: string, fromId: string, toId: string) => boolean;
  isTransparentGround?: boolean;
  tileImageUrl?: string;
  /* Overlay grids (wagon/sled/planter) sit on top of the vehicle art:
     opt out of theme panel chrome so the art stays visible underneath */
  transparentChrome?: boolean;
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
  enableScroll = false,
  enableHorizontalScroll = false,
  scrollbarGutter = false,
  className,
  gridType = 'scalable',
  slotClassName,
  onSlotClick,
  onSlotDrop,
  onBeforeDrop,
  "data-testid": testId,
  isTransparentGround = false,
  tileImageUrl,
  transparentChrome = false,
}: UniversalGridProps) {
  const totalSlots = width * height;
  const { theme } = useTheme();
  // Frozen ref so overlays memo doesn't rebuild on every inventoryVersion bump.
  // Theme only changes via the Settings menu — never during active gameplay.
  const themeRef = useRef(theme);
  themeRef.current = theme;
  const { scalableSlotSize, fixedSlotSize, isCalculated } = useGridSize();
  const { getContainer, canOpenContainer, openContainer, inventoryVersion, closeContainer, selectedItem, selectItem, rotateSelected, clearSelected, placeSelected, getPlacementPreview, depositSelectedInto, attachSelectedInto, loadAmmoInto, loadAmmoDirectly, fuelCampfire, fillFromSource, disassembleItem, pickSafeLock } = useInventory();
  const { targetingItem, startTargetingItem, cancelTargetingItem, digHole, fillHole, bagLooseSoil, plantSeed, harvestPlant, siphonFuel, transferFuel, harvestBrainstem, harvestEarbucks, pulpBrainstem } = useAction();
  const { targetingWeapon, cancelTargeting } = useCombat();
  const { playSound } = useAudio();
  const { addLog } = useLog();
  const { setMapTransition } = useGameMap();
  const { fireDialogAtPlayerTile, fireHelpEvent, isModalBlocking } = useGame();
  const [itemImages, setItemImages] = useState<Map<string, { src: string, imageId: string }>>(new Map());
  const itemImagesRef = useRef<Map<string, { src: string, imageId: string }>>(new Map());
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  // Sync ref with state
  useEffect(() => {
    itemImagesRef.current = itemImages;
  }, [itemImages]);

  // Request sequence ID to prevent stale updates
  const activeLoadIdRef = useRef(0);
  const [previewOverlay, setPreviewOverlay] = useState<any>(null);
  const [lastGridPos, setLastGridPos] = useState<{x: number, y: number} | null>(null);

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
    if (selectedItem && lastGridPos) {
      console.debug('[UniversalGrid] Selection rotation changed, recalculating preview at:', lastGridPos.x, lastGridPos.y);
      const preview = getPlacementPreview(containerId, lastGridPos.x, lastGridPos.y);
      setPreviewOverlay(preview);
    }
  }, [selectedItem?.rotation, lastGridPos, containerId, getPlacementPreview]);

  // Stable key representing items in the container. Changes ONLY when items are added, removed, or changed.
  const itemsKey = useMemo(() => {
    const itemsToProcess = items instanceof Map ? items : new Map(Object.entries(items || {}));
    const itemsArray = Array.from(itemsToProcess.entries()).map(([instanceId, item]: [string, any]) => {
      const imageId = item.imageId || item.defId;
      return `${instanceId}:${imageId}`;
    });
    const key = itemsArray.sort().join(',');
    console.log(`[UniversalGrid - ${containerId}] Calculated itemsKey: "${key}" (version: ${inventoryVersion})`);
    return key;
  }, [items, inventoryVersion, containerId]);

  // Load item images when inventory changes (using itemsKey for stable dependency)
  useEffect(() => {
    console.log(`[UniversalGrid - ${containerId}] useEffect triggered. itemsKey: "${itemsKey}"`);
    const itemsToProcess = items instanceof Map ? items : new Map(Object.entries(items || {}));
    const currentImages = itemImagesRef.current;
    
    // Filter out items already in the state map to avoid redundant work, unless their imageId has changed
    const changedOrMissingItems = Array.from(itemsToProcess.entries()).filter(([instanceId, item]) => {
      const imageId = item.imageId || item.defId;
      const entry = currentImages.get(instanceId);
      return !entry || entry.imageId !== imageId;
    });
    
    console.log(`[UniversalGrid - ${containerId}] changedOrMissingItems count: ${changedOrMissingItems.length}`);
    if (changedOrMissingItems.length === 0) return;

    const imageMap = new Map(currentImages);
    let changed = false;
    const asyncFetchQueue: Array<{ instanceId: string, imageId: string, name: string }> = [];

    // Synchronously resolve already cached images first to avoid layout shifts or lag
    for (const [instanceId, item] of changedOrMissingItems) {
      const imageId = item.imageId || item.defId;
      const cachedSrc = imageLoader.getCachedItemSrc(imageId);
      if (cachedSrc) {
        console.log(`[UniversalGrid - ${containerId}] Synced cache hit for item: ${item.name} (${imageId})`);
        imageMap.set(instanceId, { src: cachedSrc, imageId });
        changed = true;
      } else {
        console.log(`[UniversalGrid - ${containerId}] Async load needed for item: ${item.name} (${imageId})`);
        asyncFetchQueue.push({ instanceId, imageId, name: item.name });
      }
    }

    // If we only have synchronously resolved images, update state/ref and exit
    if (changed && asyncFetchQueue.length === 0) {
      console.log(`[UniversalGrid - ${containerId}] Only cached images resolved. Updating state.`);
      setItemImages(imageMap);
      itemImagesRef.current = imageMap;
      return;
    }

    // If we have new images to fetch, load them asynchronously in a race-safe manner
    if (asyncFetchQueue.length > 0) {
      const loadId = ++activeLoadIdRef.current;
      console.log(`[UniversalGrid - ${containerId}] Starting async fetch for ${asyncFetchQueue.length} items. loadId: ${loadId}`);
      
      const fetchImages = async () => {
        let asyncChanged = false;
        const asyncMap = new Map(imageMap);

        for (const { instanceId, imageId, name } of asyncFetchQueue) {
          try {
            console.log(`[UniversalGrid - ${containerId}] Loading image for ${name} (${imageId})...`);
            const img = await imageLoader.getItemImage(imageId);
            if (img) {
              console.log(`[UniversalGrid - ${containerId}] Successfully loaded image for ${name}`);
              asyncMap.set(instanceId, { src: img.src, imageId });
            } else {
              console.warn(`[UniversalGrid - ${containerId}] No image returned for ${name}`);
              asyncMap.set(instanceId, { src: 'failed', imageId });
            }
            asyncChanged = true;
          } catch (error) {
            console.warn('[UniversalGrid] Failed to load image for item:', name, error);
            asyncMap.set(instanceId, { src: 'failed', imageId });
            asyncChanged = true;
          }
        }

        console.log(`[UniversalGrid - ${containerId}] fetchImages completed. loadId check: ${loadId} vs current ${activeLoadIdRef.current}`);
        if (asyncChanged && loadId === activeLoadIdRef.current) {
          console.log(`[UniversalGrid - ${containerId}] Updating state with async loaded images.`);
          setItemImages(asyncMap);
          itemImagesRef.current = asyncMap;
        } else {
          console.log(`[UniversalGrid - ${containerId}] Discarded async result (loadId mismatch or no change).`);
        }
      };

      // Update state with any synchronous progress we made so far
      if (changed) {
        setItemImages(imageMap);
        itemImagesRef.current = imageMap;
      }

      fetchImages();
    }
  }, [itemsKey]);


  const handleItemClick = useCallback((item: any, x: number, y: number, event: React.MouseEvent) => {
    if (event.button !== 0) return;
    if (isModalBlocking) return;

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

    // Case -1: Handling Equipped Melee Tool targeting
    if (targetingWeapon) {
      if (item && item.disassembleData && containerId === 'ground' && targetingWeapon.slot === 'melee') {
        const toolId = item.disassembleData.toolId;
        let toolMatches = false;
        if (typeof toolId === 'string') {
          toolMatches = targetingWeapon.item.defId === toolId;
        } else if (toolId && toolId.either) {
          toolMatches = toolId.either.includes(targetingWeapon.item.defId);
        }
        
        if (toolMatches) {
          console.debug('[UniversalGrid] Disassembling item with equipped melee tool:', item.name, targetingWeapon.item.name);
          const result = disassembleItem(item, targetingWeapon.item);
          if (result.success) {
            cancelTargeting();
          }
          return;
        }
      }
      
      // If we clicked any item while targeting weapon but not disassembling, cancel targeting
      cancelTargeting();
      return;
    }

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

      if (targetingItem.plantsAs && containerId === 'ground') {
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

    // Harvest logic: any item with a 'produce' property is considered harvestable
    if (item && item.produce) {
       console.debug(`[UniversalGrid] Harvesting ${item.name} at:`, x, y);
       harvestPlant(item);
       return;
    }

    // Intercept clicks on zombie corpses to harvest brainstems (if knife selected) or earbucks (standard click)
    if (item && item.defId === 'zombie.corpse') {
      const isKnifeSelected = selectedItem && (
        selectedItem.item.hasCategory?.(ItemCategory.KNIFE) ||
        selectedItem.item.categories?.includes('knife') ||
        selectedItem.item.categories?.includes(ItemCategory.KNIFE)
      );

      if (isKnifeSelected) {
        harvestBrainstem(item, container);
      } else {
        harvestEarbucks(item);
      }
      return;
    }

    // Intercept clicks on zombie brainstems to smash into brain pulp (if hammer or stone is selected/carried)
    if (item && item.defId === 'zombie.brainstem') {
      const isHammerSelected = selectedItem && (
        selectedItem.item.hasCategory?.(ItemCategory.HAMMER) ||
        selectedItem.item.categories?.includes('hammer') ||
        selectedItem.item.categories?.includes(ItemCategory.HAMMER)
      );
      const isStoneSelected = selectedItem && selectedItem.item.defId === 'crafting.stone';

      if (isHammerSelected || isStoneSelected) {
        pulpBrainstem(item, container);
        return;
      }
    }

    // Intercept clicks on the help item to run its tutorial dialog. A help item
    // authored in the map editor carries an explicit eventId (the "Help Item
    // Event" picker); fire that. Fall back to the legacy tile-position lookup
    // for older help items placed without an explicit event reference.
    if (item && item.defId === 'placeable.help') {
      if (item.eventId) fireHelpEvent?.(item.eventId);
      else fireDialogAtPlayerTile?.();
      return;
    }

    // Intercept clicks on the exit item or stairs to trigger map transition
    if (item && (item.defId === 'placeable.exit' || item.defId === 'placeable.stairs_down' || item.defId === 'placeable.stairs_up')) {
      const gameMap = engine.gameMap;
      const player = engine.player;
      const worldManager = engine.worldManager;
      
      if (gameMap && player && worldManager) {
        console.debug('[UniversalGrid] Left-clicked transition item - triggering map transition dialog');
        
        let transitionInfo = null;
        
        if (item.defId === 'placeable.exit') {
          transitionInfo = worldManager.checkTransitionPoint({ x: player.x, y: player.y }, gameMap);
        } else {
          if (!item.transitionTargetId) {
             console.warn('[UniversalGrid] Stairs clicked but no transitionTargetId found on item!', item);
             return;
          }
          
          transitionInfo = {
            direction: item.defId === 'placeable.stairs_down' ? 'stairs_down' : 'stairs_up',
            position: { x: item.x !== undefined ? item.x : player.x, y: item.y !== undefined ? item.y : player.y },
            nextMapId: item.transitionTargetId,
            spawnPosition: (item.transitionTargetX !== undefined && item.transitionTargetY !== undefined) 
                           ? { x: item.transitionTargetX, y: item.transitionTargetY } 
                           : null,
            targetType: 'scenario',
            level: 1,
            isCustom: true
          };
        }
        
        if (transitionInfo) {
          if (setMapTransition) {
            setMapTransition(transitionInfo);
          } else {
            console.error('[UniversalGrid] setMapTransition is not defined');
          }
        } else {
          console.warn('[UniversalGrid] No transition point found for item:', item.defId);
        }
      } else {
        console.error('[UniversalGrid] Missing engine components for map transition');
      }
      return;
    }

    // Case 1: An item is already selected/carried
    if (selectedItem) {
      // Special Interaction: Cutting clothing into rags with a selected knife
      const isKnifeSelected = selectedItem.item.hasCategory?.(ItemCategory.KNIFE) || selectedItem.item.categories?.includes('knife') || selectedItem.item.categories?.includes(ItemCategory.KNIFE);
      const isClothingClicked = item?.hasCategory?.(ItemCategory.CLOTHING) || item?.categories?.includes('clothing') || item?.categories?.includes(ItemCategory.CLOTHING);
      
      if (isKnifeSelected && isClothingClicked) {
        const player = engine.player;
        if (!player || player.ap < 1) {
          addLog('Not enough AP to cut clothing into rags (1 required)', 'error');
          playSound('Fail');
          return;
        }

        // Check if clothing has items inside pockets/container grid
        const pockets = item.getPocketContainers?.() || [];
        const internalGrid = item.getContainerGrid?.();
        let hasItemsInside = false;
        if (internalGrid && internalGrid.items && internalGrid.items.size > 0) {
          hasItemsInside = true;
        }
        for (const pocket of pockets) {
          if (pocket.items && pocket.items.size > 0) {
            hasItemsInside = true;
          }
        }

        if (hasItemsInside) {
          addLog('Empty the pockets of the clothing before cutting it.', 'error');
          playSound('Fail');
          return;
        }

        // Proceed with cutting
        player.useAP(1);
        playSound('Click');

        // Create the rag item
        const ragData = createItemFromDef('crafting.rag');
        const ragItem = new Item(ragData);

        // Search for any existing stack of rags with space
        let merged = false;
        const potentialContainers = [
          engine.inventoryManager.getBackpackContainer(),
          ...engine.inventoryManager.getPocketContainers(),
          engine.inventoryManager.groundContainer
        ].filter(Boolean);

        for (const c of potentialContainers) {
          const stackTarget = engine.inventoryManager._findStackRecursive(c, ragItem);
          if (stackTarget) {
            const { existingItem, container: targetContainer } = stackTarget;
            existingItem.stackCount += 1;
            merged = true;
            console.log(`[UniversalGrid] Merged rag into existing stack in ${targetContainer.id}`);
            container.removeItem(item.instanceId);
            engine.inventoryManager.emit('inventoryChanged');
            break;
          }
        }

        if (!merged) {
          const clothingX = item.x;
          const clothingY = item.y;
          // Remove clothing first to free up the space
          container.removeItem(item.instanceId);
          
          // Add the rag at the exact same coordinates
          const placed = container.addItem(ragItem, clothingX, clothingY, false);
          if (!placed) {
            // Fallback: place anywhere in inventory/ground
            engine.inventoryManager.addItem(ragItem);
          }
        }

        addLog(`You cut ${item.name} into a rag.`, 'item');
        return;
      }

      // Special Interaction: Butchering rabbit carcass with selected knife
      const isCarcassClicked = item?.defId === 'food.rabbit_carcass';
      if (isKnifeSelected && isCarcassClicked) {
        const player = engine.player;
        if (!player || player.ap < 3) {
          addLog('Not enough AP to butcher rabbit carcass (3 required)', 'error');
          playSound('Fail');
          return;
        }

        // Proceed with butchering
        player.useAP(3);
        playSound('Click');

        // Award Strength and Agility experience
        AttributeProgressionManager.recordAction(player, 'BUTCHER_RABBIT');

        // Create raw meat
        const rawMeatData = createItemFromDef('food.raw_meat');
        const rawMeatItem = new Item(rawMeatData);

        // Replace carcass with raw meat at the same position in the container
        const originalX = item.x;
        const originalY = item.y;
        container.removeItem(item.instanceId);
        
        // Add raw meat at the same slot. If it doesn't fit, fall back to adding it anywhere or on ground.
        const placed = container.addItem(rawMeatItem, originalX, originalY, false);
        if (!placed) {
          engine.inventoryManager.addItem(rawMeatItem);
        }

        clearSelected(); // Deselect knife
        addLog('You butchered the rabbit carcass and obtained raw meat.', 'item');
        engine.inventoryManager.emit('inventoryChanged');
        return;
      }

      // Siphoning logic with selected hose (Targeting any fuel source: generator or fuel cover)
      const isHoseSelected = selectedItem.item.hasTrait?.(ItemTrait.CAN_SIPHON);
      const isFuelSourceClicked = item?.hasTrait?.(ItemTrait.FUEL_CONTAINER);
      if (isHoseSelected && isFuelSourceClicked && containerId === 'ground') {
        console.debug('[UniversalGrid] Siphoning fuel source with selected hose at:', x, y);
        siphonFuel(x, y, selectedItem.item);
        return;
      }

      // Fuel transfer logic (Fuel Can -> Generator)
      const isFuelCanSelected = selectedItem.item.hasTrait?.(ItemTrait.FUEL_CONTAINER);
      const isGeneratorClicked = item?.defId === 'furniture.generator';
      if (isFuelCanSelected && isGeneratorClicked) {
        console.debug('[UniversalGrid] Transferring fuel from can to generator');
        transferFuel(selectedItem.item, item);
        return;
      }

      // If clicking the EXACT SAME item we are carrying, just deselect it (toggle)
      if (item && item.instanceId === selectedItem.item.instanceId) {
        console.debug('[UniversalGrid] Toggle-deselecting item:', item.name);
        clearSelected();
        return;
      }

      // SPECIALIZED ACTION: Disassembly using a held tool (selectedItem)
      const disassembleData = item?.disassembleData;
      if (disassembleData && containerId === 'ground') {
        const toolId = disassembleData.toolId;
        let toolMatches = false;
        if (typeof toolId === 'string') {
          toolMatches = selectedItem.item.defId === toolId;
        } else if (toolId && toolId.either) {
          toolMatches = toolId.either.includes(selectedItem.item.defId);
        }
        
        if (toolMatches) {
          console.debug('[UniversalGrid] Disassembling item with held tool:', item.name, selectedItem.item.name);
          const result = disassembleItem(item, selectedItem.item);
          if (result.success) {
            clearSelected(); // Deselect the tool from the cursor!
          }
          return;
        }
      }

      // SPECIALIZED ACTION: Lockpicking a Safe using a held lockpick (selectedItem)
      const isLockpickSelected = selectedItem.item.defId === 'tool.lockpick';
      const isLockedSafeClicked = item?.defId === 'furniture.safe' && (item.isLocked !== false && (item.isLocked === true || ItemDefs[item.defId]?.isLocked === true));
      if (isLockpickSelected && isLockedSafeClicked && containerId === 'ground') {
        console.debug('[UniversalGrid] Lockpicking Safe with held lockpick:', item.name);
        const result = pickSafeLock(item, selectedItem.item);
        if (result.success) {
          clearSelected(); // Deselect the lockpick from the cursor!
        }
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
      
      // Phase 12: Apply placement restrictions if provided
      if (onBeforeDrop && !onBeforeDrop(selectedItem.item.instanceId, selectedItem.originContainerId, containerId)) {
        console.warn('[UniversalGrid] Action rejected by onBeforeDrop validator');
        playSound('Fail');
        clearSelected();
        return;
      }

      // Phase 7: Special behavior for planting seeds (left-click cursor interaction)
      const isSeedSelected = !!selectedItem.item.plantsAs;
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

      // NEW: Loose soil interaction with Hole
      const isLooseSoilSelected = selectedItem.item.defId === 'crafting.loose_soil';
      const isHoleClickedFill = item?.defId === 'provision.hole';
      if (isLooseSoilSelected && isHoleClickedFill && containerId === 'ground') {
        console.debug('[UniversalGrid] Filling hole with loose soil at:', x, y);
        const result = fillHole(selectedItem.item, item);
        if (result.success) {
          clearSelected();
          return;
        }
      }

      // NEW: Garbage bag interaction with Loose soil
      const isGarbageBagSelected = selectedItem.item.defId === 'crafting.garbage_bag';
      const isLooseSoilClicked = item?.defId === 'crafting.loose_soil';
      if (isGarbageBagSelected && isLooseSoilClicked && containerId === 'ground') {
        console.debug('[UniversalGrid] Bagging loose soil at:', x, y);
        const result = bagLooseSoil(selectedItem.item, item);
        if (result.success) {
          // If the bag was destroyed (last one), clear selection
          if (selectedItem.item.stackCount <= 0) {
            clearSelected();
          }
          return;
        }
      }

      // --- SPECIALIZED INTERACTIONS (Try these before standard placement) ---

      // Specialized Action 1: Weapon Loading / Attachment
      const isWeapon = (item?.hasCategory && item?.hasCategory(ItemCategory.WEAPON)) || (item?.attachmentSlots && item.attachmentSlots.length > 0);
      if (item && isWeapon) {
        const isDirectLoadGun = item.defId.startsWith('weapon.');
        const isAmmoSelected = selectedItem?.item?.hasCategory?.(ItemCategory.AMMO) ?? false;

        if (isDirectLoadGun && isAmmoSelected) {
          console.debug('[UniversalGrid] Direct-loading ammo into gun:', item.name);
          const loadResult = loadAmmoDirectly(item);
          if (loadResult.success) return;
        } else {
          console.debug('[UniversalGrid] Clicking weapon with selection - attempting quick attach into:', item.name);
          const attachResult = attachSelectedInto(item);
          if (attachResult.success) return;
        }
      }

      // Specialized Action 2: Water Filling (Source -> Bottle)
      const isBottle = selectedItem.item.hasTrait?.(ItemTrait.WATER_CONTAINER);
      const isWaterSource = item?.hasTrait?.(ItemTrait.WATER_SOURCE);
      if (isBottle && isWaterSource) {
        console.debug('[UniversalGrid] Filling bottle from water source:', selectedItem.item.name);
        fillFromSource(selectedItem.item, item, selectedItem.originContainerId, selectedItem.originX, selectedItem.originY, selectedItem.rotation);
        return;
      }

      // Specialized Action 3: Container Deposit
      const isContainer = item?.hasTrait?.(ItemTrait.CONTAINER) || (item?.getPocketContainers && item.getPocketContainers().length > 0);
      if (item && isContainer) {
        console.debug('[UniversalGrid] Clicking container with selection - attempting quick deposit into:', item.name);
        const depositResult = depositSelectedInto(item);
        if (depositResult.success) return;
      }

      // Specialized Action 4: Ammo Loading (Ammo -> Magazine)
      if (item && item.hasTrait && item.hasTrait(ItemTrait.MAGAZINE) && selectedItem.item.hasCategory && selectedItem.item.hasCategory(ItemCategory.AMMO)) {
        console.warn('[UniversalGrid] 🎯 Magazine detected! Attempting to load ammo:', {
          magName: item.name,
          ammoName: selectedItem.item.name,
          ammoCount: selectedItem.item.stackCount,
          coords: { x, y }
        });
        const loadResult = loadAmmoInto(item);
        if (loadResult.success) {
          console.log('[UniversalGrid] ✅ Ammo successfully loaded into magazine');
          return;
        } else {
          console.warn('[UniversalGrid] ❌ Failed to load ammo into magazine:', loadResult.reason);
        }
      }

      // --- FALLBACK: STANDARD PLACEMENT / STACKING ---
      console.log('[UniversalGrid] Falling back to standard placement at:', { x, y });
      const result = placeSelected(containerId, x, y);

      // If placement/stacking succeeded, we're done
      if (result.success) {
        return;
      }

      // Select Item: If we click an item while holding another and no specialized action occurred
      // If placement failed (e.g. occupied by another item), and that item is NOT stackable with ours,
      // then the user likely wants to SWITCH their selection to the clicked item.
      if (item && item.instanceId && result.reason !== 'Items inside') {
        // Phase 7 Fix: Prevent switching selection to non-movable or ground-only items
        const isGroundOnly = item.hasTrait?.(ItemTrait.GROUND_ONLY) || item.traits?.includes(ItemTrait.GROUND_ONLY) || (typeof item.isGroundOnly === 'function' && item.isGroundOnly());
        const isNoDrag = item.noDrag || (typeof item.hasTrait === 'function' && item.hasTrait(ItemTrait.NO_DRAG));
        const isDraggable = item.hasTrait?.(ItemTrait.DRAGGABLE) || item.traits?.includes(ItemTrait.DRAGGABLE);
        const isAutoTurret = item.defId === TURRET_DEF_ID;
        const isNoPickup = item.noPickup || ItemDefs[item.defId]?.noPickup === true;
        
        if (isNoPickup || isNoDrag || (isGroundOnly && containerId === 'ground' && !isDraggable && !isAutoTurret)) {
           console.debug('[UniversalGrid] Cannot switch selection to non-movable item:', item.name);
           return;
        }

        console.debug('[UniversalGrid] Placement failed, switching selection to:', item.name);
        // Important: use item.x/y for the origin coordinates, not the clicked x/y
        selectItem(item, containerId, item.x, item.y);
        return;
      }

      // If placement failed on empty space, just log a warning and cancel selection
      console.warn('[UniversalGrid] Placement failed:', result.reason);
      if (!result.reason) {
        console.debug('[UniversalGrid] Placement failed with no reason - likely blocked by checkPlayerTurn');
      }
      if (result.reason !== 'Items inside') {
        playSound('Fail');
      }
      clearSelected();
      return;
    }

    // Case 2: No item selected, so we select the clicked item
    if (item && item.instanceId) {
      const isGroundOnly = item.hasTrait?.(ItemTrait.GROUND_ONLY) || item.traits?.includes(ItemTrait.GROUND_ONLY) || (typeof item.isGroundOnly === 'function' && item.isGroundOnly());
      const isNoDrag = item.noDrag || (typeof item.hasTrait === 'function' && item.hasTrait(ItemTrait.NO_DRAG));
      const isDraggable = item.hasTrait?.(ItemTrait.DRAGGABLE) || item.traits?.includes(ItemTrait.DRAGGABLE);
      const isAutoTurret = item.defId === TURRET_DEF_ID;
      const isNoPickup = item.noPickup || ItemDefs[item.defId]?.noPickup === true;
      
      if (isNoPickup || isNoDrag || (isGroundOnly && containerId === 'ground' && !isDraggable && !isAutoTurret)) {
        console.debug('[UniversalGrid] Cannot pick up non-movable item:', item.name);
        return;
      }
      console.debug('[UniversalGrid] Selecting item:', item.name, 'at grid pos:', item.x, item.y);
      selectItem(item, containerId, item.x, item.y);
      return;
    }


    // Case 3: Clicking empty space with no selection
    onSlotClick?.(x, y);
  }, [containerId, grid, width, height, targetingItem, selectedItem, items, playSound, digHole, plantSeed, harvestPlant, clearSelected, fuelCampfire, placeSelected, loadAmmoDirectly, attachSelectedInto, depositSelectedInto, loadAmmoInto, selectItem, inventoryVersion, onBeforeDrop, setMapTransition, disassembleItem, targetingWeapon, cancelTargeting, pickSafeLock, fireDialogAtPlayerTile, fireHelpEvent, isModalBlocking]);

  const handleItemContextMenu = useCallback((item: any, x: number, y: number, event: React.MouseEvent) => {
    if (isModalBlocking) return;

    // If an item is selected, right-click on it rotates it
    if (selectedItem && item && item.instanceId === selectedItem.item.instanceId) {
      event.preventDefault();
      event.stopPropagation(); // Prevent bubble to context menu trigger
      console.debug('[UniversalGrid] Right-click on selected item - rotating');
      rotateSelected();
      return;
    }

    // Do NOT call event.preventDefault() or stopPropagation() here for non-selected items.
    // This allows the Radix ContextMenu (parent) to trigger for the item.
  }, [selectedItem, rotateSelected, isModalBlocking]);

  const handleSlotClick = useCallback((x: number, y: number) => {
    if (isModalBlocking) return;

    // This handles clicks on EMPTY slots or general slot clicks from nested grids
    console.debug('[UniversalGrid] handleSlotClick (prop) triggered at:', x, y, 'containerId:', containerId);

    // If we have a selected item, try to place it
    if (selectedItem) {
      // Phase 12: Apply placement restrictions if provided
      if (onBeforeDrop && !onBeforeDrop(selectedItem.item.instanceId, selectedItem.originContainerId, containerId)) {
        console.warn('[UniversalGrid] Placement rejected by onBeforeDrop validator');
        playSound('Fail');
        clearSelected();
        return;
      }

      const result = placeSelected(containerId, x, y);
      if (!result.success) {
        if (result.reason !== 'Items inside') {
          playSound('Fail');
        }
        clearSelected();
      }
      return;
    }

    // Otherwise, bubble up to parent if provided
    onSlotClick?.(x, y);
  }, [containerId, selectedItem, placeSelected, clearSelected, playSound, onSlotClick, onBeforeDrop, isModalBlocking]);

  const handleGridContextMenu = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    if (isModalBlocking) return;

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
  }, [targetingItem, targetingWeapon, selectedItem, cancelTargetingItem, cancelTargeting, rotateSelected, playSound, isModalBlocking]);

  const handleMouseMove = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    if (targetingItem) {
      if (targetingItem.hasTrait(ItemTrait.CAN_DIG) && containerId === 'ground') {
        const rect = event.currentTarget.getBoundingClientRect();
        const scale = getScaleFactor();
        const screenX = (event.clientX - rect.left) / scale;
        const screenY = (event.clientY - rect.top) / scale;
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
        const scale = getScaleFactor();
        const screenX = (event.clientX - rect.left) / scale;
        const screenY = (event.clientY - rect.top) / scale;
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
    const scale = getScaleFactor();
    const x = (event.clientX - rect.left) / scale;
    const y = (event.clientY - rect.top) / scale;

    const slotWithGap = slotSize + GAP_SIZE;

    const gridX = Math.floor(x / slotWithGap);
    const gridY = Math.floor(y / slotWithGap);

    if (gridX >= 0 && gridX < width && gridY >= 0 && gridY < height) {
      setLastGridPos({ x: gridX, y: gridY });
      // Recalculate preview with current selection rotation
      const preview = getPlacementPreview(containerId, gridX, gridY);
      setPreviewOverlay(preview);
    } else {
      setLastGridPos(null);
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
          className={slotClassName}
          isPreviewValid={isPreviewCell ? previewOverlay.valid : null}
          isTransparentGround={isTransparentGround}
        />
      );
    });
  }, [totalSlots, width, grid, items, gridType, hoveredItem, previewOverlay, containerId, handleItemClick, handleItemContextMenu, inventoryVersion, isTransparentGround]);

  const overlays = useMemo(() => {
    const result: JSX.Element[] = [];
    
    // We only need to iterate over UNIQUE items to create overlays
    const itemsToProcess = items instanceof Map ? Array.from(items.values()) : Object.values(items || {});
    
    itemsToProcess.forEach((item: any) => {
      const itemId = item.instanceId;
      
      // START OPTIMIZATION: Synchronous Cache Check
      let itemImageSrc = null;
      const currentImageId = item.imageId || item.defId;
      const entry = itemImages.get(itemId);
      if (entry && entry.imageId === currentImageId) {
        itemImageSrc = entry.src;
      }
      
      if (!itemImageSrc) {
          // If not in state yet, check the raw ImageLoader cache synchronously
          // This prevents the "flash" when opening containers with known items
          const cachedSrc = imageLoader.getCachedItemSrc(currentImageId);
          if (cachedSrc) {
              itemImageSrc = cachedSrc;
          }
      }
      // END OPTIMIZATION

      // Position logic from the original loop
      const topLeftX = item.x;
      const topLeftY = item.y;

      // Safety check: is this item actually in THIS grid?
      if (grid[topLeftY]?.[topLeftX] !== itemId) return;

      const itemActualWidth = item.getActualWidth();
      const itemActualHeight = item.getActualHeight();
      const gridWidth = (itemActualWidth * slotSize) + ((itemActualWidth - 1) * GAP_SIZE);
      const gridHeight = (itemActualHeight * slotSize) + ((itemActualHeight - 1) * GAP_SIZE);
      
      // For puddles, the "base" image size is the dynamic scaled size.
      // For other items, it's the static width/height (CSS rotation handles the rest).
      const isWaterSource = item.hasTrait?.(ItemTrait.WATER_SOURCE);
      const baseWidth = isWaterSource ? itemActualWidth : item.width;
      const baseHeight = isWaterSource ? itemActualHeight : item.height;
      
      const imageWidth = (baseWidth * slotSize) + ((baseWidth - 1) * GAP_SIZE);
      const imageHeight = (baseHeight * slotSize) + ((baseHeight - 1) * GAP_SIZE);
      const rotation = item.rotation || 0;

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
      const isVehiclePulled = engine.dragging?.item?.instanceId === itemId;
      const isVehicleRidden = engine.riding?.item?.instanceId === itemId;

      result.push(
        <ItemContextMenu
          key={`overlay-${itemId}`}
          item={item}
          tooltipContent={<ItemTooltip item={item} />}
          isDisabled={item?.defId === 'placeable.campfire'}
        >
          <div
            className={cn(
              "absolute select-none z-10 transition-all duration-200 rounded-[3px] sunken-item-slab",
              getCategoryClass(item),
              "cursor-grab active:cursor-grabbing",
              hoveredItem === itemId ? "brightness-125 scale-[1.01]" : "",
              isItemSelected ? (themeRef.current === 'light2' ? "ring-2 ring-[#E2A73F] border-[#E2A73F] selected-item-overlay" : themeRef.current === 'light' ? "ring-2 ring-black border-black selected-item-overlay" : "ring-2 ring-accent border-accent selected-item-overlay") : "",
              !isItemSelected && isVehiclePulled ? "vehicle-pull-border" : "",
              !isItemSelected && isVehicleRidden ? "vehicle-ride-border" : ""
            )}
            onClick={(e) => handleItemClick(item, topLeftX, topLeftY, e)}
            onContextMenu={(e) => handleItemContextMenu(item, topLeftX, topLeftY, e)}
            onMouseEnter={() => setHoveredItem(itemId)}
            onMouseLeave={() => setHoveredItem(null)}
            data-inventory-ui="true"
            data-testid={`overlay-${item.defId}`}
            style={{
              left: `${leftPos}px`,
              top: `${topPos}px`,
              width: `${gridWidth}px`,
              height: `${gridHeight}px`,
              background: (item.brainstemColors && item.brainstemColors.length > 1)
                ? rainbowBackground(item.brainstemColors)
                : getAdjustedBgColor(item.backgroundColor, themeRef.current),
              ...(item.borderColor ? {
                borderColor: item.borderColor,
                borderWidth: '1px',
                borderStyle: 'solid',
                boxShadow: `0 0 4px ${item.borderColor}`
              } : {})
            }}
          >
            {/* The trigger area for the context menu and tooltip is the entire item bounding box */}
            <div className="w-full h-full relative">
              {itemImageSrc && itemImageSrc !== 'failed' ? (
                <img
                  key={`${item.instanceId}:${theme}`}
                  src={itemImageSrc}
                  className={cn(
                    "absolute pointer-events-none select-none max-w-none",
                    !item.backgroundColor && (!themeRef.current.startsWith('dark') && themeRef.current !== 'metallic' ? "mix-blend-multiply" : "mix-blend-screen")
                  )}
                  style={{
                    left: `${adjustedLeft - leftPos}px`,
                    top: `${adjustedTop - topPos}px`,
                    width: `${imageWidth}px`,
                    height: `${imageHeight}px`,
                    objectFit: 'cover',
                    transform: transformStyle,
                    transformOrigin: 'top left',
                    filter: themeRef.current === 'steampunk' ? 'var(--sp-icon-filter)' : themeRef.current === 'metallic' ? 'var(--metallic-icon-filter)' : themeRef.current === 'light2' ? 'invert(0.75)' : themeRef.current === 'light' ? 'invert(1)' : undefined,
                  }}
                  alt={item.name}
                />
              ) : (
                <div 
                  className="absolute flex items-center justify-center bg-indigo-500/20 border border-indigo-400/50 rounded-sm"
                  style={{
                    left: `${adjustedLeft - leftPos}px`,
                    top: `${adjustedTop - topPos}px`,
                    width: `${imageWidth}px`,
                    height: `${imageHeight}px`,
                  }}
                >
                  <span className="text-[8px] font-black text-indigo-200 uppercase text-center leading-tight p-1">
                    {item.name}
                  </span>
                </div>
              )}

              {/* Recessed shadow overlay */}
              <div className="absolute inset-0 pointer-events-none shadow-[inset_0_3px_6px_rgba(0,0,0,0.85)] rounded-[3px] z-10" />

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

              {/* Growth Progress Indicator for Plants */}
              {item.defId !== 'placeable.campfire' && item.defId !== 'zombie.corpse' && item.lifetimeTurns !== null && (
                <div className="absolute inset-0 pointer-events-none z-20">
                  <span className="absolute top-0 right-0 text-[0.65rem] leading-none font-black text-green-400 bg-black/90 px-[3px] py-[1.5px] rounded-bl-sm shadow-[0_0_5px_rgba(74,222,128,0.3)] border-b border-l border-green-500/30 whitespace-nowrap flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                    {item.lifetimeTurns}h
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

              {item.getMeterPercent?.() !== null && (
                <div className="absolute bottom-0.5 left-0.5 right-0.5 h-1 bg-black/50 overflow-hidden rounded-full z-20 border-[0.5px] border-white/20">
                  <div
                    className="h-full shadow-[0_0_4px_rgba(255,255,255,0.2)]"
                    style={{ 
                      width: `${item.getMeterPercent()}%`,
                      backgroundColor: item.getMeterColor() || '#60a5fa'
                    }}
                  />
                </div>
              )}

              {/* Phase: Specialized Ground Container Overlay (Wagon/Sled/Hotplate/Turret) */}
              {(() => {
                const isScooter = item.hasTrait?.(ItemTrait.SCOOTER);
                const isHotplate = item.defId === 'tool.battery_powered_hotplate';
                const isAutoTurret = item.defId === TURRET_DEF_ID;
                const isSpecialGroundContainer = (isScooter || isHotplate || isAutoTurret || item.hasTrait?.(ItemTrait.VEHICLE) || item.hasTrait?.(ItemTrait.PLANTER)) && 
                                               (containerId === 'ground' || isScooter || (isAutoTurret && (containerId === 'ground' || container?.isVehicle)) || (item.hasTrait?.(ItemTrait.PLANTER) && (containerId.includes('-container') || containerId.includes('-grid'))));
                if (!isSpecialGroundContainer) return null;
                
                return (
                  <FloatingContainerOverlay 
                    item={item} 
                    slotSize={slotSize} 
                    gapSize={GAP_SIZE} 
                    containerId={containerId}
                    onSlotClick={handleSlotClick}
                    onSlotContextMenu={handleItemContextMenu}
                  />
                );
              })()}
            </div>
          </div>
        </ItemContextMenu>
      );
    });

    return result;
  }, [items, itemImages, grid, slotSize, selectedItem, handleGridContainerClick, inventoryVersion, hoveredItem, theme]);

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
          className={cn("grid flex-shrink-0", isTransparentGround && tileImageUrl && "tile-backed-grid", transparentChrome && "overlay-grid")}
          style={{
            gridTemplateColumns: `repeat(${width}, ${slotSize}px)`,
            gridTemplateRows: `repeat(${height}, ${slotSize}px)`,
            width: `${totalGridWidth}px`,
            height: `${totalGridHeight}px`,
            gap: `${GAP_SIZE}px`,
            ...(isTransparentGround && tileImageUrl ? {
              backgroundImage: `url(${tileImageUrl})`,
              backgroundRepeat: 'repeat',
              backgroundSize: '64px',
            } : {}),
          }}
          onMouseMove={(e) => {
            e.stopPropagation();
            handleMouseMove(e);
          }}
          onMouseLeave={() => {
            setLastGridPos(null);
            setPreviewOverlay(null);
          }}
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
      className={cn(
        "flex flex-col",
        (gridType === 'fixed' && !enableScroll) ? 'flex-shrink-0' : 'flex-1 min-h-0',
        transparentChrome && "overlay-grid",
        className
      )}
      style={{
        width: `${totalGridWidth + (enableScroll ? 12 : 0)}px`,
      }}
      data-inventory-ui="true"
      onClick={handleGridContainerClick}
    >
      {title && (
        <h4 className="text-xs font-medium text-muted-foreground mb-2 text-center flex-shrink-0">
          {title}
        </h4>
      )}

      <div
        className={cn(
          "w-full",
          (gridType === 'scalable' || enableScroll) ? 
            cn(enableHorizontalScroll ? 'overflow-auto' : 'overflow-y-auto overflow-x-hidden', 'custom-scrollbar', 'flex-1 min-h-0') : 
            'overflow-visible'
        )}
        style={{
          maxHeight: enableScroll ? maxHeight : 'none',
          maxWidth: `${totalGridWidth + (enableScroll ? 12 : 0)}px`,
          width: `${totalGridWidth + (enableScroll ? 12 : 0)}px`,
          height: (gridType === 'fixed' && !enableScroll) ? `${totalGridHeight}px` : undefined,
        }}
        onClick={handleGridContainerClick}
      >
        {renderGrid()}
      </div>
    </div>
  );
}