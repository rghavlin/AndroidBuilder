import React, { useState, useSyncExternalStore } from 'react';
import { useAudio } from '@/contexts/AudioContext.jsx';
import { useLog } from '@/contexts/LogContext.jsx';
import { useItemImage } from '@/hooks/useItemImage';
import { ItemDefs } from '@/game/inventory/ItemDefs.js';
import engine from '@/game/GameEngine.js';
import { earbucksShopSystem } from '@/game/systems/EarbucksShopSystem.js';
import { X } from 'lucide-react';
import { cn } from "@/lib/utils";

interface EarbucksShopWindowProps {
  mapId: string;
  onClose: () => void;
}

interface ShopItemRowProps {
  item: { defId: string; name: string; price: number; stock?: number | null; purchased?: number };
  mapId: string;
  playerEarbucks: number;
  onBuySuccess: () => void;
  onBuyFail: (reason: string) => void;
}

function ShopItemRow({ item, mapId, playerEarbucks, onBuySuccess, onBuyFail }: ShopItemRowProps) {
  const itemDef = ItemDefs[item.defId];
  const imageId = itemDef ? (itemDef.imageId || itemDef.image || itemDef.id) : null;
  const imageSrc = useItemImage(imageId);
  const [errorFlash, setErrorFlash] = useState(false);

  const available = earbucksShopSystem.getAvailable(item);
  const isFinite = available !== Infinity;
  const isOutOfStock = available <= 0;
  const canAfford = playerEarbucks >= item.price;
  const canBuy = canAfford && !isOutOfStock;

  const handleBuy = () => {
    if (isOutOfStock) {
      setErrorFlash(true);
      setTimeout(() => setErrorFlash(false), 600);
      onBuyFail('Out of stock');
      return;
    }

    if (!canAfford) {
      setErrorFlash(true);
      setTimeout(() => setErrorFlash(false), 600);
      onBuyFail('Insufficient funds');
      return;
    }

    const result = earbucksShopSystem.buyItem(item.defId, mapId, engine.player, engine.inventoryManager);
    if (result.success) {
      onBuySuccess();
    } else {
      setErrorFlash(true);
      setTimeout(() => setErrorFlash(false), 600);
      onBuyFail(result.reason || 'Purchase failed');
    }
  };

  return (
    <div
      className={cn(
        "flex items-center justify-between p-3 border border-white/5 bg-zinc-950/40 rounded-xl transition-all duration-300",
        errorFlash ? "border-red-500/50 bg-red-500/5 shadow-[0_0_15px_rgba(239,68,68,0.1)]" : "hover:border-white/10 hover:bg-zinc-950/60"
      )}
    >
      <div className="flex items-center gap-3">
        {imageSrc && imageSrc !== 'failed' ? (
          <div className="w-12 h-12 bg-black/40 border border-white/10 rounded-lg flex items-center justify-center p-1.5 overflow-hidden">
            <img
              src={imageSrc}
              alt={item.name}
              className="w-full h-full object-contain shrink-0"
              style={{ imageRendering: 'pixelated' }}
            />
          </div>
        ) : (
          <div className="w-12 h-12 bg-black/40 border border-white/10 rounded-lg flex items-center justify-center text-xl">
            📦
          </div>
        )}
        <div className="flex flex-col">
          <span className="font-bold text-white text-sm">{item.name}</span>
          <span className="text-[10px] font-black uppercase tracking-wider mt-0.5">
            {isFinite
              ? <span className={isOutOfStock ? "text-red-400" : "text-amber-400"}>
                  {isOutOfStock ? 'Sold out' : `${available} left`}
                </span>
              : <span className="text-zinc-600">In stock ∞</span>}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Price Tag */}
        <div className="flex items-center gap-1 bg-zinc-900 border border-white/5 px-2.5 py-1 rounded-lg shrink-0">
          <img
            src="/images/UI/earbuck.png"
            alt="Earbuck"
            className="w-4 h-4 object-contain"
            style={{ imageRendering: 'pixelated' }}
          />
          <span className="text-sm font-black text-emerald-400 tabular-nums">{item.price}</span>
        </div>

        {/* Buy Button */}
        <button
          onClick={handleBuy}
          disabled={!canBuy}
          className={cn(
            "px-4 py-2 font-black rounded-lg text-[10px] uppercase tracking-wider transition-all min-w-[70px]",
            canBuy
              ? "bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-950/20 active:scale-95"
              : "bg-zinc-800 text-zinc-500 cursor-not-allowed"
          )}
        >
          {isOutOfStock ? 'Sold' : 'Buy'}
        </button>
      </div>
    </div>
  );
}

export default function EarbucksShopWindow({ mapId, onClose }: EarbucksShopWindowProps) {
  const { playSound } = useAudio();
  const { addLog } = useLog();

  const playerEarbucks = useSyncExternalStore(
    (cb) => engine.subscribe(cb),
    () => engine.player?.earbucks ?? 0
  );

  const catalog = useSyncExternalStore(
    (cb) => engine.subscribe(cb),
    () => earbucksShopSystem.getCatalog(mapId)
  );

  const handleBuySuccess = () => {
    playSound('Craft');
  };

  const handleBuyFail = (reason: string) => {
    playSound('Fail');
    addLog(`Cannot buy item: ${reason}`, 'error');
  };

  return (
    <div className="fixed inset-0 z-50 pointer-events-none">
      {/* Backdrop covers map area */}
      <div
        className="absolute left-0 w-1/2 bg-black/50 pointer-events-auto"
        style={{
          top: 'var(--header-height)',
          bottom: 'var(--controls-height)'
        }}
        onClick={onClose}
      />

      {/* Shop panel */}
      <div
        className="absolute left-0 w-1/2 bg-card border-r border-border flex flex-col p-0 overflow-hidden pointer-events-auto animate-in slide-in-from-left duration-300"
        style={{
          top: 'var(--header-height)',
          bottom: 'var(--controls-height)'
        }}
        data-testid="earbucks-shop-window"
      >
        {/* Header */}
        <div className="px-4 py-3 border-b border-white/5 flex justify-between items-center bg-zinc-950/80">
          <div className="flex-1 mr-4">
            <p className="text-xs text-zinc-300 font-medium italic leading-relaxed">
              "We don't have room for any more people, but if you're willing to help out with killing zombies, we'll share some of what we've got."
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center bg-white/5 hover:bg-red-500/20 border border-white/10 rounded-lg transition-all"
          >
            <X className="w-4 h-4 text-zinc-400" />
          </button>
        </div>

        {/* Content list */}
        <div className="flex-1 p-6 overflow-y-auto space-y-3 bg-zinc-900/10 custom-scrollbar">
          {catalog.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-zinc-500">
              <span className="text-3xl mb-2">🏪</span>
              <span className="text-xs uppercase font-bold tracking-wider">No items currently for sale</span>
            </div>
          ) : (
            catalog.map((item) => (
              <ShopItemRow
                key={item.defId}
                item={item}
                mapId={mapId}
                playerEarbucks={playerEarbucks}
                onBuySuccess={handleBuySuccess}
                onBuyFail={handleBuyFail}
              />
            ))
          )}
        </div>

        {/* Footer showing player's current balance */}
        <div className="px-6 py-4 border-t border-white/5 bg-zinc-950/80 flex justify-between items-center">
          <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">
            Your Balance
          </span>
          <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-xl shadow-[0_0_10px_rgba(34,197,94,0.05)]">
            <img
              src="/images/UI/earbuck.png"
              alt="Earbucks"
              className="w-6 h-6 object-contain"
              style={{ imageRendering: 'pixelated' }}
            />
            <span className="text-lg font-black text-emerald-400 tabular-nums leading-none">
              {playerEarbucks}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
