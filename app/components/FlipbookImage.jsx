"use client";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";

/**
 * FlipbookImage
 * Plays a frame-by-frame image sequence once on mount (or when `playKey` changes).
 *
 * kind: "tile" | "lilly" | "gold" | "waterpop"
 * count: tile=10, lilly/gold=11, waterpop=11 (usually)
 * direction: "forward" | "backward"
 */
export default function FlipbookImage({
  kind = "tile",
  count,
  size,
  fps = 18,
  direction = "backward",
  delay = 0,
  playKey,
  className = "",
  style,
  alt = "",
}) {
  const [frame, setFrame] = useState(direction === "backward" ? count : 1);
  const [variant, setVariant] = useState(0); // used for gold/waterpop fallbacks
  const timerRef = useRef(null);

  const src = (() => {
    const n = Math.max(1, Math.min(count, frame));
    if (kind === "tile") return `/tile_${n}.png`;
    if (kind === "lilly") return `/lilly_${n}.png`;
    if (kind === "gold") {
      const bases = [
        (i) => `/gold_lilly_${i}.png`,
      ];
      return bases[Math.min(variant, bases.length - 1)](n);
    }
    // waterpop fallbacks
    const bases = [
      (i) => `/water-pop${i}.png`,
    ];
    return bases[Math.min(variant, bases.length - 1)](n);
  })();

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setVariant(0);
    setFrame(direction === "backward" ? count : 1);

    let cancelled = false;
    const start = () => {
      if (cancelled) return;
      const stepMs = 1000 / fps;
      const step = () => {
        if (cancelled) return;
        setFrame((f) => {
          const doneFwd = f >= count && direction === "forward";
          const doneBack = f <= 1 && direction === "backward";
          if (doneFwd || doneBack) return f;
          return direction === "forward" ? f + 1 : f - 1;
        });
        timerRef.current = setTimeout(step, stepMs);
      };
      timerRef.current = setTimeout(step, stepMs);
    };

    if (delay > 0) timerRef.current = setTimeout(start, delay * 1000);
    else start();

    return () => {
      cancelled = true;
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [playKey, direction, count, fps, delay]);

  return (
    <div className={className} style={style}>
      <Image
        src={src}
        alt={alt}
        width={size}
        height={size}
        className="pointer-events-none select-none"
        draggable={false}
        onError={() => {
          if (kind === "gold" || kind === "waterpop") {
            setVariant((v) => v + 1);
          }
        }}
      />
    </div>
  );
}
