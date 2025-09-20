"use client";

import { useEffect, useRef, useState } from "react";
import { useMotionValue, animate } from "framer-motion";

/**
 * useRowsSlide
 *
 * Smoothly slides a vertically-stacked "rows track" whenever the visible window
 * (visibleIndices) pages up/down. After the slide completes, it calls onShift(shiftY)
 * so dependents (e.g., cached frog positions) can offset themselves.
 *
 * Params:
 *  - visibleIndices: number[]    // ordered, current window of row indices (top-first)
 *  - rowStride: number           // pixel distance between adjacent rows
 *  - onShift?: (shiftY:number)   // callback invoked after the slide finishes
 *
 * Returns:
 *  - renderedIndices: number[]   // what to render in the DOM during the slide
 *  - rowsY: MotionValue<number>  // y-offset applied to the rows container during anim
 */
export default function useRowsSlide(visibleIndices, rowStride, onShift) {
  // What we actually render during the animation; updated after slide completes.
  const [renderedIndices, setRenderedIndices] = useState(visibleIndices || []);

  // Track the previous "top" index to compute direction & distance.
  const prevTopRef = useRef(visibleIndices?.[0] ?? 0);

  // Motion value that drives the rows container translateY.
  const rowsY = useMotionValue(0);

  // Current animation controls + a token to ignore late resolves.
  const animRef = useRef(null);
  const animTokenRef = useRef(0);

  useEffect(() => {
    // Guard: need at least one visible index and a valid stride.
    if (!Array.isArray(visibleIndices) || visibleIndices.length === 0) return;
    if (!Number.isFinite(rowStride) || rowStride === 0) return;

    const prevTop = prevTopRef.current ?? visibleIndices[0];
    const nextTop = visibleIndices[0];

    // No paging change — nothing to animate.
    if (nextTop === prevTop) return;

    // Direction (+1 down / -1 up) and absolute pixel distance to move.
    const dir = Math.sign(nextTop - prevTop);
    const distance = Math.abs(nextTop - prevTop) * rowStride;
    const shift = dir > 0 ? distance : -distance;

    // Stop any in-flight animation and bump the token.
    if (animRef.current) animRef.current.stop?.();
    const myToken = ++animTokenRef.current;

    // Start from 0 each time to create a consistent slide.
    rowsY.set(0);
    const controls = animate(rowsY, shift, {
      duration: 0.22,
      ease: [0.2, 0.8, 0.2, 1],
    });
    animRef.current = controls;

    const finalize = () => {
      // Ignore resolves from an outdated animation.
      if (animTokenRef.current !== myToken) return;

      // Let dependents offset their cached positions.
      if (typeof onShift === "function") onShift(shift);

      // Swap in the new indices (what should be rendered post-slide).
      setRenderedIndices([...visibleIndices]);

      // Reset transform and commit the new "top" index.
      rowsY.set(0);
      prevTopRef.current = nextTop;

      // Clear current animation reference.
      animRef.current = null;
    };

    // Handle both success & cancel consistently.
    // framer-motion controls are thenable; use finally-like pattern.
    controls.then(finalize).catch(finalize);

    // Cleanup: stop on dependency change/unmount.
    return () => {
      if (animRef.current) animRef.current.stop?.();
    };
    // Include onShift to avoid stale closures when callback changes.
  }, [visibleIndices, rowStride, onShift]);

  return { renderedIndices, rowsY };
}
