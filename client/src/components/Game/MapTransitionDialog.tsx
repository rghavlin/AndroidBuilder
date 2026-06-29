import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Progress } from '../ui/progress';
import { Trophy, Compass, Clock, Skull, ArrowRight } from 'lucide-react';
import engine from '../../game/GameEngine.js';
import { useItemImage } from '../../hooks/useItemImage';
import { ItemDefs } from '../../game/inventory/ItemDefs.js';

interface MapTransitionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (selectedPrizeId?: string) => Promise<boolean> | void;
  direction: 'north' | 'south';
  currentMapId: string;
  nextMapId: string;
  isCustom?: boolean;
}

const FOOD_POOL = [
  'food.cannedsoup',
  'food.waterbottle',
  'food.softdrink',
  'food.fruitjuice',
  'food.energydrink',
  'food.vitamindrink',
  'food.chips',
  'food.beans',
  'food.cannedcorn',
  'food.granolabar',
  'food.mre',
  'food.honey'
];

const MELEE_POOL = [
  'weapon.knife',
  'weapon.machete',
  'weapon.fire_axe',
  'weapon.hammer',
  'weapon.crowbar',
  'weapon.wrench',
  'weapon.shovel',
  'weapon.woodenbat',
  'weapon.spikedbat'
];

const RARE_POOL = [
  'weapon.9mmPistol',
  'weapon.357Pistol',
  'weapon.hunting_rifle',
  'weapon.grenade',
  'backpack.standard',
  'tool.large_battery',
  'tool.fuel_can',
  'bedroll.closed',
  'tool.battery_charger',
  'tool.solar_charger',
  'tool.crank_charger',
  'attachment.suppressor',
  'attachment.lasersight',
  'attachment.riflescope',
  'medical.first_aid_kit',
  'medical.stimulant',
  'food.mre',
  'food.stew',
  'weapon.shotgun',
  'ammo.9mm',
  'ammo.357',
  'ammo.308',
  'ammo.556',
  'ammo.de',
  'ammo.shotgun_shells'
];

interface PrizeButtonProps {
  itemId: string;
  isSelected: boolean;
  onClick: () => void;
}

const PrizeButton: React.FC<PrizeButtonProps> = ({ itemId, isSelected, onClick }) => {
  const itemDef = ItemDefs[itemId];
  const name = itemDef
    ? (itemId === 'food.waterbottle'
        ? 'Full Water Bottle'
        : (itemId.startsWith('ammo.') ? `${itemDef.name} x10` : itemDef.name))
    : 'Unknown';
  const imageId = itemDef ? (itemDef.imageId || itemDef.image || itemDef.id) : null;
  const imageSrc = useItemImage(imageId);

  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all duration-200 flex-1 min-w-[80px] text-center gap-1.5 cursor-pointer relative overflow-hidden group ${
        isSelected
          ? 'bg-emerald-950/30 border-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.25)]'
          : 'bg-muted/20 border-border/50 hover:border-border hover:bg-muted/40'
      }`}
    >
      <div className="w-12 h-12 flex items-center justify-center relative bg-black/40 rounded-lg border border-border/30 p-1 group-hover:scale-105 transition-transform duration-200">
        {imageSrc && imageSrc !== 'failed' ? (
          <img
            src={imageSrc}
            alt={name}
            className="w-full h-full object-contain pointer-events-none mix-blend-screen"
            style={{
              filter: "brightness(2) contrast(300%)"
            }}
          />
        ) : (
          <div className="w-4 h-4 rounded-full bg-muted-foreground/30 animate-pulse" />
        )}
      </div>
      <span className="text-[10px] font-bold leading-tight text-foreground/90 max-w-[90px] truncate select-none">
        {name}
      </span>
      {isSelected && (
        <div className="absolute top-1 right-1 w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,1)]" />
      )}
    </button>
  );
};

export const MapTransitionDialog: React.FC<MapTransitionDialogProps> = ({
  open,
  onOpenChange,
  onConfirm,
  direction,
  currentMapId,
  nextMapId,
  isCustom = false,
}) => {
  const [showStats, setShowStats] = useState(false);
  const [prizes, setPrizes] = useState<string[]>([]);
  const [selectedPrizeIdx, setSelectedPrizeIdx] = useState<number>(0);

  const message = direction === 'north' 
    ? "Move on down the road?" 
    : "Return to previous area?";

  const handleYes = async () => {
    if (direction === 'south' || isCustom) {
      const success = await onConfirm();
      if (success !== false) {
        onOpenChange(false);
      }
    } else {
      if (engine.worldManager) {
        engine.worldManager.markMapCompleted(currentMapId, engine.turn);

        // Generate prizes if player qualified and has not claimed yet
        const killsPct = engine.worldManager.getZombieKillsPercentage(currentMapId);
        const alreadyClaimed = engine.worldManager.isPrizeClaimed(currentMapId);
        if (killsPct >= 70 && !alreadyClaimed) {
          const generatedPrizes: string[] = [];

          // 1st prize (Food)
          const foodItem = FOOD_POOL[Math.floor(Math.random() * FOOD_POOL.length)];
          generatedPrizes.push(foodItem);

          // 2nd prize (Melee) if killsPct >= 80%
          if (killsPct >= 80) {
            const meleeItem = MELEE_POOL[Math.floor(Math.random() * MELEE_POOL.length)];
            generatedPrizes.push(meleeItem);
          }

          // 3rd prize (Rare) if killsPct >= 90%
          if (killsPct >= 90) {
            const rareItem = RARE_POOL[Math.floor(Math.random() * RARE_POOL.length)];
            generatedPrizes.push(rareItem);
          }

          setPrizes(generatedPrizes);
          setSelectedPrizeIdx(0);
        } else {
          setPrizes([]);
        }
      }
      setShowStats(true);
    }
  };

  const handleProceed = async () => {
    const selectedPrizeId = prizes.length > 0 ? prizes[selectedPrizeIdx] : undefined;

    if (selectedPrizeId && engine.worldManager) {
      engine.worldManager.claimPrize(currentMapId);
    }

    const success = await onConfirm(selectedPrizeId);
    if (success !== false) {
      onOpenChange(false);
      setShowStats(false);
      setPrizes([]);
      setSelectedPrizeIdx(0);
    } else {
      console.error('[MapTransitionDialog] Transition failed, keeping dialog open');
    }
  };

  const handleClose = (newOpen: boolean) => {
    onOpenChange(newOpen);
    if (!newOpen) {
      setShowStats(false);
      setPrizes([]);
      setSelectedPrizeIdx(0);
    }
  };

  // Compute stats if showing stats screen
  let totalCompleted = 1;
  let turnsElapsed = 0;
  let exploredPercent = 0;
  let zombiesPercent = 0;

  if (showStats) {
    if (engine.worldManager) {
      totalCompleted = engine.worldManager.completedMaps.length;
      const frozenTurns = engine.worldManager.turnsFromEntryToExit?.[currentMapId];
      if (frozenTurns !== undefined) {
        turnsElapsed = frozenTurns;
      } else {
        const entryTurn = engine.worldManager.firstEntryTurn[currentMapId] || 1;
        turnsElapsed = Math.max(0, engine.turn - entryTurn);
      }
      zombiesPercent = engine.worldManager.getZombieKillsPercentage(currentMapId);
    }
    if (engine.gameMap) {
      exploredPercent = engine.gameMap.getExplorationPercentage();
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[480px] max-h-[95vh] sm:max-h-[90vh] bg-background border border-border text-foreground shadow-2xl backdrop-blur-md rounded-2xl p-6 transition-all duration-300 pointer-events-auto flex flex-col overflow-hidden">
        {!showStats ? (
          <>
            <DialogHeader className="space-y-3 flex-shrink-0">
              <DialogTitle className="text-xl font-bold tracking-tight text-center text-foreground">
                {message}
              </DialogTitle>
            </DialogHeader>
            <DialogFooter className="mt-6 flex gap-3 sm:justify-center flex-shrink-0">
              <Button
                onClick={() => handleClose(false)}
                className="flex-1 py-5 text-md font-bold metal-button uppercase tracking-wide border-none"
              >
                No
              </Button>
              <Button 
                type="button" 
                onClick={handleYes}
                className="flex-1 py-5 text-md font-bold metal-button-green uppercase tracking-wide border-none"
              >
                Yes
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader className="space-y-1 text-center flex-shrink-0">
              <div className="mx-auto w-12 h-12 rounded-full bg-muted border border-border flex items-center justify-center mb-2">
                <Trophy className="w-6 h-6 text-foreground" />
              </div>
              <DialogTitle className="text-2xl font-black tracking-wider text-foreground">
                MAP COMPLETED
              </DialogTitle>
            </DialogHeader>

            <div className="flex-grow overflow-y-auto my-4 pr-1 space-y-4 custom-scrollbar">
              {/* Stat Card 1: Total Maps Completed */}
              <div className="flex items-center gap-4 bg-muted/30 border border-border/50 rounded-xl p-3.5 hover:border-border transition-all duration-200">
                <div className="w-10 h-10 rounded-lg bg-muted border border-border flex items-center justify-center shrink-0">
                  <Trophy className="w-5 h-5 text-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground font-semibold tracking-wide">Total Maps Completed</p>
                  <p className="text-lg font-black text-foreground">{totalCompleted}</p>
                </div>
              </div>

              {/* Stat Card 2: Turns to Traverse */}
              <div className="flex items-center gap-4 bg-muted/30 border border-border/50 rounded-xl p-3.5 hover:border-border transition-all duration-200">
                <div className="w-10 h-10 rounded-lg bg-muted border border-border flex items-center justify-center shrink-0">
                  <Clock className="w-5 h-5 text-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground font-semibold tracking-wide">Turns from entry to exit</p>
                  <p className="text-lg font-black text-foreground">{turnsElapsed} {turnsElapsed === 1 ? 'Turn' : 'Turns'}</p>
                </div>
              </div>

              {/* Stat Card 3: Map Explored */}
              <div className="bg-muted/30 border border-border/50 rounded-xl p-3.5 space-y-2.5 hover:border-border transition-all duration-200">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-muted border border-border flex items-center justify-center shrink-0">
                    <Compass className="w-5 h-5 text-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground font-semibold tracking-wide">Map Explored</p>
                    <p className="text-lg font-black text-foreground">{exploredPercent}%</p>
                  </div>
                </div>
                <Progress value={exploredPercent} className="h-1.5 bg-muted" />
              </div>

              {/* Stat Card 4: Zombies Defeated */}
              <div className="bg-muted/30 border border-border/50 rounded-xl p-3.5 space-y-2.5 hover:border-border transition-all duration-200">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-muted border border-border flex items-center justify-center shrink-0">
                    <Skull className="w-5 h-5 text-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground font-semibold tracking-wide">Zombies Defeated</p>
                    <p className="text-lg font-black text-foreground">{zombiesPercent}%</p>
                  </div>
                </div>
                <Progress value={zombiesPercent} className="h-1.5 bg-muted" />
              </div>

              {/* Survivor Gift Section */}
              {prizes.length > 0 && (
                <div className="bg-emerald-950/10 border border-emerald-500/25 rounded-xl p-4 space-y-3 shadow-[inset_0_0_12px_rgba(16,185,129,0.03)]">
                  <p className="text-xs text-emerald-400 font-medium italic text-center leading-relaxed">
                    Some survivors came out of hiding to offer you a gift for killing the zombies.
                  </p>
                  <div className="flex gap-2.5 justify-center">
                    {prizes.map((prizeId, idx) => (
                      <PrizeButton
                        key={prizeId + '-' + idx}
                        itemId={prizeId}
                        isSelected={selectedPrizeIdx === idx}
                        onClick={() => setSelectedPrizeIdx(idx)}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            <DialogFooter className="flex gap-3 sm:justify-center mt-auto pt-2 flex-shrink-0">
              <Button
                onClick={() => handleClose(false)}
                className="flex-1 py-5 text-md font-bold metal-button uppercase tracking-wide border-none"
              >
                Cancel
              </Button>
              <Button 
                type="button" 
                onClick={handleProceed}
                className="flex-1 py-5 text-md font-bold metal-button-green uppercase tracking-wide border-none flex items-center justify-center gap-1.5 group"
              >
                Continue
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};
