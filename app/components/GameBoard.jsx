"use client";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { useGame, MULTIPLIERS } from "../hooks/useGame";

// Opacity: next=100%, then 80/60/40/20; finished lines (<= level-1) at 50% except frog pad
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

function makeRotations(seed, padsPerRow) {
  const r = [];
  let x = seed;
  for (let i = 0; i < padsPerRow; i++) {
    x = (1103515245 * x + 12345) % 2147483647;
    r.push(((x % 60) - 30) * 1);
  }
  return r;
}

export default function GameBoard() {
  const {
    isPlaying,
    startRun,
    advanceOneLevel,
    showWinOverlay,
    overlayAmount,
    format,
    level,
    levelsCount,
  } = useGame();

  const padsPerRow = 5;
  const windowSize = 5; // always 5 rows
  const ROCK_SPACE = 96; // px reserved above bottom for the rock (tweak if needed)
  const LILY_BTN = 72; // button box (px) ~ w-18/h-18; tweak for bigger/smaller
  const LILY_IMG = 80; // lily image size in px
  const BADGE_W = 48; // multiplier badge size in px
  const BADGE_GUTTER = BADGE_W + 16; // left gutter to avoid overlap

  // frog visual state
  const [frogRow, setFrogRow] = useState(-1); // -1 = on rock
  const [frogCol, setFrogCol] = useState(2);

  // Clamp a 5-row window (top->bottom) that never grows to 6
  const visibleIndices = useMemo(() => {
    const maxBottom = Math.max(0, levelsCount - windowSize);
    const bottom = Math.min(Math.max(level - 1, 0), maxBottom);
    const top = Math.min(bottom + windowSize - 1, levelsCount - 1);
    const out = [];
    for (let idx = top; idx >= bottom; idx--) out.push(idx);
    return out;
  }, [level, levelsCount]);

  useEffect(() => {
    // Keep frog anchored on the finished line (bottom of the window)
    if (!isPlaying && level === 0) {
      setFrogRow(-1);
      setFrogCol(2);
    } else {
      setFrogRow(level - 1);
    }
  }, [isPlaying, level]);

  function onPadClick(rowIndexGlobal, col) {
    // Only the "next" line is clickable
    if (rowIndexGlobal !== level) return;

    // Start (deduct bet) and advance immediately on first click
    const ok = isPlaying || startRun();
    if (!ok) return;

    setFrogCol(col);
    advanceOneLevel();
  }

  return (
    <div className="relative w-full h-full">
      {/* ROWS: absolutely positioned with reserved space for the rock */}
      <div className="absolute inset-x-0" style={{ bottom: ROCK_SPACE }}>
        {visibleIndices.map((rowIndexGlobal) => {
          const mult = MULTIPLIERS[rowIndexGlobal];
          const isClickable = rowIndexGlobal === level;
          const rots = makeRotations(rowIndexGlobal + 7, padsPerRow);
          const rowOpacity = opacityForRow(rowIndexGlobal, level);

          return (
            <div
              key={rowIndexGlobal}
              className="relative"
              style={{ paddingLeft: BADGE_GUTTER }}
            >
              <div className="flex items-center justify-center gap-3 py-1.5">
                {Array.from({ length: padsPerRow }).map((_, col) => {
                  const isFrogHere =
                    rowIndexGlobal === frogRow && frogCol === col;
                  const padOpacity = isFrogHere ? 1 : rowOpacity;

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

              {/* Multiplier badge on the left; uses dedicated gutter so it never collides */}
              <div
                className="absolute top-1/2 -translate-y-1/2"
                style={{
                  left: 8,
                  opacity: rowOpacity,
                  width: BADGE_W,
                  height: BADGE_W,
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
                  <div className="absolute inset-0 grid place-items-center text-[11px] font-extrabold text-black">
                    x{mult}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ROCK: anchored to bottom center, out of normal flow */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 pointer-events-none">
        <Image
          src="/rock.png"
          alt="Rock"
          width={88}
          height={88}
          className="object-contain -rotate-90 "
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

      {/* Win overlay */}
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
