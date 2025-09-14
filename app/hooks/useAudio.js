"use client";
import { useCallback } from "react";
import * as audioManager from "./audioManager";

export default function useAudio() {
  return {
    play: useCallback(audioManager.play, []),
    stop: useCallback(audioManager.stopAll, []),
    setMuted: useCallback(audioManager.setMuted, []),
  };
}
