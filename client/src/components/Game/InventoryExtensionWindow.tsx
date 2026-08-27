import CraftingUI from "@/components/Inventory/CraftingUI";
import LeftPanelWindow from "./LeftPanelWindow";

interface InventoryExtensionWindowProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function InventoryExtensionWindow({
  isOpen,
  onClose
}: InventoryExtensionWindowProps) {
  if (!isOpen) return null;

  return (
    <LeftPanelWindow onClose={onClose} testId="inventory-extension-window">
      <CraftingUI />
    </LeftPanelWindow>
  );
}
