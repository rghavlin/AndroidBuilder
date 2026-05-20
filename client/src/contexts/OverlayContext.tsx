import React, { createContext, useContext, useState, ReactNode } from 'react';

interface OverlayContextType {
  activeTradeNpc: any | null;
  setActiveTradeNpc: (npc: any | null) => void;
  isBartering: boolean;
  setIsBartering: (open: boolean) => void;
  logHistoryOpen: boolean;
  setLogHistoryOpen: (open: boolean) => void;
  showMainMenu: boolean;
  setShowMainMenu: (open: boolean) => void;
  // New flag for Inventory Extension Window
  isExtensionOpen: boolean;
  setIsExtensionOpen: (open: boolean) => void;
  // Map transition state is in GameContext, but we can wrap it here if needed
  // For now, we'll keep existing context states and just have OverlayManager listen to them
}

const OverlayContext = createContext<OverlayContextType | undefined>(undefined);

export function OverlayProvider({ children }: { children: ReactNode }) {
  const [activeTradeNpc, setActiveTradeNpc] = useState<any | null>(null);
  const [isBartering, setIsBartering] = useState(false);
  const [logHistoryOpen, setLogHistoryOpen] = useState(false);
  const [showMainMenu, setShowMainMenu] = useState(false);
  const [isExtensionOpen, setIsExtensionOpen] = useState(false);

  return (
    <OverlayContext.Provider value={{
      activeTradeNpc,
      setActiveTradeNpc,
      isBartering,
      setIsBartering,
      logHistoryOpen,
      setLogHistoryOpen,
      showMainMenu,
      setShowMainMenu,
      isExtensionOpen,
      setIsExtensionOpen
    }}>
      {children}
    </OverlayContext.Provider>
  );
}

export function useOverlays() {
  const context = useContext(OverlayContext);
  if (context === undefined) {
    throw new Error('useOverlays must be used within an OverlayProvider');
  }
  return context;
}
