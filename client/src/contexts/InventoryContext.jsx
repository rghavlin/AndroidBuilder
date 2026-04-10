import React, { createContext, useContext, useState, useCallback, useMemo, useEffect, useSyncExternalStore } from 'react';
import { ItemTrait } from '../game/inventory/traits.js';
import { ItemDefs, createItemFromDef } from '../game/inventory/ItemDefs.js';
import { Item } from '../game/inventory/Item.js';
import { CraftingRecipes } from '../game/inventory/CraftingRecipes.js';
import { useLog } from './LogContext.jsx';
import { useAudio } from './AudioContext.jsx';
import Logger from '../game/utils/Logger.js';
import engine from '../game/GameEngine.js';
import GameEvents, { GAME_EVENT } from '../game/utils/GameEvents.js';

const logger = Logger.scope('InventoryContext');

const InventoryContext = createContext();

export const useInventory = () => {
  const context = useContext(InventoryContext);
  if (!context) {
    if (process.env.NODE_ENV === 'development') {
        console.warn('[useInventory] Context not available during hot reload, providing fallback');
        return {
          inventoryVersion: 0,
          getContainer: () => null,
          getEquippedBackpackContainer: () => null,
          getEncumbranceModifiers: () => ({ evade: 0, ap: 0 }),
          canOpenContainer: () => false,
          equipItem: () => ({ success: false }),
          unequipItem: () => ({ success: false }),
          destroyItem: () => false,
          moveItem: () => ({ success: false }),
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
          drinkWater: () => ({ success: false }),
          unrollBedroll: () => ({ success: false }),
          rollupBedroll: () => ({ success: false }),
          attachSelectedItemToWeapon: () => ({ success: false }),
          detachItemFromWeapon: () => null
        };
      }
    throw new Error('useInventory must be used within an InventoryProvider');
  }
  return context;
};

export const InventoryProvider = ({ children }) => {
  const [inventoryVersion, setInventoryVersion] = useState(0);
  const [openContainers, setOpenContainers] = useState(new Set());
  const [selectedItem, setSelectedItem] = useState(null);
  const [dragVersion, setDragVersion] = useState(0); 
  const [selectedRecipeId, setSelectedRecipeId] = useState(CraftingRecipes[0]?.id || null);

  const { addLog } = useLog();
  const { playSound } = useAudio();

  // Atomic Sync: Bind to the engine's pulse for guaranteed re-renders
  const inventoryPulse = useSyncExternalStore(
    (cb) => engine.subscribe(cb),
    () => engine.getSnapshot()
  );
  // Phase 12 Fix: Aggressive Legacy Sync
  useEffect(() => {
    setInventoryVersion(v => v + 1);
  }, [inventoryPulse]);

  // Phase 12 Fix: Ensure ground container is synced on full sync/load
  // AND Bridge manager events to the engine heartbeat
  useEffect(() => {
    const manager = engine.inventoryManager;
    if (!manager) return;

    if (engine.player && engine.gameMap) {
      manager.syncWithMap(
        engine.player.x, engine.player.y,
        engine.player.x, engine.player.y,
        engine.gameMap
      );
    }

    const handleManagerUpdate = () => {
        logger.debug('🔄 Manager event -> Engine Pulse');
        setInventoryVersion(prev => prev + 1);
        engine.notifyUpdate();
    };

    manager.on('inventoryChanged', handleManagerUpdate);
    return () => manager.off('inventoryChanged', handleManagerUpdate);
  }, [inventoryPulse]);

  const getContainer = useCallback((id) => engine.inventoryManager?.getContainer(id), [inventoryPulse, inventoryVersion]);
  const getEquippedBackpackContainer = useCallback(() => engine.inventoryManager?.getBackpackContainer(), [inventoryPulse, inventoryVersion]);
  const getEncumbranceModifiers = useCallback(() => engine.inventoryManager?.getEncumbranceModifiers() || { evade: 0, ap: 0 }, [inventoryPulse, inventoryVersion]);
  const canOpenContainer = useCallback((item) => engine.inventoryManager?.canOpenContainer(item) || false, [inventoryPulse, inventoryVersion]);

  const equipItem = useCallback((item, slot) => {
    if (!engine.inventoryManager || !engine.player || engine.player.ap < 1) {
      return { success: false, reason: 'Not enough AP' };
    }
    const result = engine.inventoryManager.equipItem(item, slot);
    if (result.success) {
      engine.player.useAP(1);
      addLog(`Equipped ${item.name}`, 'item');
      playSound('Equip');
      setInventoryVersion(v => v + 1);
      engine.notifyUpdate();
    }
    return result;
  }, [inventoryPulse, inventoryVersion, addLog]);

  const unequipItem = useCallback((slot) => {
    if (!engine.inventoryManager || !engine.player || engine.player.ap < 1) {
      return { success: false, reason: 'Not enough AP' };
    }
    const result = engine.inventoryManager.unequipItem(slot);
    if (result.success) {
      engine.player.useAP(1);
      addLog(`Unequipped item from ${slot}`, 'item');
      playSound('Equip');
      setInventoryVersion(v => v + 1);
      engine.notifyUpdate();
    }
    return result;
  }, [inventoryPulse, inventoryVersion, addLog]);

  const destroyItem = useCallback((instanceId) => {
    if (!engine.inventoryManager) return false;
    const result = engine.inventoryManager.destroyItem(instanceId);
    if (result) setInventoryVersion(v => v + 1);
    return result;
  }, [inventoryPulse, inventoryVersion]);

  const moveItem = useCallback((itemId, from, to, x, y, rotation = null) => {
    if (!engine.inventoryManager) return { success: false };
    const result = engine.inventoryManager.moveItem(itemId, from, to, x, y, rotation);
    if (result.success) setInventoryVersion(v => v + 1);
    return result;
  }, []);

  const dropItemToGround = useCallback((item, x, y) => {
    if (!engine.inventoryManager) return false;
    const result = engine.inventoryManager.dropItemToGround(item, x, y);
    if (result) setInventoryVersion(v => v + 1);
    return result;
  }, [inventoryPulse, inventoryVersion]);

  const openContainer = useCallback((cid) => {
    setOpenContainers(prev => {
      const next = new Set(prev);
      next.add(typeof cid === 'string' ? cid : cid.id);
      return next;
    });
  }, []);

  const closeContainer = useCallback((cid) => {
    setOpenContainers(prev => {
      const next = new Set(prev);
      next.delete(cid);
      return next;
    });
  }, []);

  const isContainerOpen = useCallback((cid) => openContainers.has(cid), [openContainers]);

  const selectItem = useCallback((item, originId, x, y, extraProps = {}) => {
    // If fifth argument is a boolean, treat it as isEquipment for backward compatibility with older components
    const props = typeof extraProps === 'boolean' ? { isEquipment: extraProps } : extraProps;
    
    setSelectedItem({ 
      item, 
      originContainerId: originId, 
      originX: x, 
      originY: y, 
      rotation: item.rotation || 0, 
      originalRotation: item.rotation || 0,
      ...props 
    });
    playSound('Click');
    setDragVersion(v => v + 1);
    return true;
  }, []);

  const rotateSelected = useCallback(() => {
    setSelectedItem(prev => {
      if (!prev || prev.item.width === prev.item.height) return prev;
      return { ...prev, rotation: (prev.rotation + 90) % 360 };
    });
    setDragVersion(v => v + 1);
  }, []);

  const clearSelected = useCallback(() => {
    if (selectedItem && engine.inventoryManager) {
        const { item, originContainerId, originX, originY, originalRotation } = selectedItem;
        const container = engine.inventoryManager.getContainer(originContainerId);
        if (container) {
            item.rotation = originalRotation;
            container.placeItemAt(item, originX, originY);
            setInventoryVersion(v => v + 1);
        }
    }
    setSelectedItem(null);
    setDragVersion(v => v + 1);
  }, [selectedItem]);

  const placeSelected = useCallback((targetId, x, y) => {
    if (!selectedItem || !engine.inventoryManager) return { success: false };
    const { item, originContainerId, rotation } = selectedItem;
    
    // Phase 22: Detect Equipment Transitions (Equip/Unequip)
    const isEquipping = String(targetId).startsWith('equipment-');
    const isUnequipping = String(originContainerId).startsWith('equipment-');
    const isGearChange = isEquipping || isUnequipping;

    // Check AP for gear changes
    if (isGearChange && (!engine.player || engine.player.ap < 1)) {
        console.warn('[InventoryContext] Not enough AP for gear change');
        return { success: false, reason: 'Not enough AP' };
    }

    // Centralize all placement through moveItem to ensure proper removal from source (including equipment)
    const result = engine.inventoryManager.moveItem(item.instanceId, originContainerId, targetId, x, y, rotation);
    
    if (result.success) {
        // Charge AP for gear changes (drag and drop)
        if (isGearChange && engine.player) {
            engine.player.useAP(1);
        }

        // Determine sound
        let dropSound = 'Click';
        if (isGearChange) dropSound = 'Equip'; // Use Equip sound for both equip and unequip for consistency

        setSelectedItem(null);
        setInventoryVersion(v => v + 1);
        playSound(dropSound);
        engine.notifyUpdate();
        return { success: true };
    }
    
    console.warn('[InventoryContext] placeSelected failed:', result.reason);
    return { success: false, reason: result.reason };
  }, [selectedItem]);

  const consumeItem = useCallback((item) => {
    if (!engine.player || !engine.inventoryManager) return { success: false };
    
    // Apply sickness / spoiled logic
    if (item.isSpoiled) engine.player.inflictSickness(3);
    
    // Apply consumption effects...
    const effects = item.consumptionEffects;
    if (effects) {
        // Simple mock of effect application
        if (effects.hp) engine.player.heal(effects.hp);
        if (effects.nutrition) engine.player.modifyStat('nutrition', effects.nutrition);
        if (effects.hydration) engine.player.modifyStat('hydration', effects.hydration);
    }

    engine.inventoryManager.destroyItem(item.instanceId);
    setInventoryVersion(v => v + 1);
    engine.notifyUpdate();
    return { success: true };
  }, []);

  const drinkWater = useCallback((item, amount) => {
    if (!engine.player || !engine.inventoryManager) return { success: false };
    const player = engine.player;

    const currentAmmo = item.ammoCount || 0;
    if (currentAmmo <= 0) {
      addLog(`${item.name} is empty.`, 'error');
      playSound('EmptyClick');
      return { success: false };
    }

    // Determine how much to drink
    const hydrationPerUnit = 1; // Based on ItemDefs.js consumptionEffects
    let unitsToDrink = 0;

    if (amount === 'max') {
      const hydrationNeeded = player.maxHydration - player.hydration;
      unitsToDrink = Math.min(currentAmmo, Math.ceil(hydrationNeeded / hydrationPerUnit));
      if (unitsToDrink <= 0 && currentAmmo > 0) unitsToDrink = 1;
    } else {
      unitsToDrink = Math.min(currentAmmo, Number(amount));
    }

    if (unitsToDrink <= 0) return { success: false };

    // Apply Hydration
    player.modifyStat('hydration', unitsToDrink * hydrationPerUnit);
    item.ammoCount -= unitsToDrink;

    // Handle sickness for dirty water
    if (item.waterQuality === 'dirty') {
      player.inflictSickness(unitsToDrink);
      addLog(`The water was dirty. You feel sick.`, 'warning');
    }

    addLog(`You drink ${unitsToDrink} units of water from ${item.name}.`, 'item');
    playSound('Consume');

    setInventoryVersion(v => v + 1);
    engine.notifyUpdate();
    return { success: true };
  }, [addLog, playSound]);

  const unrollBedroll = useCallback((item) => {
    if (!engine.inventoryManager) return { success: false };
    
    console.log(`[InventoryContext] Unrolling bedroll: ${item.name}`);
    
    // 1. Create open bedroll
    const openBedroll = createItemFromDef('bedroll.open');
    if (!openBedroll) return { success: false };

    // 2. Remove closed one
    engine.inventoryManager.destroyItem(item.instanceId);

    // 3. Add open one to ground
    engine.inventoryManager.dropItemToGround(new Item(openBedroll));

    addLog(`You unroll the bedroll onto the ground.`, 'item');
    playSound('Equip');
    
    setInventoryVersion(v => v + 1);
    engine.notifyUpdate();
    return { success: true };
  }, [addLog, playSound]);

  const rollupBedroll = useCallback((item) => {
    if (!engine.inventoryManager) return { success: false };

    console.log(`[InventoryContext] Rolling up bedroll: ${item.name}`);

    // 1. Create closed bedroll
    const closedBedroll = createItemFromDef('bedroll.closed');
    if (!closedBedroll) return { success: false };

    // 2. Remove open one
    engine.inventoryManager.destroyItem(item.instanceId);

    // 3. Add closed one to inventory (or ground if full)
    const result = engine.inventoryManager.addItem(new Item(closedBedroll));
    
    addLog(`You roll up the bedroll.`, 'item');
    playSound('Equip');

    setInventoryVersion(v => v + 1);
    engine.notifyUpdate();
    return { success: true };
  }, [addLog, playSound]);

  const craftItem = useCallback((recipeId) => {
    if (!engine.inventoryManager || !engine.player) return { success: false };
    const result = engine.inventoryManager.craftingManager.craft(recipeId);
    if (result.success) {
      if (result.item && !result.placedInGround) {
        // Normal items: add to inventory or drop to ground
        engine.inventoryManager.addItem(result.item);
      }
      
      setInventoryVersion(v => v + 1);
      engine.notifyUpdate();
      addLog(`Crafted ${result.item?.name || 'item'}`, 'item');
    }
    return result;
  }, [addLog]);

  const clearCraftingArea = useCallback(() => engine.inventoryManager?.clearCraftingArea(), []);

  const getPlacementPreview = useCallback((containerId, x, y) => {
    if (!selectedItem || !engine.inventoryManager) return null;
    const container = engine.inventoryManager.getContainer(containerId);
    if (!container) return null;

    const { item, rotation } = selectedItem;
    const result = container.validatePlacement(item, x, y, rotation);
    const isRotated = rotation === 90 || rotation === 270;

    return {
      gridX: x,
      gridY: y,
      width: isRotated ? item.height : item.width,
      height: isRotated ? item.width : item.height,
      valid: result.valid,
      reason: result.reason,
      stackTarget: result.stackTarget,
      combineTarget: result.combineTarget
    };
  }, [selectedItem, inventoryPulse]);

  const equipSelectedItem = useCallback((slotId = null) => {
    if (!selectedItem || !engine.inventoryManager || !engine.player) return { success: false };
    
    // Check AP for gear change
    if (engine.player.ap < 1) {
        return { success: false, reason: 'Not enough AP' };
    }

    const item = selectedItem.item;
    const result = engine.inventoryManager.equipItem(item, slotId);
    
    if (result.success) {
      engine.player.useAP(1);
      setSelectedItem(null);
      playSound('Equip');
      setInventoryVersion(v => v + 1);
      engine.notifyUpdate();
    }
    return result;
  }, [selectedItem, inventoryPulse]);

  const splitStack = useCallback((item, count) => {
    if (!item || !engine.inventoryManager) return { success: false };
    const newItem = item.splitStack(count);
    if (newItem) {
      engine.inventoryManager.addItem(newItem);
      setInventoryVersion(v => v + 1);
      return { success: true };
    }
    return { success: false };
  }, [inventoryPulse]);

  const depositSelectedInto = useCallback((targetContainerItem) => {
    if (!selectedItem || !engine.inventoryManager || !targetContainerItem) return { success: false };
    const container = engine.inventoryManager.getContainer(targetContainerItem.containerGrid?.id || `${targetContainerItem.instanceId}-container`);
    if (container && container.addItem(selectedItem.item)) {
       setSelectedItem(null);
       setInventoryVersion(v => v + 1);
       playSound('Click');
       return { success: true };
    }
    return { success: false };
  }, [selectedItem, playSound, inventoryPulse]);

  const attachSelectedInto = useCallback((weapon) => {
    if (!selectedItem || !engine.inventoryManager || !weapon) return { success: false };
    const item = selectedItem.item;
    const slotId = weapon.attachmentSlots?.find(slot => {
       if (weapon.attachments[slot.id]) return false;
       return slot.allowedCategories?.some(cat => item.categories?.includes(cat));
    })?.id;

    if (slotId) {
       const result = engine.inventoryManager.attachItemToWeapon(weapon, slotId, item, selectedItem.originContainerId);
       if (result.success) {
           setSelectedItem(null);
           setInventoryVersion(v => v + 1);
           return { success: true };
       }
    }
    return { success: false };
  }, [selectedItem, inventoryPulse]);

  const loadAmmoInto = useCallback((magazine) => {
    if (!selectedItem || !engine.inventoryManager || !magazine) return { success: false };
    const result = magazine.loadAmmo(selectedItem.item);
    if (result.success) {
      if (result.isStackEmpty) setSelectedItem(null);
      setInventoryVersion(v => v + 1);
      playSound('ReloadShot');
      return { success: true };
    }
    return result;
  }, [selectedItem, playSound, inventoryPulse]);

  const loadAmmoDirectly = useCallback((weapon) => {
    if (!selectedItem || !engine.inventoryManager || !weapon) return { success: false };
    const slotId = weapon.attachmentSlots?.find(s => s.id === 'ammo')?.id;
    if (slotId) {
      const result = engine.inventoryManager.attachItemToWeapon(weapon, slotId, selectedItem.item, selectedItem.originContainerId);
      if (result.success) {
        setSelectedItem(null);
        setInventoryVersion(v => v + 1);
        return { success: true };
      }
    }
    return { success: false };
  }, [selectedItem, inventoryPulse]);

  const fuelCampfire = useCallback((fuelItem, campfire) => {
    if (!engine.inventoryManager || !fuelItem || !campfire) return { success: false };
    const result = engine.inventoryManager.fuelCampfire(fuelItem, campfire);
    if (result.success) {
       if (result.itemDestroyed) setSelectedItem(null);
       setInventoryVersion(v => v + 1);
       playSound('FireIgnite');
       return { success: true };
    }
    return result;
  }, [playSound, inventoryPulse]);

  const detachItemFromWeapon = useCallback((weapon, slotId) => {
    if (!engine.inventoryManager || !weapon) return null;
    const item = engine.inventoryManager.detachItemFromWeapon(weapon, slotId);
    if (item) {
      engine.inventoryManager.addItem(item);
      setInventoryVersion(v => v + 1);
    }
    return item;
  }, [inventoryPulse]);

  const contextValue = useMemo(() => ({
    inventoryVersion,
    inventoryManager: engine.inventoryManager,
    inventoryPulse,
    getContainer,
    getEquippedBackpackContainer,
    getEncumbranceModifiers,
    canOpenContainer,
    equipItem,
    unequipItem,
    destroyItem,
    moveItem,
    dropItemToGround,
    openContainers,
    openContainer,
    closeContainer,
    isContainerOpen,
    selectedItem,
    selectItem,
    rotateSelected,
    clearSelected,
    placeSelected,
    craftItem,
    consumeItem,
    drinkWater,
    unrollBedroll,
    rollupBedroll,
    selectedRecipeId,
    setSelectedRecipeId,
    craftingRecipes: CraftingRecipes,
    clearCraftingArea,
    getPlacementPreview,
    equipSelectedItem,
    splitStack,
    depositSelectedInto,
    attachSelectedInto,
    loadAmmoInto,
    loadAmmoDirectly,
    fuelCampfire,
    detachItemFromWeapon,
    // Add legacy fields to prevent crashes
    inventoryRef: { current: engine.inventoryManager },
    forceRefresh: () => setInventoryVersion(v => v + 1)
  }), [inventoryVersion, dragVersion, openContainers, selectedItem, selectedRecipeId, inventoryPulse]);

  return (
    <InventoryContext.Provider value={contextValue}>
      {children}
    </InventoryContext.Provider>
  );
};