import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { X, Move } from "lucide-react";
import { cn } from "@/lib/utils";

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
}: FloatingContainerProps) {
  const [position, setPosition] = useState(initialPosition);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

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
      </div>
    </div>,
    document.body
  );
}