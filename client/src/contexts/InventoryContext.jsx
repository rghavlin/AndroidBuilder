
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
        getEquippedBackpackContainer: () => null,
        getEncumbranceModifiers: () => ({ evade: 0, ap: 0 }),
        canOpenContainer: () => false
      };
    }
    throw new Error('useInventory must be used within an InventoryProvider');
  }
  return context;
};

export const InventoryProvider = ({ children }) => {
  const inventoryRef = useRef(null);
  const [inventoryVersion, setInventoryVersion] = useState(0);

  // Initialize inventory manager
  if (!inventoryRef.current) {
    inventoryRef.current = new InventoryManager();
    console.log('[InventoryContext] InventoryManager initialized');
  }

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

  const contextValue = useMemo(() => ({
    inventoryRef,
    inventoryVersion,
    setInventory,
    getEquippedBackpackContainer,
    getEncumbranceModifiers,
    canOpenContainer
  }), [inventoryVersion, setInventory, getEquippedBackpackContainer, getEncumbranceModifiers, canOpenContainer]);

  return (
    <InventoryContext.Provider value={contextValue}>
      {children}
    </InventoryContext.Provider>
  );
};
