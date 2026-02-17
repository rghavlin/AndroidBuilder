import { useEffect, useState } from 'react';
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

interface MapInterfaceProps {
  gameState: {
    turn: number;
    playerName: string;
    location: string;
    zombieCount: number;
  };
}

// Action Button Component
const ActionSlotButton = ({ slot }: { slot: string }) => {
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
  const isTargeting = targetingWeapon?.item.instanceId === item?.instanceId;

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
    if (item && (slot === 'melee' || slot === 'handgun' || slot === 'long_gun')) {
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
        item && !isTargeting && "border-green-500 bg-green-500/10 hover:bg-green-500/20",
        // Targeting state: Bright red outline/glow
        item && isTargeting && "border-red-500 bg-red-500/30 shadow-[0_0_8px_rgba(239,68,68,0.5)]"
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
  // Phase 1: Direct sub-context access
  const { gameMapRef, worldManagerRef, lastTileClick, hoveredTile, mapTransition, triggerMapUpdate, refreshZombieTracking } = useGameMap();
  const { playerRef, updatePlayerFieldOfView } = usePlayer();

  // Phase 4: Only use orchestration functions from GameContext
  const {
    isInitialized,
    initializationError,
    initializeGame,
    targetingItem,
    cancelTargetingItem,
    useCrowbarOnDoor
  } = useGame();

  // Get inventory context for floating containers and selection management
  const { openContainers, closeContainer, getContainer, selectedItem, clearSelected, groundContainer, inventoryRef, forceRefresh } = useInventory();
  const { targetingWeapon, cancelTargeting, performMeleeAttack, performRangedAttack } = useCombat();
  const { addEffect } = useVisualEffects();

  const [isInventoryExtensionOpen, setIsInventoryExtensionOpen] = useState(false);
  const [showMainMenu, setShowMainMenu] = useState(false);
  const [doorMenu, setDoorMenu] = useState<{ x: number, y: number, screenX: number, screenY: number, door: any } | null>(null);
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
    // If an item is selected for movement, cancel it and don't process map click
    if (selectedItem) {
      console.debug('[MapInterface] Map clicked while item selected - canceling selection');
      clearSelected();
      return true; // Click was handled (canceled selection)
    }

    // Handle Item Targeting (Crowbar etc)
    if (targetingItem) {
      const result = useCrowbarOnDoor(x, y);
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

        {/* Action Buttons Group (Centered) */}
        <div className="flex gap-2 justify-center flex-1">
          {['melee', 'handgun', 'long_gun', 'flashlight'].map((slot) => (
            <ActionSlotButton
              key={slot}
              slot={slot}
            />
          ))}
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
            isTargeting={!!targetingWeapon || !!targetingItem}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-muted-foreground text-sm">Initializing game...</p>
          </div>
        )}
      </div>

      {/* Inventory Extension Window */}
      <InventoryExtensionWindow
        isOpen={isInventoryExtensionOpen}
        onClose={() => setIsInventoryExtensionOpen(false)}
      />
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

              const success = doorMenu.door.toggle(gameMap);
              if (success) {
                // Consume 1 AP
                player.useAP(1);
                // Force map re-render
                triggerMapUpdate();
                // Update FOV immediately and capture new visible tiles
                const newFovTiles = updatePlayerFieldOfView(gameMap);
                // Refresh zombie tracking with new FOV
                refreshZombieTracking(player, newFovTiles);
              } else if (doorMenu.door.isOpen && !success) {
                // Check if it was blocked by occupancy (toggle returned false while open)
                // We show "Occupied" floating message
                addEffect({
                  type: 'damage',
                  x: doorMenu.x,
                  y: doorMenu.y,
                  value: 'Occupied',
                  color: '#ef4444', // Red color for blocked action
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
                console.log('[MapInterface] Unlock option clicked (NYI)');
                setDoorMenu(null);
              }}
            >
              Unlock (Locked)
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