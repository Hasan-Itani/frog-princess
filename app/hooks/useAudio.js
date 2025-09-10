"use client";
import { useRef, useCallback } from "react";
import spritemap from "../components/gameaudio.json";

export default function useAudio() {
  const audioRef = useRef(null);

  const getAudio = () => {
    if (typeof window === "undefined") return null;
    if (!audioRef.current) {
      const audio = document.createElement("audio");
      spritemap.resources.forEach((src) => {
        const source = document.createElement("source");
        source.src = src;
        audio.appendChild(source);
      });
      audioRef.current = audio;
    }
    return audioRef.current;
  };

  const play = useCallback((name) => {
    const audio = getAudio();
    if (!audio || !spritemap.spritemap[name]) return;

    const { start, end, loop } = spritemap.spritemap[name];
    audio.currentTime = start;

    audio.loop = loop || ["ambience", "basic_background", "rampage_background"].includes(name);

    const onTimeUpdate = () => {
      if (audio.currentTime >= end && !audio.loop) {
        audio.pause();
        audio.removeEventListener("timeupdate", onTimeUpdate);
      }
    };

    audio.removeEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("timeupdate", onTimeUpdate);

    audio.play().catch((err) => console.error("Audio play error:", err));
  }, []);

  const stop = useCallback(() => {
    const audio = getAudio();
    if (!audio) return;
    audio.pause();
    audio.currentTime = 0;
  }, []);

  return { play, stop };
}