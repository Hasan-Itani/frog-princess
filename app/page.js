"use client";
import { useState } from "react";
import GameBoard from "./components/GameBoard";
import Controls from "./components/Controls";

export default function Home() {
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <div
      className="min-h-screen w-full flex items-center justify-center bg-[url('/main-img.jpg')] bg-cover bg-center"
    >
      <div className="relative w-[30%] min-w-[320px] max-w-[400px] h-[100vh] bg-[url('/game-img.jpg')] bg-cover bg-center shadow-xl flex flex-col overflow-hidden">
        
        <div className="flex-1 flex items-center justify-center bg-transparent">
          <GameBoard />
        </div>

        <div className="h-[120px] bg-black/70 p-4 flex flex-col items-center justify-center">
          <Controls onOpenSettings={() => setSettingsOpen(true)} />
        </div>

        {settingsOpen && (
          <div className="absolute inset-0 bg-black/85 text-white z-50 animate-slideIn flex flex-col">
            <div className="bg-black/90 text-yellow-400 text-lg font-bold text-center py-3">
              RULES
            </div>

            <div className="flex-1 overflow-y-auto p-4 text-center">
              <p className="text-xl text-yellow-300 mb-4">PLACE YOUR BET</p>
              <p className="text-3xl text-orange-400 font-extrabold mb-4">- 10 +</p>
              <p className="text-sm mb-6 text-gray-200">
                CHOOSE YOUR BET ON THE COUNTER.
              </p>

              <p className="text-xl text-yellow-300 mb-4">SELECT WATER LILY</p>
              <img src="/lilly.png" alt="Water Lily" className="mx-auto w-24" />
            </div>

            <div className="p-4">
              <button
                onClick={() => setSettingsOpen(false)}
                className="w-full py-3 bg-green-600 rounded-lg text-lg font-bold"
              >
                CLOSE
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
