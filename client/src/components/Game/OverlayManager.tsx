import React from 'react';
import { createPortal } from 'react-dom';
import { useOverlays } from '../../contexts/OverlayContext';
import InventoryExtensionWindow from './InventoryExtensionWindow';
import { useGame } from '../../contexts/GameContext.jsx';
import { useInventory } from '../../contexts/InventoryContext';
import { TradeDialog } from './TradeDialog';
import BarterWindow from './BarterWindow';
import EarbucksShopWindow from './EarbucksShopWindow';
import TollWindow from './TollWindow';
import LogHistoryWindow from './LogHistoryWindow';
import PlayerSkillsWindow from './PlayerSkillsWindow';
import { JournalUI } from './JournalUI';
import { GridSizeProvider } from '@/contexts/GridSizeContext';
import MainMenuWindow from './MainMenuWindow';
import DragPreviewLayer from '../Inventory/DragPreviewLayer';
import { MapTransitionDialog } from './MapTransitionDialog';
import { TutorialEndDialog } from './TutorialEndDialog';
import { useGameMap } from '../../contexts/GameMapContext.jsx';
import { NPCDemandDialog } from './NPCDemandDialog';
import SleepOverlay from './SleepOverlay';
import SleepModal from './SleepModal';
import DefeatDialog from './DefeatDialog';
import DialogOverlay from './DialogOverlay';
import SpeechBubbleInput from './SpeechBubbleInput';

/**
 * OverlayManager - Centralized portal hub for all global UI elements.
 * Renders components into specific DOM roots to manage stacking context naturally.
 */
export default function OverlayManager() {
  const { 
    activeTradeNpc, setActiveTradeNpc,
    isBartering, setIsBartering,
    isShopOpen, setIsShopOpen,
    tollGuard, setTollGuard,
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
    toggleSkills,
    isJournalOpen,
    toggleJournal,
    closeJournalAndOpenSkills,
    initializeGame,
    enableAutosave,
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

          {/* Exit Toll Window */}
          {tollGuard && (
            <TollWindow
              guard={tollGuard}
              onClose={() => setTollGuard(null)}
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

          {/* Survivor's Journal */}
          {isJournalOpen && (
            <div className="fixed inset-0 z-50 pointer-events-none">
              <div
                className="absolute left-0 w-1/2 bg-black/50 pointer-events-auto transition-opacity duration-300"
                style={{
                  top: 'var(--header-height, 80px)',
                  bottom: 'var(--controls-height, 82px)'
                }}
                onClick={toggleJournal}
              />
              <GridSizeProvider>
                <div
                  className="absolute left-0 w-1/2 bg-card border-r border-border flex flex-col overflow-hidden pointer-events-auto"
                  style={{
                    top: 'var(--header-height, 80px)',
                    bottom: 'var(--controls-height, 82px)'
                  }}
                  data-testid="player-journal-window"
                  data-inventory-ui="true"
                >
                  <JournalUI onClose={toggleJournal} />
                </div>
              </GridSizeProvider>
            </div>
          )}

          {/* Map Transition */}
          {mapTransition && mapTransition.isTutorialEnd ? (
            <TutorialEndDialog
              open={true}
              onOpenChange={(open) => !open && handleMapTransitionCancel()}
              onContinue={async () => {
                enableAutosave();
                return handleMapTransitionConfirmWrapper();
              }}
              onNewGame={() => {
                handleMapTransitionCancel();
                initializeGame(null);
              }}
            />
          ) : mapTransition ? (
            <MapTransitionDialog
              open={true}
              onOpenChange={(open) => !open && handleMapTransitionCancel()}
              onConfirm={handleMapTransitionConfirmWrapper}
              direction={mapTransition.direction}
              currentMapId={worldManager?.currentMapId || 'unknown'}
              nextMapId={mapTransition.nextMapId}
              isCustom={mapTransition.isCustom}
            />
          ) : null}

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

          {/* On-map speech bubbles: invisible click/key catcher to advance the
              conversation. The bubbles are painted on the map canvas itself. */}
          <SpeechBubbleInput />

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
