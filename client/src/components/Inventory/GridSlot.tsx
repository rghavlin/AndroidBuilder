import { cn } from "@/lib/utils";
import { memo } from "react";
import { useGridSize } from "@/contexts/GridSizeContext";
import { ItemContextMenu } from "./ItemContextMenu";
import { ItemTooltip } from "./ItemTooltip";

interface GridSlotProps {
  item?: any;
  isEmpty?: boolean;
  isHighlighted?: boolean;
  isValidDrop?: boolean;
  isPreviewValid?: boolean | null;
  className?: string;
  gridType?: 'scalable' | 'fixed';
  onClick?: (event: React.MouseEvent) => void;
  onContextMenu?: (event: React.MouseEvent) => void;
  onDrop?: (event: React.DragEvent) => void;
  onDragOver?: (event: React.DragEvent) => void;
  onDragStart?: (item: any, event: React.DragEvent) => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  children?: React.ReactNode;
  itemImageSrc?: string | null;
  imageWidth?: number;
  imageHeight?: number;
  isTopLeft?: boolean;
  isHovered?: boolean;
  "data-testid"?: string;
}

const GridSlot = memo(({
  item,
  isEmpty = true,
  isHighlighted = false,
  isValidDrop = false,
  isPreviewValid = null,
  className,
  gridType = 'scalable',
  onClick,
  onDrop,
  onDragOver,
  onDragStart,
  onContextMenu,
  onMouseEnter,
  onMouseLeave,
  children,
  isTopLeft = false,
  "data-testid": testId,
}: GridSlotProps) => {
  const { scalableSlotSize, fixedSlotSize } = useGridSize();

  // Choose slot size based on grid type
  const slotSize = gridType === 'fixed' ? fixedSlotSize : scalableSlotSize;

  const handleDragStart = (e: React.DragEvent) => {
    if (item && onDragStart) {
      onDragStart(item, e);
    }
  };

  return (
    <div
      className={cn(
        // Dynamic size
        "flex-shrink-0 flex items-center justify-center text-sm relative",
        !isEmpty ? "cursor-grab active:cursor-grabbing" : "cursor-pointer",
        "transition-colors duration-200",
        // Skeuomorphic inset slot design
        "inset-slot",
        // Hover state
        !isEmpty ? "hover:brightness-110" : "hover:brightness-125",
        // Conditional states
        isHighlighted && "ring-2 ring-accent shadow-[0_0_10px_rgba(250,204,21,0.5)]",
        isValidDrop && "ring-2 ring-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]",
        isPreviewValid === true && "!bg-none !bg-green-500/60 hover:!bg-green-500/60 !border !border-green-400/80",
        isPreviewValid === false && "!bg-none !bg-red-500/60 hover:!bg-red-500/60 !border !border-red-400/80",
        className
      )}
      style={{
        width: `${slotSize}px`,
        height: `${slotSize}px`,
      }}
      draggable={!isEmpty}
      onClick={onClick}
      onDrop={onDrop}
      onDragOver={onDragOver}
      onDragStart={handleDragStart}
      onContextMenu={onContextMenu}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      data-testid={testId}
    >
      {/* All image rendering handled by UniversalGrid overlays */}
      {children}
    </div>
  );
});

export default GridSlot;