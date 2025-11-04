import { cn } from "@/lib/utils";
import { useGridSize } from "@/contexts/GridSizeContext";

interface GridSlotProps {
  item?: any;
  isEmpty?: boolean;
  isHighlighted?: boolean;
  isValidDrop?: boolean;
  className?: string;
  gridType?: 'scalable' | 'fixed';
  onClick?: () => void;
  onContextMenu?: (event: React.MouseEvent) => void;
  onDrop?: (event: React.DragEvent) => void;
  onDragOver?: (event: React.DragEvent) => void;
  onDragStart?: (item: any, event: React.DragEvent) => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  onMouseDown?: (event: React.MouseEvent) => void;
  children?: React.ReactNode;
  itemImageSrc?: string | null;
  imageWidth?: number;
  imageHeight?: number;
  isTopLeft?: boolean;
  isHovered?: boolean;
  "data-testid"?: string;
}

export default function GridSlot({
  item,
  isEmpty = true,
  isHighlighted = false,
  isValidDrop = false,
  className,
  gridType = 'scalable',
  onClick,
  onContextMenu,
  onDrop,
  onDragOver,
  onDragStart,
  onMouseEnter,
  onMouseLeave,
  onMouseDown,
  children,
  itemImageSrc,
  imageWidth,
  imageHeight,
  isTopLeft = false,
  isHovered = false,
  "data-testid": testId,
}: GridSlotProps) {
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

        // Subtle borders like backpack grids
        "border border-border/20 bg-muted/10",

        // Hover state
        !isEmpty ? "hover:bg-muted/40" : "hover:bg-muted/50",

        // Conditional states
        isHighlighted && "bg-accent/20",
        isValidDrop && "bg-green-500/20",
        !isEmpty && "bg-muted/30",

        className
      )}
      style={{
        width: `${slotSize}px`,
        height: `${slotSize}px`,
      }}
      draggable={!isEmpty}
      onClick={onClick}
      onContextMenu={onContextMenu}
      onDrop={onDrop}
      onDragOver={onDragOver}
      onDragStart={handleDragStart}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onMouseDown={onMouseDown}
      onClick={onClick}
      onContextMenu={onContextMenu}
      data-testid={testId}
    >
      {/* All image rendering handled by UniversalGrid overlays */}
      {children}

      {/* Stack count indicator - only show for items with actual images */}
      {item && item.stackCount > 1 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <span className="absolute bottom-0 right-0 text-[0.6rem] font-bold bg-black/70 px-1 rounded z-10">
            {item.stackCount}
          </span>
        </div>
      )}
    </div>
  );
}