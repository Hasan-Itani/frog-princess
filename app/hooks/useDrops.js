"use client";

// 1..14 → 1,1,1,1,1, 2,2,2,2, 3,3,3, 4,4
export function dropsForLevel(idx) {
  const n = idx + 1;
  if (n >= 1 && n <= 5) return 1;
  if (n >= 6 && n <= 9) return 2;
  if (n >= 10 && n <= 12) return 3;
  return 4; // 13-14
}
