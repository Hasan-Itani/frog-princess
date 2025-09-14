"use client";
import { useEffect, useRef, useState } from "react";
import { useMotionValue, animate } from "framer-motion";

/**
 * Handles paging/slide of rows track. Calls onShift(shiftY) after anim to allow
 * dependent systems (like frog perch) to offset their cached positions.
 */
export default function useRowsSlide(visibleIndices, rowStride, onShift) {
  const [renderedIndices, setRenderedIndices] = useState(visibleIndices);
  const prevTopRef = useRef(visibleIndices?.[0] ?? 0);
  const rowsY = useMotionValue(0);
  const rowsAnimRef = useRef(null);

  useEffect(() => {
    const prevTop = prevTopRef.current ?? visibleIndices[0];
    const nextTop = visibleIndices[0];

    if (nextTop === prevTop) return;

    const dir = Math.sign(nextTop - prevTop);
    const distance = Math.abs(nextTop - prevTop) * rowStride;
    const shift = dir > 0 ? distance : -distance;

    if (rowsAnimRef.current) rowsAnimRef.current.stop();

    rowsY.set(0);
    rowsAnimRef.current = animate(rowsY, shift, {
      duration: 0.22,
      ease: [0.2, 0.8, 0.2, 1],
    });

    const finalize = () => {
      if (onShift) onShift(shift);
      setRenderedIndices([...visibleIndices]);
      rowsY.set(0);
      prevTopRef.current = nextTop;
      rowsAnimRef.current = null;
    };

    rowsAnimRef.current.then(finalize).catch(finalize);

    return () => {
      if (rowsAnimRef.current) rowsAnimRef.current.stop();
    };
  }, [visibleIndices, rowStride]);

  return { renderedIndices, rowsY };
}
