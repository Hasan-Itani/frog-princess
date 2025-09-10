"use client";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { useGame, MULTIPLIERS } from "../hooks/useGame";
import { useDebug } from "../hooks/useDebug";

const PADS_PER_ROW = 5;
const WINDOW_SIZE = 5;

// UI sizing
const ROCK_SPACE = 96;
const LILY_BTN = 72;
const LILY_IMG = 80;
const BADGE_W = 48;
const BADGE_GUTTER = BADGE_W + 16;

// Fade older rows a bit
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

// distribution: 1,1,1,1,1, 2,2,2,2, 3,3,3, 4,4 (levels 1..14)
function dropsForLevel(idx) {
  const n = idx + 1;
  if (n >= 1 && n <= 5) return 1;
  if (n >= 6 && n <= 9) return 2;
  if (n >= 10 && n <= 12) return 3;
  return 4; // 13-14
}

/** deterministic traps for a row based on runSeed */
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

// cosmetic per-pad rotation
function rotationsForRow(rowIndex) {
  const out = [];
  let x = ((rowIndex + 7) * 1103515245 + 12345) % 2147483647;
  for (let i = 0; i < PADS_PER_ROW; i++) {
    x = (1103515245 * x + 12345) % 2147483647;
    out.push(((x % 60) - 30) * 1);
  }
  return out;
}

export default function GameBoard() {
  const {
    isPlaying,
    startRun,
    advanceOneLevel, // (we already added force in your hook earlier)
    dropNow,
    showWinOverlay,
    overlayAmount,
    format,
    level,
    levelsCount,
  } = useGame();

  const { showDrops } = useDebug();

  // frog visual state
  const [frogRow, setFrogRow] = useState(-1);
  const [frogCol, setFrogCol] = useState(2);

  // traps randomize every new run, but stay stable within the run
  const [runSeed, setRunSeed] = useState(null);

  // reveal map and global revealAll when dropped
  const [revealedMap, setRevealedMap] = useState({}); // {rowIdx: true}
  const [revealAll, setRevealAll] = useState(false);

  // which rows are on screen
  const visibleIndices = useMemo(() => {
    const maxBottom = Math.max(0, levelsCount - WINDOW_SIZE);
    const bottom = Math.min(Math.max(level - 1, 0), maxBottom);
    const top = Math.min(bottom + WINDOW_SIZE - 1, levelsCount - 1);
    const out = [];
    for (let idx = top; idx >= bottom; idx--) out.push(idx);
    return out;
  }, [level, levelsCount]);

  // only reset frog on a true round reset
  useEffect(() => {
    if (!isPlaying && level === 0) {
      setFrogRow(-1);
      setFrogCol(2);
      setRevealedMap({});
      setRevealAll(false);
      setRunSeed(null);
    }
  }, [isPlaying, level]);

  function ensureRunSeed() {
    if (runSeed !== null) return runSeed;
    const seedNow = (Date.now() ^ Math.floor(Math.random() * 0x7fffffff)) >>> 0;
    setRunSeed(seedNow);
    return seedNow;
  }

  function onPadClick(rowIndexGlobal, col) {
    // hard-lock input if we're revealing all (dropped) or overlay is visible
    if (revealAll || showWinOverlay) return;

    // only the next row is clickable
    if (rowIndexGlobal !== level) return;

    const starting = !isPlaying;
    if (starting) {
      const ok = startRun(); // deduct, set isPlaying (async)
      if (!ok) return;
    }

    const seed = runSeed ?? ensureRunSeed();

    // move frog immediately to avoid snap-back
    setFrogRow(rowIndexGlobal);
    setFrogCol(col);

    const traps = trapsForRow(rowIndexGlobal, PADS_PER_ROW, seed);
    const clickedIsTrap = traps.has(col);
    
    if (clickedIsTrap) {
      const full = {};
      for (let i = 0; i < levelsCount; i++) full[i] = true;
      setRevealAll(true); // visuals
      setRevealedMap(full); // visuals
      dropNow(true); // ⬅️ force finish on first-click drop
      return;
    }

    // safe: reveal only this row's traps and advance
    setRevealedMap((m) => ({ ...m, [rowIndexGlobal]: true }));
    advanceOneLevel(starting); // pass true on very first safe click if you kept the 'force' param
  }

  return (
    <div className="relative w-full h-full">
      {/* ROWS */}
      <div className="absolute inset-x-0" style={{ bottom: ROCK_SPACE }}>
        {visibleIndices.map((rowIndexGlobal) => {
          const mult = MULTIPLIERS[rowIndexGlobal];

          // allow clicks if:
          // - it’s the current level row
          // - AND either the run is active OR we’re at pre-start (level 0)
          // - AND we’re not in a dropped state (revealAll) nor overlay
          const canStartNewRun =
            !isPlaying && level === 0 && !revealAll && !showWinOverlay;
          const isClickable =
            rowIndexGlobal === level &&
            (isPlaying || canStartNewRun) &&
            !revealAll &&
            !showWinOverlay;

          const rots = rotationsForRow(rowIndexGlobal);
          const rowOpacity = opacityForRow(rowIndexGlobal, level);
          const seed = runSeed ?? 123456789; // placeholder seed before run
          const traps = trapsForRow(rowIndexGlobal, PADS_PER_ROW, seed);
          const shouldRevealThisRow =
            revealAll || !!revealedMap[rowIndexGlobal];

          return (
            <div
              key={rowIndexGlobal}
              className="relative"
              style={{ paddingLeft: BADGE_GUTTER }}
            >
              <div className="flex items-center justify-center gap-3">
                {Array.from({ length: PADS_PER_ROW }).map((_, col) => {
                  const isFrogHere =
                    rowIndexGlobal === frogRow && frogCol === col;
                  const padOpacity = isFrogHere ? 1 : rowOpacity;
                  const isTrapAndRevealed =
                    shouldRevealThisRow && traps.has(col);

                  // When revealed, traps "disappear":
                  // if debug ON, we keep the pad visible with a marker but still disable click.
                  if (isTrapAndRevealed && !showDrops) {
                    return (
                      <div
                        key={col}
                        style={{
                          width: LILY_BTN,
                          height: LILY_BTN,
                          opacity: 0,
                        }}
                      />
                    );
                  }

                  return (
                    <button
                      key={col}
                      onClick={() =>
                        isClickable ? onPadClick(rowIndexGlobal, col) : null
                      }
                      disabled={!isClickable}
                      className={`relative rounded-full grid place-items-center transition-transform ${
                        isClickable
                          ? "hover:scale-105 cursor-pointer"
                          : "cursor-default"
                      }`}
                      style={{
                        width: LILY_BTN,
                        height: LILY_BTN,
                        opacity: padOpacity,
                        zIndex: isFrogHere ? 10 : 1,
                      }}
                      title={isClickable ? "Jump" : ""}
                    >
                      <Image
                        src="/lilly.png"
                        alt="Lily"
                        width={LILY_IMG}
                        height={LILY_IMG}
                        className="pointer-events-none"
                        style={{ transform: `rotate(${rots[col]}deg)` }}
                      />

                      {/* DEV overlay: mark/unmark traps */}
                      {showDrops && traps.has(col) && (
                        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                          <div className="w-2 h-2 rounded-full bg-red-600 animate-pulse" />
                        </div>
                      )}

                      {/* Frog */}
                      {isFrogHere && (
                        <Image
                          src="/frog.png"
                          alt="Frog"
                          width={Math.round(LILY_BTN * 0.5)}
                          height={Math.round(LILY_BTN * 0.5)}
                          className="absolute pointer-events-none"
                        />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Multiplier flower (always visible; never inherits row opacity) */}
              <div
                className="absolute top-1/2 -translate-y-1/2"
                style={{ left: 8, width: BADGE_W, height: BADGE_W }}
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
                  x{MULTIPLIERS[rowIndexGlobal]}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ROCK (rotate 270°) */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 pointer-events-none">
        <Image
          src="/rock.png"
          alt="Rock"
          width={88}
          height={88}
          className="object-contain -rotate-90"
        />
        {frogRow === -1 && (
          <Image
            src="/frog.png"
            alt="Frog"
            width={46}
            height={46}
            className="absolute left-1/2 -translate-x-1/2 top-1"
          />
        )}
      </div>

      {/* Win overlay (text inside image) */}
      {showWinOverlay && (
        <div className="absolute inset-0 z-50 flex items-center justify-center">
          <div className="relative w-[260px] h-[260px]">
            <Image
              src="/lilly.png"
              alt="Congratulations"
              fill
              className="object-contain rounded-xl"
            />
            <div className="absolute inset-0 grid place-items-center text-center px-6">
              <div>
                <div className="text-yellow-300 text-lg font-extrabold">
                  CONGRATULATIONS
                </div>
                <div className="text-sm opacity-90">you won</div>
                <div className="text-2xl font-extrabold mt-1 text-white">
                  {format(overlayAmount)}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
