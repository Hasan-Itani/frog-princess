"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { useMemo } from "react";
import PropTypes from "prop-types";

/** Reused animation variants (not re-created per render) */
const FROG_VARIANTS = {
  idle: {
    scale: 1,
    y: 0,
    rotate: 0,
    transition: { duration: 0.12 },
  },
  jump: {
    scale: 0.96,
    y: -6,
    rotate: 0,
    transition: { duration: 0.34, ease: "easeOut" },
  },
  curl: {
    scale: 0.92,
    y: 2,
    rotate: -6,
    transition: { duration: 0.18, ease: "easeInOut" },
  },
};

/**
 * FrogSprite
 * phase: "idle" | "jump" | "curl"
 * size: square px
 * facingDeg: CSS degrees
 * asOverlay: when true, positions absolutely centered (for overlay frogs)
 */
export default function FrogSprite({
  phase = "idle",
  size = 70,
  facingDeg = 0,
  asOverlay = true,
  className = "",
  priority = false,
}) {
  const clamped = Math.max(32, size);

  const spriteSrc = useMemo(() => {
    switch (phase) {
      case "jump":
        return "/frog_legs.png";
      case "curl":
        return "/frog_curl.png";
      case "idle":
      default:
        return "/frog.png";
    }
  }, [phase]);

  return (
    <div
      className={[
        "pointer-events-none",
        asOverlay ? "absolute left-1/2 top-1/2" : "",
        className,
      ].join(" ")}
      style={{
        width: clamped,
        height: clamped,
        ...(asOverlay ? { transform: "translate(-50%, -50%)" } : null),
      }}
      aria-hidden="true"
    >
      <div
        className="w-full h-full grid place-items-center"
        style={{ rotate: `${facingDeg}deg` }}
      >
        <motion.div
          animate={phase}
          variants={FROG_VARIANTS}
          initial={false}
          className="w-full h-full grid place-items-center"
          style={{ willChange: "transform" }}
        >
          <Image
            src={spriteSrc}
            alt="" /* decorative */
            width={clamped}
            height={clamped}
            draggable={false}
            className="select-none pointer-events-none block"
            priority={priority}
          />
        </motion.div>
      </div>
    </div>
  );
}

FrogSprite.propTypes = {
  phase: PropTypes.oneOf(["idle", "jump", "curl"]),
  size: PropTypes.number,
  facingDeg: PropTypes.number,
  asOverlay: PropTypes.bool,
  className: PropTypes.string,
  priority: PropTypes.bool,
};
