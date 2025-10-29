
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
  onDrop?: (event: React.DragEvent) => void;
  onDragOver?: (event: React.DragEvent) => void;
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

export default function GridSlot({
  item,
  isEmpty = true,
  isHighlighted = false,
  isValidDrop = false,
  className,
  gridType = 'scalable',
  onClick,
  onDrop,
  onDragOver,
  onMouseEnter,
  onMouseLeave,
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

  return (
    <div
      className={cn(
        // Dynamic size
        "flex-shrink-0 flex items-center justify-center text-sm relative",
        "cursor-pointer transition-colors duration-200",

        // Subtle borders like backpack grids
        "border border-border/20 bg-muted/10",

        // Hover state
        "hover:bg-muted/50",

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
      onClick={onClick}
      onDrop={onDrop}
      onDragOver={onDragOver}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      data-testid={testId}
    >
      {/* Only render in top-left cell of multi-cell items */}
      {isTopLeft && (
        <>
          {/* Multi-cell image rendering */}
          {item && itemImageSrc && imageWidth > 0 && imageHeight > 0 && (
            <img
              src={itemImageSrc}
              alt={item.name || "Item"}
              className={cn(
                "absolute top-0 left-0 pointer-events-none select-none",
                "transition-all duration-150",
                isHovered && "ring-2 ring-primary/60"
              )}
              style={{
                width: `${imageWidth}px`,
                height: `${imageHeight}px`,
                objectFit: 'contain',
                zIndex: 10
              }}
            />
          )}

          {/* Fallback icon for items without images */}
          {item && !itemImageSrc && (
            <div
              className="absolute top-0 left-0 flex items-center justify-center select-none border border-dashed border-muted-foreground/30"
              style={{
                width: '100%',
                height: '100%'
              }}
            >
              <span className="text-sm opacity-80">
                {item.icon || "📦"}
              </span>
            </div>
          )}
        </>
      )}

      {/* Non-top-left cells of multi-cell items remain visually empty */}
      
      {children}
    </div>
  );
}
