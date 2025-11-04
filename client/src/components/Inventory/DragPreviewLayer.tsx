
import { useEffect, useState } from "react";
import { useInventory } from "@/contexts/InventoryContext";
import { imageLoader } from "@/game/utils/ImageLoader";
import { useGridSize } from "@/contexts/GridSizeContext";

export default function DragPreviewLayer() {
  const { dragState, updateDragPosition, rotateDrag, cancelDrag } = useInventory();
  const { fixedSlotSize } = useGridSize();
  const [itemImage, setItemImage] = useState<string | null>(null);

  // Load item image when drag starts
  useEffect(() => {
    if (dragState?.item?.imageId) {
      imageLoader.getItemImage(dragState.item.imageId).then(img => {
        if (img) setItemImage(img.src);
      });
    } else {
      setItemImage(null);
    }
  }, [dragState?.item?.imageId]);

  // Track mouse position
  useEffect(() => {
    if (!dragState) return;

    const handleMouseMove = (e: MouseEvent) => {
      updateDragPosition(e.clientX, e.clientY);
    };

    document.addEventListener('mousemove', handleMouseMove);
    return () => document.removeEventListener('mousemove', handleMouseMove);
  }, [dragState, updateDragPosition]);

  // Handle rotation (right-click or R key)
  useEffect(() => {
    if (!dragState) return;

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      rotateDrag();
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        rotateDrag();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        cancelDrag();
      }
    };

    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [dragState, rotateDrag, cancelDrag]);

  if (!dragState) return null;

  const { item, rotation, cursorX, cursorY } = dragState;
  
  // Don't render if we don't have a valid cursor position yet
  if (cursorX === 0 && cursorY === 0) {
    console.debug('[DragPreviewLayer] Waiting for cursor position...');
    return null;
  }

  if (!itemImage) {
    console.debug('[DragPreviewLayer] Waiting for item image...');
    return null;
  }

  const GAP_SIZE = 2;

  // Calculate dimensions based on rotation
  const isRotated = rotation === 90 || rotation === 270;
  const displayWidth = isRotated ? item.height : item.width;
  const displayHeight = isRotated ? item.width : item.height;
  
  const pixelWidth = (displayWidth * fixedSlotSize) + ((displayWidth - 1) * GAP_SIZE);
  const pixelHeight = (displayHeight * fixedSlotSize) + ((displayHeight - 1) * GAP_SIZE);

  // Center the preview on cursor
  const left = cursorX - pixelWidth / 2;
  const top = cursorY - pixelHeight / 2;

  console.debug('[DragPreviewLayer] Rendering preview:', {
    item: item.name,
    rotation,
    cursorPos: `(${cursorX}, ${cursorY})`,
    displaySize: `${displayWidth}x${displayHeight}`,
    pixelSize: `${pixelWidth}x${pixelHeight}`,
    position: `(${left}, ${top})`
  });

  return (
    <div
      className="fixed pointer-events-none z-[10000]"
      style={{
        left: `${left}px`,
        top: `${top}px`,
        width: `${pixelWidth}px`,
        height: `${pixelHeight}px`,
      }}
    >
      <img
        src={itemImage}
        alt={item.name}
        className="w-full h-full object-contain opacity-80"
        style={{
          transform: `rotate(${rotation}deg)`,
        }}
      />
      
      {/* Rotation indicator */}
      <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-xs text-white bg-black/75 px-2 py-1 rounded whitespace-nowrap">
        {item.name} ({displayWidth}×{displayHeight}) {rotation}°
      </div>
    </div>
  );
}
