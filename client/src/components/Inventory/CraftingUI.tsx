import React, { useMemo, useEffect, useState } from 'react';
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useInventory } from "@/contexts/InventoryContext";
import { usePlayer } from "@/contexts/PlayerContext";
import ContainerGrid from "@/components/Inventory/ContainerGrid";
import WorkspaceSlot from "@/components/Inventory/WorkspaceSlot";
import AttachmentSlot from './AttachmentSlot';
import { Flame, Clock, Hammer, Soup, Target, Swords, MoveUp, Droplets, Utensils } from 'lucide-react';
import { getItemName, createItemFromDef } from '@/game/inventory/ItemDefs';
import { ItemCategory } from '@/game/inventory/traits';

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

    const [activeTab, setActiveTab] = useState<'crafting' | 'cooking'>('crafting');

    // Cleanup crafting area on unmount (when window closes)
    useEffect(() => {
        return () => {
            console.log("[CraftingUI] Unmounting - clearing crafting area");
            clearCraftingArea();
        };
    }, [clearCraftingArea]);

    const nearbyCampfire = useMemo(() => {
        if (!inventoryRef.current) return null;
        return inventoryRef.current.craftingManager.getNearbyCampfire();
    }, [inventoryRef, inventoryVersion]);

    const filteredRecipes = useMemo(() => {
        return craftingRecipes
            .filter(r => r.tab === activeTab)
            .sort((a, b) => a.name.localeCompare(b.name));
    }, [craftingRecipes, activeTab]);

    const selectedRecipe = useMemo(() =>
        craftingRecipes.find(r => r.id === selectedRecipeId),
        [selectedRecipeId, craftingRecipes]
    );

    // Derived stats for the selected item
    const resultItemStats = useMemo(() => {
        if (!selectedRecipe) return null;
        const item = createItemFromDef(selectedRecipe.resultItem);
        return item?.combat || null;
    }, [selectedRecipe]);

    // If selected recipe is not in active tab, deselect it
    useEffect(() => {
        if (selectedRecipe && selectedRecipe.tab !== activeTab) {
            setSelectedRecipeId(null);
        }
    }, [activeTab, selectedRecipe, setSelectedRecipeId]);

    const craftingStatus = useMemo(() => {
        if (!selectedRecipeId || !inventoryRef.current) return { canCraft: false, missing: [] };
        return inventoryRef.current.craftingManager.checkRequirements(
            selectedRecipeId, 
            playerStats.ap,
            playerStats.craftingLvl || 1
        );
    }, [selectedRecipeId, inventoryVersion, inventoryRef, playerStats.ap, playerStats.craftingLvl]);

    // PREDICTION: Stew Stats
    const predictedStewStats = useMemo(() => {
        if (!selectedRecipe || selectedRecipe.resultItem !== 'food.stew' || !inventoryRef.current) return null;
        
        const container = inventoryRef.current.getContainer('cooking-ingredients') as any;
        if (!container) return null;
        
        const allItems = Array.from(container.items.values()) as any[];
        if (allItems.length === 0) {
            // Return max potential for empty grid
            return {
                units: 0,
                meatCount: 0,
                vegCount: 0,
                nutrition: 28,
                hydration: 8,
                isMaxPotential: true,
                isLimitedByWater: false,
                isLimitedByCount: false
            };
        }
        
        // 1. Gather possible ingredients and water
        const vegItems = allItems.filter(i => (i.hasCategory && i.hasCategory('vegetable')) || (i.categories && i.categories.includes('vegetable')));
        const meatItems = allItems.filter(i => i.defId === 'food.raw_meat');
        
        const waterContainers = allItems.filter(i => (i.isWaterBottle && i.isWaterBottle()) || (i.defId && (i.defId.startsWith('food.waterbottle') || i.defId.startsWith('food.waterjug'))));
        const totalWater = waterContainers.reduce((sum, i) => sum + (i.ammoCount || 0), 0);
        
        // 2. Greedy simulation (matching CraftingManager.js)
        let unitsUsed = 0;
        let meatToCook = 0;
        let vegToCook = 0;
        let totalNutrition = 0;
        
        let availableMeat = meatItems.reduce((sum, i) => sum + (i.stackCount || 0), 0);
        while (availableMeat > 0 && unitsUsed + 2 <= 4) {
            if (totalWater < (unitsUsed + 2) * 2) break;
            meatToCook++;
            unitsUsed += 2;
            availableMeat--;
            totalNutrition += 12;
        }

        let availableVeg = vegItems.reduce((sum, i) => sum + (i.stackCount || 0), 0);
        let vegRemaining = availableVeg;
        while (vegRemaining > 0 && unitsUsed + 1 <= 4) {
            if (totalWater < (unitsUsed + 1) * 2) break;
            vegToCook++;
            unitsUsed += 1;
            vegRemaining--;
        }
        
        // Finalize veggie nutrition
        let remainingVegToAssign = vegToCook;
        for (const item of vegItems) {
            if (remainingVegToAssign <= 0) break;
            const count = Math.min(item.stackCount, remainingVegToAssign);
            const baseNutr = item.consumptionEffects?.nutrition || 5;
            totalNutrition += (baseNutr + 2) * count;
            remainingVegToAssign -= count;
        }
        
        const totalVegInWorkspace = availableVeg;
        const totalMeatInWorkspace = meatItems.reduce((sum, i) => sum + (i.stackCount || 0), 0);
        const totalUnitsInWorkspace = (totalMeatInWorkspace * 2) + totalVegInWorkspace;

        return {
            units: unitsUsed,
            meatCount: meatToCook,
            vegCount: vegToCook,
            nutrition: totalNutrition,
            hydration: unitsUsed * 2,
            isMaxPotential: false,
            isLimitedByWater: totalUnitsInWorkspace > 0 && totalWater < (Math.min(totalUnitsInWorkspace, 4) * 2),
            isLimitedByCount: totalUnitsInWorkspace > 4
        };
    }, [selectedRecipe, inventoryVersion, inventoryRef]);

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

    const isBurning = nearbyCampfire && (nearbyCampfire.lifetimeTurns ?? 0) > 0;

    return (
        <div className="flex flex-col h-full bg-background/50 rounded-lg overflow-hidden border border-border">
            {/* Header Tabs */}
            <div className="flex border-b border-border bg-card/30">
                <button
                    onClick={() => setActiveTab('crafting')}
                    className={cn(
                        "flex-1 flex items-center justify-center gap-2 py-3 px-4 text-xs font-bold uppercase tracking-wider transition-colors",
                        activeTab === 'crafting'
                            ? "bg-primary/10 text-primary border-b-2 border-primary"
                            : "text-muted-foreground hover:bg-card/50 hover:text-foreground"
                    )}
                >
                    <Hammer className="w-4 h-4" />
                    Crafting
                </button>
                <button
                    onClick={() => setActiveTab('cooking')}
                    className={cn(
                        "flex-1 flex items-center justify-center gap-2 py-3 px-4 text-xs font-bold uppercase tracking-wider transition-colors",
                        activeTab === 'cooking'
                            ? "bg-primary/10 text-primary border-b-2 border-primary"
                            : "text-muted-foreground hover:bg-card/50 hover:text-foreground"
                    )}
                >
                    <Soup className="w-4 h-4" />
                    Cooking
                </button>
            </div>

            <div className="flex-1 flex min-h-0">
                {/* Left Side: Recipe List */}
                <div className="w-1/3 border-r border-border flex flex-col min-w-0 bg-card/20">
                    <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar">
                        {filteredRecipes.length === 0 ? (
                            <div className="p-4 text-center text-xs text-muted-foreground">
                                No {activeTab} recipes available.
                            </div>
                        ) : (
                            filteredRecipes.map(recipe => (
                                <button
                                    key={recipe.id}
                                    onClick={() => setSelectedRecipeId(recipe.id)}
                                    className={cn(
                                        "w-full py-1.5 px-3 text-left border-b border-border transition-all",
                                        selectedRecipeId === recipe.id
                                            ? "bg-primary/20 border-l-4 border-l-primary"
                                            : "hover:bg-card/50 border-l-4 border-l-transparent"
                                    )}
                                >
                                    <span className="text-[11px] font-bold truncate">{recipe.name}</span>
                                </button>
                            ))
                        )}
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
                            {/* Top: Header & Stats */}
                            <div className="p-3 border-b border-border space-y-3 bg-secondary/5">
                                <div className="flex flex-col gap-2">
                                    <h3 className="text-sm font-bold uppercase tracking-tight">{selectedRecipe.name}</h3>
                                    
                                     {/* Stew Stats (Dynamic) */}
                                    {predictedStewStats && (
                                        <div className="flex flex-col gap-1.5 p-2 bg-black/30 rounded border border-primary/20">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex items-center gap-1.5">
                                                        <Utensils className="w-3.5 h-3.5 text-orange-400/80" />
                                                        <span className="text-[11px] font-black text-orange-400">
                                                            {predictedStewStats.nutrition} NUTR
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-1.5">
                                                        <Droplets className="w-3.5 h-3.5 text-blue-400/80" />
                                                        <span className="text-[11px] font-black text-blue-400">
                                                            {predictedStewStats.hydration} HYDR
                                                        </span>
                                                    </div>
                                                </div>
                                                <span className="text-[9px] font-bold text-white/40 uppercase bg-white/5 px-1.5 py-0.5 rounded">
                                                    {predictedStewStats.isMaxPotential ? "Max Potential" : `${predictedStewStats.units}/4 Units`}
                                                </span>
                                            </div>

                                            {(predictedStewStats.isLimitedByWater || predictedStewStats.isLimitedByCount) && !predictedStewStats.isMaxPotential && (
                                                <div className="text-[8px] font-bold uppercase tracking-tight flex gap-2">
                                                    {predictedStewStats.isLimitedByWater && (
                                                        <span className="text-blue-300/60 italic">* Add more water for more hydration</span>
                                                    )}
                                                    {predictedStewStats.isLimitedByCount && (
                                                        <span className="text-orange-300/60 italic">* Max 4 units (Meat=2, Veg=1)</span>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Stats Display (Combat Items) */}
                                    {resultItemStats && (
                                        <div className="flex items-center gap-4 text-[10px] text-zinc-400 font-bold uppercase tracking-wide bg-black/20 p-1.5 rounded border border-white/5">
                                            <div className="flex items-center gap-1">
                                                <Target className="w-3 h-3 text-primary/70" />
                                                <span>Hit: {Math.round(resultItemStats.hitChance * 100)}%</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <Swords className="w-3 h-3 text-red-500/70" />
                                                <span>Dmg: {resultItemStats.damage.min}-{resultItemStats.damage.max}</span>
                                            </div>
                                            {resultItemStats.range && (
                                                <div className="flex items-center gap-1">
                                                    <MoveUp className="w-3 h-3 text-blue-400/70" />
                                                    <span>Range: {resultItemStats.range}</span>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-1.5 pt-1 border-t border-border/50">
                                    <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                        <div className="flex items-center gap-2">
                                            <span>Requirements</span>
                                            {selectedRecipe.resultCount > 1 && (
                                                <span className="text-primary/90 bg-primary/20 px-1.5 py-0.5 rounded border border-primary/30 flex items-center gap-1 font-black shadow-[0_0_8px_rgba(34,197,94,0.15)]">
                                                    Yield: {selectedRecipe.resultCount}
                                                </span>
                                            )}
                                        </div>
                                        <span className={cn(
                                            "px-1.5 py-0.5 rounded",
                                            playerStats.ap >= Math.max(1, selectedRecipe.apCost - (selectedRecipe.tab === 'cooking' ? 0 : (playerStats.craftingLvl ?? 0))) 
                                                ? "bg-primary/10 text-primary" 
                                                : "bg-red-500/10 text-red-400"
                                        )}>
                                            Cost: {Math.max(1, selectedRecipe.apCost - (selectedRecipe.tab === 'cooking' ? 0 : (playerStats.craftingLvl ?? 0)))} AP
                                        </span>
                                    </div>
                                    <div className="flex flex-wrap gap-1.5">
                                        {selectedRecipe.tools.map((t, i) => (
                                            <div key={i} className={cn(
                                                "text-[10px] px-2 py-0.5 rounded border flex items-center gap-1",
                                                craftingStatus.missing.includes(t.label || t.name || getItemName(t.id))
                                                    ? "bg-red-500/10 text-red-300 border-red-500/30"
                                                    : "bg-primary/5 text-primary border-primary/20"
                                            )}>
                                                <Hammer className="w-2.5 h-2.5" />
                                                {t.label || t.name || getItemName(t.id)}
                                            </div>
                                        ))}
                                        {selectedRecipe.ingredients.map((ing, i) => (
                                            <div key={i} className={cn(
                                                "text-[10px] px-2 py-0.5 rounded border flex items-center gap-1",
                                                craftingStatus.missing.includes(ing.label || ing.name || getItemName(ing.id))
                                                    ? "bg-red-500/10 text-red-300 border-red-500/30"
                                                    : "bg-primary/5 text-primary border-primary/20"
                                            )}>
                                                <div className="w-2 h-2 rounded-full bg-current opacity-50" />
                                                {ing.count > 1 && `${ing.count}x `}{ing.label || ing.name || getItemName(ing.id)}
                                            </div>
                                        ))}
                                        {selectedRecipe.requiresCampfire && (
                                            <div className={cn(
                                                "text-[10px] px-2 py-0.5 rounded border flex items-center gap-1",
                                                !nearbyCampfire
                                                    ? "bg-red-500/10 text-red-300 border-red-500/30"
                                                    : "bg-primary/10 text-primary border-primary/20"
                                            )}>
                                                <Flame className="w-2.5 h-2.5" />
                                                Campfire
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Middle: Workspace Containers */}
                            <div className="flex-1 flex flex-col p-3 min-h-0 bg-secondary/20">
                                <div className="space-y-4">
                                    <div className="flex justify-around items-start">
                                        {/* Left Column: Tool Slot + Action Button */}
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="flex flex-col items-center gap-1.5">
                                                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-1">Tool Slot</span>
                                                <WorkspaceSlot
                                                    containerId={activeTab === 'cooking' ? "cooking-tools" : "crafting-tools"}
                                                    slotIndex={0}
                                                    label={activeTab === 'cooking' ? "Cooking Pot" : "Tool"}
                                                    icon={activeTab === 'cooking' ? "🍲" : "🛠️"}
                                                />
                                            </div>

                                            <div className="flex flex-col items-center">
                                                <Button
                                                    onClick={handleCraft}
                                                    disabled={!craftingStatus.canCraft}
                                                    className={cn(
                                                        "w-28 h-8 text-[10px] font-bold shadow-lg transition-all",
                                                        "bg-primary hover:bg-primary/90"
                                                    )}
                                                >
                                                    {activeTab === 'cooking' ? 'COOK' : 'CRAFT'}
                                                </Button>
                                                {!craftingStatus.canCraft && craftingStatus.missing.length > 0 && (
                                                    <div className="mt-2 text-[9px] text-red-300 font-medium animate-in fade-in slide-in-from-top-1 text-center max-w-[100px] leading-tight text-white shadow-[0_0_10px_rgba(239,68,68,0.2)] bg-red-950/40 rounded p-1">
                                                        Missing: {craftingStatus.missing.join(', ')}
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Right Column: Ingredients Grid */}
                                        <div className="flex flex-col items-center gap-1.5">
                                            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-1 font-mono">Ingredients Workspace</span>
                                            <ContainerGrid containerId={activeTab === 'cooking' ? "cooking-ingredients" : "crafting-ingredients"} />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Bottom (Cooking Only): Campfire Status & Fuel */}
                            {activeTab === 'cooking' && nearbyCampfire && (
                                <div className="p-2 border-t border-border bg-primary/10 mt-auto">
                                    <div className="flex items-center justify-between mb-1.5">
                                        <div className="flex flex-col">
                                            <div className="flex items-center gap-1.5">
                                                <Flame className={cn("w-3.5 h-3.5", isBurning ? "text-primary animate-pulse" : "text-muted-foreground")} />
                                                <span className="text-[10px] font-bold uppercase tracking-tight">Campfire Status</span>
                                            </div>
                                            <div className="flex items-center gap-1 text-[9px] text-muted-foreground">
                                                <Clock className="w-2.5 h-2.5" />
                                                <span>Fuel: <span className={cn("font-bold", isBurning ? "text-primary" : "text-red-400")}>
                                                    {nearbyCampfire.lifetimeTurns ?? 0} turns left
                                                </span></span>
                                            </div>
                                        </div>
                                        <div className="px-1.5 py-0.5 rounded bg-primary/10 border border-primary/20 text-[9px] font-bold text-primary uppercase">
                                            {isBurning ? "Burning" : "Extinguished"}
                                        </div>
                                    </div>

                                    </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
