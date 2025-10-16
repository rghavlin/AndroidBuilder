
import { cn } from "@/lib/utils";

interface EquipmentSlotProps {
  slotId: string;
  item?: any;
  isEquipped?: boolean;
  onClick?: () => void;
  className?: string;
}

export default function EquipmentSlot({
  slotId,
  item,
  isEquipped = false,
  onClick,
  className
}: EquipmentSlotProps) {
  return (
    <div
      className={cn(
        "w-12 h-12 bg-secondary border-2 border-border rounded-md",
        "flex items-center justify-center cursor-pointer",
        "hover:border-accent transition-colors",
        isEquipped && "border-accent bg-accent/10",
        className
      )}
      onClick={onClick}
      data-testid={`equipment-slot-${slotId}`}
    >
      {item && (
        <span className="text-lg" title={item.name}>
          {item.icon || "📦"}
        </span>
      )}
      {!item && (
        <span className="text-muted-foreground/50 text-xs">
          {slotId.charAt(0).toUpperCase()}
        </span>
      )}
    </div>
  );
}
