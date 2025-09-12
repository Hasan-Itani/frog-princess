"use client";
import { useEffect, useState } from "react";

/**
 * Handles frog egress (side exit on win/collect) and entry (from bottom when idle).
 * You provide utilities to know "from" and "to" centers.
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

  // trigger side egress on win/collect
  useEffect(() => {
    if (finishReason !== "collect" && finishReason !== "all") return;
    const from = captureCurrentPerchCenter();
    if (!from || !boardRef.current) return;

    const boardW = boardRef.current.getBoundingClientRect().width;
    const goLeft = (frogCol ?? 2) <= 2;
    const toX = goLeft ? -frogSize * 2 : boardW + frogSize * 2;
    const to = { x: toX, y: from.y - 20 };
    const facingDeg = goLeft ? 180 : 0;
    setEgress({ from, to, facingDeg });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [finishReason]);

  // helper to enter from bottom towards rock
  function triggerEntry() {
    if (!boardRef.current) return;
    const to = getRockCenter();
    const b = boardRef.current.getBoundingClientRect();
    if (!to) return;
    const from = { x: to.x, y: b.height + 100 };
    setEntry({ from, to, facingDeg: frogFacingDeg });
  }

  return { egress, setEgress, entry, setEntry, triggerEntry };
}
