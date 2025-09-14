"use client";
import { useState } from "react";
import GameBoard from "./components/GameBoard";
import Controls from "./components/Controls";
import SettingsPanel from "./components/SettingsPanel";
import { GameProvider } from "./hooks/useGame";
import { DebugProvider } from "./hooks/useDebug"; 
import SakuraFall from "./components/animations/SakuraFall";
import Water from "./components/animations/Water";
import Swipe from "./components/animations/Swipe";
import Image from "next/image";

function OverlayStart({ children }) {
  const [started, setStarted] = useState(false);

  const handleStart = () => {
    setStarted(true);
  };

  if (!started) {
    return (
      <div
        className="absolute inset-0 z-50 flex flex-col items-center justify-center text-white cursor-pointer p-4 text-center"
        onClick={handleStart}
      >
        {/* Картинка сверху */}
        <div className="relative w-[400px] min-h-screen bg-[url('/intro.jpg')] bg-cover bg-center shadow-[0_20px_50px_rgba(0,0,0,2.0)] flex flex-col overflow-hidden">
          <div className="select-none pulse-soft space-y-1 mt-120 bg-black/70 rounded-5xl">
            <div className="text-xl font-extrabold text-green-400">
              TRY YOUR LUCK!
            </div>
            <div className="text-lg font-extrabold text-green-400">
              LEAD THE FROG TO THE END
            </div>
            <div className="text-lg font-extrabold text-green-400">
              AND WIN <span className="text-2xl text-yellow-200">x1500</span>
            </div>
            <div className="text-lg font-extrabold text-green-400">
              AVOID DROPS!
            </div>
            <div className="mt-6 text-xl font-extrabold uppercase text-green-300 animate-pulse">
              PRESS TO START
            </div>
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
      <div className="relative w-[400px] h-[100vh] bg-[url('/game-img.jpg')] bg-cover bg-center shadow-[0_20px_50px_rgba(0,0,0,2.0)] flex flex-col overflow-hidden">
        <DebugProvider>
          <Swipe />
          <SakuraFall />
          <div className="absolute inset-0 flex items-center justify-center gap-8">
            <div>
              <Water width="120px" height="120px" />
              <Water width="120px" height="120px" />
              <Water width="120px" height="120px" />
            </div>
            <div>
              <Water width="120px" height="120px" />
              <Water width="120px" height="120px" />
              <Water width="120px" height="120px" />
            </div>
          </div>
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
