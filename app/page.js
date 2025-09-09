"use client";
import { useState } from "react";
import GameBoard from "./components/GameBoard";
import Controls from "./components/Controls";
import SettingsPanel from "./components/SettingsPanel";
import { GameProvider } from "./hooks/useGame";

export default function Home() {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("rules");

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[url('/main-img.jpg')] bg-cover bg-center">
      <div className="relative w-[400px] h-[100vh] bg-[url('/game-img.jpg')] bg-cover bg-center shadow-xl flex flex-col overflow-hidden">
        <GameProvider>
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
        </GameProvider>
      </div>
    </div>
  );
}
