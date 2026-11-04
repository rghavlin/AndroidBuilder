/**
 * Events the player has opted out of via a dialog's "Don't show this again"
 * checkbox (EventStep.dontShowAgain).
 *
 * This is a player preference, not game state: it lives in localStorage rather
 * than in a save, so it survives new games, the start-map tutorial's Reset and
 * app restarts. Keyed by event id only, so an id should be unique across maps
 * if it is meant to be dismissed independently.
 *
 * localStorage can be missing (headless tests) or throw (blocked storage), so
 * every access is guarded and falls back to "nothing dismissed".
 */

const STORAGE_KEY = 'dismissed_events';

function read() {
  try {
    if (typeof localStorage === 'undefined') return new Set();
    const raw = localStorage.getItem(STORAGE_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    return new Set(Array.isArray(arr) ? arr : []);
  } catch {
    return new Set();
  }
}

function write(set) {
  try {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...set]));
  } catch {
    // Storage unavailable: the dismissal just won't stick past this session.
  }
}

// In-memory mirror so a dismissal holds for the rest of this session even when
// storage is unavailable, and so eligibility checks don't re-parse every pulse.
let cache = null;

function get() {
  if (!cache) cache = read();
  return cache;
}

export function isEventDismissed(eventId) {
  return !!eventId && get().has(eventId);
}

export function dismissEvent(eventId) {
  if (!eventId) return;
  const set = get();
  if (set.has(eventId)) return;
  set.add(eventId);
  write(set);
}

/** How many events the player has dismissed (for the Options window). */
export function getDismissedEventCount() {
  return get().size;
}

/** Forget every dismissal (re-show all "don't show again" dialogs). */
export function clearDismissedEvents() {
  cache = new Set();
  write(cache);
}
