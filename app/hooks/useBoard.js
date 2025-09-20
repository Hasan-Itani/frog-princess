"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useGame } from "./useGame";
import { dropsForLevel } from "./useDrops";
import {
  PADS_PER_ROW,
  WINDOW_SIZE,
  rotationsForRow,
  floatParams,
  angleToCol,
} from "./useBoardVisuals";

const DEFAULT_ROCK_FACING = -120;
const SIT_MS = 10;

/** Row opacity falloff relative to the current level */
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

/** Deterministic trap positions for a row (stable per runSeed) */
function trapsForRow(levelIdx, padsPerRow, runSeed) {
  const want = Math.min(dropsForLevel(levelIdx), padsPerRow - 1); // never all pads
  const traps = new Set();
  let x = (runSeed ^ ((levelIdx + 1) * 2654435761)) >>> 0; // mix with row
  const mod = 0x7fffffff;

  while (traps.size < want) {
    x = (1103515245 * x + 12345) % mod; // LCG
    traps.add(Math.abs(x) % padsPerRow);
  }
  return traps;
}

/**
 * useBoard
 *
 * Owns the interactive board logic:
 * - frog position/phase/facing
 * - visible window paging
 * - trap generation (per-row, stable per-run)
 * - reveal flow, jump handling, and win/loss side-effects
 */
export default function useBoard() {
  const {
    isPlaying,
    startRun,
    advanceOneLevel,
    dropNow,
    showWinOverlay,
    overlayAmount,
    level,
    levelsCount,
  } = useGame();

  // Frog state
  const [frogRow, setFrogRow] = useState(-1); // -1 == on rock
  const [frogCol, setFrogCol] = useState(2);
  const [frogPhase, setFrogPhase] = useState("idle"); // idle | jump | curl
  const [frogFacingDeg, setFrogFacingDeg] = useState(DEFAULT_ROCK_FACING);

  // Run/reveal state
  const [runSeed, setRunSeed] = useState(null);
  const [revealedMap, setRevealedMap] = useState({}); // { [row]: true }
  const [revealAll, setRevealAll] = useState(false);

  // Motion state
  const [isJumping, setIsJumping] = useState(false);
  const [jumpMeta, setJumpMeta] = useState(null); // { row, col, trap, starting }

  // Paging (windowed rows)
  const [windowBase, setWindowBase] = useState(0);

  // Keep the window base aligned to the current level (when not mid-jump)
  useEffect(() => {
    if (isJumping) return;
    const base = Math.floor(level / WINDOW_SIZE) * WINDOW_SIZE;
    const maxBase = Math.max(0, Math.min(levelsCount - 1, base));
    if (maxBase !== windowBase) setWindowBase(maxBase);
  }, [level, levelsCount, isJumping, windowBase]);

  // Reset board when not playing and returned to level 0
  useEffect(() => {
    if (!isPlaying && level === 0) {
      setFrogRow(-1);
      setFrogCol(2);
      setFrogPhase("idle");
      setRevealedMap({});
      setRevealAll(false);
      setRunSeed(null);
      setIsJumping(false);
      setWindowBase(0);
      setFrogFacingDeg(DEFAULT_ROCK_FACING);
    }
  }, [isPlaying, level]);

  /** Ensure a run seed exists (stable for the duration of a run) */
  const ensureRunSeed = useCallback(() => {
    if (runSeed !== null) return runSeed;
    const seedNow = (Date.now() ^ Math.floor(Math.random() * 0x7fffffff)) >>> 0;
    setRunSeed(seedNow);
    return seedNow;
  }, [runSeed]);

  /** Visible row indices (top->bottom) for the current page */
  const visibleIndices = useMemo(() => {
    const remaining = Math.max(0, levelsCount - windowBase);
    const pageSize = Math.min(WINDOW_SIZE, remaining);
    const top = windowBase + pageSize - 1;
    const out = [];
    for (let idx = top; idx >= windowBase; idx--) out.push(idx);
    return out;
  }, [windowBase, levelsCount]);

  const pageSize = visibleIndices.length;
  const isFinalPage = pageSize < WINDOW_SIZE;

  /** Get traps for a specific row (uses runSeed or a neutral preview seed) */
  const getTraps = useCallback(
    (rowIdx) => {
      const seed = runSeed ?? 123456789; // allow preview before start
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

  /** Is a given row currently clickable (for the user to choose a pad)? */
  const isRowClickable = useCallback(
    (rowIdx) => {
      if (revealAll || showWinOverlay || isJumping) return false;
      const canStartNewRun = !isPlaying && level === 0;
      return rowIdx === level && (isPlaying || canStartNewRun);
    },
    [isPlaying, level, revealAll, showWinOverlay, isJumping]
  );

  /** Handle pad click: maybe start run, set frog target/phase, evaluate trap */
  const onPadClick = useCallback(
    (rowIdx, col) => {
      if (revealAll || showWinOverlay || isJumping) return;
      if (rowIdx !== level) return;
      if (level >= levelsCount) return; // extra guard

      const starting = !isPlaying;
      if (starting) {
        const ok = startRun();
        if (!ok) return;
      }

      const seed = runSeed ?? ensureRunSeed();

      // Face toward the clicked column; if frog is off-screen or behind, face from rock column 2
      const fromCol = frogRow < 0 || frogRow < windowBase ? 2 : frogCol;
      setFrogFacingDeg(angleToCol(fromCol, col));

      setFrogRow(rowIdx);
      setFrogCol(col);
      setFrogPhase("jump");
      setIsJumping(true);

      const traps = trapsForRow(rowIdx, PADS_PER_ROW, seed);
      const clickedIsTrap = traps.has(col);

      setJumpMeta({ row: rowIdx, col, trap: clickedIsTrap, starting });
    },
    [
      revealAll,
      showWinOverlay,
      isJumping,
      level,
      levelsCount,
      isPlaying,
      startRun,
      runSeed,
      ensureRunSeed,
      frogRow,
      frogCol,
      windowBase,
    ]
  );

  /** Called when the frog jump animation ends; decides win/lose flow */
  const onFrogJumpEnd = useCallback(() => {
    if (!jumpMeta) return;
    const { row, trap, starting } = jumpMeta;

    setFrogPhase("idle");

    if (trap) {
      // Reveal everything, curl the frog, and trigger a drop
      setTimeout(() => {
        const full = {};
        for (let i = 0; i < levelsCount; i++) full[i] = true;

        setRevealAll(true);
        setRevealedMap(full);

        setFrogPhase("curl");
        dropNow(true);

        setIsJumping(false);
        setJumpMeta(null);
      }, SIT_MS);
    } else {
      // Mark row revealed and advance
      setRevealedMap((m) => ({ ...m, [row]: true }));
      advanceOneLevel(starting);

      setIsJumping(false);
      setJumpMeta(null);
    }
  }, [jumpMeta, levelsCount, dropNow, advanceOneLevel]);

  return {
    // frog
    frogRow,
    frogCol,
    frogPhase,
    frogFacingDeg,

    // window/rows
    visibleIndices,
    pageSize,
    isFinalPage,

    // reveal / overlays
    showWinOverlay,
    overlayAmount,

    // motion state
    isJumping,

    // board api for UI
    getTraps,
    rowOpacity,
    shouldRevealRow,
    isRowClickable,

    onPadClick,
    onFrogJumpEnd,

    // expose visuals for legacy users (GameBoard now imports directly)
    rotationsForRow,
    floatParams,

    // expose sizing if anyone else needs them
    constants: { PADS_PER_ROW, WINDOW_SIZE },
  };
}
