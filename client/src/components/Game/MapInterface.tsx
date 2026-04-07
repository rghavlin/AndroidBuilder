import { useEffect, useState, useMemo, useCallback } from 'react';
import { useGameMap } from '../../contexts/GameMapContext.jsx';
import { usePlayer } from '../../contexts/PlayerContext.jsx';
import { useGame } from '../../contexts/GameContext.jsx';
import { useInventory } from '../../contexts/InventoryContext';
import MapCanvas from './MapCanvas.jsx';
import InventoryExtensionWindow from './InventoryExtensionWindow';
import FloatingContainer from '../Inventory/FloatingContainer';
import ContainerGrid from '../Inventory/ContainerGrid';
import { Menu, Hammer } from "lucide-react";
import MainMenuWindow from './MainMenuWindow';

import { imageLoader } from '../../game/utils/ImageLoader';
import { cn } from "@/lib/utils";
import { useCombat } from '../../contexts/CombatContext.jsx';
import { useVisualEffects } from '../../contexts/VisualEffectsContext.jsx';
import { useCamera } from '../../contexts/CameraContext.jsx';
import { ZombieTooltip } from './ZombieTooltip';
import { CropTooltip } from './CropTooltip';
import { LootTooltip } from './LootTooltip';
import { BuildingTooltip } from './BuildingTooltip';
import { DoorTooltip } from './DoorTooltip';
import { WindowTooltip } from './WindowTooltip';
import { useLog } from '../../contexts/LogContext.jsx';
import { useAudio } from '../../contexts/AudioContext.jsx';
import GameEventLog from './GameEventLog';
import LogHistoryWindow from './LogHistoryWindow';
import PlayerSkillsWindow from './PlayerSkillsWindow';
import { GridSizeProvider } from "@/contexts/GridSizeContext";
import { createItemFromDef } from '../../game/inventory/ItemDefs.js';
import { Item } from '../../game/inventory/Item.js';

interface MapInterfaceProps {
  gameState: {
    turn: number;
    playerName: string;
    location: string;
    zombieCount: number;
  };
}

// Action Button Component
const ActionSlotButton = ({ slot, isFlashlightOnActual }: { slot: string, isFlashlightOnActual: boolean }) => {
  const { inventoryRef, inventoryVersion } = useInventory();
  const { targetingWeapon, toggleTargeting } = useCombat();
  const [imageSrc, setImageSrc] = useState<string | null>(null);

  // Get item from inventory
  const equippedItem = inventoryRef.current?.equipment?.[slot];

  // Unarmed logic for melee slot
  const isMeleeUnarmed = slot === 'melee' && !equippedItem;
  const unarmedItem = isMeleeUnarmed ? {
    instanceId: 'unarmed',
    name: 'Unarmed',
    defId: 'unarmed',
    combat: { hitChance: 0.5, damage: { min: 1, max: 3 } }
  } : null;

  const item = equippedItem || unarmedItem;
  const { toggleFlashlight } = useGame();
  const isTargeting = targetingWeapon?.item.instanceId === item?.instanceId;
  const isFlashlightActive = slot === 'flashlight' && isFlashlightOnActual;

  // Load image when item changes
  useEffect(() => {
    let isMounted = true;
    const loadItemImage = async () => {
      if (!item) {
        if (isMounted) setImageSrc(null);
        return;
      }

      // Handle virtual unarmed item
      if (item.instanceId === 'unarmed') {
        try {
          const imgElement = await imageLoader.getItemImage('fist');
          if (isMounted && imgElement && imgElement.src) {
            setImageSrc(imgElement.src);
          }
        } catch (err) {
          if (isMounted) setImageSrc(null);
        }
        return;
      }

      try {
        const imageId = item.imageId || item.image || item.id;
        const imgElement = await imageLoader.getItemImage(imageId);
        if (isMounted && imgElement && imgElement.src) {
          setImageSrc(imgElement.src);
        }
      } catch (err) {
        if (isMounted) setImageSrc(null);
      }
    };

    loadItemImage();
    return () => { isMounted = false; };
  }, [item, inventoryVersion, isMeleeUnarmed]);

  const handleClick = () => {
    if (slot === 'flashlight') {
      console.log(`[ActionSlot] Clicked flashlight: Toggling state`);
      toggleFlashlight();
    } else if (item && (slot === 'melee' || slot === 'handgun' || slot === 'long_gun')) {
      console.log(`[ActionSlot] Clicked ${slot}: Toggling targeting for ${item.name}`);
      toggleTargeting(item, slot);
    } else if (item) {
      console.log(`[ActionSlot] Clicked ${slot}: Equipped with ${item.name}`);
    } else {
      console.log(`[ActionSlot] Clicked ${slot}: Nothing equipped`);
    }
  };

  return (
    <button
      onClick={handleClick}
      className={cn(
        "w-8 h-8 rounded border flex items-center justify-center transition-colors overflow-hidden",
        // Empty state: Black bg, White outline
        !item && "bg-black border-white hover:bg-zinc-900 shadow-sm",
        // Equipped state: Green outline (like end turn button) w/ transparent or slight bg
        item && !isTargeting && !isFlashlightActive && "border-green-500 bg-green-500/10 hover:bg-green-500/20",
        // Targeting state: Bright red outline/glow
        item && isTargeting && "border-red-500 bg-red-500/30 shadow-[0_0_8px_rgba(239,68,68,0.5)]",
        // Flashlight ON state: Bright yellow/cyan outline/glow
        isFlashlightActive && "border-cyan-400 bg-cyan-400/20 shadow-[0_0_10px_rgba(34,211,238,0.4)] hover:bg-cyan-400/30"
      )}
      title={item ? item.name : `Empty ${slot} slot`}
    >
      {item && imageSrc ? (
        <img
          src={imageSrc}
          alt={item.name}
          className="w-full h-full object-cover p-0.5"
        />
      ) : null}
    </button>
  );
};

export default function MapInterface({ gameState }: MapInterfaceProps) {
  // Phase 4: Only use orchestration functions from GameContext
  const {
    isInitialized,
    initializationError,
    initializeGame,
    targetingItem,
    cancelTargetingItem,
    useBreakingToolOnStructure,
    isNight,
    isFlashlightOn,
    setIsFlashlightOn,
    checkZombieAwareness,
    isSkillsOpen,
    toggleSkills
  } = useGame();

  // Phase 1: Direct sub-context access 
  const { gameMapRef, worldManagerRef, lastTileClick, hoveredTile, mapTransition, triggerMapUpdate, refreshZombieTracking } = useGameMap();
  const { playerRef, updatePlayerFieldOfView, isMoving: isAnimatingMovement, playerFieldOfView } = usePlayer();

  // Get inventory context for floating containers and selection management
  // MUST BE DECLARED BEFORE isFlashlightOnActual
  const { openContainers, closeContainer, getContainer, selectedItem, clearSelected, groundContainer, inventoryRef, inventoryVersion, forceRefresh } = useInventory();
  const { targetingWeapon, cancelTargeting, performMeleeAttack, performRangedAttack, performGrenadeThrow } = useCombat();
  const { addEffect } = useVisualEffects();
  const { worldToScreen, cameraRef } = useCamera();
  const { playSound } = useAudio();
  const { addLog } = useLog();

  // Phase 7: Locally derived robust lighting state (since we have access to real InventoryContext here)
  const isFlashlightOnActual = useMemo(() => {
    if (!isFlashlightOn) return false;
    const fl = inventoryRef.current?.equipment['flashlight'];
    if (!fl) return false;
    if (fl.defId === 'tool.torch' && !fl.isLit) return false;
    return true;
  }, [isFlashlightOn, inventoryVersion, inventoryRef.current]);

  const getActiveFlashlightRange = useCallback(() => {
    const flashlight = inventoryRef.current?.equipment['flashlight'];
    if (flashlight && flashlight.defId === 'tool.torch') return 5;
    return 8;
  }, [inventoryVersion, inventoryRef.current]);

  // Phase 7: Master FOV and lighting synchronization
  useEffect(() => {
    // 1. Force manual toggle OFF if equipment is gone/unlit
    if (isFlashlightOn && !isFlashlightOnActual) {
      console.log('[MapInterface] Sync: Light source unequipped/unlit - forcing manual toggle OFF');
      setIsFlashlightOn(false);
    }

    // 2. Extinguish logic: EVERY torch that is NOT in the flashlight slot should be unlit.
    const inv = inventoryRef.current;
    if (inv) {
      // Check containers
      for (const [id, container] of inv.containers.entries()) {
        for (const item of container.items.values()) {
          if (item.defId === 'tool.torch' && item.isLit) {
            console.log('[MapInterface] Sync: Extinguishing torch moved to container:', id);
            item.isLit = false;
          }
        }
      }
      // Check other equipment slots
      for (const slot in inv.equipment) {
        if (slot === 'flashlight') continue;
        const item = inv.equipment[slot];
        if (item && item.defId === 'tool.torch' && item.isLit) {
          console.log('[MapInterface] Sync: Extinguishing torch moved to equipment slot:', slot);
          item.isLit = false;
        }
      }
    }

    // 3. Immediately update FOV in PlayerContext based on all current factors
    if (gameMapRef.current && playerRef.current) {
      const weapon = targetingWeapon?.item;
      const sightSlot = weapon?.attachmentSlots?.find((s: any) => s.id === 'sight');
      const sightItem = sightSlot ? weapon.attachments[sightSlot.id] : null;
      const hasScope = sightItem && sightItem.categories?.includes('rifle_scope');

      const range = getActiveFlashlightRange();
      console.log(`[MapInterface] Sync: FOV update. Light: ${isFlashlightOnActual}, Range: ${range}, TargetScope: ${!!hasScope}`);
      
      const newFov = updatePlayerFieldOfView(gameMapRef.current, isNight, isFlashlightOnActual, !!hasScope, range);
      refreshZombieTracking(playerRef.current, newFov);
    }
  }, [isFlashlightOn, isFlashlightOnActual, inventoryVersion, isNight, targetingWeapon, updatePlayerFieldOfView, refreshZombieTracking, getActiveFlashlightRange]);

  const [isInventoryExtensionOpen, setIsInventoryExtensionOpen] = useState(false);
  const [isLogHistoryOpen, setIsLogHistoryOpen] = useState(false);
  const [showMainMenu, setShowMainMenu] = useState(false);
  const [doorMenu, setDoorMenu] = useState<{ x: number, y: number, screenX: number, screenY: number, door: any } | null>(null);
  const [windowMenu, setWindowMenu] = useState<{ x: number, y: number, screenX: number, screenY: number, window: any } | null>(null);
  const [waterMenu, setWaterMenu] = useState<{ x: number, y: number, screenX: number, screenY: number } | null>(null);

  // Log tile interactions for debugging
  useEffect(() => {
    if (lastTileClick) {
      console.log('[MapInterface] Tile clicked:', lastTileClick);
    }
  }, [lastTileClick]);

  useEffect(() => {
    if (hoveredTile) {
      // Tile hover data available in hoveredTile
    }
  }, [hoveredTile]);

  // Close context menus when player starts moving
  useEffect(() => {
    if (isAnimatingMovement) {
      setDoorMenu(null);
      setWindowMenu(null);
      setWaterMenu(null);
    }
  }, [isAnimatingMovement]);

  // Debug: Log the actual isInitialized value
  //console.log('[MapInterface] isInitialized value:', isInitialized, 'type:', typeof isInitialized);

  // Show initialization error if present
  if (initializationError) {
    return (
      <div className="flex-1 bg-secondary border-r border-border flex flex-col" data-testid="map-interface">
        <div className="flex-1 relative bg-muted game-grid-pattern p-4">
          <div className="absolute inset-4 flex items-center justify-center">
            <div className="text-center">
              <p className="text-destructive text-sm mb-2">Failed to initialize game</p>
              <p className="text-muted-foreground text-sm">{initializationError}</p>
              <button
                onClick={initializeGame}
                className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded text-sm"
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Handler for map cell clicks
  const onCellClick = (x: number, y: number) => {
    // Clear any map context menus on click
    setDoorMenu(null);
    setWindowMenu(null);
    setWaterMenu(null);

    // If an item is selected for movement, cancel it and don't process map click
    if (selectedItem) {
      console.debug('[MapInterface] Map clicked while item selected - canceling selection');
      clearSelected();
      return true; // Click was handled (canceled selection)
    }

    // Handle Item Targeting (Crowbar, Grenade, Shovel, Seeds etc)
    if (targetingItem) {
      // Blocking Farming tools from map clicks (must use in Ground Container grid)
      const farmingTools = ['weapon.shovel', 'food.cornseeds', 'food.tomatoseeds', 'food.carrotseeds'];
      if (farmingTools.includes(targetingItem.defId)) {
        addEffect({
          type: 'damage',
          x, y,
          value: 'USE IN GROUND INV',
          color: '#fbbf24', // Amber/Yellow
          duration: 1000
        });
        
        // CANCELLING: Since farming tools MUST be used in the inventory grid, 
        // a map click indicates the user wants to stop or is confused. 
        // We cancel targeting (which now also clears the cursor selection).
        cancelTargetingItem();
        return true; 
      }

      if (targetingItem.defId === 'weapon.grenade') {
        const result = (performGrenadeThrow as any)(targetingItem, x, y);
        if (result.success) {
          cancelTargetingItem();
        } else if (result.reason) {
          addEffect({
            type: 'damage',
            x, y,
            value: result.reason,
            color: '#ef4444',
            duration: 1000
          });
          // Don't cancel targeting on failure (e.g. out of range) unless it's a critical error
        }
        return true;
      }

      const result = useBreakingToolOnStructure(x, y);
      if (!result.success) {
        // If it failed (locked door not found, etc), clear targeting as requested
        cancelTargetingItem();

        if (result.reason) {
          addEffect({
            type: 'damage',
            x, y,
            value: result.reason,
            color: '#ef4444',
            duration: 1000
          });
        }
      }
      return true;
    }

    // Handle Combat Targeting
    if (targetingWeapon) {
      if (targetingWeapon.slot === 'melee') {
        const result = performMeleeAttack(targetingWeapon.item, x, y);

        // Cancel targeting if:
        // 1. Attack failed (out of range, no target)
        // 2. Player is out of AP
        const player = playerRef.current; // Get player for AP check
        if (!result.success || (player && player.ap < 1)) {
          cancelTargeting();
        }
      } else if (targetingWeapon.slot === 'handgun' || targetingWeapon.slot === 'long_gun') {
        const result = performRangedAttack(targetingWeapon.item, x, y);

        const player = playerRef.current;
        if (!result.success || (player && player.ap < 1)) {
          cancelTargeting();
        }
      } else {
        cancelTargeting();
      }
      return true; // Click was handled (combat action)
    }

    return false; // Click was not handled (allow movement)
  };

  // Handler for map cell right clicks
  const onCellRightClick = (x: number, y: number, screenX: number, screenY: number) => {
    const gameMap = gameMapRef.current;
    const player = playerRef.current;
    if (!gameMap || !player) return;

    const tile = gameMap.getTile(x, y);
    if (!tile) return;

    const door = tile.contents.find((e: any) => e.type === 'door');
    if (door) {
      // Check adjacency
      const distance = Math.sqrt(Math.pow(x - player.x, 2) + Math.pow(y - player.y, 2));
      const isAdjacent = distance < 2.0;

      if (isAdjacent) {
        setDoorMenu({ x, y, screenX, screenY, door });
      } else {
        console.log('[MapInterface] Door too far for interaction');
      }
      return;
    }

    const windowEntity = tile.contents.find((e: any) => e.type === 'window');
    if (windowEntity) {
      // Use robust floored distance for adjacency
      const px = Math.floor(player.x);
      const py = Math.floor(player.y);
      const dx = x - px;
      const dy = y - py;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < 2.5) {
        setWindowMenu({ x, y, screenX, screenY, window: windowEntity });
      } else {
        console.log('[MapInterface] Window too far for interaction:', distance.toFixed(2));
      }
      return;
    }

    if (tile.terrain === 'water') {
      // Use robust floored distance for adjacency
      const px = Math.floor(player.x);
      const py = Math.floor(player.y);
      const dx = x - px;
      const dy = y - py;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < 2.5) {
        setWaterMenu({ x, y, screenX, screenY });
      } else {
        console.log('[MapInterface] Water too far for interaction:', distance.toFixed(2));
      }
      return;
    }
  };

  // Block all map area clicks when item is selected or targeting
  const handleMapAreaClick = (event: React.MouseEvent) => {
    if (selectedItem) {
      event.preventDefault();
      event.stopPropagation();
      console.debug('[MapInterface] Map area clicked while item selected - canceling selection');
      clearSelected();
    }
  };

  return (
    <div className="flex-1 bg-secondary border-r border-border flex flex-col min-h-0" data-testid="map-interface">
      {/* Header Area */}
      <div className="bg-card border-b border-border p-2 flex items-center justify-between" data-testid="map-header">
        <button
          className="w-8 h-8 bg-secondary border border-border rounded flex items-center justify-center hover:bg-muted transition-colors"
          title="Main Menu"
          data-testid="main-menu-button"
          onClick={() => setShowMainMenu(true)}
        >
          <Menu className="h-5 w-5 text-foreground" />
        </button>

        {/* Action Buttons Group (Better spacing between log and slots) */}
        <div className="flex items-center flex-1 px-2">
          <GameEventLog 
            onClick={() => {
              setIsLogHistoryOpen(prev => !prev);
              setIsInventoryExtensionOpen(false); // Close other extension
            }} 
          />
          <div className="flex-1" /> {/* Spacer pushes buttons apart */}
          <div className="flex gap-2 mr-2">
            {['melee', 'handgun', 'long_gun', 'flashlight'].map((slot) => (
              <ActionSlotButton
                key={slot}
                slot={slot}
                isFlashlightOnActual={isFlashlightOnActual}
              />
            ))}
          </div>
        </div>

        <button
          className={cn(
            "w-8 h-8 bg-secondary border border-border rounded flex items-center justify-center hover:bg-muted transition-colors",
            isInventoryExtensionOpen && "border-primary bg-primary/10"
          )}
          title="Crafting/Cooking"
          data-testid="inventory-extension-button"
          onClick={() => setIsInventoryExtensionOpen(prev => !prev)}
        >
          <Hammer className={cn(
            "h-5 w-5",
            isInventoryExtensionOpen ? "text-primary" : "text-foreground"
          )} />
        </button>
      </div>

      {/* Map Display Area */}
      <div
        className="flex-1 relative overflow-hidden min-h-0"
        style={{ padding: 0, margin: 0 }}
        onClick={handleMapAreaClick}
      >
        {isInitialized ? (
          <MapCanvas
            onCellClick={onCellClick}
            onCellRightClick={onCellRightClick}
            selectedItem={selectedItem}
            isTargeting={!!targetingWeapon || (targetingItem ? true : false)}
            isNight={isNight}
            isFlashlightOn={isFlashlightOnActual}
            flashlightRange={getActiveFlashlightRange()}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-muted-foreground text-sm">Initializing game...</p>
          </div>
        )}

        {/* Tile Tooltip Overlay (Phase 6 & Generic Refactor) */}
        {(() => {
          if (!hoveredTile) return null;
          if (!hoveredTile.zombie && !hoveredTile.cropInfo && !hoveredTile.lootItems?.length && !hoveredTile.specialBuilding && !hoveredTile.door && !hoveredTile.window) return null;
          
          // Only show if the tile is explored
          const isExplored = gameMapRef.current?.getTile(hoveredTile.x, hoveredTile.y)?.flags?.explored;
          if (!isExplored) return null;

          return (
            <TileTooltipOverlay 
              hoveredTile={hoveredTile} 
              playerFieldOfView={playerFieldOfView}
            />
          );
        })()}
      </div>

      {/* Inventory Extension Window */}
      <InventoryExtensionWindow
        isOpen={isInventoryExtensionOpen}
        onClose={() => setIsInventoryExtensionOpen(false)}
      />

      {/* Log History Window (Direct Implementation to match InventoryExtensionWindow layout) */}
      {isLogHistoryOpen && (
        <div className="fixed inset-0 z-50 pointer-events-none">
          {/* Backdrop covers only map area */}
          <div
            className="absolute left-0 w-1/2 h-full bg-black/50 pointer-events-auto"
            onClick={() => setIsLogHistoryOpen(false)}
          />

          {/* Log History panel */}
          <div
            className="absolute left-0 w-1/2 bg-card border-r border-border flex flex-col p-4 overflow-hidden pointer-events-auto"
            style={{
              top: '48px',
              bottom: '72px',
              height: 'calc(100vh - 120px)'
            }}
            data-testid="log-history-window"
          >
            <LogHistoryWindow onClose={() => setIsLogHistoryOpen(false)} />
          </div>
        </div>
      )}
      {/* Main Menu Modal */}
      {showMainMenu && (
        <MainMenuWindow onClose={() => setShowMainMenu(false)} />
      )}
      
      {/* Player Skills Window */}
      <PlayerSkillsWindow 
        isOpen={isSkillsOpen} 
        onClose={toggleSkills} 
      />

      {/* Door Context Menu */}
      {doorMenu && (
        <div
          className="fixed z-[10002] bg-[#1a1a1a] border border-[#333] rounded-md shadow-lg py-1 w-32"
          style={{ left: doorMenu.screenX, top: doorMenu.screenY }}
          onMouseLeave={() => setDoorMenu(null)}
        >
          <button
            className="w-full text-left px-3 py-2 text-sm text-white hover:bg-accent focus:bg-accent transition-colors"
            onClick={() => {
              const gameMap = gameMapRef.current;
              const player = playerRef.current;
              if (!gameMap || !player) return;

              // Check AP cost (1 AP)
              if (player.ap < 1) {
                addEffect({
                  type: 'damage',
                  x: doorMenu.x,
                  y: doorMenu.y,
                  value: 'Insufficient AP',
                  color: '#ef4444',
                  duration: 1000
                });
                setDoorMenu(null);
                return;
              }

              const wasOpen = doorMenu.door.isOpen;
              const success = doorMenu.door.toggle(gameMap);
              if (success) {
                // Play sound based on new state
                if (doorMenu.door.isOpen) {
                  playSound('OpenDoor');
                } else {
                  playSound('CloseDoor');
                }

                // Consume 1 AP
                player.useAP(1);
                // Force map re-render
                triggerMapUpdate();
                // Update FOV immediately and capture new visible tiles
                const newFovTiles = updatePlayerFieldOfView(gameMap, isNight, isFlashlightOnActual, false, getActiveFlashlightRange());
                // Refresh zombie tracking with new FOV
                refreshZombieTracking(player, newFovTiles);
                // PASSIVE AWARENESS: Force zombies to check if they spot the player NOW
                checkZombieAwareness();

                // Add noise generation to attract zombies
                if (gameMap.emitNoise) {
                  gameMap.emitNoise(doorMenu.x, doorMenu.y, 8);
                }
              } else if (doorMenu.door.isDamaged) {
                // Show "Damaged" if the door is broken
                addEffect({
                  type: 'damage',
                  x: doorMenu.x,
                  y: doorMenu.y,
                  value: 'Damaged',
                  color: '#ef4444',
                  duration: 1000
                });
              } else if (doorMenu.door.isOpen && !success) {
                // Check if it was blocked by occupancy (toggle returned false while open)
                addEffect({
                  type: 'damage',
                  x: doorMenu.x,
                  y: doorMenu.y,
                  value: 'Occupied',
                  color: '#ef4444',
                  duration: 1000
                });
              } else if (doorMenu.door.isLocked && !doorMenu.door.isOpen) {
                // Show "Locked" floating message
                addEffect({
                  type: 'damage',
                  x: doorMenu.x,
                  y: doorMenu.y,
                  value: 'Locked',
                  color: '#fbbf24',
                  duration: 1000
                });
              }
              setDoorMenu(null);
            }}
          >
            {doorMenu.door.isOpen ? 'Close Door' : 'Open Door'}
          </button>
          {doorMenu.door.isLocked && !doorMenu.door.isOpen && (
            <button
              className="w-full text-left px-3 py-2 text-sm text-amber-500 hover:bg-accent focus:bg-accent transition-colors"
              onClick={() => {
                const gameMap = gameMapRef.current;
                const player = playerRef.current;
                if (!gameMap || !player) return;

                const playerTile = gameMap.getTile(player.x, player.y);
                const isInside = playerTile?.terrain === 'floor';

                if (!isInside) {
                  addEffect({
                    type: 'damage',
                    x: doorMenu.x,
                    y: doorMenu.y,
                    value: 'Need key',
                    color: '#fbbf24',
                    duration: 1000
                  });
                  setDoorMenu(null);
                  return;
                }

                // AP cost for unlocking
                if (player.ap < 1) {
                  addEffect({
                    type: 'damage',
                    x: doorMenu.x,
                    y: doorMenu.y,
                    value: 'Insufficient AP',
                    color: '#ef4444',
                    duration: 1000
                  });
                  setDoorMenu(null);
                  return;
                }

                if (doorMenu.door.unlock()) {
                  player.useAP(1);
                  playSound('Unlock');
                  addLog('You unlock the door from the inside.', 'world');
                  triggerMapUpdate();
                }
                setDoorMenu(null);
              }}
            >
              Unlock
            </button>
          )}

          {/* Repair/Reinforce option */}
          <button
            className={`w-full text-left px-3 py-2 text-sm transition-colors ${
              doorMenu.door.hp >= 40 
                ? 'text-gray-500 cursor-not-allowed' 
                : 'text-blue-400 hover:bg-accent focus:bg-accent'
            }`}
            onClick={() => {
              if (doorMenu.door.hp >= 40) return;

              const player = playerRef.current;
              const inventory = inventoryRef.current;
              if (!player || !inventory) return;

              // 1. Check AP (5 AP required)
              if (player.ap < 5) {
                addEffect({
                  type: 'damage',
                  x: doorMenu.x,
                  y: doorMenu.y,
                  value: 'Insufficient AP',
                  color: '#ef4444',
                  duration: 1000
                });
                setDoorMenu(null);
                return;
              }

              // 2. Check items
              const hasHammer = inventory.hasItemByDefId('weapon.hammer') || inventory.hasItemByDefId('weapon.makeshift_hammer');
              const has2x4 = inventory.hasItemByDefId('weapon.2x4', 1);
              const hasNails = inventory.hasItemByDefId('crafting.nail', 2);

              if (!hasHammer || !has2x4 || !hasNails) {
                let missing = [];
                if (!hasHammer) missing.push('Hammer');
                if (!has2x4) missing.push('2x4');
                if (!hasNails) missing.push('2 Nails');
                
                addLog(`Missing items: ${missing.join(', ')}`, 'error');
                addEffect({
                  type: 'damage',
                  x: doorMenu.x,
                  y: doorMenu.y,
                  value: 'Missing items',
                  color: '#ef4444',
                  duration: 1000
                });
                setDoorMenu(null);
                return;
              }

              // 3. Perform action
              player.useAP(5);
              inventory.consumeItemByDefId('weapon.2x4', 1);
              inventory.consumeItemByDefId('crafting.nail', 2);
              
              const wasBroken = doorMenu.door.isDamaged;
              doorMenu.door.repair(10);
              
              playSound('Unlock'); // Using Unlock as fallback for mechanical sound
              addLog(wasBroken ? 'You repair the door.' : 'You reinforce the door.', 'world');
              
              if (wasBroken && doorMenu.door.hp >= 10) {
                 addLog('The door is now functional again.', 'world');
                 // Refresh FOV/Zombies if state changed from broken
                 const gameMap = gameMapRef.current;
                 if (gameMap) {
                   const newFovTiles = updatePlayerFieldOfView(gameMap, isNight, isFlashlightOnActual, false, getActiveFlashlightRange());
                   refreshZombieTracking(player, newFovTiles);
                   checkZombieAwareness();
                 }
              }

              triggerMapUpdate();
              setDoorMenu(null);
            }}
          >
            {doorMenu.door.hp >= 40 ? 'Fully Reinforced' : `Repair/reinforce (5ap)`}
          </button>
          <button
            className="w-full text-left px-3 py-2 text-sm text-gray-400 hover:bg-accent focus:bg-accent transition-colors border-t border-[#333] mt-1"
            onClick={() => setDoorMenu(null)}
          >
            Cancel
          </button>
        </div>
      )}

      {/* Window Context Menu */}
      {windowMenu && (
        <div
          className="fixed z-[10002] bg-[#1a1a1a] border border-[#333] rounded-md shadow-lg py-1 w-32"
          style={{ left: windowMenu.screenX, top: windowMenu.screenY }}
          onMouseLeave={() => setWindowMenu(null)}
        >
          <button
            className="w-full text-left px-3 py-2 text-sm text-green-400 hover:bg-accent focus:bg-accent transition-colors"
            onClick={() => {
              const gameMap = gameMapRef.current;
              const player = playerRef.current;
              if (!gameMap || !player) return;

              // Action cost: 1 AP to open/close
              if (player.ap < 1) {
                addEffect({
                  type: 'damage',
                  x: windowMenu.x,
                  y: windowMenu.y,
                  value: 'Insufficient AP',
                  color: '#ef4444',
                  duration: 1000
                });
                setWindowMenu(null);
                return;
              }

              if (windowMenu.window.isOpen) {
                windowMenu.window.close();
                addLog('You close the window.', 'world');
                player.useAP(1);
                playSound('OpenWindow');
              } else {
                if (windowMenu.window.isLocked) {
                  addEffect({
                    type: 'damage',
                    x: windowMenu.x,
                    y: windowMenu.y,
                    value: 'Locked',
                    color: '#fbbf24',
                    duration: 1000
                  });
                } else {
                  windowMenu.window.open();
                  addLog('You open the window.', 'world');
                  player.useAP(1);
                  playSound('OpenWindow');
                }
              }
              
              triggerMapUpdate();
              const newFovTiles = updatePlayerFieldOfView(gameMap, isNight, isFlashlightOnActual, false, getActiveFlashlightRange());
              refreshZombieTracking(player, newFovTiles);
              checkZombieAwareness();
              setWindowMenu(null);
            }}
          >
            {windowMenu.window.isOpen ? 'Close Window' : 'Open Window'}
          </button>

          {/* Climb Through Option */}
          {(windowMenu.window.isOpen || windowMenu.window.isBroken) && !windowMenu.window.isReinforced && (
            <button
              className="w-full text-left px-3 py-2 text-sm text-cyan-400 hover:bg-accent focus:bg-accent transition-colors border-t border-[#333] mt-1"
              onClick={() => {
                const gameMap = gameMapRef.current;
                const player = playerRef.current;
                if (!gameMap || !player) return;

                // Check AP cost (3 AP)
                if (player.ap < 3) {
                  addEffect({
                    type: 'damage',
                    x: windowMenu.x,
                    y: windowMenu.y,
                    value: 'Insufficient AP',
                    color: '#ef4444',
                    duration: 1000
                  });
                  setWindowMenu(null);
                  return;
                }

                // Calculate target position (opposite side)
                const dx = windowMenu.x - player.x;
                const dy = windowMenu.y - player.y;
                const targetX = windowMenu.x + dx;
                const targetY = windowMenu.y + dy;

                const targetTile = gameMap.getTile(targetX, targetY);
                if (!targetTile || !targetTile.isWalkable(player)) {
                   addLog("The other side is blocked.", "error");
                   setWindowMenu(null);
                   return;
                }

                // Execute teleport
                const success = gameMap.moveEntity(player.id, targetX, targetY);
                if (success) {
                  player.useAP(3);
                  playSound('OpenWindow');
                  addLog("You climb through the window.", "world");
                  
                  // 50% bleed chance if broken and NOT open
                  if (windowMenu.window.isBroken && !windowMenu.window.isOpen) {
                    if (Math.random() < 0.5) {
                      player.setBleeding(true);
                      addLog("You cut yourself on the broken glass!", "error");
                      playSound('ZombieSlash');
                    }
                  }

                  // Update derived state
                  triggerMapUpdate();
                  const newFovTiles = updatePlayerFieldOfView(gameMap, isNight, isFlashlightOnActual, false, getActiveFlashlightRange());
                  refreshZombieTracking(player, newFovTiles);
                  checkZombieAwareness();
                  
                  if (gameMap.emitNoise) {
                    gameMap.emitNoise(targetX, targetY, 4);
                  }
                } else {
                  addLog("Could not move to the other side.", "error");
                }
                setWindowMenu(null);
              }}
            >
              Climb through (3ap)
            </button>
          )}

          {/* Reinforce Window Option */}
          <button
            className={`w-full text-left px-3 py-2 text-sm transition-colors border-t border-[#333] mt-1 ${
              windowMenu.window.reinforcementHp >= 20 
                ? 'text-gray-500 cursor-not-allowed' 
                : 'text-blue-400 hover:bg-accent focus:bg-accent'
            }`}
            onClick={() => {
              if (windowMenu.window.reinforcementHp >= 20) return;

              const player = playerRef.current;
              const inventory = inventoryRef.current;
              if (!player || !inventory) return;

              // Check AP (5 AP required)
              if (player.ap < 5) {
                addEffect({
                  type: 'damage',
                  x: windowMenu.x,
                  y: windowMenu.y,
                  value: 'Insufficient AP',
                  color: '#ef4444',
                  duration: 1000
                });
                setWindowMenu(null);
                return;
              }

              // Check items
              const hasHammer = inventory.hasItemByDefId('weapon.hammer') || inventory.hasItemByDefId('weapon.makeshift_hammer');
              const has2x4 = inventory.hasItemByDefId('weapon.2x4', 1);
              const hasNails = inventory.hasItemByDefId('crafting.nail', 2);

              if (!hasHammer || !has2x4 || !hasNails) {
                let missing = [];
                if (!hasHammer) missing.push("Hammer");
                if (!has2x4) missing.push("2x4");
                if (!hasNails) missing.push("2 Nails");
                
                addEffect({
                  type: 'damage',
                  x: windowMenu.x,
                  y: windowMenu.y,
                  value: `Missing: ${missing.join(', ')}`,
                  color: '#fbbf24',
                  duration: 1500
                });
                setWindowMenu(null);
                return;
              }

              // Execute reinforcement
              if (windowMenu.window.reinforce(10)) {
                player.useAP(5);
                inventory.consumeItemByDefId('weapon.2x4', 1);
                inventory.consumeItemByDefId('crafting.nail', 2);
                
                playSound('Repair');
                addLog('You reinforce the window with 2x4s.', 'world');
                addEffect({
                   type: 'damage',
                   x: windowMenu.x,
                   y: windowMenu.y,
                   value: '+10 HP',
                   color: '#60a5fa',
                   duration: 1000
                });
                triggerMapUpdate();
              }
              setWindowMenu(null);
            }}
          >
            Reinforce (5ap)
          </button>

          {windowMenu.window.isLocked && !windowMenu.window.isOpen && !windowMenu.window.isBroken && (
            <button
              className="w-full text-left px-3 py-2 text-sm text-amber-500 hover:bg-accent focus:bg-accent transition-colors"
              onClick={() => {
                const gameMap = gameMapRef.current;
                const player = playerRef.current;
                if (!gameMap || !player) return;

                const playerTile = gameMap.getTile(player.x, player.y);
                const isInside = playerTile?.terrain === 'floor';

                if (!isInside) {
                  addEffect({
                    type: 'damage',
                    x: windowMenu.x,
                    y: windowMenu.y,
                    value: 'Need key',
                    color: '#fbbf24',
                    duration: 1000
                  });
                  setWindowMenu(null);
                  return;
                }

                // AP cost for unlocking
                if (player.ap < 1) {
                  addEffect({
                    type: 'damage',
                    x: windowMenu.x,
                    y: windowMenu.y,
                    value: 'Insufficient AP',
                    color: '#ef4444',
                    duration: 1000
                  });
                  setWindowMenu(null);
                  return;
                }

                if (windowMenu.window.unlock()) {
                  player.useAP(1);
                  playSound('Unlock');
                  addLog('You unlock the window from the inside.', 'world');
                  triggerMapUpdate();
                }
                setWindowMenu(null);
              }}
            >
              Unlock
            </button>
          )}
          <button
            className="w-full text-left px-3 py-2 text-sm text-gray-400 hover:bg-accent focus:bg-accent transition-colors border-t border-[#333] mt-1"
            onClick={() => setWindowMenu(null)}
          >
            Cancel
          </button>
        </div>
      )}
      {/* Water Context Menu */}
      {waterMenu && (
        <div
          className="fixed z-[10002] bg-[#1a1a1a] border border-[#333] rounded-md shadow-lg py-1 w-32"
          style={{ left: waterMenu.screenX, top: waterMenu.screenY }}
          onMouseLeave={() => setWaterMenu(null)}
        >
          <button
            className="w-full text-left px-3 py-2 text-sm text-white hover:bg-accent focus:bg-accent transition-colors"
            onClick={() => {
              const player = playerRef.current;
              const manager = inventoryRef.current;
              if (!player || !manager) return;

              // Check AP cost (1 AP)
              if (player.ap < 1) {
                addEffect({
                  type: 'damage',
                  x: waterMenu.x,
                  y: waterMenu.y,
                  value: 'Insufficient AP',
                  color: '#ef4444',
                  duration: 1000
                });
                setWaterMenu(null);
                return;
              }

              // Search for the best candidate bottle to fill
              let fillCandidate: any = null;
              let bestPriority = 0; // 0: None, 1: Empty, 2: Partial Dirty

              const evaluateItem = (item: any) => {
                if (!item || (typeof item.isWaterBottle === 'function' ? !item.isWaterBottle() : !item.isWaterBottle)) return;

                const ammo = item.ammoCount || 0;
                const capacity = item.capacity || 20;
                const quality = item.waterQuality || 'clean';

                // Disqualify: Clean water (to prevent contamination)
                if (quality === 'clean' && ammo > 0) return;

                // Priority 2: Partial Dirty (Highest priority for refills)
                if (quality === 'dirty' && ammo > 0 && ammo < capacity) {
                  if (bestPriority < 2) {
                    fillCandidate = item;
                    bestPriority = 2;
                  }
                }
                // Priority 1: Empty
                else if (ammo === 0) {
                  if (bestPriority < 1) {
                    fillCandidate = item;
                    bestPriority = 1;
                  }
                }
              };

              // Search containers
              for (const container of manager.containers.values()) {
                for (const item of container.items.values()) {
                  evaluateItem(item);
                  if (bestPriority === 2) break;
                }
                if (bestPriority === 2) break;
              }

              // Search equipment
              if (bestPriority < 2) {
                for (const item of Object.values(manager.equipment)) {
                  evaluateItem(item);
                  if (bestPriority === 2) break;
                }
              }

              if (fillCandidate) {
                const emptyBottle = fillCandidate; // Keep variable name for minimal diff

                const gameMap = gameMapRef.current;
                const tile = gameMap?.getTile(waterMenu.x, waterMenu.y);
                const manager = inventoryRef.current;
                
                if (tile && tile.terrain === 'water' && manager) {
                  // Calculate how much water space is left (not just capacity)
                  const spaceLeft = (emptyBottle.capacity || 20) - (emptyBottle.ammoCount || 0);
                  const fillAmount = Math.min(spaceLeft, tile.waterAmount || 0);
                  
                  if (fillAmount > 0) {
                    // 1 AP cost
                    player.useAP(1);
                    
                    const fullId = emptyBottle.defId.replace('_empty', '');
                    
                    if (emptyBottle.stackCount > 1) {
                      // SPLIT STACK: Reduce empty stack and create new filled item
                      emptyBottle.stackCount -= 1;
                      
                      const itemData = createItemFromDef(fullId) as any;
                      const filledItem = new Item(itemData);
                      filledItem.ammoCount = fillAmount;
                      filledItem.waterQuality = 'dirty';
                      
                      // Try to add to inventory, fallback to ground
                      const addResult = manager.addItem(filledItem);
                      if (!addResult.success) {
                        manager.dropItemToGround(filledItem);
                        addLog(`Inventory full! Placed ${filledItem.name} on ground.`, 'system');
                      } else {
                        addLog(`Filled ${filledItem.name} and placed in inventory.`, 'item');
                      }
                    } else {
                      // SINGLE ITEM or PARTIAL: Transform or add in place 
                      emptyBottle.defId = fullId;
                      emptyBottle.ammoCount = (emptyBottle.ammoCount || 0) + fillAmount;
                      emptyBottle.waterQuality = 'dirty';
                      // Re-initialize from definition to ensure image and traits are correct
                      const def = createItemFromDef(fullId);
                      emptyBottle.name = def.name;
                      emptyBottle.imageId = def.imageId;
                      addLog(`Filled ${emptyBottle.name}.`, 'item');
                    }

                    tile.waterAmount -= fillAmount;
                    
                    addEffect({
                      type: 'damage',
                      x: waterMenu.x,
                      y: waterMenu.y,
                      value: `Bottle Filled!`,
                      color: '#4ade80',
                      duration: 1000
                    });

                    // Play filling sound
                    playSound('FillBottle');

                    // Check if tile is now empty
                    if (tile.waterAmount <= 0) {
                      tile.terrain = 'grass';
                      tile.waterAmount = 0;
                      addEffect({
                        type: 'damage',
                        x: waterMenu.x,
                        y: waterMenu.y,
                        value: 'Tile Depleted!',
                        color: '#facc15',
                        duration: 1500
                      });
                    }
                  } else {
                    addEffect({
                      type: 'damage',
                      x: waterMenu.x,
                      y: waterMenu.y,
                      value: 'No Water Left!',
                      color: '#ef4444',
                      duration: 1000
                    });
                  }
                }

                // Force UI updates
                triggerMapUpdate();
                forceRefresh();
              } else {
                addEffect({
                  type: 'damage',
                  x: waterMenu.x,
                  y: waterMenu.y,
                  value: 'No refillable bottle!',
                  color: '#ef4444',
                  duration: 1000
                });
              }
              setWaterMenu(null);
            }}
          >
            Fill Bottle
          </button>
          <button
            className="w-full text-left px-3 py-2 text-sm text-gray-400 hover:bg-accent focus:bg-accent transition-colors border-t border-[#333] mt-1"
            onClick={() => setWaterMenu(null)}
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}

// Tile Tooltip Overlay Helper (Phase 6 & Generic Refactor)
const TileTooltipOverlay = ({ hoveredTile, playerFieldOfView }: { hoveredTile: any, playerFieldOfView: any[] | null }) => {
  const { worldToScreen, cameraRef } = useCamera();
  const { gameMapRef } = useGameMap();

  if (!hoveredTile || !cameraRef.current || !gameMapRef.current) return null;

  // Re-fetch data from the map to get fresh stats
  const targetTile = gameMapRef.current.getTile(hoveredTile.x, hoveredTile.y);
  const zombie = targetTile?.contents.find((e: any) => e.type === 'zombie');
  const cropInfo = targetTile?.cropInfo;
  const lootItems = targetTile?.inventoryItems || [];
  const specialBuilding = targetTile?.contents.find((e: any) => e.type === 'place_icon')?.subtype || null;

  // Logic for Zombie visibility: must be in player's current FOV
  const isZombieVisible = zombie && playerFieldOfView && playerFieldOfView.some(pos => pos.x === hoveredTile.x && pos.y === hoveredTile.y);
  
  // Logic for Crop visibility: must be standard crop OR discovered wild crop
  const isCropVisible = cropInfo && (!cropInfo.isWild || cropInfo.discovered);
  
  const isLootVisible = lootItems && lootItems.length > 0;
  
  const isBuildingVisible = !!specialBuilding;

  const door = targetTile?.contents.find((e: any) => e.type === 'door');
  const window = targetTile?.contents.find((e: any) => e.type === 'window');
  
  if (!isZombieVisible && !isCropVisible && !isLootVisible && !isBuildingVisible && !door && !window) return null;

  // Calculate screen position
  const screenPos = worldToScreen(hoveredTile.x, hoveredTile.y);
  
  // Get tileSize from camera (this is the base tile size * zoom)
  const baseTileSize = (cameraRef.current as any).baseTileSize || 48;
  const tileSize = baseTileSize * cameraRef.current.zoomLevel;

  // Position above the tile
  const x = screenPos.x * tileSize;
  const y = screenPos.y * tileSize;

  return (
    <div
      className="absolute z-[10001] pointer-events-none transform -translate-x-1/2 -translate-y-full transition-all duration-200 flex flex-col gap-2 items-center"
      style={{
        left: `${x + tileSize / 2}px`,
        top: `${y - 12}px`,
      }}
    >
      {isZombieVisible && <ZombieTooltip zombie={zombie as any} />}
      {isCropVisible && <CropTooltip cropInfo={cropInfo as any} />}
      {isLootVisible && <LootTooltip items={lootItems} />}
      {isBuildingVisible && <BuildingTooltip type={specialBuilding} />}
      {door && <DoorTooltip door={door} />}
      {window && <WindowTooltip windowEntity={window} />}
      
      {/* Downward arrow/pointer */}
      <div className="w-2.5 h-2.5 bg-[#1a1a1a] border-r border-b border-white/20 transform rotate-45 -mt-3.5 shadow-lg" />
    </div>
  );
};
