import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface OverlayContextType {
  activeTradeNpc: any | null;
  setActiveTradeNpc: (npc: any | null) => void;
  isBartering: boolean;
  setIsBartering: (open: boolean) => void;
  isShopOpen: boolean;
  setIsShopOpen: (open: boolean) => void;
  tollGuard: any | null;
  setTollGuard: (npc: any | null) => void;
  logHistoryOpen: boolean;
  setLogHistoryOpen: (open: boolean) => void;
  showMainMenu: boolean;
  setShowMainMenu: (open: boolean) => void;
  // New flag for Inventory Extension Window
  isExtensionOpen: boolean;
  setIsExtensionOpen: (open: boolean) => void;
  // The phone window shares the same half-screen panel as the crafting one,
  // so the two are mutually exclusive — opening either closes the other.
  isPhoneOpen: boolean;
  setIsPhoneOpen: (open: boolean) => void;
  // Clear all overlays/menus
  resetAll: () => void;
}

const OverlayContext = createContext<OverlayContextType | undefined>(undefined);

export function OverlayProvider({ children }: { children: ReactNode }) {
  const [activeTradeNpc, setActiveTradeNpc] = useState<any | null>(null);
  const [isBartering, setIsBartering] = useState(false);
  const [isShopOpen, setIsShopOpen] = useState(false);
  const [tollGuard, setTollGuard] = useState<any | null>(null);
  const [logHistoryOpen, setLogHistoryOpen] = useState(false);
  const [showMainMenu, setShowMainMenu] = useState(false);
  const [isExtensionOpen, showExtension] = useState(false);
  const [isPhoneOpen, showPhone] = useState(false);

  // Only one of the two panels can occupy the map half at a time.
  const setIsExtensionOpen = useCallback((open: boolean) => {
    showExtension(open);
    if (open) showPhone(false);
  }, []);
  const setIsPhoneOpen = useCallback((open: boolean) => {
    showPhone(open);
    if (open) showExtension(false);
  }, []);

  const resetAll = () => {
    setActiveTradeNpc(null);
    setIsBartering(false);
    setIsShopOpen(false);
    setTollGuard(null);
    setLogHistoryOpen(false);
    setShowMainMenu(false);
    showExtension(false);
    showPhone(false);
  };

  return (
    <OverlayContext.Provider value={{
      activeTradeNpc,
      setActiveTradeNpc,
      isBartering,
      setIsBartering,
      isShopOpen,
      setIsShopOpen,
      tollGuard,
      setTollGuard,
      logHistoryOpen,
      setLogHistoryOpen,
      showMainMenu,
      setShowMainMenu,
      isExtensionOpen,
      setIsExtensionOpen,
      isPhoneOpen,
      setIsPhoneOpen,
      resetAll
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
