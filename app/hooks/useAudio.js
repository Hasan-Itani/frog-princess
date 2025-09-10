"use client";
import { useRef, useCallback } from "react";
import spritemap from "../components/gameaudio.json";

// Глобальные переменные для единого управления аудио
let globalAudio = null;
let globalMuted = false;
let currentTimeUpdateListener = null;

const initGlobalAudio = () => {
  if (typeof window === "undefined" || globalAudio) return globalAudio;
  
  globalAudio = document.createElement("audio");
  spritemap.resources.forEach((src) => {
    const source = document.createElement("source");
    source.src = src;
    globalAudio.appendChild(source);
  });
  
  return globalAudio;
};

export default function useAudio() {
  const audioRef = useRef(null);

  const getAudio = () => {
    if (!audioRef.current) {
      audioRef.current = initGlobalAudio();
    }
    return audioRef.current;
  };

  const setMuted = useCallback((muted) => {
    globalMuted = muted;
    const audio = getAudio();
    if (muted && audio) {
      audio.pause();
      if (currentTimeUpdateListener) {
        audio.removeEventListener("timeupdate", currentTimeUpdateListener);
        currentTimeUpdateListener = null;
      }
    }
  }, []);

  const play = useCallback((name) => {
    if (globalMuted) return;

    const audio = getAudio();
    const clip = spritemap.spritemap[name];
    if (!audio || !clip) return;

    const { start, end, loop } = clip;

    // Снимаем предыдущего слушателя
    if (currentTimeUpdateListener) {
      audio.removeEventListener("timeupdate", currentTimeUpdateListener);
      currentTimeUpdateListener = null;
    }

    // Ставим на начало куска
    audio.pause();
    audio.currentTime = start;
    audio.loop = !!loop;

    // Если кусок НЕ зацикленный → вручную останавливаем по окончании
    currentTimeUpdateListener = () => {
      if (audio.currentTime >= end && !audio.loop) {
        audio.pause();
        audio.removeEventListener("timeupdate", currentTimeUpdateListener);
        currentTimeUpdateListener = null;
      }
    };

    audio.addEventListener("timeupdate", currentTimeUpdateListener);
    audio.play().catch(err => {
      console.error("Audio play error:", err);
    });
  }, []);

  const stop = useCallback(() => {
    const audio = getAudio();
    if (!audio) return;
    
    audio.pause();
    audio.currentTime = 0;
    
    if (currentTimeUpdateListener) {
      audio.removeEventListener("timeupdate", currentTimeUpdateListener);
      currentTimeUpdateListener = null;
    }
  }, []);

  return { play, stop, setMuted };
}