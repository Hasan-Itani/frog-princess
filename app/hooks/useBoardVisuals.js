"use client";

/** Shared, single source of truth for board visuals + sizing */
export const PADS_PER_ROW = 5;
export const WINDOW_SIZE = 5;

export const ROCK_SPACE = 96;

export const LILY_BTN = 72;
export const LILY_IMG = 80;

export const BADGE_W = 48;
export const BADGE_GUTTER = BADGE_W + 16;

export const ROW_H = 60;
export const ROW_GAP = 1;
export const ROW_STRIDE = ROW_H + ROW_GAP;

export const FROG_SIZE = 70;      // fixed frog size everywhere
export const ROCK_IMG = 90;       // rock image size
export const ROCK_FROG_Y_OFFSET = -8; // perch tweak
export const ROCK_FROG_X_OFFSET = 0;  // perch tweak

/** Facing helper for a jump from one column to another (row always moves up) */
export function angleToCol(fromCol, toCol) {
  const dx = toCol - fromCol;
  const dy = -1;
  return (Math.atan2(dy, dx) * 180) / Math.PI;
}

/** Small, stable RNG seeded on row+col */
function makeRng(rowIndex, col) {
  let x = (((rowIndex + 1) * 73856093) ^ ((col + 1) * 19349663)) >>> 0;
  return () => {
    x = (1664525 * x + 1013904223) >>> 0;
    return x / 0xffffffff;
  };
}

/** Gentle water float params (stable per row/col) */
export function floatParams(rowIndex, col = 0) {
  const rnd = makeRng(rowIndex, col);
  const bob = 2 + Math.floor(rnd() * 2);   // 2..3 px
  const drift = (rnd() - 0.5) * 8;         // ~-4..+4 px
  const tilt = 1 + rnd() * 2;              // 1..3 deg
  const dur = 2.6 + rnd() * 1.6;           // 2.6..4.2 s
  const delay = rnd() * 1.2;               // 0..1.2 s
  return { bob, drift, tilt, dur, delay };
}

/** Stable per-row pad rotations */
export function rotationsForRow(rowIndex) {
  const out = [];
  let x = ((rowIndex + 7) * 1103515245 + 12345) % 2147483647;
  for (let i = 0; i < PADS_PER_ROW; i++) {
    x = (1103515245 * x + 12345) % 2147483647;
    out.push(((x % 60) - 30) * 1); // -30..+30 deg
  }
  return out;
}
