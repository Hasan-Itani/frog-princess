"use client";
import { useEffect, useState } from "react";
import { useMotionValue, animate } from "framer-motion";

/**
 * Plays a one-time vertical sweep of all rows (x1500 → x1.2) inside the given viewport.
 * Calls onEnd() when done.
 */
export default function useIntroSweep(rowsViewportRef, contentHeight, { duration = 0.75 } = {}, onEnd) {
  const [introActive, setIntroActive] = useState(true);
  const introY = useMotionValue(0);

  useEffect(() => {
    const viewportEl = rowsViewportRef.current;
    if (!viewportEl) return;

    const viewportH = viewportEl.getBoundingClientRect().height;
    const travel = Math.max(0, contentHeight - viewportH);

    introY.set(0);
    const controls = animate(introY, -travel, {
      duration,
      ease: [0.22, 1, 0.36, 1],
    });

    const done = () => {
      setIntroActive(false);
      if (onEnd) onEnd();
    };

    controls.then(done).catch(done);
    return () => controls.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { introActive, introY };
}
