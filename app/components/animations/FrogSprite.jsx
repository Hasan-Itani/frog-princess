"use client";
import Image from "next/image";
import { motion } from "framer-motion";

/**
 * phase: "idle" | "jump" | "curl"
 * size: square px
 * facingDeg: CSS degrees
 */
export default function FrogSprite({ phase = "idle", size = 70, facingDeg = 0 }) {
  const spriteSrc =
    phase === "jump" ? "/frog_legs.png"
    : phase === "curl" ? "/frog_curl.png"
    : "/frog.png";

  const variants = {
    idle: { scale: 1, y: 0, rotate: 0, transition: { duration: 0.12 } },
    jump: { scale: 0.96, y: -6, rotate: 0, transition: { duration: 0.34, ease: "easeOut" } },
    curl: { scale: 0.92, y: 2, rotate: -6, transition: { duration: 0.18, ease: "easeInOut" } },
  };

  return (
    <div
      className="pointer-events-none absolute left-1/2 top-1/2"
      style={{ width: size, height: size, transform: "translate(-50%, -50%)" }}
      aria-hidden="true"
    >
      <div className="w-full h-full grid place-items-center" style={{ rotate: `${facingDeg}deg` }}>
        <motion.div
          animate={phase}
          variants={variants}
          initial={false}
          className="w-full h-full grid place-items-center"
        >
          <Image
            src={spriteSrc}
            alt=""                 // ← empty alt prevents any fallback text
            role="presentation"    // ← presentational (decorative)
            aria-hidden="true"     // ← keep it out of the a11y tree
            width={Math.max(64, size)}
            height={Math.max(64, size)}
            draggable={false}
            className="select-none pointer-events-none block"
            priority
          />
        </motion.div>
      </div>
    </div>
  );
}
