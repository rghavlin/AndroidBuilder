import { cn } from "@/lib/utils";
import { useInventory } from "@/contexts/InventoryContext";

interface EquipmentSlotProps {
  slot: string;
  label: string;
  item?: any | null;
  className?: string;
}

export default function EquipmentSlot({
  slot,
  label,
  item = null,
  className,
}: EquipmentSlotProps) {
  const { unequipItem } = useInventory();
  const isEmpty = !item;

  const handleRightClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (item) {
      const result = unequipItem(slot);
      if (result.success) {
        console.log(`Unequipped ${item.name} from ${slot}, placed in ${result.placedIn}`);
      } else {
        console.warn(`Failed to unequip from ${slot}:`, result.reason);
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    // TODO: Implement drag-drop equip in next iteration
    console.log(`Item dropped on ${slot} slot`);
  };

  return (
    <div
      className={cn(
        "flex items-center justify-center",
        "border-2 rounded",
        isEmpty
          ? "border-dashed border-muted-foreground/30 bg-muted/20"
          : "border-accent bg-accent/10",
        "transition-colors hover:border-accent/50",
        "cursor-pointer",
        className
      )}
      data-testid={`equipment-slot-${slot}`}
      title={isEmpty ? label : `${item.name} (right-click to unequip)`}
      onContextMenu={handleRightClick}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {isEmpty ? (
        <span className="text-xs text-muted-foreground select-none">
          {label}
        </span>
      ) : (
        <span className="text-xs font-semibold text-accent select-none">
          {item.name.substring(0, 3).toUpperCase()}
        </span>
      )}
    </div>
  );
}