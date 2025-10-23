import { useEffect, useState } from 'react';
import { useGameMap } from '../../contexts/GameMapContext.jsx';
import { useGame } from '../../contexts/GameContext.jsx';
import MapCanvas from './MapCanvas.jsx';
import InventoryExtensionWindow from './InventoryExtensionWindow';

interface MapInterfaceProps {
  gameState: {
    turn: number;
    playerName: string;
    location: string;
    zombieCount: number;
  };
}

export default function MapInterface({ gameState }: MapInterfaceProps) {
  // Phase 1: Direct sub-context access
  const { lastTileClick, hoveredTile, mapTransition } = useGameMap();

  // Get initialization state from GameContext (still needed for initialization control)
  const { isInitialized, initializationError, initializeGame } = useGame();
  const [isInventoryExtensionOpen, setIsInventoryExtensionOpen] = useState(false);

  // Initialize game when component mounts
  useEffect(() => {
    if (!isInitialized && !initializationError) {
      // Small delay to ensure provider is ready after hot reloads
      const timer = setTimeout(() => {
        console.log('[MapInterface] Initializing game...');
        initializeGame();
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [isInitialized, initializationError, initializeGame]);

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
  console.log('[MapInterface] isInitialized value:', isInitialized, 'type:', typeof isInitialized);

  // Show initialization error if present
  if (initializationError) {
    return (
      <div className="flex-1 bg-secondary border-r border-border flex flex-col" data-testid="map-interface">
        <div className="flex-1 relative bg-muted game-grid-pattern p-4">
          <div className="absolute inset-4 flex items-center justify-center">
            <div className="text-center">
              <p className="text-destructive text-sm mb-2">Failed to initialize game</p>
              <p className="text-muted-foreground text-xs">{initializationError}</p>
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

  return (
    <div className="flex-1 bg-secondary border-r border-border flex flex-col min-h-0" data-testid="map-interface">
      {/* Header Area */}
      <div className="bg-card border-b border-border p-2 flex items-center justify-between" data-testid="map-header">
        <div className="text-sm text-muted-foreground">
          Map Information Panel - Placeholder Text
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
      <div className="flex-1 relative overflow-hidden min-h-0" style={{ padding: 0, margin: 0 }}>
        {isInitialized ? (
          <MapCanvas />
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
    </div>
  );
}