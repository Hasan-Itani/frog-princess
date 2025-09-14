"use client";
import { useEffect, useState } from "react";
import { useGame } from "../hooks/useGame";
import IconButton from "./ui/IconButton";
import BlueDivider from "./ui/BlueDivider";
import { PartTitle, TinyMuted } from "./ui/SectionText";
import ImgLily from "./ui/ImgLily";
import RulesContent from "./RulesContent";
import useBetQuickPick from "../hooks/useBetQuickPick";
import { play, setVolume } from "../hooks/audioManager";


export default function SettingsPanel({ activeTab, setActiveTab, onClose }) {
  const [phase, setPhase] = useState("enter"); 

  const { BET_STEPS = [], betIndex, isPlaying, format } = useGame();
  
  const { setBetTarget } = useBetQuickPick();

  useEffect(() => {
    const t = setTimeout(() => setPhase("idle"), 10);
    return () => clearTimeout(t);
  }, []);

  function handleClose() {
    setPhase("exit");
    setTimeout(onClose, 450);
    play("button");
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

            {/* Visual +/- blocked while game is running */}
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

            {/* Quick-pick grid — sets bet immediately */}
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
          <div className="w-full max-w-[420px] mx-auto space-y-6 text-center">
            <PartTitle>SETTINGS</PartTitle>
            <TinyMuted>Adjust general preferences for your game.</TinyMuted>

            {/* Volume Control */}
            <div className="p-4 rounded-xl border border-sky-400/25 bg-white/5 space-y-3">
              <div className="font-bold text-sky-300 mb-2">Audio Volume</div>
              <input
                type="range"
                min="0"
                max="100"
                step="1"
                defaultValue={70}
                className="w-full accent-orange-500 cursor-pointer"
                onInput={(e) => {
                  const volume = e.target.value / 100;
                  setVolume(volume);
                }}
              />
            </div>

            {/* Toggle Splash Screen */}
            <div className="p-4 rounded-xl border border-sky-400/25 bg-white/5 flex items-center justify-between">
              <div className="text-left">
                <div className="font-bold text-sky-300">Show Splash Screen</div>
                <div className="text-sm opacity-90">
                  Enable or disable intro splash screen.
                </div>
              </div>

              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  defaultChecked={true}
                  onChange={(e) => {
                    console.log("Splash screen enabled:", e.target.checked);
                  }}
                />
                <div className="w-12 h-6 bg-gray-500 rounded-full peer peer-checked:bg-orange-500 transition-colors">
                  <div className="absolute top-[2px] left-[2px] w-5 h-5 bg-white rounded-full shadow-md transition-transform duration-300 peer-checked:translate-x-6" />
                </div>
              </label>
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
          onClick={() => {
            play("button");
            setActiveTab("bet")
          }}
          alt="Cash"
        />
        <IconButton
          size={20}
          icon="/info_unhover.png"
          hoverIcon="/info_hover.png"
          activeIcon="/info_selected.png"
          isActive={activeTab === "rules"}
          onClick={() => {
            setActiveTab("rules");
            play("button");
          }}
          alt="Info"
        />
        <IconButton
          size={20}
          icon="/settings_unhover.png"
          hoverIcon="/settings_hover.png"
          activeIcon="/settings_selected.png"
          isActive={activeTab === "settings"}
          onClick={() => {
            play("button");
            setActiveTab("settings")
          }}
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
