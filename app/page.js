"use client";
import Image from "next/image";
import GameBoard from "./components/GameBoard";
import Controls from "./components/Controls";

export default function Home() {
  return (
    <div
      className="min-h-screen w-full flex items-center justify-center bg-[url('/main-img.jpg')] bg-cover bg-center"
    >
      {/* Main mobile container */}
      <div className="w-[30%] min-w-[320px] max-w-[400px] h-[100vh] bg-[url('/game-img.jpg')] bg-cover bg-center shadow-xl flex flex-col overflow-hidden">
        
        {/* Game Area */}
        <div className="flex-1 flex items-center justify-center bg-transparent">
          <GameBoard  />

        </div>

        {/* Bet & Controls Area */}
        <div className="h-[120px] bg-black/70 p-4 flex flex-col items-center justify-center">
          <Controls />
        </div>
      </div>
    </div>
  );
}
