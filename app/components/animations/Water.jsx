"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import ripple1 from "/public/water2.png";
import ripple2 from "/public/water3.png";

/**
 * Ripple
 * A looping animated water ripple effect using two overlayed images.
 *
 * Props:
 * - size: diameter of the ripple (px)
 * - x, y: absolute positioning inside the parent container
 * - delay: staggered start delay for animation (seconds)
 * - opacity: base opacity multiplier
 */
function Ripple({ size = 120, x = 0, y = 0, delay = 0, opacity = 1 }) {
  return (
    <motion.div
      className="absolute"
      style={{ width: size, height: size, left: x, top: y }}
      animate={{
        scale: [1, 1.1, 1],
        rotate: [0, 2, -2, 0],
        opacity: [opacity, opacity * 0.6, opacity],
      }}
      transition={{
        duration: 2,
        delay,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    >
      {/* First ripple layer */}
      <motion.div
        className="absolute inset-0"
        animate={{ opacity: [1, 0, 1] }}
        transition={{ duration: 2, delay, repeat: Infinity, ease: "easeInOut" }}
      >
        <Image
          src={ripple1}
          alt="Ripple layer 1"
          fill
          priority
          className="object-contain invert opacity-70"
        />
      </motion.div>

      {/* Second ripple layer (slower pulse) */}
      <motion.div
        className="absolute inset-0"
        animate={{ opacity: [0, 1, 0] }}
        transition={{ duration: 8, delay, repeat: Infinity, ease: "easeInOut" }}
      >
        <Image
          src={ripple2}
          alt="Ripple layer 2"
          fill
          priority
          className="object-contain invert opacity-70"
        />
      </motion.div>
    </motion.div>
  );
}

/**
 * Water
 * Background water animation with multiple staggered ripple instances.
 */
export default function Water() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      <Ripple size={350} x={30} y={100} delay={0} opacity={1.2} />
      <Ripple size={300} x={60} y={350} delay={2} opacity={1.2} />
    </div>
  );
}
