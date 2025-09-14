"use client";
import {
  createContext,
  useContext,
  useMemo,
  useState,
  useEffect,
  useCallback,
} from "react";

export const MULTIPLIERS = [
  1.2, 1.5, 1.9, 2.4, 3, 5, 8, 14, 23, 30, 100, 250, 600, 1500,
];

const BET_STEPS = [0.3, 0.5, 1, 1.5, 2, 2.5, 3, 4, 5, 6, 7, 8, 9, 10, 15, 20];

const GameContext = createContext(null);
const LOSS_REVEAL_MS = 900;

export function GameProvider({ children }) {
  const [balance, setBalance] = useState(100);
  const [betIndex, setBetIndex] = useState(2);
  const bet = BET_STEPS[betIndex];

  const [muted, setMuted] = useState(false);

  const [isPlaying, setIsPlaying] = useState(false);
  const [level, setLevel] = useState(0);
  const [currentWin, setCurrentWin] = useState(0);
  const [finishReason, setFinishReason] = useState(null);
  const [showWinOverlay, setShowWinOverlay] = useState(false);
  const [overlayAmount, setOverlayAmount] = useState(0);
  const [finishing, setFinishing] = useState(false);

  const canDecrementBet = betIndex > 0;
  const canIncrementBet = betIndex < BET_STEPS.length - 1;

  const format = useCallback((v) => `${v.toFixed(2)}`, []);
  const levelsCount = MULTIPLIERS.length;

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
    setBalance((b) => +(b - bet).toFixed(2));
    setIsPlaying(true);
    setLevel(0);
    setCurrentWin(0);
    return true;
  }

  function advanceOneLevel(forceNow = false) {
    if (!isPlaying && !forceNow) return;
    if (level >= levelsCount) return;

    const multiplierThisLevel = MULTIPLIERS[level];
    const newWin = +(bet * multiplierThisLevel).toFixed(2);

    setCurrentWin(newWin);
    const newLevel = level + 1;
    setLevel(newLevel);

    if (newLevel === levelsCount) {
      finishRun("all", newWin);
    }
  }

  function collectNow() {
    if (!isPlaying || finishing) return;
    finishRun("collect", currentWin);
  }

  function dropNow(forceNow = false) {
    if (finishing) return;
    finishRun("drop", 0, forceNow);
  }

  function finishRun(reason, amount, forceNow = false) {
    if (finishing || (!isPlaying && !forceNow)) return;
    setFinishing(true);
    setFinishReason(reason);
    if (amount > 0) setBalance((b) => +(b + amount).toFixed(2));
    setOverlayAmount(amount);

    if (amount > 0) {
      // WIN: show overlay as before
      setTimeout(() => setShowWinOverlay(true), 220);
    } else {
      // LOSS: no overlay — reveal is handled by the board; then auto-reset
      setTimeout(() => {
        setShowWinOverlay(false);
        setOverlayAmount(0);
        setFinishing(false);
        setFinishReason(null);
        setCurrentWin(0);
        setLevel(0);
        setIsPlaying(false);
      }, LOSS_REVEAL_MS);
    }
  }

  useEffect(() => {
    if (!showWinOverlay) return;
    const t = setTimeout(() => {
      setShowWinOverlay(false);
      setFinishing(false);
      resetRun();
    }, 2200);
    return () => clearTimeout(t);
  }, [showWinOverlay]);

  const value = {
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
    setBetByIndex: (idx) => {
      if (idx >= 0 && idx < BET_STEPS.length) setBetIndex(idx);
    },
  };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error("useGame must be used within <GameProvider>");
  return ctx;
}
