"use client";

import { useEffect, useRef, useState, useMemo, useCallback } from "react";

/**
 * CollectButton
 *
 * Props:
 * - show: boolean — controls visibility (mounts/unmounts with a short in/out animation)
 * - amount: number | string — current win to display
 * - format: (n) => string — optional formatter for the amount
 * - label: string — primary label text (default: "COLLECT")
 * - onCollect: () => void — called once when user clicks/taps
 * - playSound: (name?: string) => void — optional sfx callback
 * - soundName: string — which sfx to play on click (default "frog_4")
 * - className: string — extra classes for the wrapper
 */
export default function CollectButton({
  show,
  amount,
  format,
  label = "COLLECT",
  onCollect,
  playSound,
  soundName = "frog_4",
  className = "",
}) {
  // Visual state machine: "hidden" ➜ "in" ➜ "idle" ➜ "out"
  const [phase, setPhase] = useState("hidden"); // "hidden" | "in" | "idle" | "out"
  const [mounted, setMounted] = useState(false); // actually in the DOM
  const clickLockedRef = useRef(false); // guards re-entrancy
  const tRefs = useRef([]); // collect timers to clear on unmount/changes

  // Format amount once per render
  const amountText = useMemo(() => {
    if (typeof format === "function") return format(amount);
    return String(amount ?? "");
  }, [amount, format]);

  // Helper to schedule and auto-track a timeout
  const later = useCallback((fn, ms) => {
    const id = setTimeout(fn, ms);
    tRefs.current.push(id);
    return id;
  }, []);

  // Clear all pending timers
  const clearAllTimers = useCallback(() => {
    tRefs.current.forEach(clearTimeout);
    tRefs.current = [];
  }, []);

  // Drive mount/phase transitions based on `show`
  useEffect(() => {
    clearAllTimers();

    if (show) {
      // Mount immediately, then do a tiny "scale in" before settling to idle
      setMounted(true);
      setPhase("in");
      later(() => setPhase("idle"), 220);
      clickLockedRef.current = false;
    } else if (mounted) {
      // Play out animation then unmount
      setPhase("out");
      later(() => {
        setMounted(false);
        setPhase("hidden");
        clickLockedRef.current = false;
      }, 200);
    }

    return clearAllTimers;
  }, [show, mounted, later, clearAllTimers]);

  // Click handler (debounced via lock)
  const handleClick = useCallback(() => {
    if (clickLockedRef.current || phase === "out" || !mounted) return;
    clickLockedRef.current = true;

    // SFX first (non-blocking)
    if (typeof playSound === "function") playSound(soundName);

    // Kick out animation right away
    setPhase("out");
    // Let the parent handle state; we don't unmount here—effect will when `show` changes
    onCollect?.();
  }, [mounted, phase, onCollect, playSound, soundName]);

  if (!mounted) return null;

  const disabled = phase === "out" || clickLockedRef.current;

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled}
      className={[
        "relative select-none inline-block",
        disabled ? "pointer-events-none" : "cursor-pointer",
        // Enter scale pop (uses your global .animate-scaleUp if present)
        phase === "in"
          ? "animate-scaleUp"
          : "transition-transform transition-opacity duration-200 ease-out",
        phase === "out" ? "opacity-0 scale-90" : "opacity-100 scale-100",
        className,
      ].join(" ")}
      title="Collect your current winnings"
      aria-label={`${label} ${amountText}`}
      aria-live="polite"
      style={{ willChange: "transform, opacity" }}
    >
      {/* Decorative image background */}
      <img
        src="/green_button.png"
        alt=""
        className="w-56 h-16 object-contain drop-shadow-lg"
        aria-hidden="true"
        draggable={false}
      />

      {/* Text overlay */}
      <span className="absolute inset-0 flex flex-col items-center justify-center text-black font-extrabold">
        <span className="text-lg leading-tight">{label}</span>
        <span className="text-sm">{amountText}</span>
      </span>
    </button>
  );
}
