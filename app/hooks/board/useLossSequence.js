"use client";
import { useEffect, useRef, useState } from "react";
import useAudioRandom from "../audio/useAudioRandom";

/**
 * Manages the loss sequence:
 * - detect "drop" transition
 * - play drown, then mark 'disappear' after small delay
 * - wait until the specific trap tile has dissolved, then calls onRestart()
 */
export default function useLossSequence({
  finishReason,
  frogRow,
  frogCol,
  dissolvedPads, // map {"row:col": true}
  onRestart, // bumpSpawnWave + triggerEntry
}) {
  const [lossSeq, setLossSeq] = useState({
    active: false,
    row: null,
    col: null,
    disappearDone: false,
  });
  const prevFinishRef = useRef(finishReason);
  const timerRef = useRef(null);
  const { playRandom } = useAudioRandom();

  // Enter loss sequence on new 'drop'
  useEffect(() => {
    if (finishReason === "drop" && prevFinishRef.current !== "drop") {
      setLossSeq({
        active: true,
        row: frogRow,
        col: frogCol,
        disappearDone: false,
      });
      playRandom("frog_drown", 3);

      clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        setLossSeq((s) => ({ ...s, disappearDone: true }));
      }, 600);
    }
    prevFinishRef.current = finishReason;
    return () => clearTimeout(timerRef.current);
  }, [finishReason, frogRow, frogCol, playRandom]);

  // When the killer tile finished dissolving AND disappear sound fired → restart
  useEffect(() => {
    if (!lossSeq.active) return;
    const key =
      lossSeq.row != null && lossSeq.col != null
        ? `${lossSeq.row}:${lossSeq.col}`
        : null;
    if (key && lossSeq.disappearDone && dissolvedPads[key]) {
      onRestart?.();
      setLossSeq({ active: false, row: null, col: null, disappearDone: false });
    }
  }, [lossSeq, dissolvedPads, onRestart]);

  return { lossSeq, setLossSeq };
}
