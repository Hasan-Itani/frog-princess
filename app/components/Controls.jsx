"use client";
import { useGame } from "../hooks/useGame";

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
  } = useGame();

  const showCollect = isPlaying && level > 0; // only after a run has started

  return (
    <div className="relative z-20 pointer-events-auto w-full text-white px-3 py-2 space-y-2">
      {/* Row 1: mute | collect | settings */}
      <div className="flex items-stretch justify-between">
        {/* left: mute */}
        <button
          onClick={() => setMuted(!muted)}
          className="px-3 py-1.5 rounded-md bg-orange-400 hover:bg-yellow-400 text-sm"
          aria-label={muted ? "Unmute" : "Mute"}
          title={muted ? "Unmute" : "Mute"}
        >
          {muted ? "🔇" : "🔊"}
        </button>

        {/* middle: collect (only during run) */}
        <div className="flex-1 flex items-center justify-center">
          {showCollect && (
            <button
              onClick={collectNow}
              className="px-4 py-1.5 rounded-md bg-yellow-400 text-black font-extrabold tracking-wide shadow hover:bg-yellow-300 leading-tight flex flex-col items-center"
              title="Collect your current winnings"
            >
              <span>COLLECT AMOUNT</span>
              <span className="text-xs font-black">{format(currentWin)}</span>
            </button>
          )}
        </div>

        {/* right: settings */}
        <button
          onClick={onOpenSettings}
          className="px-3 py-1.5 rounded-md bg-yellow-600 hover:bg-yellow-500 font-bold"
          title="Settings"
        >
          ⚙️
        </button>
      </div>

      {/* Row 2: balance | set bet | win / good luck */}
      <div className="flex items-center justify-between">
        {/* left: balance */}
        <div className="text-left">
          <div className="text-[10px] leading-3 opacity-70">BALANCE</div>
          <div className="font-bold">{format(balance)}</div>
        </div>

        {/* middle: set bet */}
        <div className="flex items-center gap-2">
          <button
            onClick={decrementBet}
            className="w-7 h-7 rounded-full bg-white text-black font-bold text-lg leading-none grid place-items-center disabled:opacity-40"
            disabled={isPlaying || !canDecrementBet}
            aria-label="Decrease bet"
          >
            –
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

        {/* right: win / good luck */}
        <div className="text-right min-w-[92px]">
          <div className="text-[10px] leading-3 opacity-70 text-center">WIN</div>
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
