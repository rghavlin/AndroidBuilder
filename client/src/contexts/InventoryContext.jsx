import React, { createContext, useContext, useRef, useState, useCallback, useMemo, useEffect } from 'react';

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
        forceRefresh: () => {}
      };
    }
    throw new Error('useInventory must be used within an InventoryProvider');
  }
  return context;
};

export const InventoryProvider = ({ children, manager }) => {
  // TEMP DIAGNOSTIC: Detect duplicate provider instances
  const __instanceId = useMemo(() => Math.random().toString(36).slice(2, 7), []);
  
  useEffect(() => {
    console.log(`[InventoryProvider] MOUNT id=${__instanceId}`);
    return () => console.log(`[InventoryProvider] UNMOUNT id=${__instanceId}`);
  }, [__instanceId]);

  // Graceful degradation: render children without inventory context until manager exists
  if (!manager) {
    if (import.meta?.env?.DEV) {
      console.warn('[InventoryProvider] No manager available - rendering without inventory context (game will load, inventory disabled until init completes)');
    }
    return <>{children}</>; // Pass-through: render app without inventory until manager exists
  }

  const inventoryRef = useRef(null);
  const [inventoryVersion, setInventoryVersion] = useState(0);
  const [openContainers, setOpenContainers] = useState(new Set());
  
  // Phase 5G: Selection-based drag state (simpler than cursor-following)
  const [selectedItem, setSelectedItem] = useState(null); // { item, originContainerId, originX, originY, rotation }
  const [dragVersion, setDragVersion] = useState(0); // Force re-render on selection changes

  // Phase 5A: Accept external manager, never construct internally
  if (!inventoryRef.current && manager) {
    inventoryRef.current = manager;
    console.log('[InventoryContext] InventoryManager received from provider props');
    console.log('[InventoryContext] - Manager has', manager.containers.size, 'containers');
    console.log('[InventoryContext] - Equipment slots:', Object.entries(manager.equipment).filter(([s, i]) => i).map(([s, i]) => `${s}:${i.name}`).join(', ') || 'none');
  }
  
  // Update ref if manager prop changes (during load)
  if (manager && inventoryRef.current !== manager) {
    console.log('[InventoryContext] 🔄 Manager prop changed - updating ref');
    console.log('[InventoryContext] - Old manager containers:', inventoryRef.current?.containers.size || 0);
    console.log('[InventoryContext] - New manager containers:', manager.containers.size);
    inventoryRef.current = manager;
    setInventoryVersion(prev => prev + 1);
  }

  // Dev-only: Force refresh for console testing (Phase 5C/5D workaround until Phase 5E)
  const forceRefresh = useCallback(() => {
    setInventoryVersion(prev => prev + 1);
  }, []);

  // Dev-console bridge (Phase 5A)
  // Note: Works in both dev and production builds for testing/debugging
  useEffect(() => {
    if (inventoryRef.current) {
      window.inventoryManager = inventoryRef.current;
      window.inv = {
        getContainer: (id) => inventoryRef.current?.getContainer(id),
        equipItem: (item, slot) => inventoryRef.current?.equipItem(item, slot),
        moveItem: (itemId, from, to, x, y) =>
          inventoryRef.current?.moveItem(itemId, from, to, x, y),
        refresh: forceRefresh
      };
      console.log('[InventoryContext] Dev console bridge established: window.inventoryManager, window.inv');
    }
  }, [forceRefresh]);

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
    // Accept either a container object or an id
    const cid = typeof containerOrId === 'string'
      ? containerOrId
      : containerOrId?.id;

    if (!cid) {
      if (import.meta?.env?.DEV) {
        console.warn('[Inventory] openContainer called without valid id');
      }
      return;
    }

    // Ensure container is registered in the manager
    const container = inventoryRef.current.getContainer(cid);
    if (container) {
      console.debug('[InventoryContext] Opening container:', cid);
      setOpenContainers(prev => {
        const next = new Set(prev);
        next.add(cid);
        return next;
      });
    } else {
      console.warn('[InventoryContext] Cannot open unregistered container:', cid);
    }
  }, [inventoryVersion]); // Dependency on inventoryVersion to ensure we get the latest manager state if it changes

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
    console.debug('[InventoryContext] Clear selection');
    setSelectedItem(null);
    setDragVersion(prev => prev + 1);
  }, []);

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

    const result = inventoryRef.current.equipItem(item, targetSlot);
    
    if (result.success) {
      setSelectedItem(null);
      setDragVersion(prev => prev + 1);
      setInventoryVersion(prev => prev + 1);
      return { success: true };
    }
    
    return result;
  }, [selectedItem]);

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
      const result = inventoryRef.current.unequipItem(slot);
      
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
    
    if (!targetContainer) {
      console.warn('[InventoryContext] Target container not found:', targetContainerId);
      setSelectedItem(null);
      setInventoryVersion(prev => prev + 1);
      return { success: false, reason: 'Target container not found' };
    }

    // CRITICAL: Remove from origin container FIRST with ORIGINAL rotation intact
    // This ensures correct grid cell clearing based on item's current state
    if (originContainer) {
      const removed = originContainer.removeItem(item.instanceId);
      if (!removed) {
        console.error('[InventoryContext] Failed to remove item from origin container');
        return { success: false, reason: 'Failed to remove from origin' };
      }
      console.debug('[InventoryContext] Removed item from origin:', originContainerId, 'with rotation:', item.rotation);
    }
    
    // NOW apply the new rotation (item is free-floating, no grid conflicts)
    const previousRotation = item.rotation;
    item.rotation = rotation;
    console.debug('[InventoryContext] Applied rotation:', previousRotation, '→', rotation);
    
    // Validate placement with rotated item
    const validation = targetContainer.validatePlacement(item, targetX, targetY);
    if (!validation.valid) {
      console.warn('[InventoryContext] Invalid placement:', validation.reason);
      // Restore item to original state and position
      item.rotation = originalRotation;
      if (originContainer) {
        originContainer.placeItemAt(item, originalX, originalY);
      }
      setInventoryVersion(prev => prev + 1);
      return { success: false, reason: validation.reason };
    }
    
    // Place in target container at new position with new rotation
    const placed = targetContainer.placeItemAt(item, targetX, targetY);
    
    if (!placed) {
      console.warn('[InventoryContext] Failed to place item');
      // Restore item to original state and position
      item.rotation = originalRotation;
      if (originContainer) {
        originContainer.placeItemAt(item, originalX, originalY);
      }
      setInventoryVersion(prev => prev + 1);
      return { success: false, reason: 'Failed to place item' };
    }

    console.debug('[InventoryContext] Successfully placed item:', {
      name: item.name,
      instanceId: item.instanceId,
      container: targetContainerId,
      position: `(${targetX}, ${targetY})`,
      rotation: rotation
    });
    
    setSelectedItem(null);
    setDragVersion(prev => prev + 1);
    setInventoryVersion(prev => prev + 1);
    return { success: true };
  }, [selectedItem]);

  const getPlacementPreview = useCallback((targetContainerId, gridX, gridY) => {
    if (!selectedItem || !inventoryRef.current) {
      return null;
    }

    const { item, rotation } = selectedItem;
    
    // Calculate dimensions based on PREVIEW rotation (not item.rotation which hasn't changed)
    const isRotated = rotation === 90 || rotation === 270;
    const width = isRotated ? item.height : item.width;
    const height = isRotated ? item.width : item.height;
    
    const targetContainer = inventoryRef.current.getContainer(targetContainerId);
    if (!targetContainer) {
      return null;
    }

    // Create temporary validation object with preview rotation
    // DO NOT use item.rotation - use the preview rotation from state
    const itemForValidation = { 
      ...item, 
      rotation,
      getActualWidth: () => width,
      getActualHeight: () => height
    };
    const validation = targetContainer.validatePlacement(itemForValidation, gridX, gridY);
    
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
    return () => {
      window.__inventoryManager = null;
    };
  }, [inventoryRef.current]);

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
      equipSelectedItem
    };
  }, [inventoryVersion, dragVersion, setInventory, getContainer, getEquippedBackpackContainer, getEncumbranceModifiers, canOpenContainer, equipItem, unequipItem, moveItem, dropItemToGround, organizeGroundItems, quickPickupByCategory, forceRefresh, openContainers, openContainer, closeContainer, isContainerOpen, selectedItem, selectItem, rotateSelected, clearSelected, placeSelected, getPlacementPreview, equipSelectedItem]);

  return (
    <InventoryContext.Provider value={contextValue}>
      {children}
    </InventoryContext.Provider>
  );
};