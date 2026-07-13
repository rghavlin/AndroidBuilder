import { useEffect } from 'react';
import { useSpeechBubbles } from '../../contexts/SpeechBubbleContext.jsx';

/**
 * SpeechBubbleInput - invisible, full-screen click/key catcher that advances an
 * active on-map speech-bubble conversation. The bubbles themselves are drawn on
 * the map canvas by MapCanvas; this only handles "click / Enter to continue".
 *
 * Mirrors DialogOverlay's input handling (capture-phase key swallow, click to
 * advance) but without any visible chrome, so the map stays fully visible.
 */
export default function SpeechBubbleInput() {
  const { isBubbleActive, advanceBubble, bubbleProgress } = useSpeechBubbles();

  useEffect(() => {
    if (!isBubbleActive) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        advanceBubble();
      }
    };
    window.addEventListener('keydown', handleKey, true);
    return () => window.removeEventListener('keydown', handleKey, true);
  }, [isBubbleActive, advanceBubble]);

  if (!isBubbleActive) return null;

  const hint =
    bubbleProgress && bubbleProgress.index >= bubbleProgress.total - 1
      ? 'Click to close'
      : 'Click to continue';

  return (
    <div
      className="fixed inset-0 z-[65] cursor-pointer"
      // #modal-root is pointer-events:none, so this catcher must opt back in or
      // clicks pass straight through to the map below.
      style={{ background: 'transparent', pointerEvents: 'auto' }}
      onClick={(e) => {
        e.stopPropagation();
        advanceBubble();
      }}
    >
      <div
        className="absolute left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-[11px] uppercase tracking-widest text-white/80"
        style={{ bottom: 'calc(var(--controls-height) + 12px)', background: 'rgba(0,0,0,0.55)', pointerEvents: 'none' }}
      >
        {hint}
        {bubbleProgress && bubbleProgress.total > 1 && (
          <span className="ml-2 text-white/40">
            {bubbleProgress.index + 1} / {bubbleProgress.total}
          </span>
        )}
      </div>
    </div>
  );
}
