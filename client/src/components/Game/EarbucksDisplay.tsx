import { isLightTheme } from "@/lib/utils";
import { useSyncExternalStore, useRef, useEffect, useState } from 'react';
import engine from '../../game/GameEngine.js';
import { useTheme } from '../../contexts/ThemeContext';

/**
 * EarbucksDisplay
 * Shows the player's current Earbuck balance in the top-left header.
 * Uses the engine pulse directly (same pattern as PlayerContext) so it
 * reacts instantly to every earbuck award without requiring a prop thread.
 */
export default function EarbucksDisplay() {
  const { theme } = useTheme();
  const earbucks = useSyncExternalStore(
    (cb) => engine.subscribe(cb),
    () => engine.player?.earbucks ?? 0
  );

  const prevRef = useRef(earbucks);
  const [flash, setFlash] = useState(false);

  // Trigger a green flash whenever the balance increases
  useEffect(() => {
    if (earbucks > prevRef.current) {
      setFlash(true);
      const t = setTimeout(() => setFlash(false), 600);
      prevRef.current = earbucks;
      return () => clearTimeout(t);
    }
    prevRef.current = earbucks;
  }, [earbucks]);

  return (
    <div
      className="flex items-center gap-1.5 shrink-0 px-2 py-1 rounded-md transition-all duration-150"
      style={{
        background: flash ? 'rgba(34,197,94,0.18)' : 'rgba(0,0,0,0)',
        border: flash ? '1px solid rgba(34,197,94,0.5)' : '1px solid transparent',
        transition: 'background 0.15s, border 0.15s',
        minWidth: '60px',
      }}
      title="Earbucks"
      data-testid="earbucks-display"
    >
      <img
        src="./images/UI/earbuck.png"
        alt="Earbucks"
        className="w-6 h-6 object-contain shrink-0"
        style={{
          imageRendering: 'pixelated',
          filter: theme === 'steampunk' ? 'var(--sp-icon-filter)' : isLightTheme(theme) ? 'invert(1)' : 'none'
        }}
      />
      <span
        className="text-sm font-bold tabular-nums leading-none"
        style={{
          color: flash ? '#4ade80' : '#22c55e',
          textShadow: flash ? '0 0 8px rgba(74,222,128,0.8)' : 'none',
          transition: 'color 0.15s, text-shadow 0.15s',
        }}
      >
        {earbucks}
      </span>
    </div>
  );
}
