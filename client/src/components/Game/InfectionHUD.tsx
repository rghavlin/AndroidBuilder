import React, { useState } from 'react';
import { usePlayer } from '../../contexts/PlayerContext.jsx';
import { AlertTriangle, ShieldCheck, Minus } from 'lucide-react';

export default function InfectionHUD() {
  const { playerStats } = usePlayer();
  const [isMinimized, setIsMinimized] = useState(false);

  if (!playerStats || !playerStats.isInfected) return null;

  const isTreated = playerStats.treatmentTicksRemaining > 0;
  const hoursLeft = isTreated ? playerStats.treatmentTicksRemaining : playerStats.infectionTicksRemaining;
  const rawColor = isTreated ? playerStats.treatmentColor : '#ef4444';
  const baseColor = (rawColor && rawColor !== '#000000') ? rawColor : (isTreated ? '#22c55e' : '#ef4444');

  const StyleTag = () => (
    <style>{`
      @keyframes greenBorderBlink {
        0%, 100% {
          border-color: var(--blink-color, #22c55e);
          box-shadow: 0 0 12px var(--blink-glow-strong, rgba(34, 197, 94, 0.6));
        }
        50% {
          border-color: var(--blink-color-muted, rgba(34, 197, 94, 0.35));
          box-shadow: 0 0 4px var(--blink-glow-weak, rgba(34, 197, 94, 0.15));
        }
      }
      @keyframes redBorderBlink {
        0%, 100% {
          border-color: #ef4444;
          box-shadow: 0 0 12px rgba(239, 68, 68, 0.6);
        }
        50% {
          border-color: rgba(239, 68, 68, 0.35);
          box-shadow: 0 0 4px rgba(239, 68, 68, 0.15);
        }
      }
      .animate-green-blink {
        animation: greenBorderBlink 2s infinite ease-in-out;
      }
      .animate-red-blink {
        animation: redBorderBlink 1.5s infinite ease-in-out;
      }
    `}</style>
  );

  if (isMinimized) {
    const inlineStyle = {
      backgroundColor: 'rgba(9, 9, 11, 0.85)',
      '--blink-color': baseColor,
      '--blink-color-muted': `${baseColor}59`,
      '--blink-glow-strong': `${baseColor}99`,
      '--blink-glow-weak': `${baseColor}26`,
      color: baseColor,
    } as React.CSSProperties;

    return (
      <>
        <StyleTag />
        <button 
          onClick={() => setIsMinimized(false)}
          className={`absolute top-4 left-4 z-30 w-8 h-8 rounded-full border flex items-center justify-center backdrop-blur-md shadow-lg pointer-events-auto transition-transform hover:scale-105 select-none ${isTreated ? 'animate-green-blink' : 'animate-red-blink'}`}
          style={inlineStyle}
          title={isTreated ? `Treatment active: ${hoursLeft}h remaining. Click to expand.` : `Infection active: ${hoursLeft}h left to live! Click to expand.`}
        >
          <span className="text-[10px] font-black tracking-tighter leading-none tabular-nums">
            {hoursLeft}
          </span>
        </button>
      </>
    );
  }

  if (isTreated) {
    const inlineStyle = {
      backgroundColor: 'rgba(9, 9, 11, 0.85)',
      '--blink-color': baseColor,
      '--blink-color-muted': `${baseColor}59`,
      '--blink-glow-strong': `${baseColor}99`,
      '--blink-glow-weak': `${baseColor}26`,
    } as React.CSSProperties;

    return (
      <>
        <StyleTag />
        <div 
          className="absolute top-4 left-1/2 -translate-x-1/2 z-30 px-4 py-1.5 rounded-full border flex items-center gap-2 backdrop-blur-md shadow-lg pointer-events-auto select-none animate-green-blink whitespace-nowrap"
          style={inlineStyle}
        >
          <ShieldCheck className="w-3.5 h-3.5 animate-pulse shrink-0" style={{ color: baseColor }} />
          <span className="text-[10px] font-black tracking-tight text-zinc-100 uppercase tabular-nums">
            Infection Neutralized — <span className="text-emerald-400 font-extrabold">{playerStats.treatmentTicksRemaining}h Left</span>
          </span>
          {playerStats.treatmentName && (
            <span className="text-[8.5px] font-bold text-zinc-400 tracking-tight">
              ({playerStats.treatmentName})
            </span>
          )}
          <button 
            onClick={() => setIsMinimized(true)}
            className="ml-2 p-0.5 rounded-full hover:bg-accent/10 text-muted-foreground hover:text-foreground transition-colors"
            title="Minimize HUD"
          >
            <Minus className="w-3 h-3" />
          </button>
        </div>
      </>
    );
  }

  // Active untreated infection
  return (
    <>
      <StyleTag />
      <div 
        className="absolute top-4 left-1/2 -translate-x-1/2 z-30 bg-red-950/80 border px-4 py-1.5 rounded-full flex items-center gap-2 backdrop-blur-md shadow-lg pointer-events-auto select-none animate-red-blink"
      >
        <AlertTriangle className="w-3.5 h-3.5 text-red-500 shrink-0 animate-pulse" />
        <span className="text-[10px] font-black tracking-tight text-red-200 uppercase tabular-nums">
          Viral Infection — Lethal in <span className="text-red-400 font-extrabold">{playerStats.infectionTicksRemaining}h</span>
        </span>
        <button 
          onClick={() => setIsMinimized(true)}
          className="ml-2 p-0.5 rounded-full hover:bg-accent/10 text-muted-foreground hover:text-foreground transition-colors"
          title="Minimize HUD"
        >
          <Minus className="w-3 h-3" />
        </button>
      </div>
    </>
  );
}
