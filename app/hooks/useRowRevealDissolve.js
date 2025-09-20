"use client";

import { useEffect, useRef, useState } from "react";

/**
 * useRowRevealDissolve
 *
 * - Bumps a per-row key when that row becomes "revealed" (false -> true),
 *   so you can replay a flipbook/animation by using the key in React.
 * - Tracks pads that should be hidden after their dissolve finishes.
 *
 * Params:
 *  - visibleIndices: number[]             // currently visible row indices (top-first)
 *  - shouldRevealRow: (rowIdx:number)=>boolean
 *  - spawnWaveKey: number                 // increments when a new wave spawns
 *
 * Returns:
 *  - rowRevealKey: Record<rowIdx, number> // use rowRevealKey[row] as a React key
 *  - dissolvedPads: Record<"row:col", true>
 *  - markDissolved(row, col): void        // mark a specific pad as dissolved
 *  - getRowRevealKey(row): number         // convenience accessor (0 if absent)
 */
export default function useRowRevealDissolve(
  visibleIndices,
  shouldRevealRow,
  spawnWaveKey
) {
  // Per-row bump counters for reveal animations
  const [rowRevealKey, setRowRevealKey] = useState({}); // { [rowIndex]: n }
  // Tracks the last-known "revealed" boolean per row (even if currently off-screen)
  const prevRevealRef = useRef({}); // { [rowIndex]: boolean }

  useEffect(() => {
    // Guards
    if (!Array.isArray(visibleIndices) || visibleIndices.length === 0) return;
    if (typeof shouldRevealRow !== "function") return;

    const visSet = new Set(visibleIndices);

    // If a row is no longer visible, mark it as not revealed so when it returns
    // and shouldRevealRow(row) becomes true again, it will bump the key.
    for (const idxStr of Object.keys(prevRevealRef.current)) {
      const idx = Number(idxStr);
      if (!visSet.has(idx)) prevRevealRef.current[idx] = false;
    }

    setRowRevealKey((prev) => {
      const next = { ...prev };

      for (const idx of visibleIndices) {
        const now = !!shouldRevealRow(idx);
        const was = !!prevRevealRef.current[idx];
        if (now && !was) next[idx] = (next[idx] || 0) + 1;
        prevRevealRef.current[idx] = now;
      }

      return next;
    });
  }, [visibleIndices, shouldRevealRow]);

  // When a new spawn wave happens, clear previous reveal state so rows can bump again
  // as they become revealed under the new wave.
  useEffect(() => {
    prevRevealRef.current = {};
  }, [spawnWaveKey]);

  // Dissolve bookkeeping -------------------------------------------------------

  const [dissolvedPads, setDissolvedPads] = useState({}); // { "row:col": true }

  /** Mark a specific pad as dissolved (hide after dissolve finishes). */
  const markDissolved = (row, col) =>
    setDissolvedPads((m) => ({ ...m, [`${row}:${col}`]: true }));

  /** Reset dissolved pads on new spawn wave. */
  useEffect(() => {
    setDissolvedPads({});
  }, [spawnWaveKey]);

  // Convenience accessor (avoids undefined checks at call sites)
  const getRowRevealKey = (row) => rowRevealKey[row] || 0;

  return { rowRevealKey, getRowRevealKey, dissolvedPads, markDissolved };
}
