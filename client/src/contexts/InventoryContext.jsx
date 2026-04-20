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
          unloadWeapon: () => ({ success: false }),
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

    // Initial sync / Re-sync on engine pulse
    if (engine.player && engine.gameMap) {
      manager.syncWithMap(
        engine.player.x, engine.player.y,
        engine.player.x, engine.player.y,
        engine.gameMap
      );
    }

    const handleManagerUpdate = () => {
        logger.debug('🔄 Manager event -> Engine Pulse');
        // We only increment version here. notified by engine.notifyUpdate later if needed
        setInventoryVersion(prev => prev + 1);
    };

    manager.on('inventoryChanged', handleManagerUpdate);
    return () => manager.off('inventoryChanged', handleManagerUpdate);
  }, [inventoryPulse]); // Still depend on pulse to catch loads/transitions, but syncWithMap is now guarded.

  // Phase 18 Fix: Auto-close all floating containers when player moves
  useEffect(() => {
    const handlePlayerMove = () => {
        if (openContainers.size > 0) {
            logger.debug('Player moving - auto-closing all floating containers');
            setOpenContainers(new Set());
        }
    };

    GameEvents.on(GAME_EVENT.PLAYER_MOVE, handlePlayerMove);
    return () => GameEvents.off(GAME_EVENT.PLAYER_MOVE, handlePlayerMove);
  }, [openContainers.size]);

  const getContainer = useCallback((id) => engine.inventoryManager?.getContainer(id), [inventoryPulse, inventoryVersion]);
  const getEquippedBackpackContainer = useCallback(() => engine.inventoryManager?.getBackpackContainer(), [inventoryPulse, inventoryVersion]);
  const canOpenContainer = useCallback((item) => engine.inventoryManager?.canOpenContainer(item) || false, [inventoryPulse, inventoryVersion]);

  const equipItem = useCallback((item, slot) => {
    if (!engine.inventoryManager || !engine.player || engine.player.ap < 1) {
      return { success: false, reason: 'Not enough AP' };
    }
    const result = engine.inventoryManager.equipItem(item, slot);
    if (result.success) {
      engine.player.useAP(1);
      closeAssociatedContainers(item);
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
  
  // Helper: Close any UI panels associated with a specific item instance
  const closeAssociatedContainers = useCallback((item) => {
    if (!item) return;
    const instanceId = item.instanceId || item.id;
    
    // 1. Collect all IDs that SHOULD be closed for this specific item
    const idsToClose = new Set();
    
    // Main container
    idsToClose.add(`${instanceId}-container`);
    
    // Pockets (Robust lookup)
    if (item.getPocketContainers) {
        item.getPocketContainers().forEach(pocket => {
            idsToClose.add(pocket.id);
        });
    }

    // Virtual panel IDs
    idsToClose.add(`clothing:${instanceId}`);
    idsToClose.add(`weapon:${instanceId}`);
    
    // 2. Close them
    idsToClose.forEach(cid => {
        if (openContainers.has(cid)) {
            console.debug(`[InventoryContext] Auto-closing associated container: ${cid}`);
            closeContainer(cid);
        }
    });
  }, [openContainers, closeContainer]);

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
      return { ...prev, rotation: (prev.rotation === 0 ? 90 : 0) };
    });
    setDragVersion(v => v + 1);
  }, []);

  const clearSelected = useCallback(() => {
    if (selectedItem && engine.inventoryManager) {
        const { item, originContainerId, originX, originY, originalRotation } = selectedItem;
        // ONLY put it back if it still exists (stackCount > 0)
        // This prevents consumed/spent items from "resurrecting" in the inventory
        if (item.stackCount > 0) {
            const container = engine.inventoryManager.getContainer(originContainerId);
            if (container) {
                item.rotation = originalRotation;
                container.placeItemAt(item, originX, originY);
                setInventoryVersion(v => v + 1);
            }
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
        if (isEquipping) closeAssociatedContainers(item);
        playSound(dropSound);
        engine.notifyUpdate();
        return { success: true };
    }
    
    console.warn('[InventoryContext] placeSelected failed:', result.reason);
    return { success: false, reason: result.reason };
  }, [selectedItem]);

  /**
   * Internal helper to apply item consumption effects to the player.
   * Handles legacy object-style effects, new array-style effects, 
   * and random ranges {min, max}.
   */
  const applyConsumptionEffects = useCallback((player, item) => {
    if (!item || !item.consumptionEffects) return;
    const effects = item.consumptionEffects;

    // Apply sickness / spoiled logic
    if (item.isSpoiled) {
      player.inflictSickness(3);
    }

    // Helper to process a single effect data object
    const processEffect = (effect) => {
      // Handle value ranges { min, max }
      let val = effect.value;
      if (val && typeof val === 'object' && val.min !== undefined && val.max !== undefined) {
          val = Math.floor(Math.random() * (val.max - val.min + 1)) + val.min;
      }

      switch (effect.type) {
        case 'heal':
          player.heal(val);
          break;
        case 'modifyStat':
        case 'nutrition':
        case 'hydration':
          const stat = effect.stat || effect.type; // Allow type as stat name for common stats
          player.modifyStat(stat, val);
          break;
        case 'stop_bleeding':
          player.setBleeding(false);
          break;
        case 'cure':
          player.cure();
          break;
        case 'sickness':
          player.inflictSickness(val);
          break;
        default:
          console.warn(`[InventoryContext] Unknown effect type: ${effect.type}`, effect);
      }
    };

    // 1. Process Legacy Object-style effects (e.g. { nutrition: 5 })
    if (!Array.isArray(effects)) {
        Object.entries(effects).forEach(([key, value]) => {
           if (key === 'hp' || key === 'heal') player.heal(value);
           else if (key === 'sickness') player.inflictSickness(value);
           else if (key === 'cure' && value === true) player.cure();
           else if (key === 'condition') {
               player.condition = value;
               player.notifyChange();
           } else if (['nutrition', 'hydration'].includes(key)) {
               player.modifyStat(key, value);
           } else {
               // Fallback for any other numeric stats
               if (typeof value === 'number') player.modifyStat(key, value);
           }
        });
        return;
    }

    // 2. Process Modern Array-style effects (e.g. for medical items)
    effects.forEach(processEffect);
  }, []);

  const consumeItem = useCallback((item) => {
    if (!engine.player || !engine.inventoryManager) return { success: false };
    
    // 1. Apply Effects
    applyConsumptionEffects(engine.player, item);
    
    // 2. Handle Stacking (Phase 12 Stack Fix)
    if (item.isStackable() && item.stackCount > 1) {
        item.stackCount -= 1;
        console.log(`[InventoryContext] Consumed 1 ${item.name}. Remaining stack: ${item.stackCount}`);
        
        // Notify changes locally and globally
        setInventoryVersion(v => v + 1);
        engine.notifyUpdate();
    } else {
        // Not a stack, or last item in stack
        engine.inventoryManager.destroyItem(item.instanceId);
        setInventoryVersion(v => v + 1);
        engine.notifyUpdate();
    }

    playSound('Eat');
    return { success: true };
  }, [applyConsumptionEffects, playSound]);

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
    
    // BUG FIX: Handle stacked containers correctly by splitting one off
    let itemToDrinkFrom = item;
    const isStacked = item.stackCount > 1;

    if (isStacked) {
      // 1. Decrease original stack
      item.stackCount -= 1;
      
      // 2. Create single instance for the one being drunk from
      itemToDrinkFrom = Item.fromJSON(item.toJSON());
      itemToDrinkFrom.instanceId = `${item.instanceId}-drunk-${Date.now()}`;
      itemToDrinkFrom.stackCount = 1;
    }

    // 3. Subtract from the item
    itemToDrinkFrom.ammoCount -= unitsToDrink;

    // 4. Update the item and handle inventory re-entry if it was split from a stack
    if (isStacked) {
      // If it was split from a stack, we need to add this new instance back to inventory.
      // Pass allowStacking=true so it can merge with other identical bottles if now empty/full.
      engine.inventoryManager.addItem(itemToDrinkFrom, null, null, null, true);
    }
    // If it wasn't stacked, the original item instance in its container was modified directly.

    // Handle sickness for dirty water
    if (itemToDrinkFrom.waterQuality === 'dirty') {
      player.inflictSickness(unitsToDrink);
      addLog(`The water was dirty. You feel sick.`, 'warning');
    }

    addLog(`You drink ${unitsToDrink} units of water from ${item.name}.`, 'item');
    playSound('Drink');

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

  const disassembleItem = useCallback((item) => {
    if (!engine.inventoryManager || !engine.player) return { success: false };
    
    const def = ItemDefs[item.defId];
    if (!def || !def.disassembleData) return { success: false };

    const apCost = def.disassembleData.apCost || 10;
    if (engine.player.ap < apCost) {
      addLog("Not enough AP to disassemble this.", 'error');
      playSound('Fail');
      return { success: false, reason: 'Not enough AP' };
    }

    const success = engine.inventoryManager.disassembleItem(item);
    if (success) {
      engine.player.useAP(apCost);
      addLog(`You disassembled the ${item.name}.`, 'item');
      playSound('Craft'); // Using Craft sound for disassembly success
      setInventoryVersion(v => v + 1);
      engine.notifyUpdate();
      return { success: true };
    } else {
      addLog(`You need the required tool in the same container to disassemble this.`, 'error');
      playSound('Fail');
      return { success: false, reason: 'Missing tool' };
    }
  }, [addLog, playSound]);

  const craftItem = useCallback((recipeId) => {
    if (!engine.inventoryManager || !engine.player) return { success: false };
    
    const player = engine.player;
    const craftingLevel = player.craftingLvl || 0;
    
    // Perform the craft through the manager
    const result = engine.inventoryManager.craftingManager.craft(recipeId, craftingLevel, player.ap);
    
    if (result.success) {
      if (result.item && !result.placedInGround) {
        // Normal items: add to inventory or drop to ground (Auto-merge crafted items)
        engine.inventoryManager.addItem(result.item, null, null, null, true);
      }
      
      // DEDUCT AP AND REWARD EXP
      const apUsed = result.apCost || 0;
      if (apUsed > 0) {
        player.useAP(apUsed);
        player.onItemCrafted(apUsed);
      }
      
      setInventoryVersion(v => v + 1);
      engine.notifyUpdate();
      addLog(`Crafted ${result.item?.name || 'item'}`, 'item');
      playSound('Craft');
    }
    return result;
  }, [addLog, playSound]);

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
      closeAssociatedContainers(item);
      setSelectedItem(null);
      playSound('Equip');
      setInventoryVersion(v => v + 1);
      engine.notifyUpdate();
    }
    return result;
  }, [selectedItem, inventoryPulse]);

   const splitStack = useCallback((item, count) => {
    if (!item || !engine.inventoryManager) return { success: false };
    
    try {
      const newItem = item.splitStack(count);
      if (newItem) {
        const result = engine.inventoryManager.addItem(newItem);
        if (result.success) {
          // Atomically reduce the original stack ONLY if the new one was successfully placed
          item.stackCount -= count;
          setInventoryVersion(v => v + 1);
          engine.notifyUpdate();
          return { success: true };
        } else {
          addLog('Not enough space to split stack!', 'error');
        }
      }
    } catch (err) {
      console.error('[InventoryContext] splitStack error:', err);
      addLog('Failed to split stack due to an error.', 'error');
    }
    return { success: false };
  }, [inventoryPulse, addLog]);

  const deploySnare = useCallback((item) => {
    if (!engine.player || !engine.inventoryManager) return { success: false };
    
    // Check AP (1 AP)
    if (engine.player.ap < 1) {
      playSound('Fail');
      addLog('Not enough AP to set snare.', 'error');
      return { success: false, reason: 'Not enough AP' };
    }

    console.log(`[InventoryContext] Deploying snare: ${item.name}`);
    
    // 1. Create deployed snare
    const deployedData = createItemFromDef('tool.snare_deployed');
    if (!deployedData) return { success: false };
    
    const deployedSnare = new Item(deployedData);
    // Preserve condition
    deployedSnare.condition = item.condition;

    // 2. Remove undeployed one
    engine.inventoryManager.destroyItem(item.instanceId);

    // 3. Add deployed one to ground
    engine.inventoryManager.groundManager.addItemSmart(deployedSnare);

    // 4. Deduct AP
    engine.player.useAP(1);

    addLog(`You set the rabbit snare on the ground.`, 'item');
    playSound('Equip');
    
    setInventoryVersion(v => v + 1);
    engine.notifyUpdate();
    return { success: true };
  }, [addLog, playSound]);

  const retrieveSnare = useCallback((item) => {
    if (!engine.player || !engine.inventoryManager) return { success: false };

    // Check AP (1 AP)
    if (engine.player.ap < 1) {
      playSound('Fail');
      addLog('Not enough AP to retrieve snare.', 'error');
      return { success: false, reason: 'Not enough AP' };
    }

    console.log(`[InventoryContext] Retrieving snare: ${item.name}`);

    // 1. Create undeployed snare
    const undeployedData = createItemFromDef('tool.snare_undeployed');
    if (!undeployedData) return { success: false };

    const undeployedSnare = new Item(undeployedData);
    // Preserve condition
    undeployedSnare.condition = item.condition;

    // 2. Remove deployed one
    engine.inventoryManager.destroyItem(item.instanceId);

    // 3. Add undeployed one to inventory (or ground if full)
    const result = engine.inventoryManager.addItem(undeployedSnare);
    
    // 4. Deduct AP
    engine.player.useAP(1);

    addLog(`You retrieve the rabbit snare.`, 'item');
    playSound('Equip');

    setInventoryVersion(v => v + 1);
    engine.notifyUpdate();
    return { success: true };
  }, [addLog, playSound]);

  const depositSelectedInto = useCallback((targetContainerItem) => {
    if (!selectedItem || !engine.inventoryManager || !targetContainerItem) return { success: false };
    
    const { item, originContainerId } = selectedItem;
    const targetId = targetContainerItem.containerGrid?.id || `${targetContainerItem.instanceId}-container`;
    const container = engine.inventoryManager.getContainer(targetId);

    // 1. Recursion Check (Prevent putting container into itself)
    if (container && engine.inventoryManager.checkRecursion(item, container)) {
        addLog(`Cannot put ${item.name} inside itself!`, 'error');
        return { success: false };
    }

    // 2. Add Item to Target (Enable allowStacking: true for special containers)
    // Only allow implicit storage if the target container is accessible (e.g. on ground)
    if (engine.inventoryManager.isContainerAccessible(targetContainerItem)) {
        // Case A: Standard container grid (Backpacks, toolboxes, etc.)
        if (container && container.addItem(item, null, null, true)) {
            // 3. CRITICAL: Remove item from original source container to prevent duplication
            const originContainer = engine.inventoryManager.getContainer(originContainerId);
            if (originContainer) {
                console.debug(`[InventoryContext] Removing ${item.name} from origin ${originContainerId}`);
                originContainer.removeItem(item.instanceId);
            }

            setSelectedItem(null);
            setInventoryVersion(v => v + 1);
            playSound('Click');
            return { success: true };
        }

        // Case B: Multi-pocket items (Clothing)
        const pocketContainers = targetContainerItem.getPocketContainers?.();
        if (pocketContainers && pocketContainers.length > 0) {
            for (const pocket of pocketContainers) {
                if (pocket.addItem(item, null, null, true)) {
                    // Remove from origin
                    const originContainer = engine.inventoryManager.getContainer(originContainerId);
                    if (originContainer) {
                        originContainer.removeItem(item.instanceId);
                    }

                    setSelectedItem(null);
                    setInventoryVersion(v => v + 1);
                    playSound('Click');
                    addLog(`Stored ${item.name} in ${targetContainerItem.name}.`, 'item');
                    return { success: true };
                }
            }
        }
    }

    addLog(`No space in ${targetContainerItem.name}!`, 'error');
    return { success: false };
  }, [selectedItem, playSound, addLog]);

  const attachSelectedInto = useCallback((weapon) => {
    if (!selectedItem || !engine.inventoryManager || !weapon) return { success: false };
    const item = selectedItem.item;
    const slotId = weapon.attachmentSlots?.find(slot => {
       // REFINEMENT: Allow targeting occupied slots to trigger swapping/displacement
       return slot.allowedCategories?.some(cat => item.categories?.includes(cat));
    })?.id;

    if (slotId) {
       // Phase: AP Check for Loading (Ammo/Magazine into Gun)
       const isLoading = slotId === 'ammo';
       if (isLoading && (!engine.player || engine.player.ap < 1)) {
           playSound('Fail');
           addLog('Not enough AP to load weapon.', 'error');
           return { success: false, reason: 'Not enough AP' };
       }

       const result = engine.inventoryManager.attachItemToWeapon(weapon, slotId, item, selectedItem.originContainerId);
       if (result.success) {
           if (isLoading && engine.player) engine.player.useAP(1);
           setSelectedItem(null);
           setInventoryVersion(v => v + 1);
           return { success: true };
       }
    }
    return { success: false };
  }, [selectedItem, inventoryPulse]);

  const attachSelectedItemToWeapon = useCallback((weapon, slotId) => {
    if (!selectedItem || !engine.inventoryManager || !weapon || !slotId) return { success: false };
    
    // Phase: AP Check for Loading (Ammo/Magazine into Gun)
    const isLoading = slotId === 'ammo';
    if (isLoading && (!engine.player || engine.player.ap < 1)) {
        playSound('Fail');
        addLog('Not enough AP to load weapon.', 'error');
        return { success: false, reason: 'Not enough AP' };
    }

    const result = engine.inventoryManager.attachItemToWeapon(
      weapon, 
      slotId, 
      selectedItem.item, 
      selectedItem.originContainerId
    );
    
    if (result.success) {
        if (isLoading && engine.player) engine.player.useAP(1);
        setSelectedItem(null);
        setInventoryVersion(v => v + 1);
        return { success: true };
    }
    return result;
  }, [selectedItem, inventoryPulse]);

  const loadAmmoInto = useCallback((magazine) => {
    if (!selectedItem || !engine.inventoryManager || !magazine) return { success: false };
    const result = magazine.loadAmmo(selectedItem.item);
    if (result.success) {
      if (result.isStackEmpty) {
        // Remove empty stack from world
        engine.inventoryManager.destroyItem(selectedItem.item.instanceId);
        setSelectedItem(null);
      }
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
      // Phase: AP Check for Loading (Ammo into Gun)
      if (!engine.player || engine.player.ap < 1) {
          playSound('Fail');
          addLog('Not enough AP to load weapon.', 'error');
          return { success: false, reason: 'Not enough AP' };
      }

      const result = engine.inventoryManager.attachItemToWeapon(weapon, slotId, selectedItem.item, selectedItem.originContainerId);
      if (result.success) {
        if (engine.player) engine.player.useAP(1);
        setSelectedItem(null);
        setInventoryVersion(v => v + 1);
        return { success: true };
      }
    }
    return { success: false };
  }, [selectedItem, inventoryPulse]);

  const unloadWeapon = useCallback((weapon) => {
    if (!engine.inventoryManager || !engine.player || !weapon) return { success: false };
    
    // Check AP (1 AP)
    if (engine.player.ap < 1) {
      playSound('Fail');
      addLog('Not enough AP to unload weapon.', 'error');
      return { success: false, reason: 'Not enough AP' };
    }

    const result = engine.inventoryManager.unloadWeapon(weapon);
      if (result.success) {
        engine.player.useAP(1);
        addLog(`Unloaded ${result.item.name} from ${weapon.name}.`, 'item');
        playSound('ReloadShot');
        setInventoryVersion(v => v + 1);
      engine.notifyUpdate();
    }
    return result;
  }, [playSound, addLog]);

  const unloadMagazine = useCallback((magazine) => {
    if (!engine.inventoryManager || !magazine) return { success: false };

    const result = engine.inventoryManager.unloadMagazine(magazine);
    if (result.success) {
      // No AP cost for magazine-only interactions
      addLog(`Unloaded ${result.item.stackCount} rounds of ${result.item.name}.`, 'item');
      playSound('ReloadShot');
      setInventoryVersion(v => v + 1);
      engine.notifyUpdate();
    }
    return result;
  }, [playSound, addLog]);

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
    if (!engine.inventoryManager) return null;
    const detached = engine.inventoryManager.detachItemFromWeapon(weapon, slotId);
    if (detached) setInventoryVersion(v => v + 1);
    return detached;
  }, [inventoryPulse]);

  // Phase 25: Drag Mechanic
  const startDrag = useCallback((item) => {
    if (!engine.player || !engine.gameMap || !item) return { success: false };

    // Find the item's current position on the map
    let itemPos = null;
    const width = engine.gameMap.width;
    const height = engine.gameMap.height;

    // Check if it's in the ground container (synced to current tile)
    const inGround = engine.inventoryManager.groundContainer.items.has(item.instanceId);
    if (inGround) {
      itemPos = { 
        x: engine.inventoryManager.lastSyncedX, 
        y: engine.inventoryManager.lastSyncedY 
      };
    }

    if (!itemPos) {
      return { success: false, reason: 'Item not found on ground.' };
    }

    // Check distance (must be adjacent or on tile)
    const dist = Math.sqrt((itemPos.x - engine.player.x) ** 2 + (itemPos.y - engine.player.y) ** 2);
    if (dist > 1.5) {
      return { success: false, reason: 'Item is too far away to drag.' };
    }

    engine.dragging = {
      item,
      tileX: itemPos.x,
      tileY: itemPos.y
    };
    
    // Phase 25: Signal to inventory manager to carry this item
    if (engine.inventoryManager) {
      engine.inventoryManager.draggedItem = item;
    }

    addLog(`You start dragging the ${item.name}.`, 'item');
    setInventoryVersion(v => v + 1);
    engine.notifyUpdate();
    return { success: true };
  }, [addLog, inventoryPulse]);

  const stopDrag = useCallback(() => {
    if (engine.dragging) {
      addLog(`You set down the ${engine.dragging.item.name}.`, 'item');
      
      // Phase 25: Stop carrying in inventory manager
      if (engine.inventoryManager) {
        engine.inventoryManager.draggedItem = null;
      }

      engine.dragging = null;
      setInventoryVersion(v => v + 1);
      engine.notifyUpdate();
    }
  }, [addLog, inventoryPulse]);

  const contextValue = useMemo(() => ({
    inventoryVersion,
    inventoryManager: engine.inventoryManager,
    inventoryPulse,
    getContainer,
    getEquippedBackpackContainer,
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
    disassembleItem,
    selectedRecipeId,
    setSelectedRecipeId,
    craftingRecipes: CraftingRecipes,
    clearCraftingArea,
    getPlacementPreview,
    equipSelectedItem,
    splitStack,
    depositSelectedInto,
    attachSelectedInto,
    attachSelectedItemToWeapon,
    loadAmmoInto,
    loadAmmoDirectly,
    unloadWeapon,
    unloadMagazine,
    deploySnare,
    retrieveSnare,
    fuelCampfire,
    detachItemFromWeapon,
    startDrag,
    stopDrag,
    // Add legacy fields to prevent crashes
    inventoryRef: { current: engine.inventoryManager },
    forceRefresh: () => setInventoryVersion(v => v + 1)
  }), [inventoryVersion, dragVersion, openContainers, selectedItem, selectedRecipeId, inventoryPulse, startDrag, stopDrag]);

  return (
    <InventoryContext.Provider value={contextValue}>
      {children}
    </InventoryContext.Provider>
  );
};