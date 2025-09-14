const audioStore = new Map();
let globalMuted = false;
let globalVolume = 1; // 💡 глобальная громкость

function ensureAudio(name) {
  if (!audioStore.has(name)) {
    const audio = new Audio(`/sounds/${name}.mp3`);
    audioStore.set(name, audio);
  }
  return audioStore.get(name);
}

export function setMuted(muted) {
  globalMuted = muted;
  audioStore.forEach((audio) => {
    audio.muted = muted;
    audio.volume = muted ? 0 : globalVolume;
  });
}

export function setVolume(volume) {
  globalVolume = Math.min(1, Math.max(0, volume)); // clamp 0..1
  if (!globalMuted) {
    audioStore.forEach((audio) => {
      audio.volume = globalVolume;
    });
  }
}

export function play(name, { loop = false, clone = false } = {}) {
  let audio;
  if (clone) {
    audio = new Audio(`/sounds/${name}.mp3`);
  } else {
    audio = ensureAudio(name);
    audio.currentTime = 0;
    audio.loop = loop;
  }

  audio.muted = globalMuted;
  audio.volume = globalMuted ? 0 : globalVolume;

  audio.play().catch((err) =>
    console.error(`Audio play error for "${name}":`, err)
  );

  return audio;
}

export function stopAll() {
  audioStore.forEach((audio) => {
    audio.pause();
    audio.currentTime = 0;
  });
}
