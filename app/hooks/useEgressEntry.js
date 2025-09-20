"use client";

import { useCallback, useEffect, useState } from "react";

/**
 * useEgressEntry
 *
 * Handles frog egress (side exit on win/collect) and entry (from bottom when idle).
 * You provide helpers to compute "from" and "to" centers:
 *  - captureCurrentPerchCenter(): {x,y} of the frog's current perch (pad/rock)
 *  - getRockCenter(): {x,y} of the rock center
 *
 * Params:
 *  - finishReason: 'collect' | 'all' | 'drop' | null
 *  - frogCol: number | null         // used to decide left/right egress
 *  - frogFacingDeg: number          // initial facing for entry
 *  - boardRef: RefObject<HTMLElement>
 *  - getRockCenter: () => {x:number,y:number} | null
 *  - captureCurrentPerchCenter: () => {x:number,y:number} | null
 *  - frogSize: number               // px; used to push egress fully off-screen
 *
 * Returns:
 *  - egress: { from:{x,y}, to:{x,y}, facingDeg:number } | null
 *  - setEgress: React.Dispatch      // exposed for one-off overrides/cancellation
 *  - entry:  { from:{x,y}, to:{x,y}, facingDeg:number } | null
 *  - setEntry:  React.Dispatch
 *  - triggerEntry(): void           // start bottom->rock entry animation
 */
export default function useEgressEntry({
  finishReason,
  frogCol,
  frogFacingDeg,
  boardRef,
  getRockCenter,
  captureCurrentPerchCenter,
  frogSize,
}) {
  const [egress, setEgress] = useState(null);
  const [entry, setEntry] = useState(null);

  // Trigger side egress on win/collect
  useEffect(() => {
    if (finishReason !== "collect" && finishReason !== "all") return;
    const from = captureCurrentPerchCenter?.();
    const boardEl = boardRef?.current;
    if (!from || !boardEl || !Number.isFinite(frogSize)) return;

    const { width: boardW } = boardEl.getBoundingClientRect();

    // Default to "left half" if frogCol is null/undefined
    const col = Number.isFinite(frogCol) ? frogCol : 2;
    const goLeft = col <= 2;

    // Push well off-screen so the frog fully exits
    const toX = goLeft ? -frogSize * 2 : boardW + frogSize * 2;
    const to = { x: toX, y: from.y - 20 };
    const facingDeg = goLeft ? 180 : 0;

    setEgress({ from, to, facingDeg });
  }, [finishReason, frogCol, frogSize, boardRef, captureCurrentPerchCenter]);

  // Enter from bottom towards rock
  const triggerEntry = useCallback(() => {
    const boardEl = boardRef?.current;
    if (!boardEl) return;

    const to = getRockCenter?.();
    if (!to) return;

    const { height: boardH } = boardEl.getBoundingClientRect();
    const from = { x: to.x, y: boardH + 100 };

    setEntry({ from, to, facingDeg: frogFacingDeg });
  }, [boardRef, getRockCenter, frogFacingDeg]);

  return { egress, setEgress, entry, setEntry, triggerEntry };
}
