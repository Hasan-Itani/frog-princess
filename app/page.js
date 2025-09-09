"use client";
import { useState } from "react";
import GameBoard from "./components/GameBoard";
import Controls from "./components/Controls";

export default function Home() {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("rules"); // rules | bet | info | settings

  return (
    <div
      className="min-h-screen w-full flex items-center justify-center bg-[url('/main-img.jpg')] bg-cover bg-center"
    >
      <div className="relative w-[30%] min-w-[320px] max-w-[400px] h-[100vh] bg-[url('/game-img.jpg')] bg-cover bg-center shadow-xl flex flex-col overflow-hidden">
        
        {/* Game board */}
        <div className="flex-1 flex items-center justify-center bg-transparent">
          <GameBoard />
        </div>

        {/* Controls */}
        <div className="h-[120px] bg-black/70 p-4 flex flex-col items-center justify-center">
          <Controls onOpenSettings={() => {
            setSettingsOpen(true);
            setActiveTab("rules");
          }} />
        </div>

        {/* Overlay */}
        {settingsOpen && (
          <div className="absolute inset-0 bg-black/85 text-white z-50 animate-slideIn flex flex-col">
            
            {/* Заголовок */}
            <div className="bg-black/90 text-yellow-400 text-lg font-bold text-center py-3">
              {activeTab === "bet" && "BET SETTINGS"}
              {activeTab === "rules" && "RULES"}
              {activeTab === "settings" && "SETTINGS"}
            </div>

            {/* Контент */}
            <div className="flex-1 overflow-y-auto p-4 text-center space-y-6">

              {activeTab === "bet" && (
                <div className="grid grid-cols-4 gap-3">
                  {[
                    "0.30 EUR","0.50 EUR","1 EUR","1.50 EUR","2 EUR","2.50 EUR",
                    "3 EUR","4 EUR","5 EUR","6 EUR","7 EUR","8 EUR",
                    "9 EUR","10 EUR","15 EUR","20 EUR"
                  ].map((bet, idx) => (
                    <button
                      key={idx}
                      className={`px-3 py-2 rounded-md font-bold ${
                        bet === "1 EUR"
                          ? "bg-white text-black"
                          : "bg-orange-500 text-black"
                      }`}
                    >
                      {bet}
                    </button>
                  ))}
                </div>
              )}

              {activeTab === "rules" && (
                <>
                  <div>
                    <h2 className="text-yellow-300 font-bold mb-2">HOW TO PLAY?</h2>
                    <p className="text-sm leading-relaxed">
                      Enter your bet on the counter. <br />
                      Choose a water lily for the next level to get your prize. <br />
                      Press the collect button anytime to get the prize, displayed on the flower.
                    </p>
                  </div>

                  {/* AWARDS */}
                  <div>
                    <h2 className="text-yellow-300 font-bold mb-2">AWARDS</h2>
                    <p className="text-sm leading-relaxed">
                      The game has 14 levels of water lilies with the following payouts:
                    </p>
                    <ul className="text-sm leading-relaxed mt-2 space-y-1">
                      <li>1500 x bet.</li>
                      <li>600 x bet.</li>
                      <li>250 x bet.</li>
                      <li>100 x bet.</li>
                      <li>30 x bet.</li>
                      <li>23 x bet.</li>
                      <li>14 x bet.</li>
                      <li>8 x bet.</li>
                      <li>5 x bet.</li>
                      <li>3 x bet.</li>
                      <li>2.4 x bet.</li>
                      <li>1.9 x bet.</li>
                      <li>1.5 x bet.</li>
                      <li>1.2 x bet.</li>
                    </ul>
                  </div>

                  {/* GAME FUNCTIONS */}
                  <div>
                    <h2 className="text-yellow-300 font-bold mb-2">GAME FUNCTIONS</h2>
                    <p className="text-sm leading-relaxed mb-3">
                      The table below lists the different buttons found in the game and describes their functions.
                    </p>
                    <div className="space-y-3 text-left">
                      <div>
                        <p className="font-bold">Bet</p>
                        <p className="text-sm">Click + and - to change bet.</p>
                      </div>
                      <div>
                        <p className="font-bold">Sound</p>
                        <p className="text-sm">Click to mute game sound.</p>
                      </div>
                      <div>
                        <p className="font-bold">Menu</p>
                        <p className="text-sm">Click to access the game settings and game rules.</p>
                      </div>
                    </div>
                  </div>

                  {/* GAME SETTINGS AND INFO */}
                  <div>
                    <h2 className="text-yellow-300 font-bold mb-2">GAME SETTINGS AND GAME INFORMATION</h2>
                    <div className="space-y-3 text-left">
                      <div>
                        <p className="font-bold">Bet Settings</p>
                        <p className="text-sm">Click to view the bet settings menu.</p>
                      </div>
                      <div>
                        <p className="font-bold">Rules</p>
                        <p className="text-sm">Click to view the game rules.</p>
                      </div>
                      <div>
                        <p className="font-bold">Settings</p>
                        <p className="text-sm">Click to view the game settings menu.</p>
                      </div>
                      <div>
                        <p className="font-bold">Close</p>
                        <p className="text-sm">Click to go back to the main game.</p>
                      </div>
                    </div>
                  </div>

                  {/* ADDITIONAL INFO */}
                  <div>
                    <h2 className="text-yellow-300 font-bold mb-2">ADDITIONAL INFORMATION</h2>
                    <p className="text-sm leading-relaxed">
                      The game has a system for recovering unfinished games. <br />
                      The game session will be ended automatically after an inactivity period. <br />
                      In the event of malfunction of the gaming hardware/software, all affected
                      game bets and payouts are rendered void and all affected bets refunded.
                    </p>
                  </div>

                  {/* RETURN TO PLAYER */}
                  <div>
                    <h2 className="text-yellow-300 font-bold mb-2">RETURN TO PLAYER</h2>
                    <p className="text-sm leading-relaxed">
                      The theoretical return to the player for this game in the main game is <span className="text-orange-400 font-bold">96.12%</span>.
                    </p>
                  </div>
                </>
              )}

              {activeTab === "settings" && (
                <div className="space-y-3 text-left">
                  <div>
                    <p className="font-bold">Sound</p>
                    <p className="text-sm">Click to mute game sound.</p>
                  </div>
                  <div>
                    <p className="font-bold">Menu</p>
                    <p className="text-sm">Click to access the game settings and rules.</p>
                  </div>
                </div>
              )}
            </div>

            {/* Нижние кнопки */}
            <div className="flex items-center justify-around bg-black/90 py-3">
              <button onClick={() => setActiveTab("bet")} className="text-yellow-400 text-2xl">💰</button>
              <button onClick={() => setActiveTab("rules")} className="text-white text-2xl">ℹ️</button>
              <button onClick={() => setActiveTab("settings")} className="text-yellow-500 text-2xl">⚙️</button>
              <button
                onClick={() => setSettingsOpen(false)}
                className="text-green-400 text-2xl"
              >
                ❌
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
