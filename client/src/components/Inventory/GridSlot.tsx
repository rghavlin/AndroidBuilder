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
  children?: React.ReactNode;
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
  children,
  "data-testid": testId,
}: GridSlotProps) {
  const { scalableSlotSize, fixedSlotSize } = useGridSize();

  // Choose slot size based on grid type
  const slotSize = gridType === 'fixed' ? fixedSlotSize : scalableSlotSize;

  return (
    <div
      className={cn(
        // Dynamic size
        "flex-shrink-0 flex items-center justify-center text-sm",
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
      data-testid={testId}
    >
      {item && (
        <span className="text-sm opacity-80 select-none">
          {item.icon || "📦"}
        </span>
      )}
      {children}
    </div>
  );
}