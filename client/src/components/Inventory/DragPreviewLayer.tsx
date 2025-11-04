
```typescript
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useInventory } from "@/contexts/InventoryContext";
import { imageLoader } from "@/game/utils/ImageLoader";
import { useGridSize } from "@/contexts/GridSizeContext";

// Render counter outside component to persist across renders
let renderCount = 0;

export default function DragPreviewLayer() {
  renderCount++;
  
  const inventoryContext = useInventory();
  const { dragState, updateDragPosition, rotateDrag, cancelDrag } = inventoryContext;
  const { fixedSlotSize } = useGridSize();
  const [itemImage, setItemImage] = useState<string | null>(null);

  console.log('[DragPreviewLayer] RENDER #' + renderCount, {
    hasDragState: !!dragState,
    dragStateValue: dragState,
    dragStateType: typeof dragState,
    dragStateKeys: dragState ? Object.keys(dragState) : [],
    fixedSlotSize,
    itemImage
  });

  // Debug: Log when component mounts/unmounts
  useEffect(() => {
    console.log('[DragPreviewLayer] *** Component MOUNTED ***');
    return () => console.log('[DragPreviewLayer] *** Component UNMOUNTED ***');
  }, []);

  // Debug: Log drag state changes with VERY DETAILED output
  useEffect(() => {
    console.log('[DragPreviewLayer] === DRAG STATE EFFECT TRIGGERED ===');
    console.log('[DragPreviewLayer] dragState value:', dragState);
    console.log('[DragPreviewLayer] Drag state details:', {
      hasDragState: !!dragState,
      itemName: dragState?.item?.name,
      itemInstanceId: dragState?.item?.instanceId,
      imageId: dragState?.item?.imageId,
      cursorPos: dragState ? `(${dragState.cursorX}, ${dragState.cursorY})` : 'N/A',
      rotation: dragState?.rotation,
      originContainerId: dragState?.originContainerId,
      originPos: dragState ? `(${dragState.originX}, ${dragState.originY})` : 'N/A'
    });
    console.log('[DragPreviewLayer] === END DRAG STATE EFFECT ===');
  }, [dragState]);

  // Load item image when drag starts
  useEffect(() => {
    console.log('[DragPreviewLayer] === IMAGE LOAD EFFECT TRIGGERED ===');
    console.log('[DragPreviewLayer] dragState?.item?.imageId:', dragState?.item?.imageId);
    
    if (dragState?.item?.imageId) {
      console.log('[DragPreviewLayer] Starting image load for:', dragState.item.imageId, 'item:', dragState.item.name);
      setItemImage(null); // Clear old image first
      
      imageLoader.getItemImage(dragState.item.imageId)
        .then(img => {
          if (img) {
            console.log('[DragPreviewLayer] ✓ Image loaded successfully:', {
              name: dragState.item.name,
              src: img.src,
              width: img.width,
              height: img.height
            });
            setItemImage(img.src);
          } else {
            console.warn('[DragPreviewLayer] ✗ Image loader returned null for:', dragState.item.name);
          }
        })
        .catch(err => {
          console.error('[DragPreviewLayer] ✗ Image load error:', err);
        });
    } else {
      console.log('[DragPreviewLayer] No imageId, clearing image');
      setItemImage(null);
    }
    console.log('[DragPreviewLayer] === END IMAGE LOAD EFFECT ===');
  }, [dragState?.item?.imageId, dragState?.item?.name]);

  // Track mouse position
  useEffect(() => {
    if (!dragState) {
      console.log('[DragPreviewLayer] Mouse tracking: No dragState, not attaching listener');
      return;
    }

    console.log('[DragPreviewLayer] Mouse tracking: Attaching mousemove listener');
    
    const handleMouseMove = (e: MouseEvent) => {
      updateDragPosition(e.clientX, e.clientY);
    };

    document.addEventListener('mousemove', handleMouseMove);
    return () => {
      console.log('[DragPreviewLayer] Mouse tracking: Removing mousemove listener');
      document.removeEventListener('mousemove', handleMouseMove);
    };
  }, [dragState, updateDragPosition]);

  // Handle rotation (right-click or R key) and cancel (Escape)
  useEffect(() => {
    if (!dragState) return;

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      console.log('[DragPreviewLayer] Right-click - rotating');
      rotateDrag();
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        console.log('[DragPreviewLayer] R key - rotating');
        rotateDrag();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        console.log('[DragPreviewLayer] Escape - canceling drag');
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

  console.log('[DragPreviewLayer] Checking early return condition...');
  if (!dragState) {
    console.log('[DragPreviewLayer] EARLY RETURN: No drag state - returning null');
    console.log('[DragPreviewLayer] === COMPONENT RENDER END (NULL) ===');
    return null;
  }

  const { item, rotation, cursorX, cursorY } = dragState;

  console.log('[DragPreviewLayer] *** RENDERING PREVIEW ***');
  console.log('[DragPreviewLayer] Rendering preview:', {
    itemName: item.name,
    rotation,
    cursorPos: `(${cursorX}, ${cursorY})`,
    hasImage: !!itemImage,
    imageUrl: itemImage
  });

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

  console.log('[DragPreviewLayer] Preview dimensions:', {
    isRotated,
    displayWidth,
    displayHeight,
    pixelWidth,
    pixelHeight,
    position: { left, top }
  });

  const previewContent = (
    <div
      className="fixed pointer-events-none z-[10000] border-2 border-yellow-400"
      style={{
        left: `${left}px`,
        top: `${top}px`,
        width: `${pixelWidth}px`,
        height: `${pixelHeight}px`,
      }}
    >
      {itemImage ? (
        <img
          src={itemImage}
          alt={item.name}
          className="w-full h-full object-contain opacity-80"
          style={{
            transform: `rotate(${rotation}deg)`,
          }}
          onLoad={() => console.log('[DragPreviewLayer] ✓ Image rendered in DOM')}
          onError={(e) => console.error('[DragPreviewLayer] ✗ Image render error:', e)}
        />
      ) : (
        // Show bright placeholder while image loads
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

  console.log('[DragPreviewLayer] Creating portal to document.body');
  console.log('[DragPreviewLayer] === COMPONENT RENDER END (WITH PREVIEW) ===');
  
  // Render as portal to document body to escape stacking context
  return createPortal(previewContent, document.body);
}
```
