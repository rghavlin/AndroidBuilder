import { useState, useEffect } from 'react';

interface WindowSize {
  width: number;
  height: number;
}

export const DESIGN_WIDTH = 1600;
export const DESIGN_HEIGHT = 900;

export function getScaleMode(): boolean {
  if (typeof window === 'undefined') return true;
  const saved = localStorage.getItem('scale_to_fit');
  return saved === null ? true : saved === 'true';
}

export function getScaleFactor(): number {
  if (typeof window === 'undefined') return 1;
  if (!getScaleMode()) return 1;
  return Math.min(window.innerWidth / DESIGN_WIDTH, window.innerHeight / DESIGN_HEIGHT);
}

export function useWindowSize(): WindowSize {
  const [windowSize, setWindowSize] = useState<WindowSize>(() => {
    if (typeof window === 'undefined') return { width: DESIGN_WIDTH, height: DESIGN_HEIGHT };
    if (getScaleMode()) return { width: DESIGN_WIDTH, height: DESIGN_HEIGHT };
    return { width: window.innerWidth, height: window.innerHeight };
  });

  useEffect(() => {
    function handleResize() {
      if (getScaleMode()) {
        setWindowSize({ width: DESIGN_WIDTH, height: DESIGN_HEIGHT });
      } else {
        setWindowSize({
          width: window.innerWidth,
          height: window.innerHeight,
        });
      }
    }

    const handleToggleScale = () => {
      handleResize();
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('resize', handleResize);
      window.addEventListener('toggle-scale-to-fit', handleToggleScale);
      handleResize(); // Call once to set initial size
      
      return () => {
        window.removeEventListener('resize', handleResize);
        window.removeEventListener('toggle-scale-to-fit', handleToggleScale);
      };
    }
  }, []);

  return windowSize;
}

