"use client";
import Image from "next/image";
import { MULTIPLIERS } from "../hooks/useGame";
import { useDebug } from "../hooks/useDebug";
import useBoard from "../hooks/useBoard";

const LILY_BTN = 72;
const LILY_IMG = 80;
const BADGE_W = 48;
const BADGE_GUTTER = BADGE_W + 16;
const ROCK_SPACE = 96;
// simple money formatter

export default function GameBoard() {
  const { showDrops } = useDebug();

  const {
    frogRow,
    frogCol,
    visibleIndices,
    getTraps,
    rowOpacity,
    shouldRevealRow,
    isRowClickable,
    onPadClick,
    rotationsForRow,
    floatParams,
    showWinOverlay,
    overlayAmount,
  } = useBoard();

  const format = (n) =>
    typeof n === "number"
      ? n.toLocaleString(undefined, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })
      : n;

  return (
    <div className="relative w-full h-full">
      {/* ROWS */}
      <div className="absolute inset-x-0" style={{ bottom: ROCK_SPACE }}>
        {visibleIndices.map((rowIndexGlobal) => {
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
              <div className="flex items-center justify-center gap-3">
                {Array.from({ length: 5 }).map((_, col) => {
                  const isFrogHere =
                    rowIndexGlobal === frogRow && frogCol === col;
                  const padOpacity = isFrogHere
                    ? 1
                    : rowOpacity(rowIndexGlobal);
                  const isTrapAndRevealed = revealThisRow && traps.has(col);
                  const clickable = isRowClickable(rowIndexGlobal);

                  // When revealed, traps disappear (unless dev overlay is on)
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

                  const { bob, tilt, drift, dur, delay } = floatParams(
                    rowIndexGlobal,
                    col
                  );

                  return (
                    <button
                      key={col}
                      onClick={() =>
                        clickable ? onPadClick(rowIndexGlobal, col) : null
                      }
                      disabled={!clickable}
                      className={`relative rounded-full grid place-items-center transition-transform ${
                        clickable
                          ? "hover:scale-105 cursor-pointer"
                          : "cursor-default"
                      }`}
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
                        <Image
                          src="/lilly.png"
                          alt="Lily"
                          width={LILY_IMG}
                          height={LILY_IMG}
                          className="pointer-events-none"
                          style={{ transform: `rotate(${rots[col]}deg)` }}
                        />

                        {/* DEV overlay: show trap marker */}
                        {showDrops && traps.has(col) && (
                          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                            <div className="w-2 h-2 rounded-full bg-red-600 animate-pulse" />
                          </div>
                        )}

                        {/* Frog rides the lily */}
                        {isFrogHere && (
                          <Image
                            src="/frog.png"
                            alt="Frog"
                            width={Math.round(LILY_BTN * 0.5)}
                            height={Math.round(LILY_BTN * 0.5)}
                            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
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
                  const { bob, tilt, drift, dur, delay } = floatParams(
                    rowIndexGlobal,
                    -1
                  );
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
      {showWinOverlay && (
        <div className="absolute inset-0 z-[60] flex items-center justify-center">
          <div className="relative select-none">
            {/* ⬇️ replace src with your popup asset path if different */}
            <img
              src="/lilly.png"
              alt="Congratulations"
              className="w-[360px] h-auto object-contain drop-shadow-2xl"
            />
            {/* text inside the image */}
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <div className="text-xl font-extrabold tracking-wide text-white drop-shadow">
                CONGRATULATIONS
              </div>
              <div className="text-sm opacity-90 text-white drop-shadow">
                you won
              </div>
              <div className="text-2xl font-extrabold mt-1 text-yellow-300 drop-shadow">
                {format(overlayAmount)}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
