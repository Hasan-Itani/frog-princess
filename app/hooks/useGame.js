"use client";
import {
  createContext,
  useContext,
  useMemo,
  useState,
  useEffect,
  useCallback,
} from "react";

// 14 levels, in order from level 1 → 14
export const MULTIPLIERS = [
  1.2, 1.5, 1.9, 2.4, 3, 5, 8, 14, 23, 30, 100, 250, 600, 1500,
];

// Discrete bet steps (from your settings grid)
const BET_STEPS = [0.3, 0.5, 1, 1.5, 2, 2.5, 3, 4, 5, 6, 7, 8, 9, 10, 15, 20];

const GameContext = createContext(null);

export function GameProvider({ children }) {
  const [balance, setBalance] = useState(100);
  const [betIndex, setBetIndex] = useState(2); // default 1 EUR
  const bet = BET_STEPS[betIndex];

  const [muted, setMuted] = useState(false);

  // run state
  const [isPlaying, setIsPlaying] = useState(false);
  const [level, setLevel] = useState(0); // how many levels completed
  const [currentWin, setCurrentWin] = useState(0); // = bet × multiplier(levelJustCompleted)
  const [finishReason, setFinishReason] = useState(null); // "collect" | "all" | "drop" | null
  const [showWinOverlay, setShowWinOverlay] = useState(false);
  const [overlayAmount, setOverlayAmount] = useState(0);

  const canDecrementBet = betIndex > 0;
  const canIncrementBet = betIndex < BET_STEPS.length - 1;

  const format = useCallback((v) => `${v.toFixed(2)} EUR`, []);
  const levelsCount = MULTIPLIERS.length;

  // Next line prize if we advance one more level (always bet × next multiplier)
  const nextWinIfAdvance = useMemo(() => {
    if (level < levelsCount) return +(bet * MULTIPLIERS[level]).toFixed(2);
    return currentWin;
  }, [level, levelsCount, bet, currentWin]);

  function resetRun() {
    setIsPlaying(false);
    setLevel(0);
    setCurrentWin(0);
    setFinishReason(null);
  }

  function startRun() {
    if (isPlaying) return true;
    if (balance < bet) {
      alert("Insufficient balance for this bet.");
      return false;
    }
    setBalance((b) => +(b - bet).toFixed(2)); // deduct bet once at start
    setIsPlaying(true);
    setLevel(0);
    setCurrentWin(0);
    return true;
  }

  // Advance to the next level (successful jump)
  function advanceOneLevel() {
    if (!isPlaying) return;
    if (level >= levelsCount) return;

    const multiplierThisLevel = MULTIPLIERS[level];
    const newWin = +(bet * multiplierThisLevel).toFixed(2); // <-- NON-COMPOUND

    setCurrentWin(newWin);
    const newLevel = level + 1;
    setLevel(newLevel);

    if (newLevel === levelsCount) {
      // cleared all levels → final prize is the last line's bet × multiplier
      finishRun("all", newWin);
    }
  }

  // Player collects current line prize
  function collectNow() {
    if (!isPlaying) return;
    finishRun("collect", currentWin);
  }

  // Player drops (future trap)
  function dropNow() {
    if (!isPlaying) return;
    finishRun("drop", 0);
  }

  function finishRun(reason, amount) {
    setFinishReason(reason);
    if (amount > 0) setBalance((b) => +(b + amount).toFixed(2));
    setOverlayAmount(amount);
    setShowWinOverlay(true);
  }

  // Hide overlay then reset run
  useEffect(() => {
    if (!showWinOverlay) return;
    const t = setTimeout(() => {
      setShowWinOverlay(false);
      resetRun();
    }, 2200);
    return () => clearTimeout(t);
  }, [showWinOverlay]);

  const value = {
    // values
    balance,
    bet,
    betIndex,
    format,
    muted,
    isPlaying,
    level,
    currentWin,
    nextWinIfAdvance,
    finishReason,
    showWinOverlay,
    overlayAmount,
    levelsCount,
    MULTIPLIERS,
    BET_STEPS,
    canIncrementBet,
    canDecrementBet,
    setMuted,
    incrementBet: () => canIncrementBet && setBetIndex((i) => i + 1),
    decrementBet: () => canDecrementBet && setBetIndex((i) => i - 1),
    startRun,
    advanceOneLevel,
    collectNow,
    dropNow,
  };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error("useGame must be used within <GameProvider>");
  return ctx;
}
