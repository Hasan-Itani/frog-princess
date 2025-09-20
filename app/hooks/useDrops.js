"use client";

/**
 * dropsForLevel
 *
 * Returns how many "drops" (traps/obstacles) should appear for a given
 * level index (0-based). The distribution is:
 *
 *  idx 0-4   → 1 drop
 *  idx 5-8   → 2 drops
 *  idx 9-11  → 3 drops
 *  idx 12-13 → 4 drops
 *
 * @param {number} idx - zero-based level index (0..13)
 * @returns {number} number of drops for that level
 */
export function dropsForLevel(idx) {
  const n = idx + 1; // shift to 1-based for easier reading

  if (n >= 1 && n <= 5) return 1;
  if (n >= 6 && n <= 9) return 2;
  if (n >= 10 && n <= 12) return 3;
  return 4; // levels 13-14 (or any higher)
}
