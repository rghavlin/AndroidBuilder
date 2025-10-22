
import React, { createContext, useContext, useRef, useState, useCallback, useMemo } from 'react';
import { InventoryManager } from '../game/inventory/InventoryManager.js';

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
        dropItemToGround: () => false
      };
    }
    throw new Error('useInventory must be used within an InventoryProvider');
  }
  return context;
};

export const InventoryProvider = ({ children, manager }) => {
  const inventoryRef = useRef(null);
  const [inventoryVersion, setInventoryVersion] = useState(0);

  // Phase 5A: Accept external manager, never construct internally
  if (!inventoryRef.current && manager) {
    inventoryRef.current = manager;
    console.log('[InventoryContext] InventoryManager received from provider props');
  }

  if (!manager) {
    console.error('[InventoryContext] No manager prop provided - InventoryProvider requires a manager!');
  }

  // Dev-console bridge (Phase 5A)
  useEffect(() => {
    if (process.env.NODE_ENV === 'development' && inventoryRef.current) {
      (window as any).inventoryManager = inventoryRef.current;
      (window as any).inv = {
        getContainer: (id: string) => inventoryRef.current?.getContainer(id),
        equipItem: (item: any, slot: string) => inventoryRef.current?.equipItem(item, slot),
        moveItem: (itemId: string, from: string, to: string, x: number, y: number) =>
          inventoryRef.current?.moveItem(itemId, from, to, x, y),
      };
      console.log('[InventoryContext] Dev console bridge established: window.inventoryManager, window.inv');
    }
  }, []);

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
    quickPickupByCategory
  }), [inventoryVersion, setInventory, getContainer, getEquippedBackpackContainer, getEncumbranceModifiers, canOpenContainer, equipItem, unequipItem, moveItem, dropItemToGround, organizeGroundItems, quickPickupByCategory]);

  return (
    <InventoryContext.Provider value={contextValue}>
      {children}
    </InventoryContext.Provider>
  );
};
