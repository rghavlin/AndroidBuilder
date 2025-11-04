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
  
  // Phase 5G: Cursor-following drag state
  const [dragState, setDragState] = useState(null); // { item, originContainer, originX, originY, rotation, cursorX, cursorY }

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

  // Phase 5G: Drag actions
  const beginDrag = useCallback((item, originContainerId, originX, originY, initialCursorX = 0, initialCursorY = 0) => {
    console.log('[InventoryContext] === BEGIN DRAG DEBUG ===');
    console.log('[InventoryContext] Arguments:', {
      item: item ? { name: item.name, instanceId: item.instanceId, imageId: item.imageId } : null,
      originContainerId,
      originX,
      originY,
      initialCursorX,
      initialCursorY
    });
    
    if (!item || !item.instanceId) {
      console.warn('[InventoryContext] Cannot begin drag without valid item');
      return false;
    }
    
    // Ensure we have valid cursor coordinates
    if (initialCursorX === 0 && initialCursorY === 0) {
      console.warn('[InventoryContext] beginDrag called without cursor position - drag preview may not render immediately');
    }

    console.debug('[InventoryContext] Begin drag:', {
      name: item.name,
      from: originContainerId,
      gridPos: `(${originX}, ${originY})`,
      cursorPos: `(${initialCursorX}, ${initialCursorY})`,
      rotation: item.rotation || 0,
      imageId: item.imageId
    });
    
    // Remove item from its container during drag
    const originContainer = inventoryRef.current?.getContainer(originContainerId);
    if (originContainer) {
      originContainer.removeItem(item.instanceId);
      console.debug('[InventoryContext] Removed item from container during drag');
    }
    
    const newDragState = {
      item,
      originContainerId,
      originX,
      originY,
      rotation: item.rotation || 0,
      cursorX: initialCursorX,
      cursorY: initialCursorY
    };
    
    console.log('[InventoryContext] *** CRITICAL DEBUG ***');
    console.log('[InventoryContext] Current dragState before update:', dragState);
    console.log('[InventoryContext] NEW DRAG STATE OBJECT:', newDragState);
    console.log('[InventoryContext] Object identity check - different object?', newDragState !== dragState);
    console.log('[InventoryContext] Calling setDragState NOW...');
    
    setDragState(newDragState);
    
    console.log('[InventoryContext] setDragState called - state update scheduled');
    console.log('[InventoryContext] React should re-render DragPreviewLayer on next tick');
    
    // Force UI update
    console.log('[InventoryContext] Incrementing inventoryVersion to force re-render...');
    setInventoryVersion(prev => {
      console.log('[InventoryContext] inventoryVersion:', prev, '->', prev + 1);
      return prev + 1;
    });
    
    console.log('[InventoryContext] === END BEGIN DRAG ===');
    return true;
  }, [dragState]);

  const rotateDrag = useCallback(() => {
    setDragState(prev => {
      if (!prev) return null;
      const newRotation = (prev.rotation + 90) % 360;
      console.debug('[InventoryContext] Rotate drag to:', newRotation);
      return {
        ...prev,
        rotation: newRotation
      };
    });
  }, []);

  const updateDragPosition = useCallback((cursorX, cursorY) => {
    setDragState(prev => {
      if (!prev) {
        console.log('[InventoryContext] updateDragPosition: no previous dragState');
        return null;
      }
      const updated = {
        ...prev,
        cursorX,
        cursorY
      };
      // Only log occasionally to avoid spam
      if (Math.random() < 0.01) {
        console.log('[InventoryContext] updateDragPosition:', cursorX, cursorY);
      }
      return updated;
    });
  }, []);

  const cancelDrag = useCallback(() => {
    if (!dragState || !inventoryRef.current) {
      setDragState(null);
      return;
    }

    const { item, originContainerId, originX, originY } = dragState;
    
    console.debug('[InventoryContext] Cancel drag - restoring item to origin');
    
    // Restore item to original position
    const originContainer = inventoryRef.current.getContainer(originContainerId);
    if (originContainer) {
      // Restore original rotation
      item.rotation = dragState.rotation;
      originContainer.placeItemAt(item, originX, originY);
      setInventoryVersion(prev => prev + 1);
    }
    
    setDragState(null);
  }, [dragState]);

  const tryPlaceDrag = useCallback((targetContainerId, targetX, targetY) => {
    if (!dragState || !inventoryRef.current) {
      return { success: false, reason: 'No drag in progress' };
    }

    const { item, originContainerId, originX, originY, rotation } = dragState;
    
    console.debug('[InventoryContext] Try place drag:', item.name, 'to', targetContainerId, 'at', targetX, targetY, 'rotation:', rotation);

    // Update item rotation to match drag state
    item.rotation = rotation;
    
    // Validate placement
    const targetContainer = inventoryRef.current.getContainer(targetContainerId);
    if (!targetContainer) {
      console.warn('[InventoryContext] Target container not found:', targetContainerId);
      // Restore to origin on failure
      cancelDrag();
      return { success: false, reason: 'Target container not found' };
    }

    const validation = targetContainer.validatePlacement(item, targetX, targetY);
    if (!validation.valid) {
      console.warn('[InventoryContext] Invalid placement:', validation.reason);
      // Restore to origin on failure
      const originContainer = inventoryRef.current.getContainer(originContainerId);
      if (originContainer) {
        // Reset rotation to original
        item.rotation = dragState.rotation;
        originContainer.placeItemAt(item, originX, originY);
      }
      setDragState(null);
      setInventoryVersion(prev => prev + 1);
      return { success: false, reason: validation.reason };
    }

    // Place in target container
    const placed = targetContainer.placeItemAt(item, targetX, targetY);
    
    if (!placed) {
      console.warn('[InventoryContext] Failed to place item');
      // Restore to origin on failure
      const originContainer = inventoryRef.current.getContainer(originContainerId);
      if (originContainer) {
        item.rotation = dragState.rotation;
        originContainer.placeItemAt(item, originX, originY);
      }
      setDragState(null);
      setInventoryVersion(prev => prev + 1);
      return { success: false, reason: 'Failed to place item' };
    }

    console.debug('[InventoryContext] Successfully placed item');
    setDragState(null);
    setInventoryVersion(prev => prev + 1);
    return { success: true };
  }, [dragState, cancelDrag]);

  const getPlacementPreview = useCallback((targetContainerId, gridX, gridY) => {
    if (!dragState || !inventoryRef.current) {
      return null;
    }

    const { item, rotation } = dragState;
    
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
  }, [dragState]);

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

  const contextValue = useMemo(() => ({
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
    // Phase 5G: Drag system
    dragState,
    beginDrag,
    rotateDrag,
    updateDragPosition,
    cancelDrag,
    tryPlaceDrag,
    getPlacementPreview
  }), [inventoryVersion, setInventory, getContainer, getEquippedBackpackContainer, getEncumbranceModifiers, canOpenContainer, equipItem, unequipItem, moveItem, dropItemToGround, organizeGroundItems, quickPickupByCategory, forceRefresh, openContainers, openContainer, closeContainer, isContainerOpen, dragState, beginDrag, rotateDrag, updateDragPosition, cancelDrag, tryPlaceDrag, getPlacementPreview]);

  return (
    <InventoryContext.Provider value={contextValue}>
      {children}
    </InventoryContext.Provider>
  );
};