"use client";
import { useState } from "react";
import GameBoard from "./components/GameBoard";
import Controls from "./components/Controls";
import SettingsPanel from "./components/SettingsPanel";
import { GameProvider } from "./hooks/useGame";
import { DebugProvider } from "./hooks/useDebug"; // ⬅️ added
import useAudio from "./hooks/useAudio";
import SakuraFall from "./components/ui/SakuraFall";

function OverlayStart({ children }) {
  const [started, setStarted] = useState(false);
  const { play } = useAudio();

  const handleStart = () => {
    setStarted(true);
    play("ambience");
  };

  if (!started) {
    return (
      <div
        className="absolute inset-0 z-50 bg-black/80 flex items-center justify-center text-white cursor-pointer"
        onClick={handleStart}
      >
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">TRY YOUR LUCK!</h1>
          <p className="text-sm opacity-70">LEAD THE FROG TO THE END</p>
          <p className="text-sm opacity-70">AND WIN X1500</p>
          <p className="text-sm opacity-70">AVOID DROPS</p>
          <p className="text-sm mt-40 opacity-70">PRESS TO START</p>
        </div>
      </div>
    );
  }

  return children;
}

export default function Home() {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("rules");

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[url('/main-img.jpg')] bg-cover bg-center">
      <div className="relative w-[400px] h-[100vh] bg-[url('/game-img.jpg')] bg-cover bg-center shadow-xl flex flex-col overflow-hidden">
        <DebugProvider>
          {/* ⬅️ added provider */}
          <SakuraFall />
          <GameProvider>
            <OverlayStart>
              {/* Game area */}
              <div className="flex-1 flex items-center justify-center bg-transparent">
                <GameBoard />
              </div>

              {/* Controls area */}
              <div className="flex items-center justify-center">
                <Controls
                  onOpenSettings={() => {
                    setSettingsOpen(true);
                    setActiveTab("rules");
                  }}
                />
              </div>

              {/* Settings panel with slide open/close */}
              {settingsOpen && (
                <SettingsPanel
                  activeTab={activeTab}
                  setActiveTab={setActiveTab}
                  onClose={() => setSettingsOpen(false)}
                />
              )}
            </OverlayStart>
          </GameProvider>
        </DebugProvider>
      </div>
    </div>
  );
}
