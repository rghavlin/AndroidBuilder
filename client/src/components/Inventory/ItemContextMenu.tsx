import React, { useState } from 'react';
// @ts-ignore
import { ItemTrait, ItemCategory } from '../../game/inventory/traits.js';
import { useInventory } from "@/contexts/InventoryContext";
import { useGame } from '../../contexts/GameContext.jsx';
import { useSleep } from '../../contexts/SleepContext.jsx';
import { useAction } from '../../contexts/ActionContext.jsx';
import engine from '../../game/GameEngine.js';
import {
    ContextMenu,
    ContextMenuContent,
    ContextMenuItem,
    ContextMenuTrigger,
    ContextMenuPortal,
} from "@/components/ui/context-menu";
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
    TooltipPortal,
} from "@/components/ui/tooltip";
import { SplitDialog } from "./SplitDialog";
interface ItemContextMenuProps {
    children: React.ReactNode;
    item?: any;
    tooltipContent?: React.ReactNode;
    isDisabled?: boolean;
}

/**
 * ItemContextMenu manages the interaction stack for an inventory item slot.
 * It ensures that ContextMenus and Tooltips are correctly nested so that
 * event listeners (hover, right-click, etc.) all reach the underlying DOM element.
 */
export function ItemContextMenu({
    children,
    item,
    tooltipContent = null,
    isDisabled = false
}: ItemContextMenuProps) {
    const { openContainer, canOpenContainer, unloadWeapon, unloadMagazine, deploySnare, retrieveSnare, toggleGenerator, consumeItem, drinkWater, unrollBedroll, rollupBedroll, disassembleItem, startDrag, stopDrag } = useInventory();
    const { igniteTorch, inventoryManager } = useGame();
    const { triggerSleep } = useSleep();
    const { startTargetingItem, harvestPlant } = useAction();
    const [isSplitDialogOpen, setIsSplitDialogOpen] = useState(false);

    // ... (rest of the component)

    // If there's no item and no tooltip, just render children
    if (!item && !tooltipContent) {
        return <>{children}</>;
    }

    const canSplit = item?.isStackable?.() && item?.stackCount > 1;

    const shouldDisable = isDisabled || item?.isPlanter || item?.isPuddle;

    if (shouldDisable) {
        return (
            <Tooltip delayDuration={1000}>
                <TooltipTrigger asChild>
                    {children}
                </TooltipTrigger>
                {tooltipContent && (
                    <TooltipPortal>
                        <TooltipContent side="top" sideOffset={8} className="bg-popover text-popover-foreground border shadow-sm z-[10001]">
                            {tooltipContent}
                            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 rotate-45 bg-popover border-r border-b border-popover-foreground/10" />
                        </TooltipContent>
                    </TooltipPortal>
                )}
            </Tooltip>
        );
    }

    return (
        <ContextMenu>
            <Tooltip delayDuration={1000}>
                <TooltipTrigger asChild>
                    <ContextMenuTrigger asChild>
                        {children}
                    </ContextMenuTrigger>
                </TooltipTrigger>
                {tooltipContent && (
                    <TooltipPortal>
                        <TooltipContent side="top" sideOffset={8} className="bg-popover text-popover-foreground border shadow-sm z-[10001]">
                            {tooltipContent}
                            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 rotate-45 bg-popover border-r border-b border-popover-foreground/10" />
                        </TooltipContent>
                    </TooltipPortal>
                )}
            </Tooltip>

            {item && (() => {
                // Phase: Specialized Ground Containers (Wagon/Sled) bypass ContextMenu
                const isSpecialGroundContainer = item.isVehicle() && 
                                               engine.inventoryManager.groundContainer.items.has(item.instanceId);
                
                if (isSpecialGroundContainer) return null;

                return (
                    <ContextMenuPortal>
                        <ContextMenuContent className="w-48 bg-[#1a1a1a] border-[#333] text-white z-[10001]">
                            {/* ... existing content ... */}
                        {item.hasTrait(ItemTrait.CAN_BREAK_DOORS) && (
                            <ContextMenuItem
                                onClick={() => {
                                    console.log('[ItemContextMenu] Use item requested for:', item.name);
                                    startTargetingItem(item);
                                }}
                                className="hover:bg-accent focus:bg-accent focus:text-white"
                            >
                                Use
                            </ContextMenuItem>
                        )}
                        {item?.defId === 'weapon.grenade' && (
                            <ContextMenuItem
                                onClick={() => {
                                    console.log('[ItemContextMenu] Throw requested for:', item.name);
                                    startTargetingItem(item);
                                }}
                                className="hover:bg-accent focus:bg-accent focus:text-white"
                            >
                                Throw
                            </ContextMenuItem>
                        )}
                        {item?.hasTrait(ItemTrait.CAN_DIG) && (
                            <ContextMenuItem
                                onClick={() => {
                                    console.log('[ItemContextMenu] Dig requested for:', item.name);
                                    startTargetingItem(item);
                                }}
                                className="hover:bg-accent focus:bg-accent focus:text-white"
                            >
                                Dig
                            </ContextMenuItem>
                        )}
                        {(item?.defId === 'food.cornseeds' || item?.defId === 'food.tomatoseeds' || item?.defId === 'food.carrotseeds') && (
                            <ContextMenuItem
                                onClick={() => {
                                    console.log('[ItemContextMenu] Plant requested for:', item.name);
                                    startTargetingItem(item);
                                }}
                                className="hover:bg-accent focus:bg-accent focus:text-white"
                            >
                                Plant
                            </ContextMenuItem>
                        )}
                        {(item?.defId === 'provision.harvestable_corn' || item?.defId === 'provision.harvestable_tomato' || item?.defId === 'provision.harvestable_carrot') && (
                            <ContextMenuItem
                                onClick={() => {
                                    console.log('[ItemContextMenu] Harvest requested for:', item.name);
                                    harvestPlant(item);
                                }}
                                className="hover:bg-accent focus:bg-accent focus:text-white"
                            >
                                Harvest
                            </ContextMenuItem>
                        )}
                        {item?.defId === 'furniture.generator' && (
                            <ContextMenuItem
                                onClick={() => toggleGenerator(item)}
                                disabled={!item.isOn && (item.ammoCount || 0) <= 0}
                                className="hover:bg-accent focus:bg-accent focus:text-white"
                            >
                                {item.isOn ? 'Turn off' : 'Turn on'}
                            </ContextMenuItem>
                        )}
                        {canOpenContainer(item) && (
                            <ContextMenuItem
                                onClick={() => {
                                    console.log('[ItemContextMenu] Open container requested for:', item.name, 'instanceId:', item.instanceId);
                                    
                                    // 1. Check for Backpacks/Toolboxes with direct grids
                                    const containerGrid = item.getContainerGrid?.();
                                    if (containerGrid) {
                                        openContainer(containerGrid);
                                        return;
                                    }

                                    // 2. Check for Items with Mods (Virtual Container)
                                    // Use property check first for robustness
                                    if (item.attachmentSlots && item.attachmentSlots.length > 0) {
                                        openContainer(`mod:${item.instanceId || item.id}`);
                                        return;
                                    }

                                    // 3. Fallback to Clothing (Virtual Container)
                                    // If canOpenContainer is true and it's not a direct grid or weapon, it's clothing/pockets
                                    openContainer(`clothing:${item.instanceId || item.id}`);
                                }}
                                className="hover:bg-accent focus:bg-accent focus:text-white"
                            >
                                Open
                            </ContextMenuItem>
                        )}
                        {item?.isMagazine?.() && !item?.isWaterBottle?.() && item?.ammoCount > 0 && (
                            <ContextMenuItem
                                onClick={() => {
                                    unloadMagazine(item);
                                }}
                                className="hover:bg-accent focus:bg-accent focus:text-white"
                            >
                                Unload
                            </ContextMenuItem>
                        )}
                        {item?.categories?.includes(ItemCategory.GUN) && item?.attachments?.['ammo'] && (
                            <ContextMenuItem
                                onClick={() => {
                                    unloadWeapon(item);
                                }}
                                className="hover:bg-accent focus:bg-accent focus:text-white"
                            >
                                Unload (1ap)
                            </ContextMenuItem>
                        )}
                        {item?.isChargeBased?.() && (() => {
                            const torch = inventoryManager?.equipment?.['flashlight'];
                            const canIgnite = torch && torch.hasTrait(ItemTrait.IGNITABLE) && !torch.isLit;
                            if (!canIgnite) return null;

                            return (
                                <ContextMenuItem
                                    onClick={() => {
                                        igniteTorch(item);
                                    }}
                                    className="hover:bg-accent focus:bg-accent focus:text-white"
                                >
                                    Use (Light Torch)
                                </ContextMenuItem>
                            );
                        })()}
                        {item?.hasTrait?.('consumable') && !item?.isWaterBottle?.() && (
                            <ContextMenuItem
                                onClick={() => {
                                    consumeItem(item);
                                }}
                                className="hover:bg-accent focus:bg-accent focus:text-white"
                            >
                                {(() => {
                                    if (item?.defId === 'food.softdrink' || item?.defId === 'food.energydrink') return 'Drink';
                                    if (item?.categories?.includes('food')) return 'Eat';
                                    
                                    // Check for medical/healing effects or category
                                    const effects = Array.isArray(item?.consumptionEffects) 
                                        ? item.consumptionEffects 
                                        : (item?.consumptionEffects ? Object.entries(item.consumptionEffects).map(([type, value]) => ({ type, value })) : []);
                                    
                                    const isMedical = item?.categories?.includes('medical') || 
                                                     effects.some((e: any) => e.type === 'heal' || e.type === 'hp' || e.type === 'cure' || e.type === 'stop_bleeding');
                                    
                                    if (isMedical) return 'Use';
                                    
                                    return 'Consume';
                                })()}
                            </ContextMenuItem>
                        )}
                        {item?.isWaterBottle?.() && (
                            <>
                                <ContextMenuItem
                                    onClick={() => drinkWater(item, 1)}
                                    className="hover:bg-accent focus:bg-accent focus:text-white"
                                    disabled={!item.ammoCount || item.ammoCount <= 0}
                                >
                                    Drink 1
                                </ContextMenuItem>
                                <ContextMenuItem
                                    onClick={() => drinkWater(item, 'max')}
                                    className="hover:bg-accent focus:bg-accent focus:text-white"
                                    disabled={!item.ammoCount || item.ammoCount <= 0}
                                >
                                    Drink Max
                                </ContextMenuItem>
                            </>
                        )}
                        {(() => {
                             const disassembleData = item?.disassembleData;
                             if (!disassembleData) return null;
                             
                             // Use item's container, or fallback to the ground container if we know it's there
                             let container = item?._container;
                             if (!container) {
                                 // Try to find the container via inventoryManager if possible
                                 // Note: useGame might not be available here, but we can check item._containerId if it exists
                                 // or assume if it's furniture it's likely on ground
                                 if (item.isFurniture) {
                                     const { inventoryManager } = (window as any).gameEngine || {};
                                     container = inventoryManager?.getContainer('ground');
                                 }
                             }
                             
                             if (!container) return null;
                             
                             const toolId = disassembleData.toolId;
                             const items = container.getAllItems();
                            let hasTool = false;
                            
                            if (typeof toolId === 'string') {
                                hasTool = items.some(i => i.defId === toolId);
                            } else if (toolId && toolId.either) {
                                hasTool = items.some(i => toolId.either.includes(i.defId));
                            }
                            
                            if (!hasTool) return null;

                            return (
                                <ContextMenuItem
                                    onClick={() => disassembleItem(item)}
                                    className="hover:bg-accent focus:bg-accent focus:text-white"
                                >
                                    Disassemble (10 AP)
                                </ContextMenuItem>
                            );
                        })()}
                        {item?.defId === 'bedroll.closed' && (
                            <ContextMenuItem
                                onClick={() => unrollBedroll(item)}
                                className="hover:bg-accent focus:bg-accent focus:text-white"
                            >
                                Unroll
                            </ContextMenuItem>
                        )}
                        {item?.defId === 'placeable.bed' && (
                            <ContextMenuItem
                                onSelect={() => triggerSleep(1.25)}
                                className="hover:bg-accent focus:bg-accent focus:text-white"
                            >
                                Sleep
                            </ContextMenuItem>
                        )}
                        {item?.defId === 'bedroll.open' && (
                            <>
                                <ContextMenuItem
                                    onSelect={() => triggerSleep(1.25)}
                                    className="hover:bg-accent focus:bg-accent focus:text-white"
                                >
                                    Sleep
                                </ContextMenuItem>
                                <ContextMenuItem
                                    onClick={() => rollupBedroll(item)}
                                    className="hover:bg-accent focus:bg-accent focus:text-white"
                                >
                                    Roll up
                                </ContextMenuItem>
                            </>
                        )}
                        {item?.defId === 'tool.snare_undeployed' && (
                            <ContextMenuItem
                                onClick={() => deploySnare(item)}
                                className="hover:bg-accent focus:bg-accent focus:text-white"
                            >
                                Set snare
                            </ContextMenuItem>
                        )}
                        {item?.defId === 'tool.snare_deployed' && (
                            <ContextMenuItem
                                onClick={() => retrieveSnare(item)}
                                className="hover:bg-accent focus:bg-accent focus:text-white"
                            >
                                Retrieve snare
                            </ContextMenuItem>
                        )}
                        {(() => {
                            if (!item || !item.hasTrait(ItemTrait.DRAGGABLE) || item.noDrag) return null;
                            
                            // Check if item is on ground
                            const isDraggingThis = engine.dragging?.item.instanceId === item.instanceId;
                            
                            if (isDraggingThis) {
                                return (
                                    <ContextMenuItem
                                        onClick={() => stopDrag()}
                                        className="hover:bg-accent focus:bg-accent focus:text-white"
                                    >
                                        Drop
                                    </ContextMenuItem>
                                );
                            } else {
                                // Only show Drag if it's on the ground
                                // ItemContextMenu items usually have 'originContainerId' if provided by UniversalGrid
                                // but we can check the engine's inventoryManager.groundContainer
                                const onGround = engine.inventoryManager.groundContainer.getAllItems().some((it: any) => it.instanceId === item.instanceId);
                                if (!onGround) return null;

                                return (
                                    <ContextMenuItem
                                        onClick={() => startDrag(item)}
                                        className="hover:bg-accent focus:bg-accent focus:text-white"
                                    >
                                        Drag ({item.dragApPenalty || 2} AP move penalty)
                                    </ContextMenuItem>
                                );
                            }
                        })()}
                        {canSplit && (
                            <ContextMenuItem
                                onClick={() => setIsSplitDialogOpen(true)}
                                className="hover:bg-accent focus:bg-accent focus:text-white"
                            >
                                Split Stack
                            </ContextMenuItem>
                        )}
                        {!canSplit && !canOpenContainer(item) && !item?.isWaterBottle?.() && item?.defId !== 'bedroll.closed' && item?.defId !== 'bedroll.open' && !item?.hasTrait?.(ItemTrait.DRAGGABLE) && (
                            <ContextMenuItem disabled className="text-zinc-500">
                                No actions available
                            </ContextMenuItem>
                        )}
                        </ContextMenuContent>
                    </ContextMenuPortal>
                );
            })()}

            {item && (
                <SplitDialog
                    isOpen={isSplitDialogOpen}
                    onClose={() => setIsSplitDialogOpen(false)}
                    item={item}
                />
            )}
        </ContextMenu>
    );
}
