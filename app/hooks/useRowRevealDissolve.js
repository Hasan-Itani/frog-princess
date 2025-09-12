"use client";
import { useEffect, useRef, useState } from "react";

/**
 * Bumps a per-row key when that row becomes revealed,
 * and manages a map of pads that should be hidden after their dissolve finishes.
 */
export default function useRowRevealDissolve(visibleIndices, shouldRevealRow, spawnWaveKey) {
  const [rowRevealKey, setRowRevealKey] = useState({}); // { rowIndex: n }
  const prevRevealRef = useRef({});

  useEffect(() => {
    setRowRevealKey((prev) => {
      const next = { ...prev };
      visibleIndices.forEach((idx) => {
        const now = shouldRevealRow(idx);
        const was = !!prevRevealRef.current[idx];
        if (now && !was) next[idx] = (next[idx] || 0) + 1;
        prevRevealRef.current[idx] = now;
      });
      return next;
    });
  }, [visibleIndices, shouldRevealRow]);

  const [dissolvedPads, setDissolvedPads] = useState({}); // { "row:col": true }
  const markDissolved = (row, col) =>
    setDissolvedPads((m) => ({ ...m, [`${row}:${col}`]: true }));

  // reset dissolved pads on new spawn wave
  useEffect(() => {
    setDissolvedPads({});
  }, [spawnWaveKey]);

  return { rowRevealKey, dissolvedPads, markDissolved };
}
