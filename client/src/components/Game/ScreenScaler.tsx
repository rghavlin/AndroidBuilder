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

  if (!scaleMode) {
    return (
      <div className="w-full h-full relative overflow-hidden bg-background">
        {children}
      </div>
    );
  }

  const scale = Math.min(windowSize.width / DESIGN_WIDTH, windowSize.height / DESIGN_HEIGHT);
  const scaledWidth = DESIGN_WIDTH * scale;
  const scaledHeight = DESIGN_HEIGHT * scale;
  const left = (windowSize.width - scaledWidth) / 2;
  const top = (windowSize.height - scaledHeight) / 2;

  return (
    <div 
      className="w-full h-full bg-black overflow-hidden relative select-none"
      style={{ width: `${windowSize.width}px`, height: `${windowSize.height}px` }}
    >
      <div
        className="origin-top-left absolute overflow-hidden bg-background"
        style={{
          width: `${DESIGN_WIDTH}px`,
          height: `${DESIGN_HEIGHT}px`,
          transform: `scale(${scale})`,
          left: `${left}px`,
          top: `${top}px`,
        }}
      >
        {children}
      </div>
    </div>
  );
}
