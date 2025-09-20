"use client";

/**
 * Board layout constants
 * Centralized sizing and spacing values for consistency across the game.
 */
export const PADS_PER_ROW = 5; // number of lily pads per row
export const WINDOW_SIZE = 5; // number of rows rendered in viewport

export const ROCK_SPACE = 96; // spacing allocated for rock at bottom

export const LILY_BTN = 72; // interactive lily pad button size
export const LILY_IMG = 80; // lily pad image asset size

export const BADGE_W = 58; // badge width
export const BADGE_GUTTER = BADGE_W + 16; // spacing per badge (width + gap)

export const ROW_H = 60; // row height (pad size vertically)
export const ROW_GAP = 1; // gap between rows
export const ROW_STRIDE = ROW_H + ROW_GAP; // full stride per row

export const FROG_SIZE = 70; // fixed frog sprite size
export const ROCK_IMG = 90; // rock image size
export const ROCK_FROG_Y_OFFSET = -8; // perch tweak Y
export const ROCK_FROG_X_OFFSET = 0; // perch tweak X

/**
 * angleToCol
 *
 * Helper to compute facing angle in degrees for a jump
 * from one column to another. Row always moves "up" (-y).
 *
 * @param {number} fromCol - starting column index
 * @param {number} toCol - target column index
 * @returns {number} angle in degrees
 */
export function angleToCol(fromCol, toCol) {
  const dx = toCol - fromCol;
  const dy = -1;
  return (Math.atan2(dy, dx) * 180) / Math.PI;
}

/**
 * makeRng
 *
 * Creates a small, deterministic RNG seeded on (rowIndex, col).
 * Ensures stable but varied float/drift per pad.
 */
function makeRng(rowIndex, col) {
  // simple xor-shift style hash as seed
  let x = (((rowIndex + 1) * 73856093) ^ ((col + 1) * 19349663)) >>> 0;
  return () => {
    x = (1664525 * x + 1013904223) >>> 0; // LCG
    return x / 0xffffffff; // 0..1
  };
}

/**
 * floatParams
 *
 * Returns stable "bobbing" animation params for a lily pad.
 * Values are randomized but consistent per (row,col).
 */
export function floatParams(rowIndex, col = 0) {
  const rnd = makeRng(rowIndex, col);

  const bob = 2 + Math.floor(rnd() * 2); // vertical bob: 2-3 px
  const drift = (rnd() - 0.5) * 8; // horizontal drift: ~-4..+4 px
  const tilt = 1 + rnd() * 2; // tilt: 1-3 deg
  const dur = 2.6 + rnd() * 1.6; // cycle duration: 2.6-4.2 s
  const delay = rnd() * 1.2; // phase offset: 0-1.2 s

  return { bob, drift, tilt, dur, delay };
}

/**
 * rotationsForRow
 *
 * Generates stable random rotation angles for pads in a row.
 * Ensures each row always looks the same across renders.
 *
 * @param {number} rowIndex
 * @returns {number[]} array of rotations (deg) per pad
 */
export function rotationsForRow(rowIndex) {
  const out = [];
  let x = ((rowIndex + 7) * 1103515245 + 12345) % 2147483647;

  for (let i = 0; i < PADS_PER_ROW; i++) {
    x = (1103515245 * x + 12345) % 2147483647;
    out.push(((x % 60) - 30) * 1); // range: -30..+30 deg
  }

  return out;
}
