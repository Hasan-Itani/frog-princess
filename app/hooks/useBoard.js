"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useGame } from "./useGame";

const PADS_PER_ROW = 5;
const WINDOW_SIZE = 5;
const DEFAULT_ROCK_FACING = -120;

/* -------- visuals weight per row (based on current level) -------- */
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

/* -------- calm float params -------- */
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

/* -------- cosmetic rotations -------- */
function rotationsForRow(rowIndex) {
  const out = [];
  let x = ((rowIndex + 7) * 1103515245 + 12345) % 2147483647;
  for (let i = 0; i < PADS_PER_ROW; i++) {
    x = (1103515245 * x + 12345) % 2147483647;
    out.push(((x % 60) - 30) * 1);
  }
  return out;
}

/* -------- drop distribution 1..14 → 1,1,1,1,1, 2,2,2,2, 3,3,3, 4,4 -------- */
function dropsForLevel(idx) {
  const n = idx + 1;
  if (n >= 1 && n <= 5) return 1;
  if (n >= 6 && n <= 9) return 2;
  if (n >= 10 && n <= 12) return 3;
  return 4; // 13-14
}

/* -------- traps by seed -------- */
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
    showWinOverlay,
    overlayAmount,
    level,
    levelsCount,
  } = useGame();

  // frog visuals
  const [frogRow, setFrogRow] = useState(-1);
  const [frogCol, setFrogCol] = useState(2);
  const [frogPhase, setFrogPhase] = useState("idle"); // "idle" | "jump" | "curl"
  const [frogFacingDeg, setFrogFacingDeg] = useState(DEFAULT_ROCK_FACING);

  // run-scoped randomness + reveal state
  const [runSeed, setRunSeed] = useState(null);
  const [revealedMap, setRevealedMap] = useState({});
  const [revealAll, setRevealAll] = useState(false);

  // freeze interactions during hop
  const [isJumping, setIsJumping] = useState(false);

  // ===== Page base in steps of 5 (0,5,10,...) =====
  const [windowBase, setWindowBase] = useState(0);

  // simple angle from current col → target col (we always move "up" one row)
  function angleToCol(fromCol, toCol) {
    const dx = toCol - fromCol; // left(-) / right(+)
    const dy = -1;              // up one row in screen coords
    return (Math.atan2(dy, dx) * 180) / Math.PI; // CSS rotate degrees
  }

  // When not jumping, update base only when we step into the next 5-pack
  useEffect(() => {
    if (isJumping) return;
    const base = Math.floor(level / WINDOW_SIZE) * WINDOW_SIZE;
    const maxBase = Math.max(0, Math.min(levelsCount - 1, base));
    if (maxBase !== windowBase) setWindowBase(maxBase);
  }, [level, levelsCount, isJumping, windowBase]);

  // True reset
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

  const ensureRunSeed = useCallback(() => {
    if (runSeed !== null) return runSeed;
    const seedNow = (Date.now() ^ Math.floor(Math.random() * 0x7fffffff)) >>> 0;
    setRunSeed(seedNow);
    return seedNow;
  }, [runSeed]);

  // ===== Visible indices for the current page (last page can be < 5) =====
  const visibleIndices = useMemo(() => {
    const remaining = Math.max(0, levelsCount - windowBase);
    const pageSize = Math.min(WINDOW_SIZE, remaining);
    const top = windowBase + pageSize - 1; // inclusive
    const out = [];
    for (let idx = top; idx >= windowBase; idx--) out.push(idx); // top → bottom
    return out;
  }, [windowBase, levelsCount]);

  // convenience: page meta
  const pageSize = visibleIndices.length;
  const isFinalPage = pageSize < WINDOW_SIZE;

  const getTraps = useCallback(
    (rowIdx) => {
      const seed = runSeed ?? 123456789; // deterministic preview pre-start
      return trapsForRow(rowIdx, PADS_PER_ROW, seed);
    },
    [runSeed]
  );

  // Opacity uses the actual current level
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
        !showWinOverlay &&
        !isJumping
      );
    },
    [isPlaying, level, revealAll, showWinOverlay, isJumping]
  );

  const onPadClick = useCallback(
    (rowIdx, col) => {
      if (revealAll || showWinOverlay || isJumping) return;
      if (rowIdx !== level) return;

      const starting = !isPlaying;
      if (starting) {
        const ok = startRun();
        if (!ok) return;
      }

      const seed = runSeed ?? ensureRunSeed();

      // facing: if previous perch is on an older page, aim from rock (col=2)
      const fromCol = (frogRow < 0 || frogRow < windowBase) ? 2 : frogCol;
      setFrogFacingDeg(angleToCol(fromCol, col));

      // hop (visual state)
      setFrogRow(rowIdx);
      setFrogCol(col);
      setFrogPhase("jump");
      setIsJumping(true);

      const traps = trapsForRow(rowIdx, PADS_PER_ROW, seed);
      const clickedIsTrap = traps.has(col);

      if (clickedIsTrap) {
        const full = {};
        for (let i = 0; i < levelsCount; i++) full[i] = true;
        setRevealAll(true);
        setRevealedMap(full);
        dropNow(true);
        setTimeout(() => {
          setFrogPhase("curl");
          setIsJumping(false);
        }, 220);
        return;
      }

      // safe
      setRevealedMap((m) => ({ ...m, [rowIdx]: true }));
      const HOP_MS = 360; // sync with FrogSprite jump
      setTimeout(() => {
        advanceOneLevel(starting);
        setTimeout(() => {
          setFrogPhase("idle");
          setIsJumping(false);
        }, 40);
      }, HOP_MS);
    },
    [
      isJumping,
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
      frogRow,
      frogCol,
      windowBase,
    ]
  );

  return {
    // state
    frogRow,
    frogCol,
    frogPhase,
    visibleIndices, // last page can be < 5
    pageSize,
    isFinalPage,
    showWinOverlay,
    overlayAmount,
    isJumping,
    frogFacingDeg,

    // per-row helpers
    getTraps,
    rowOpacity,
    shouldRevealRow,
    isRowClickable,

    // actions
    onPadClick,

    // visuals helpers
    rotationsForRow,
    floatParams,

    // constants
    constants: { PADS_PER_ROW, WINDOW_SIZE },
  };
}
