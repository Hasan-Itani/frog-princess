"use client";
import { motion } from "framer-motion";

export default function RowMotion({ children }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -18 }}
      animate={{
        opacity: 1,
        y: 0,
        transition: {
          opacity: { duration: 0.18 },
          layout: { duration: 0.28, ease: [0.2, 0.8, 0.2, 1] },
        },
      }}
      // fade the leaving row, don't push it down—let layout move everyone together
      exit={{ opacity: 0, scale: 0.98, transition: { duration: 0.18 } }}
    >
      {children}
    </motion.div>
  );
}
