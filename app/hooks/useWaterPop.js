"use client";

import { useState } from "react";

/**
 * useWaterPop
 *
 * Tracks "water-pop" animation keys for each lily pad cell (row:col).
 * Each time a pad is bumped, its key increments—this forces React
 * to remount the animation so it can replay.
 *
 * Example usage:
 *   const { bumpWaterPop, getWaterPopKey } = useWaterPop();
 *   <WaterPop key={getWaterPopKey(row, col)} />
 */
export default function useWaterPop() {
  // Map of cell identifier -> bump count
  // Example: { "2:3": 4 } means pad at row 2, col 3 was bumped 4 times
  const [waterPopKeys, setWaterPopKeys] = useState({});

  /**
   * Increment the bump counter for a given pad.
   * Calling this will cause any keyed animation at that cell to reset.
   */
  const bumpWaterPop = (row, col) => {
    const key = `${row}:${col}`;
    setWaterPopKeys((prev) => ({
      ...prev,
      [key]: (prev[key] || 0) + 1,
    }));
  };

  /**
   * Retrieve the current bump key for a given pad.
   * Use this as a React "key" prop to reset/replay animations.
   */
  const getWaterPopKey = (row, col) => waterPopKeys[`${row}:${col}`] || 0;

  /** Reset all water-pop keys (clears the map). */
  const resetWaterPops = () => setWaterPopKeys({});

  return { waterPopKeys, bumpWaterPop, getWaterPopKey, resetWaterPops };
}
