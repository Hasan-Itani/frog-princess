"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import ripple1 from "/public/water2.png";
import ripple2 from "/public/water3.png";

function Ripple({ size = 120, x = 0, y = 0, delay = 0, opacity = 1 }) {
  return (
    <motion.div
      className="absolute"
      style={{
        width: size,
        height: size,
        left: x,
        top: y,
      }}
      animate={{
        scale: [1, 1.1, 1],
        rotate: [0, 2, -2, 0],
        opacity: [1.5, opacity * 0.8, 1.5],
      }}
      transition={{
        duration: 2,
        delay,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    >
      <motion.div
        className="absolute inset-0"
        animate={{ opacity: [1, 0, 1] }}
        transition={{
          duration: 2,
          delay,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        <Image
          src={ripple1}
          alt="Ripple 1"
          fill
          className="object-contain invert opacity-70"
        />
      </motion.div>

      <motion.div
        className="absolute inset-0"
        animate={{ opacity: [0, 1, 0] }}
        transition={{
          duration: 8,
          delay,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        <Image
          src={ripple2}
          alt="Ripple 2"
          fill
          className="object-contain invert opacity-70"
        />
      </motion.div>
    </motion.div>
  );
}

export default function Water() {
  return (
    <div className="absolute inset-0 pointer-events-none">
      <Ripple size={350} x={30} y={100} delay={0} opacity={1.5} />
      <Ripple size={300} x={60} y={350} delay={2} opacity={1.5} />
    </div>
  );
}
