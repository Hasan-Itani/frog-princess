"use client";
import Image from "next/image";
import { motion } from "framer-motion";

export default function FrogSprite({
  phase = "idle",     // "idle" | "jump" | "curl"
  size = 56,
  facingDeg = 0,      // world-facing in CSS degrees
}) {
  const spriteSrc =
    phase === "jump" ? "/frog_legs.png" :
    phase === "curl" ? "/frog_curl.png" :
    "/frog.png";

  const variants = {
    idle: {
      y: 0,
      scale: 1,
      rotate: facingDeg,
      transition: { type: "tween", duration: 0.18, ease: [0.22, 0.61, 0.36, 1] },
    },
    jump: {
      y:     [0, 2, -12, -16, -10, -3, 0],
      scale: [1, 0.96, 1.02, 1.04, 1.01, 1, 1],
      rotate: facingDeg, // lock facing during jump
      transition: {
        duration: 0.34,
        times: [0, .08, .22, .46, .68, .86, 1],
        ease: "easeInOut",
      },
    },
    curl: {
      y: [0, -6, 0],
      scale: [1, 0.98, 1],
      rotate: facingDeg,
      transition: { duration: 0.22, ease: [0.22, 0.61, 0.36, 1] },
    },
  };

  return (
    <motion.div
      className="pointer-events-none absolute left-1/2 top-1/2 will-change-transform"
      style={{ width: size, height: size, transform: "translate(-50%,-50%)" }}
    >
      <motion.div
        variants={variants}
        animate={phase}
        initial={false}
        className="w-full h-full grid place-items-center"
      >
        <Image
          src={spriteSrc}
          alt="Frog"
          width={80}
          height={80}
          className="select-none pointer-events-none"
          draggable={false}
        />
      </motion.div>
    </motion.div>
  );
}
