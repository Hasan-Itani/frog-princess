"use client";
import { useRef, useCallback } from "react";
import spritemap from "../components/gameaudio.json";

let globalAudios = [null, null]; // два плеера для кроссфейда
let activeIndex = 0;
let globalMuted = false;
let rafId = null;

const initGlobalAudio = () => {
  if (typeof window === "undefined") return null;
  const audio = document.createElement("audio");
  audio.src = spritemap.resources[0];
  audio.preload = "auto";
  audio.volume = 1;
  return audio;
};

export default function useAudio() {
  const audioRef = useRef([null, null]);

  const getAudios = () => {
    if (!audioRef.current[0]) {
      audioRef.current = [initGlobalAudio(), initGlobalAudio()];
      globalAudios = audioRef.current;
    }
    return audioRef.current;
  };

  const clearLoop = () => {
    if (rafId) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
  };

  const setMuted = useCallback((muted) => {
    globalMuted = muted;
    const audios = getAudios();
    if (muted) {
      audios.forEach((a) => a && a.pause());
      clearLoop();
    }
  }, []);

  const play = useCallback((name) => {
    if (globalMuted) return;

    const audios = getAudios();
    const clip = spritemap.spritemap[name];
    if (!clip) return;

    const { start, end, loop } = clip;
    clearLoop();

    // Активный и запасной плеер
    const current = audios[activeIndex];
    const next = audios[1 - activeIndex];

    // Настраиваем активный
    current.currentTime = start;
    current.loop = false;
    current.volume = 1;

    // Проверка конца сегмента
    const checkLoop = () => {
      if (current.currentTime >= end) {
        if (loop) {
          // Запускаем "next" с fade-in
          next.currentTime = start;
          next.volume = 0;
          next.play().catch((err) => console.error("Crossfade play error:", err));

          // Плавный фейд за 0.2с
          const fadeDuration = 0.2;
          const fadeStart = performance.now();

          const doFade = (t) => {
            const progress = Math.min((t - fadeStart) / (fadeDuration * 1000), 1);
            current.volume = 1 - progress;
            next.volume = progress;
            if (progress < 1) {
              requestAnimationFrame(doFade);
            } else {
              current.pause();
              activeIndex = 1 - activeIndex; // переключаем
            }
          };

          requestAnimationFrame(doFade);
        } else {
          current.pause();
          clearLoop();
          return;
        }
      }
      rafId = requestAnimationFrame(checkLoop);
    };

    rafId = requestAnimationFrame(checkLoop);

    current.play().catch((err) =>
      console.error("Audio play error:", err)
    );
  }, []);

  const stop = useCallback(() => {
    const audios = getAudios();
    audios.forEach((a) => {
      a.pause();
      a.currentTime = 0;
    });
    clearLoop();
  }, []);

  return { play, stop, setMuted };
}
