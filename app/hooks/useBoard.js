"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useGame } from "./useGame";

const PADS_PER_ROW = 5;
const WINDOW_SIZE = 5;

/* --- visuals weight per row (same behavior) --- */
function opacityForRow(rowIndex, level) {
  if (rowIndex === level) return 1;
  if (rowIndex === level - 1) return 0.5;
  const d = rowIndex - level;
  if (d <= 0) return 0.5;
  if (d === 1) return 0.8;
  if (d === 2) return 0.6;
  if (d === 3) return 0.4;
  return 0.2;
}

/* --- deterministic float params (calmer) --- */
function floatParams(rowIndex, col = 0) {
  let x = (((rowIndex + 1) * 73856093) ^ ((col + 1) * 19349663)) >>> 0;
  const rnd = () => {
    x = (1664525 * x + 1013904223) >>> 0;
    return x / 0xffffffff;
  };
  const bob = 1 + rnd() * 1.5;
  const tilt = 0.15 + rnd() * 0.35;
  const drift = 0.4 + rnd() * 0.8;
  const dur = 4.2 + rnd() * 2.2;
  const delay = rnd() * 0.8;
  return { bob, tilt, drift, dur, delay };
}

/* --- deterministic cosmetic rotations --- */
function rotationsForRow(rowIndex) {
  const out = [];
  let x = ((rowIndex + 7) * 1103515245 + 12345) % 2147483647;
  for (let i = 0; i < PADS_PER_ROW; i++) {
    x = (1103515245 * x + 12345) % 2147483647;
    out.push(((x % 60) - 30) * 1);
  }
  return out;
}

/* --- how many drops per level (1..14) --- */
function dropsForLevel(idx) {
  const n = idx + 1;
  if (n >= 1 && n <= 5) return 1;
  if (n >= 6 && n <= 9) return 2;
  if (n >= 10 && n <= 12) return 3;
  return 4; // 13-14
}

/* --- trap indices per row, based on a run seed --- */
function trapsForRow(levelIdx, padsPerRow, runSeed) {
  const want = Math.min(dropsForLevel(levelIdx), padsPerRow - 1);
  const traps = new Set();
  let x = (runSeed ^ ((levelIdx + 1) * 2654435761)) >>> 0;
  const mod = 0x7fffffff;
  while (traps.size < want) {
    x = (1103515245 * x + 12345) % mod;
    traps.add(Math.abs(x) % padsPerRow);
  }
  return traps;
}

export default function useBoard() {
  const {
    isPlaying,
    startRun,
    advanceOneLevel,
    dropNow,
    level,
    levelsCount,
    showWinOverlay,
    overlayAmount,
  } = useGame();

  // frog visual state
  const [frogRow, setFrogRow] = useState(-1);
  const [frogCol, setFrogCol] = useState(2);

  // run-scoped randomness + reveal state
  const [runSeed, setRunSeed] = useState(null);
  const [revealedMap, setRevealedMap] = useState({}); // {rowIdx: true}
  const [revealAll, setRevealAll] = useState(false);

  // reset local state only when round truly resets
  useEffect(() => {
    if (!isPlaying && level === 0) {
      setFrogRow(-1);
      setFrogCol(2);
      setRevealedMap({});
      setRevealAll(false);
      setRunSeed(null);
    }
  }, [isPlaying, level]);

  const ensureRunSeed = useCallback(() => {
    if (runSeed !== null) return runSeed;
    const seedNow = (Date.now() ^ Math.floor(Math.random() * 0x7fffffff)) >>> 0;
    setRunSeed(seedNow);
    return seedNow;
  }, [runSeed]);

  // which rows are on screen (windowed)
  const visibleIndices = useMemo(() => {
    const maxBottom = Math.max(0, levelsCount - WINDOW_SIZE);
    const bottom = Math.min(Math.max(level - 1, 0), maxBottom);
    const top = Math.min(bottom + WINDOW_SIZE - 1, levelsCount - 1);
    const out = [];
    for (let idx = top; idx >= bottom; idx--) out.push(idx);
    return out;
  }, [level, levelsCount]);

  // computed helpers the component can use
  const getTraps = useCallback(
    (rowIdx) => {
      const seed = runSeed ?? 123456789; // deterministic preview before start
      return trapsForRow(rowIdx, PADS_PER_ROW, seed);
    },
    [runSeed]
  );

  const rowOpacity = useCallback(
    (rowIdx) => opacityForRow(rowIdx, level),
    [level]
  );

  const shouldRevealRow = useCallback(
    (rowIdx) => revealAll || !!revealedMap[rowIdx],
    [revealAll, revealedMap]
  );

  const isRowClickable = useCallback(
    (rowIdx) => {
      const canStartNewRun =
        !isPlaying && level === 0 && !revealAll && !showWinOverlay;
      return (
        rowIdx === level &&
        (isPlaying || canStartNewRun) &&
        !revealAll &&
        !showWinOverlay
      );
    },
    [isPlaying, level, revealAll, showWinOverlay]
  );

  const onPadClick = useCallback(
    (rowIdx, col) => {
      if (revealAll || showWinOverlay) return;
      if (rowIdx !== level) return;

      const starting = !isPlaying;
      if (starting) {
        const ok = startRun(); // deduct bet, set isPlaying
        if (!ok) return;
      }

      const seed = runSeed ?? ensureRunSeed();

      // move frog immediately
      setFrogRow(rowIdx);
      setFrogCol(col);

      const traps = trapsForRow(rowIdx, PADS_PER_ROW, seed);
      const clickedIsTrap = traps.has(col);

      if (clickedIsTrap) {
        const full = {};
        for (let i = 0; i < levelsCount; i++) full[i] = true;
        setRevealAll(true);
        setRevealedMap(full);
        dropNow(true);
        return;
      }

      // safe: reveal only this row and advance
      setRevealedMap((m) => ({ ...m, [rowIdx]: true }));
      advanceOneLevel(starting);
    },
    [
      revealAll,
      showWinOverlay,
      level,
      isPlaying,
      startRun,
      runSeed,
      ensureRunSeed,
      levelsCount,
      dropNow,
      advanceOneLevel,
    ]
  );

  return {
    // state
    frogRow,
    frogCol,
    visibleIndices,
    showWinOverlay,
    overlayAmount,

    // per-row helpers
    getTraps,
    rowOpacity,
    shouldRevealRow,
    isRowClickable,

    // actions
    onPadClick,

    // visuals helpers for caller
    rotationsForRow,
    floatParams,

    // constants (exported in case you want them)
    constants: { PADS_PER_ROW, WINDOW_SIZE },
  };
}
