import EquipmentSlot from "./EquipmentSlot";
import { useGridSize } from "@/contexts/GridSizeContext";
import { useInventory } from "@/contexts/InventoryContext";

export default function EquipmentSlots() {
  const { fixedSlotSize } = useGridSize();
  const { inventoryRef, inventoryVersion } = useInventory();

  const equipmentSlots = [
    { slot: "backpack", label: "PACK" },
    { slot: "upper_body", label: "BODY" },
    { slot: "lower_body", label: "LEGS" },
    { slot: "melee", label: "MELEE" },
    { slot: "handgun", label: "PISTOL" },
    { slot: "long_gun", label: "RIFLE" },
    { slot: "flashlight", label: "LIGHT" },
  ];

  // Get equipped items (triggers re-render when inventoryVersion changes)
  const equipment = inventoryRef.current?.equipment || {};

  return (
    <div className="border-b border-border p-2 bg-muted/30 flex-shrink-0">
      <h3 className="text-xs font-semibold text-muted-foreground mb-2">
        EQUIPMENT
      </h3>
      <div className="flex gap-2 justify-between flex-wrap">
        {equipmentSlots.map(({ slot, label }) => (
          <EquipmentSlot
            key={slot}
            slot={slot}
            label={label}
            item={equipment[slot]}
            style={{
              width: `${fixedSlotSize * 0.8}px`,
              height: `${fixedSlotSize * 0.8}px`,
            }}
          />
        ))}
      </div>
    </div>
  );
}