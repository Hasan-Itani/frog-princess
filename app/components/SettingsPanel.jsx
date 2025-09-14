"use client";
import { useEffect, useState } from "react";
import { useGame } from "../hooks/useGame";
import IconButton from "./ui/IconButton";
import BlueDivider from "./ui/BlueDivider";
import { PartTitle, TinyMuted } from "./ui/SectionText";
import ImgLily from "./ui/ImgLily";
import RulesContent from "./RulesContent";
import useBetQuickPick from "../hooks/useBetQuickPick";
import useAudio from "../hooks/useAudio";

export default function SettingsPanel({ activeTab, setActiveTab, onClose }) {
  const [phase, setPhase] = useState("enter");

  const { BET_STEPS = [], betIndex, isPlaying, format, setMuted } = useGame();
  const { setBetTarget } = useBetQuickPick();

  const {
    // music
    getMusicVolume,
    setMusicVolume,
    isMusicMuted,
    setMusicMuted,
    getCurrentMusic,
    playMusic,
    // sfx
    getSfxVolume,
    setSfxVolume,
    isSfxMuted,
    setSfxMuted,
  } = useAudio();

  const [musicVol, setMusicVol] = useState(() =>
    Math.round(getMusicVolume() * 100)
  );
  const [sfxVol, setSfxVol] = useState(() => Math.round(getSfxVolume() * 100));
  const [musicMuteUI, setMusicMuteUI] = useState(isMusicMuted());
  const [sfxMuteUI, setSfxMuteUI] = useState(isSfxMuted());
  const [bgChoice, setBgChoice] = useState(
    getCurrentMusic() || "basic_background"
  );

  useEffect(() => {
    const t = setTimeout(() => setPhase("idle"), 10);
    return () => clearTimeout(t);
  }, []);

  function handleClose() {
    setPhase("exit");
    setTimeout(onClose, 450);
  }

  return (
    <div
      className={[
        "absolute inset-0 z-50 text-white",
        "flex flex-col",
        "transform transition-transform duration-500 ease-out",
        phase === "enter"
          ? "translate-x-full"
          : phase === "exit"
          ? "-translate-x-full"
          : "translate-x-0",
      ].join(" ")}
      aria-modal="true"
      role="dialog"
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/85 pointer-events-none" />

      {/* Header */}
      <div className="relative bg-black/15 backdrop-blur-md text-sky-300 text-lg font-extrabold text-center py-3">
        {activeTab === "bet" && "BET SETTINGS"}
        {activeTab === "rules" && "RULES & INFO"}
        {activeTab === "settings" && "SETTINGS"}
      </div>

      {/* Content */}
      <div className="relative flex-1 min-h-0 p-4 overflow-hidden flex flex-col items-center">
        {activeTab === "bet" && (
          <div className="w-full max-w-[420px] mx-auto space-y-3 text-center">
            <PartTitle>PLACE YOUR BET</PartTitle>
            <TinyMuted>CHOOSE YOUR BET ON THE COUNTER</TinyMuted>

            <div className="flex items-center justify-center gap-3">
              <button
                disabled
                className="w-9 h-9 rounded-full bg-white/80 text-black font-bold grid place-items-center cursor-not-allowed"
                aria-disabled="true"
              >
                -
              </button>
              <ImgLily size={60} className="drop-shadow" />
              <button
                disabled
                className="w-9 h-9 rounded-full bg-white/80 text-black font-bold grid place-items-center cursor-not-allowed"
                aria-disabled="true"
              >
                +
              </button>
            </div>

            <BlueDivider />

            <div className="grid grid-cols-4 gap-2">
              {BET_STEPS.map((betValue, idx) => {
                const label =
                  typeof format === "function"
                    ? format(betValue)
                    : `${betValue}`;
                const isSelected = idx === betIndex;
                return (
                  <button
                    key={idx}
                    onClick={() => setBetTarget(idx)}
                    disabled={isPlaying}
                    className={[
                      "px-3 py-2 rounded-md font-bold border transition",
                      isPlaying
                        ? "cursor-not-allowed opacity-60"
                        : "hover:bg-sky-500/30",
                      isSelected
                        ? "bg-sky-500/30 border-sky-400/70"
                        : "bg-sky-500/15 border-sky-400/30",
                    ].join(" ")}
                    title={
                      isPlaying
                        ? "You can't change the bet during a game round."
                        : `Set bet to ${label}`
                    }
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === "rules" && <RulesContent />}

        {activeTab === "settings" && (
          <div className="w-full max-w-[520px] mx-auto space-y-6">
            <PartTitle>SETTINGS</PartTitle>
            <TinyMuted>
              Music and sound effects are controlled separately.
            </TinyMuted>

            {/* BG track picker */}
            <div className="p-4 rounded-xl border border-sky-400/25 bg-white/5 space-y-3">
              <div className="font-bold text-sky-300 mb-2">
                Background Track
              </div>
              <div className="flex gap-2">
                {[
                  { key: "ambience", label: "Ambience" },
                  { key: "basic_background", label: "Basic" },
                ].map((opt) => (
                  <button
                    key={opt.key}
                    className={[
                      "px-3 py-2 rounded-md font-bold border transition",
                      bgChoice === opt.key
                        ? "bg-sky-500/30 border-sky-400/70"
                        : "bg-sky-500/15 border-sky-400/30 hover:bg-sky-500/30",
                    ].join(" ")}
                    onClick={() => {
                      setBgChoice(opt.key);
                      playMusic(opt.key); // switches instantly
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              <TinyMuted>Only one background plays at a time.</TinyMuted>
            </div>

            {/* Music mixer */}
            <div className="p-4 rounded-xl border border-sky-400/25 bg-white/5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="font-bold text-sky-300">Music Volume</div>
                <button
                  className={[
                    "px-2 py-1 rounded text-xs font-bold",
                    musicMuteUI ? "bg-red-600/80" : "bg-green-600/80",
                  ].join(" ")}
                  onClick={() => {
                    const next = !musicMuteUI;
                    setMusicMuteUI(next);
                    setMusicMuted(next);
                    setMuted(next); // keep game.muted in sync with MUSIC
                  }}
                >
                  {musicMuteUI ? "Unmute" : "Mute"}
                </button>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="1"
                value={musicVol}
                className="w-full accent-orange-500 cursor-pointer"
                onChange={(e) => {
                  const v = Number(e.target.value);
                  setMusicVol(v);
                  setMusicVolume(v / 100);
                }}
              />
              <div className="text-sm opacity-80">{musicVol}%</div>
            </div>

            {/* SFX mixer */}
            <div className="p-4 rounded-xl border border-sky-400/25 bg-white/5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="font-bold text-sky-300">SFX Volume</div>
                <button
                  className={[
                    "px-2 py-1 rounded text-xs font-bold",
                    sfxMuteUI ? "bg-red-600/80" : "bg-green-600/80",
                  ].join(" ")}
                  onClick={() => {
                    const next = !sfxMuteUI;
                    setSfxMuteUI(next);
                    setSfxMuted(next);
                  }}
                >
                  {sfxMuteUI ? "Unmute" : "Mute"}
                </button>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="1"
                value={sfxVol}
                className="w-full accent-orange-500 cursor-pointer"
                onChange={(e) => {
                  const v = Number(e.target.value);
                  setSfxVol(v);
                  setSfxVolume(v / 100);
                }}
              />
              <div className="text-sm opacity-80">{sfxVol}%</div>
              <TinyMuted>
                Clicks (e.g., +/-) are SFX and won’t be muted by Music.
              </TinyMuted>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Tabs */}
      <div className="relative flex items-center justify-around bg-black/15 backdrop-blur-md py-6">
        <IconButton
          size={20}
          icon="/cash_unhover.png"
          hoverIcon="/cash_hover.png"
          activeIcon="/cash_selected.png"
          isActive={activeTab === "bet"}
          onClick={() => setActiveTab("bet")}
          alt="Cash"
        />
        <IconButton
          size={20}
          icon="/info_unhover.png"
          hoverIcon="/info_hover.png"
          activeIcon="/info_selected.png"
          isActive={activeTab === "rules"}
          onClick={() => setActiveTab("rules")}
          alt="Info"
        />
        <IconButton
          size={20}
          icon="/settings_unhover.png"
          hoverIcon="/settings_hover.png"
          activeIcon="/settings_selected.png"
          isActive={activeTab === "settings"}
          onClick={() => setActiveTab("settings")}
          alt="Settings"
        />
        <IconButton
          size={20}
          icon="/close_unhover.png"
          hoverIcon="/close_hover.png"
          activeIcon="/close_hover.png"
          isActive={false}
          onClick={handleClose}
          alt="Close"
        />
      </div>
    </div>
  );
}
