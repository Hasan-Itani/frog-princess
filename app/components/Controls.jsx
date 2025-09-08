"use client";

export default function Controls({ onOpenSettings }) {
  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center text-white">
      <div className="flex items-center justify-between w-full">
        {/* Balance */}
        <div className="flex flex-col text-left">
          <span className="text-xs opacity-70">BALANCE</span>
          <span className="text-yellow-400 font-bold text-sm">1,234.20 EUR</span>
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
          onClick={onOpenSettings}
          className="ml-2 bg-yellow-600 w-6 h-6 flex items-center justify-center rounded-full text-sm font-bold"
        >
          ⚙️
        </button>
      </div>
    </div>
  );
}
