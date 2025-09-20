"use client";

import { useEffect, useMemo, useRef, useState } from "react";

/**
 * SakuraFall
 * Lightweight particle system that periodically spawns animated sakura petals,
 * each animated with independent CSS keyframes (fall, drift, sway, flutter).
 *
 * Notes:
 * - We batch "add + prune" into a single setState to reduce extra renders.
 * - Respects prefers-reduced-motion (no spawn if user requests reduced motion).
 * - Uses CSS variables per-petal so animations stay on the compositor.
 */

// Tunables (seconds / pixels / viewport units)
const SPAWN_INTERVAL_MS = 1200;
const PETAL_LIFETIME_MS = 20000; // safety prune window
const MAX_ONSCREEN_EST = 24; // soft cap to avoid overly dense scenes

export default function SakuraFall() {
  const [petals, setPetals] = useState([]);
  const idRef = useRef(0);
  const mediaReduced = useMemo(
    () =>
      typeof window !== "undefined"
        ? window.matchMedia?.("(prefers-reduced-motion: reduce)")
        : null,
    []
  );

  useEffect(() => {
    // If user prefers reduced motion, don't animate/spawn.
    if (mediaReduced?.matches) return;

    const makePetal = () => {
      const id = ++idRef.current;

      // Timing
      const duration = 7 + Math.random() * 6; // 7..13s fall
      const delay = Math.random() * 1.5; // 0..1.5s start delay

      // Vertical travel
      const spawnVh = 8 + Math.random() * 10; // start above viewport
      const fallOnScreenVh = 50; // visible travel
      const fadeFracOnScreen = 0.45 + Math.random() * 0.1;
      const totalVh = spawnVh + fallOnScreenVh;
      const fadeAbs =
        delay +
        duration * ((spawnVh + fadeFracOnScreen * fallOnScreenVh) / totalVh);

      // Horizontal wind & drift
      const sway = 40 + Math.random() * 60; // px
      const swayDur = 2.4 + Math.random() * 2.6;
      const driftX = (Math.random() < 0.5 ? -1 : 1) * (12 + Math.random() * 28); // vw
      const driftDur = duration * (0.9 + Math.random() * 0.2);

      // Flutter/tilt
      const tiltDeg = 15 + Math.random() * 20;
      const tiltDur = 1.1 + Math.random() * 1.6;

      return {
        id,
        bornAt: performance.now(),
        left: Math.random() * 100, // 0..100%
        size: 20 + Math.random() * 20, // 20..40px
        // timing
        duration,
        delay,
        fadeAbs,
        spawnVh,
        fallOnScreenVh,
        // wind
        sway,
        swayDur,
        driftX,
        driftDur,
        // flutter
        tiltDeg,
        tiltDur,
        // directions
        swayReverse: Math.random() < 0.5,
        tiltReverse: Math.random() < 0.5,
      };
    };

    const tick = () => {
      setPetals((prev) => {
        const now = performance.now();
        // prune in the same update
        const pruned = prev.filter((p) => now - p.bornAt < PETAL_LIFETIME_MS);
        // soft cap density
        if (pruned.length >= MAX_ONSCREEN_EST) return pruned;
        return [...pruned, makePetal()];
      });
    };

    // kick one immediately so we see something on mount
    tick();
    const interval = setInterval(tick, SPAWN_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [mediaReduced]);

  return (
    <div
      className="absolute inset-0 pointer-events-none overflow-hidden z-40"
      aria-hidden
    >
      {petals.map((p) => (
        <span
          key={p.id}
          className="petal"
          style={{
            left: `${p.left}%`,
            width: `${p.size}px`,
            height: `${p.size}px`,
            // CSS custom props feed keyframes; keep these as strings
            ["--dur"]: `${p.duration}s`,
            ["--delay"]: `${p.delay}s`,
            ["--fadeAbs"]: `${p.fadeAbs}s`,
            ["--spawn"]: `${p.spawnVh}vh`,
            ["--fall"]: `${p.fallOnScreenVh}vh`,
          }}
        >
          <span
            className="drift"
            style={{
              ["--driftX"]: `${p.driftX}vw`,
              ["--driftDur"]: `${p.driftDur}s`,
              animationDelay: `var(--delay)`,
            }}
          >
            <span
              className="sway"
              style={{
                ["--sway"]: `${p.sway}px`,
                ["--swayDur"]: `${p.swayDur}s`,
                animationDirection: p.swayReverse
                  ? "alternate-reverse"
                  : "alternate",
                animationDelay: `var(--delay)`,
              }}
            >
              <img
                src="/sakura.png"
                alt=""
                className="flutter"
                decoding="async"
                loading="lazy"
                style={{
                  ["--tiltDeg"]: `${p.tiltDeg}deg`,
                  ["--tiltDur"]: `${p.tiltDur}s`,
                  animationDirection: p.tiltReverse
                    ? "alternate-reverse"
                    : "alternate",
                }}
              />
            </span>
          </span>
        </span>
      ))}

      <style jsx global>{`
        /* Fall from above (−spawn) to +fall (50vh total on-screen travel). */
        @keyframes fall {
          0% {
            transform: translate3d(0, calc(var(--spawn) * -1), 0);
          }
          100% {
            transform: translate3d(0, var(--fall), 0);
          }
        }

        @keyframes fadeOut {
          from {
            opacity: 1;
          }
          to {
            opacity: 0;
          }
        }

        @keyframes driftX {
          0% {
            transform: translate3d(0, 0, 0);
          }
          100% {
            transform: translate3d(var(--driftX), 0, 0);
          }
        }

        @keyframes sway {
          from {
            transform: translate3d(calc(var(--sway) * -1), 0, 0);
          }
          to {
            transform: translate3d(var(--sway), 0, 0);
          }
        }

        @keyframes flutter {
          from {
            transform: rotate(calc(var(--tiltDeg) * -1));
          }
          to {
            transform: rotate(var(--tiltDeg));
          }
        }

        .petal {
          position: absolute;
          top: 0;
          opacity: 1;
          overflow: visible;
          animation: fall var(--dur) cubic-bezier(0.25, 0.1, 0.15, 1)
              var(--delay) both,
            fadeOut 2.2s linear var(--fadeAbs) both;
          will-change: transform, opacity;
        }

        .drift {
          display: inline-block;
          animation: driftX var(--driftDur) ease-in-out var(--delay) both;
          will-change: transform;
        }

        .sway {
          display: inline-block;
          animation-name: sway;
          animation-duration: var(--swayDur);
          animation-timing-function: ease-in-out;
          animation-iteration-count: infinite;
          will-change: transform;
        }

        .flutter {
          display: block;
          width: 100%;
          height: 100%;
          object-fit: contain;
          opacity: 0.95;
          animation-name: flutter;
          animation-duration: var(--tiltDur);
          animation-timing-function: ease-in-out;
          animation-iteration-count: infinite;
          will-change: transform;
        }
      `}</style>
    </div>
  );
}
