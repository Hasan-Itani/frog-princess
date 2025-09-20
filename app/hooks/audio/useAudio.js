"use client";

/**
 * Audio sprite manager with two independent mixers:
 * - MUSIC: single looping background track (ambience OR basic_background)
 * - SFX:   pooled one-shots (button, land_*, frog_*, etc.)
 *
 * Files expected under /public:
 *   - /gameaudio.json
 *   - /sounds/gameaudio.mp3            ← update if you store it under /sounds/mp3/
 */

import { useMemo } from "react";

const SPRITE_JSON_URL = "/gameaudio.json";
const SPRITE_URL = "/sounds/gameaudio.mp3"; // change to "/sounds/mp3/gameaudio.mp3" if that’s your path

// Treat these names as "background music" even if JSON.loop=false
const BG_NAMES = new Set(["ambience", "basic_background"]);

let SPRITEMAP = null;
let spriteLoadPromise = null;

/** Build a normalized { name: {start,end,loop,duration} } map */
function buildMap(json) {
  const out = {};
  const raw = (json && json.spritemap) || {};
  for (const [name, seg] of Object.entries(raw)) {
    const start = Number(seg.start) || 0;
    const end = Number(seg.end) || 0;
    out[name] = {
      start,
      end,
      loop: !!seg.loop,
      duration: Math.max(0, end - start),
    };
  }
  return out;
}

/** Ensure we load and memoize the sprite JSON once */
async function ensureSpriteLoaded() {
  if (SPRITEMAP) return SPRITEMAP;
  if (!spriteLoadPromise) {
    spriteLoadPromise = fetch(SPRITE_JSON_URL)
      .then((r) => r.json())
      .then((j) => (SPRITEMAP = buildMap(j)))
      .catch((e) => {
        console.error("Failed to load", SPRITE_JSON_URL, e);
        SPRITEMAP = {};
        return SPRITEMAP;
      });
  }
  return spriteLoadPromise;
}

// ================= singleton manager =================
let singleton = null;

function createManager() {
  // ---- MUSIC channel (single audio element) ----
  const music = new Audio(SPRITE_URL);
  music.preload = "auto";
  music.loop = false; // we loop segment manually to avoid boundary pops

  let musicTrack = null; // 'ambience' | 'basic_background' | null
  let musicShouldLoop = false;
  let musicMuted = false;
  let musicVolume = 0.1;

  const LOOP_MARGIN = 0.035; // safety margin to avoid decoder edge pops
  let rafId = 0; // ensure only one loop supervisor runs

  function cancelLoopRAF() {
    if (rafId) {
      cancelAnimationFrame(rafId);
      rafId = 0;
    }
  }

  function tickMusicLoop() {
    if (!musicTrack || !musicShouldLoop) {
      cancelLoopRAF();
      return;
    }
    const seg = SPRITEMAP[musicTrack];
    if (!seg) {
      cancelLoopRAF();
      return;
    }
    if (music.currentTime >= seg.end - LOOP_MARGIN) {
      try {
        music.currentTime = seg.start + 0.01;
      } catch {
        /* noop */
      }
    }
    rafId = requestAnimationFrame(tickMusicLoop);
  }

  async function playMusic(name) {
    await ensureSpriteLoaded();
    const seg = SPRITEMAP?.[name];
    if (!seg) return;

    musicTrack = name;
    musicShouldLoop = seg.loop || BG_NAMES.has(name);

    music.muted = musicMuted;
    music.volume = musicMuted ? 0 : musicVolume;

    try {
      // Nudge autoplay readiness on first interaction-sensitive browsers
      if (music.readyState < 1 && music.paused) {
        try {
          await music.play();
          music.pause();
        } catch {
          /* user gesture required; we'll try play below */
        }
      }
      music.currentTime = (seg.start ?? 0) + 0.01;
    } catch {
      /* seek might fail until metadata is ready */
    }

    // (re)start playback
    if (music.paused) {
      try {
        await music.play();
      } catch {
        // will succeed after first user gesture
      }
    }

    // start/refresh loop supervisor
    cancelLoopRAF();
    if (musicShouldLoop) rafId = requestAnimationFrame(tickMusicLoop);
  }

  function stopMusic() {
    musicShouldLoop = false;
    musicTrack = null;
    cancelLoopRAF();
    try {
      music.pause();
    } catch {
      /* noop */
    }
  }

  function setMusicMuted(next) {
    musicMuted = !!next;
    music.muted = musicMuted;
    music.volume = musicMuted ? 0 : musicVolume;
  }
  function setMusicVolume(v) {
    const vol = Math.max(0, Math.min(1, Number(v) || 0));
    musicVolume = vol;
    if (!musicMuted) music.volume = vol;
  }
  const getMusicMuted = () => musicMuted;
  const getMusicVolume = () => musicVolume;
  const getCurrentMusic = () => musicTrack;

  // ---- SFX pool (independent from music) ----
  const MAX_SFX = 6;
  const sfxPool = [];
  let sfxMuted = false;
  let sfxVolume = 0.9;

  function makeSfx() {
    const a = new Audio(SPRITE_URL);
    a.preload = "auto";
    a.loop = false;
    a.muted = sfxMuted;
    a.volume = sfxMuted ? 0 : sfxVolume;
    return { el: a, busy: false, stopAt: 0 };
  }
  for (let i = 0; i < 4; i++) sfxPool.push(makeSfx());

  function getFreeSfx() {
    const free = sfxPool.find((s) => !s.busy);
    if (free) return free;
    if (sfxPool.length < MAX_SFX) {
      const s = makeSfx();
      sfxPool.push(s);
      return s;
    }
    // steal the first
    return sfxPool[0];
  }

  async function playSfx(name) {
    await ensureSpriteLoaded();
    const seg = SPRITEMAP?.[name];
    if (!seg) return;

    const ch = getFreeSfx();
    ch.busy = true;
    ch.el.muted = sfxMuted;
    ch.el.volume = sfxMuted ? 0 : sfxVolume;

    try {
      if (ch.el.readyState < 1 && ch.el.paused) {
        try {
          await ch.el.play();
          ch.el.pause();
        } catch {
          /* user gesture required */
        }
      }

      ch.el.currentTime = (seg.start ?? 0) + 0.005;
      await ch.el.play();

      const stopDelay = Math.max(0, Math.floor(seg.duration * 1000) - 2);
      const ts = performance.now() + stopDelay;
      ch.stopAt = ts;

      setTimeout(() => {
        if (ch.stopAt !== ts) return; // stolen/reused
        try {
          ch.el.pause();
        } catch {
          /* noop */
        }
        ch.busy = false;
      }, stopDelay);
    } catch {
      ch.busy = false;
    }
  }

  function setSfxMuted(next) {
    sfxMuted = !!next;
    sfxPool.forEach((s) => {
      s.el.muted = sfxMuted;
      s.el.volume = sfxMuted ? 0 : sfxVolume;
    });
  }
  function setSfxVolume(v) {
    const vol = Math.max(0, Math.min(1, Number(v) || 0));
    sfxVolume = vol;
    sfxPool.forEach((s) => {
      if (!sfxMuted) s.el.volume = vol;
    });
  }
  const getSfxMuted = () => sfxMuted;
  const getSfxVolume = () => sfxVolume;

  // ---- unlock: call once after first user gesture ----
  let unlocked = false;
  async function unlockAndMaybeStart(bgName = "basic_background") {
    if (unlocked) return;
    unlocked = true;
    await ensureSpriteLoaded();
    await playMusic(bgName);
  }

  // ---- friendly generic API ----
  async function play(name) {
    await ensureSpriteLoaded();
    if (BG_NAMES.has(name) || SPRITEMAP?.[name]?.loop) return playMusic(name);
    return playSfx(name);
  }

  return {
    // music
    playMusic,
    stopMusic,
    setMusicMuted,
    getMusicMuted,
    setMusicVolume,
    getMusicVolume,
    getCurrentMusic,

    // sfx
    playSfx,
    setSfxMuted,
    getSfxMuted,
    setSfxVolume,
    getSfxVolume,

    // general
    play,
    unlockAndMaybeStart,
  };
}

export default function useAudio() {
  // Create the singleton lazily in the browser only
  if (typeof window !== "undefined" && !singleton) {
    singleton = createManager();
    // Warm the JSON map
    ensureSpriteLoaded();
  }
  const mgr = singleton;

  // Stable facade: returns no-throw wrappers (safe if mgr not ready yet)
  return useMemo(
    () => ({
      // music
      playMusic: (n) => mgr && mgr.playMusic(n),
      stopMusic: () => mgr && mgr.stopMusic(),
      setMusicMuted: (b) => mgr && mgr.setMusicMuted(b),
      isMusicMuted: () => (mgr ? mgr.getMusicMuted() : false),
      setMusicVolume: (v) => mgr && mgr.setMusicVolume(v),
      getMusicVolume: () => (mgr ? mgr.getMusicVolume() : 0.7),
      getCurrentMusic: () => (mgr ? mgr.getCurrentMusic() : null),

      // sfx
      playSfx: (n) => mgr && mgr.playSfx(n),
      setSfxMuted: (b) => mgr && mgr.setSfxMuted(b),
      isSfxMuted: () => (mgr ? mgr.getSfxMuted() : false),
      setSfxVolume: (v) => mgr && mgr.setSfxVolume(v),
      getSfxVolume: () => (mgr ? mgr.getSfxVolume() : 0.9),

      // general
      play: (n) => mgr && mgr.play(n),
      unlock: (bgName) => mgr && mgr.unlockAndMaybeStart(bgName),
    }),
    [mgr]
  );
}
