import React, { createContext, useContext, useRef, useState, useCallback, useMemo, useEffect } from 'react';
import { ItemTrait } from '../game/inventory/traits.js';
import { ItemDefs, createItemFromDef } from '../game/inventory/ItemDefs.js';
import { Item } from '../game/inventory/Item.js';
import { CraftingRecipes } from '../game/inventory/CraftingRecipes.js';
import { usePlayer } from './PlayerContext.jsx';

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

  const { playerRef } = usePlayer();

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
        refresh: forceRefresh
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
    console.log('[InventoryContext] InventoryManager received from provider props');
    console.log('[InventoryContext] - Manager has', manager.containers.size, 'containers');
    console.log('[InventoryContext] - Equipment slots:', Object.entries(manager.equipment).filter(([s, i]) => i).map(([s, i]) => `${s}:${i.name}`).join(', ') || 'none');
  }

  if (manager && inventoryRef.current !== manager) {
    inventoryRef.current = manager;
    setInventoryVersion(prev => prev + 1);
  }

  // Phase 5B: Listen for global inventory changes to trigger UI refreshes
  useEffect(() => {
    if (!manager) return;

    const handleInventoryChanged = () => {
      console.log('[InventoryContext] 🔄 Inventory changed event received, bumping version');
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
      setInventoryVersion(prev => prev + 1);
    }
    return result;
  }, []);

  const unequipItem = useCallback((slot) => {
    if (!inventoryRef.current) {
      return { success: false, reason: 'Inventory not initialized' };
    }
    const result = inventoryRef.current.unequipItem(slot);
    if (result.success) {
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

    const { item, originContainerId } = selectedItem;

    // Check if item can be equipped in target slot
    if (item.equippableSlot !== targetSlot) {
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
      setSelectedItem(null);
      setDragVersion(prev => prev + 1);
      setInventoryVersion(prev => prev + 1);
      return { success: true };
    }

    return result;
  }, [selectedItem]);

  const attachSelectedItemToWeapon = useCallback((weapon, slotId) => {
    if (!selectedItem || !inventoryRef.current) return { success: false, reason: 'No item selected' };
    const result = inventoryRef.current.attachItemToWeapon(weapon, slotId, selectedItem.item, selectedItem.originContainerId);
    if (result.success) {
      // IMPORTANT: Clear selection without triggering restoration logic in clearSelected()
      setSelectedItem(null);
      setDragVersion(v => v + 1);
      setInventoryVersion(v => v + 1);
    }
    return result;
  }, [selectedItem, inventoryRef]);

  const detachItemFromWeapon = useCallback((weapon, slotId) => {
    if (!inventoryRef.current) return null;
    const item = inventoryRef.current.detachItemFromWeapon(weapon, slotId);
    if (item) {
      setInventoryVersion(v => v + 1);
      // Auto-select the detached item
      // Include slotId in origin so it can be returned if selection cancelled
      selectItem(item, `weapon-mod-${weapon.instanceId}:${slotId}`, 0, 0);
      return item;
    }
    return null;
  }, [inventoryRef, selectItem]);

  /**
   * Quick attach selected item into a target weapon item
   */
  const attachSelectedInto = useCallback((targetWeapon) => {
    if (!selectedItem || !inventoryRef.current || !targetWeapon) return { success: false };

    const { item: modItem } = selectedItem;

    // Check if target has attachment slots
    if (!targetWeapon.attachmentSlots) {
      console.warn('[InventoryContext] Target item is not a weapon/item with slots:', targetWeapon.name);
      return { success: false, reason: 'Target has no attachment slots' };
    }

    // Find compatible slot
    const slotId = targetWeapon.findCompatibleAttachmentSlot ? targetWeapon.findCompatibleAttachmentSlot(modItem) : null;

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
      setSelectedItem(null);

      setInventoryVersion(prev => prev + 1);
      setDragVersion(prev => prev + 1);
      return { success: true };
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

  const placeSelected = useCallback((targetContainerId, targetX, targetY) => {
    if (!selectedItem || !inventoryRef.current) {
      return { success: false, reason: 'No item selected' };
    }

    const { item, originContainerId, originX, originY, rotation, originalRotation, isEquipment } = selectedItem;

    console.debug('[InventoryContext] Place selected:', item.name, 'to', targetContainerId, 'at', targetX, targetY, 'rotation:', rotation, 'isEquipment:', isEquipment);

    // Phase 5H: Block moving backpacks that have open floating panels
    if (item.equippableSlot === 'backpack' && item.containerGrid) {
      const containerIsOpen = isContainerOpen(item.containerGrid.id);
      if (containerIsOpen) {
        console.warn('[InventoryContext] Cannot move backpack - container panel is open');
        return { success: false, reason: 'Close the backpack container before moving it' };
      }
    }

    // Phase 5H: Prevent unequipping backpack into itself - just cancel selection
    if (isEquipment && item.equippableSlot === 'backpack' && item.containerGrid) {
      if (targetContainerId === item.containerGrid.id) {
        console.debug('[InventoryContext] Cannot unequip backpack into itself - canceling selection');
        setSelectedItem(null);
        setDragVersion(prev => prev + 1);
        return { success: false, reason: 'Cannot place backpack inside itself' };
      }
    }

    // Phase 5H: Handle unequipping
    if (isEquipment) {
      const slot = originContainerId.replace('equipment-', '');
      // Pass the target details to unequipItem so it respects the drop location
      const result = inventoryRef.current.unequipItem(slot, targetContainerId, targetX, targetY);

      if (result.success) {
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

    // 1. Validate placement in target container
    const validation = targetContainer.validatePlacement(item, targetX, targetY, rotation);
    if (!validation.valid && !validation.stackTarget) {
      console.warn('[InventoryContext] Invalid placement:', validation.reason);
      return { success: false, reason: validation.reason };
    }

    // 2. CRITICAL: Remove from origin container FIRST
    // This ensures there are no "duplicates" in the data before we place in the target
    if (originContainer && originContainer.removeItem) {
      const removed = originContainer.removeItem(item.instanceId);
      if (!removed) {
        console.error('[InventoryContext] Failed to remove item from origin container');
        return { success: false, reason: 'Failed to remove from origin' };
      }
      console.debug('[InventoryContext] Successfully removed from origin:', originContainerId);
    } else if (originContainerId.startsWith('weapon-mod-')) {
      // Already removed during detach
      console.debug('[InventoryContext] Item from weapon-mod origin is already detached');
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
      Object.entries(item.consumptionEffects).forEach(([stat, amount]) => {
        playerRef.current.modifyStat(stat, amount);
      });
    }

    // Find the container holding this item
    const container = Array.from(inventoryRef.current.containers.values())
      .find(c => c.items.has(item.instanceId));

    if (!container) {
      // Check if it's equipped - some consumables might be equipped? Usually not food.
      // But for completeness:
      console.warn('[InventoryContext] Consumable container not found for:', item.name);
      return { success: false, reason: 'Item container not found' };
    }

    // Handle stack reduction or removal
    if (item.isStackable && item.isStackable() && item.stackCount > 1) {
      item.stackCount -= 1;
      console.log('[InventoryContext] Stack reduced, new count:', item.stackCount);
    } else {
      container.removeItem(item.instanceId);
      console.log('[InventoryContext] Item fully consumed and removed from container');
    }

    setInventoryVersion(prev => prev + 1);
    return { success: true };
  }, [playerRef]);

  /**
   * Drink water from a bottle
   */
  const drinkWater = useCallback((item, amount) => {
    if (!inventoryRef.current || !item || !playerRef.current) {
      return { success: false, reason: 'Initialization error' };
    }

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

    // Apply effects
    playerRef.current.modifyStat('hydration', amountToDrink);

    // Handle stack vs single item
    if (item.stackCount > 1) {
      // 1. Reduce original stack
      item.stackCount -= 1;

      // 2. Create the "leftover" bottle with remaining water
      const leftoverBottle = Item.fromJSON(item.toJSON());
      leftoverBottle.instanceId = `split-bottle-${Date.now()}`;
      leftoverBottle.stackCount = 1;

      // Calculate how much water is left in THIS single bottle
      // Usually it's full (capacity) before drinking, but we should be robust
      const initialWater = item.ammoCount || item.capacity || 20;
      leftoverBottle.ammoCount = Math.max(0, initialWater - amountToDrink);

      // 3. Find the container to put it back in
      const container = Array.from(inventoryRef.current.containers.values())
        .find(c => c.items.has(item.instanceId));

      if (container) {
        // Try to add it back to the same container first
        const placed = container.addItem(leftoverBottle);
        if (!placed) {
          console.warn('[InventoryContext] No space in container for split bottle, dropping to ground');
          inventoryRef.current.dropItemToGround(leftoverBottle);
        }
      } else {
        // Fallback to ground if container not found
        inventoryRef.current.dropItemToGround(leftoverBottle);
      }
    } else {
      // Single bottle: just reduce water count
      item.ammoCount -= amountToDrink;
    }

    setInventoryVersion(prev => prev + 1);
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
    const result = inventoryRef.current.craftingManager.craft(recipeId);
    if (result.success) {
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
  }, []);

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
      loadAmmoInto,
      unloadMagazine,
      consumeItem,
      drinkWater,
      attachSelectedItemToWeapon,
      detachItemFromWeapon,
      // Crafting
      craftingRecipes: CraftingRecipes,
      selectedRecipeId,
      setSelectedRecipeId,
      craftItem
    };
  }, [inventoryVersion, dragVersion, setInventory, getContainer, getEquippedBackpackContainer, getEncumbranceModifiers, canOpenContainer, equipItem, unequipItem, moveItem, dropItemToGround, organizeGroundItems, quickPickupByCategory, forceRefresh, openContainers, openContainer, closeContainer, isContainerOpen, selectedItem, selectItem, rotateSelected, clearSelected, placeSelected, getPlacementPreview, equipSelectedItem, splitStack, depositSelectedInto, attachSelectedInto, attachSelectedItemToWeapon, detachItemFromWeapon, consumeItem, selectedRecipeId, craftItem]);

  return (
    <InventoryContext.Provider value={contextValue}>
      {children}
    </InventoryContext.Provider>
  );
};