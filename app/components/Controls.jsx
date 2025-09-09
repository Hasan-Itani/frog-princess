"use client";
import { useGame } from "../hooks/useGame";
import { useState } from "react";

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

  function IconButton({ icon, hoverIcon, activeIcon, isActive, onClick, alt }) {
    const [hover, setHover] = useState(false);
    const [press, setPress] = useState(false);

    const getIcon = () => {
      if (press) return activeIcon;
      if (isActive) return activeIcon;
      if (hover) return hoverIcon;
      return icon;
    };

    return (
      <button
        onClick={onClick}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => {
          setHover(false);
          setPress(false);
        }}
        onMouseDown={() => setPress(true)}
        onMouseUp={() => setPress(false)}
        className="w-10 h-10 flex items-center justify-center"
      >
        <img
          src={getIcon()}
          alt={alt}
          className="w-full h-full object-contain"
        />
      </button>
    );
  }

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
          {showCollect && (
            <div
              onClick={collectNow}
              className="relative cursor-pointer animate-scaleUp"
              title="Collect your current winnings"
            >
              <img
                src="/green_button.png"
                alt="Collect"
                className="w-56 h-16 object-contain drop-shadow-lg"
              />

              <div className="absolute inset-0 flex flex-col items-center justify-center text-black font-extrabold">
                <span className="text-lg leading-tight">COLLECT</span>
                <span className="text-sm">{format(currentWin)}</span>
              </div>
            </div>
          )}
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
