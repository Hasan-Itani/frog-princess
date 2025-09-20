"use client";

import { useState } from "react";

/**
 * useSpawnWave
 *
 * Manages a simple numeric key that can be bumped to trigger/replay
 * "spawn wave" flipbook animations.
 *
 * Each call to bumpSpawnWave increments the key, which can then be
 * passed as a React `key` prop to force a remount/replay of the animation.
 *
 * Example usage:
 *   const { spawnWaveKey, bumpSpawnWave } = useSpawnWave();
 *   <SpawnWave key={spawnWaveKey} />
 */
export default function useSpawnWave() {
  // A counter that increments each time a spawn wave is triggered
  const [spawnWaveKey, setSpawnWaveKey] = useState(0);

  /**
   * Increment the spawn wave key.
   * Use this whenever you want to replay the spawn animation.
   */
  const bumpSpawnWave = () => setSpawnWaveKey((prev) => prev + 1);

  return { spawnWaveKey, bumpSpawnWave };
}
