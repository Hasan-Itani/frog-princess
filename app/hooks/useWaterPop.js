"use client";
import { useState } from "react";

/** Tracks per-pad water-pop play keys and exposes a bump helper. */
export default function useWaterPop() {
  const [waterPopKeys, setWaterPopKeys] = useState({}); // { "row:col": n }

  const bumpWaterPop = (row, col) => {
    const k = `${row}:${col}`;
    setWaterPopKeys((m) => ({ ...m, [k]: (m[k] || 0) + 1 }));
  };

  const getWaterPopKey = (row, col) => waterPopKeys[`${row}:${col}`] || 0;

  const resetWaterPops = () => setWaterPopKeys({});

  return { waterPopKeys, getWaterPopKey, bumpWaterPop, resetWaterPops };
}
