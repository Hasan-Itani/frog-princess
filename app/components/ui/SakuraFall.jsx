"use client";
import { useEffect, useState } from "react";
 
export default function SakuraFall() {
  const [petals, setPetals] = useState([]);
 
  useEffect(() => {
    const interval = setInterval(() => {
      const id = Date.now();
 
      const duration = 7 + Math.random() * 6;
      const delay = Math.random() * 1.5;
 
      const spawnVh = 8 + Math.random() * 10;
      const fallOnScreenVh = 50;
      const fadeFracOnScreen = 0.45 + Math.random() * 0.1;
      const totalVh = spawnVh + fallOnScreenVh;
      const fadeAbs =
        delay +
        duration * ((spawnVh + fadeFracOnScreen * fallOnScreenVh) / totalVh);
 
      // wind
      const sway = 40 + Math.random() * 60; // px
      const swayDur = 2.4 + Math.random() * 2.6; // s
      const driftX = (Math.random() < 0.5 ? -1 : 1) * (12 + Math.random() * 28); // vw
      const driftDur = duration * (0.9 + Math.random() * 0.2);
 
      // flutter
      const tiltDeg = 15 + Math.random() * 20;
      const tiltDur = 1.1 + Math.random() * 1.6;
 
      setPetals((prev) => [
        ...prev,
        {
          id,
          left: Math.random() * 100,
          size: 20 + Math.random() * 20,
          duration,
          delay,
          fadeAbs,
          spawnVh,
          fallOnScreenVh,
          sway,
          swayDur,
          driftX,
          driftDur,
          tiltDeg,
          tiltDur,
          swayReverse: Math.random() < 0.5,
          tiltReverse: Math.random() < 0.5,
        },
      ]);
 
      // cleanup
      setPetals((prev) => prev.filter((p) => Date.now() - p.id < 20000));
    }, 1200);
 
    return () => clearInterval(interval);
  }, []);
 
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-40">
      {petals.map((p) => (
        <span
          key={p.id}
          className="petal"
          style={{
            left: `${p.left}%`,
            width: `${p.size}px`,
            height: `${p.size}px`,
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
                alt="sakura"
                className="flutter"
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
            transform: translateY(calc(var(--spawn) * -1));
          }
          100% {
            transform: translateY(var(--fall));
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
            transform: translateX(0);
          }
          100% {
            transform: translateX(var(--driftX));
          }
        }
 
        @keyframes sway {
          from {
            transform: translateX(calc(var(--sway) * -1));
          }
          to {
            transform: translateX(var(--sway));
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
          /* 👇 Use 'both' so the first keyframe applies during the delay (off-screen) */
          animation: fall var(--dur) cubic-bezier(0.25, 0.1, 0.15, 1)
              var(--delay) both,
            fadeOut 2.2s linear var(--fadeAbs) both;
          will-change: transform, opacity;
        }
 
        .drift {
          display: inline-block;
          /* 👇 Also fill 'backwards' during delay so it’s stable */
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