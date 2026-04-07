import React, { createContext, useContext, useRef, useState, useCallback, useMemo, useEffect } from 'react';
import { ItemTrait } from '../game/inventory/traits.js';
import { ItemDefs, createItemFromDef } from '../game/inventory/ItemDefs.js';
import { Item } from '../game/inventory/Item.js';
import { CraftingRecipes } from '../game/inventory/CraftingRecipes.js';
import { usePlayer } from './PlayerContext.jsx';
import { useLog } from './LogContext.jsx';
import { useAudio } from './AudioContext.jsx';
import Logger from '../game/utils/Logger.js';

const logger = Logger.scope('InventoryContext');

const InventoryContext = createContext();

export const useInventory = () => {
  const context = useContext(InventoryContext);
  if (!context) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[useInventory] Context not available during hot reload, providing fallback');
      return {
        inventoryRef: { current: null },
        inventoryVersion: 0,
        getContainer: () => null,
        getEquippedBackpackContainer: () => null,
        getEncumbranceModifiers: () => ({ evade: 0, ap: 0 }),
        canOpenContainer: () => false,
        equipItem: () => ({ success: false, reason: 'Context not available' }),
        unequipItem: () => ({ success: false, reason: 'Context not available' }),
        destroyItem: () => false,
        moveItem: () => ({ success: false, reason: 'Context not available' }),
        dropItemToGround: () => false,
        forceRefresh: () => { },
        openContainers: new Set(),
        openContainer: () => { },
        closeContainer: () => { },
        isContainerOpen: () => false,
        selectedItem: null,
        selectItem: () => { },
        rotateSelected: () => { },
        clearSelected: () => { },
        placeSelected: () => ({ success: false }),
        getPlacementPreview: () => null,
        equipSelectedItem: () => ({ success: false }),
        splitStack: () => ({ success: false }),
        depositSelectedInto: () => ({ success: false }),
        loadAmmoInto: () => ({ success: false }),
        loadAmmoDirectly: () => ({ success: false }),
        unloadMagazine: () => ({ success: false }),
        attachSelectedItemToWeapon: () => ({ success: false }),
        detachItemFromWeapon: () => null
      };
    }
    throw new Error('useInventory must be used within an InventoryProvider');
  }
  return context;
};

export const InventoryProvider = ({ children, manager }) => {
  // TEMP DIAGNOSTIC: Detect duplicate provider instances
  const __instanceId = useMemo(() => Math.random().toString(36).slice(2, 7), []);

  // ✅ ALL HOOKS MUST COME BEFORE ANY CONDITIONAL RETURNS
  const inventoryRef = useRef(null);
  const [inventoryVersion, setInventoryVersion] = useState(0);
  const [openContainers, setOpenContainers] = useState(new Set());

  // Phase 5G: Selection-based drag state (simpler than cursor-following)
  const [selectedItem, setSelectedItem] = useState(null); // { item, originContainerId, originX, originY, rotation }
  const [dragVersion, setDragVersion] = useState(0); // Force re-render on selection changes
  const [selectedRecipeId, setSelectedRecipeId] = useState(CraftingRecipes[0]?.id || null);

  const { playerRef, isMoving, playerStats } = usePlayer();
  const { addLog } = useLog();
  const { playSound } = useAudio();

  // Phase 5H: Close all floating containers when the player starts moving
  useEffect(() => {
    if (isMoving) {
      console.log('[InventoryContext] Player is moving, closing all floating containers');
      setOpenContainers(new Set());
    }
  }, [isMoving]);

  useEffect(() => {
    console.log(`[InventoryProvider] MOUNT id=${__instanceId}`);
    return () => console.log(`[InventoryProvider] UNMOUNT id=${__instanceId}`);
  }, [__instanceId]);

  // Dev-only: Force refresh for console testing (Phase 5C/5D workaround until Phase 5E)
  const forceRefresh = useCallback(() => {
    setInventoryVersion(prev => prev + 1);
  }, []);

  // Dev-console bridge (Phase 5A)
  // Note: Works in both dev and production builds for testing/debugging
  useEffect(() => {
    if (inventoryRef.current) {
      window.inventoryManager = inventoryRef.current;
      window.__inventoryManager = inventoryRef.current; // Also update internal bridge
      window.inv = {
        getContainer: (id) => inventoryRef.current?.getContainer(id),
        equipItem: (item, slot) => inventoryRef.current?.equipItem(item, slot),
        moveItem: (itemId, from, to, x, y) =>
          inventoryRef.current?.moveItem(itemId, from, to, x, y),
        refresh: forceRefresh,
        clearSelected: clearSelected
      };
      console.log('[InventoryContext] Dev console bridge updated: window.inventoryManager, window.inv');
    }
  }, [forceRefresh, manager]); // Re-run when manager instance changes

  // ✅ Handle null manager case AFTER all hooks are declared
  // Graceful degradation: render children without inventory context until manager exists
  if (!manager) {
    if (import.meta?.env?.DEV) {
      console.warn('[InventoryProvider] No manager available - rendering without inventory context (game will load, inventory disabled until init completes)');
    }
    return <>{children}</>; // Pass-through: render app without inventory until manager exists
  }

  // Phase 5A: Accept external manager, never construct internally
  if (!inventoryRef.current && manager) {
    inventoryRef.current = manager;
    logger.info('InventoryManager received from provider props');
    logger.debug('- Manager has', manager.containers.size, 'containers');
    logger.debug('- Equipment slots:', Object.entries(manager.equipment).filter(([s, i]) => i).map(([s, i]) => `${s}:${i.name}`).join(', ') || 'none');
  }

  if (manager && inventoryRef.current !== manager) {
    inventoryRef.current = manager;
    setInventoryVersion(prev => prev + 1);
  }

  // Phase 5B: Listen for global inventory changes to trigger UI refreshes
  useEffect(() => {
    if (!manager) return;

    const handleInventoryChanged = () => {
      logger.debug('🔄 Inventory changed event received, bumping version');
      setInventoryVersion(prev => prev + 1);
    };

    if (typeof manager.on === 'function') {
      manager.on('inventoryChanged', handleInventoryChanged);
      return () => {
        manager.off('inventoryChanged', handleInventoryChanged);
      };
    }
  }, [manager]);

  const setInventory = useCallback((inventory) => {
    inventoryRef.current = inventory;
    setInventoryVersion(prev => prev + 1);
  }, []);

  const getEquippedBackpackContainer = useCallback(() => {
    if (!inventoryRef.current) return null;
    return inventoryRef.current.getBackpackContainer();
  }, [inventoryVersion]);

  const getEncumbranceModifiers = useCallback(() => {
    if (!inventoryRef.current) return { evade: 0, ap: 0 };
    return inventoryRef.current.getEncumbranceModifiers();
  }, [inventoryVersion]);

  const canOpenContainer = useCallback((item) => {
    if (!inventoryRef.current) return false;
    return inventoryRef.current.canOpenContainer(item);
  }, [inventoryVersion]);

  const getContainer = useCallback((containerId) => {
    if (!inventoryRef.current) return null;
    return inventoryRef.current.getContainer(containerId);
  }, [inventoryVersion]);

  const equipItem = useCallback((item, slot) => {
    if (!inventoryRef.current) {
      return { success: false, reason: 'Inventory not initialized' };
    }

    // Check AP cost (1 AP)
    if (playerRef.current && playerRef.current.ap < 1) {
      return { success: false, reason: 'Not enough AP (1 required)' };
    }

    // Phase 5H: Close container window if it's open (e.g. equipping a backpack from ground)
    setOpenContainers(prev => {
      if (prev.size === 0) return prev;
      const next = new Set(prev);
      let changed = false;

      if (item.containerGrid?.id && next.delete(item.containerGrid.id)) {
        changed = true;
      }

      const virtualId = `clothing:${item.instanceId}`;
      const weaponId = `weapon:${item.instanceId}`;
      if (next.delete(virtualId) || next.delete(weaponId)) {
        changed = true;
      }

      return changed ? next : prev;
    });

    const result = inventoryRef.current.equipItem(item, slot);
    if (result.success) {
      if (playerRef.current) playerRef.current.useAP(1);
      console.debug('[InventoryContext] equipItem success - playing sound');
      playSound('Equip');
      addLog(`Equipped ${item.name}`, 'item');
      setInventoryVersion(prev => prev + 1);
    }
    return result;
  }, []);

  const unequipItem = useCallback((slot) => {
    if (!inventoryRef.current) {
      return { success: false, reason: 'Inventory not initialized' };
    }

    // Check AP cost (1 AP)
    if (playerRef.current && playerRef.current.ap < 1) {
      return { success: false, reason: 'Not enough AP (1 required)' };
    }
    const result = inventoryRef.current.unequipItem(slot);
    if (result.success) {
      if (playerRef.current) playerRef.current.useAP(1);
      const itemName = result.item ? result.item.name : 'item';
      console.debug('[InventoryContext] unequipItem success - playing sound');
      playSound('Equip');
      addLog(`Unequipped ${itemName} from ${slot}`, 'item');
      setInventoryVersion(prev => prev + 1);
    }
    return result;
  }, []);

  const destroyItem = useCallback((instanceId) => {
    if (!inventoryRef.current) return false;
    
    // Resolve item name before destruction for cleaner logging
    const found = inventoryRef.current.findItem(instanceId);
    const itemName = found?.item?.name || instanceId;
    
    const result = inventoryRef.current.destroyItem(instanceId);
    if (result) {
      addLog(`Item destroyed: ${itemName}`, 'system');
      setInventoryVersion(prev => prev + 1);
    }
    return result;
  }, []);

  const moveItem = useCallback((itemId, fromContainerId, toContainerId, x, y) => {
    if (!inventoryRef.current) {
      return { success: false, reason: 'Inventory not initialized' };
    }
    const result = inventoryRef.current.moveItem(itemId, fromContainerId, toContainerId, x, y);
    if (result.success) {
      setInventoryVersion(prev => prev + 1);
    }
    return result;
  }, []);

  const dropItemToGround = useCallback((item, x, y) => {
    if (!inventoryRef.current) return false;
    const result = inventoryRef.current.dropItemToGround(item, x, y);
    if (result) {
      setInventoryVersion(prev => prev + 1);
    }
    return result;
  }, []);

  const organizeGroundItems = useCallback(() => {
    if (!inventoryRef.current) return false;
    const result = inventoryRef.current.organizeGroundItems();
    if (result) {
      setInventoryVersion(prev => prev + 1);
    }
    return result;
  }, []);

  const quickPickupByCategory = useCallback((category) => {
    if (!inventoryRef.current) {
      return { success: false, reason: 'Inventory not initialized' };
    }
    const result = inventoryRef.current.quickPickupByCategory(category);
    if (result.success) {
      setInventoryVersion(prev => prev + 1);
    }
    return result;
  }, []);

  const openContainer = useCallback((containerOrId) => {
    // 1. Resolve ID and potential container/item object
    let cid;
    let containerObj = null;
    let itemObj = null;

    if (typeof containerOrId === 'string') {
      cid = containerOrId;
    } else if (containerOrId && typeof containerOrId === 'object') {
      // 1. Check for weapon modification first (more specific)
      if (containerOrId.attachmentSlots) {
        cid = `weapon:${containerOrId.instanceId}`;
        itemObj = containerOrId;
      }
      // 2. Check for clothing pockets
      else if (typeof containerOrId.getPocketContainers === 'function' && containerOrId.hasTrait(ItemTrait.CONTAINER)) {
        cid = `clothing:${containerOrId.instanceId}`;
        itemObj = containerOrId;
      }
      // 3. Fallback to standard container
      else {
        cid = containerOrId.id;
        containerObj = containerOrId;
      }
    }

    if (!cid) {
      if (import.meta?.env?.DEV) {
        console.warn('[Inventory] openContainer called without valid id');
      }
      return;
    }

    // 2. Handle registration if needed (ground backpacks, clothing pockets, etc.)
    const isVirtual = cid.startsWith('clothing:') || cid.startsWith('weapon:');
    let container = inventoryRef.current.getContainer(cid);

    if (itemObj && isVirtual) {
      // For clothing items, ensure all pockets are registered so actions (split, move) work
      console.debug('[InventoryContext] Registering pockets for:', itemObj.name);
      itemObj.getPocketContainers().forEach(pocket => {
        inventoryRef.current.addContainer(pocket);
      });
    } else if (itemObj && cid.startsWith('weapon:')) {
      // FORMERLY: registered attachment containers
      // NOW: nothing extra needed, WeaponModPanel handles it via attachments object
      console.debug('[InventoryContext] Opening weapon mod for:', itemObj.name);
    } else if (!container && containerObj && !isVirtual) {
      console.debug('[InventoryContext] Auto-registering container:', cid);
      inventoryRef.current.addContainer(containerObj);
      container = containerObj;
    }

    // 3. Open the container if it exists (or is a virtual container)
    if (container || isVirtual) {
      console.debug('[InventoryContext] Opening container:', cid, (isVirtual || cid.startsWith('weapon:')) ? '(Virtual)' : '');
      setOpenContainers(prev => {
        const next = new Set(prev);
        next.add(cid);
        return next;
      });
    } else {
      console.warn('[InventoryContext] Cannot open unregistered container:', cid);
    }
  }, [inventoryVersion]);

  const closeContainer = useCallback((containerId) => {
    setOpenContainers(prev => {
      const next = new Set(prev);
      next.delete(containerId);
      return next;
    });
  }, []);

  const isContainerOpen = useCallback((containerId) => {
    return openContainers.has(containerId);
  }, [openContainers]);

  // Phase 5G/5H: Selection actions (simpler than cursor-following)
  const selectItem = useCallback((item, originContainerId, originX, originY, isEquipment = false) => {
    if (!item || !item.instanceId) {
      console.warn('[InventoryContext] Cannot select without valid item');
      return false;
    }

    // Safety: If an item is already selected, return it to its origin first
    // This prevents items from vanishing when switching selections
    if (selectedItem) {
      console.debug('[InventoryContext] Already carrying an item, clearing before new selection');
      clearSelected();
    }

    console.debug('[InventoryContext] Select item:', {
      name: item.name,
      from: originContainerId,
      gridPos: `(${originX}, ${originY})`,
      rotation: item.rotation || 0,
      isEquipment
    });

    setSelectedItem({
      item,
      originContainerId,
      originX,
      originY,
      rotation: item.rotation || 0,
      originalRotation: item.rotation || 0, // Store for restoration if placement fails
      isEquipment // NEW: flag for equipment slot selection
    });
    playSound('Click');
    setDragVersion(prev => prev + 1);
    return true;
  }, []);

  const rotateSelected = useCallback(() => {
    setSelectedItem(prev => {
      if (!prev) return null;

      const item = prev.item;

      // Skip rotation for square items (1×1, 2×2, etc.)
      if (item.width === item.height) {
        console.debug('[InventoryContext] Skipping rotation - item is square:', item.name, `${item.width}×${item.height}`);
        return prev; // Return unchanged
      }

      // Smart rotation: toggle between landscape and portrait
      // Landscape items (width > height) rotate 90° clockwise
      // Portrait items (width < height) rotate 90° counter-clockwise
      const currentRotation = prev.rotation;

      // Determine if item is currently in landscape or portrait orientation
      const currentWidth = (currentRotation === 90 || currentRotation === 270) ? item.height : item.width;
      const currentHeight = (currentRotation === 90 || currentRotation === 270) ? item.width : item.height;
      const isLandscape = currentWidth > currentHeight;

      // Toggle rotation: landscape rotates clockwise, portrait rotates counter-clockwise
      const newRotation = isLandscape
        ? (currentRotation + 90) % 360  // Clockwise
        : (currentRotation - 90 + 360) % 360;  // Counter-clockwise

      console.debug('[InventoryContext] Rotate preview:', {
        from: currentRotation,
        to: newRotation,
        orientation: isLandscape ? 'landscape→portrait' : 'portrait→landscape'
      });

      // ✅ DO NOT mutate the item - only track rotation in state for preview
      // The actual item.rotation will be updated only on successful placement

      return {
        ...prev,
        rotation: newRotation
      };
    });
    setDragVersion(prev => prev + 1);
  }, []);

  const clearSelected = useCallback(() => {
    // Phase Stacking Fix: If an item is selected (carried), return it to its origin container
    // This prevents items from vanishing if the selection is cancelled (Escape, click outside)
    if (selectedItem && !selectedItem.isEquipment && inventoryRef.current) {
      const { item, originContainerId, originX, originY, originalRotation } = selectedItem;

      if (originContainerId.startsWith('weapon-mod-')) {
        // Special case: detached attachment - return to weapon
        const parts = originContainerId.replace('weapon-mod-', '').split(':');
        const weaponInstanceId = parts[0];
        const slotId = parts[1];

        const found = inventoryRef.current.findItem(weaponInstanceId);
        if (found && found.item) {
          console.log('[InventoryContext] Returning detached item to weapon slot:', item.name, slotId);
          found.item.attachItem(slotId, item);
          setInventoryVersion(prev => prev + 1);
        }
      } else {
        const originContainer = inventoryRef.current.getContainer(originContainerId);
        if (originContainer && originContainer.placeItemAt) {
          console.log('[InventoryContext] Returning selected item to origin before clearing:', item.name);
          // Restore original rotation
          item.rotation = originalRotation;
          originContainer.placeItemAt(item, originX, originY);
          playSound('Click');
          setInventoryVersion(prev => prev + 1);
        }
      }
    }

    console.debug('[InventoryContext] Clear selection');
    setSelectedItem(null);
    setDragVersion(prev => prev + 1);
  }, [selectedItem, inventoryVersion]);

  const equipSelectedItem = useCallback((targetSlot) => {
    if (!selectedItem || !inventoryRef.current) {
      return { success: false, reason: 'No item selected' };
    }

    // Check AP cost (1 AP)
    if (playerRef.current && playerRef.current.ap < 1) {
      return { success: false, reason: 'Not enough AP (1 required)' };
    }

    const { item, originContainerId } = selectedItem;

    // Check if item can be equipped in target slot
    if (!item.canEquipIn || !item.canEquipIn(targetSlot)) {
      return { success: false, reason: 'Item cannot be equipped in this slot' };
    }

    console.debug('[InventoryContext] Equipping selected item:', item.name, 'to slot:', targetSlot);

    // Phase 5H: Close container window if it's open
    setOpenContainers(prev => {
      if (prev.size === 0) return prev;
      const next = new Set(prev);
      let changed = false;

      if (item.containerGrid?.id && next.delete(item.containerGrid.id)) {
        changed = true;
      }

      const virtualId = `clothing:${item.instanceId}`;
      if (next.delete(virtualId)) {
        changed = true;
      }

      return changed ? next : prev;
    });

    const result = inventoryRef.current.equipItem(item, targetSlot);

    if (result.success) {
      if (playerRef.current) playerRef.current.useAP(1);
      console.debug('[InventoryContext] equipSelectedItem success - playing sound');
      playSound('Equip');
      addLog(`Equipped ${item.name} to ${targetSlot}`, 'item');
      setSelectedItem(null);
      setDragVersion(prev => prev + 1);
      setInventoryVersion(prev => prev + 1);
      return { success: true };
    }

    return result;
  }, [selectedItem]);

  const attachSelectedItemToWeapon = useCallback((weapon, slotId) => {
    if (!selectedItem || !inventoryRef.current) return { success: false, reason: 'No item selected' };

    // Check AP cost (1 AP)
    if (playerRef.current && playerRef.current.ap < 1) {
      return { success: false, reason: 'Not enough AP (1 required)' };
    }

    // Special case for .357 Drum / Hunting Rifle loading (AP cost message)
    if ((weapon.defId === 'weapon.357Pistol' || weapon.defId === 'weapon.hunting_rifle') && slotId === 'ammo') {
      console.log(`[InventoryContext] Loading ${weapon.name} - costs 1 AP`);
    }

    const result = inventoryRef.current.attachItemToWeapon(weapon, slotId, selectedItem.item, selectedItem.originContainerId);
    if (result.success) {
      if (playerRef.current) playerRef.current.useAP(1);
      console.debug('[InventoryContext] attachSelectedItemToWeapon success - (ReloadShot played by manager)');
      // Suppress Equip sound here as InventoryManager now plays ReloadShot for all weapon attachments
      addLog(`Attached ${selectedItem.item.name} to ${weapon.name}`, 'item');
      // IMPORTANT: Clear selection without triggering restoration logic in clearSelected()
      setSelectedItem(null);
      setDragVersion(v => v + 1);
      setInventoryVersion(v => v + 1);
    }
    return result;
  }, [selectedItem, inventoryRef]);

  const detachItemFromWeapon = useCallback((weapon, slotId) => {
    // 1. Get the item currently in the slot
    const item = weapon.getAttachment ? weapon.getAttachment(slotId) : weapon.attachments?.[slotId];
    
    if (!item) return null;

    // 2. Check AP cost (1 AP)
    if (playerRef.current && playerRef.current.ap < 1) {
      return null;
    }

    // 3. Select the item WITHOUT removing it from weapon yet
    // The actual removal happens in InventoryManager.removeItemFromSource when placed
    console.debug('[InventoryContext] Selecting attachment from weapon:', item.name, 'slot:', slotId);
    
    console.debug('[InventoryContext] detachItemFromWeapon - playing ReloadShot');
    playSound('ReloadShot');
    // Use special origin category so clearing selection knows how to handle it
    selectItem(item, `weapon-mod-${weapon.instanceId}:${slotId}`, 0, 0);
    
    // We don't use AP yet, same as selecting from grid. AP is used on placement.
    return item;
  }, [selectItem]);

  /**
   * Quick attach selected item into a target weapon item
   */
  const attachSelectedInto = useCallback((targetWeapon) => {
    if (!selectedItem || !inventoryRef.current || !targetWeapon) return { success: false };

    // Phase 6 Nesting Fix: Only allow attaching if target is openable or equipped
    const isAccessible = canOpenContainer(targetWeapon) || targetWeapon.isEquipped;
    if (!isAccessible) {
      console.warn('[InventoryContext] Cannot attach into closed nested weapon:', targetWeapon.name);
      return { success: false, reason: 'Open the weapon to modify it' };
    }

    // Check AP cost (1 AP)
    if (playerRef.current && playerRef.current.ap < 1) {
      return { success: false, reason: 'Not enough AP (1 required)' };
    }

    const { item: modItem } = selectedItem;

    // Check if target has attachment slots
    if (!targetWeapon.attachmentSlots) {
      console.warn('[InventoryContext] Target item is not a weapon/item with slots:', targetWeapon.name);
      return { success: false, reason: 'Target has no attachment slots' };
    }

    // Find compatible slot
    const slotId = targetWeapon.findCompatibleAttachmentSlot ? targetWeapon.findCompatibleAttachmentSlot(modItem, true) : null;

    if (!slotId) {
      console.warn('[InventoryContext] No compatible empty slot found in', targetWeapon.name);
      return { success: false, reason: 'No compatible empty slot' };
    }

    // Use existing attachment method which handles removal and state updates
    console.debug('[InventoryContext] Quick attaching into slot:', slotId);
    return attachSelectedItemToWeapon(targetWeapon, slotId);
  }, [selectedItem, inventoryRef, attachSelectedItemToWeapon]);

  /**
   * Quick deposit selected item into a target container item
   */
  const depositSelectedInto = useCallback((targetItem) => {
    if (!selectedItem || !inventoryRef.current || !targetItem) return { success: false };

    // Phase 6 Nesting Fix: Only allow depositing if target is openable or equipped
    const isAccessible = canOpenContainer(targetItem) || targetItem.isEquipped;
    if (!isAccessible) {
      console.warn('[InventoryContext] Cannot deposit into closed nested container:', targetItem.name);
      return { success: false, reason: 'Open or equip the container first' };
    }

    const { item } = selectedItem;

    // 1. Get and initialize all potential container grids from the target item
    const possibleGrids = [];

    // Main grid (e.g. backpack)
    const mainGrid = targetItem.getContainerGrid?.();
    if (mainGrid) {
      possibleGrids.push(mainGrid);
      // Register with manager so moveItem can find it by ID
      if (inventoryRef.current && !inventoryRef.current.containers.has(mainGrid.id)) {
        console.debug('[InventoryContext] Auto-registering container Grid for quick deposit:', mainGrid.id);
        inventoryRef.current.addContainer(mainGrid);
      }
    }

    // Pockets (e.g. jacket)
    if (targetItem.getPocketContainers) {
      const pockets = targetItem.getPocketContainers();
      if (pockets && pockets.length > 0) {
        possibleGrids.push(...pockets);
        // Register each pocket
        pockets.forEach(pocket => {
          if (inventoryRef.current && !inventoryRef.current.containers.has(pocket.id)) {
            console.debug('[InventoryContext] Auto-registering pocket Grid for quick deposit:', pocket.id);
            inventoryRef.current.addContainer(pocket);
          }
        });
      }
    }

    if (possibleGrids.length === 0) {
      console.warn('[InventoryContext] Target item is not a container:', targetItem.name);
      return { success: false, reason: 'Target is not a container' };
    }

    // 2. Try each grid until one accepts the item
    for (const grid of possibleGrids) {
      console.debug('[InventoryContext] Trying quick deposit into grid:', grid.id);

      // We use moveItem(id, from, to, null, null) which triggers addItem() 
      // which now supports auto-rotation!
      const result = moveItem(
        item.instanceId,
        selectedItem.originContainerId,
        grid.id,
        null,
        null
      );

      if (result.success) {
        console.log('[InventoryContext] Quick deposit SUCCESS into:', grid.id);
        setSelectedItem(null);
        setDragVersion(prev => prev + 1);
        return { success: true };
      }
    }

    console.warn('[InventoryContext] Quick deposit FAILED - no space in any grid of', targetItem.name);
    return { success: false, reason: 'No space available' };
  }, [selectedItem, moveItem]);

  /**
   * Load ammo from selected stack into a magazine
   */
  const loadAmmoInto = useCallback((targetMagazine) => {
    if (!selectedItem || !inventoryRef.current || !targetMagazine) return { success: false };

    const { item: ammoStack } = selectedItem;

    if (!targetMagazine.isMagazine()) {
      return { success: false, reason: 'Target is not a magazine' };
    }

    if (!ammoStack.isAmmo()) {
      return { success: false, reason: 'Selected item is not ammo' };
    }

    const result = targetMagazine.loadAmmo(ammoStack);

    if (result.success) {
      console.log(`[InventoryContext] Loaded ${result.amountLoaded} rounds into ${targetMagazine.name}`);

      if (result.isStackEmpty) {
        // Remove the empty ammo stack from its container
        const originContainer = inventoryRef.current.getContainer(selectedItem.originContainerId);
        if (originContainer) {
          originContainer.removeItem(ammoStack.instanceId);
        }
      }

      // Always deselect after loading, as per user request
      playSound('ReloadShot');
      setSelectedItem(null);

      setInventoryVersion(prev => prev + 1);
      setDragVersion(prev => prev + 1);
      return { success: true };
    }

    return result;
  }, [selectedItem]);

  /**
   * Load ammo directly into a non-magazine gun (bypasses accessibility guard).
   * Works whether the gun is equipped, in a backpack, or on the ground.
   */
  const loadAmmoDirectly = useCallback((targetWeapon) => {
    if (!selectedItem || !inventoryRef.current || !targetWeapon) {
      return { success: false, reason: 'No item selected or weapon not found' };
    }

    const { item: ammoStack, originContainerId } = selectedItem;

    // Must be ammo
    if (!ammoStack.isAmmo || !ammoStack.isAmmo()) {
      return { success: false, reason: 'Selected item is not ammo' };
    }

    // Must be a direct-load weapon (not magazine-based)
    const directLoadDefs = ['weapon.357Pistol', 'weapon.hunting_rifle', 'weapon.shotgun'];
    if (!directLoadDefs.includes(targetWeapon.defId)) {
      return { success: false, reason: 'Not a direct-load weapon' };
    }

    // Check AP cost (1 AP)
    if (playerRef.current && playerRef.current.ap < 1) {
      return { success: false, reason: 'Not enough AP (1 required)' };
    }

    const result = inventoryRef.current.attachItemToWeapon(targetWeapon, 'ammo', ammoStack, originContainerId);

    if (result.success) {
      if (playerRef.current) playerRef.current.useAP(1);
      addLog(`Loaded ${ammoStack.name} into ${targetWeapon.name}`, 'item');
      setSelectedItem(null);
      setDragVersion(v => v + 1);
      setInventoryVersion(v => v + 1);
    }

    return result;
  }, [selectedItem]);

  /**
   * Unload all ammo from a magazine into inventory
   */
  const unloadMagazine = useCallback((magazine) => {
    if (!inventoryRef.current || !magazine) return { success: false };

    console.debug('[InventoryContext] Unloading magazine:', magazine.name);

    const unloadResult = magazine.unloadAmmo();
    if (!unloadResult.success) {
      console.warn('[InventoryContext] Unload failed:', unloadResult.reason);
      return unloadResult;
    }

    playSound('ReloadShot');

    const { amount, ammoDefId } = unloadResult;
    if (amount <= 0 || !ammoDefId) {
      console.debug('[InventoryContext] Magazine was empty or ammo type unknown');
      setInventoryVersion(v => v + 1);
      return { success: true };
    }

    // Place ammo back into inventory
    // 1. Find all available containers (Backpack, Pockets)
    const availableContainers = [
      inventoryRef.current.getBackpackContainer(),
      ...inventoryRef.current.getPocketContainers()
    ].filter(c => c !== null);

    let remainingAmmo = amount;

    // 2. Try to fill existing stacks first
    for (const container of availableContainers) {
      if (remainingAmmo <= 0) break;
      for (const item of container.items.values()) {
        if (item.defId === ammoDefId && item.stackCount < item.stackMax) {
          const space = item.stackMax - item.stackCount;
          const toAdd = Math.min(space, remainingAmmo);
          item.stackCount += toAdd;
          remainingAmmo -= toAdd;
          console.debug(`[InventoryContext] Merged ${toAdd} rounds into existing stack`);
          if (remainingAmmo <= 0) break;
        }
      }
    }

    // 3. Create new stacks for remaining ammo
    if (remainingAmmo > 0) {
      while (remainingAmmo > 0) {
        const itemData = createItemFromDef(ammoDefId);
        if (!itemData) break;
        const newItem = new Item(itemData);
        const stackMax = newItem.stackMax;
        const count = Math.min(remainingAmmo, stackMax);
        newItem.stackCount = count;

        // Try to place in any available container
        let placed = false;
        for (const container of availableContainers) {
          if (container.addItem(newItem)) {
            placed = true;
            remainingAmmo -= count;
            console.debug(`[InventoryContext] Created new stack of ${count} in ${container.id}`);
            break;
          }
        }

        if (!placed) {
          // No space in inventory, drop to ground
          console.warn('[InventoryContext] No space in inventory for ammo, dropping to ground');
          const ground = inventoryRef.current.getContainer('ground');
          if (ground) {
            ground.addItem(newItem);
            remainingAmmo -= count;
          } else {
            console.error('[InventoryContext] No space anywhere for ammo!');
            break;
          }
        }
      }
    }
    setInventoryVersion(v => v + 1);
    return { success: true };
  }, []);

  const placeSelected = useCallback((targetContainerId, targetX, targetY, rotation = null) => {
    if (!selectedItem || !inventoryRef.current) { // Keep inventoryRef.current check
      return { success: false, reason: 'No item selected' };
    }

    const { item, originContainerId, originX, originY, isEquipment, rotation: selectedRotation } = selectedItem;
    const originalRotation = item.rotation; // Get original rotation from item (persistence)
    if (rotation === null) rotation = selectedRotation !== undefined ? selectedRotation : originalRotation;

    console.debug('[InventoryContext] Place selected:', item.name, 'to', targetContainerId, 'at', targetX, targetY, 'rotation:', rotation, 'isEquipment:', isEquipment);

    // Phase 5H: Block moving backpacks that have open floating panels
    const isBackpack = item.canEquipIn ? item.canEquipIn('backpack') : item.equippableSlot === 'backpack';
    if (isBackpack && item.containerGrid) {
      const containerIsOpen = isContainerOpen(item.containerGrid.id);
      if (containerIsOpen) {
        console.warn('[InventoryContext] Cannot move backpack - container panel is open');
        return { success: false, reason: 'Close the backpack container before moving it' };
      }
    }

    // Phase 5H: Prevent unequipping backpack into itself - just cancel selection
    if (isEquipment && isBackpack && item.containerGrid) {
      if (targetContainerId === item.containerGrid.id) {
        console.debug('[InventoryContext] Cannot unequip backpack into itself - canceling selection');
        setSelectedItem(null);
        setDragVersion(prev => prev + 1);
        return { success: false, reason: 'Cannot place backpack inside itself' };
      }
    }

    // Phase 5H: Handle unequipping
    if (isEquipment) {
      // Check AP cost (1 AP) - SKIP if target is crafting workspace
      const isCraftingWorkspace = targetContainerId === 'crafting-tools' || targetContainerId === 'crafting-ingredients' ||
        targetContainerId === 'cooking-tools' || targetContainerId === 'cooking-ingredients';

      if (!isCraftingWorkspace && playerRef.current && playerRef.current.ap < 1) {
        return { success: false, reason: 'Not enough AP (1 required)' };
      }

      const slot = originContainerId.replace('equipment-', '');
      // Pass the target details to unequipItem so it respects the drop location
      const result = inventoryRef.current.unequipItem(slot, targetContainerId, targetX, targetY);

      if (result.success) {
        if (!isCraftingWorkspace && playerRef.current) playerRef.current.useAP(1);
        console.debug('[InventoryContext] placeSelected unequip SUCCESS - playing sound');
        playSound('Equip');
        playSound('Click');
        const itemName = result.item ? result.item.name : item.name;
        addLog(`Unequipped ${itemName} from ${slot}`, 'item');
        // Item was unequipped and placed automatically
        setSelectedItem(null);
        setDragVersion(prev => prev + 1);
        setInventoryVersion(prev => prev + 1);
        return { success: true };
      }

      return result;
    }

    // Store original position for potential restore
    const originalX = originX;
    const originalY = originY;

    const originContainer = inventoryRef.current.getContainer(originContainerId);
    const targetContainer = inventoryRef.current.getContainer(targetContainerId);

    // Phase 10: Handle swapping for crafting/cooking workspace tools (behaves like an equipment slot)
    const isToolSlot = targetContainerId === 'crafting-tools' || targetContainerId === 'cooking-tools';
    if (isToolSlot && targetContainer && !targetContainer.isEmpty()) {
      const existingItems = targetContainer.getAllItems();
      console.debug('[InventoryContext] Swapping out existing tool from crafting workspace:', existingItems.length);
      existingItems.forEach(existingItem => {
        targetContainer.removeItem(existingItem.instanceId);
        inventoryRef.current.addItem(existingItem);
      });
      // Force a refresh after removal to ensure validation sees an empty slot
      setInventoryVersion(v => v + 1);
    }

    // 1. Validate placement in target container
    const validation = targetContainer.validatePlacement(item, targetX, targetY, rotation);
    if (!validation.valid && !validation.stackTarget) {
      console.warn('[InventoryContext] Invalid placement:', validation.reason);
      return { success: false, reason: validation.reason };
    }

    // 2. CRITICAL: Remove from origin container FIRST
    // This ensures there are no "duplicates" in the data before we place in the target
    if (originContainer && typeof originContainer.removeItem === 'function') {
      const removed = originContainer.removeItem(item.instanceId);
      if (!removed) {
        console.error('[InventoryContext] Failed to remove item from origin container');
        return { success: false, reason: 'Failed to remove from origin' };
      }
      console.debug('[InventoryContext] Successfully removed from origin:', originContainerId);
    }

    // NOW apply the new rotation to the item object
    item.rotation = rotation;

    // 3. Phase Stacking: Handle merging if we found a stack target
    if (validation.stackTarget) {
      const targetItem = validation.stackTarget;
      const stackableAmount = targetItem.getStackableAmount(item);

      if (stackableAmount > 0) {
        console.log('[InventoryContext] Stacking items:', item.name, 'into', targetItem.name, 'amount:', stackableAmount);

        targetItem.stackCount += stackableAmount;
        item.stackCount -= stackableAmount;

        if (item.stackCount === 0) {
          // Fully consumed
          playSound('Click');
          setSelectedItem(null);
          setDragVersion(prev => prev + 1);
          setInventoryVersion(prev => prev + 1);
          return { success: true, stacked: true };
        } else {
          // Partial stack - Put the remainder back in its original slot and clear selection
          console.debug('[InventoryContext] Partial stack - returning remainder to origin:', item.stackCount);

          if (originContainer) {
            item.rotation = originalRotation;
            originContainer.placeItemAt(item, originalX, originalY);
          }

          playSound('Click');
          setSelectedItem(null);
          setDragVersion(prev => prev + 1);
          setInventoryVersion(prev => prev + 1);
          return { success: true, stacked: true, partial: true };
        }
      }
    }

    const combineTarget = validation.combineTarget;
    if (combineTarget) {
      console.log('[InventoryContext] Combining water bottles:', item.name, 'into', combineTarget.name);
      combineTarget.combineWith(item);

      // ALWAYS return the source bottle to its original slot (even if empty)
      // unlike ammo/stackable items which are removed when empty
      if (originContainer) {
        item.rotation = originalRotation;
        originContainer.placeItemAt(item, originalX, originalY);
      }

      playSound('Click');
      setSelectedItem(null);
      setDragVersion(prev => prev + 1);
      setInventoryVersion(prev => prev + 1);
      return { success: true, combined: true };
    }


    // 4. Place in target container at new position
    const placed = targetContainer.placeItemAt(item, targetX, targetY);

    if (!placed) {
      console.warn('[InventoryContext] Failed to place item, restoring to origin');
      // Restore item to original state and position
      item.rotation = originalRotation;
      if (originContainer) {
        originContainer.placeItemAt(item, originalX, originalY);
      }
      setInventoryVersion(prev => prev + 1);
      return { success: false, reason: 'Failed to place item' };
    }

    console.debug('[InventoryContext] Successfully placed item:', item.name);
    playSound('Click');
    setSelectedItem(null);
    setDragVersion(prev => prev + 1);
    setInventoryVersion(prev => prev + 1);
    return { success: true };
  }, [selectedItem]);

  /**
   * Split a stack of items
   */
  const splitStack = useCallback((item, count) => {
    if (!item || !item.isStackable() || count >= item.stackCount || count <= 0) {
      return { success: false, reason: 'Invalid split count' };
    }

    // Find the container holding this item
    const container = Array.from(inventoryRef.current.containers.values())
      .find(c => c.items.has(item.instanceId));

    if (!container) {
      return { success: false, reason: 'Container not found' };
    }

    // Perform the split
    const newItem = item.splitStack(count);
    if (!newItem) {
      return { success: false, reason: 'Split failed' };
    }

    // Attempt to place in same container
    const pos = container.findAvailablePosition(newItem);
    if (pos) {
      container.placeItemAt(newItem, pos.x, pos.y);
      console.log(`[InventoryContext] Split stack: ${count} of ${item.name} placed in ${container.id} at (${pos.x}, ${pos.y})`);
    } else {
      // Fallback to ground
      const ground = inventoryRef.current.getContainer('ground');
      if (ground) {
        ground.addItem(newItem);
        console.log(`[InventoryContext] Split stack: ${count} of ${item.name} placed on ground (no space in original container)`);
      }
    }

    setInventoryVersion(prev => prev + 1);
    return { success: true };
  }, []);

  /**
   * Consume an item (food, medical, etc.)
   */
  const consumeItem = useCallback((item) => {
    if (!inventoryRef.current || !item || !playerRef.current) {
      return { success: false, reason: 'Initialization error' };
    }

    // Apply consumption effects if they exist
    if (item.consumptionEffects) {
      console.log('[InventoryContext] Consuming item:', item.name, 'effects:', item.consumptionEffects);

      // Standardize effects into an array of {type, value} objects
      const effects = Array.isArray(item.consumptionEffects)
        ? item.consumptionEffects
        : Object.entries(item.consumptionEffects).map(([type, value]) => ({ type, value }));

      effects.forEach(effect => {
        const type = effect.type || effect.id || effect[0];
        const value = effect.value !== undefined ? effect.value : effect[1];

        // Resolve range values { min, max }
        const resolvedValue = (typeof value === 'object' && value !== null && 'min' in value && 'max' in value)
          ? Math.floor(Math.random() * (value.max - value.min + 1)) + value.min
          : value;

        if (type === 'nutrition') {
          const amount = item.getNutritionValue?.() || resolvedValue || 0;
          playerRef.current.modifyStat('nutrition', amount);
        } else if (type === 'hydration') {
          const amount = item.getHydrationValue?.() || resolvedValue || 0;
          playerRef.current.modifyStat('hydration', amount);
        } else if (type === 'heal' || type === 'hp') {
          playerRef.current.heal(resolvedValue);
        } else if (type === 'cure') {
          playerRef.current.cure();
        } else if (type === 'stop_bleeding') {
          playerRef.current.setBleeding(false);
          addLog('Your bleeding stops.', 'item');
          console.log('[InventoryContext] Applied stop_bleeding effect: bleeding cleared');
        } else {
          // Generic stat modification
          playerRef.current.modifyStat(type, resolvedValue);
        }
      });
    }

    // Apply sickness if the item is spoiled
    if (item.isSpoiled) {
      console.log(`[InventoryContext] ${item.name} is spoiled! Inflicting sickness.`);
      playerRef.current.inflictSickness(3); // Lasts for 3 turns/hours
    }

    // Find the container holding this item
    // Priority: 1. item._container (direct reference) 2. manager.findItem (search)
    const found = inventoryRef.current.findItem(item.instanceId);
    const container = item._container || found?.container;

    if (!container && !found?.equipment) {
      console.warn('[InventoryContext] Consumable container/slot not found for:', item.name, 'instanceId:', item.instanceId);
      return { success: false, reason: 'Item not found in any container or slot' };
    }

    // Handle stack reduction or removal
    const sourceItem = found?.item || item; // Use reference from manager if available

    if (sourceItem.isStackable && sourceItem.isStackable() && sourceItem.stackCount > 1) {
      sourceItem.stackCount -= 1;
      console.log('[InventoryContext] Stack reduced on source item, new count:', sourceItem.stackCount);
    } else {
      // Fully consumed - Remove from wherever it was found
      if (container) {
        container.removeItem(item.instanceId);
      } else if (found.equipment) {
        inventoryRef.current.unequipItem(found.equipment);
        // Note: unequipItem might place it in inventory, so we must explicitly destroy it
        inventoryRef.current.destroyItem(item.instanceId);
      }
      console.log('[InventoryContext] Item fully consumed and removed from system');
    }

    setInventoryVersion(prev => prev + 1);
    
    // Play drink sound if hydration was part of the effects
    const hasHydration = Array.isArray(item.consumptionEffects) 
      ? item.consumptionEffects.some(e => e.type === 'hydration')
      : !!item.consumptionEffects?.hydration;
    
    if (hasHydration) {
      playSound('Drink');
    }

    // Play heal sound if medical effect was part of the effects
    const hasMedical = Array.isArray(item.consumptionEffects)
      ? item.consumptionEffects.some(e => ['heal', 'hp', 'cure', 'stop_bleeding'].includes(e.type || e.id))
      : Object.keys(item.consumptionEffects || {}).some(type => ['heal', 'hp', 'cure', 'stop_bleeding'].includes(type));
    
    if (hasMedical) {
      playSound('Heal');
    }

    // Play eat sound if nutrition was part of the effects
    const hasNutrition = Array.isArray(item.consumptionEffects)
      ? item.consumptionEffects.some(e => e.type === 'nutrition')
      : !!item.consumptionEffects?.nutrition;

    if (hasNutrition) {
      playSound('Eat');
    }

    return { success: true };
  }, [playerRef]);

  /**
   * Drink water from a bottle
   */
  const drinkWater = useCallback((item, amount) => {
    if (!inventoryRef.current || !item || !playerRef.current) {
      return { success: false, reason: 'Initialization error' };
    }

    // Find the item globally to ensure we have the correct reference
    const found = inventoryRef.current.findItem(item.instanceId);

    if (!item.isWaterBottle()) {
      return { success: false, reason: 'Not a water bottle' };
    }

    if (!item.ammoCount || item.ammoCount <= 0) {
      return { success: false, reason: 'Bottle is empty' };
    }

    // "Drink Max" logic: drink enough to fill player hydration OR empty the bottle
    const maxHydration = playerRef.current.maxHydration || 20;
    const currentHydration = playerRef.current.hydration || 0;
    const hydrationToFill = Math.max(0, maxHydration - currentHydration);

    const amountToDrink = amount === 'max'
      ? Math.min(item.ammoCount, hydrationToFill)
      : Math.min(item.ammoCount, amount);

    if (amountToDrink <= 0) {
      return { success: false, reason: 'Already full' };
    }

    console.log(`[InventoryContext] Drinking ${amountToDrink} water from bottle`);
    addLog(`Drank ${amountToDrink} water`, 'item');

    // Apply effects
    playerRef.current.modifyStat('hydration', amountToDrink);

    // Apply "Diseased" condition if drinking dirty water
    if (item.waterQuality === 'dirty') {
      console.log('[InventoryContext] Player drank dirty water - setting condition to Diseased');
      playerRef.current.setStat('condition', 'Diseased');
    }

    // Handle stack vs single item
    const sourceItem = found?.item || item;
    if (sourceItem.stackCount > 1) {
      // 1. Reduce original stack
      sourceItem.stackCount -= 1;

      // 2. Create the "leftover" bottle with remaining water
      const leftoverBottle = Item.fromJSON(sourceItem.toJSON());
      leftoverBottle.instanceId = `split-bottle-${Date.now()}`;
      leftoverBottle.stackCount = 1;

      // Calculate how much water is left in THIS single bottle
      // Usually it's full (capacity) before drinking, but we should be robust
      const initialWater = sourceItem.ammoCount || sourceItem.capacity || 20;
      leftoverBottle.ammoCount = Math.max(0, initialWater - amountToDrink);

      // 3. Find the container to put it back in
      const container = item._container || found?.container;

      if (container) {
        // Try to add it back to the same container first
        const placed = container.addItem(leftoverBottle);
        if (!placed) {
          console.warn('[InventoryContext] No space in container for split bottle, dropping to ground');
          inventoryRef.current.dropItemToGround(leftoverBottle);
        }
      } else {
        // Fallback to ground if container not found (or if it was in equipment slot)
        inventoryRef.current.dropItemToGround(leftoverBottle);
      }
    } else {
      // Single bottle: just reduce water count
      sourceItem.ammoCount -= amountToDrink;
      console.log('[InventoryContext] Reduced water in source bottle to:', sourceItem.ammoCount);
    }

    setInventoryVersion(prev => prev + 1);
    playSound('Drink');
    return { success: true };
  }, [playerRef]);

  const getPlacementPreview = useCallback((targetContainerId, gridX, gridY) => {
    if (!selectedItem || !inventoryRef.current) {
      return null;
    }

    const { item, rotation } = selectedItem;

    // Calculate dimensions based on PREVIEW rotation
    const isRotated = rotation === 90 || rotation === 270;
    const width = isRotated ? item.height : item.width;
    const height = isRotated ? item.width : item.height;

    const targetContainer = inventoryRef.current.getContainer(targetContainerId);
    if (!targetContainer) {
      return null;
    }

    // Call validatePlacement with the preview rotation override
    const validation = targetContainer.validatePlacement(item, gridX, gridY, rotation);

    return {
      valid: validation.valid,
      reason: validation.reason,
      gridX,
      gridY,
      width,
      height
    };
  }, [selectedItem]);

  // Note: Selection clearing is now handled by:
  // 1. MapInterface for map clicks
  // 2. InventoryPanel for inventory panel background clicks
  // 3. UniversalGrid for grid-specific item interactions

  useEffect(() => {
    if (inventoryRef.current) {
      console.debug('[InventoryContext] InventoryManager initialized');
      // Expose globally for container registration from UniversalGrid
      window.__inventoryManager = inventoryRef.current;
    }
  }, [inventoryRef.current]);

  const craftItem = useCallback((recipeId) => {
    if (!inventoryRef.current) return { success: false, reason: 'Inventory not initialized' };

    const recipe = CraftingRecipes.find(r => r.id === recipeId);
    
    // Crafting Skill AP Bonus (not for cooking)
    const isCooking = recipe && recipe.tab === 'cooking';
    const craftingLvl = playerStats.craftingLvl ?? 0;
    const apBonus = isCooking ? 0 : craftingLvl; 
    const actualAP = Math.max(1, (recipe?.apCost || 0) - apBonus);

    if (recipe && recipe.apCost) {
      if (!playerRef.current || playerRef.current.ap < actualAP) {
        return { success: false, reason: `Insufficient AP (${actualAP} required)` };
      }
    }

    const result = inventoryRef.current.craftingManager.craft(recipeId);
    if (result.success) {
      // Consume AP (adjusted by skill)
      if (recipe && recipe.apCost && playerRef.current) {
        playerRef.current.useAP(actualAP);
      }
      
      // Level up the skill (not for cooking)
      if (!isCooking && playerRef.current?.onItemCrafted) {
        playerRef.current.onItemCrafted(actualAP);
      }
      addLog(`Crafted ${recipe.name}`, 'item');
      if (recipeId === 'crafting.campfire') {
        playSound('Ignite');
      } else {
        playSound('Craft');
      }

      // If the item was already placed on the ground (e.g., Campfire), stop here
      if (result.placedInGround) {
        console.log('[InventoryContext] Crafted item already placed on ground by manager');
        setInventoryVersion(v => v + 1);
        return result;
      }

      // Find space in current containers (excluding workspace)
      const targetContainers = [
        inventoryRef.current.getBackpackContainer(),
        ...inventoryRef.current.getPocketContainers()
      ].filter(Boolean);

      let added = false;
      for (const container of targetContainers) {
        if (container.addItem(result.item)) {
          added = true;
          console.log('[InventoryContext] Crafted item added to:', container.id);
          break;
        }
      }

      if (!added) {
        inventoryRef.current.dropItemToGround(result.item);
        console.log('[InventoryContext] Crafted item dropped to ground (no space)');
      }
      setInventoryVersion(v => v + 1);
    }
    return result;
  }, [playerRef]);

  const clearCraftingArea = useCallback(() => {
    if (!inventoryRef.current) return;
    inventoryRef.current.clearCraftingArea();
    setInventoryVersion(prev => prev + 1);
  }, []);

  const cookInCampfire = useCallback((campfire) => {
    if (!playerRef.current || !inventoryRef.current) return { success: false, reason: 'System error' };

    // 1. Check AP
    const apCost = 5;
    if (playerRef.current.ap < apCost) {
      return { success: false, reason: `Insufficient AP (${apCost} required)` };
    }

    // 2. Check for Cooking Pot attachment
    const potItem = campfire.attachments['pot'];
    if (!potItem) {
      return { success: false, reason: 'Cooking pot required' };
    }

    // 4. Find one dirty water bottle in the food grid
    const container = campfire.getContainerGrid();
    if (!container) return { success: false, reason: 'Campfire container error' };

    const items = Array.from(container.items.values());
    const dirtyBottle = items.find(item =>
      item.isWaterBottle && item.isWaterBottle() && item.waterQuality === 'dirty'
    );

    if (!dirtyBottle) {
      return { success: false, reason: 'No dirty water found in the campfire grid' };
    }

    // 5. BOIL: purify one bottle (No per-action fuel consumption, fire longevity is managed by fuel slot)
    dirtyBottle.waterQuality = 'clean';

    // Deduct AP
    playerRef.current.useAP(apCost);

    setInventoryVersion(v => v + 1);
    console.log('[InventoryContext] Cooking successful! Water purified.');
    playSound('Craft');
    return { success: true };
  }, [playerRef]);

  const fuelCampfire = useCallback((fuelItem, targetCampfire) => {
    if (!inventoryRef.current) return { success: false, reason: 'System error' };

    const result = inventoryRef.current.fuelCampfire(fuelItem, targetCampfire);
    if (result.success) {
      playSound('ReloadShot'); // Tactile feedback
      addLog(`Added fuel to ${targetCampfire.name} (+${result.turnsAdded} turns)`, 'item');
      
      // If item was fully consumed, clear selection directly to avoid re-adding to container
      if (result.itemDestroyed) {
        setSelectedItem(null);
      }
      
      setInventoryVersion(v => v + 1);
      setDragVersion(v => v + 1); // Refresh selection state
    }
    return result;
  }, []);

  const unrollBedroll = useCallback((item) => {
    if (!inventoryRef.current || !item) return { success: false };

    // Check AP cost (1 AP)
    if (playerRef.current && playerRef.current.ap < 1) {
      addLog('Not enough AP to unroll bedroll', 'warning');
      return { success: false, reason: 'Not enough AP' };
    }

    const groundContainer = inventoryRef.current.groundContainer;
    if (!groundContainer) return { success: false, reason: 'Ground container not found' };

    // Create the open bedroll item
    const openItemData = createItemFromDef('bedroll.open');
    const openItem = Item.fromJSON(openItemData);

    // 1. Remove the closed bedroll
    const removed = inventoryRef.current.destroyItem(item.instanceId);
    if (!removed) return { success: false, reason: 'Could not remove item' };

    // 2. Attempt to place the open bedroll on the ground
    // Try to place at the same coords if it was already on ground
    let placed = false;
    if (item._container?.id === 'ground') {
      placed = groundContainer.placeItemAt(openItem, item.x, item.y);
    }
    
    // If not on ground or placement failed (lack of space), use addItem smart placement
    if (!placed) {
      placed = groundContainer.addItem(openItem);
    }

    if (placed) {
      if (playerRef.current) playerRef.current.useAP(1);
      playSound('Equip');
      addLog('Unrolled bedroll', 'item');
      setInventoryVersion(prev => prev + 1);
      return { success: true };
    } else {
      // Fallback: Restore the closed bedroll if open one can't fit anywhere (highly unlikely on ground)
      groundContainer.addItem(item);
      addLog('No space to unroll bedroll!', 'warning');
      return { success: false, reason: 'No space' };
    }
  }, [inventoryVersion]);

  const rollupBedroll = useCallback((item) => {
    if (!inventoryRef.current || !item) return { success: false };

    // Check AP cost (1 AP)
    if (playerRef.current && playerRef.current.ap < 1) {
      addLog('Not enough AP to roll up bedroll', 'warning');
      return { success: false, reason: 'Not enough AP' };
    }

    // Create the closed bedroll item
    const closedItemData = createItemFromDef('bedroll.closed');
    const closedItem = Item.fromJSON(closedItemData);

    // 1. Remove the open bedroll
    const removed = inventoryRef.current.destroyItem(item.instanceId);
    if (!removed) return { success: false, reason: 'Could not remove item' };

    // 2. Add closed bedroll using smart addItem (tries inventory first, then ground)
    const result = inventoryRef.current.addItem(closedItem);
    
    if (result.success) {
      if (playerRef.current) playerRef.current.useAP(1);
      playSound('Equip');
      addLog('Rolled up bedroll', 'item');
      setInventoryVersion(prev => prev + 1);
      return { success: true };
    } else {
      // Emergency: Force back to ground if everything is full
      const ground = inventoryRef.current.groundContainer;
      ground.addItem(closedItem);
      if (playerRef.current) playerRef.current.useAP(1);
      playSound('Equip');
      addLog('Rolled up bedroll (placed on ground)', 'item');
      setInventoryVersion(prev => prev + 1);
      return { success: true };
    }
  }, [inventoryVersion]);

  const contextValue = useMemo(() => {
    console.log('[InventoryContext] Creating new context value - dragVersion:', dragVersion, 'selectedItem:', selectedItem?.item?.name || 'none');
    return {
      inventoryRef,
      inventoryVersion,
      setInventory,
      getContainer,
      getEquippedBackpackContainer,
      getEncumbranceModifiers,
      canOpenContainer,
      equipItem,
      unequipItem,
      destroyItem,
      moveItem,
      dropItemToGround,
      organizeGroundItems,
      quickPickupByCategory,
      forceRefresh,
      openContainers,
      openContainer,
      closeContainer,
      isContainerOpen,
      // Phase 5G/5H: Selection-based drag system
      selectedItem,
      selectItem,
      rotateSelected,
      clearSelected,
      placeSelected,
      getPlacementPreview,
      equipSelectedItem,
      splitStack,
      depositSelectedInto,
      attachSelectedInto,
      unrollBedroll,
      rollupBedroll,
      loadAmmoInto,
      loadAmmoDirectly,
      unloadMagazine,
      consumeItem,
      drinkWater,
      attachSelectedItemToWeapon,
      detachItemFromWeapon,
      // Crafting
      craftingRecipes: CraftingRecipes,
      selectedRecipeId,
      setSelectedRecipeId,
      craftItem,
      clearCraftingArea,
      cookInCampfire,
      fuelCampfire
    };
  }, [inventoryVersion, dragVersion, setInventory, getContainer, getEquippedBackpackContainer, getEncumbranceModifiers, canOpenContainer, equipItem, unequipItem, destroyItem, moveItem, dropItemToGround, organizeGroundItems, quickPickupByCategory, forceRefresh, openContainers, openContainer, closeContainer, isContainerOpen, selectedItem, selectItem, rotateSelected, clearSelected, placeSelected, getPlacementPreview, equipSelectedItem, splitStack, depositSelectedInto, attachSelectedInto, loadAmmoDirectly, attachSelectedItemToWeapon, detachItemFromWeapon, consumeItem, selectedRecipeId, craftItem, clearCraftingArea, cookInCampfire, fuelCampfire]);

  return (
    <InventoryContext.Provider value={contextValue}>
      {children}
    </InventoryContext.Provider>
  );
};