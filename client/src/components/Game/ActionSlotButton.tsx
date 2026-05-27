import { useInventory } from '../../contexts/InventoryContext';
import { useCombat } from '../../contexts/CombatContext.jsx';
import { useGame } from '../../contexts/GameContext.jsx';
import { ItemContextMenu } from '../Inventory/ItemContextMenu';
import { ItemTooltip } from '../Inventory/ItemTooltip';
import { useItemImage } from '../../hooks/useItemImage';
import { cn } from "@/lib/utils";
import { ItemTrait } from "@/game/inventory/traits";

interface ActionSlotButtonProps {
  slot: string;
  isFlashlightOnActual: boolean;
}

export const ActionSlotButton = ({ slot, isFlashlightOnActual }: ActionSlotButtonProps) => {
  const { inventoryRef, selectedItem, clearSelected } = useInventory();
  const { targetingWeapon, toggleTargeting } = useCombat();
  const { toggleFlashlight, igniteTorch } = useGame();

  // Get item from inventory
  const equippedItem = inventoryRef.current?.equipment?.[slot];

  // Unarmed logic for melee slot
  const isMeleeUnarmed = slot === 'melee' && !equippedItem;
  const unarmedItem = isMeleeUnarmed ? {
    instanceId: 'unarmed',
    name: 'Unarmed',
    defId: 'unarmed',
    combat: { hitChance: 0.5, damage: { min: 1, max: 3 } }
  } : null;

  const item = equippedItem || unarmedItem;
  const isTargeting = targetingWeapon?.item.instanceId === item?.instanceId;
  const isFlashlightActive = slot === 'flashlight' && isFlashlightOnActual;

  // Determine correct image ID to load
  const imageId = item?.instanceId === 'unarmed'
    ? 'fist'
    : (item ? (item.imageId || item.image || item.id) : null);

  const imageSrc = useItemImage(imageId);

  const handleClick = () => {
    if (slot === 'flashlight') {
      const isIgniter = selectedItem?.item?.defId === 'tool.lighter' || selectedItem?.item?.defId === 'tool.matchbook';
      if (isIgniter && item && item.hasTrait?.(ItemTrait.IGNITABLE) && !item.isLit) {
        console.log(`[ActionSlot] Igniting torch with selected igniter:`, selectedItem.item.name);
        igniteTorch(selectedItem.item);
        clearSelected();
      } else {
        console.log(`[ActionSlot] Clicked flashlight: Toggling state`);
        toggleFlashlight();
      }
    } else if (item && (slot === 'melee' || slot === 'handgun' || slot === 'long_gun')) {
      console.log(`[ActionSlot] Clicked ${slot}: Toggling targeting for ${item.name}`);
      toggleTargeting(item, slot);
    } else if (item) {
      console.log(`[ActionSlot] Clicked ${slot}: Equipped with ${item.name}`);
    } else {
      console.log(`[ActionSlot] Clicked ${slot}: Nothing equipped`);
    }
  };

  return (
    <ItemContextMenu
      item={item}
      tooltipContent={item ? <ItemTooltip item={item} /> : <p className="font-medium text-xs">Empty {slot} slot</p>}
    >
      <button
        onClick={handleClick}
        className={cn(
          "w-12 h-12 rounded flex items-center justify-center transition-colors overflow-hidden relative",
          "equipment-slot-metal hover:brightness-110", // Base style for action buttons
          // Targeting state: Bright red outline/glow
          item && isTargeting && "!border-red-500 shadow-[inset_0_0_10px_rgba(239,68,68,0.3),0_0_8px_rgba(239,68,68,0.5)]",
          // Flashlight ON state: Bright yellow/cyan outline/glow
          isFlashlightActive && "!border-cyan-400 shadow-[inset_0_0_10px_rgba(34,211,238,0.3),0_0_10px_rgba(34,211,238,0.4)]"
        )}
      >
        {item && imageSrc && imageSrc !== 'failed' ? (
          <div className="w-full h-full p-1.5 flex items-center justify-center">
            <img
              src={imageSrc}
              alt={item.name}
              className="w-full h-full object-contain pointer-events-none mix-blend-screen"
              style={{
                filter: "contrast(300%)"
              }}
            />
          </div>
        ) : null}
      </button>
    </ItemContextMenu>
  );
};
