import { useState, useEffect, useCallback } from 'react';

export interface DialogStep {
  speaker: string;
  text: string;
  video?: string; // filename in /video/help/, e.g. "inventory_basics.webm"
}

interface DialogOverlayProps {
  steps: DialogStep[];
  onComplete: () => void;
}

export default function DialogOverlay({ steps, onComplete }: DialogOverlayProps) {
  const [stepIndex, setStepIndex] = useState(0);

  const advance = useCallback(() => {
    if (stepIndex < steps.length - 1) {
      setStepIndex(i => i + 1);
    } else {
      onComplete();
    }
  }, [stepIndex, steps.length, onComplete]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        advance();
      }
    };
    window.addEventListener('keydown', handleKey, true);
    return () => window.removeEventListener('keydown', handleKey, true);
  }, [advance]);

  if (!steps || steps.length === 0) return null;

  const step = steps[stepIndex];
  const isLast = stepIndex >= steps.length - 1;
  const hasVideo = !!step.video;

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center cursor-pointer"
      style={{ background: 'rgba(0,0,0,0.6)' }}
      onClick={advance}
    >
      <div
        className="relative animate-in fade-in slide-in-from-bottom-2 duration-200"
        style={{ pointerEvents: 'none', width: hasVideo ? 560 : 500, maxWidth: '95vw' }}
      >
        <div
          className="bg-black border border-white/40 rounded-sm shadow-2xl"
          style={{ pointerEvents: 'auto' }}
          onClick={e => e.stopPropagation()}
        >
          {/* Video */}
          {hasVideo && (
            <div className="w-full bg-black rounded-t-sm overflow-hidden">
              <video
                key={step.video}
                src={`/video/help/${step.video}`}
                autoPlay
                loop
                muted
                playsInline
                className="w-full block"
                style={{ maxHeight: 320, objectFit: 'contain' }}
              />
            </div>
          )}

          {/* Text area */}
          <div className={`p-4 ${hasVideo ? 'border-t border-white/20' : ''}`}>
            {step.speaker && (
              <div className="font-bold text-[11px] text-white/70 uppercase tracking-widest mb-2">
                {step.speaker}
              </div>
            )}
            {step.text && (
              <div className="text-white text-sm leading-relaxed">
                {step.text}
              </div>
            )}
            <div className="flex justify-between items-center mt-3" onClick={advance} style={{ cursor: 'pointer' }}>
              <span className="text-[10px] text-white/30">
                {stepIndex + 1} / {steps.length}
              </span>
              <span className="text-[10px] text-white/40 uppercase tracking-wide">
                {isLast ? 'Click to close' : 'Click to continue'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
