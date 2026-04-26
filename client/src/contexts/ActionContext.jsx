import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import engine from '../game/GameEngine.js';
import { Item, createItemFromDef, ItemTrait } from '../game/inventory/index.js';
import { useLog } from './LogContext.jsx';
import { useVisualEffects } from './VisualEffectsContext.jsx';
import { usePlayer } from './PlayerContext.jsx';
import { useGameMap } from './GameMapContext.jsx';
import { useAudio } from './AudioContext.jsx';
import { useGame } from './GameContext.jsx';
import GameEvents, { GAME_EVENT } from '../game/utils/GameEvents.js';
import { EntityType } from '../game/entities/Entity.js';

const ActionContext = createContext();

export const useAction = () => {
  const context = useContext(ActionContext);
  if (!context) {
    throw new Error('useAction must be used within an ActionProvider');
  }
  return context;
};

export const ActionProvider = ({ children }) => {
  const { 
    isNight, 
    isFlashlightOnActual, 
    getActiveFlashlightRange 
  } = useGame();

  const { addLog } = useLog();
  const { addEffect } = useVisualEffects();
  const { updatePlayerStats, updatePlayerFieldOfView, updatePlayerCardinalPositions } = usePlayer();
  const { triggerMapUpdate } = useGameMap();
  const { playSound } = useAudio();

  const [targetingItem, setTargetingItem] = useState(null);

  const startTargetingItem = useCallback((item) => {
    setTargetingItem(item);
    engine.targetingItemInstanceId = item?.instanceId || null;
  }, []);

  // Sync with engine after load
  useEffect(() => {
    const handleSync = () => {
      const instanceId = engine.targetingItemInstanceId;
      if (instanceId && engine.inventoryManager) {
        const item = engine.inventoryManager.getItemByInstanceId(instanceId);
        if (item) {
          setTargetingItem(item);
        } else {
          setTargetingItem(null);
          engine.targetingItemInstanceId = null;
        }
      } else {
        setTargetingItem(null);
      }
    };
    engine.on('sync', handleSync);
    return () => engine.off('sync', handleSync);
  }, []);

  // Cancel targeting when a turn ends
  useEffect(() => {
    const handleTurnEnd = () => {
      console.log('[ActionContext] 🔄 Turn ended, clearing targeting state');
      setTargetingItem(null);
    };
    GameEvents.on(GAME_EVENT.TURN_ENDED, handleTurnEnd);
    return () => GameEvents.off(GAME_EVENT.TURN_ENDED, handleTurnEnd);
  }, []);

  const cancelTargetingItem = useCallback(() => {
    setTargetingItem(null);
    engine.targetingItemInstanceId = null;
    if (typeof window.inv?.clearSelected === 'function') {
      window.inv.clearSelected();
    }
  }, []);

  const digHole = useCallback((x, y) => {
    const player = engine.player;
    const gameMap = engine.gameMap;
    const inventoryManager = engine.inventoryManager;
    
    if (!player || !gameMap || !targetingItem || !inventoryManager) return { success: false };

    if (player.ap < 5) {
      addLog("Not enough AP to dig (requires 5)", "warning");
      return { success: false, reason: 'Need 5 AP' };
    }

    if (!inventoryManager.groundContainer) return { success: false };

    const itemData = createItemFromDef('provision.hole');
    const holeItem = Item.fromJSON(itemData);
    
    const success = inventoryManager.groundContainer.addItem(holeItem, x, y);
    if (!success) {
      addLog("Could not dig here - space is occupied", "system");
      return { success: false, reason: 'Grid placement failed' };
    }

    // Phase: Spawn Loose Soil
    const soilData = createItemFromDef('crafting.loose_soil');
    if (soilData) {
      const soilItem = Item.fromJSON(soilData);
      inventoryManager.groundContainer.addItem(soilItem); // Smart add will find a spot
    }

    player.useAP(5);
    updatePlayerStats({ ap: player.ap });
    
    addLog("You dig a hole in the ground.", "world");
    gameMap.emitNoise(player.x, player.y, 5);
    
    if (addEffect) {
      addEffect({ type: 'tile_flash', x: player.x, y: player.y, color: 'rgba(139, 115, 85, 0.4)', duration: 300 });
    }

    if (targetingItem.hasTrait('degradable')) {
      targetingItem.degrade(2);
      if (targetingItem.condition <= 0) {
        addLog(`Your ${targetingItem.name} broke!`, 'warning');
        inventoryManager.destroyItem(targetingItem.instanceId);
        setTargetingItem(null);
      }
    }

    setTargetingItem(null);
    engine.targetingItemInstanceId = null;
    if (typeof window.inv?.refresh === 'function') window.inv.refresh();
    else inventoryManager.emit('inventoryChanged');
    
    return { success: true, item: holeItem };
  }, [targetingItem, addLog, addEffect, updatePlayerStats]);

  const plantSeed = useCallback((gridX, gridY, seedOverride = null) => {
    const player = engine.player;
    const gameMap = engine.gameMap;
    const inventoryManager = engine.inventoryManager;
    const activeSeed = seedOverride || targetingItem;
    
    if (!player || !activeSeed || !inventoryManager) return { success: false };

    if (player.ap < 1) {
      addLog("Not enough AP to plant (requires 1)", "warning");
      return { success: false, reason: 'Need 1 AP' };
    }

    const groundSource = inventoryManager.groundContainer;
    const hole = groundSource.getAllItems().find(i => i.defId === 'provision.hole' && i.x === gridX && i.y === gridY);

    if (!hole) {
      addLog("Must plant in a hole!", "warning");
      return { success: false, reason: 'No hole' };
    }

    const plantDefId = activeSeed.plantsAs;
    if (!plantDefId) return { success: false, reason: 'Invalid seed' };

    const plantItem = Item.fromJSON(createItemFromDef(plantDefId));
    groundSource.removeItem(hole.instanceId);
    const success = groundSource.addItem(plantItem, gridX, gridY);
    
    if (success) {
      player.modifyStat('ap', -1);
      if (activeSeed.stackCount > 1) {
        activeSeed.stackCount -= 1;
      } else {
        activeSeed.stackCount = 0;
        const seedContainer = activeSeed._container;
        if (seedContainer) {
          seedContainer.removeItem(activeSeed.instanceId);
        }
        // Ensure thorough cleanup in the manager
        inventoryManager.destroyItem(activeSeed.instanceId);
        
        setTargetingItem(null);
        engine.targetingItemInstanceId = null;
      }
      addLog(`You plant the ${activeSeed.name.toLowerCase()}.`, "info");
      updatePlayerStats({ ap: player.ap });
      if (typeof window.inv?.refresh === 'function') window.inv.refresh();
      else inventoryManager.emit('inventoryChanged');
      return { success: true };
    }
    return { success: false };
  }, [targetingItem, addLog, updatePlayerStats]);

  const fillHole = useCallback((looseSoilItem, holeItem) => {
    const inventoryManager = engine.inventoryManager;
    if (!inventoryManager || !looseSoilItem || !holeItem) return { success: false };

    // Explicitly set stackCount to 0 so selection clear won't put it back
    looseSoilItem.stackCount = 0;
    inventoryManager.destroyItem(looseSoilItem.instanceId);
    inventoryManager.destroyItem(holeItem.instanceId);
    
    addLog("You fill the hole with loose soil, leveling the ground.", "world");
    playSound('Click');
    
    if (typeof window.inv?.refresh === 'function') window.inv.refresh();
    else inventoryManager.emit('inventoryChanged');
    
    return { success: true };
  }, [addLog, playSound]);

  const bagLooseSoil = useCallback((bagItem, looseSoilItem) => {
    const inventoryManager = engine.inventoryManager;
    if (!inventoryManager || !bagItem || !looseSoilItem) return { success: false };

    const targetContainer = looseSoilItem._container;
    const soilX = looseSoilItem.x;
    const soilY = looseSoilItem.y;

    // 1. Replace Loose Soil with Soil
    const soilData = createItemFromDef('crafting.soil');
    if (!soilData) return { success: false };
    
    const soilItem = Item.fromJSON(soilData);
    
    // Explicitly set stackCount to 0 for loose soil
    looseSoilItem.stackCount = 0;
    inventoryManager.destroyItem(looseSoilItem.instanceId);
    
    if (targetContainer) {
      targetContainer.addItem(soilItem, soilX, soilY);
    } else {
      inventoryManager.groundContainer.addItem(soilItem);
    }

    // 2. Consume bag
    if (bagItem.stackCount > 1) {
      bagItem.stackCount -= 1;
    } else {
      bagItem.stackCount = 0; // Explicitly set to 0
      inventoryManager.destroyItem(bagItem.instanceId);
    }

    addLog("You scoop the loose soil into a garbage bag.", "world");
    playSound('Click');
    
    if (typeof window.inv?.refresh === 'function') window.inv.refresh();
    else inventoryManager.emit('inventoryChanged');
    
    return { success: true };
  }, [addLog, playSound]);

  const harvestPlant = useCallback((plantItem) => {
    const player = engine.player;
    const inventoryManager = engine.inventoryManager;
    if (!player || !inventoryManager) return;

    const found = inventoryManager.findItem(plantItem.instanceId);
    if (!found) return;

    // Remove from whatever container it is in (ground or planter box)
    found.container.removeItem(plantItem.instanceId);

    const min = plantItem.produceMin || 4;
    const max = plantItem.produceMax || 7;
    const count = min + Math.floor(Math.random() * (max - min + 1));
    const produceItem = Item.fromJSON(createItemFromDef(plantItem.produce || 'food.corn'));
    produceItem.stackCount = count;

    const ground = inventoryManager.groundContainer;
    
    // Always drop produce on the ground, regardless of where plant was
    const dropX = found.container.id === 'ground' ? plantItem.x : player.x;
    const dropY = found.container.id === 'ground' ? plantItem.y : player.y;
    
    const success = ground.addItem(produceItem, dropX, dropY);
    if (success) {
      addLog(`You harvest ${count} ${produceItem.name.toLowerCase()}${count > 1 ? 's' : ''}.`, "info");
      inventoryManager.syncWithMap(player.x, player.y, player.x, player.y, engine.gameMap);
      inventoryManager.emit('inventoryChanged');
      if (triggerMapUpdate) triggerMapUpdate();
    } else {
      // Fallback
      ground.addItem(produceItem);
      inventoryManager.emit('inventoryChanged');
    }
  }, [addLog, triggerMapUpdate]);

  const useBreakingToolOnStructure = useCallback((x, y) => {
    const player = engine.player;
    const gameMap = engine.gameMap;
    const inventoryManager = engine.inventoryManager;
    if (!player || !gameMap || !targetingItem) return { success: false };

    if (targetingItem.hasTrait?.(ItemTrait.CAN_DIG)) return digHole(x, y);

    const seeds = ['food.cornseeds', 'food.tomatoseeds', 'food.carrotseeds'];
    if (seeds.includes(targetingItem.defId)) return plantSeed(x, y);

    if (targetingItem.condition !== null && targetingItem.condition <= 0) {
      inventoryManager?.destroyItem(targetingItem.instanceId);
      setTargetingItem(null);
      return { success: false, reason: 'Tool is broken' };
    }

    const dx = Math.abs(player.x - x);
    const dy = Math.abs(player.y - y);
    if ((dx + dy) !== 1) return { success: false, reason: 'Too far' };

    const tile = gameMap.getTile(x, y);
    const structure = tile?.contents.find(e => e.type === EntityType.DOOR || e.type === EntityType.WINDOW);

    if (!structure || !structure.isLocked || structure.isOpen || structure.isBroken) {
      return { success: false, reason: 'Cannot use here' };
    }

    if (player.ap < 2) {
      addLog("Need 2 AP to pry open", "warning");
      return { success: false, reason: 'Need 2 AP' };
    }

    structure.isLocked = false;
    structure.isOpen = true;
    structure.hp = 0; // Forced to 0 HP - requires repair to close
    if (structure.type === EntityType.WINDOW) {
      structure.isBroken = true;
    } else {
      structure.isDamaged = true;
    }
    
    // Force renderer to see the change
    if (typeof structure.syncVisualState === 'function') {
      structure.syncVisualState();
    } else if (typeof structure.updateBlocking === 'function') {
      structure.updateBlocking();
    }
    
    playSound('ForceOpen');
    addLog(`You pry the ${structure.type} open with your ${targetingItem.name}.`, 'world');
    gameMap.emitNoise(x, y, 3);
    player.useAP(2);

    if (targetingItem.hasTrait('degradable')) {
      targetingItem.degrade(2);
      if (targetingItem.condition <= 0) {
        inventoryManager.destroyItem(targetingItem.instanceId);
        setTargetingItem(null);
      }
    }

    setTargetingItem(null);
    updatePlayerStats({ ap: player.ap });
    updatePlayerFieldOfView(gameMap, isNight, isFlashlightOnActual, false, getActiveFlashlightRange());
    updatePlayerCardinalPositions(gameMap);
    gameMap.emitEvent?.('mapUpdated');

    return { success: true };
  }, [targetingItem, addLog, playSound, updatePlayerStats, updatePlayerFieldOfView, updatePlayerCardinalPositions, isNight, isFlashlightOnActual, getActiveFlashlightRange, digHole, plantSeed]);

  const siphonFuel = useCallback((gridX, gridY, itemOverride = null) => {
    const player = engine.player;
    const inventoryManager = engine.inventoryManager;
    const activeItem = itemOverride || targetingItem;
    if (!player || !inventoryManager || !activeItem) return { success: false };

    if (player.ap < 5) {
      addLog("Not enough AP to siphon (requires 5)", "warning");
      return { success: false, reason: 'Need 5 AP' };
    }

    // Find the fuel source at the target coordinates (Cover, Generator, etc.)
    const groundSource = inventoryManager.groundContainer;
    const fuelSource = groundSource.getAllItems().find(i => 
      i.hasTrait?.(ItemTrait.FUEL_CONTAINER) && 
      gridX >= i.x && gridX < i.x + i.width && 
      gridY >= i.y && gridY < i.y + i.height
    );

    if (!fuelSource) {
      addLog("No fuel source here!", "warning");
      return { success: false, reason: 'No fuel source' };
    }

    if (fuelSource.ammoCount <= 0) {
      addLog(`${fuelSource.name} is empty.`, "info");
      return { success: false, reason: 'Empty' };
    }

    // Find all fuel cans in inventory or on ground
    const fuelCans = [];
    
    // 1. Check all containers in equipment
    Object.values(inventoryManager.equipment).forEach(equippedItem => {
      if (equippedItem) {
        if (equippedItem.isFuelContainer?.() && equippedItem.ammoCount < equippedItem.capacity) {
          fuelCans.push(equippedItem);
        }
        
        const grid = equippedItem.getContainerGrid?.();
        if (grid) {
          grid.getAllItems().forEach(item => {
            if (item.isFuelContainer?.() && item.ammoCount < item.capacity) {
              fuelCans.push(item);
            }
          });
        }
        
        const pockets = equippedItem.getPocketContainers?.();
        if (pockets) {
          pockets.forEach(pocket => {
            pocket.getAllItems().forEach(item => {
              if (item.isFuelContainer?.() && item.ammoCount < item.capacity) {
                fuelCans.push(item);
              }
            });
          });
        }
      }
    });

    // 2. Check ground items
    groundSource.getAllItems().forEach(item => {
      if (item.isFuelContainer?.() && item.ammoCount < item.capacity && item.instanceId !== fuelSource.instanceId) {
        fuelCans.push(item);
      }
    });

    if (fuelCans.length === 0) {
      addLog("No fuel cans found to fill!", "warning");
      return { success: false, reason: 'No cans' };
    }

    // Sort by current fuel (most fuel first)
    fuelCans.sort((a, b) => b.ammoCount - a.ammoCount);

    let siphonedAmount = 0;
    
    for (const can of fuelCans) {
      const space = can.capacity - can.ammoCount;
      const amountToTransfer = Math.min(space, fuelSource.ammoCount);
      
      can.ammoCount += amountToTransfer;
      fuelSource.ammoCount -= amountToTransfer;
      siphonedAmount += amountToTransfer;

      if (fuelSource.ammoCount <= 0) break;
    }

    if (siphonedAmount > 0) {
      player.useAP(5);
      updatePlayerStats({ ap: player.ap });
      addLog(`You siphon ${siphonedAmount} units of fuel into your cans from the ${fuelSource.name}.`, "info");
      playSound('FillBottle');
      
      if (!itemOverride) {
        setTargetingItem(null);
        engine.targetingItemInstanceId = null;
      }
      
      if (typeof window.inv?.refresh === 'function') window.inv.refresh();
      else inventoryManager.emit('inventoryChanged');
      
      return { success: true };
    }

    return { success: false };
  }, [targetingItem, addLog, updatePlayerStats, playSound]);

  const transferFuel = useCallback((fuelCan, targetContainer) => {
    const player = engine.player;
    if (!player || !fuelCan || !targetContainer) return { success: false };

    // Cost 1 AP for manual transfer
    if (player.ap < 1) {
      addLog("Not enough AP to transfer fuel.", "warning");
      return { success: false, reason: 'Need 1 AP' };
    }

    if (fuelCan.ammoCount <= 0) {
      addLog(`${fuelCan.name} is empty.`, "info");
      return { success: false };
    }

    const space = targetContainer.capacity - targetContainer.ammoCount;
    if (space <= 0) {
      addLog(`${targetContainer.name} is already full.`, "info");
      return { success: false };
    }

    const amount = Math.min(fuelCan.ammoCount, space);
    fuelCan.ammoCount -= amount;
    targetContainer.ammoCount += amount;

    player.useAP(1);
    updatePlayerStats({ ap: player.ap });
    addLog(`Transferred ${amount} units of fuel to ${targetContainer.name}.`, "info");
    playSound('FillBottle');
    
    engine.inventoryManager?.emit('inventoryChanged');
    return { success: true };
  }, [addLog, updatePlayerStats, playSound]);

  const value = {
    targetingItem,
    startTargetingItem,
    cancelTargetingItem,
    digHole,
    fillHole,
    bagLooseSoil,
    plantSeed,
    harvestPlant,
    useBreakingToolOnStructure,
    siphonFuel,
    transferFuel
  };

  return (
    <ActionContext.Provider value={value}>
      {children}
    </ActionContext.Provider>
  );
};
