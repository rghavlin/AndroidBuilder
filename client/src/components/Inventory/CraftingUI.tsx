
import React, { useMemo, useEffect } from 'react';
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useInventory } from "@/contexts/InventoryContext";
import { usePlayer } from "@/contexts/PlayerContext";
import ContainerGrid from "@/components/Inventory/ContainerGrid";
import WorkspaceSlot from "@/components/Inventory/WorkspaceSlot";

export default function CraftingUI() {
    const {
        craftingRecipes,
        selectedRecipeId,
        setSelectedRecipeId,
        craftItem,
        clearCraftingArea,
        inventoryRef,
        inventoryVersion
    } = useInventory();
    const { playerStats } = usePlayer();

    // Cleanup crafting area on unmount (when window closes)
    useEffect(() => {
        return () => {
            console.log("[CraftingUI] Unmounting - clearing crafting area");
            clearCraftingArea();
        };
    }, [clearCraftingArea]);

    const selectedRecipe = useMemo(() =>
        craftingRecipes.find(r => r.id === selectedRecipeId),
        [selectedRecipeId, craftingRecipes]
    );

    const craftingStatus = useMemo(() => {
        if (!selectedRecipeId || !inventoryRef.current) return { canCraft: false, missing: [] };
        return inventoryRef.current.craftingManager.checkRequirements(selectedRecipeId, playerStats.ap);
    }, [selectedRecipeId, inventoryVersion, inventoryRef, playerStats.ap]);

    const handleCraft = () => {
        if (selectedRecipeId) {
            const result = craftItem(selectedRecipeId);
            if (result.success) {
                console.log("Crafting successful!");
            } else {
                alert("Crafting failed: " + result.reason);
            }
        }
    };

    return (
        <div className="flex h-full bg-background/50 rounded-lg overflow-hidden border border-border">
            {/* Left Side: Recipe List */}
            <div className="w-1/3 border-r border-border flex flex-col min-w-0">
                <div className="p-2 bg-secondary/50 border-b border-border">
                    <h3 className="text-[0.65rem] font-bold text-muted-foreground uppercase tracking-wider">Recipes</h3>
                </div>
                <div className="flex-1 overflow-y-auto p-1 space-y-1">
                    {craftingRecipes.map((recipe: any) => (
                        <div
                            key={recipe.id}
                            className={cn(
                                "p-2 rounded cursor-pointer transition-colors text-xs font-medium truncate",
                                selectedRecipeId === recipe.id
                                    ? "bg-accent text-accent-foreground border border-accent/20"
                                    : "hover:bg-secondary/80 text-muted-foreground"
                            )}
                            onClick={() => setSelectedRecipeId(recipe.id)}
                        >
                            {recipe.name}
                        </div>
                    ))}
                </div>
            </div>

            {/* Right Side: Detail & Workspace */}
            <div className="flex-1 flex flex-col min-w-0">
                {!selectedRecipe ? (
                    <div className="flex-1 flex items-center justify-center text-muted-foreground text-xs italic">
                        Select a recipe to begin
                    </div>
                ) : (
                    <>
                        {/* Top: Description & Requirements */}
                        <div className="p-3 border-b border-border space-y-3">
                            <div>
                                <h2 className="text-sm font-bold text-primary">{selectedRecipe.name}</h2>
                                <p className="text-[0.65rem] text-muted-foreground leading-tight mt-1">
                                    {selectedRecipe.description}
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                {selectedRecipe.tools.length > 0 && (
                                    <div>
                                        <h4 className="text-[0.6rem] font-bold text-muted-foreground uppercase mb-1">Tools Required</h4>
                                        <ul className="text-[0.65rem] space-y-0.5">
                                            {selectedRecipe.tools.map((t: any, idx: number) => (
                                                <li key={idx} className="flex items-center gap-1">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500/50" />
                                                    {t.label || t.name || t.id.split('.').pop()}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                                <div>
                                    <h4 className="text-[0.6rem] font-bold text-muted-foreground uppercase mb-1">Ingredients</h4>
                                    <ul className="text-[0.65rem] space-y-0.5">
                                        {selectedRecipe.ingredients.map((ing: any, idx: number) => (
                                            <li key={idx} className="flex items-center gap-1">
                                                <span className="w-1.5 h-1.5 rounded-full bg-green-500/50" />
                                                {ing.count}x {ing.label || ing.id.split('.').pop()}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                                {selectedRecipe.apCost && (
                                    <div>
                                        <h4 className="text-[0.6rem] font-bold text-muted-foreground uppercase mb-1">AP Cost</h4>
                                        <div className={cn(
                                            "text-[0.65rem] font-bold",
                                            playerStats.ap < selectedRecipe.apCost ? "text-red-400" : "text-blue-400"
                                        )}>
                                            {selectedRecipe.apCost} AP
                                            {playerStats.ap < selectedRecipe.apCost && (
                                                <span className="ml-1 font-normal opacity-70">(Have {playerStats.ap})</span>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Bottom: Workspace Containers */}
                        <div className="flex-1 flex flex-col p-3 min-h-0 bg-secondary/20">
                            <div className="flex flex-1 gap-4 items-center justify-center">
                                {/* Tools Workspace */}
                                <div className="flex flex-col items-center">
                                    <h4 className="text-[0.55rem] font-bold text-muted-foreground uppercase mb-2">Required Tool</h4>
                                    <div className="flex gap-2 p-2 bg-black/20 rounded border border-border/50 shadow-inner">
                                        <WorkspaceSlot
                                            containerId="crafting-tools"
                                            slotIndex={0}
                                            label="Any Tool"
                                            icon="🔧"
                                        />
                                    </div>
                                </div>

                                {/* Ingredients Workspace Grid */}
                                <div className="flex flex-col items-center">
                                    <h4 className="text-[0.55rem] font-bold text-muted-foreground uppercase mb-2">Ingredients Grid</h4>
                                    <div className="p-1 bg-black/20 rounded border border-border/50 shadow-inner">
                                        <ContainerGrid
                                            containerId="crafting-ingredients"
                                            enableScroll={false}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Action Button Area */}
                            <div className="mt-4 flex flex-col items-center">
                                {craftingStatus.missing.length > 0 && (
                                    <div className="mb-2 text-[0.6rem] text-red-400 font-medium italic">
                                        Missing: {craftingStatus.missing.join(', ')}
                                    </div>
                                )}
                                <Button
                                    onClick={handleCraft}
                                    disabled={!craftingStatus.canCraft}
                                    className={cn(
                                        "w-32 h-8 text-[0.7rem] font-bold transition-all",
                                        craftingStatus.canCraft
                                            ? "bg-green-600 hover:bg-green-500 text-white shadow-[0_0_15px_rgba(22,163,74,0.4)]"
                                            : "bg-muted text-muted-foreground grayscale"
                                    )}
                                >
                                    CRAFT
                                </Button>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
