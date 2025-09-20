"use client";
import { useEffect, useState } from "react";

/** Tracks the jump start point for overlay frog, stays in sync while jumping. */
export default function useOverlayFromSync({
  isJumping,
  captureCurrentPerchCenter,
}) {
  const [overlayFrom, setOverlayFrom] = useState(null);

  // capture on jump start (or if missing while jumping)
  useEffect(() => {
    if (isJumping && !overlayFrom) {
      const from = captureCurrentPerchCenter?.();
      if (from) setOverlayFrom(from);
    }
  }, [isJumping, overlayFrom, captureCurrentPerchCenter]);

  // clear on jump end
  useEffect(() => {
    if (!isJumping) setOverlayFrom(null);
  }, [isJumping]);

  return { overlayFrom, setOverlayFrom };
}
