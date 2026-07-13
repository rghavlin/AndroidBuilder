import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import GameEvents, { GAME_EVENT } from '../game/utils/GameEvents.js';
import engine from '../game/GameEngine.js';
import { applyItemGrants } from '../game/utils/applyItemGrants.js';

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
        // Event chaining: fire the follow-on event after this conversation ends.
        // Deferred out of the state updater to avoid setState-during-render.
        const nextId = prev.event.next;
        if (nextId) {
          setTimeout(() => GameEvents.emit(GAME_EVENT.EVENT_CHAIN_REQUEST, { eventId: nextId }), 0);
        }
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

  // Fire a bubble event (by tile match or by chain-request id): grants fire
  // on trigger; dialogue starts a bubble sequence; a grant-only event with a
  // follow-on chains straight through.
  const fireBubbleEvent = useCallback((ev) => {
    if (!ev) return;
    const hasLines = Array.isArray(ev.lines) && ev.lines.length > 0;
    const hasGrants = Array.isArray(ev.grants) && ev.grants.length > 0;
    if (!hasLines && !hasGrants) return;
    if (ev.oneShot && firedRef.current.has(ev.id)) return;
    if (ev.oneShot) firedRef.current.add(ev.id);

    if (hasGrants) {
      applyItemGrants(engine.gameMap, ev.grants, engine.inventoryManager);
      engine.notifyUpdate();
    }
    if (hasLines) {
      startSequence(ev);
    } else if (ev.next) {
      // No conversation to complete, so chain immediately.
      setTimeout(() => GameEvents.emit(GAME_EVENT.EVENT_CHAIN_REQUEST, { eventId: ev.next }), 0);
    }
  }, [startSequence]);

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
        if (!ev) continue;
        const hasLines = Array.isArray(ev.lines) && ev.lines.length > 0;
        const hasGrants = Array.isArray(ev.grants) && ev.grants.length > 0;
        if (!hasLines && !hasGrants) continue; // nothing to do
        if (ev.oneShot && firedRef.current.has(ev.id)) continue;
        if (triggerMatches(ev.trigger, player.x, player.y)) {
          console.log(`[SpeechBubbles] Triggered "${ev.id}" at (${player.x}, ${player.y})`);
          fireBubbleEvent(ev);
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
  }, [sequence, fireBubbleEvent]);

  // Event chaining: another event asked us to fire a bubble event by id.
  useEffect(() => {
    const onChainRequest = ({ eventId }) => {
      if (!eventId) return;
      const events = engine.gameMap?.metadata?.bubbleEvents;
      if (!events) return;
      const ev = events.find(e => e && e.id === eventId);
      if (ev) {
        console.log(`[SpeechBubbles] Chain-firing bubble event "${eventId}"`);
        fireBubbleEvent(ev);
      }
    };
    GameEvents.on(GAME_EVENT.EVENT_CHAIN_REQUEST, onChainRequest);
    return () => GameEvents.off(GAME_EVENT.EVENT_CHAIN_REQUEST, onChainRequest);
  }, [fireBubbleEvent]);

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
