"use client";
import Image from "next/image";

export default function Home() {
  return (
    <div
      className="min-h-screen w-full flex items-center justify-center bg-[url('/main-img.jpg')] bg-cover bg-center"
    >
      {/* Main mobile container */}
      <div className="w-[30%] min-w-[320px] max-w-[400px] h-[100vh] bg-[url('/game-img.jpg')] bg-cover bg-center shadow-xl flex flex-col overflow-hidden">
        
        {/* Game Area */}
        <div className="flex-1 flex items-center justify-center bg-transparent">
          <p className="text-white text-xl font-bold">Game Area (Frog + Pads)</p>
        </div>

        {/* Bet & Controls Area */}
        <div className="h-[120px] bg-black/70 p-4 flex flex-col items-center justify-center">
          <p className="text-white text-lg">Bet Controls Here</p>
          <button className="mt-2 px-4 py-2 bg-green-600 text-white rounded-lg">
            Place Bet
          </button>
        </div>
      </div>
    </div>
  );
}
