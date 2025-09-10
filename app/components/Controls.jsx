"use client";
// ⬇️ adjust this path if your useGame is elsewhere (e.g. "../useGame")
import { useGame } from "../hooks/useGame";
import IconButton from "./ui/IconButton";
import CollectButton from "./ui/CollectButton";
import { useDebug } from "../hooks/useDebug"; // ⬅️ added

// SAME distribution function so the label matches the board
function dropsForLevel(idx) {
  const n = idx + 1;
  if (n >= 1 && n <= 5) return 1;
  if (n >= 6 && n <= 9) return 2;
  if (n >= 10 && n <= 12) return 3;
  return 4; // 13-14
}

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
    showWinOverlay,
    levelsCount,
  } = useGame();

  const { showDrops, toggleDrops } = useDebug(); // ⬅️ added

  const showCollect = isPlaying && level > 0 && !showWinOverlay;

  // human-readable next level (cap at max)
  const displayLevel = Math.min(level + 1, levelsCount);
  // cap drops to 4 (since there are 5 pads → at least one safe)
  const dropsCount = Math.min(dropsForLevel(level), 4);

  return (
    <div className="relative z-20 pointer-events-auto w-full text-white px-3 py-2 space-y-2">
      <div className="flex items-stretch justify-between">
        <IconButton
          px={40}
          icon={muted ? "/audio_off_unhover.png" : "/audio_unhover.png"}
          hoverIcon={muted ? "/audio_off_hover.png" : "/audio_hover.png"}
          activeIcon={muted ? "/audio_off_hover.png" : "/audio_hover.png"}
          isActive={false}
          onClick={() => setMuted(!muted)}
          alt="Audio"
        />

        <div className="flex-1 flex flex-col items-center justify-center">
          {/* The label you asked for */}
          <div className="text-[10px] leading-3 opacity-80 mb-1 text-center">
            AVOID {dropsCount} DROP{dropsCount !== 1 ? "S" : ""} ON LEVEL{" "}
            {displayLevel}
          </div>

          <CollectButton
            show={showCollect}
            amount={currentWin}
            format={format}
            onCollect={collectNow}
          />
        </div>

        <IconButton
          px={40}
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

      {/* 🔧 tiny dev toggle (added, everything else unchanged) */}
      <div className="pt-1">
        <button
          onClick={toggleDrops}
          className="px-2 py-1 text-[10px] bg-red-600 text-white rounded shadow"
          title="Debug: show/hide all drops"
        >
          {showDrops ? "Unmark Drops" : "Mark Drops"}
        </button>
      </div>
    </div>
  );
}
