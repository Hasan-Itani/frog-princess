"use client";
import { useState } from "react";

/** Manages a key that replays spawn flipbooks when bumped. */
export default function useSpawnWave() {
  const [spawnWaveKey, setSpawnWaveKey] = useState(0);
  const bumpSpawnWave = () => setSpawnWaveKey((k) => k + 1);
  return { spawnWaveKey, bumpSpawnWave };
}
