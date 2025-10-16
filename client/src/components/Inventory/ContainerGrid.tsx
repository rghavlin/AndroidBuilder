
import UniversalGrid from "./UniversalGrid";

interface ContainerGridProps {
  containerId: string;
  title?: string;
  width: number;
  height: number;
  className?: string;
  enableScroll?: boolean;
  maxHeight?: string;
  maxWidth?: string;
  enableHorizontalScroll?: boolean;
}

export default function ContainerGrid({
  containerId,
  title,
  width,
  height,
  className = "",
  enableScroll = false,
  maxHeight = "200px",
  maxWidth = "100%",
  enableHorizontalScroll = false
}: ContainerGridProps) {
  // TODO: Connect to real Container system from inventory
  const handleSlotClick = (x: number, y: number) => {
    console.log(`Container ${containerId} slot (${x}, ${y}) clicked`);
  };

  const handleSlotDrop = (x: number, y: number, event: React.DragEvent) => {
    event.preventDefault();
    console.log(`Item dropped on ${containerId} slot (${x}, ${y})`);
  };

  return (
    <div className={className}>
      <UniversalGrid
        containerId={containerId}
        title={title}
        width={width}
        height={height}
        gridType="fixed" // Always use fixed size for containers
        maxHeight={maxHeight}
        maxWidth={maxWidth}
        enableScroll={enableScroll}
        enableHorizontalScroll={enableHorizontalScroll}
        onSlotClick={handleSlotClick}
        onSlotDrop={handleSlotDrop}
      />
    </div>
  );
}
