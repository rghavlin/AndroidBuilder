import React from 'react';
import { createPortal } from 'react-dom';
import { useOverlays } from '../../contexts/OverlayContext';
import InventoryExtensionWindow from './InventoryExtensionWindow';
import { useGame } from '../../contexts/GameContext.jsx';
import { useInventory } from '../../contexts/InventoryContext';
import { TradeDialog } from './TradeDialog';
import BarterWindow from './BarterWindow';
import EarbucksShopWindow from './EarbucksShopWindow';
import LogHistoryWindow from './LogHistoryWindow';
import PlayerSkillsWindow from './PlayerSkillsWindow';
import MainMenuWindow from './MainMenuWindow';
import DragPreviewLayer from '../Inventory/DragPreviewLayer';
import { MapTransitionDialog } from './MapTransitionDialog';
import { useGameMap } from '../../contexts/GameMapContext.jsx';
import { NPCDemandDialog } from './NPCDemandDialog';
import SleepOverlay from './SleepOverlay';
import SleepModal from './SleepModal';
import DefeatDialog from './DefeatDialog';
import DialogOverlay from './DialogOverlay';

/**
 * OverlayManager - Centralized portal hub for all global UI elements.
 * Renders components into specific DOM roots to manage stacking context naturally.
 */
export default function OverlayManager() {
  const { 
    activeTradeNpc, setActiveTradeNpc,
    isBartering, setIsBartering,
    isShopOpen, setIsShopOpen,
    logHistoryOpen, setLogHistoryOpen,
    showMainMenu, setShowMainMenu,
    isExtensionOpen, setIsExtensionOpen
  } = useOverlays();

  const { 
    mapTransition, 
    handleMapTransitionConfirmWrapper, 
    handleMapTransitionCancel,
    activeNpcDemand,
    handleNpcDemandResponse,
    activeDialog,
    handleDialogDismiss,
    isSkillsOpen,
    toggleSkills
  } = useGame();

  const { worldManager } = useGameMap();

  const { dragState } = useInventory();

  // Root elements from index.html
  const modalRoot = document.getElementById('modal-root');
  const dragRoot = document.getElementById('drag-root');
  // Tooltip root is handled by shadcn or custom tooltips separately if needed

  if (!modalRoot || !dragRoot) return null;

  return (
    <>
      {/* 1. Modals & Dialogs (Stack Order: Modal Root) */}
      {createPortal(
        <>
          {/* Main Menu */}
          {showMainMenu && (
            <MainMenuWindow onClose={() => setShowMainMenu(false)} />
          )}

          {/* Trade Interaction */}
          {activeTradeNpc && !isBartering && (
            <TradeDialog 
              npc={activeTradeNpc} 
              onClose={() => setActiveTradeNpc(null)} 
              onStartBarter={() => setIsBartering(true)}
            />
          )}

          {/* Barter Window */}
          {isBartering && activeTradeNpc && (
            <BarterWindow 
              npc={activeTradeNpc} 
              onClose={() => {
                setIsBartering(false);
                setActiveTradeNpc(null);
              }} 
            />
          )}

          {/* Earbucks Shop Window */}
          {isShopOpen && (
            <EarbucksShopWindow
              mapId={worldManager?.currentMapId || 'map_001'}
              onClose={() => setIsShopOpen(false)}
            />
          )}

          {/* Log History */}
          {logHistoryOpen && (
            <div className="fixed inset-0 pointer-events-none">
              <div
                className="absolute left-0 w-1/2 bg-black/50 pointer-events-auto"
                style={{
                  top: 'var(--header-height)',
                  bottom: 'var(--controls-height)'
                }}
                onClick={() => setLogHistoryOpen(false)}
              />
              <div
                className="absolute left-0 w-1/2 bg-card border-r border-border flex flex-col p-4 overflow-hidden pointer-events-auto"
                style={{
                  top: 'var(--header-height)',
                  bottom: 'var(--controls-height)'
                }}
                data-testid="log-history-window"
                data-inventory-ui="true"
              >
                <LogHistoryWindow onClose={() => setLogHistoryOpen(false)} />
              </div>
            </div>
          )}

          {/* Player Skills */}
          <PlayerSkillsWindow 
            isOpen={isSkillsOpen} 
            onClose={toggleSkills} 
          />

          {/* Map Transition */}
          {mapTransition && (
            <MapTransitionDialog
              open={!!mapTransition}
              onOpenChange={(open) => !open && handleMapTransitionCancel()}
              onConfirm={handleMapTransitionConfirmWrapper}
              direction={mapTransition.direction}
              currentMapId={worldManager?.currentMapId || 'unknown'}
              nextMapId={mapTransition.nextMapId}
              isCustom={mapTransition.isCustom}
            />
          )}

          {/* NPC Demand Dialog */}
          {activeNpcDemand && (
            <NPCDemandDialog
              npc={activeNpcDemand.npc}
              onResponse={handleNpcDemandResponse}
            />
          )}

          {/* Dialog Overlay (Scenario Events) */}
          {activeDialog && (
            <DialogOverlay
              steps={activeDialog.steps}
              onComplete={handleDialogDismiss}
            />
          )}

          {/* Full Screen Overlays (Sleep, Defeat) */}
          <SleepOverlay />
          <SleepModal />
          <DefeatDialog />
          {isExtensionOpen && (
            <InventoryExtensionWindow
              isOpen={true}
              onClose={() => setIsExtensionOpen(false)}
            />
          )}
        </>,
        modalRoot
      )}

      {/* 2. Drag Previews (Always top-most root) */}
      {dragState && createPortal(
        <DragPreviewLayer />,
        dragRoot
      )}
    </>
  );
}
