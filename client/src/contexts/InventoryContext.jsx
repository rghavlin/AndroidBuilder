import React, { createContext, useContext, useState, useCallback, useMemo, useEffect, useSyncExternalStore, useRef } from 'react';
import { ItemTrait, FireMode, ItemCategory } from '../game/inventory/traits.js';
import { ItemDefs, createItemFromDef } from '../game/inventory/ItemDefs.js';
import { Item } from '../game/inventory/Item.js';
import { CraftingRecipes } from '../game/inventory/CraftingRecipes.js';
import { useLog } from './LogContext.jsx';
import { useAudio } from './AudioContext.jsx';
import Logger from '../game/utils/Logger.js';
import engine from '../game/GameEngine.js';
import GameEvents, { GAME_EVENT } from '../game/utils/GameEvents.js';
import { TurnProcessingUtils } from '../game/utils/TurnProcessingUtils.js';

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
  const [openContainers, setOpenContainers] = useState(new Set());
  const openContainersRef = useRef(openContainers);
  
  useEffect(() => {
    openContainersRef.current = openContainers;
  }, [openContainers]);

  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedRecipeId, setSelectedRecipeId] = useState(CraftingRecipes[0]?.id || null);

  const { addLog } = useLog();
  const { playSound } = useAudio();

  // Atomic Sync: Bind to the engine's pulse for guaranteed re-renders
  const inventoryPulse = useSyncExternalStore(
    (cb) => engine.subscribe(cb),
    () => engine.getSnapshot()
  );
  // Phase 12 Fix: Ensure ground container is synced on full sync/load
  // AND Bridge manager events to the engine heartbeat
  // Phase 12 Fix: Ensure ground container is synced on full sync/load
  useEffect(() => {
    const manager = engine.inventoryManager;
    if (!manager) return;

    if (engine.player && engine.gameMap) {
      manager.syncWithMap(
        engine.player.logicalX, engine.player.logicalY,
        engine.player.logicalX, engine.player.logicalY,
        engine.gameMap
      );
    }
  }, [inventoryPulse]);

  // Phase 28 Fix: Bridge manager events to the engine heartbeat and prevent re-subscription loops.
  // We listen to the engine's 'sync' event to ensure that if the inventoryManager instance is replaced
  // (e.g. during map initialization or save loading), we re-register our listener on the new instance.
  useEffect(() => {
    let currentManager = engine.inventoryManager;

    const handleManagerUpdate = () => {
        logger.debug('🔄 Manager event -> Engine Pulse');
        engine.notifyUpdate();
    };

    const registerOnManager = (manager) => {
      if (currentManager) {
        currentManager.off('inventoryChanged', handleManagerUpdate);
      }
      currentManager = manager;
      if (currentManager) {
        currentManager.on('inventoryChanged', handleManagerUpdate);
        logger.debug('Registered inventoryChanged listener on manager');
      }
    };

    // Register on the current manager immediately
    registerOnManager(engine.inventoryManager);

    // Listen to sync event to re-register on new manager
    const handleSync = (updatedEngine) => {
      logger.debug('Engine sync event -> re-registering inventoryChanged listener');
      registerOnManager(updatedEngine.inventoryManager);
    };

    engine.on('sync', handleSync);

    return () => {
      engine.off('sync', handleSync);
      if (currentManager) {
        currentManager.off('inventoryChanged', handleManagerUpdate);
      }
    };
  }, []);

  // Phase 18 Fix: Auto-close all floating containers when player moves
  useEffect(() => {
    const handlePlayerMove = () => {
        if (openContainersRef.current.size > 0) {
            logger.debug('Player moving - auto-closing all floating containers');
            setOpenContainers(new Set());
        }
    };

    GameEvents.on(GAME_EVENT.PLAYER_MOVE, handlePlayerMove);
    return () => GameEvents.off(GAME_EVENT.PLAYER_MOVE, handlePlayerMove);
  }, []);

  const getContainer = useCallback((id) => engine.inventoryManager?.getContainer(id), [inventoryPulse]);
  const getEquippedBackpackContainer = useCallback(() => engine.inventoryManager?.getBackpackContainer(), [inventoryPulse]);
  const canOpenContainer = useCallback((item) => engine.inventoryManager?.canOpenContainer(item) || false, [inventoryPulse]);
  
  const checkPlayerTurn = useCallback((silent = false) => {
    if (engine.isAutosaving) {
      if (!silent) {
        console.warn(`[InventoryContext] Interaction blocked - Autosaving`);
      }
      return { success: false, reason: 'Game is autosaving' };
    }
    if (engine.turnPhase !== 'PLAYER_TURN') {
      if (!silent) {
        console.warn(`[InventoryContext] Interaction blocked - Phase: ${engine.turnPhase}`);
      }
      return { success: false, reason: `Not your turn (${engine.turnPhase})` };
    }
    return { success: true };
  }, []);

  const equipItem = useCallback((item, slot) => {
    const turnCheck = checkPlayerTurn();
    if (!turnCheck.success) return turnCheck;
    if (!engine.inventoryManager || !engine.player || engine.player.ap < 1) {
      return { success: false, reason: 'Not enough AP' };
    }
    const result = engine.inventoryManager.equipItem(item, slot);
    if (result.success) {
      engine.player.useAP(1);
      closeAssociatedContainers(item);
      addLog(`Equipped ${item.name}`, 'item');
      playSound('Equip');
      engine.notifyUpdate();
    }
    return result;
  }, [inventoryPulse, addLog]);

  const unequipItem = useCallback((slot) => {
    const turnCheck = checkPlayerTurn();
    if (!turnCheck.success) return turnCheck;
    if (!engine.inventoryManager || !engine.player || engine.player.ap < 1) {
      return { success: false, reason: 'Not enough AP' };
    }
    const result = engine.inventoryManager.unequipItem(slot);
    if (result.success) {
      engine.player.useAP(1);
      addLog(`Unequipped item from ${slot}`, 'item');
      playSound('Equip');
      engine.notifyUpdate();
    }
    return result;
  }, [inventoryPulse, addLog]);

  const destroyItem = useCallback((instanceId) => {
    if (!engine.inventoryManager) return false;
    const result = engine.inventoryManager.destroyItem(instanceId);
    if (result) engine.notifyUpdate();
    return result;
  }, [inventoryPulse]);

  const moveItem = useCallback((itemId, from, to, x, y, rotation = null) => {
    if (!engine.inventoryManager) return { success: false };
    const result = engine.inventoryManager.moveItem(itemId, from, to, x, y, rotation);
    if (result.success) engine.notifyUpdate();
    return result;
  }, []);

  const dropItemToGround = useCallback((item, x, y) => {
    if (!engine.inventoryManager) return false;
    const result = engine.inventoryManager.dropItemToGround(item, x, y);
    if (result) engine.notifyUpdate();
    return result;
  }, [inventoryPulse]);

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
    idsToClose.add(`mod:${instanceId}`);
    
    // Belt grids (for attachments)
    idsToClose.add(`${instanceId}-grid`);
    if (item.getBeltContainerIds) {
        item.getBeltContainerIds().forEach(id => idsToClose.add(id));
    }
    
    // 2. Close them
    idsToClose.forEach(cid => {
        if (openContainers.has(cid)) {
            console.debug(`[InventoryContext] Auto-closing associated container: ${cid}`);
            closeContainer(cid);
        }
    });
  }, [openContainers, closeContainer]);

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

    const mode = (item.hasTrait?.(ItemTrait.SCOOTER) && item.scooterMode === 'ride') ? 'ride' : 'pull';
    
    // Safety: If attempting to pull, verify the item has the DRAGGABLE trait
    if (mode === 'pull' && !item.hasTrait?.(ItemTrait.DRAGGABLE)) {
      return { success: false, reason: 'This item cannot be pulled.' };
    }

    const logAction = mode === 'ride' ? 'riding' : 'dragging';

    if (mode === 'ride') {
      engine.riding = {
        item,
        tileX: itemPos.x,
        tileY: itemPos.y
      };
      if (engine.inventoryManager) {
        engine.inventoryManager.ridingItem = item;
        engine.inventoryManager.sortGroundItems();
      }
    } else {
      engine.dragging = {
        item,
        tileX: itemPos.x,
        tileY: itemPos.y
      };
      if (engine.inventoryManager) engine.inventoryManager.draggedItem = item;
    }

    addLog(`You start ${logAction} the ${item.name}.`, 'item');
    engine.notifyUpdate();
    return { success: true };
  }, [addLog, inventoryPulse]);

  const stopDrag = useCallback((itemToStop = null) => {
    // If a specific item is passed, only stop dragging IF it matches that item
    const target = itemToStop || (engine.dragging?.item);
    if (!target) return;

    if (engine.dragging && engine.dragging.item.instanceId === target.instanceId) {
      addLog(`You set down the ${engine.dragging.item.name}.`, 'item');
      
      // Clear scooter mode if applicable
      if (engine.dragging.item.hasTrait?.(ItemTrait.SCOOTER)) {
        engine.dragging.item.scooterMode = null;
      }

      if (engine.inventoryManager) engine.inventoryManager.draggedItem = null;
      engine.dragging = null;
      engine.notifyUpdate();
    }
  }, [addLog, inventoryPulse]);

  const stopRiding = useCallback((itemToStop = null) => {
    const target = itemToStop || (engine.riding?.item);
    if (!target) return;

    if (engine.riding && engine.riding.item.instanceId === target.instanceId) {
      addLog(`You stop riding the ${engine.riding.item.name}.`, 'item');
      
      if (engine.riding.item.hasTrait?.(ItemTrait.SCOOTER)) {
        engine.riding.item.scooterMode = null;
      }

      if (engine.inventoryManager) engine.inventoryManager.ridingItem = null;
      engine.riding = null;
      engine.notifyUpdate();
    }
  }, [addLog, inventoryPulse]);

  const selectItem = useCallback((item, originId, x, y, extraProps = {}) => {
    if (item && item.defId === 'tool.battery_powered_hotplate' && item.isOn) {
      addLog('Turn off the hotplate before picking it up.', 'error');
      playSound('Fail');
      return false;
    }

    // Phase 25: Cancel drag if picking up the item currently being dragged
    if (engine.dragging && engine.dragging.item.instanceId === item.instanceId) {
      stopDrag(item);
    }
    if (engine.riding && engine.riding.item.instanceId === item.instanceId) {
      stopRiding(item);
    }

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
    return true;
  }, [addLog, playSound]);

  const rotateSelected = useCallback(() => {
    setSelectedItem(prev => {
      if (!prev || prev.item.width === prev.item.height) return prev;
      return { ...prev, rotation: (prev.rotation === 0 ? 90 : 0) };
    });
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
                engine.notifyUpdate();
            }
        }
    }
    setSelectedItem(null);
  }, [selectedItem]);

  const placeSelected = useCallback((targetId, x, y) => {
    if (!checkPlayerTurn().success) return { success: false };
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

    // Phase: Intercept Planting in Planter Box
    if (item.defId && item.defId.endsWith('seeds') && (String(targetId).endsWith('-container') || String(targetId).endsWith('-grid'))) {
      const targetContainer = engine.inventoryManager.getContainer(targetId);
      if (targetContainer && targetContainer.ownerId) {
        const ownerItem = engine.inventoryManager.findItem(targetContainer.ownerId)?.item;
        if (ownerItem && ownerItem.hasTrait?.(ItemTrait.PLANTER)) {
            // Determine plant defId from item data
            const plantDefId = item.plantsAs;

            if (plantDefId) {
                // Check bounds/collision
                const plantData = createItemFromDef(plantDefId);
                if (!plantData) {
                    console.error('[InventoryContext] Failed to create plant data for:', plantDefId);
                    return { success: false, reason: 'Invalid plant definition' };
                }

                const tempPlant = new Item(plantData);
                
                // For planter boxes, we always plant at (0,0) as it is a single 2x2 slot
                const plantX = 0;
                const plantY = 0;
                const placementCheck = targetContainer.validatePlacement(tempPlant, plantX, plantY, rotation);
                
                if (placementCheck.valid) {
                    // Add plant to planter box container
                    const plantSuccess = targetContainer.addItem(tempPlant, plantX, plantY, rotation);
                    console.log(`[InventoryContext] Planting ${tempPlant.name} success: ${plantSuccess}`);

                    if (plantSuccess) {
                        // Destroy/Decrement seed ONLY after successful placement
                        if (item.stackCount > 1) {
                            item.stackCount -= 1;
                        } else {
                            item.stackCount = 0; // Explicitly set to 0 for selection clearing check
                            engine.inventoryManager.destroyItem(item.instanceId);
                        }
                    } else {
                        // If for some reason addItem failed, don't consume the seed
                        playSound('Fail');
                        addLog('Failed to place plant in container', 'error');
                        return { success: false, reason: 'Placement failed' };
                    }

                    playSound('Equip');
                    addLog(`You planted a seed in the ${ownerItem.name}.`, 'item');
                    
                    // Only clear selection if we used the last seed
                    if (item.stackCount <= 0) {
                        setSelectedItem(null);
                    }
                    
                    engine.notifyUpdate();
                    return { success: true };
                } else {
                    playSound('Fail');
                    addLog('Cannot plant here: ' + placementCheck.reason, 'error');
                    return { success: false, reason: placementCheck.reason };
                }
            }
        }
      }
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
          player.heal(val === 'Max HP' ? player.maxHp : val, true);
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
           if (key === 'hp' || key === 'heal') player.heal(value, true);
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
    if (!checkPlayerTurn()) return { success: false };
    if (!engine.player || !engine.inventoryManager) return { success: false };
    
    // 1. Apply Effects
    applyConsumptionEffects(engine.player, item);
    
    // 2. Handle Stacking (Phase 12 Stack Fix)
    if (item.hasTrait(ItemTrait.STACKABLE) && item.stackCount > 1) {
        item.stackCount -= 1;
        console.log(`[InventoryContext] Consumed 1 ${item.name}. Remaining stack: ${item.stackCount}`);
        
        // Notify changes locally and globally
        engine.notifyUpdate();
    } else {
        // Not a stack, or last item in stack
        engine.inventoryManager.destroyItem(item.instanceId);
        engine.notifyUpdate();
    }
    
    // 3. Play Sound
    const sound = item.consumptionSound || 'Eat';
    playSound(sound);

    return { success: true };
  }, [applyConsumptionEffects, playSound]);

  const drinkWater = useCallback((item, amount) => {
    if (!checkPlayerTurn()) return { success: false };
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

    // 5. Handle puddle destruction (Phase: Environment Cleanup)
    // Identify puddles by ID, category, or traits
    const isPuddle = 
      itemToDrinkFrom.defId?.includes('puddle') || 
      itemToDrinkFrom.defId?.startsWith('environment.') ||
      (itemToDrinkFrom.hasCategory && itemToDrinkFrom.hasCategory(ItemCategory.ENVIRONMENT));
    
    if (isPuddle && itemToDrinkFrom.hasTrait?.(ItemTrait.WATER_SOURCE)) {
      if (itemToDrinkFrom.ammoCount <= 0.01) {
        addLog(`Drained ${itemToDrinkFrom.name}.`, 'info');
        if (itemToDrinkFrom._container) {
          itemToDrinkFrom._container.removeItem(itemToDrinkFrom.instanceId);
        } else {
          engine.inventoryManager.destroyItem(itemToDrinkFrom.instanceId);
        }
      } else {
        // Reposition to update footprint (size changes based on water level)
        const ground = engine.inventoryManager.groundContainer;
        ground.updateItemFootprint(itemToDrinkFrom);
      }
    }

    // Handle sickness for dirty water
    if (itemToDrinkFrom.waterQuality === 'dirty') {
      player.inflictSickness(unitsToDrink);
      addLog(`The water was dirty. You feel sick.`, 'warning');
    }

    addLog(`You drink ${unitsToDrink} units of water from ${item.name}.`, 'item');
    playSound('Drink');

    engine.notifyUpdate();
    return { success: true };
  }, [addLog, playSound]);

  const unrollBedroll = useCallback((item) => {
    if (!checkPlayerTurn()) return { success: false };
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
    
    engine.notifyUpdate();
    return { success: true };
  }, [addLog, playSound]);

  const rollupBedroll = useCallback((item) => {
    if (!checkPlayerTurn()) return { success: false };
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

    engine.notifyUpdate();
    return { success: true };
  }, [addLog, playSound]);

  const crankCharger = useCallback((item, amount = 1) => {
    const turnCheck = checkPlayerTurn();
    if (!turnCheck.success) return turnCheck;
    if (!engine.player || !engine.inventoryManager) return { success: false };
    
    const player = engine.player;
    const apAvailable = player.ap || 0;
    const apNeeded = amount === 'max' ? apAvailable : amount;
    
    if (apNeeded <= 0) {
      addLog("Not enough AP to crank.", 'error');
      playSound('Fail');
      return { success: false, reason: 'Not enough AP' };
    }

    const container = item.getContainerGrid?.();
    if (!container) return { success: false, reason: 'No container found' };

    const batteries = container.getAllItems();
    if (batteries.length === 0) {
      addLog("The charger is empty.", 'warning');
      playSound('EmptyClick');
      return { success: false, reason: 'Empty' };
    }

    // Check if any battery needs charging
    const needsCharging = batteries.some(b => {
      const max = b.capacity || (b.defId === 'tool.large_battery' ? 100 : 10);
      return (b.ammoCount || 0) < max;
    });

    if (!needsCharging) {
      addLog("All batteries are already full.", 'info');
      playSound('Click');
      return { success: false, reason: 'Full' };
    }

    // Perform charging
    for (let i = 0; i < apNeeded; i++) {
       TurnProcessingUtils.chargeBatteries(batteries);
    }
    
    player.useAP(apNeeded);
    addLog(`You crank the charger ${apNeeded} times.`, 'item');
    playSound('Click'); 
    
    engine.notifyUpdate();
    return { success: true };
  }, [addLog, playSound]);

  const pickSafeLock = useCallback((item) => {
    const turnCheck = checkPlayerTurn();
    if (!turnCheck.success) return turnCheck;
    if (!engine.player || !engine.inventoryManager) return { success: false };

    const hasLockpick = engine.inventoryManager.hasItemByDefId('tool.lockpick');
    if (!hasLockpick) {
      addLog("You need a lockpick in your inventory or on the ground to pick this lock.", 'error');
      playSound('Fail');
      return { success: false, reason: 'No lockpick' };
    }

    const consumed = engine.inventoryManager.consumeItemByDefId('tool.lockpick');
    if (!consumed) {
      addLog("Failed to consume lockpick.", 'error');
      playSound('Fail');
      return { success: false, reason: 'Consumption failed' };
    }

    item.isLocked = false;
    playSound('Unlock');
    addLog(`You successfully pick the lock on the safe.`, 'item');

    engine.notifyUpdate();
    return { success: true };
  }, [addLog, playSound]);

  const readBook = useCallback((item, amount = 1) => {
    const turnCheck = checkPlayerTurn();
    if (!turnCheck.success) return turnCheck;
    if (!engine.player || !engine.bookStats) return { success: false };
    
    const stats = engine.bookStats[item.defId];
    if (!stats) return { success: false, reason: 'No stats for book' };

    const player = engine.player;
    const apAvailable = player.ap || 0;
    const apNeeded = amount === 'max' ? Math.floor(Math.min(apAvailable, stats.pagesLeft)) : amount;
    
    if (apNeeded <= 0) {
      if (stats.pagesLeft <= 0) {
          addLog("You have already finished this book.", 'info');
      } else {
          addLog("Not enough AP to read.", 'error');
          playSound('Fail');
      }
      return { success: false, reason: 'Not enough AP' };
    }

    if (stats.pagesLeft < apNeeded) {
        addLog("Not enough pages left in the book.", 'error');
        return { success: false, reason: 'Not enough pages' };
    }

    // Process reading
    stats.pagesLeft -= apNeeded;
    player.useAP(apNeeded);
    
    // Milestone check: Every 100 pages increases maxAp by 1
    const totalPagesRead = 500 - stats.pagesLeft;
    const currentMilestones = Math.floor(totalPagesRead / 100);
    const newMilestones = currentMilestones - (stats.milestonesReached || 0);
    
    if (newMilestones > 0) {
        player.modifyStat('maxAp', newMilestones);
        stats.milestonesReached = currentMilestones;
        addLog(`You feel enlightened. Max AP increased by ${newMilestones}!`, 'success');
        playSound('LevelUp');
    }

    addLog(`You read ${apNeeded} pages of "${item.name}".`, 'item');
    playSound('Click'); 
    
    engine.notifyUpdate();
    return { success: true };
  }, [addLog, playSound]);

  const disassembleItem = useCallback((item) => {
    if (!checkPlayerTurn()) return { success: false };
    if (!engine.inventoryManager || !engine.player) return { success: false };
    
    const def = ItemDefs[item.defId];
    if (!def || !def.disassembleData) return { success: false };

    const craftingLevel = engine.player.craftingLvl || 0;
    const apCost = Math.max(1, (def.disassembleData.apCost || 10) - craftingLevel);

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
      engine.notifyUpdate();
      return { success: true };
    } else {
      addLog(`You need the required tool in the same container to disassemble this.`, 'error');
      playSound('Fail');
      return { success: false, reason: 'Missing tool' };
    }
  }, [addLog, playSound]);

  const craftItem = useCallback((recipeId) => {
    const turnCheck = checkPlayerTurn();
    if (!turnCheck.success) return turnCheck;
    if (!engine.inventoryManager || !engine.player) return { success: false, reason: 'System not ready' };
    
    const player = engine.player;
    const craftingLevel = player.craftingLvl || 0;
    
    // Perform the craft through the manager
    const result = engine.inventoryManager.craftingManager.craft(recipeId, craftingLevel, player.ap);
    
    if (result.success) {
      if (result.item && !result.placedInGround) {
        // Normal items: add to inventory or drop to ground (Auto-merge crafted items)
        const addResult = engine.inventoryManager.addItem(result.item, null, null, null, true);
        if (!addResult.success) {
            addLog(`Crafted ${result.item.name} but could not find space in inventory or on ground!`, 'error');
            console.error('[InventoryContext] addItem failed for crafted item:', result.item, addResult.reason);
        }
      }

      if (result.returnedItems && result.returnedItems.length > 0) {
        result.returnedItems.forEach(retItem => {
          const addRetResult = engine.inventoryManager.addItem(retItem, null, null, null, true);
          if (!addRetResult.success) {
              addLog(`Could not find space for ${retItem.name} in inventory! It was dropped on the ground.`, 'warning');
          } else {
              addLog(`Returned ${retItem.name} from consumed container.`, 'item');
          }
        });
      }
      
      // DEDUCT AP AND REWARD EXP
      const apUsed = result.apCost || 0;
      if (apUsed > 0) {
        player.useAP(apUsed);
        player.onItemCrafted(apUsed);
      }
      
      engine.notifyUpdate();
      addLog(`Crafted ${result.item?.name || 'item'}`, 'item');
      
      if (['cooking.cooked_meat', 'cooking.cooked_vegetables'].includes(recipeId)) {
        playSound('Sizzle');
      } else if (['cooking.clean_water', 'cooking.clean_water_jug', 'cooking.stew'].includes(recipeId)) {
        playSound('Boil');
      } else if (recipeId === 'crafting.campfire') {
        playSound('Ignite');
      } else {
        playSound('Craft');
      }
    }
    return result;
  }, [addLog, playSound]);

  const autoloadRecipe = useCallback((recipeId) => {
    if (!engine.inventoryManager) return { success: false };
    return engine.inventoryManager.craftingManager.autoload(recipeId);
  }, []);

  const unloadCrafting = useCallback(() => {
    if (!engine.inventoryManager) return;
    return engine.inventoryManager.craftingManager.unload();
  }, []);

  const clearCraftingArea = useCallback(() => engine.inventoryManager?.clearCraftingArea(), []);

  const getPlacementPreview = useCallback((containerId, x, y) => {
    if (!selectedItem || !engine.inventoryManager) return null;
    const container = engine.inventoryManager.getContainer(containerId);
    if (!container) return null;

    const { item, rotation } = selectedItem;

    // Phase: Specialized 2x2 preview for seeds in planter boxes
    if (item.defId && item.defId.endsWith('seeds') && container.ownerId) {
        const ownerItem = engine.inventoryManager.findItem(container.ownerId)?.item;
        if (ownerItem && ownerItem.hasTrait?.(ItemTrait.PLANTER)) {
            return {
                gridX: 0, // Snap to top-left of the 2x2 planter grid
                gridY: 0,
                width: 2,
                height: 2,
                valid: true
            };
        }
    }

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
      engine.notifyUpdate();
    }
    return result;
  }, [selectedItem, inventoryPulse]);

   const splitStack = useCallback((item, count) => {
    if (!checkPlayerTurn()) return { success: false };
    if (!item || !engine.inventoryManager) return { success: false };
    
    try {
      const newItem = item.splitStack(count);
      if (newItem) {
        const containerId = item._container?.id;
        const isNpcContainer = containerId === 'barter_they_offer' || (containerId?.endsWith('_inventory') && containerId !== 'player_inventory');
        const result = engine.inventoryManager.addItem(newItem, containerId, null, null, false, isNpcContainer);
        if (result.success) {
          // Atomically reduce the original stack ONLY if the new one was successfully placed
          item.stackCount -= count;
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
    if (!checkPlayerTurn()) return { success: false };
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
    
    engine.notifyUpdate();
    return { success: true };
  }, [addLog, playSound]);

  const retrieveSnare = useCallback((item) => {
    if (!checkPlayerTurn()) return { success: false };
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

    engine.notifyUpdate();
    return { success: true };
  }, [addLog, playSound]);

  const depositSelectedInto = useCallback((targetContainerItem) => {
    if (!checkPlayerTurn()) return { success: false };
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
            engine.notifyUpdate();
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
                    engine.notifyUpdate();
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
    if (!checkPlayerTurn()) return { success: false };
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
           engine.notifyUpdate();
           return { success: true };
       }
    }
    return { success: false };
  }, [selectedItem, inventoryPulse]);

  const attachSelectedItemToWeapon = useCallback((weapon, slotId) => {
    const turnCheck = checkPlayerTurn();
    if (!turnCheck.success) return turnCheck;
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
        engine.notifyUpdate();
        return { success: true };
    }
    return result;
  }, [selectedItem, inventoryPulse]);

  const loadAmmoInto = useCallback((magazine) => {
    const turnCheck = checkPlayerTurn();
    if (!turnCheck.success) return turnCheck;
    if (!selectedItem || !engine.inventoryManager || !magazine) return { success: false };
    const result = magazine.loadAmmo(selectedItem.item);
    if (result.success) {
      if (result.isStackEmpty) {
        // Remove empty stack from world
        engine.inventoryManager.destroyItem(selectedItem.item.instanceId);
        setSelectedItem(null);
      }
      engine.notifyUpdate();
      playSound('ReloadShot');
      return { success: true };
    }
    return result;
  }, [selectedItem, playSound, inventoryPulse]);
  const loadAmmoDirectly = useCallback((weapon) => {
    const turnCheck = checkPlayerTurn();
    if (!turnCheck.success) return turnCheck;
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
        engine.notifyUpdate();
        return { success: true };
      }
    }
    return { success: false };
  }, [selectedItem, inventoryPulse]);

  const unloadWeapon = useCallback((weapon) => {
    const turnCheck = checkPlayerTurn();
    if (!turnCheck.success) return turnCheck;
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
      engine.notifyUpdate();
    }
    return result;
  }, [playSound, addLog]);

  const unloadMagazine = useCallback((magazine) => {
    const turnCheck = checkPlayerTurn();
    if (!turnCheck.success) return turnCheck;
    if (!engine.inventoryManager || !magazine) return { success: false };

    const result = engine.inventoryManager.unloadMagazine(magazine);
    if (result.success) {
      // No AP cost for magazine-only interactions
      addLog(`Unloaded ${result.item.stackCount} rounds of ${result.item.name}.`, 'item');
      playSound('ReloadShot');
      engine.notifyUpdate();
    }
    return result;
  }, [playSound, addLog]);

  const fuelCampfire = useCallback((fuelItem, campfire) => {
    if (!engine.inventoryManager || !fuelItem || !campfire) return { success: false };
    const result = engine.inventoryManager.fuelCampfire(fuelItem, campfire);
    if (result.success) {
       if (result.itemDestroyed) setSelectedItem(null);
       engine.notifyUpdate();
       playSound('Ignite');
       return { success: true };
    }
    return result;
  }, [playSound, inventoryPulse]);

  const detachItemFromWeapon = useCallback((weapon, slotId) => {
    if (!engine.inventoryManager) return null;
    const detached = engine.inventoryManager.detachItemFromWeapon(weapon, slotId);
    if (detached) engine.notifyUpdate();
    return detached;
  }, [inventoryPulse]);

  const fillFromSource = useCallback((bottle, source, originContainerId, originX = null, originY = null, rotation = null) => {
    if (!engine.inventoryManager || !engine.player) return;

    // 1. AP Check
    if (engine.player.ap < 1) {
      addLog('Not enough AP to fill bottle.', 'error');
      return;
    }

    // 2. Determine the active bottle instance
    let activeBottle = bottle;
    let wasSplit = false;
    
    // If it's a stack, we must create a NEW instance for the filled bottle
    // so we don't modify the whole stack of empty ones.
    if (bottle.stackCount > 1) {
      activeBottle = Item.fromJSON(bottle.toJSON());
      activeBottle.instanceId = `${bottle.instanceId}-filled-${Date.now()}`;
      activeBottle.stackCount = 1;
      wasSplit = true;
      // We don't remove the original stack from its container yet.
      // We only decrement it if the placement of the new bottle succeeds.
    } else {
      // For a single bottle, we'll use the item itself.
      // We MUST remove it from its current container temporarily so it doesn't
      // collide with itself when we call addItem with origin coordinates.
      setSelectedItem(null);
      const currentContainer = bottle._container;
      if (currentContainer) {
        currentContainer.removeItem(bottle.instanceId);
      }
    }

    // Rollback helper for single bottle if any failure/early return occurs
    const rollback = () => {
      if (!wasSplit) {
        const container = engine.inventoryManager.getContainer(originContainerId);
        if (container) {
          container.placeItemAt(activeBottle, originX, originY);
        } else {
          engine.inventoryManager.addItem(activeBottle, 'ground', null, null, true);
        }
      }
    };

    // Apply rotation if provided (from selection state)
    if (rotation !== null) {
      activeBottle.rotation = rotation;
    }

    try {
      // 3. Fill logic
      const isPuddleSource = 
        source.defId?.includes('puddle') || 
        source.defId?.startsWith('environment.') ||
        (source.hasCategory && source.hasCategory(ItemCategory.ENVIRONMENT));
      
      const isRainCollector = source.hasTrait?.(ItemTrait.WATER_SOURCE) && source.defId?.includes('collector');
      const sourceName = source.name || (isPuddleSource ? 'puddle' : 'rain collector');

      const space = activeBottle.capacity - activeBottle.ammoCount;
      const transfer = Math.min(space, source.ammoCount);
      
      if (transfer <= 0) {
        // Phase 30 Fix: Even if no transfer occurred (e.g. bottle full), 
        // still trigger cleanup if the puddle is already empty.
        if (isPuddleSource && source.ammoCount <= 0.01) {
          console.log(`[InventoryContext] Puddle cleanup triggered for empty source: ${source.instanceId}`);
          if (source._container) {
            source._container.removeItem(source.instanceId);
          } else {
            engine.inventoryManager.destroyItem(source.instanceId);
          }
          addLog(`The ${sourceName} is empty and has vanished.`, 'info');
          rollback();
          return;
        }

        addLog(`${activeBottle.name} is already full or ${sourceName} is empty.`, 'error');
        rollback();
        return;
      }

      activeBottle.ammoCount += transfer;
      activeBottle.waterQuality = 'dirty';
      source.ammoCount -= transfer;

      addLog(`You fill the ${activeBottle.name} with dirty water from the ${sourceName}.`, 'item');
      playSound('FillBottle'); 

      // 4. Update source size/existence
      if (isPuddleSource && source.hasTrait?.(ItemTrait.WATER_SOURCE)) {
        if (source.ammoCount <= 0.01) {
          console.log(`[InventoryContext] Puddle drained, destroying: ${source.instanceId}`);
          if (source._container) {
            source._container.removeItem(source.instanceId);
          } else {
            engine.inventoryManager.destroyItem(source.instanceId);
          }
          addLog('The puddle has been drained.', 'info');
        } else {
          // Reposition to update footprint (size changes based on water level)
          const ground = engine.inventoryManager.groundContainer;
          ground.updateItemFootprint(source);
        }
      }

      // 5. Stacking / Placement
      // Priority: If it came from the ground, try to put it in the inventory first.
      // If it came from the inventory, try to put it back exactly where it was.
      const preferredContainer = originContainerId === 'ground' ? null : originContainerId;
      
      const stackResult = engine.inventoryManager.addItem(activeBottle, preferredContainer, originX, originY, true);
      
      if (stackResult.success) {
        if (wasSplit) {
          bottle.stackCount -= 1; // Atomic decrement on success
        }
        
        if (stackResult.merged) {
          addLog(`Merged ${activeBottle.name} into existing supplies.`, 'info');
        } else {
          addLog(`Stored ${activeBottle.name} in ${stackResult.container}.`, 'info');
        }
      } else {
        // Emergency: If it failed to find a spot in the preferred container or any other inventory slot
        if (wasSplit) {
          // If it was a split, we just cancel the fill because there's no room
          addLog('No room in inventory to store the filled bottle!', 'error');
          // We don't decrement the original stack.
        } else {
          // If it was a single bottle, we already removed it from its home!
          // We must drop it to the ground.
          engine.inventoryManager.addItem(activeBottle, 'ground', null, null, true);
          addLog('Inventory full! The filled bottle was placed on the ground.', 'warning');
        }
      }

      // 6. AP Consumption
      engine.player.useAP(1);
      engine.notifyUpdate();
    } catch (error) {
      console.error('[InventoryContext] fillFromSource failed, executing rollback:', error);
      rollback();
      throw error;
    }
  }, [addLog, playSound, inventoryPulse]);

  const toggleFireMode = useCallback((item) => {
    if (!item || !item.availableFireModes || item.availableFireModes.length <= 1) return;
    
    const currentIndex = item.availableFireModes.indexOf(item.fireMode);
    const nextIndex = (currentIndex + 1) % item.availableFireModes.length;
    item.fireMode = item.availableFireModes[nextIndex];
    
    addLog(`${item.name} set to ${item.fireMode} mode.`, 'info');
    playSound('Click');
    engine.notifyUpdate();
  }, [addLog, playSound]);

  const toggleGenerator = useCallback((generator) => {
    if (!generator) return;
    
    if (!generator.isOn) {
      // Turning ON
      if ((generator.ammoCount || 0) <= 0) {
        addLog('The generator has no fuel!', 'error');
        playSound('Fail');
        return;
      }
      
      generator.isOn = true;
      generator.ammoCount -= 1; // Instant consumption per request
      addLog(`You pull the cord and the generator rumbles to life. It consumes 1 unit of fuel.`, 'world');
      playSound('SwitchOn'); 
    } else {
      // Turning OFF
      generator.isOn = false;
      addLog('You turn off the generator.', 'info');
      playSound('SwitchOff');
    }
    
    engine.notifyUpdate();
  }, [addLog, playSound]);

  // Phase: Auto-dismount when battery dies during move
  useEffect(() => {
    const handleMoveEnded = () => {
      const riding = engine.riding;
      if (riding && riding.item) {
        const item = riding.item;
        if (item.hasTrait(ItemTrait.SCOOTER)) {
          // If the battery is empty, isScooterRideActive will return false
          if (!item.isScooterRideActive()) {
            stopRiding();
            addLog(`${item.name} battery is dead. You dismount.`, 'warning');
          }
        }
      }
    };
    
    GameEvents.on(GAME_EVENT.PLAYER_MOVE_ENDED, handleMoveEnded);
    return () => {
      GameEvents.off(GAME_EVENT.PLAYER_MOVE_ENDED, handleMoveEnded);
    };
  }, [stopRiding, addLog]);

  const contextValue = useMemo(() => ({
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
    autoloadRecipe,
    unloadCrafting,
    consumeItem,
    drinkWater,
    unrollBedroll,
    rollupBedroll,
    crankCharger,
    pickSafeLock,
    readBook,
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
    toggleGenerator,
    toggleFireMode,
    fuelCampfire,
    fillFromSource,
    detachItemFromWeapon,
    startDrag,
    stopDrag,
    stopRiding,
    // Add legacy fields to prevent crashes
    inventoryRef: { current: engine.inventoryManager },
    forceRefresh: () => engine.notifyUpdate(),
    inventoryVersion: inventoryPulse
  }), [inventoryPulse, openContainers, selectedItem, selectedRecipeId, startDrag, stopDrag, stopRiding, crankCharger, readBook, pickSafeLock]);

  return (
    <InventoryContext.Provider value={contextValue}>
      {children}
    </InventoryContext.Provider>
  );
};