"use client";
import { useGame } from "../hooks/useGame";
import IconButton from "./ui/IconButton";
import CollectButton from "./ui/CollectButton";

export default function Controls({ onOpenSettings }) {
  const {
    balance,
    bet,
    format,
    muted,
    setMuted,
    isPlaying,
    level,
    currentWin,
    incrementBet,
    decrementBet,
    collectNow,
    canIncrementBet,
    canDecrementBet,
    showWinOverlay, // <-- we’ll use this to hide the button under overlay
  } = useGame();

  // Show only after the run starts, and hide while the overlay is up
  const showCollect = isPlaying && level > 0 && !showWinOverlay;

  return (
    <div className="relative z-20 pointer-events-auto w-full text-white px-3 py-2 space-y-2">
      <div className="flex items-stretch justify-between">
        <IconButton
          icon={muted ? "/audio_off_unhover.png" : "/audio_unhover.png"}
          hoverIcon={muted ? "/audio_off_hover.png" : "/audio_hover.png"}
          activeIcon={muted ? "/audio_off_hover.png" : "/audio_hover.png"}
          isActive={false}
          onClick={() => setMuted(!muted)}
          alt="Audio"
        />

        <div className="flex-1 flex items-center justify-center">
          <CollectButton
            show={showCollect}
            amount={currentWin}
            format={format}
            onCollect={collectNow}
          />
        </div>

        <IconButton
          icon="/tabs_unhover.png"
          hoverIcon="/tabs_hover.png"
          activeIcon="/tabs_hover.png"
          isActive={false}
          onClick={onOpenSettings}
          alt="Tabs"
        />
      </div>

      <div className="flex items-center justify-between">
        <div className="text-left">
          <div className="text-[10px] leading-3 opacity-70">BALANCE</div>
          <div className="font-bold">{format(balance)}</div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={decrementBet}
            className="w-7 h-7 rounded-full bg-white text-black font-bold text-lg leading-none grid place-items-center disabled:opacity-40"
            disabled={isPlaying || !canDecrementBet}
            aria-label="Decrease bet"
          >
            -
          </button>
          <div className="text-center">
            <div className="text-[10px] leading-3 opacity-70">SET BET</div>
            <div className="font-bold">{format(bet)}</div>
          </div>
          <button
            onClick={incrementBet}
            className="w-7 h-7 rounded-full bg-white text-black font-bold text-lg leading-none grid place-items-center disabled:opacity-40"
            disabled={isPlaying || !canIncrementBet}
            aria-label="Increase bet"
          >
            +
          </button>
        </div>

        <div className="text-right min-w-[92px]">
          <div className="text-[10px] leading-3 opacity-70 text-center">
            WIN
          </div>
          {currentWin > 0 ? (
            <div className="text-green-400 font-bold">{format(currentWin)}</div>
          ) : (
            <div className="text-green-400 font-bold">GOOD LUCK!</div>
          )}
        </div>
      </div>
    </div>
  );
}
