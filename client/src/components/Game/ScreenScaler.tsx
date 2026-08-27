import React, { useState, useEffect } from 'react';
import { DESIGN_WIDTH, DESIGN_HEIGHT, getScaleMode } from '@/hooks/useWindowSize';

interface ScreenScalerProps {
  children: React.ReactNode;
}

export default function ScreenScaler({ children }: ScreenScalerProps) {
  const [scaleMode, setScaleMode] = useState(getScaleMode);
  const [windowSize, setWindowSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : DESIGN_WIDTH,
    height: typeof window !== 'undefined' ? window.innerHeight : DESIGN_HEIGHT
  });

  useEffect(() => {
    function handleResize() {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight
      });
    }

    const handleToggleScale = () => {
      setScaleMode(getScaleMode());
      handleResize();
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('resize', handleResize);
      window.addEventListener('toggle-scale-to-fit', handleToggleScale);
      handleResize();

      return () => {
        window.removeEventListener('resize', handleResize);
        window.removeEventListener('toggle-scale-to-fit', handleToggleScale);
      };
    }
  }, []);

  // NOTE: both modes must render the SAME element structure. Swapping between a
  // one-div and a two-div tree makes React unmount/remount the entire game
  // (destroying the engine + every provider), which strands the app on the
  // "Loading game..." screen until a full restart.
  const scale = scaleMode
    ? Math.min(windowSize.width / DESIGN_WIDTH, windowSize.height / DESIGN_HEIGHT)
    : 1;
  const scaledWidth = DESIGN_WIDTH * scale;
  const scaledHeight = DESIGN_HEIGHT * scale;
  const left = scaleMode ? (windowSize.width - scaledWidth) / 2 : 0;
  const top = scaleMode ? (windowSize.height - scaledHeight) / 2 : 0;

  return (
    <div
      className={`overflow-hidden relative ${scaleMode ? 'bg-black select-none' : 'bg-background'}`}
      style={
        scaleMode
          ? { width: `${windowSize.width}px`, height: `${windowSize.height}px` }
          : { width: '100%', height: '100%' }
      }
    >
      <div
        className="origin-top-left absolute overflow-hidden bg-background"
        style={{
          width: scaleMode ? `${DESIGN_WIDTH}px` : '100%',
          height: scaleMode ? `${DESIGN_HEIGHT}px` : '100%',
          // Responsive mode must NOT set a transform: a transform (even scale(1))
          // turns this div into the containing block for `position: fixed`
          // descendants, which every modal/overlay in the game relies on.
          transform: scaleMode ? `scale(${scale})` : undefined,
          left: `${left}px`,
          top: `${top}px`,
        }}
      >
        {children}
      </div>
    </div>
  );
}
