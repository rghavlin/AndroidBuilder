import { isLightTheme } from "@/lib/utils";
import { useInventory } from "@/contexts/InventoryContext";
import UniversalGrid from "./UniversalGrid";
import { useGame } from "@/contexts/GameContext.jsx";
import { imageLoader } from "@/game/utils/ImageLoader";
import { useTheme } from "@/contexts/ThemeContext";

export default function GroundItemsGrid() {
  const { getContainer, inventoryVersion, moveItem, inventoryRef } = useInventory();
  const { engine } = useGame();

  // Get ground container (triggers re-render when inventoryVersion changes)
  const groundContainer = getContainer('ground');

  const handleSlotClick = (x: number, y: number) => {
    console.log(`Ground slot (${x}, ${y}) clicked`);
  };

  const handleSlotDrop = (x: number, y: number, event: React.DragEvent) => {
    event.preventDefault();
    const itemId = event.dataTransfer.getData('itemId');
    const fromContainerId = event.dataTransfer.getData('fromContainerId');

    if (!itemId || !fromContainerId || !groundContainer) {
      console.warn('[GroundItemsGrid] Invalid drop data - drop rejected', { itemId, fromContainerId, hasContainer: !!groundContainer });
      return;
    }

    // Verify item exists in source container before attempting move
    const sourceContainer = getContainer(fromContainerId);
    if (!sourceContainer) {
      console.error('[GroundItemsGrid] Source container not found:', fromContainerId);
      return;
    }

    const item = sourceContainer.items.get(itemId);
    if (!item) {
      console.error('[GroundItemsGrid] Item not found in source container:', itemId);
      return;
    }

    if (!item.instanceId) {
      console.error('[GroundItemsGrid] REJECT DROP: Item has no instanceId:', item.name);
      return;
    }

    console.log(`[GroundItemsGrid] Attempting move: item ${itemId} (${item.name}) from ${fromContainerId} to ground at (${x}, ${y})`);
    const result = moveItem(itemId, fromContainerId, groundContainer.id, x, y);

    if (!result.success) {
      console.error('[GroundItemsGrid] Move FAILED:', result.reason, '- item should remain in source container');
    } else {
      console.log('[GroundItemsGrid] Move SUCCESS - item now on ground');
    }
  };

  const handleSort = () => {
    if (inventoryRef.current) {
      const result = inventoryRef.current.sortGroundItems();
      console.log('Ground items sorted:', result);
    }
  };


  // Show empty state if no ground container
  if (!groundContainer) {
    return (
      <div className="w-1/2 p-3 flex flex-col h-full items-center justify-center" data-testid="ground-items-grid">
        <div className="text-muted-foreground text-sm">
          No ground container available
        </div>
      </div>
    );
  }

  const playerX = engine?.player?.x;
  const playerY = engine?.player?.y;
  const playerTile = (playerX !== undefined && playerY !== undefined && engine?.gameMap)
    ? engine.gameMap.getTile(playerX, playerY)
    : null;
  const terrain = playerTile?.terrain === 'transition' ? 'road' : (playerTile?.terrain || 'grass');

  // Support fallback colors for when tile textures are disabled ('none')
  const terrainColors: Record<string, string> = {
    'grass': '#1a3c1a',
    'road': '#2d2d2d',
    'transition': '#2d2d2d',
    'sidewalk': '#555',
    'wall': '#888',     // High-contrast structural gray
    'building': '#777', // Concrete/Building gray
    'fence': '#4a3728', 
    'tree': '#064e3b',
    'tent_wall': '#78716c',
    'tent_floor': '#5b4d3d', 
    'floor': '#333', 
    'water': '#1a3c5a',
    'dirt': '#3d2b1f'
  };
  const isStructural = ['wall', 'building', 'fence', 'tent_wall', 'water'].includes(terrain);
  const tileColor = (isStructural ? terrainColors[terrain] : (playerTile?.color || terrainColors[terrain])) || '#222';

  const { theme } = useTheme();

  const isNoneTileSet = imageLoader.tileSet === 'none';
  const isSpriteSheet = imageLoader.tileSet === 'spritesheet';
  const subFolder = imageLoader.tileSet === 'standard' ? '' : `${imageLoader.tileSet}/`;
  // The tile-texture background is a dark-theme-only feature. In the light themes ground slots
  // have a solid background so the texture would be invisible anyway — and the image still bleeds
  // through semi-transparent placement previews. Suppress the URL outside dark mode.
  const tileImageUrl = (isNoneTileSet || isSpriteSheet || isLightTheme(theme)) ? undefined : `./images/tiles/${subFolder}${terrain}.png`;

  return (
    <div className="w-1/2 p-3 flex flex-col h-full" data-testid="ground-items-grid">
      <div className="flex flex-col h-full w-fit mx-auto">
        <div className="flex items-center justify-between mb-3 flex-shrink-0">
          <h3 className="text-sm font-semibold text-muted-foreground section-plaque">
            GROUND
          </h3>
          <button
            onClick={handleSort}
            className="text-xs px-2.5 py-1 bg-secondary hover:bg-secondary/80 text-secondary-foreground rounded border border-border transition-colors font-medium cursor-pointer section-plaque"
          >
            Sort
          </button>
        </div>

        <div className="flex-1 min-h-0 rounded border border-border overflow-hidden relative bg-background">
          <UniversalGrid
            containerId={groundContainer.id}
            width={groundContainer.width}
            height={groundContainer.height}
            gridType="scalable"
            maxHeight="100%"
            maxWidth="100%"
            enableScroll={true}
            enableHorizontalScroll={true}
            onSlotClick={handleSlotClick}
            onSlotDrop={handleSlotDrop}
            isTransparentGround={!!tileImageUrl}
            tileImageUrl={tileImageUrl}
            className="h-full"
          />
        </div>
      </div>
    </div>
  );
}