"use client";

import Image from "next/image";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { motion, useMotionValue, animate } from "framer-motion";

import { useGame, MULTIPLIERS } from "../hooks/useGame";
import { useDebug } from "../hooks/useDebug";
import useBoard from "../hooks/useBoard";
import FrogSprite from "./animations/FrogSprite";

// ==================== sizing / layout ====================
const PADS_PER_ROW = 5;
const ROCK_SPACE = 96;

const LILY_BTN = 72;
const LILY_IMG = 80;

const BADGE_W = 48;
const BADGE_GUTTER = BADGE_W + 16;

/** Tighter vertical spacing between rows */
const ROW_H = 60;
const ROW_GAP = 1;
const ROW_STRIDE = ROW_H + ROW_GAP;

const FROG_SIZE = 70;          // fixed frog size everywhere
const ROCK_IMG  = 90;          // rock image size you render
const ROCK_FROG_Y_OFFSET = -8; // lift frog slightly on rock
const ROCK_FROG_X_OFFSET = 0;  // tweak left/right if needed

export default function GameBoard() {
  const { format, finishReason, isPlaying, level } = useGame();
  const { showDrops } = useDebug();

  const {
    level: boardLevel,
    visibleIndices,
    rowOpacity,
    rotationsForRow,
    getTraps,
    shouldRevealRow,
    isRowClickable,
    onPadClick,

    frogRow,
    frogCol,
    frogFacingDeg,
    frogPhase,

    isJumping,
    showWinOverlay,
    overlayAmount,
  } = useBoard();

  // ===== Slide the WHOLE rows track together (shared motion value) =====
  const [renderedIndices, setRenderedIndices] = useState(visibleIndices);
  const prevTopRef = useRef(visibleIndices?.[0] ?? 0);
  const rowsY = useMotionValue(0);
  const rowsAnimRef = useRef(null);

  // Cache last idle frog center (absolute in board coords)
  const frogIdleXYRef = useRef(null);

  useEffect(() => {
    const prevTop = prevTopRef.current ?? visibleIndices[0];
    const nextTop = visibleIndices[0];

    if (nextTop === prevTop) {
      setRenderedIndices(visibleIndices);
      return;
    }

    // animate rows down/up by N * row stride, then swap window & reset y
    const dir = Math.sign(nextTop - prevTop); // +1 forward, -1 back
    const distance = Math.abs(nextTop - prevTop) * ROW_STRIDE;
    const shift = dir > 0 ? distance : -distance;

    if (rowsAnimRef.current) rowsAnimRef.current.stop();

    rowsY.set(0);
    rowsAnimRef.current = animate(rowsY, shift, {
      duration: 0.34,
      ease: [0.2, 0.8, 0.2, 1],
    });

    const finalize = () => {
      // Shift cached frog coords by the slide distance so overlay frog stays aligned
      if (frogIdleXYRef.current) {
        frogIdleXYRef.current = {
          x: frogIdleXYRef.current.x,
          y: frogIdleXYRef.current.y + shift,
        };
      }
      // Also shift the live frogXY state so it stays in-sync until we can read a real pad
      setFrogXY((prev) => (prev ? { x: prev.x, y: prev.y + shift } : prev));

      setRenderedIndices(visibleIndices);
      rowsY.set(0);
      prevTopRef.current = nextTop;
      rowsAnimRef.current = null;
    };

    rowsAnimRef.current.then(finalize).catch(finalize);

    return () => {
      if (rowsAnimRef.current) rowsAnimRef.current.stop();
    };
  }, [visibleIndices, rowsY]);

  // ===== Overlay frog positioning (absolute, top-level) =====
  const boardRef = useRef(null);
  const rowsViewportRef = useRef(null);
  const rockRef  = useRef(null);

  // Keep DOM refs for each lily button: key "row:col"
  const padRefs = useRef(new Map());
  const setPadRef = (row, col) => (el) => {
    const key = `${row}:${col}`;
    if (el) padRefs.current.set(key, el);
    else padRefs.current.delete(key);
  };

  const [frogXY, setFrogXY] = useState({ x: 0, y: 0 });   // live destination (board coords)
  const [frogReady, setFrogReady] = useState(false);

  const getCenterInBoard = (el) => {
    if (!el || !boardRef.current) return null;
    const b = boardRef.current.getBoundingClientRect();
    const r = el.getBoundingClientRect();
    return { x: r.left - b.left + r.width / 2, y: r.top - b.top + r.height / 2 };
  };

  const getRockCenter = () => {
    const c = getCenterInBoard(rockRef.current);
    if (!c) return null;
    return { x: c.x + ROCK_FROG_X_OFFSET, y: c.y + ROCK_FROG_Y_OFFSET };
  };

  // Read current perch (rock or (frogRow,frogCol)) → update frogXY (end target).
  const updateFrogTarget = () => {
    let target = null;
    if (frogRow === -1) {
      target = getRockCenter();
    } else {
      const key = `${frogRow}:${frogCol}`;
      const padEl = padRefs.current.get(key);
      // If pad is not mounted (e.g., we paged 1→2), use cached idle instead of rock
      target = padEl ? getCenterInBoard(padEl) : (frogIdleXYRef.current || getRockCenter());
    }
    if (target) {
      setFrogXY(target);
      if (!frogReady) setFrogReady(true);
      // Only refresh idle when NOT jumping (idle is our canonical perch)
      if (!isJumping) frogIdleXYRef.current = target;
    } else if (typeof window !== "undefined") {
      requestAnimationFrame(updateFrogTarget); // retry if element not mounted yet
    }
  };

  // initial anchor (rock)
  useLayoutEffect(() => {
    updateFrogTarget();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // update whenever frog moves or the window of rows changes
  useLayoutEffect(() => {
    updateFrogTarget();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [frogRow, frogCol, visibleIndices, isJumping]);

  // ---------- overlay start anchor (overlayFrom) ----------
  const [overlayFrom, setOverlayFrom] = useState(null);

  const captureCurrentPerchCenter = () => {
    let from = null;
    if (frogRow === -1) {
      from = getRockCenter();
    } else {
      const curEl = padRefs.current.get(`${frogRow}:${frogCol}`);
      from = curEl ? getCenterInBoard(curEl) : null;
    }
    // Fallbacks: cached idle → rock
    if (!from && frogIdleXYRef.current) from = frogIdleXYRef.current;
    if (!from) from = getRockCenter();
    return from;
  };

  // Wrapper around `onPadClick` to capture FROM first
  const handlePadClick = (row, col, clickable) => {
    if (!clickable) return;
    const from = captureCurrentPerchCenter();
    if (from) setOverlayFrom(from);
    onPadClick(row, col);
  };

  // Safety: if a jump started programmatically (no click), still seed overlayFrom
  useEffect(() => {
    if (isJumping && !overlayFrom) {
      const from = captureCurrentPerchCenter();
      if (from) setOverlayFrom(from);
    }
  }, [isJumping]); // eslint-disable-line react-hooks/exhaustive-deps

  // Clear after jump ends
  useEffect(() => {
    if (!isJumping) setOverlayFrom(null);
  }, [isJumping]);

  // subtle water bob params
  function floatParams(rowIdx, col) {
    const seed = (rowIdx + 101) * 131 + (col + 1) * 37;
    const rng = (n) => {
      const x = Math.sin(n) * 10000;
      return x - Math.floor(x);
    };
    const bob = 2 + Math.floor(rng(seed) * 2); // 2..3
    const drift = (rng(seed + 1) - 0.5) * 8; // -4..4
    const tilt = 1 + rng(seed + 2) * 2; // 1..3 deg
    const dur = 2.6 + rng(seed + 3) * 1.6; // 2.6..4.2 s
    const delay = rng(seed + 4) * 1.2; // 0..1.2 s
    return { bob, drift, tilt, dur, delay };
  }

  /* -------------------- INTRO SWEEP (x1500 → x1.2) -------------------- */
  const [introActive, setIntroActive] = useState(true);
  const suppressEntryUntilIntroDone = useRef(true);
  const introY = useMotionValue(0);

  const allIndicesDesc = useMemo(() => {
    // 13..0 (x1500 .. x1.2)
    return Array.from({ length: MULTIPLIERS.length }, (_, i) => MULTIPLIERS.length - 1 - i);
  }, []);

  useEffect(() => {
    // On mount: sweep from top to bottom inside rows viewport, then turn off.
    const viewportEl = rowsViewportRef.current;
    const boardEl = boardRef.current;
    if (!viewportEl || !boardEl) return;

    // Total content height & visible viewport height
    const contentH = MULTIPLIERS.length * ROW_STRIDE;
    const viewportH = viewportEl.getBoundingClientRect().height;
    const travel = Math.max(0, contentH - viewportH);

    introY.set(0);
    const controls = animate(introY, -travel, {
      duration: 1.15, // snappy sweep
      ease: [0.22, 1, 0.36, 1],
    });

    controls.then(() => {
      setIntroActive(false);
      suppressEntryUntilIntroDone.current = false;
      triggerEntry(); // frog comes up after the sweep
    }).catch(() => {
      setIntroActive(false);
      suppressEntryUntilIntroDone.current = false;
      triggerEntry();
    });

    return () => controls.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* -------------------- FROG EGRESS / ENTRY -------------------- */
  const [egress, setEgress] = useState(null); // {from:{x,y}, to:{x,y}, facingDeg}
  const [entry, setEntry]   = useState(null); // {from:{x,y}, to:{x,y}, facingDeg}

  // Hide static (rock/lily) frog when any overlay frog is animating
  const overlayFrogActive = Boolean(
    (frogReady && isJumping && overlayFrom && frogXY) || egress || entry
  );

  // Trigger egress to side on win/collect
  useEffect(() => {
    if (finishReason !== "collect" && finishReason !== "all") return;
    const from = captureCurrentPerchCenter();
    if (!from || !boardRef.current) return;

    const boardW = boardRef.current.getBoundingClientRect().width;
    // Choose side: left if on left half, else right
    const goLeft = (frogCol ?? 2) <= 2;
    const toX = goLeft ? -FROG_SIZE * 2 : boardW + FROG_SIZE * 2;
    const to = { x: toX, y: from.y - 20 };
    const facingDeg = goLeft ? 180 : 0;
    setEgress({ from, to, facingDeg });
  }, [finishReason]); // eslint-disable-line react-hooks/exhaustive-deps

  // When game returns to idle (level 0, not playing), bring frog from bottom
  const prevIdleRef = useRef(false);
  useEffect(() => {
    const idleNow = !isPlaying && level === 0;
    const wasIdle = prevIdleRef.current;

    if (!suppressEntryUntilIntroDone.current && idleNow && !wasIdle) {
      // Coming into idle after a round → re-enter from bottom
      triggerEntry();
    }
    prevIdleRef.current = idleNow;
  }, [isPlaying, level]);

  function triggerEntry() {
    if (!boardRef.current || !rockRef.current) return;
    const to = getRockCenter();
    const b = boardRef.current.getBoundingClientRect();
    if (!to) return;
    // Start from just below screen
    const from = { x: to.x, y: b.height + 100 };
    setEntry({ from, to, facingDeg: frogFacingDeg });
  }

  /* -------------------- RENDER -------------------- */
  return (
    <div className="relative w-full h-full" ref={boardRef}>
      {/* ROWS VIEWPORT (shared by intro & normal track) */}
      <div
        ref={rowsViewportRef}
        className="absolute inset-x-0 overflow-hidden"
        style={{ bottom: ROCK_SPACE }}
      >
        {/* Intro sweep layer */}
        {introActive && (
          <motion.div style={{ y: introY }}>
            <div className="flex flex-col" style={{ gap: ROW_GAP }}>
              {allIndicesDesc.map((rowIndexGlobal) => {
                const mult = MULTIPLIERS[rowIndexGlobal];
                const rots = rotationsForRow(rowIndexGlobal);
                const traps = getTraps(rowIndexGlobal);
                const revealThisRow = false; // Intro: never reveal traps

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
                        const { bob, tilt, drift, dur, delay } = floatParams(rowIndexGlobal, col);
                        return (
                          <div
                            key={col}
                            className="group relative rounded-full grid place-items-center"
                            style={{
                              width: LILY_BTN,
                              height: LILY_BTN,
                              opacity: 0.95,
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
                                  alt="Lily"
                                  width={LILY_IMG}
                                  height={LILY_IMG}
                                  className="pointer-events-none"
                                  style={{ transform: `rotate(${rots[col]}deg)` }}
                                />
                              </div>
                              {showDrops && traps.has(col) && (
                                <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                                  <div className="w-2 h-2 rounded-full bg-red-600 animate-pulse" />
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Multiplier flower */}
                    <div
                      className="absolute top-1/2 -translate-y-1/2"
                      style={{ left: 8, width: BADGE_W, height: BADGE_W }}
                    >
                      {(() => {
                        const { bob, tilt, drift, dur, delay } = floatParams(rowIndexGlobal, -1);
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
                              <Image
                                src="/flower.png"
                                alt="Multiplier"
                                width={BADGE_W}
                                height={BADGE_W}
                                className="pointer-events-none"
                              />
                            </div>
                            <div className="absolute inset-0 grid place-items-center text-[11px] font-extrabold text-black">
                              x{mult}
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
        )}

        {/* NORMAL TRACK (slides page-by-page) */}
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
                  <div className="flex items-center justify-center gap-3" style={{ height: ROW_H }}>
                    {Array.from({ length: PADS_PER_ROW }).map((_, col) => {
                      const isFrogHere = rowIndexGlobal === frogRow && frogCol === col;
                      const padOpacity = isFrogHere ? 1 : rowOpacity(rowIndexGlobal);
                      const isTrapAndRevealed = revealThisRow && traps.has(col);
                      const clickable = isRowClickable(rowIndexGlobal);

                      if (isTrapAndRevealed && !showDrops) {
                        return (
                          <div key={col} style={{ width: LILY_BTN, height: LILY_BTN, opacity: 0 }} />
                        );
                      }

                      const { bob, tilt, drift, dur, delay } = floatParams(rowIndexGlobal, col);

                      return (
                        <button
                          key={col}
                          onClick={() => handlePadClick(rowIndexGlobal, col, clickable)}
                          disabled={!clickable}
                          ref={setPadRef(rowIndexGlobal, col)}
                          className={`group relative rounded-full grid place-items-center ${clickable ? "cursor-pointer" : "cursor-default"}`}
                          style={{
                            width: LILY_BTN,
                            height: LILY_BTN,
                            opacity: padOpacity,
                            zIndex: isFrogHere ? 10 : 1,
                          }}
                          title={clickable ? "Jump" : ""}
                        >
                          {/* Float the visuals only; keep button hitbox stable */}
                          <div
                            className={`water-bob pointer-events-none relative ${ (isFrogHere || isJumping) ? "no-bob" : "" }`}
                            style={{
                              ["--dur"]: `${dur}s`,
                              ["--delay"]: `${delay}s`,
                              ["--bob"]: `${bob}px`,
                              ["--drift"]: `${drift}px`,
                              ["--tiltPos"]: `${tilt}deg`,
                              ["--tiltNeg"]: `${-tilt}deg`,
                            }}
                          >
                            <div className="transition-transform group-hover:scale-105">
                              <Image
                                src="/tile.png"
                                alt="Lily"
                                width={LILY_IMG}
                                height={LILY_IMG}
                                className="pointer-events-none"
                                style={{ transform: `rotate(${rots[col]}deg)` }}
                              />
                            </div>

                            {/* DEV overlay: show trap marker */}
                            {showDrops && traps.has(col) && (
                              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                                <div className="w-2 h-2 rounded-full bg-red-600 animate-pulse" />
                              </div>
                            )}

                            {/* Frog rides the lily AFTER landing (locks to layout) */}
                            {isFrogHere && !isJumping && !overlayFrogActive && (
                              <FrogSprite
                                phase={frogPhase}
                                size={FROG_SIZE}
                                facingDeg={frogFacingDeg}
                              />
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* Multiplier flower */}
                  <div
                    className="absolute top-1/2 -translate-y-1/2"
                    style={{ left: 8, width: BADGE_W, height: BADGE_W }}
                  >
                    {(() => {
                      const { bob, tilt, drift, dur, delay } = floatParams(rowIndexGlobal, -1);
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
                            <Image
                              src="/flower.png"
                              alt="Multiplier"
                              width={BADGE_W}
                              height={BADGE_W}
                              className="pointer-events-none"
                            />
                          </div>
                          <div className="absolute inset-0 grid place-items-center text-[11px] font-extrabold text-black">
                            x{mult}
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

      {/* ROCK (rotate 270°) — the wrapper IS the anchor */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 pointer-events-none">
        <div
          ref={rockRef}
          className="relative grid place-items-center"
          style={{ width: ROCK_IMG, height: ROCK_IMG }}
        >
          <Image
            src="/rock.png"
            alt="Rock"
            width={ROCK_IMG}
            height={ROCK_IMG}
            className="object-contain -rotate-90"
          />
          {/* On rock before first jump */}
          {frogRow === -1 && !isJumping && !overlayFrogActive && (
            <FrogSprite phase="idle" size={FROG_SIZE} facingDeg={frogFacingDeg} />
          )}
        </div>
      </div>

      {/* OVERLAY FROG — rides the rows slide via the same rowsY (jump between pads) */}
      {frogReady && isJumping && overlayFrom && frogXY && (
        <motion.div style={{ y: rowsY }}>
          <motion.div
            className="pointer-events-none absolute left-0 top-0 z-40"
            initial={{ x: overlayFrom.x - FROG_SIZE / 2, y: overlayFrom.y - FROG_SIZE / 2 }}
            animate={{  x: frogXY.x   - FROG_SIZE / 2, y: frogXY.y   - FROG_SIZE / 2 }}
            transition={{ type: "spring", stiffness: 260, damping: 30, mass: 0.38, restDelta: 0.2 }}
            style={{ width: FROG_SIZE, height: FROG_SIZE }}
          >
            <FrogSprite phase="jump" size={FROG_SIZE} facingDeg={frogFacingDeg} />
          </motion.div>
        </motion.div>
      )}

      {/* OVERLAY FROG — EGRESS to a screen side on win/collect */}
      {egress && (
        <motion.div style={{ y: rowsY }}>
          <motion.div
            className="pointer-events-none absolute left-0 top-0 z-40"
            initial={{ x: egress.from.x - FROG_SIZE / 2, y: egress.from.y - FROG_SIZE / 2 }}
            animate={{  x: egress.to.x   - FROG_SIZE / 2, y: egress.to.y   - FROG_SIZE / 2 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            onAnimationComplete={() => setEgress(null)}
            style={{ width: FROG_SIZE, height: FROG_SIZE }}
          >
            <FrogSprite phase="jump" size={FROG_SIZE} facingDeg={egress.facingDeg} />
          </motion.div>
        </motion.div>
      )}

      {/* OVERLAY FROG — ENTRY from bottom to rock whenever a new game is ready */}
      {entry && (
        <motion.div>
          <motion.div
            className="pointer-events-none absolute left-0 top-0 z-40"
            initial={{ x: entry.from.x - FROG_SIZE / 2, y: entry.from.y - FROG_SIZE / 2, opacity: 1 }}
            animate={{  x: entry.to.x   - FROG_SIZE / 2, y: entry.to.y   - FROG_SIZE / 2, opacity: 1 }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            onAnimationComplete={() => setEntry(null)}
            style={{ width: FROG_SIZE, height: FROG_SIZE }}
          >
            <FrogSprite phase="jump" size={FROG_SIZE} facingDeg={entry.facingDeg} />
          </motion.div>
        </motion.div>
      )}

      {/* WIN OVERLAY */}
      {showWinOverlay && (
        <div className="absolute inset-0 z-[60] flex items-center justify-center">
          <div className="relative select-none">
            <img
              src="/lilly.png"
              alt="Congratulations"
              className="w-[360px] h-auto object-contain drop-shadow-2xl"
            />
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <div className="text-xl font-extrabold tracking-wide text-white drop-shadow">
                CONGRATULATIONS
              </div>
              <div className="text-sm opacity-90 text-white drop-shadow">you won</div>
              <div className="text-2xl font-extrabold mt-1 text-yellow-300 drop-shadow">
                {format ? format(overlayAmount) : overlayAmount}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
