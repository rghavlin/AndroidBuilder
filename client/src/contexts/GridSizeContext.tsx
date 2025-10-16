
import React, { createContext, useContext, ReactNode } from 'react';
import { useGridSlotSize } from '@/hooks/useGridSlotSize';

interface GridSizeContextType {
  // For scalable grids (backpack, ground)
  scalableSlotSize: number;
  isCalculated: boolean;
  
  // For fixed grids (containers, pockets)
  fixedSlotSize: number;
}

const GridSizeContext = createContext<GridSizeContextType | undefined>(undefined);

export const useGridSize = () => {
  const context = useContext(GridSizeContext);
  if (context === undefined) {
    throw new Error('useGridSize must be used within a GridSizeProvider');
  }
  return context;
};

interface GridSizeProviderProps {
  children: ReactNode;
}

export const GridSizeProvider: React.FC<GridSizeProviderProps> = ({ children }) => {
  const { slotSize: scalableSlotSize, isCalculated } = useGridSlotSize();
  
  // Fixed grids use the same size as scalable grids for visual consistency
  // This ensures all inventory grids have the same slot size
  const fixedSlotSize = scalableSlotSize;
  
  const value = {
    scalableSlotSize,
    isCalculated,
    fixedSlotSize
  };
  
  return (
    <GridSizeContext.Provider value={value}>
      {children}
    </GridSizeContext.Provider>
  );
};
