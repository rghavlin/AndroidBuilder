import { useState, useEffect, useCallback } from 'react';

export interface DialogStep {
  speaker: string;
  text: string;
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

  return (
    <div
      className="fixed inset-0 z-[70] flex items-end justify-center pb-[15%] cursor-pointer"
      style={{ background: 'rgba(0,0,0,0.4)' }}
      onClick={advance}
    >
      <div
        className="relative max-w-[500px] w-full mx-4 animate-in fade-in slide-in-from-bottom-2 duration-200"
        style={{ pointerEvents: 'none' }}
      >
        {/* Speech bubble */}
        <div
          className="bg-black border border-white/40 rounded-sm shadow-2xl p-4"
          style={{ pointerEvents: 'auto' }}
        >
          {step.speaker && (
            <div className="font-bold text-[11px] text-white/70 uppercase tracking-widest mb-2">
              {step.speaker}
            </div>
          )}
          <div className="text-white text-sm leading-relaxed">
            {step.text}
          </div>
          <div className="flex justify-between items-center mt-3">
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
  );
}
