"use client";

import { useCallback, useLayoutEffect, useRef, useState } from "react";

/**
 * usePerchOverlay
 *
 * Centralizes refs for board / rows viewport / rock / pads, and computes the
 * frog overlay target (center point) based on current perch (rock or pad).
 *
 * - Keeps `frogXY` updated to the best-known perch center.
 * - Exposes `onRowsShift(shiftY)` so callers can offset cached frog position
 *   after row slide animations.
 * - Provides helpers to compute centers and capture a "current perch" center.
 *
 * Params:
 *  - frogRow: number   // -1 means "on rock", otherwise row index
 *  - frogCol: number   // current column (ignored if frogRow === -1)
 *  - isJumping: boolean
 *  - rockOffsets: { xOffset: number, yOffset: number } // fine-tunes rock center
 *
 * Returns:
 *  - refs: boardRef, rowsViewportRef, rockRef, setPadRef(row,col)
 *  - frogXY: { x:number, y:number }   // overlay target center
 *  - frogReady: boolean                // true once a valid target is known
 *  - onRowsShift(shiftY:number): void  // call after rows slide completes
 *  - helpers: getRockCenter(), captureCurrentPerchCenter()
 */
export default function usePerchOverlay({
  frogRow,
  frogCol,
  isJumping,
  rockOffsets: { xOffset = 0, yOffset = 0 } = {},
}) {
  // --- Refs to DOM anchors ----------------------------------------------------
  const boardRef = useRef(null);
  const rowsViewportRef = useRef(null);
  const rockRef = useRef(null);

  // Store pad elements keyed by "row:col"
  const padRefs = useRef(new Map());
  const setPadRef = (row, col) => (el) => {
    const key = `${row}:${col}`;
    if (el) padRefs.current.set(key, el);
    else padRefs.current.delete(key);
  };

  // --- Frog overlay state -----------------------------------------------------
  const [frogXY, setFrogXY] = useState({ x: 0, y: 0 });
  const [frogReady, setFrogReady] = useState(false);
  const frogIdleXYRef = useRef(null); // last stable (non-jumping) target

  // --- Helpers to compute centers relative to board ---------------------------
  const getCenterInBoard = useCallback((el) => {
    if (!el || !boardRef.current) return null;
    const b = boardRef.current.getBoundingClientRect();
    const r = el.getBoundingClientRect();
    return {
      x: r.left - b.left + r.width / 2,
      y: r.top - b.top + r.height / 2,
    };
  }, []);

  const getRockCenter = useCallback(() => {
    const c = getCenterInBoard(rockRef.current);
    if (!c) return null;
    return { x: c.x + xOffset, y: c.y + yOffset };
  }, [getCenterInBoard, xOffset, yOffset]);

  const getPadCenter = useCallback(
    (row, col) => {
      const el = padRefs.current.get(`${row}:${col}`);
      return el ? getCenterInBoard(el) : null;
    },
    [getCenterInBoard]
  );

  // Update the frog's target based on current state; retries once via rAF if layout isn't ready
  const rafIdRef = useRef(0);
  const updateFrogTarget = useCallback(() => {
    let target = null;

    if (frogRow === -1) {
      target = getRockCenter();
    } else {
      target =
        getPadCenter(frogRow, frogCol) ??
        frogIdleXYRef.current ??
        getRockCenter();
    }

    if (target) {
      setFrogXY(target);
      if (!frogReady) setFrogReady(true);
      if (!isJumping) frogIdleXYRef.current = target;
    } else if (typeof window !== "undefined") {
      // If DOM hasn't settled this frame, try again on next frame.
      rafIdRef.current = window.requestAnimationFrame(updateFrogTarget);
    }
  }, [frogRow, frogCol, isJumping, getRockCenter, getPadCenter, frogReady]);

  // Keep target updated on mount & whenever relevant inputs change
  useLayoutEffect(() => {
    updateFrogTarget();
    return () => {
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = 0;
      }
    };
  }, [updateFrogTarget]);

  /** Called by rows slider after it animates to keep cached perch aligned */
  const onRowsShift = useCallback(
    (shiftY) => {
      if (frogIdleXYRef.current) {
        frogIdleXYRef.current = {
          x: frogIdleXYRef.current.x,
          y: frogIdleXYRef.current.y + shiftY,
        };
        // Also nudge live position if we're not jumping
        if (!isJumping) {
          setFrogXY((p) => ({ x: p.x, y: p.y + shiftY }));
        }
      }
    },
    [isJumping]
  );

  /** Best-guess current center of the frog's perch for overlay start */
  const captureCurrentPerchCenter = useCallback(() => {
    let from =
      frogRow === -1 ? getRockCenter() : getPadCenter(frogRow, frogCol);
    if (!from && frogIdleXYRef.current) from = frogIdleXYRef.current;
    if (!from) from = getRockCenter(); // final fallback
    return from; // may be null if layout isn't ready yet
  }, [frogRow, frogCol, getRockCenter, getPadCenter]);

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
