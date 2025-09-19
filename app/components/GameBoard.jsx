// app/components/GameBoard.jsx
"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { motion, useAnimationControls } from "framer-motion";

import { useGame, MULTIPLIERS } from "../hooks/useGame";
import { useDebug } from "../hooks/useDebug";
import useBoard from "../hooks/useBoard";
import FlipbookImage from "./FlipbookImage";
import FrogSprite from "./animations/FrogSprite";

import useAudio from "../hooks/useAudio";

import useSpawnWave from "../hooks/useSpawnWave";
import useWaterPop from "../hooks/useWaterPop";
import useRowRevealDissolve from "../hooks/useRowRevealDissolve";
import useRowsSlide from "../hooks/useRowsSlide";
import usePerchOverlay from "../hooks/usePerchOverlay";
import useIntroSweep from "../hooks/useIntroSweep";
import useEgressEntry from "../hooks/useEgressEntry";
import SwipeTutorial from "./Tutorial/SwipeTutorial";
import Swipe from "./animations/Swipe";

import {
  PADS_PER_ROW,
  ROCK_SPACE,
  LILY_BTN,
  LILY_IMG,
  BADGE_W,
  BADGE_GUTTER,
  ROW_H,
  ROW_GAP,
  ROW_STRIDE,
  FROG_SIZE,
  ROCK_IMG,
  ROCK_FROG_Y_OFFSET,
  ROCK_FROG_X_OFFSET,
  floatParams,
  rotationsForRow,
} from "../hooks/useBoardVisuals";

/* ---------------- Frog lose flipbook (frog_lose_1..8) ---------------- */
function FrogLoseFlipbook({ size = 70, facingDeg = 0, fps = 20, onDone }) {
  const [frame, setFrame] = useState(1); // 1..8
  useEffect(() => {
    let f = 1;
    const id = setInterval(() => {
      f += 1;
      if (f > 8) {
        clearInterval(id);
        onDone?.();
      } else {
        setFrame(f);
      }
    }, Math.max(16, 1000 / fps));
    return () => clearInterval(id);
  }, [fps, onDone]);

  return (
    <div
      className="w-full h-full grid place-items-center"
      style={{ rotate: `${facingDeg}deg` }}
    >
      <img
        src={`/frog_lose_${frame}.png`}
        alt=""
        width={size}
        height={size}
        className="select-none pointer-events-none block"
        draggable={false}
      />
    </div>
  );
}

function MultiplierImages({ mult }) {
  const str = mult.toString();
  return (
    <div className="absolute inset-0 flex items-center justify-center gap-0.5 z-[20]">
      {str.split("").map((ch, i) => {
        let src;
        if (ch === "x" || ch === "X") src = "/multi_gray.png";
        else if (ch === ".") src = "/dot_gray.png";
        else src = `/${ch}.png`; // 0.png .. 9.png

        return (
          <img
            key={i}
            src={src}
            alt={ch}
            className="w-[11px] h-auto select-none pointer-events-none"
          />
        );
      })}
    </div>
  );
}

/* Fallback gold lily if Next/Image fails */
function GoldStatic({ size }) {
  const [srcs, setSrcs] = useState([
    "/gold_lilly.png",
    "/gold_lily.png",
    "/gold_lilly_1.png",
    "/gold_lily_1.png",
  ]);
  const src = srcs[0] ?? "/lilly_1.png";
  return (
    <Image
      src={src}
      alt=""
      width={size}
      height={size}
      className="pointer-events-none"
      onError={() => setSrcs((arr) => (arr.length > 1 ? arr.slice(1) : arr))}
    />
  );
}

export default function GameBoard() {
  const { format, finishReason, isPlaying, level } = useGame();
  const { showDrops } = useDebug();

  // ====== AUDIO ======
  const { playSfx } = useAudio();
  const playRandom = (base, count) =>
    playSfx(`${base}_${Math.floor(Math.random() * count)}`);

  // ====== LOSS SEQUENCE STATE (to gate restart) ======
  const [lossSeq, setLossSeq] = useState({
    active: false,
    row: null,
    col: null,
    disappearDone: false, // becomes true right after we play lilly_disappear
  });
  const lossTimerRef = useRef(null);

  // tutorial
  const IDLE_MS = 20000;
  const tutorialRoutes = [
    [
      { row: 0, col: 0 },
      { row: 1, col: 1 },
      { row: 2, col: 1 },
      { row: 3, col: 2 },
      { row: 4, col: 3 },
    ],
    [
      { row: 0, col: 2 },
      { row: 1, col: 3 },
      { row: 2, col: 3 },
      { row: 3, col: 4 },
      { row: 4, col: 3 },
    ],
    [
      { row: 0, col: 4 },
      { row: 1, col: 3 },
      { row: 2, col: 2 },
      { row: 3, col: 3 },
      { row: 4, col: 2 },
    ],
  ];

  const [showTutorial, setShowTutorial] = useState(false);
  const idleTimer = useRef(null);

  const resetIdle = () => {
    setShowTutorial(false);
    clearTimeout(idleTimer.current);
    idleTimer.current = setTimeout(() => setShowTutorial(true), IDLE_MS);
  };

  useEffect(() => {
    resetIdle();
    const handler = () => resetIdle();
    window.addEventListener("pointerdown", handler, { passive: true });
    window.addEventListener("keydown", handler);
    window.addEventListener("touchstart", handler, { passive: true });
    return () => {
      clearTimeout(idleTimer.current);
      window.removeEventListener("pointerdown", handler);
      window.removeEventListener("keydown", handler);
      window.removeEventListener("touchstart", handler);
    };
  }, []);

  const {
    visibleIndices,
    rowOpacity,
    getTraps,
    shouldRevealRow,
    isRowClickable,
    onPadClick,
    onFrogJumpEnd,

    frogRow,
    frogCol,
    frogFacingDeg,
    frogPhase,

    isJumping,
    showWinOverlay,
    overlayAmount,
  } = useBoard();

  /* ---------- hooks: spawn / water-pop / dissolve ---------- */
  const { spawnWaveKey, bumpSpawnWave } = useSpawnWave();
  const { getWaterPopKey, bumpWaterPop } = useWaterPop();
  const { rowRevealKey, dissolvedPads, markDissolved } = useRowRevealDissolve(
    visibleIndices,
    shouldRevealRow,
    spawnWaveKey
  );

  // smooth show → 3s breathe → slight shrink → fade out → dismiss
  const overlayCtrl = useAnimationControls();
  const [winDismissed, setWinDismissed] = useState(false);

  useEffect(() => {
    if (!showWinOverlay) return;

    playSfx("popup_win");

    setWinDismissed(false);

    (async () => {
      // start invisible, then quick fade-in
      overlayCtrl.set({ scale: 1, opacity: 0 });
      await overlayCtrl.start({
        opacity: 1,
        transition: { duration: 0.18, ease: [0.22, 1, 0.36, 1] },
      });

      // EXACT 3s of gentle breathing (two subtle swells)
      await overlayCtrl.start({
        scale: [1.0, 1.03, 1.0, 1.03, 1.0],
        transition: {
          duration: 3.0,
          ease: "easeInOut",
          times: [0, 0.25, 0.5, 0.75, 1],
        },
      });

      // Immediately fade out after breathing finishes
      await overlayCtrl.start({
        opacity: 0,
        transition: { duration: 0.6, ease: "easeOut" },
      });

      setWinDismissed(true);
    })();
  }, [showWinOverlay, overlayCtrl, playSfx]);

  /* ---------- NEW: Global Wipe when winning ---------- */
  const [winWipeKey, setWinWipeKey] = useState(0);
  useEffect(() => {
    if (showWinOverlay) setWinWipeKey((k) => k + 1);
  }, [showWinOverlay]);

  /* ---------- hooks: perch & rows slide ---------- */
  const {
    boardRef,
    rowsViewportRef,
    rockRef,
    setPadRef,
    frogXY,
    frogReady,
    onRowsShift,
    getRockCenter,
    captureCurrentPerchCenter,
  } = usePerchOverlay({
    frogRow,
    frogCol,
    isJumping,
    rockOffsets: { xOffset: ROCK_FROG_X_OFFSET, yOffset: ROCK_FROG_Y_OFFSET },
  });

  const { renderedIndices, rowsY } = useRowsSlide(
    visibleIndices,
    ROW_STRIDE,
    onRowsShift
  );

  /* ---------- intro sweep ---------- */
  const allIndicesDesc = useMemo(
    () =>
      Array.from(
        { length: MULTIPLIERS.length },
        (_, i) => MULTIPLIERS.length - 1 - i
      ),
    []
  );

  const suppressEntryUntilIntroDone = useRef(true);
  const { introActive, introY } = useIntroSweep(
    rowsViewportRef,
    MULTIPLIERS.length * ROW_STRIDE,
    { duration: 0.75 },
    () => {
      suppressEntryUntilIntroDone.current = false;
      bumpSpawnWave();
      triggerEntry();
    }
  );

  /* ---------- overlay states ---------- */
  const [overlayFrom, setOverlayFrom] = useState(null);
  const landedOnceRef = useRef(false);

  // CLICK → lilly_click
  const handlePadClick = (row, col, clickable) => {
    if (!clickable) return;
    bumpWaterPop(row, col);
    playSfx("lilly_click"); // CLICK SFX

    landedOnceRef.current = false;
    const from = captureCurrentPerchCenter();
    if (from) setOverlayFrom(from);
    onPadClick(row, col);
  };

  /* ---------- egress / entry ---------- */
  const { egress, setEgress, entry, setEntry, triggerEntry } = useEgressEntry({
    finishReason,
    frogCol,
    frogFacingDeg,
    boardRef,
    getRockCenter,
    captureCurrentPerchCenter,
    frogSize: FROG_SIZE,
  });

  // idle → start of round: if intro already ended, trigger entry & spawn
  // (but NEVER while a loss sequence is active)
  const prevIdleRef = useRef(false);
  useEffect(() => {
    const idleNow = !isPlaying && level === 0;
    const wasIdle = prevIdleRef.current;
    if (
      !suppressEntryUntilIntroDone.current &&
      idleNow &&
      !wasIdle &&
      !lossSeq.active
    ) {
      bumpSpawnWave();
      triggerEntry();
    }
    prevIdleRef.current = idleNow;
  }, [isPlaying, level, triggerEntry, bumpSpawnWave, lossSeq.active]);

  const [highlightRow, setHighlightRow] = useState(null);

  const handleFrogJumpEnd = () => {
    onFrogJumpEnd();
    setHighlightRow(frogRow);
  };

  useEffect(() => {
    if (isJumping || finishReason === "drop") {
      setHighlightRow(null);
    }
  }, [isJumping, finishReason]);

  const symbolToImage = (char, isHighlighted) => {
    const color = isHighlighted ? "yellow" : "gray";

    if (char === "x")
      return { src: `/multi_${color}.png`, w: 14, h: 18, dy: 3 };
    if (char === ".") return { src: `/dot_${color}.png`, w: 6, h: 6, dy: 6 };
    return { src: `/digits_${color}/${char}.png`, w: 14, h: 18, dy: 0 };
  };

  // keep overlayFrom consistent with jumps
  useEffect(() => {
    if (isJumping && !overlayFrom) {
      const from = captureCurrentPerchCenter();
      if (from) setOverlayFrom(from);
    }
  }, [isJumping]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!isJumping) setOverlayFrom(null);
  }, [isJumping]);

  // ===== ENTRY: play lilly_appear + random frog_0..4
  useEffect(() => {
    if (entry) {
      playSfx("lilly_appear");
      playRandom("frog", 5);
    }
  }, [entry]); // eslint-disable-line react-hooks/exhaustive-deps

  // ===== EGRESS (collect / finish): random frog_0..4
  useEffect(() => {
    if (egress) playRandom("frog", 5);
  }, [egress]); // eslint-disable-line react-hooks/exhaustive-deps

  // ======= LOSS: click → drown → disappear → wait flipbook → restart =======
  // 1) Detect entering DROP state and kick off audio sequencing
  const prevFinishRef = useRef(finishReason);
  useEffect(() => {
    if (finishReason === "drop" && prevFinishRef.current !== "drop") {
      // stash the exact pad that killed us
      const r = frogRow;
      const c = frogCol;

      // Activate loss sequence gating restart
      setLossSeq({ active: true, row: r, col: c, disappearDone: false });

      // Play drown immediately
      playRandom("frog_drown", 3);

      // After a short beat, play lily disappear (must be AFTER drown)
      clearTimeout(lossTimerRef.current);
      lossTimerRef.current = setTimeout(() => {
        setLossSeq((s) => ({ ...s, disappearDone: true }));
      }, 600); // a hair longer than one flipbook step (~24fps)
    }
    prevFinishRef.current = finishReason;
    return () => clearTimeout(lossTimerRef.current);
  }, [finishReason, frogRow, frogCol]); // eslint-disable-line react-hooks/exhaustive-deps

  // 2) Only when the *trap tile* finished dissolving AND disappear sound fired → restart
  useEffect(() => {
    if (!lossSeq.active) return;
    const key =
      lossSeq.row != null && lossSeq.col != null
        ? `${lossSeq.row}:${lossSeq.col}`
        : null;

    if (key && lossSeq.disappearDone && dissolvedPads[key]) {
      // Now it's safe to refresh the board and re-enter
      bumpSpawnWave();
      triggerEntry();
      // reset loss sequence gate
      setLossSeq({ active: false, row: null, col: null, disappearDone: false });
    }
  }, [lossSeq, dissolvedPads, bumpSpawnWave, triggerEntry]);

  /* ---------- LOSE overlay (frog_lose_1..8) ---------- */
  const [loseAnim, setLoseAnim] = useState(null); // { x, y, facingDeg }
  useEffect(() => {
    if (finishReason === "drop") {
      const c = captureCurrentPerchCenter();
      if (c) setLoseAnim({ x: c.x, y: c.y, facingDeg: frogFacingDeg });
    } else {
      setLoseAnim(null);
    }
  }, [finishReason, frogFacingDeg, captureCurrentPerchCenter]);

  const overlayFrogActiveForRock = isJumping || Boolean(entry);
  // Hide pad frog while jumping, egressing, not playing, losing, OR winning (so wipe shows)
  const overlayFrogActiveForLilies =
    isJumping ||
    Boolean(egress) ||
    !isPlaying ||
    Boolean(loseAnim) ||
    showWinOverlay;

  /* -------------------- RENDER -------------------- */
  return (
    <div className="relative w-full h-full" ref={boardRef}>
      {/* ROWS VIEWPORT */}
      <div
        ref={rowsViewportRef}
        className="absolute inset-x-0 overflow-hidden z-[20]"
        style={{ bottom: ROCK_SPACE }}
      >
        {/* Intro sweep */}
        {introActive && (
          <motion.div style={{ y: introY }}>
            <div className="flex flex-col" style={{ gap: ROW_GAP }}>
              {Array.from(
                { length: MULTIPLIERS.length },
                (_, i) => MULTIPLIERS.length - 1 - i
              ).map((rowIndexGlobal) => {
                const mult = MULTIPLIERS[rowIndexGlobal];
                const rots = rotationsForRow(rowIndexGlobal);
                const traps = getTraps(rowIndexGlobal);
                return (
                  <div
                    key={`intro-${rowIndexGlobal}`}
                    className="relative"
                    style={{ paddingLeft: BADGE_GUTTER }}
                  >
                    <div
                      className="flex items-center justify-center gap-3"
                      style={{ height: ROW_H }}
                    >
                      {Array.from({ length: PADS_PER_ROW }).map((_, col) => {
                        const { bob, tilt, drift, dur, delay } = floatParams(
                          rowIndexGlobal,
                          col
                        );
                        return (
                          <div
                            key={col}
                            className="group relative rounded-full grid place-items-center"
                            style={{
                              width: LILY_BTN,
                              height: LILY_BTN,
                              opacity: 1,
                            }}
                          >
                            <div
                              className="water-bob pointer-events-none relative"
                              style={{
                                ["--dur"]: `${dur}s`,
                                ["--delay"]: `${delay}s`,
                                ["--bob"]: `${bob}px`,
                                ["--drift"]: `${drift}px`,
                                ["--tiltPos"]: `${tilt}deg`,
                                ["--tiltNeg"]: `${-tilt}deg`,
                              }}
                            >
                              <div className="transition-transform">
                                <Image
                                  src="/tile.png"
                                  alt=""
                                  width={LILY_IMG}
                                  height={LILY_IMG}
                                  className="pointer-events-none"
                                  style={{
                                    transform: `rotate(${rots[col]}deg)`,
                                  }}
                                />
                              </div>

                              {showDrops && traps.has(col) && (
                                <div className="pointer-events-none absolute inset-0 flex items-center justify-center z-[6]">
                                  <div className="w-2.5 h-2.5 rounded-full bg-red-600 animate-pulse shadow-[0_0_0_2px_rgba(255,0,0,0.35)]" />
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Multiplier (intro) */}
                    <div
                      className="absolute top-1/2 -translate-y-1/2"
                      style={{ left: 8, width: BADGE_W, height: BADGE_W }}
                    >
                      <div
                        className="water-bob relative pointer-events-none"
                        style={{
                          ["--dur"]: `3.1s`,
                          ["--delay"]: `0s`,
                          ["--bob"]: `2px`,
                          ["--drift"]: `2px`,
                          ["--tiltPos"]: `2deg`,
                          ["--tiltNeg"]: `-2deg`,
                        }}
                      >
                        <div className="relative w-full h-full">
                          {rowIndexGlobal === MULTIPLIERS.length - 1 ? (
                            <GoldStatic size={BADGE_W} />
                          ) : (
                            <Image
                              src="/lilly_1.png"
                              alt=""
                              width={BADGE_W}
                              height={BADGE_W}
                              className="pointer-events-none"
                            />
                          )}
                        </div>
                        <div className="absolute inset-0 flex items-center justify-center gap-0.5 z-10">
                          {`x${mult.toFixed(2)}`.split("").map((char, idx) => {
                            const { src, w, h, dy } = symbolToImage(
                              char,
                              false
                            );
                            return (
                              <img
                                key={idx}
                                src={src}
                                alt={char}
                                className="object-contain transition-all duration-500 ease-in-out"
                                style={{
                                  width: w,
                                  height: h,
                                  transform: `translateY(${dy}px)`,
                                }}
                              />
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* NORMAL TRACK */}
        <motion.div style={{ y: rowsY }}>
          <div className="flex flex-col" style={{ gap: ROW_GAP }}>
            {renderedIndices.map((rowIndexGlobal) => {
              const mult = MULTIPLIERS[rowIndexGlobal];
              const rots = rotationsForRow(rowIndexGlobal);
              const traps = getTraps(rowIndexGlobal);
              const revealThisRow = shouldRevealRow(rowIndexGlobal);

              return (
                <div
                  key={rowIndexGlobal}
                  className="relative"
                  style={{ paddingLeft: BADGE_GUTTER }}
                >
                  <div
                    className="flex items-center justify-center gap-3"
                    style={{ height: ROW_H }}
                  >
                    {Array.from({ length: PADS_PER_ROW }).map((_, col) => {
                      const isFrogHere =
                        rowIndexGlobal === frogRow && frogCol === col;
                      const padOpacity = isFrogHere
                        ? 1
                        : rowOpacity(rowIndexGlobal);
                      const isTrap = traps.has(col);
                      const isTrapAndRevealed = revealThisRow && isTrap;
                      const clickable = isRowClickable(rowIndexGlobal);

                      const { bob, tilt, drift, dur, delay } = floatParams(
                        rowIndexGlobal,
                        col
                      );

                      const popKey = getWaterPopKey(rowIndexGlobal, col);
                      const k = `${rowIndexGlobal}:${col}`;

                      const doWinWipe = winWipeKey > 0 && showWinOverlay;

                      return (
                        <button
                          key={col}
                          data-row={rowIndexGlobal}
                          data-col={col}
                          onClick={() =>
                            handlePadClick(rowIndexGlobal, col, clickable)
                          }
                          disabled={!clickable}
                          ref={setPadRef(rowIndexGlobal, col)}
                          className={`group relative rounded-full grid place-items-center ${
                            clickable ? "cursor-pointer" : "cursor-default"
                          }`}
                          style={{
                            width: LILY_BTN,
                            height: LILY_BTN,
                            opacity: padOpacity,
                            zIndex: isFrogHere ? 10 : 1,
                          }}
                          title={clickable ? "Jump" : ""}
                        >
                          {/* WATER-POP underlay */}
                          {popKey ? (
                            <div className="absolute inset-0 grid place-items-center z-0">
                              <FlipbookImage
                                key={`water-${rowIndexGlobal}-${col}-${popKey}`}
                                kind="waterpop"
                                count={11}
                                size={LILY_IMG}
                                direction="forward"
                                fps={28}
                                alt=""
                              />
                            </div>
                          ) : null}

                          {/* Float visuals only; keep hitbox stable */}
                          <div
                            className={`water-bob pointer-events-none relative ${
                              isFrogHere || isJumping ? "no-bob" : ""
                            }`}
                            style={{
                              ["--dur"]: `${dur}s`,
                              ["--delay"]: `${delay}s`,
                              ["--bob"]: `${bob}px`,
                              ["--drift"]: `${drift}px`,
                              ["--tiltPos"]: `${tilt}deg`,
                              ["--tiltNeg"]: `${-tilt}deg`,
                              zIndex: 1,
                            }}
                          >
                            {/* Tiles logic:
                                - trap revealed: forward 1→10 then hide
                                - WIN WIPE: forward 1→10 for ALL pads then hide
                                - spawn: backward 10→1
                             */}
                            {isTrapAndRevealed || doWinWipe ? (
                              dissolvedPads[k] ? (
                                <div
                                  style={{ width: LILY_IMG, height: LILY_IMG }}
                                />
                              ) : (
                                <FlipbookImage
                              
                                  key={`wipe-${winWipeKey}-row${rowIndexGlobal}-col${col}-${
                                    rowRevealKey[rowIndexGlobal] || 0
                                  }`}
                                  kind="tile"
                                  count={10}
                                  start={1}
                                  end={10}
                                  size={LILY_IMG}
                                  direction="forward"
                                  fps={24}
                                  onDone={() =>
                                    markDissolved(rowIndexGlobal, col)
                                  }
                                  className="transition-transform"
                                  style={{
                                    transform: `rotate(${rots[col]}deg)`,
                                  }}
                                  alt=""
                                />
                              )
                            ) : (
                              <>
                                {spawnWaveKey > 0 ? (
                                  <FlipbookImage
                                    key={`${spawnWaveKey}-tile-${rowIndexGlobal}-${col}`}
                                    kind="tile"
                                    count={10}
                                    start={1}
                                    end={10}
                                    size={LILY_IMG}
                                    direction="backward" // 10 → 1
                                    fps={28}
                                    delay={
                                      0.02 * (rowIndexGlobal % 5) + 0.01 * col
                                    }
                                    className="transition-transform group-hover:scale-105"
                                    style={{
                                      transform: `rotate(${rots[col]}deg)`,
                                    }}
                                    alt=""
                                  />
                                ) : (
                                  <Image
                                    src="/tile.png"
                                    alt=""
                                    width={LILY_IMG}
                                    height={LILY_IMG}
                                    className="pointer-events-none"
                                    style={{
                                      transform: `rotate(${rots[col]}deg)`,
                                    }}
                                  />
                                )}

                                {/* Frog on lily (hidden during loss/win/egress/jump) */}
                                {isPlaying &&
                                  isFrogHere &&
                                  !overlayFrogActiveForLilies && (
                                    <FrogSprite
                                      phase={frogPhase}
                                      size={FROG_SIZE}
                                      facingDeg={frogFacingDeg}
                                    />
                                  )}
                              </>
                            )}

                            {/* DEV trap marker */}
                            {showDrops && isTrap && (
                              <div className="pointer-events-none absolute inset-0 flex items-center justify-center z-[6]">
                                <div className="w-2.5 h-2.5 rounded-full bg-red-600 animate-pulse shadow-[0_0_0_2px_rgba(255,0,0,0.35)]" />
                              </div>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* Multiplier badge */}
                  <div
                    className="absolute top-1/2 -translate-y-1/2"
                    style={{ left: 8, width: BADGE_W, height: BADGE_W }}
                  >
                    {(() => {
                      const { bob, tilt, drift, dur, delay } = floatParams(
                        rowIndexGlobal,
                        -1
                      );
                      const flipDelay = 0.02 * (rowIndexGlobal % 5);
                      const doWinWipe = winWipeKey > 0 && showWinOverlay;
                      const keyStr = `${rowIndexGlobal}:-1`;

                      if (doWinWipe && !dissolvedPads[keyStr]) {
                        return (
                          <FlipbookImage
                            key={`wipe-badge-${winWipeKey}-${rowIndexGlobal}`}
                            kind={
                              rowIndexGlobal === MULTIPLIERS.length - 1
                                ? "gold"
                                : "lilly"
                            }
                            count={11}
                            start={1}
                            end={11}
                            size={BADGE_W}
                            direction="forward"
                            fps={24}
                            onDone={() => markDissolved(rowIndexGlobal, -1)}
                            alt=""
                          />
                        );
                      }

                      if (doWinWipe && dissolvedPads[keyStr]) {
                        return (
                          <div style={{ width: BADGE_W, height: BADGE_W }} />
                        );
                      }

                      return (
                        <div
                          className="water-bob relative pointer-events-none"
                          style={{
                            ["--dur"]: `${dur}s`,
                            ["--delay"]: `${delay}s`,
                            ["--bob"]: `${bob * 0.6}px`,
                            ["--drift"]: `${drift}px`,
                            ["--tiltPos"]: `${tilt}deg`,
                            ["--tiltNeg"]: `${-tilt}deg`,
                          }}
                        >
                          <div className="relative w-full h-full">
                            {spawnWaveKey > 0 ? (
                              <FlipbookImage
                                key={`${spawnWaveKey}-badge-${rowIndexGlobal}`}
                                kind={
                                  rowIndexGlobal === MULTIPLIERS.length - 1
                                    ? "gold"
                                    : "lilly"
                                }
                                count={11}
                                start={1}
                                end={11}
                                size={BADGE_W}
                                direction="backward"
                                fps={28}
                                delay={flipDelay}
                                alt=""
                              />
                            ) : rowIndexGlobal === MULTIPLIERS.length - 1 ? (
                              <GoldStatic size={BADGE_W} />
                            ) : (
                              <Image
                                src="/lilly_1.png"
                                alt=""
                                width={BADGE_W}
                                height={BADGE_W}
                                className="pointer-events-none"
                              />
                            )}
                          </div>
                          <div className="absolute inset-0 flex items-center justify-center gap-0.5 z-10">
                            {`x${mult.toFixed(2)}`
                              .split("")
                              .map((char, idx) => {
                                const { src, w, h, dy } = symbolToImage(
                                  char,
                                  highlightRow === rowIndexGlobal
                                );
                                return (
                                  <img
                                    key={idx}
                                    src={src}
                                    alt={char}
                                    className="object-contain transition-all duration-500 ease-in-out"
                                    style={{
                                      width: w,
                                      height: h,
                                      transform: `translateY(${dy}px) scale(${
                                        highlightRow === rowIndexGlobal
                                          ? 1.2
                                          : 1
                                      })`,
                                    }}
                                  />
                                );
                              })}
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      </div>

      {/* ROCK (rotate 270°) */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 pointer-events-none z-10">
        <div
          ref={rockRef}
          className="relative grid place-items-center"
          style={{ width: ROCK_IMG, height: ROCK_IMG }}
        >
          <Image
            src="/rock.png"
            alt=""
            width={ROCK_IMG}
            height={ROCK_IMG}
            className="object-contain -rotate-90"
          />
          {/* Static frog on rock */}
          {frogRow === -1 && !overlayFrogActiveForRock && (
            <motion.div
              initial={{ scale: 0.9, y: 4, opacity: 0.9 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              transition={{
                type: "spring",
                stiffness: 380,
                damping: 22,
                mass: 0.28,
              }}
            >
              <FrogSprite
                phase="idle"
                size={FROG_SIZE}
                facingDeg={frogFacingDeg}
              />
            </motion.div>
          )}
        </div>
      </div>

      {/* OVERLAY FROG — JUMP */}
      {frogReady && isJumping && overlayFrom && frogXY && (
        <motion.div className="relative z-[60]" style={{ y: rowsY }}>
          <motion.div
            className="pointer-events-none absolute left-0 top-0 z-40 relative"
            initial={{
              x: overlayFrom.x - FROG_SIZE / 2,
              y: overlayFrom.y - FROG_SIZE / 2,
            }}
            animate={{
              x: frogXY.x - FROG_SIZE / 2,
              y: frogXY.y - FROG_SIZE / 2,
            }}
            transition={{
              type: "spring",
              stiffness: 360,
              damping: 26,
              mass: 0.34,
              restDelta: 0.2,
            }}
            onAnimationComplete={() => {
              if (landedOnceRef.current) return;
              landedOnceRef.current = true;
              // LAND: land_0..4
              playRandom("land", 5);
              handleFrogJumpEnd();
            }}
            style={{
              width: FROG_SIZE,
              height: FROG_SIZE,
              willChange: "transform",
            }}
          >
            <FrogSprite
              phase={frogPhase}
              size={FROG_SIZE}
              facingDeg={frogFacingDeg}
            />
          </motion.div>
        </motion.div>
      )}

      {/* OVERLAY FROG — EGRESS */}
      {egress && (
        <motion.div className="relative z-[60]" style={{ y: rowsY }}>
          {(() => {
            const fromX = egress.from.x - FROG_SIZE / 2;
            const fromY = egress.from.y - FROG_SIZE / 2;
            const toX = egress.to.x - FROG_SIZE / 2;
            const toY = egress.to.y - FROG_SIZE / 2;
            const midX = (fromX + toX) / 2;
            const midY = Math.min(fromY, toY) - 36;

            return (
              <motion.div
                className="pointer-events-none absolute left-0 top-0 z-40"
                initial={{ x: fromX, y: fromY, opacity: 1, scale: 1 }}
                animate={{
                  x: [fromX, midX, toX],
                  y: [fromY, midY, toY],
                  opacity: [1, 1, 0.9],
                  scale: [1, 1.06, 0.95],
                }}
                transition={{
                  duration: 0.55,
                  times: [0, 0.65, 1],
                  ease: [0.22, 1, 0.36, 1],
                }}
                onAnimationComplete={() => setEgress(null)}
                style={{ width: FROG_SIZE, height: FROG_SIZE }}
              >
                <FrogSprite
                  phase="jump"
                  size={FROG_SIZE}
                  facingDeg={egress.facingDeg}
                />
              </motion.div>
            );
          })()}
        </motion.div>
      )}

      {/* OVERLAY FROG — ENTRY */}
      {entry && (
        <motion.div className="relative z-[60]">
          {(() => {
            const fromX = entry.from.x - FROG_SIZE / 2;
            const fromY = entry.from.y - FROG_SIZE / 2;
            const toX = entry.to.x - FROG_SIZE / 2;
            const toY = entry.to.y - FROG_SIZE / 2;
            const midY = toY - 20;

            return (
              <motion.div
                className="pointer-events-none absolute left-0 top-0 z-40"
                initial={{ x: fromX, y: fromY, opacity: 1, scale: 1 }}
                animate={{
                  x: [fromX, toX],
                  y: [fromY, midY, toY],
                  opacity: [1, 1, 1],
                  scale: [1, 1.02, 1],
                }}
                transition={{
                  duration: 0.5,
                  times: [0, 0.75, 1],
                  ease: [0.22, 1, 0.36, 1],
                }}
                onAnimationComplete={() => setEntry(null)}
                style={{ width: FROG_SIZE, height: FROG_SIZE }}
              >
                <FrogSprite
                  phase="jump"
                  size={FROG_SIZE}
                  facingDeg={entry.facingDeg}
                />
              </motion.div>
            );
          })()}
        </motion.div>
      )}

      {showTutorial && (
        <SwipeTutorial
          show
          routes={tutorialRoutes}
          getTileCenter={(row, col) => {
            const pad = document.querySelector(
              `[data-row="${row}"][data-col="${col}"]`
            );
            if (!pad || !boardRef.current) return null;
            const br = boardRef.current.getBoundingClientRect();
            const rect = pad.getBoundingClientRect();
            return {
              x: rect.left - br.left + rect.width / 2,
              y: rect.top - br.top + rect.height / 2,
            };
          }}
          tileRadius={LILY_BTN / 2}
          onAnyUserAction={() => resetIdle()}
        />
      )}

      {/* OVERLAY FROG — LOSE */}
      {loseAnim && (
        <motion.div className="relative z-[70]" style={{ y: rowsY }}>
          <motion.div
            className="pointer-events-none absolute left-0 top-0 z-50"
            initial={{
              x: loseAnim.x - FROG_SIZE / 2,
              y: loseAnim.y - FROG_SIZE / 2,
              opacity: 1,
              scale: 1,
            }}
            animate={{
              opacity: [1, 1, 0.9, 0.0],
              scale: [1, 0.98, 0.96],
            }}
            transition={{ duration: 0.6, ease: [0.2, 0.8, 0.2, 1] }}
            onAnimationComplete={() => setLoseAnim(null)}
            style={{ width: FROG_SIZE, height: FROG_SIZE }}
          >
            <FrogLoseFlipbook
              size={FROG_SIZE}
              facingDeg={loseAnim.facingDeg}
              fps={20}
            />
          </motion.div>
        </motion.div>
      )}

      {/* WIN OVERLAY */}
      {showWinOverlay && !winDismissed && (
        <motion.div
          className="absolute inset-0 z-[80] flex items-center justify-center overflow-visible"
          animate={overlayCtrl}
          style={{ willChange: "transform, opacity" }}
        >
          <div className="relative select-none">
            {/* Glow-spread — overlapped pulses (smooth) */}
            {[0, 0.6, 1.2].map((delay, i) => (
              <motion.img
                key={`glow-spread-${i}`}
                src="/glow-spread.png"
                alt=""
                className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[5]"
                style={{
                  width: "80vmin",
                  height: "auto",
                  opacity: 1,
                  willChange: "transform",
                }}
                initial={{ scale: 0.9 }}
                animate={{ scale: 4 }}
                transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
              />
            ))}

            {/* Big rotating + breathing glow */}
            <motion.img
              src="/glow.png"
              alt=""
              className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[8]"
              style={{
                width: "80vmin",
                height: "80vmin",
                opacity: 0.95,
                willChange: "transform",
              }}
              animate={{ rotate: 360, scale: [1, 1.2, 1] }}
              transition={{
                rotate: { duration: 12, ease: "linear", repeat: Infinity },
                scale: { duration: 1.6, ease: "easeInOut", repeat: Infinity },
              }}
            />

            {/* Bigger rotating + breathing sparkles */}
            <motion.img
              src="/sparkles.png"
              alt=""
              className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[15]"
              style={{
                width: "80vmin",
                height: "80vmin",
                opacity: 0.95,
                willChange: "transform",
              }}
              animate={{ rotate: -360, scale: [1, 1.15, 1] }}
              transition={{
                rotate: { duration: 18, ease: "linear", repeat: Infinity },
                scale: { duration: 2.2, ease: "easeInOut", repeat: Infinity },
              }}
            />

            {/* Win tile card */}
            <img
              src="/win-tile.png"
              alt=""
              width={360}
              height={360}
              className="relative z-[20] object-contain drop-shadow-2xl block mx-auto"
              style={{ width: 360, height: "auto" }}
            />

            {/* Text inside win tile (on top) */}
            <div className="pointer-events-none absolute inset-0 z-[40] flex flex-col items-center justify-center">
              <div className="text-3xl font-extrabold tracking-wide text-orange-300 drop-shadow">
                CONGRATULATIONS!
              </div>
              <div className="text-7xl opacity-90 text-blue-300 drop-shadow">
                YOU WON
              </div>
              <div className="flex items-center justify-center gap-1 mt-1 z-50">
                {`${format ? format(overlayAmount) : overlayAmount}`
                  .split("")
                  .map((char, idx) => {
                    const { src, w, h, dy } = symbolToImage(char, "yellow");
                    return (
                      <img
                        key={idx}
                        src={src}
                        alt={char}
                        className="object-contain drop-shadow"
                        style={{
                          width: w,
                          height: h,
                          transform: `translateY(${dy}px)`,
                        }}
                      />
                    );
                  })}
              </div>
            </div>
          </div>
        </motion.div>
      )}

      <Swipe
        active={showTutorial}
        routes={tutorialRoutes}
        getTileCenter={(row, col) => {
          const pad = document.querySelector(
            `[data-row="${row}"][data-col="${col}"]`
          );
          if (!pad || !boardRef.current) return null;
          const br = boardRef.current.getBoundingClientRect();
          const rect = pad.getBoundingClientRect();
          return {
            x: rect.left - br.left + rect.width / 2,
            y: rect.top - br.top + rect.height / 2,
          };
        }}
        onDone={() => console.log("swipe finished")}
      />
    </div>
  );
}
