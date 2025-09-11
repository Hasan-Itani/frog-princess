"use client";
import { useState } from "react";
import GameBoard from "./components/GameBoard";
import Controls from "./components/Controls";
import SettingsPanel from "./components/SettingsPanel";
import { GameProvider } from "./hooks/useGame";
import { DebugProvider } from "./hooks/useDebug"; // ⬅️ added
import SakuraFall from "./components/ui/SakuraFall";

function OverlayStart({ children }) {
  const [started, setStarted] = useState(false);

  const handleStart = () => {
    setStarted(true);
  };

  if (!started) {
    return (
      <div
        className="absolute inset-0 z-50 flex items-center justify-center text-white cursor-pointer"
        onClick={handleStart}
      >
        <div className="text-center select-none pulse-soft">
          <div className="text-2xl font-extrabold text-green-400">
            TRY YOUR LUCK!
          </div>
          <br />
          <div className=" text-2xl font-extrabold text-green-400">
            LEAD THE FROG TO THE END
          </div>
          <div className=" text-2xl font-extrabold text-green-400">
            AND WIN <span className="text-3xl text-yellow-200">x1500</span>
          </div>
          <div className=" text-2xl font-extrabold text-green-400">
            AVOID DROPS!
          </div>
          <div className="mt-16 text-2xl font-extrabold uppercase">
            PRESS TO START
          </div>
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
