"use client";
import useAudio from "../audio/useAudio";

/** Randomized SFX helpers. */
export default function useAudioRandom() {
  const { playSfx } = useAudio();
  const playRandom = (base, count) =>
    playSfx?.(`${base}_${Math.floor(Math.random() * count)}`);
  return { playRandom, playSfx };
}
