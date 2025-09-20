"use client";
import { useEffect, useRef } from "react";

/**
 * When we transition to idle (not playing + level 0), trigger a spawn + entry.
 * Honors an external "suppress until intro done" ref flag.
 */
export default function useEntryOnIdle({
  isPlaying,
  level,
  suppressUntilIntroDoneRef,
  lossActive,
  bumpSpawnWave,
  triggerEntry,
}) {
  const prevIdleRef = useRef(false);

  useEffect(() => {
    const idleNow = !isPlaying && level === 0;
    const wasIdle = prevIdleRef.current;

    if (
      !suppressUntilIntroDoneRef.current &&
      idleNow &&
      !wasIdle &&
      !lossActive
    ) {
      bumpSpawnWave?.();
      triggerEntry?.();
    }
    prevIdleRef.current = idleNow;
  }, [
    isPlaying,
    level,
    suppressUntilIntroDoneRef,
    lossActive,
    bumpSpawnWave,
    triggerEntry,
  ]);
}
