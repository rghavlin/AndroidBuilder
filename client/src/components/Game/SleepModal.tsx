import { Button } from "@/components/ui/button";
import { useGame } from "../../contexts/GameContext.jsx";
import { usePlayer } from "../../contexts/PlayerContext.jsx";

export default function SleepModal() {
  const { 
    isSleepModalOpen: isOpen, 
    setIsSleepModalOpen: setIsOpen, 
    sleepMultiplier, 
    performSleep,
    isSleeping,
    isPlayerTurn,
    isAutosaving
  } = useGame();
  
  const { playerStats, isMoving: isAnimatingMovement } = usePlayer();

  if (!isOpen) return null;

  const maxSleepHours = Math.max(0, Math.ceil((25 - playerStats.energy) / (2.5 * sleepMultiplier)));
  const buttonsDisabled = !isPlayerTurn || isAutosaving || isAnimatingMovement || isSleeping;

  const handleSleep = (hours: number) => {
    performSleep(hours, sleepMultiplier);
    setIsOpen(false);
  };

  return (
    <div className="fixed inset-0 z-[110] bg-black/80 flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-white/10 p-6 rounded-lg max-w-sm w-full shadow-2xl">
        <h2 className="text-xl font-bold text-white mb-4 uppercase tracking-wider">How long to sleep?</h2>
        <p className="text-zinc-400 text-[10px] mb-4 uppercase">
          Max sleep based on energy: {maxSleepHours}h 
          {sleepMultiplier > 1 && <span className="text-green-500 ml-2">(+{(sleepMultiplier - 1) * 100}% bonus)</span>}
        </p>
        <div className="grid grid-cols-4 gap-2 mb-6">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(hours => (
            <Button
              key={hours}
              disabled={hours > maxSleepHours || buttonsDisabled}
              onClick={() => handleSleep(hours)}
              className="bg-zinc-800 hover:bg-zinc-700 text-white font-bold h-10 border border-white/5 disabled:opacity-20 disabled:grayscale"
            >
              {hours}h
            </Button>
          ))}
        </div>
        <Button
          onClick={() => setIsOpen(false)}
          className="w-full bg-red-900/40 hover:bg-red-900/60 text-red-100 font-bold uppercase tracking-widest text-xs border border-red-500/20"
        >
          Cancel
        </Button>
      </div>
    </div>
  );
}
