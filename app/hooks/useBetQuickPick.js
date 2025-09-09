"use client";
import { useGame } from "./useGame";

export default function useBetQuickPick() {
  const { betIndex, isPlaying, setBetByIndex, incrementBet, decrementBet } =
    useGame();

  function setBetTarget(idx) {
    if (isPlaying) return; // can't change mid-round
    if (idx === betIndex) return;

    if (typeof setBetByIndex === "function") {
      setBetByIndex(idx);
      return;
    }

    // fallback: move step-by-step
    const delta = idx - betIndex;
    const step = delta > 0 ? incrementBet : decrementBet;
    for (let i = 0; i < Math.abs(delta); i++) step();
  }

  return { setBetTarget, betIndex, isPlaying };
}
