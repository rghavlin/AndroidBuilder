
import { useState, useEffect } from 'react';
import { useWindowSize } from './useWindowSize';

interface GridSlotSizeConfig {
  slotSize: number;
  isCalculated: boolean;
}

export function useGridSlotSize(): GridSlotSizeConfig {
  const windowSize = useWindowSize();
  const [slotSize, setSlotSize] = useState(48); // Default fallback
  const [isCalculated, setIsCalculated] = useState(false);

  useEffect(() => {
    const calculateOptimalSlotSize = () => {
      // Backpack area dimensions (50% of screen width, minus padding and borders)
      const inventoryPanelWidth = windowSize.width * 0.5; // 50% for inventory panel
      const backpackAreaWidth = inventoryPanelWidth * 0.5; // 50% of inventory for backpack
      
      // Account for padding, scrollbar space, and grid gaps
      const availableWidth = backpackAreaWidth - 48; // More padding for scrollbar and margins
      const availableHeight = windowSize.height - 200; // Account for header, equipment slots, etc.

      // Calculate max slot size that fits 6x10 grid (6 wide, 10 tall)
      // Account for 2px gaps: (width-1)*2px for gaps between slots
      const gapsWidth = (6 - 1) * 2; // 5 gaps of 2px each = 10px
      const gapsHeight = (10 - 1) * 2; // 9 gaps of 2px each = 18px
      
      const maxSlotSizeByWidth = Math.floor((availableWidth - gapsWidth) / 6);
      const maxSlotSizeByHeight = Math.floor((availableHeight - gapsHeight) / 10);
      
      // Use the smaller of the two to ensure the grid fits
      const calculatedSize = Math.min(maxSlotSizeByWidth, maxSlotSizeByHeight);
      
      // Clamp between reasonable bounds
      const minSize = 32; // Minimum usable size
      const maxSize = 64; // Maximum for good visual balance
      
      const finalSize = Math.max(minSize, Math.min(maxSize, calculatedSize));
      
      console.log('[useGridSlotSize] Calculated slot size:', {
        windowSize,
        inventoryPanelWidth,
        backpackAreaWidth,
        availableWidth,
        availableHeight,
        gapsWidth,
        gapsHeight,
        maxSlotSizeByWidth,
        maxSlotSizeByHeight,
        calculatedSize,
        finalSize
      });

      setSlotSize(finalSize);
      setIsCalculated(true);
    };

    // Only calculate once window size is available
    if (windowSize.width > 0 && windowSize.height > 0) {
      calculateOptimalSlotSize();
    }
  }, [windowSize]);

  return { slotSize, isCalculated };
}
