"use client";

import { useEffect, useRef } from "react";
import { useGame } from "../hooks/useGame";
import IconButton from "./ui/IconButton";
import CollectButton from "./ui/CollectButton";
import { useDebug } from "../hooks/useDebug";
import { dropsForLevel } from "../hooks/useDrops";
import useAudio from "../hooks/audio/useAudio";

/**
 * Controls
 * - Top row: Music mute toggle, collect button, settings
 * - Middle row: Balance, bet -, bet display, bet +
 * - Bottom: Debug helpers (drops reveal)
 */
export default function Controls({ onOpenSettings }) {
  const {
    balance,
    bet,
    format,
    // we use game.muted as the MUSIC mute UI flag
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

  const { showDrops, toggleDrops } = useDebug();

  const {
    unlock, // unlock audio on first user gesture
    setMusicMuted, // music channel mute (SFX unaffected)
    playSfx, // button/click sounds
  } = useAudio();

  // ----- derived UI state -----
  const showCollect = isPlaying && level > 0 && !showWinOverlay;
  const displayLevel = Math.min(level + 1, levelsCount);
  // clamp level index for drops calc to avoid out-of-range at end state
  const dropsCount = dropsForLevel(
    Math.min(level, Math.max(0, levelsCount - 1))
  );

  // ----- one-time audio unlock on first pointer gesture -----
  const unlockedRef = useRef(false);
  useEffect(() => {
    if (unlockedRef.current) return;
    const once = () => {
      unlockedRef.current = true;
      unlock("basic_background"); // or "ambience"
      window.removeEventListener("pointerdown", once, true);
    };
    window.addEventListener("pointerdown", once, true);
    return () => window.removeEventListener("pointerdown", once, true);
  }, [unlock]);

  // ----- handlers -----
  const handleIncrement = () => {
    playSfx("button");
    incrementBet();
  };
  const handleDecrement = () => {
    playSfx("button");
    decrementBet();
  };
  const handleCollect = () => {
    // CollectButton already plays its own SFX via the provided playSound
    collectNow();
  };
  const handleMusicToggle = () => {
    playSfx("button");
    const next = !muted;
    setMuted(next); // reflect in game state
    setMusicMuted(next); // apply to music channel only
  };

  return (
    <div className="relative z-20 pointer-events-auto w-full text-white px-3 py-2 space-y-2">
      {/* Top row: MUSIC + SFX + settings */}
      <div className="flex items-stretch justify-between">
        <div className="flex items-center gap-2">
          {/* MUSIC */}
          <IconButton
            px={40}
            icon={muted ? "/audio_off_unhover.png" : "/audio_unhover.png"}
            hoverIcon={muted ? "/audio_off_hover.png" : "/audio_hover.png"}
            activeIcon={muted ? "/audio_off_hover.png" : "/audio_hover.png"}
            isActive={false}
            onClick={handleMusicToggle}
            alt="Music"
            title="Toggle music"
          />
        </div>

        <div className="flex-1 flex flex-col items-center justify-center">
          <div
            className="inline-block px-10 py-1 mb-1 text-[10px] leading-3 text-center text-white rounded-xl bg-black/60"
            aria-live="polite"
          >
            AVOID {dropsCount} DROP{dropsCount !== 1 ? "S" : ""} ON LEVEL{" "}
            {displayLevel}
          </div>

          <CollectButton
            show={showCollect}
            amount={currentWin}
            format={format}
            onCollect={handleCollect}
            // let the button play its own click via SFX
            playSound={(name) => playSfx(name || "button")}
          />
        </div>

        <IconButton
          px={40}
          icon="/tabs_unhover.png"
          hoverIcon="/tabs_hover.png"
          activeIcon="/tabs_hover.png"
          isActive={false}
          onClick={() => {
            playSfx("button");
            onOpenSettings();
          }}
          alt="Tabs"
          title="Open settings"
        />
      </div>

      {/* Middle row: bet controls */}
      <div className="flex items-center justify-between">
        <div className="text-left">
          <div className="text-[12px] mt-3 leading-4 opacity-70 text-center text-[#64faff] font-bold">
            BALANCE
          </div>
          <div className="font-bold">
            {format(balance)} <span className="text-[#ffc700]">EUR</span>
          </div>
        </div>

        <div className="flex items-center gap-2 mb-2">
          <IconButton
            px={48}
            icon="/deleteBetNegative.png"
            hoverIcon="/deleteBetHovered.png"
            activeIcon="/deleteBetHovered.png"
            disabledIcon="/deleteBetDisabled.png"
            isActive={false}
            disabled={isPlaying || !canDecrementBet}
            onClick={handleDecrement}
            alt="Decrease bet"
            title="Decrease bet"
          />
          <div className="text-center">
            <div className="text-[12px] mt-5 leading-4 opacity-70 text-center text-[#64faff] font-bold">
              BET
            </div>
            <div className="font-bold">
              {format(bet)} <span className="text-[#ffc700]">EUR</span>
            </div>
          </div>
          <IconButton
            px={48}
            icon="/addBetPositive.png"
            hoverIcon="/addBetHovered.png"
            activeIcon="/addBetHovered.png"
            disabledIcon="/addBetDisabled.png"
            isActive={false}
            disabled={isPlaying || !canIncrementBet}
            onClick={handleIncrement}
            alt="Increase bet"
            title="Increase bet"
          />
        </div>

        <div className="text-right min-w-[92px]">
          <div className="text-[12px] mt-3 leading-4 opacity-70 text-center text-[#64faff] font-bold">
            WIN
          </div>
          {currentWin > 0 ? (
            <div className="text-green-400 font-bold">{format(currentWin)}</div>
          ) : (
            <div className="text-white font-bold">GOOD LUCK!</div>
          )}
        </div>
      </div>

      {/* Debug */}
      <div className="pt-1">
        <button
          type="button"
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
