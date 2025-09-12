"use client";
import { useLayoutEffect, useRef, useState } from "react";

/**
 * Centralizes board/rock/pads refs + frog perch targeting.
 * Exposes helpers to compute centers and to react to row shifts.
 */
export default function usePerchOverlay({
  frogRow,
  frogCol,
  isJumping,
  rockOffsets: { xOffset, yOffset },
}) {
  const boardRef = useRef(null);
  const rowsViewportRef = useRef(null);
  const rockRef = useRef(null);

  const padRefs = useRef(new Map());
  const setPadRef = (row, col) => (el) => {
    const key = `${row}:${col}`;
    if (el) padRefs.current.set(key, el);
    else padRefs.current.delete(key);
  };

  const [frogXY, setFrogXY] = useState({ x: 0, y: 0 });
  const [frogReady, setFrogReady] = useState(false);
  const frogIdleXYRef = useRef(null);

  const getCenterInBoard = (el) => {
    if (!el || !boardRef.current) return null;
    const b = boardRef.current.getBoundingClientRect();
    const r = el.getBoundingClientRect();
    return {
      x: r.left - b.left + r.width / 2,
      y: r.top - b.top + r.height / 2,
    };
  };

  const getRockCenter = () => {
    const c = getCenterInBoard(rockRef.current);
    if (!c) return null;
    return { x: c.x + xOffset, y: c.y + yOffset };
  };

  const updateFrogTarget = () => {
    let target = null;
    if (frogRow === -1) {
      target = getRockCenter();
    } else {
      const key = `${frogRow}:${frogCol}`;
      const padEl = padRefs.current.get(key);
      target = padEl
        ? getCenterInBoard(padEl)
        : frogIdleXYRef.current || getRockCenter();
    }
    if (target) {
      setFrogXY(target);
      if (!frogReady) setFrogReady(true);
      if (!isJumping) frogIdleXYRef.current = target;
    } else if (typeof window !== "undefined") {
      requestAnimationFrame(updateFrogTarget);
    }
  };

  // keep target updated
  useLayoutEffect(() => {
    updateFrogTarget();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useLayoutEffect(() => {
    updateFrogTarget();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [frogRow, frogCol, isJumping]);

  /** called by rows slider after it animates */
  const onRowsShift = (shiftY) => {
    if (frogIdleXYRef.current) {
      frogIdleXYRef.current = {
        x: frogIdleXYRef.current.x,
        y: frogIdleXYRef.current.y + shiftY,
      };
    }
  };

  /** best-guess current center of the frog's perch for overlay start */
  const captureCurrentPerchCenter = () => {
    let from = null;
    if (frogRow === -1) {
      from = getRockCenter();
    } else {
      const curEl = padRefs.current.get(`${frogRow}:${frogCol}`);
      from = curEl ? getCenterInBoard(curEl) : null;
    }
    if (!from && frogIdleXYRef.current) from = frogIdleXYRef.current;
    if (!from) from = getRockCenter();
    return from;
  };

  return {
    // refs
    boardRef,
    rowsViewportRef,
    rockRef,
    setPadRef,

    // frog overlay positioning
    frogXY,
    frogReady,
    onRowsShift,

    // helpers
    getRockCenter,
    captureCurrentPerchCenter,
  };
}
