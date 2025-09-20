"use client";
import Image from "next/image";
import { useState } from "react";

/** Fallback gold lily that cycles a list of candidate srcs on error. */
export default function GoldStatic({ size = 58, className = "" }) {
  const [srcs, setSrcs] = useState([
    "/gold_lilly.png",
    "/gold_lily.png",
    "/gold_lilly_1.png",
    "/gold_lily_1.png",
  ]);
  const src = srcs[0] ?? "/lilly_1.png";
  return (
    <Image
      src={src}
      alt=""
      width={size}
      height={size}
      className={`pointer-events-none ${className}`}
      onError={() => setSrcs((arr) => (arr.length > 1 ? arr.slice(1) : arr))}
    />
  );
}
