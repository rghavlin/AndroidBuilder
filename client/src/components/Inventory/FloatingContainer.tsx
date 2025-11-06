import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { X, Move } from "lucide-react";
import { cn } from "@/lib/utils";
import { useInventory } from "@/contexts/InventoryContext";

interface FloatingContainerProps {
  id: string;
  title: string;
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  initialPosition?: { x: number; y: number };
  minWidth?: number;
  minHeight?: number;
  className?: string;
  isGroundBackpack?: boolean; // Phase 5H: Flag for backpack on ground
}

export default function FloatingContainer({
  id,
  title,
  isOpen,
  onClose,
  children,
  initialPosition = { x: 100, y: 100 },
  minWidth = 200,
  minHeight = 150,
  className,
  isGroundBackpack = false,
}: FloatingContainerProps) {
  const [position, setPosition] = useState(initialPosition);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const { inventoryRef, moveItem, getContainer } = useInventory();
  
  // Ensure container is registered when opening
  useEffect(() => {
    if (isOpen && id) {
      const container = getContainer(id);
      if (!container) {
        console.warn('[FloatingContainer] Container not registered:', id);
      }
    }
  }, [isOpen, id, getContainer]);
  
  // Phase 5H: Quick Move All handler
  const handleQuickMove = () => {
    if (!inventoryRef.current) return;
    
    const equippedBackpack = inventoryRef.current.getBackpackContainer();
    const groundBackpack = inventoryRef.current.getContainer(id);
    
    if (!equippedBackpack || !groundBackpack) {
      console.warn('[FloatingContainer] Cannot quick move - missing backpack containers');
      return;
    }
    
    const items = equippedBackpack.getAllItems();
    let moved = 0;
    
    for (const item of items) {
      const result = moveItem(
        item.instanceId, 
        equippedBackpack.id, 
        groundBackpack.id,
        null,
        null
      );
      if (result.success) moved++;
    }
    
    console.log(`[FloatingContainer] Quick moved ${moved}/${items.length} items`);
  };

  // Check if there's an equipped backpack to enable/disable button
  const hasEquippedBackpack = inventoryRef.current?.getBackpackContainer() !== null;

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget || (e.target as Element).closest('.drag-handle')) {
      setIsDragging(true);
      setDragStart({
        x: e.clientX - position.x,
        y: e.clientY - position.y,
      });
    }
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging) {
      const newX = Math.max(0, Math.min(window.innerWidth - minWidth, e.clientX - dragStart.x));
      const newY = Math.max(0, Math.min(window.innerHeight - minHeight, e.clientY - dragStart.y));

      setPosition({ x: newX, y: newY });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, dragStart, position, minWidth, minHeight]);

  if (!isOpen) return null;

  // Render using Portal at document root to escape stacking context
  return createPortal(
    <div
      ref={containerRef}
      className={cn(
        "fixed z-[9999] bg-card border border-border rounded-lg shadow-xl",
        "select-none",
        isDragging && "cursor-grabbing",
        className
      )}
      style={{
        left: position.x,
        top: position.y,
        minWidth,
        minHeight,
      }}
      data-testid={`floating-container-${id}`}
    >
      {/* Title Bar */}
      <div
        className="drag-handle flex items-center justify-between p-2 border-b border-border cursor-grab hover:bg-muted/50 rounded-t-lg"
        onMouseDown={handleMouseDown}
      >
        <div className="flex items-center gap-2">
          <Move className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-medium">{title}</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="h-6 w-6 p-0 hover:bg-destructive hover:text-destructive-foreground"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Content */}
      <div className="p-3">
        {children}
        
        {/* Phase 5H: Quick Move button for ground backpacks */}
        {isGroundBackpack && (
          <Button 
            onClick={handleQuickMove}
            variant="secondary"
            size="sm"
            className="mt-2 w-full"
            disabled={!hasEquippedBackpack}
            title={hasEquippedBackpack ? "Move all items from equipped backpack" : "No backpack currently equipped"}
          >
            Quick Move All from Equipped Backpack
          </Button>
        )}
      </div>
    </div>,
    document.body
  );
}