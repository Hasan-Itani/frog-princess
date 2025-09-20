"use client";

import { useGame } from "./useGame";

/**
 * useBetQuickPick
 *
 * Sets the bet directly to a target index (e.g., from quick-pick buttons).
 * - No-op while a run is in progress.
 * - If the provider exposes setBetByIndex, use it (preferred).
 * - Otherwise, step using increment/decrement the required number of times.
 */
export default function useBetQuickPick() {
  const {
    betIndex,
    isPlaying,
    setBetByIndex,
    incrementBet,
    decrementBet,
    BET_STEPS, // optional (available from GameProvider)
  } = useGame();

  function setBetTarget(idx) {
    // Block updates during an active run
    if (isPlaying) return;

    // Validate target
    if (!Number.isFinite(idx)) return;

    // Optional clamp if BET_STEPS is available
    const maxIdx =
      Array.isArray(BET_STEPS) && BET_STEPS.length > 0
        ? BET_STEPS.length - 1
        : null;
    const target =
      maxIdx !== null ? Math.max(0, Math.min(maxIdx, Math.floor(idx))) : idx;

    // Already at target
    if (target === betIndex) return;

    // Prefer direct setter if provided by context (handles clamping internally too)
    if (typeof setBetByIndex === "function") {
      setBetByIndex(target);
      return;
    }

    // Fallback: step incrementally by the delta
    const delta = target - betIndex;
    const step = delta > 0 ? incrementBet : decrementBet;
    for (let i = 0; i < Math.abs(delta); i++) step();
  }

  return { setBetTarget, betIndex, isPlaying };
}
