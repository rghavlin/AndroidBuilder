import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import GameEvents, { GAME_EVENT } from '../game/utils/GameEvents.js';
import engine from '../game/GameEngine.js';

/**
 * SpeechBubbleContext - on-map, per-entity speech bubble "conversations".
 *
 * Separate from the full-screen DialogOverlay system (GameContext.activeDialog):
 * a bubble event is a sequence of lines, each anchored to a specific tile/entity,
 * shown ONE AT A TIME. The player clicks / presses Enter to advance.
 *
 * Authored in the map editor and serialized to scenario `bubbleEvents`, which
 * flows to gameMap.metadata.bubbleEvents at load. Shape:
 *   { id, oneShot, trigger: { type:'tile'|'proximity', x, y, radius? },
 *     lines: [ { x, y, speaker?, text } ] }
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

/** Does the player position satisfy this event's trigger? */
function triggerMatches(trigger, px, py) {
  if (!trigger) return false;
  if (trigger.type === 'proximity') {
    const r = trigger.radius ?? 1;
    const dx = trigger.x - px;
    const dy = trigger.y - py;
    return dx * dx + dy * dy <= r * r;
  }
  // Default: tile trigger.
  return trigger.x === px && trigger.y === py;
}

export const SpeechBubbleProvider = ({ children }) => {
  // { event, index } while a conversation is playing, else null.
  const [sequence, setSequence] = useState(null);
  const firedRef = useRef(new Set());

  const advanceBubble = useCallback(() => {
    setSequence(prev => {
      if (!prev) return null;
      const nextIndex = prev.index + 1;
      if (nextIndex >= prev.event.lines.length) {
        // End of conversation: resume gameplay.
        engine.turnPhase = 'PLAYER_TURN';
        engine.notifyUpdate();
        return null;
      }
      return { ...prev, index: nextIndex };
    });
  }, []);

  const dismissBubble = useCallback(() => {
    setSequence(prev => {
      if (prev) {
        engine.turnPhase = 'PLAYER_TURN';
        engine.notifyUpdate();
      }
      return null;
    });
  }, []);

  const startSequence = useCallback((event) => {
    if (!event || !Array.isArray(event.lines) || event.lines.length === 0) return;
    engine.turnPhase = 'PAUSED_FOR_EVENT';
    engine.notifyUpdate();
    setSequence({ event, index: 0 });
  }, []);

  // Trigger detection on player move.
  useEffect(() => {
    const check = () => {
      if (sequence) return; // one conversation at a time
      const player = engine.player;
      const gameMap = engine.gameMap;
      if (!player || !gameMap) return;

      const events = gameMap.metadata?.bubbleEvents;
      if (!events || events.length === 0) return;

      let matched = false;
      for (const ev of events) {
        if (!ev || !ev.lines || ev.lines.length === 0) continue;
        if (ev.oneShot && firedRef.current.has(ev.id)) continue;
        if (triggerMatches(ev.trigger, player.x, player.y)) {
          console.log(`[SpeechBubbles] Triggered "${ev.id}" at (${player.x}, ${player.y})`);
          if (ev.oneShot) firedRef.current.add(ev.id);
          startSequence(ev);
          matched = true;
          break;
        }
      }
      if (!matched) {
        console.debug(
          `[SpeechBubbles] Player at (${player.x}, ${player.y}); ${events.length} event(s) present, no trigger match:`,
          events.map(e => `${e.id}@${e.trigger?.type}(${e.trigger?.x},${e.trigger?.y})`).join(', ')
        );
      }
    };

    GameEvents.on(GAME_EVENT.PLAYER_MOVE_ENDED, check);
    return () => GameEvents.off(GAME_EVENT.PLAYER_MOVE_ENDED, check);
  }, [sequence, startSequence]);

  const activeBubble = sequence ? sequence.event.lines[sequence.index] : null;

  const value = {
    activeBubble,
    isBubbleActive: !!sequence,
    bubbleProgress: sequence
      ? { index: sequence.index, total: sequence.event.lines.length }
      : null,
    advanceBubble,
    dismissBubble,
    startSequence
  };

  return (
    <SpeechBubbleContext.Provider value={value}>
      {children}
    </SpeechBubbleContext.Provider>
  );
};
