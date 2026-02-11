import { GridSizeProvider } from "@/contexts/GridSizeContext";
import CraftingUI from "@/components/Inventory/CraftingUI";

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
    <div className="fixed inset-0 z-50 pointer-events-none">
      {/* Backdrop covers only map area */}
      <div
        className="absolute left-0 w-1/2 h-full bg-black/50 pointer-events-auto"
        onClick={onClose}
      />

      {/* Extension panel */}
      <GridSizeProvider>
        <div
          className="absolute left-0 w-1/2 bg-card border-r border-border flex flex-col p-4 overflow-hidden pointer-events-auto"
          style={{
            top: '48px',
            bottom: '72px',
            height: 'calc(100vh - 120px)'
          }}
          data-testid="inventory-extension-window"
        >
          <CraftingUI />
        </div>
      </GridSizeProvider>
    </div>
  );
}
