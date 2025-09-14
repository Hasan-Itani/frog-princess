"use client";
import { useEffect, useMemo, useState } from "react";
import { GameProvider, useGame } from "../hooks/useGame";
import useAudio from "../hooks/useAudio";

function categorize(name, meta) {
  if (meta?.loop) return "music";
  if (/ambience|background/i.test(name)) return "music";
  return "sfx";
}

function AudioList() {
  const [map, setMap] = useState({});
  const [filter, setFilter] = useState("");
  const [tab, setTab] = useState("all"); // all | music | sfx
  const game = useGame();
  const musicMuted = game?.musicMuted ?? game?.muted ?? false;
  const sfxMuted = game?.sfxMuted ?? game?.muted ?? false;
  const setMusicMuted = game?.setMusicMuted ?? game?.setMuted ?? (() => {});
  const setSfxMuted = game?.setSfxMuted ?? game?.setMuted ?? (() => {});
  const { play, stop } = useAudio();

  useEffect(() => {
    (async () => {
      const res = await fetch("/gameaudio.json");
      const json = await res.json();
      setMap(json?.spritemap || {});
    })();
  }, []);

  const list = useMemo(() => {
    const all = Object.entries(map)
      .map(([name, meta]) => ({ name, meta, kind: categorize(name, meta) }))
      .filter((it) => it.name.toLowerCase().includes(filter.toLowerCase()));
    if (tab === "music") return all.filter((it) => it.kind === "music");
    if (tab === "sfx") return all.filter((it) => it.kind === "sfx");
    return all;
  }, [map, filter, tab]);

  const musicNames = useMemo(
    () => Object.entries(map).filter(([n, m]) => categorize(n, m) === "music").map(([n]) => n),
    [map]
  );

  return (
    <div className="min-h-screen w-full bg-slate-900 text-slate-100 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-2xl font-extrabold">Audio Lab</h1>
          <div className="flex gap-2">
            <button
              onClick={() => setTab("all")}
              className={`px-3 py-2 rounded-lg border ${tab==="all"?"bg-slate-700":"bg-slate-800"} border-slate-600`}
            >All</button>
            <button
              onClick={() => setTab("music")}
              className={`px-3 py-2 rounded-lg border ${tab==="music"?"bg-slate-700":"bg-slate-800"} border-slate-600`}
            >Music</button>
            <button
              onClick={() => setTab("sfx")}
              className={`px-3 py-2 rounded-lg border ${tab==="sfx"?"bg-slate-700":"bg-slate-800"} border-slate-600`}
            >SFX</button>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <input
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Filter by name (e.g. frog, lily, win...)"
            className="flex-1 px-3 py-2 rounded-lg bg-slate-800 border border-slate-600 outline-none"
          />
          <button
            onClick={() => (!sfxMuted ? play("button") : null)}
            className="px-3 py-2 rounded-lg font-bold bg-slate-800 border border-slate-600 hover:bg-slate-700"
          >
            Click SFX
          </button>
          <button
            onClick={() => musicNames.forEach((n) => stop(n))}
            className="px-3 py-2 rounded-lg font-bold bg-slate-800 border border-slate-600 hover:bg-slate-700"
          >
            Stop Music
          </button>
        </div>

        {/* Channel toggles */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              if (sfxMuted) {
                setSfxMuted(false);
                setTimeout(() => play("button"), 10);
              } else {
                play("button");
                setSfxMuted(true);
              }
            }}
            className={`px-3 py-2 rounded-lg border ${sfxMuted?"bg-slate-800":"bg-slate-700"} border-slate-600`}
          >
            SFX: {sfxMuted ? "Muted" : "On"}
          </button>
          <button
            onClick={() => {
              !sfxMuted && play("button");
              if (game?.musicMuted ?? false) {
                setMusicMuted(false);
                const first = musicNames[0];
                if (first) play(first);
              } else {
                setMusicMuted(true);
                musicNames.forEach((n) => stop(n));
              }
            }}
            className={`px-3 py-2 rounded-lg border ${(game?.musicMuted??false)?"bg-slate-800":"bg-slate-700"} border-slate-600`}
          >
            Music: {(game?.musicMuted ?? false) ? "Muted" : "On"}
          </button>
        </div>

        <div className="text-sm opacity-80">
          Showing {list.length} / {Object.keys(map).length} sprites
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {list.map(({ name, meta, kind }) => (
            <div
              key={name}
              className="p-3 rounded-xl bg-slate-800/70 border border-slate-700 flex items-center justify-between"
            >
              <div className="min-w-0">
                <div className="font-bold truncate">{name}</div>
                <div className="text-xs opacity-80">
                  {kind} • {meta?.loop ? "loop" : "one-shot"} • {meta?.start}s → {meta?.end}s
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => {
                    if (kind === "music") {
                      if (!(game?.musicMuted ?? false)) play(name);
                    } else {
                      if (!sfxMuted) play(name);
                    }
                  }}
                  className="px-2 py-1 rounded-md bg-slate-700 hover:bg-slate-600 text-sm font-semibold"
                >
                  Play
                </button>
                <button
                  onClick={() => stop(name)}
                  className="px-2 py-1 rounded-md bg-slate-700 hover:bg-slate-600 text-sm font-semibold"
                >
                  Stop
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="opacity-70 text-xs">
          Sprites are read from <code>/gameaudio.json</code>. Ensure your audio mp3 is at
          <code className="ml-1">/sounds/mp3/gameaudio.mp3</code> (or update your hook’s <code>SPRITE_URL</code>).
        </div>
      </div>
    </div>
  );
}

export default function AudioLabPage() {
  return (
    <GameProvider>
      <AudioList />
    </GameProvider>
  );
}
