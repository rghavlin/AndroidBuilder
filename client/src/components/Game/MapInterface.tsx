import { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useGameMap } from '../../contexts/GameMapContext.jsx';
import { ItemTrait } from '../../game/inventory/traits.js';
import { usePlayer } from '../../contexts/PlayerContext.jsx';
import { useGame } from '../../contexts/GameContext.jsx';
import { useAction } from '../../contexts/ActionContext.jsx';
import { useInventory } from '../../contexts/InventoryContext';
import { useOverlays } from '../../contexts/OverlayContext';
import { useSleep } from '../../contexts/SleepContext.jsx';
import MapCanvas from './MapCanvas.jsx';
import FloatingContainer from '../Inventory/FloatingContainer';
import ContainerGrid from '../Inventory/ContainerGrid';
import { Menu, Hammer } from "lucide-react";
import MainMenuWindow from './MainMenuWindow';
import { ActionSlotButton } from './ActionSlotButton';

import { imageLoader } from '../../game/utils/ImageLoader';
import { EntityType } from '../../game/entities/Entity.js';
import { cn } from "@/lib/utils";
import { useCombat } from '../../contexts/CombatContext.jsx';
import { useVisualEffects } from '../../contexts/VisualEffectsContext.jsx';
import { useCamera } from '../../contexts/CameraContext.jsx';
import engine from '../../game/GameEngine.js';
import { ZombieTooltip } from './ZombieTooltip';
import { CropTooltip } from './CropTooltip';
import { LootTooltip } from './LootTooltip';
import { BuildingTooltip } from './BuildingTooltip';
import { DoorTooltip } from './DoorTooltip';
import { WindowTooltip } from './WindowTooltip';
import { NPCTooltip } from './NPCTooltip';
import { TradeDialog } from './TradeDialog';
import BarterWindow from './BarterWindow';
import { useLog } from '../../contexts/LogContext.jsx';
import { useAudio } from '../../contexts/AudioContext.jsx';
import GameEventLog from './GameEventLog';
import LogHistoryWindow from './LogHistoryWindow';
import PlayerSkillsWindow from './PlayerSkillsWindow';
import { NPCDemandDialog } from './NPCDemandDialog';
import { GridSizeProvider } from "@/contexts/GridSizeContext";
import { createItemFromDef } from '../../game/inventory/ItemDefs.js';
import { Item } from '../../game/inventory/Item.js';
import { ItemContextMenu } from '../Inventory/ItemContextMenu';
import { ItemTooltip } from '../Inventory/ItemTooltip';

interface MapInterfaceProps {
  gameState: {
    turn: number;
    playerName: string;
    location: string;
    zombieCount: number;
  };
}



export default function MapInterface({ gameState }: MapInterfaceProps) {
  // Phase 4: Only use orchestration functions from GameContext
  const {
    isInitialized,
    initializationError,
    initializeGame,
    isNight,
    isFlashlightOn,
    setIsFlashlightOn,
    checkZombieAwareness,
    isAnimatingZombies,
    isSkillsOpen,
    toggleSkills,
    activeNpcDemand,
    handleNpcDemandResponse,
    turnPhase,
    isAutosaving,
    isPlayerTurn
  } = useGame();

  const {
    targetingItem,
    cancelTargetingItem,
    useBreakingToolOnStructure
  } = useAction();

  const { isSleeping } = useSleep();

  // Phase 1: Direct sub-context access 
  const { gameMapRef, worldManagerRef, lastTileClick, hoveredTile, mapTransition, triggerMapUpdate, refreshZombieTracking } = useGameMap();
  const { playerRef, updatePlayerFieldOfView, isMoving: isAnimatingMovement, playerFieldOfView } = usePlayer();

  // Get inventory context for floating containers and selection management
  // MUST BE DECLARED BEFORE isFlashlightOnActual
  const { openContainers, closeContainer, getContainer, selectedItem, clearSelected, groundContainer, inventoryRef, inventoryVersion, forceRefresh } = useInventory();
  const { targetingWeapon, cancelTargeting, performMeleeAttack, performRangedAttack, performGrenadeThrow, performStoneThrow } = useCombat();
  const { addEffect } = useVisualEffects();
  const { worldToScreen, cameraRef } = useCamera();
  const { playSound } = useAudio();
  const { addLog } = useLog();

  const isFlashlightOnActual = useMemo(() => {
    if (!isFlashlightOn) return false;
    const fl = inventoryRef.current?.equipment['flashlight'];
    if (!fl) return false;
    if (fl.hasTrait(ItemTrait.IGNITABLE) && !fl.isLit) return false;
    return true;
  }, [isFlashlightOn, inventoryVersion]);

  const isNightVision = useMemo(() => {
    if (!isFlashlightOnActual) return false;
    const fl = inventoryRef.current?.equipment['flashlight'];
    return fl?.lightType === 'nightvision';
  }, [isFlashlightOnActual, inventoryVersion]);

  const getActiveFlashlightRange = useCallback(() => {
    const flashlight = inventoryRef.current?.equipment['flashlight'];
    if (flashlight) {
      return flashlight.lightRange || 8;
    }
    return 8;
  }, [inventoryVersion]);

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
          if (item.hasTrait(ItemTrait.IGNITABLE) && item.isLit) {
            console.log('[MapInterface] Sync: Extinguishing torch moved to container:', id);
            item.isLit = false;
          }
        }
      }
      // Check other equipment slots
      for (const slot in inv.equipment) {
        if (slot === 'flashlight') continue;
        const item = inv.equipment[slot];
        if (item && item.hasTrait(ItemTrait.IGNITABLE) && item.isLit) {
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
      console.log(`[MapInterface] Sync: FOV update. Light: ${isFlashlightOnActual}, Range: ${range}, TargetScope: ${!!hasScope}, NVG: ${isNightVision}`);
      
      const newFov = updatePlayerFieldOfView(gameMapRef.current, isNight, isFlashlightOnActual, !!hasScope, range, isNightVision);
      refreshZombieTracking(playerRef.current, newFov);
    }
  }, [isFlashlightOn, isFlashlightOnActual, inventoryVersion, isNight, targetingWeapon, updatePlayerFieldOfView, refreshZombieTracking, getActiveFlashlightRange]);

  const {
    logHistoryOpen: isLogHistoryOpen, setLogHistoryOpen: setIsLogHistoryOpen,
    showMainMenu, setShowMainMenu,
    activeTradeNpc, setActiveTradeNpc,
    isBartering, setIsBartering,
    isExtensionOpen, setIsExtensionOpen
  } = useOverlays();
  const [doorMenu, setDoorMenu] = useState<{ x: number, y: number, screenX: number, screenY: number, door: any } | null>(null);
  const [windowMenu, setWindowMenu] = useState<{ x: number, y: number, screenX: number, screenY: number, window: any } | null>(null);
  const [waterMenu, setWaterMenu] = useState<{ x: number, y: number, screenX: number, screenY: number } | null>(null);
  const [npcMenu, setNpcMenu] = useState<{ x: number, y: number, screenX: number, screenY: number, npc: any } | null>(null);
  const mapAreaRef = useRef<HTMLDivElement>(null);

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
      setNpcMenu(null);
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
    // Block all map interactions if it's not the player's turn
    if (!isPlayerTurn || isAutosaving) {
      console.debug('[MapInterface] Map click blocked - Not player turn or autosaving');
      return true; // Consume click
    }

    // Clear any map context menus on click
    setDoorMenu(null);
    setWindowMenu(null);
    setWaterMenu(null);
    setNpcMenu(null);

    // If an item is selected for movement, cancel it and don't process map click
    if (selectedItem) {
      console.debug('[MapInterface] Map clicked while item selected - canceling selection');
      clearSelected();
      return true; // Click was handled (canceled selection)
    }

    // Handle Item Targeting (Crowbar, Grenade, Shovel, Seeds etc)
    if (targetingItem) {
      // Blocking Farming tools from map clicks (must use in Ground Container grid)
      const isFarmingTool = (targetingItem.hasTrait && targetingItem.hasTrait(ItemTrait.CAN_DIG)) || ['food.cornseeds', 'food.tomatoseeds', 'food.carrotseeds'].includes(targetingItem.defId);
      if (isFarmingTool) {
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

      if (targetingItem.defId === 'weapon.grenade' || targetingItem.defId === 'crafting.stone') {
        const result = targetingItem.defId === 'weapon.grenade' 
          ? (performGrenadeThrow as any)(targetingItem, x, y)
          : (performStoneThrow as any)(targetingItem, x, y);

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
    // Block all map interactions if it's not the player's turn
    if (turnPhase !== 'PLAYER_TURN' || isAutosaving) {
      console.debug('[MapInterface] Map right-click blocked - Not player turn or autosaving');
      return; 
    }

    // Phase 1: Right-click to cancel targeting (Grenade throw, Shovel dig, Combat aim)
    if (targetingItem || targetingWeapon) {
      console.log('[MapInterface] Right-click: Canceling active targeting');
      if (targetingItem) cancelTargetingItem();
      if (targetingWeapon) cancelTargeting();
      playSound('Click');
      return;
    }

    const gameMap = gameMapRef.current;
    const player = playerRef.current;
    if (!gameMap || !player) return;

    const tile = gameMap.getTile(x, y);
    if (!tile) return;

    const door = tile.contents.find((e: any) => e.type === EntityType.DOOR);
    if (door) {
      const px = Math.floor(player.x);
      const py = Math.floor(player.y);
      const dx = x - px;
      const dy = y - py;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < 2.5) {
        setDoorMenu({ x, y, screenX, screenY, door });
      } else {
        console.log('[MapInterface] Door too far for interaction:', distance.toFixed(2));
      }
      return;
    }

    const windowEntity = tile.contents.find((e: any) => e.type === EntityType.WINDOW);
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

    const npc = tile.contents.find((e: any) => e.type === EntityType.NPC);
    if (npc) {
      const px = Math.floor(player.x);
      const py = Math.floor(player.y);
      const dx = x - px;
      const dy = y - py;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < 2.5) {
        setNpcMenu({ x, y, screenX, screenY, npc });
      } else {
        console.log('[MapInterface] NPC too far for interaction:', distance.toFixed(2));
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
      <div 
        className="unified-header px-4 flex items-center justify-between shrink-0" 
        style={{ height: 'var(--header-height)' }}
        data-testid="map-header"
      >
        <button
          className="w-9 h-9 bg-zinc-900/60 border border-white/10 rounded flex items-center justify-center hover:bg-zinc-800 transition-all shadow-sm active:scale-95 duration-150"
          title="Main Menu"
          data-testid="main-menu-button"
          onClick={() => setShowMainMenu(true)}
        >
          <Menu className="h-5 w-5 text-foreground/80 hover:text-foreground" />
        </button>

        {/* Action Buttons Group (Better spacing between log and slots) */}
        <div className="flex items-center flex-1 px-2">
          <GameEventLog 
            onClick={() => {
              setIsLogHistoryOpen(prev => !prev);
              setIsExtensionOpen(false); // Close other extension
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
            "w-9 h-9 bg-zinc-900 border transition-all flex items-center justify-center hover:bg-zinc-800 shadow-sm active:scale-95 rounded duration-150",
            isExtensionOpen ? "border-primary/50 bg-zinc-850 shadow-[0_0_12px_rgba(16,185,129,0.2)]" : "border-white/10"
          )}
          title="Crafting/Cooking"
          data-testid="inventory-extension-button"
          onClick={() => setIsExtensionOpen(prev => !prev)}
        >
          <Hammer className={cn(
            "h-5 w-5",
            isExtensionOpen ? "text-primary" : "text-white/40"
          )} />
        </button>
      </div>

      {/* Map Display Area */}
      <div
        ref={mapAreaRef}
        className="flex-1 relative overflow-hidden min-h-0"
        style={{ padding: 0, margin: 0 }}
        onClick={handleMapAreaClick}
      >
        <MapCanvas
          onCellClick={onCellClick}
          onCellRightClick={onCellRightClick}
          selectedItem={selectedItem}
          isTargeting={!!targetingWeapon || (targetingItem ? true : false)}
          isNight={isNight}
          isFlashlightOn={isFlashlightOnActual}
          flashlightRange={getActiveFlashlightRange()}
          isAnimatingZombies={isAnimatingZombies}
          isInitialized={isInitialized}
          isNightVision={isNightVision}
          isPlayerTurn={isPlayerTurn}
          isAutosaving={isAutosaving}
        />

        {/* Turn Processing Indicator */}
        {isAnimatingZombies && !isSleeping && (
          <div className="absolute bottom-2 right-6 z-[1000] pointer-events-none select-none">
            <span className="text-white font-bold italic animate-turn-processing tracking-widest drop-shadow-[0_0_8px_rgba(255,255,255,0.4)] text-sm uppercase">
              Processing turns...
            </span>
          </div>
        )}

        {/* NPC Context Menu */}
        {npcMenu && (
          <div
            className="fixed z-[10002] bg-[#1a1a1a] border border-[#333] rounded-md shadow-lg py-1 w-32 animate-in fade-in zoom-in-95 duration-100"
            style={{ left: npcMenu.screenX, top: npcMenu.screenY }}
            onMouseLeave={() => setNpcMenu(null)}
          >
            <button
              className="w-full text-left px-3 py-2 text-sm text-white hover:bg-accent focus:bg-accent transition-colors font-bold uppercase tracking-wider"
              onClick={() => {
                if (!isPlayerTurn) return;
                setActiveTradeNpc(npcMenu.npc);
                setNpcMenu(null);
                playSound('Click');
              }}
            >
              Trade
            </button>
          </div>
        )}


        {/* Diagnostic log for animation state desync debugging */}
        {process.env.NODE_ENV === 'development' && (
          <div className="hidden">
            {console.log(`[MapInterface] Frame: AnimZ=${isAnimatingZombies}, Sleeping=${engine.isSleeping}, Flashlight=${isFlashlightOnActual}`)}
          </div>
        )}

        {/* Tile Tooltip Overlay (Phase 6 & Generic Refactor) */}
        {(() => {
          if (!hoveredTile) return null;
          
          // Re-check visibility from the cached hoveredTile data (updated in MapCanvas)
          if (!hoveredTile.zombie && !hoveredTile.cropInfo && !hoveredTile.lootItems?.length && !hoveredTile.specialBuilding && !hoveredTile.door && !hoveredTile.window && !hoveredTile.npc) return null;
          
          // Only show if the tile is explored
          const isExplored = gameMapRef.current?.getTile(hoveredTile.x, hoveredTile.y)?.flags?.explored;
          if (!isExplored) return null;

          return (
            <TileTooltipOverlay 
              hoveredTile={hoveredTile} 
              playerFieldOfView={playerFieldOfView}
              containerRef={mapAreaRef}
            />
          );
        })()}
      </div>




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
              if (!isPlayerTurn) return;
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
                const newFovTiles = updatePlayerFieldOfView(gameMap, isNight, isFlashlightOnActual, false, getActiveFlashlightRange(), isNightVision);
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
            className="w-full text-left px-3 py-2 text-sm text-white hover:bg-accent focus:bg-accent transition-colors"
              onClick={() => {
                if (!isPlayerTurn) return;
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
                ? 'text-zinc-500 cursor-not-allowed' 
                : 'text-white hover:bg-accent focus:bg-accent'
            }`}
            onClick={() => {
              if (!isPlayerTurn) return;
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
              const hasPlank = inventory.hasItemByDefId('weapon.plank', 1);
              const hasNails = inventory.hasItemByDefId('crafting.nail', 2);

              if (!hasHammer || !hasPlank || !hasNails) {
                let missing = [];
                if (!hasHammer) missing.push('Hammer');
                if (!hasPlank) missing.push('Plank');
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
              inventory.consumeItemByDefId('weapon.plank', 1);
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
                   const newFovTiles = updatePlayerFieldOfView(gameMap, isNight, isFlashlightOnActual, false, getActiveFlashlightRange(), isNightVision);
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
            className="w-full text-left px-3 py-2 text-sm text-white hover:bg-accent focus:bg-accent transition-colors border-t border-[#333] mt-1"
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
              if (!isPlayerTurn) return;
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
              const newFovTiles = updatePlayerFieldOfView(gameMap, isNight, isFlashlightOnActual, false, getActiveFlashlightRange(), isNightVision);
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
              className="w-full text-left px-3 py-2 text-sm text-white hover:bg-accent focus:bg-accent transition-colors border-t border-[#333] mt-1"
              onClick={() => {
                if (!isPlayerTurn) return;
                const gameMap = gameMapRef.current;
                const player = playerRef.current;
                if (!gameMap || !player) return;

                // Check AP cost (2 AP)
                if (player.ap < 2) {
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
                  player.useAP(2);
                  playSound('Climb');
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
              Climb through (2ap)
            </button>
          )}

          {/* Reinforce Window Option */}
          <button
            className={`w-full text-left px-3 py-2 text-sm transition-colors border-t border-[#333] mt-1 ${
              windowMenu.window.reinforcementHp >= 20 
                ? 'text-zinc-500 cursor-not-allowed' 
                : 'text-white hover:bg-accent focus:bg-accent'
            }`}
            onClick={() => {
              if (!isPlayerTurn) return;
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
              const hasPlank = inventory.hasItemByDefId('weapon.plank', 1);
              const hasNails = inventory.hasItemByDefId('crafting.nail', 2);

              if (!hasHammer || !hasPlank || !hasNails) {
                let missing = [];
                if (!hasHammer) missing.push("Hammer");
                if (!hasPlank) missing.push("Plank");
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
                inventory.consumeItemByDefId('weapon.plank', 1);
                inventory.consumeItemByDefId('crafting.nail', 2);
                
                playSound('Repair');
                addLog('You reinforce the window with planks.', 'world');
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
              className="w-full text-left px-3 py-2 text-sm text-white hover:bg-accent focus:bg-accent transition-colors"
              onClick={() => {
              if (!isPlayerTurn) return;
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
            className="w-full text-left px-3 py-2 text-sm text-white hover:bg-accent focus:bg-accent transition-colors border-t border-[#333] mt-1"
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
              if (!isPlayerTurn) return;
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
                if (!item || !item.hasTrait?.(ItemTrait.WATER_CONTAINER)) return;

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
                      emptyBottle.updateFromDef(fullId);
                      emptyBottle.ammoCount = (emptyBottle.ammoCount || 0) + fillAmount;
                      emptyBottle.waterQuality = 'dirty';
                      
                      // Notify inventory that an item has changed
                      manager.emit('inventoryChanged');
                      
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
            className="w-full text-left px-3 py-2 text-sm text-white hover:bg-accent focus:bg-accent transition-colors border-t border-[#333] mt-1"
            onClick={() => setWaterMenu(null)}
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}

// Helper to calculate the same base tile size as MapCanvas
const calculateBaseTileSize = (width: number, height: number) => {
  const minDim = Math.min(width, height);
  if (minDim === 0) return 48;
  const baseSize = Math.floor(minDim / 14);
  return Math.max(32, Math.min(80, baseSize));
};

// Tile Tooltip Overlay Helper (Phase 6 & Generic Refactor)
const TileTooltipOverlay = ({ hoveredTile, playerFieldOfView, containerRef }: { 
  hoveredTile: any, 
  playerFieldOfView: any[] | null,
  containerRef: React.RefObject<HTMLDivElement>
}) => {
  const { worldToScreen, cameraRef } = useCamera();
  const { gameMapRef } = useGameMap();

  if (!hoveredTile || !cameraRef.current || !gameMapRef.current) return null;

  const screenPos = worldToScreen(hoveredTile.x, hoveredTile.y);
  
  // Use authoritative base tile size from container dimensions if possible
  let baseTileSize = 48;
  if (containerRef.current) {
    const rect = containerRef.current.getBoundingClientRect();
    baseTileSize = calculateBaseTileSize(rect.width, rect.height);
  } else {
    baseTileSize = (cameraRef.current as any).tileSize || 48;
  }
  
  const tileSize = baseTileSize * cameraRef.current.zoomLevel;

  // Re-fetch data from the map to get fresh stats
  const targetTile = gameMapRef.current.getTile(hoveredTile.x, hoveredTile.y);
  
  // PHASE: Visual Hover Fix
  // Since entities move logically before they animate visually, we must search for entities
  // that are VISUALLY at the hovered position, not just those logically in the tile contents.
  const allEntities = gameMapRef.current.getAllEntities();
  const zombie = allEntities.find((e: any) => e.type === 'zombie' && Math.round(e.x) === hoveredTile.x && Math.round(e.y) === hoveredTile.y);
  const npc = allEntities.find((e: any) => e.type === EntityType.NPC && Math.round(e.x) === hoveredTile.x && Math.round(e.y) === hoveredTile.y);
  const door = allEntities.find((e: any) => e.type === 'door' && Math.round(e.x) === hoveredTile.x && Math.round(e.y) === hoveredTile.y);
  const window = allEntities.find((e: any) => e.type === 'window' && Math.round(e.x) === hoveredTile.x && Math.round(e.y) === hoveredTile.y);
  
  const cropInfo = targetTile?.cropInfo;
  const lootItems = targetTile?.inventoryItems || [];
  const specialBuilding = targetTile?.contents.find((e: any) => e.type === 'place_icon')?.subtype || null;

  // Logic for Zombie visibility: must be in player's current FOV (using visual position for check)
  const isZombieVisible = zombie && playerFieldOfView && playerFieldOfView.some(pos => pos.x === Math.round(zombie.x) && pos.y === Math.round(zombie.y));
  
  // Logic for Crop visibility: must be standard crop OR discovered wild crop
  const isCropVisible = cropInfo && (!cropInfo.isWild || cropInfo.discovered);
  
  const isLootVisible = lootItems && lootItems.length > 0;
  
  const isBuildingVisible = !!specialBuilding;

  // NPC Visibility logic: must be in player's current FOV
  const isNpcVisible = npc && playerFieldOfView && playerFieldOfView.some(pos => pos.x === Math.round(npc.x) && pos.y === Math.round(npc.y));
  
  if (!isZombieVisible && !isCropVisible && !isLootVisible && !isBuildingVisible && !door && !window && !isNpcVisible) return null;

  // Calculate absolute screen position by adding container offset
  let x = screenPos.x * tileSize;
  let y = screenPos.y * tileSize;

  if (containerRef.current) {
    const rect = containerRef.current.getBoundingClientRect();
    x += rect.left;
    y += rect.top;
  }

  const tooltipRoot = document.getElementById('tooltip-root');
  if (!tooltipRoot) return null;

  return createPortal(
    <div
      className="absolute z-50 pointer-events-none transform -translate-x-1/2 -translate-y-full transition-all duration-200 flex flex-col gap-2 items-center"
      style={{
        left: `${x + tileSize / 2}px`,
        top: `${y - 4}px`, // Reduced from 12 to 4 to bring it closer to the sprite
      }}
    >
      {isZombieVisible && <ZombieTooltip zombie={zombie as any} />}
      {isCropVisible && <CropTooltip cropInfo={cropInfo as any} />}
      {isLootVisible && <LootTooltip items={lootItems} />}
      {isBuildingVisible && <BuildingTooltip type={specialBuilding} />}
      {door && <DoorTooltip door={door} />}
      {window && <WindowTooltip windowEntity={window} />}
      {isNpcVisible && <NPCTooltip npc={npc} />}
      
      {/* Downward arrow/pointer */}
      <div className="w-2.5 h-2.5 bg-[#1a1a1a] border-r border-b border-white/20 transform rotate-45 -mt-3.5 shadow-lg" />
    </div>,
    tooltipRoot
  );
};
