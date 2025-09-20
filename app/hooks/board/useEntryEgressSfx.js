"use client";
import { useEffect } from "react";
import useAudioRandom from "../audio/useAudioRandom";

/** Fires SFX for entry/egress events. */
export default function useEntryEgressSfx({ entry, egress }) {
  const { playRandom, playSfx } = useAudioRandom();

  useEffect(() => {
    if (entry) {
      playSfx?.("lilly_appear");
      playRandom("frog", 5);
    }
  }, [entry, playSfx, playRandom]);
  useEffect(() => {
    if (egress) playRandom("frog", 5);
  }, [egress, playRandom]);
}
