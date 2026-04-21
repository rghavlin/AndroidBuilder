import { useInventory } from '../../contexts/InventoryContext';
import { useGame } from '../../contexts/GameContext.jsx';
import UniversalGrid from './UniversalGrid';
import { Button } from '../ui/button';
import { cn } from '@/lib/utils';

interface FloatingContainerOverlayProps {
  item: any;
  slotSize: number;
  gapSize: number;
}

export default function FloatingContainerOverlay({ item, slotSize, gapSize }: FloatingContainerOverlayProps) {
  const { startDrag, stopDrag } = useInventory();
  const { engine } = useGame();
  
  // Get the internal container of the wagon/sled
  const containerGrid = item.getContainerGrid?.();
  
  const isDragging = engine?.dragging?.item.instanceId === item.instanceId;

  const handleTogglePull = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isDragging) {
      stopDrag();
    } else {
      // Logic to start dragging the wagon/sled
      // We use the startDrag mechanism from InventoryContext
      const ground = engine.inventoryManager.getContainer('ground');
      if (ground) {
        startDrag(item, 'ground', item.x, item.y);
      }
    }
  };

  if (!containerGrid) return null;

  return (
    <div 
      className="absolute inset-0 z-50 flex flex-col pointer-events-auto bg-black/40 backdrop-blur-[1px] border border-white/30 rounded-sm"
      onClick={(e) => e.stopPropagation()}
      onMouseMove={(e) => e.stopPropagation()}
    >
      {/* Control Panel (Top Row) */}
      <div className="flex-1 min-h-0 bg-black/60 border-b border-white/20 flex items-center justify-start p-1 px-1.5">
        <Button 
          size="sm" 
          variant={isDragging ? "destructive" : "secondary"}
          className="h-6 text-[10px] px-3 py-0 font-bold uppercase tracking-wider shadow-[0_0_10px_rgba(0,0,0,0.5)]"
          onClick={handleTogglePull}
        >
          {isDragging ? "Drop" : "Pull"}
        </Button>
      </div>

      {/* 4x5 Grid Overlay (Bottom 5 Rows) */}
      <div 
        className="flex-shrink-0"
        style={{ height: `${(5 * slotSize) + (4 * gapSize)}px` }}
      >
        <UniversalGrid
          containerId={containerGrid.id}
          container={containerGrid}
          width={containerGrid.width}
          height={containerGrid.height}
          gridType="fixed"
          slotClassName="bg-white/5 border border-white/10"
          className="h-full w-full"
        />
      </div>
    </div>
  );
}
