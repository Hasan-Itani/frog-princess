// app/components/GameBoard.jsx
"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";

import { useGame, MULTIPLIERS } from "../hooks/useGame";
import { useDebug } from "../hooks/useDebug";
import useBoard from "../hooks/useBoard";
import FlipbookImage from "./FlipbookImage";
import FrogSprite from "./animations/FrogSprite";

import useSpawnWave from "../hooks/useSpawnWave";
import useWaterPop from "../hooks/useWaterPop";
import useRowRevealDissolve from "../hooks/useRowRevealDissolve";
import useRowsSlide from "../hooks/useRowsSlide";
import usePerchOverlay from "../hooks/usePerchOverlay";
import useIntroSweep from "../hooks/useIntroSweep";
import useEgressEntry from "../hooks/useEgressEntry";

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
  floatParams,
  rotationsForRow,
} from "../hooks/useBoardVisuals";

import GoldStatic from "./atoms/GoldStatic";
import NumberGlyphs, { symbolToImage } from "./atoms/NumberGlyphs";
import useWinOverlayAnimation from "../hooks/board/useWinOverlayAnimation";
import useWinWipe from "../hooks/board/useWinWipe";
import useOverlayFromSync from "../hooks/board/useOverlayFromSync";
import useEntryEgressSfx from "../hooks/board/useEntryEgressSfx";
import useLossSequence from "../hooks/board/useLossSequence";
import useEntryOnIdle from "../hooks/board/useEntryOnIdle";
import useAudioRandom from "../hooks/audio/useAudioRandom";
import FrogLoseFlipbook from "./flipbooks/FrogLoseFlipbook";

export default function GameBoard() {
  const { format, finishReason, isPlaying, level } = useGame();
  const { showDrops } = useDebug();

  // Board state/logic
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

  // spawn / water-pop / dissolve
  const { spawnWaveKey, bumpSpawnWave } = useSpawnWave();
  const { getWaterPopKey, bumpWaterPop } = useWaterPop();
  const { rowRevealKey, dissolvedPads, markDissolved } = useRowRevealDissolve(
    visibleIndices,
    shouldRevealRow,
    spawnWaveKey
  );

  // perch & rows slide
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
    rockOffsets: { xOffset: 0, yOffset: -8 },
  });

  const { renderedIndices, rowsY } = useRowsSlide(
    visibleIndices,
    ROW_STRIDE,
    onRowsShift
  );

  // intro sweep (onEnd triggers first entry)
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

  // egress / entry
  const { egress, setEgress, entry, setEntry, triggerEntry } = useEgressEntry({
    finishReason,
    frogCol,
    frogFacingDeg,
    boardRef,
    getRockCenter,
    captureCurrentPerchCenter,
    frogSize: FROG_SIZE,
  });

  // helpers
  const { playRandom, playSfx } = useAudioRandom();

  // overlay-from sync for jump overlay
  const { overlayFrom, setOverlayFrom } = useOverlayFromSync({
    isJumping,
    captureCurrentPerchCenter,
  });

  // entry SFX & egress SFX
  useEntryEgressSfx({ entry, egress });

  // start spawn+entry when becoming idle (post-intro)
  useEntryOnIdle({
    isPlaying,
    level,
    suppressUntilIntroDoneRef: suppressEntryUntilIntroDone,
    lossActive: false, // loss gate handled in useLossSequence
    bumpSpawnWave,
    triggerEntry,
  });

  // win overlay anim & wipe key
  const { overlayCtrl, winDismissed } = useWinOverlayAnimation(showWinOverlay);
  const winWipeKey = useWinWipe(showWinOverlay);

  // pad click: SFX + overlayFrom capture + board handler
  const handlePadClick = (row, col, clickable) => {
    if (!clickable) return;
    bumpWaterPop(row, col);
    playSfx?.("lilly_click");
    const from = captureCurrentPerchCenter?.();
    if (from) setOverlayFrom(from);
    onPadClick(row, col);
  };

  // highlight a row right after landing
  const [highlightRow, setHighlightRow] = useState(null);
  const handleFrogJumpEndLocal = () => {
    onFrogJumpEnd();
    setHighlightRow(frogRow);
  };
  useEffect(() => {
    if (isJumping || finishReason === "drop") setHighlightRow(null);
  }, [isJumping, finishReason]);

  // loss gate: drown→disappear→wait dissolve→restart (spawn+entry)
  const { lossSeq } = useLossSequence({
    finishReason,
    frogRow,
    frogCol,
    dissolvedPads,
    onRestart: () => {
      bumpSpawnWave();
      triggerEntry();
    },
  });

  // lose overlay position / anim
  const [loseAnim, setLoseAnim] = useState(null);
  useEffect(() => {
    if (finishReason === "drop") {
      const c = captureCurrentPerchCenter?.();
      if (c) setLoseAnim({ x: c.x, y: c.y, facingDeg: frogFacingDeg });
    } else setLoseAnim(null);
  }, [finishReason, frogFacingDeg, captureCurrentPerchCenter]);

  const overlayFrogActiveForRock = isJumping || Boolean(entry);
  const overlayFrogActiveForLilies =
    isJumping ||
    Boolean(egress) ||
    !isPlaying ||
    Boolean(loseAnim) ||
    showWinOverlay;

  // ===== RENDER =====
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
                        <NumberGlyphs
                          text={`x${mult.toFixed(2)}`}
                          color="gray"
                        />
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
                          type="button"
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
                            {/* Tile logic: trap reveal / win wipe / spawn */}
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
                                    direction="backward"
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
                          <NumberGlyphs
                            text={`x${mult.toFixed(2)}`}
                            color={
                              highlightRow === rowIndexGlobal
                                ? "yellow"
                                : "gray"
                            }
                            className=""
                            scaleOn={highlightRow === rowIndexGlobal}
                          />
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

      {/* ROCK */}
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
              // LAND: land_0..4
              playRandom("land", 5);
              handleFrogJumpEndLocal();
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
            animate={{ opacity: [1, 1, 0.9, 0.0], scale: [1, 0.98, 0.96] }}
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

            <img
              src="/win-tile.png"
              alt=""
              width={360}
              height={360}
              className="relative z-[20] object-contain drop-shadow-2xl block mx-auto"
              style={{ width: 360, height: "auto" }}
            />

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
    </div>
  );
}
