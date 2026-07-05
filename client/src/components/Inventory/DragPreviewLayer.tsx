
import { useEffect, useState } from "react";
import { useInventory } from "@/contexts/InventoryContext";
import { imageLoader } from "@/game/utils/ImageLoader";
import { useGridSize } from "@/contexts/GridSizeContext";
import { GAP_SIZE } from "./constants";
import { useTheme } from "../../contexts/ThemeContext";

export default function DragPreviewLayer() {
  const inventoryContext = useInventory();
  const { theme } = useTheme();
  const isLight = theme !== 'dark';
  const { dragState, updateDragPosition, rotateDrag, cancelDrag } = inventoryContext;
  const { fixedSlotSize } = useGridSize();
  const [itemImage, setItemImage] = useState<string | null>(null);

  // Load item image when drag starts
  useEffect(() => {
    if (dragState?.item?.imageId) {
      setItemImage(null); // Clear old image first
      imageLoader.getItemImage(dragState.item.imageId)
        .then(img => {
          if (img) {
            setItemImage(img.src);
          } else {
            console.warn('[DragPreviewLayer] Image loader returned null for:', dragState.item.name);
          }
        })
        .catch(err => {
          console.warn('[DragPreviewLayer] Image load error:', err);
        });
    } else {
      setItemImage(null);
    }
  }, [dragState?.item?.imageId, dragState?.item?.name]);

  // Track mouse position
  useEffect(() => {
    if (!dragState) return;
    const handleMouseMove = (e: MouseEvent) => {
      updateDragPosition(e.clientX, e.clientY);
    };
    document.addEventListener('mousemove', handleMouseMove);
    return () => document.removeEventListener('mousemove', handleMouseMove);
  }, [dragState, updateDragPosition]);

  // Handle rotation (right-click or R key) and cancel (Escape)
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

  // Calculate dimensions based on rotation
  const isRotated = rotation === 90 || rotation === 270;
  const displayWidth = isRotated ? item.height : item.width;
  const displayHeight = isRotated ? item.width : item.height;
  
  const pixelWidth = (displayWidth * fixedSlotSize) + ((displayWidth - 1) * GAP_SIZE);
  const pixelHeight = (displayHeight * fixedSlotSize) + ((displayHeight - 1) * GAP_SIZE);

  // Center the preview on cursor
  const left = cursorX - pixelWidth / 2;
  const top = cursorY - pixelHeight / 2;

  return (
    <div
      className="fixed pointer-events-none z-50 border-2 border-yellow-400"
      style={{
        left: `${left}px`,
        top: `${top}px`,
        width: `${pixelWidth}px`,
        height: `${pixelHeight}px`,
      }}
    >
      {itemImage ? (
        <img
          key={`${item.instanceId}:${theme}`}
          src={itemImage}
          alt={item.name}
          className={`w-full h-full object-contain opacity-80 max-w-none ${!item?.backgroundColor ? (isLight ? 'mix-blend-multiply' : 'mix-blend-screen') : ''}`}
          style={{
            transform: `rotate(${rotation}deg)`,
            filter: (theme === 'light2' && !item?.backgroundColor) ? 'invert(0.75)' : (theme === 'light' && !item?.backgroundColor) ? 'invert(1)' : undefined
          }}
        />
      ) : (
        <div className="w-full h-full border-2 border-dashed border-yellow-400 bg-yellow-400/20 flex items-center justify-center">
          <span className="text-sm text-yellow-400 font-bold">Loading {item.name}...</span>
        </div>
      )}
      
      {/* Rotation indicator */}
      <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-xs text-white bg-black/75 px-2 py-1 rounded whitespace-nowrap">
        {item.name} ({displayWidth}×{displayHeight}) {rotation}°
      </div>
    </div>
  );
}
