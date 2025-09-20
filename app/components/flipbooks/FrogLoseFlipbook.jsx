"use client";
import { useEffect, useState } from "react";

/** Plays frog_lose_1..8 once then calls onDone(). */
export default function FrogLoseFlipbook({
  size = 70,
  facingDeg = 0,
  fps = 20,
  onDone,
}) {
  const [frame, setFrame] = useState(1); // 1..8
  useEffect(() => {
    let f = 1;
    const id = setInterval(() => {
      f += 1;
      if (f > 8) {
        clearInterval(id);
        onDone?.();
      } else {
        setFrame(f);
      }
    }, Math.max(16, 1000 / fps));
    return () => clearInterval(id);
  }, [fps, onDone]);

  return (
    <div
      className="w-full h-full grid place-items-center"
      style={{ rotate: `${facingDeg}deg` }}
    >
      <img
        src={`/frog_lose_${frame}.png`}
        alt=""
        width={size}
        height={size}
        className="select-none pointer-events-none block"
        draggable={false}
      />
    </div>
  );
}
