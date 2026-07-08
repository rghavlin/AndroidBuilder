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
  const baseColor = rawColor || '#ef4444';

  const StyleTag = () => (
    <style>{`
      @keyframes greenBorderBlink {
        0%, 100% {
          border-color: #22c55e;
          box-shadow: 0 0 12px rgba(34, 197, 94, 0.6);
        }
        50% {
          border-color: rgba(34, 197, 94, 0.35);
          box-shadow: 0 0 4px rgba(34, 197, 94, 0.15);
        }
      }
      .animate-green-blink {
        animation: greenBorderBlink 2s infinite ease-in-out;
      }
    `}</style>
  );

  if (isMinimized) {
    return (
      <>
        <StyleTag />
        <button 
          onClick={() => setIsMinimized(false)}
          className={`absolute top-4 left-4 z-30 w-8 h-8 rounded-full border flex items-center justify-center backdrop-blur-md shadow-lg pointer-events-auto transition-transform hover:scale-105 select-none ${isTreated ? 'animate-green-blink' : ''}`}
          style={{
            backgroundColor: isTreated ? (rawColor ? `${rawColor}26` : 'rgba(16, 185, 129, 0.15)') : 'rgba(220, 38, 38, 0.15)',
            borderColor: isTreated ? undefined : baseColor,
            boxShadow: isTreated ? undefined : `0 0 10px ${baseColor}33`,
            color: baseColor
          }}
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
    // Create soft translucent background
    const inlineStyle = {
      backgroundColor: rawColor ? `${rawColor}26` : 'rgba(16, 185, 129, 0.15)',
    };

    return (
      <>
        <StyleTag />
        <div 
          className="absolute top-4 left-1/2 -translate-x-1/2 z-30 px-4 py-1.5 rounded-full border flex items-center gap-2 backdrop-blur-md shadow-lg pointer-events-auto select-none animate-green-blink"
          style={inlineStyle}
        >
          <ShieldCheck className="w-3.5 h-3.5" style={{ color: baseColor }} />
          <span className="text-[10px] font-black tracking-tight text-foreground uppercase tabular-nums">
            Infection Neutralized — {playerStats.treatmentTicksRemaining}h Left
          </span>
          {playerStats.treatmentName && (
            <span className="text-[8px] font-bold text-muted-foreground tracking-tight">
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
    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 bg-destructive/20 border border-destructive/50 px-4 py-1.5 rounded-full flex items-center gap-2 backdrop-blur-md shadow-lg shadow-destructive/20 pointer-events-auto animate-pulse select-none">
      <AlertTriangle className="w-3.5 h-3.5 text-destructive shrink-0" />
      <span className="text-[10px] font-black tracking-tight text-destructive uppercase tabular-nums">
        Viral Infection — Lethal in {playerStats.infectionTicksRemaining}h
      </span>
      <button 
        onClick={() => setIsMinimized(true)}
        className="ml-2 p-0.5 rounded-full hover:bg-accent/10 text-muted-foreground hover:text-foreground transition-colors"
        title="Minimize HUD"
      >
        <Minus className="w-3 h-3" />
      </button>
    </div>
  );
}
