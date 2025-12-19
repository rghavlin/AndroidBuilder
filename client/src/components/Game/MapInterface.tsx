import { useEffect, useState } from 'react';
import { useGameMap } from '../../contexts/GameMapContext.jsx';
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
  const [imageSrc, setImageSrc] = useState<string | null>(null);

  // Get item from inventory
  const item = inventoryRef.current?.equipment?.[slot];

  // Load image when item changes
  useEffect(() => {
    let isMounted = true;
    const loadItemImage = async () => {
      if (!item) {
        if (isMounted) setImageSrc(null);
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
  }, [item, inventoryVersion]);

  const handleClick = () => {
    if (item) {
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
        item && "border-green-500 bg-green-500/10 hover:bg-green-500/20"
      )}
      title={item ? item.name : `Empty ${slot} slot`}
    >
      {item && imageSrc ? (
        <img
          src={imageSrc}
          alt={item.name}
          className="w-full h-full object-contain p-0.5"
        />
      ) : null}
    </button>
  );
};

export default function MapInterface({ gameState }: MapInterfaceProps) {
  // Phase 1: Direct sub-context access
  const { lastTileClick, hoveredTile, mapTransition } = useGameMap();

  // Get initialization state from GameContext (still needed for initialization control)
  const { isInitialized, initializationError, initializeGame } = useGame(); // Added initializeGame for retry button

  // Get inventory context for floating containers and selection management
  const { openContainers, closeContainer, getContainer, selectedItem, clearSelected } = useInventory();

  const [isInventoryExtensionOpen, setIsInventoryExtensionOpen] = useState(false);
  const [showMainMenu, setShowMainMenu] = useState(false);

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
      return; // Do not proceed to handle the map click for movement
    }
    // Otherwise, proceed with normal map click handling
    // handleCellClick(x, y); // This function needs to be passed down or accessed differently
  };

  // Block all map area clicks when item is selected
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
          <MapCanvas onCellClick={onCellClick} selectedItem={selectedItem} />
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
    </div>
  );
}