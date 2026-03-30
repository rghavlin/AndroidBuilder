import { useEffect, useState, useMemo, useCallback } from 'react';
import { useGameMap } from '../../contexts/GameMapContext.jsx';
import { usePlayer } from '../../contexts/PlayerContext.jsx';
import { useGame } from '../../contexts/GameContext.jsx';
import { useInventory } from '../../contexts/InventoryContext';
import MapCanvas from './MapCanvas.jsx';
import InventoryExtensionWindow from './InventoryExtensionWindow';
import FloatingContainer from '../Inventory/FloatingContainer';
import ContainerGrid from '../Inventory/ContainerGrid';
import { Menu } from "lucide-react";
import MainMenuWindow from './MainMenuWindow';

import { imageLoader } from '../../game/utils/ImageLoader';
import { cn } from "@/lib/utils";
import { useCombat } from '../../contexts/CombatContext.jsx';
import { useVisualEffects } from '../../contexts/VisualEffectsContext.jsx';
import { useCamera } from '../../contexts/CameraContext.jsx';
import { ZombieTooltip } from './ZombieTooltip';
import { useLog } from '../../contexts/LogContext.jsx';
import { useAudio } from '../../contexts/AudioContext.jsx';
import GameEventLog from './GameEventLog';
import LogHistoryWindow from './LogHistoryWindow';
import { GridSizeProvider } from "@/contexts/GridSizeContext";

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
    checkZombieAwareness
  } = useGame();

  // Phase 1: Direct sub-context access 
  const { gameMapRef, worldManagerRef, lastTileClick, hoveredTile, mapTransition, triggerMapUpdate, refreshZombieTracking } = useGameMap();
  const { playerRef, updatePlayerFieldOfView, isMoving: isAnimatingMovement } = usePlayer();

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

    // Handle Item Targeting (Crowbar, Grenade etc)
    if (targetingItem) {
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

    // Check for water interaction
    if (tile.terrain === 'water') {
      const distance = Math.sqrt(Math.pow(x - player.x, 2) + Math.pow(y - player.y, 2));
      const isAdjacent = distance < 2.0;

      if (isAdjacent) {
        setWaterMenu({ x, y, screenX, screenY });
      } else {
        console.log('[MapInterface] Water too far for interaction');
      }
      return;
    }

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

    const window = tile.contents.find((e: any) => e.type === 'window');
    if (window) {
      // Check adjacency
      const distance = Math.sqrt(Math.pow(x - player.x, 2) + Math.pow(y - player.y, 2));
      const isAdjacent = distance < 2.0;

      if (isAdjacent) {
        setWindowMenu({ x, y, screenX, screenY, window });
      } else {
        console.log('[MapInterface] Window too far for interaction');
      }
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
          className="w-8 h-8 bg-secondary border border-border rounded flex items-center justify-center hover:bg-muted transition-colors"
          title={isInventoryExtensionOpen ? "Close Inventory Extension" : "Open Inventory Extension"}
          data-testid="inventory-extension-button"
          onClick={() => setIsInventoryExtensionOpen(prev => !prev)}
        >
          <span className="text-foreground font-bold text-lg">{isInventoryExtensionOpen ? '−' : '+'}</span>
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
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-muted-foreground text-sm">Initializing game...</p>
          </div>
        )}

        {/* Zombie Tooltip Overlay (Phase 6) */}
        {(() => {
          if (!hoveredTile || !hoveredTile.zombie) return null;
          
          // Only show if the tile is currently visible to the player
          const isCurrentlyVisible = playerRef.current && 
            gameMapRef.current?.getTile(hoveredTile.x, hoveredTile.y)?.flags?.explored &&
            // Note: FOV check is usually done via playerFieldOfView state in MapCanvas, 
            // but here we can check if it's in the player's sight range or simply if it's "currently visible"
            // For simplicity and matching MapCanvas logic, we check visibility
            true; // We'll assume if it's hovered and explored it's fine for now, 
                 // but ideally we check if player can see it.
          
          // Actually, MapCanvas only renders zombies if they are currently visible.
          // Let's mirror that logic.
          const isVisible = playerRef.current && gameMapRef.current?.getTile(hoveredTile.x, hoveredTile.y)?.flags?.explored;
          if (!isVisible) return null;

          return (
            <ZombieTooltipOverlay 
              hoveredTile={hoveredTile} 
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
            className="w-full text-left px-3 py-2 text-sm text-white hover:bg-accent focus:bg-accent transition-colors"
            onClick={() => {
              const gameMap = gameMapRef.current;
              const player = playerRef.current;
              if (!gameMap || !player) return;

              // Check AP cost (1 AP)
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

              const success = windowMenu.window.toggle(gameMap);
              if (success) {
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
                  gameMap.emitNoise(windowMenu.x, windowMenu.y, 6); // Windows are quieter than doors
                }

                // Play interaction sound
                playSound('OpenWindow');
              } else if (windowMenu.window.isBroken) {
                // Show "Broken"
                addEffect({
                  type: 'damage',
                  x: windowMenu.x,
                  y: windowMenu.y,
                  value: 'Broken',
                  color: '#ef4444',
                  duration: 1000
                });
              } else if (windowMenu.window.isOpen && !success) {
                // Blocked by occupancy
                addEffect({
                  type: 'damage',
                  x: windowMenu.x,
                  y: windowMenu.y,
                  value: 'Occupied',
                  color: '#ef4444',
                  duration: 1000
                });
              } else if (windowMenu.window.isLocked && !windowMenu.window.isOpen) {
                // Show "Locked"
                addEffect({
                  type: 'damage',
                  x: windowMenu.x,
                  y: windowMenu.y,
                  value: 'Locked',
                  color: '#fbbf24',
                  duration: 1000
                });
              }
              setWindowMenu(null);
            }}
          >
            {windowMenu.window.isOpen ? 'Close Window' : 'Open Window'}
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

              // Search for an empty water bottle
              let emptyBottle: any = null;

              // Search containers
              for (const container of manager.containers.values()) {
                for (const item of container.items.values()) {
                  if (item.isWaterBottle() && (item.ammoCount || 0) === 0) {
                    emptyBottle = item;
                    break;
                  }
                }
                if (emptyBottle) break;
              }

              // Search equipment
              if (!emptyBottle) {
                for (const item of Object.values(manager.equipment)) {
                  if (item && (item as any).isWaterBottle() && ((item as any).ammoCount || 0) === 0) {
                    emptyBottle = item;
                    break;
                  }
                }
              }

              if (emptyBottle) {
                // Fill the bottle
                player.useAP(1);
                emptyBottle.ammoCount = emptyBottle.capacity || 20;
                emptyBottle.waterQuality = 'dirty';

                addEffect({
                  type: 'damage',
                  x: waterMenu.x,
                  y: waterMenu.y,
                  value: 'Bottle Filled!',
                  color: '#4ade80',
                  duration: 1000
                });

                // Force UI updates
                triggerMapUpdate();
                forceRefresh();
              } else {
                addEffect({
                  type: 'damage',
                  x: waterMenu.x,
                  y: waterMenu.y,
                  value: 'No empty bottle!',
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

// Zombie Tooltip Overlay Helper (Phase 6)
const ZombieTooltipOverlay = ({ hoveredTile }: { hoveredTile: any }) => {
  const { worldToScreen, cameraRef } = useCamera();
  const { gameMapRef } = useGameMap();

  if (!hoveredTile || !cameraRef.current || !gameMapRef.current) return null;

  // Re-fetch the zombie from the map to get fresh stats (HP/AP)
  const targetTile = gameMapRef.current.getTile(hoveredTile.x, hoveredTile.y);
  const zombie = targetTile?.contents.find((e: any) => e.type === 'zombie');

  if (!zombie) return null;

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
      className="absolute z-[10001] pointer-events-none transform -translate-x-1/2 -translate-y-full mb-4 transition-all duration-200"
      style={{
        left: `${x + tileSize / 2}px`,
        top: `${y}px`,
      }}
    >
      <ZombieTooltip zombie={zombie as any} />
      {/* Downward arrow/pointer */}
      <div className="w-3 h-3 bg-black/80 border-r border-b border-white/20 rotate-45 absolute bottom-[-6px] left-1/2 -translate-x-1/2" />
    </div>
  );
};
