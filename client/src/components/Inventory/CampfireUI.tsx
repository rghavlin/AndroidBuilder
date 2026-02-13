import React from 'react';
import { cn } from "@/lib/utils";
import { useInventory } from "@/contexts/InventoryContext";
import AttachmentSlot from './AttachmentSlot';
import UniversalGrid from './UniversalGrid';
import { Button } from "@/components/ui/button";
import { Flame, Clock, Soup } from 'lucide-react';

interface CampfireUIProps {
    campfire: any;
    container: any;
    className?: string;
}

export default function CampfireUI({
    campfire,
    container,
    className = "",
}: CampfireUIProps) {
    const { cookInCampfire, inventoryVersion } = useInventory();

    const potSlot = campfire.attachmentSlots?.find((s: any) => s.id === 'pot');
    const fuelSlot = campfire.attachmentSlots?.find((s: any) => s.id === 'fuel');

    const handleCook = () => {
        const result = cookInCampfire(campfire);
        if (!result.success) {
            alert(result.reason);
        }
    };

    const lifetime = campfire.lifetimeTurns ?? 0;
    const isBurning = lifetime >= 0;

    return (
        <div className={cn("p-4 bg-background border rounded-lg shadow-xl min-w-[300px]", className)}>
            <div className="mb-4 flex justify-between items-start">
                <div>
                    <h3 className="text-lg font-bold text-orange-500 flex items-center gap-2">
                        <Flame className={cn("w-5 h-5", isBurning ? "animate-pulse text-orange-500" : "text-gray-400")} />
                        <span>{campfire.name}</span>
                    </h3>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                        <Clock className="w-3 h-3" />
                        <span>Expires in: <span className="font-bold text-primary">{lifetime} turns</span></span>
                    </div>
                </div>

                <Button
                    variant="default"
                    size="sm"
                    className="gap-2 font-bold shadow-sm bg-orange-600 hover:bg-orange-700 text-white border-none"
                    onClick={handleCook}
                    disabled={!isBurning}
                >
                    <Soup className="w-4 h-4" />
                    COOK (5 AP)
                </Button>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="flex flex-col items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Cooking Pot</span>
                    <AttachmentSlot weapon={campfire} slot={potSlot} />
                </div>
                <div className="flex flex-col items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Fuel</span>
                    <AttachmentSlot weapon={campfire} slot={fuelSlot} />
                </div>
            </div>

            <div className="space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-1">Food Grid</span>
                <UniversalGrid
                    containerId={container.id}
                    container={container}
                    width={container.width}
                    height={container.height}
                    gridType="fixed"
                    enableScroll={false}
                    className="mx-auto border-orange-500/20 bg-orange-500/5 rounded-md p-1"
                />
            </div>

            <div className="mt-4 pt-3 border-t border-border/50 text-[10px] text-muted-foreground italic text-center leading-tight">
                Boils dirty water. Requires a pot and an active fire.
                Add fuel to the slot to extend fire life.
            </div>
        </div>
    );
}
