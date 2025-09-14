"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useGame } from "./useGame";
import { dropsForLevel } from "./useDrops";
import { play } from "./audioManager";
import {
  PADS_PER_ROW,
  WINDOW_SIZE,
  rotationsForRow,
  floatParams,
  angleToCol,
} from "./useBoardVisuals";

const DEFAULT_ROCK_FACING = -120;

const HOP_MS = 360;
const SIT_MS = 10;

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

  const [frogRow, setFrogRow] = useState(-1);
  const [frogCol, setFrogCol] = useState(2);
  const [frogPhase, setFrogPhase] = useState("idle");
  const [frogFacingDeg, setFrogFacingDeg] = useState(DEFAULT_ROCK_FACING);

  const [runSeed, setRunSeed] = useState(null);
  const [revealedMap, setRevealedMap] = useState({});
  const [revealAll, setRevealAll] = useState(false);

  const [isJumping, setIsJumping] = useState(false);
  const [jumpMeta, setJumpMeta] = useState(null);

  const [windowBase, setWindowBase] = useState(0);

  useEffect(() => {
    if (isJumping) return;
    const base = Math.floor(level / WINDOW_SIZE) * WINDOW_SIZE;
    const maxBase = Math.max(0, Math.min(levelsCount - 1, base));
    if (maxBase !== windowBase) setWindowBase(maxBase);
  }, [level, levelsCount, isJumping, windowBase]);

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

  const getTraps = useCallback(
    (rowIdx) => {
      const seed = runSeed ?? 123456789;
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

      const fromCol = frogRow < 0 || frogRow < windowBase ? 2 : frogCol;
      setFrogFacingDeg(angleToCol(fromCol, col));

      setFrogRow(rowIdx);
      setFrogCol(col);
      setFrogPhase("jump");
      play("jump", { clone: true });
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
      isPlaying,
      startRun,
      runSeed,
      ensureRunSeed,
      frogRow,
      frogCol,
      windowBase,
    ]
  );

  const onFrogJumpEnd = useCallback(() => {
  if (!jumpMeta) return;
  const { row, trap, starting } = jumpMeta;

  setFrogPhase("idle");

  if (trap) {
    setTimeout(() => {
      const full = {};
      for (let i = 0; i < levelsCount; i++) full[i] = true;

      setRevealAll(true);
      setRevealedMap(full);

      setFrogPhase("curl");
      dropNow(true);

      setIsJumping(false);
      setJumpMeta(null);

      // 🔊 Звуки — после обновления состояния
      const sounds = ["failed", "failed_2"];
      const sounds2 = ["wohoo", "woopie"];

      const randomSound = sounds[Math.floor(Math.random() * sounds.length)];
      play(randomSound, { clone: true });

      setTimeout(() => {
        const randomSound2 = sounds2[Math.floor(Math.random() * sounds2.length)];
        play(randomSound2, { clone: true });
      }, 1000);

    }, SIT_MS);
  } else {
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
