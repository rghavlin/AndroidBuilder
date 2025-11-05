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
  }

  // Dev-only: Force refresh for console testing (Phase 5C/5D workaround until Phase 5E)
  const forceRefresh = useCallback(() => {
    setInventoryVersion(prev => prev + 1);
  }, []);

  // Dev-console bridge (Phase 5A)
  useEffect(() => {
    if (process.env.NODE_ENV === 'development' && inventoryRef.current) {
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

  // Phase 5G: Selection actions (simpler than cursor-following)
  const selectItem = useCallback((item, originContainerId, originX, originY) => {
    if (!item || !item.instanceId) {
      console.warn('[InventoryContext] Cannot select without valid item');
      return false;
    }

    console.debug('[InventoryContext] Select item:', {
      name: item.name,
      from: originContainerId,
      gridPos: `(${originX}, ${originY})`,
      rotation: item.rotation || 0
    });
    
    setSelectedItem({
      item,
      originContainerId,
      originX,
      originY,
      rotation: item.rotation || 0
    });
    setDragVersion(prev => prev + 1);
    return true;
  }, []);

  const rotateSelected = useCallback(() => {
    setSelectedItem(prev => {
      if (!prev) return null;
      const newRotation = (prev.rotation + 90) % 360;
      console.debug('[InventoryContext] Rotate selected to:', newRotation);
      
      // Update the item's rotation directly (Item instance stays intact with all methods)
      prev.item.rotation = newRotation;
      
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

  const placeSelected = useCallback((targetContainerId, targetX, targetY) => {
    if (!selectedItem || !inventoryRef.current) {
      return { success: false, reason: 'No item selected' };
    }

    const { item, originContainerId, originX, originY, rotation } = selectedItem;
    
    console.debug('[InventoryContext] Place selected:', item.name, 'to', targetContainerId, 'at', targetX, targetY, 'rotation:', rotation);

    // Create a working copy with the correct rotation
    const itemToPlace = { ...item, rotation };
    
    // Remove from origin container
    const originContainer = inventoryRef.current.getContainer(originContainerId);
    if (originContainer) {
      originContainer.removeItem(item.instanceId);
    }
    
    // Validate placement
    const targetContainer = inventoryRef.current.getContainer(targetContainerId);
    if (!targetContainer) {
      console.warn('[InventoryContext] Target container not found:', targetContainerId);
      // Restore to origin on failure
      if (originContainer) {
        originContainer.placeItemAt(item, originX, originY);
      }
      setSelectedItem(null);
      setInventoryVersion(prev => prev + 1);
      return { success: false, reason: 'Target container not found' };
    }

    const validation = targetContainer.validatePlacement(itemToPlace, targetX, targetY);
    if (!validation.valid) {
      console.warn('[InventoryContext] Invalid placement:', validation.reason);
      // Restore to origin on failure
      if (originContainer) {
        originContainer.placeItemAt(item, originX, originY);
      }
      setInventoryVersion(prev => prev + 1);
      return { success: false, reason: validation.reason };
    }

    // Apply rotation to the actual item before placing
    item.rotation = rotation;
    
    // Place in target container
    const placed = targetContainer.placeItemAt(item, targetX, targetY);
    
    if (!placed) {
      console.warn('[InventoryContext] Failed to place item');
      // Restore to origin on failure (restore original rotation)
      if (originContainer) {
        item.rotation = selectedItem.item.rotation || 0;
        originContainer.placeItemAt(item, originX, originY);
      }
      setInventoryVersion(prev => prev + 1);
      return { success: false, reason: 'Failed to place item' };
    }

    console.debug('[InventoryContext] Successfully placed item');
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
    
    // Calculate dimensions based on rotation
    const isRotated = rotation === 90 || rotation === 270;
    const width = isRotated ? item.height : item.width;
    const height = isRotated ? item.width : item.height;
    
    const targetContainer = inventoryRef.current.getContainer(targetContainerId);
    if (!targetContainer) {
      return null;
    }

    // Create item object with current rotation for validation
    const itemForValidation = { ...item, rotation };
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
      // Phase 5G: Selection-based drag system
      selectedItem,
      selectItem,
      rotateSelected,
      clearSelected,
      placeSelected,
      getPlacementPreview
    };
  }, [inventoryVersion, dragVersion, setInventory, getContainer, getEquippedBackpackContainer, getEncumbranceModifiers, canOpenContainer, equipItem, unequipItem, moveItem, dropItemToGround, organizeGroundItems, quickPickupByCategory, forceRefresh, openContainers, openContainer, closeContainer, isContainerOpen, selectedItem, selectItem, rotateSelected, clearSelected, placeSelected, getPlacementPreview]);

  return (
    <InventoryContext.Provider value={contextValue}>
      {children}
    </InventoryContext.Provider>
  );
};