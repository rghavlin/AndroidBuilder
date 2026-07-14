import React, { createContext, useContext, useSyncExternalStore } from 'react';
import engine from '../game/GameEngine.js';
import eventRunner from '../game/quest/EventRunner.js';

/**
 * SpeechBubbleContext - on-map, per-entity speech bubble "conversations".
 *
 * Separate from the full-screen DialogOverlay system (GameContext.activeDialog):
 * a speech line is shown as a small bubble anchored to a specific tile/entity,
 * ONE AT A TIME. The player clicks / presses Enter to advance.
 *
 * As of Phase 3 (see QUEST_SYSTEM_PLAN.md §6), this context no longer owns any
 * firing/trigger-detection logic itself — it's a thin read-only view onto the
 * single shared EventRunner (client/src/game/quest/EventRunner.js), which is
 * what actually walks an event's steps and decides when a `speech` step is
 * active. GameContext's PLAYER_MOVE_ENDED listener is what calls
 * eventRunner.checkAndFireAt(...) to start a run in the first place.
 */
const SpeechBubbleContext = createContext();

export const useSpeechBubbles = () => {
  const ctx = useContext(SpeechBubbleContext);
  if (!ctx) {
    // Dummy fallback so consumers (e.g. MapCanvas) never crash pre-mount.
    return {
      activeBubble: null,
      isBubbleActive: false,
      bubbleProgress: null,
      advanceBubble: () => {},
      dismissBubble: () => {}
    };
  }
  return ctx;
};

export const SpeechBubbleProvider = ({ children }) => {
  // Re-render whenever the shared engine pulses (eventRunner mutates state via
  // engine.notifyUpdate(), same pattern GameContext already uses).
  useSyncExternalStore(
    (cb) => engine.subscribe(cb),
    () => engine.getSnapshot()
  );

  const step = eventRunner.getActiveSpeechStep();
  const activeBubble = step ? { x: step.anchorX, y: step.anchorY, speaker: step.speaker, text: step.text } : null;

  const value = {
    activeBubble,
    isBubbleActive: !!activeBubble,
    bubbleProgress: activeBubble ? eventRunner.getSpeechProgress() : null,
    advanceBubble: () => eventRunner.advance(),
    dismissBubble: () => eventRunner.cancel(),
  };

  return (
    <SpeechBubbleContext.Provider value={value}>
      {children}
    </SpeechBubbleContext.Provider>
  );
};
