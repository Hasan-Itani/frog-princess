"use client";
import { useState } from "react";

export default function Controls() {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center text-white">
      {/* Панель управления */}
      {!open && (
        <div className="flex items-center justify-between w-full">
          {/* Balance */}
          <div className="flex flex-col text-left">
            <span className="text-xs opacity-70">BALANCE</span>
            <span className="text-yellow-400 font-bold text-sm">1,234.00 EUR</span>
          </div>

          {/* Bet */}
          <div className="flex items-center gap-2">
            <button className="bg-yellow-500 text-black w-6 h-6 rounded-full font-bold">-</button>
            <span className="text-sm font-bold">1.00 EUR</span>
            <button className="bg-yellow-500 text-black w-6 h-6 rounded-full font-bold">+</button>
          </div>

          {/* Win */}
          <div className="flex flex-col text-right">
            <span className="text-xs opacity-70">WIN</span>
            <span className="text-green-400 font-bold text-sm">GOOD LUCK!</span>
          </div>

          {/* Кнопка меню */}
          <button
            onClick={() => setOpen(true)}
            className="ml-2 bg-yellow-600 w-6 h-6 flex items-center justify-center rounded-full text-sm font-bold"
          >
            ⚙️
          </button>
        </div>
      )}

      {/* Окно настроек внутри контейнера игры */}
      {open && (
        <div className="absolute inset-0 w-full h-full bg-[url('/game-img.jpg')] bg-cover bg-center flex flex-col items-center justify-center z-50 animate-fadeIn">
          <h1 className="text-2xl font-bold text-yellow-300 mb-4">RULES</h1>

          <p className="text-center text-white text-sm max-w-xs leading-snug">
            PLACE YOUR BET <br />
            CHOOSE YOUR BET ON THE COUNTER <br />
            SELECT WATER LILY <br />
            AVOID DROPS!
          </p>

          <button
            onClick={() => setOpen(false)}
            className="mt-6 px-6 py-2 bg-green-600 rounded-lg text-lg font-bold"
          >
            CLOSE
          </button>
        </div>
      )}
    </div>
  );
}
