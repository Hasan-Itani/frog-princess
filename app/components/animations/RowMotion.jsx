"use client";
import { motion } from "framer-motion";
import PropTypes from "prop-types";

/**
 * RowMotion
 * Smooth fade + slide animation for list rows or items.
 *
 * Props:
 * - as: semantic element (default "div")
 * - initialY: starting Y offset (default -18)
 * - fadeDuration: fade in/out duration (default 0.18s)
 * - layoutDuration: layout spring duration (default 0.28s)
 */
export default function RowMotion({
  as: As = motion.div,
  children,
  initialY = -18,
  fadeDuration = 0.18,
  layoutDuration = 0.28,
  ...rest
}) {
  return (
    <As
      layout
      initial={{ opacity: 0, y: initialY }}
      animate={{
        opacity: 1,
        y: 0,
        transition: {
          opacity: { duration: fadeDuration },
          layout: { duration: layoutDuration, ease: [0.2, 0.8, 0.2, 1] },
        },
      }}
      exit={{
        opacity: 0,
        scale: 0.98,
        transition: { duration: fadeDuration },
      }}
      style={{ willChange: "transform, opacity" }}
      {...rest}
    >
      {children}
    </As>
  );
}

RowMotion.propTypes = {
  as: PropTypes.elementType,
  children: PropTypes.node.isRequired,
  initialY: PropTypes.number,
  fadeDuration: PropTypes.number,
  layoutDuration: PropTypes.number,
};
