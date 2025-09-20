"use client";

import {
  createContext,
  useContext,
  useMemo,
  useState,
  useEffect,
  useCallback,
} from "react";

/** Payout multipliers per level (index == level). */
export const MULTIPLIERS = [
  1.2, 1.5, 1.9, 2.4, 3, 5, 8, 14, 23, 30, 100, 250, 600, 1500,
];

/** Discrete bet amounts (selected via betIndex). */
const BET_STEPS = [0.3, 0.5, 1, 1.5, 2, 2.5, 3, 4, 5, 6, 7, 8, 9, 10, 15, 20];

/** How long we let the loss reveal play before auto-reset (ms). */
const LOSS_REVEAL_MS = 900;

const GameContext = createContext(null);

/**
 * GameProvider
 *
 * Centralized game state for the Frog ladder:
 * - Balance, bet and bet step management
 * - Run lifecycle (start, advance, collect, drop, finish/reset)
 * - Overlay state for wins
 * - Computed helpers (formatting, nextWin preview, etc.)
 */
export function GameProvider({ children }) {
  // --- Wallet / bet -----------------------------------------------------------
  const [balance, setBalance] = useState(100);
  const [betIndex, setBetIndex] = useState(2); // -> BET_STEPS[2] === 1
  const bet = BET_STEPS[betIndex]; // current numeric bet
  const canDecrementBet = betIndex > 0;
  const canIncrementBet = betIndex < BET_STEPS.length - 1;

  // --- Audio toggle -----------------------------------------------------------
  const [muted, setMuted] = useState(false);

  // --- Run state --------------------------------------------------------------
  const [isPlaying, setIsPlaying] = useState(false);
  const [level, setLevel] = useState(0); // 0..MULTIPLIERS.length
  const [currentWin, setCurrentWin] = useState(0); // realized win at current level
  const [finishReason, setFinishReason] = useState(null); // 'collect' | 'drop' | 'all' | null
  const [showWinOverlay, setShowWinOverlay] = useState(false);
  const [overlayAmount, setOverlayAmount] = useState(0);
  const [finishing, setFinishing] = useState(false);

  const levelsCount = MULTIPLIERS.length;

  /** Format numbers to two decimals as a string (UI helper). */
  const format = useCallback((v) => `${v.toFixed(2)}`, []);

  /** Preview of what the win would be if we advance one level right now. */
  const nextWinIfAdvance = useMemo(() => {
    if (level < levelsCount) return +(bet * MULTIPLIERS[level]).toFixed(2);
    return currentWin;
  }, [level, levelsCount, bet, currentWin]);

  // --- Lifecycle helpers ------------------------------------------------------

  function resetRun() {
    setIsPlaying(false);
    setLevel(0);
    setCurrentWin(0);
    setFinishReason(null);
  }

  /** Attempt to start a run (deducts bet from balance). Returns boolean success. */
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

  /**
   * Advance one level (computes win at that level).
   * If we reach the final level, auto-finishes as "all".
   */
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

  /** Collect the current win immediately (finishes the run). */
  function collectNow() {
    if (!isPlaying || finishing) return;
    finishRun("collect", currentWin);
  }

  /** Force a loss ("drop") now. */
  function dropNow(forceNow = false) {
    if (finishing) return;
    finishRun("drop", 0, forceNow);
  }

  /**
   * Finalizes the run.
   * - reason: "collect" | "drop" | "all"
   * - amount: number (payout added on win; 0 on loss)
   * - forceNow: allow finishing even if not playing (edge control)
   */
  function finishRun(reason, amount, forceNow = false) {
    if (finishing || (!isPlaying && !forceNow)) return;

    setFinishing(true);
    setFinishReason(reason);

    if (amount > 0) {
      setBalance((b) => +(b + amount).toFixed(2));
    }

    setOverlayAmount(amount);

    if (amount > 0) {
      // WIN: show overlay, then auto-reset
      setTimeout(() => setShowWinOverlay(true), 220);
    } else {
      // LOSS: board handles reveal; after a short delay, reset the run
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

  // Auto-hide win overlay and reset run afterwards
  useEffect(() => {
    if (!showWinOverlay) return;
    const t = setTimeout(() => {
      setShowWinOverlay(false);
      setFinishing(false);
      resetRun();
    }, 2200);
    return () => clearTimeout(t);
  }, [showWinOverlay]);

  // --- Bet controls (exposed actions) ----------------------------------------

  const incrementBet = useCallback(() => {
    if (canIncrementBet) setBetIndex((i) => i + 1);
  }, [canIncrementBet]);

  const decrementBet = useCallback(() => {
    if (canDecrementBet) setBetIndex((i) => i - 1);
  }, [canDecrementBet]);

  /** Set bet via index, safely clamped to available steps. */
  const setBetByIndex = useCallback((idx) => {
    if (Number.isFinite(idx)) {
      const clamped = Math.max(
        0,
        Math.min(BET_STEPS.length - 1, Math.floor(idx))
      );
      setBetIndex(clamped);
    }
  }, []);

  // --- Context value ----------------------------------------------------------

  const value = {
    // state
    balance,
    bet,
    betIndex,
    muted,
    isPlaying,
    level,
    currentWin,
    nextWinIfAdvance,
    finishReason,
    showWinOverlay,
    overlayAmount,
    levelsCount,

    // constants/helpers for consumers
    MULTIPLIERS,
    BET_STEPS,
    format,

    // guards for UI
    canIncrementBet,
    canDecrementBet,

    // actions
    setMuted,
    startRun,
    advanceOneLevel,
    collectNow,
    dropNow,
    incrementBet,
    decrementBet,
    setBetByIndex,
  };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

/** Consumer hook for the game context. */
export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error("useGame must be used within <GameProvider>");
  return ctx;
}
