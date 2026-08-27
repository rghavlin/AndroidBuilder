import { ReactNode } from 'react';
import { GridSizeProvider } from "@/contexts/GridSizeContext";

interface LeftPanelWindowProps {
  onClose: () => void;
  children: ReactNode;
  /** data-testid for the panel itself. */
  testId?: string;
}

/**
 * The half-screen panel that covers the map while the inventory stays live —
 * crafting and the phone both live in it, one at a time (OverlayContext keeps
 * them mutually exclusive).
 *
 * Geometry is defined once, here: any window using this shell is automatically
 * the same size and in the same place as the others, rather than depending on
 * a copied pair of CSS custom properties staying in sync.
 */
export default function LeftPanelWindow({ onClose, children, testId }: LeftPanelWindowProps) {
  return (
    <div className="fixed inset-0 z-50 pointer-events-none">
      {/* Backdrop covers only the map area */}
      <div
        className="absolute left-0 w-1/2 bg-black/50 pointer-events-auto"
        style={{
          top: 'var(--header-height)',
          bottom: 'var(--controls-height)'
        }}
        onClick={onClose}
      />

      <GridSizeProvider>
        <div
          className="absolute left-0 w-1/2 bg-card border-r border-border flex flex-col overflow-hidden pointer-events-auto"
          style={{
            top: 'var(--header-height)',
            bottom: 'var(--controls-height)'
          }}
          data-testid={testId}
          // Marks the panel as inventory UI so a click inside it never counts as
          // the "clicked away" that clears a held item (see InventoryPanel).
          data-inventory-ui="true"
        >
          {children}
        </div>
      </GridSizeProvider>
    </div>
  );
}
