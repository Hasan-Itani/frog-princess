"use client";

import { useEffect, useRef, useState } from "react";
import { useMotionValue, animate } from "framer-motion";

/**
 * useIntroSweep
 *
 * Plays a one-time vertical sweep of all rows inside the given viewport.
 * Moves from y=0 to y=−travel, where travel = max(0, contentHeight − viewportHeight).
 * Calls onEnd() when done.
 *
 * Params:
 *  - rowsViewportRef: React.RefObject<HTMLElement>
 *  - contentHeight: number                            // total scrollable content height (px)
 *  - options?: { duration?: number }                  // default 0.75s
 *  - onEnd?: () => void
 *
 * Returns:
 *  - introActive: boolean      // true while the intro sweep is running
 *  - introY: MotionValue<number>  // apply to the rows container (translateY)
 */
export default function useIntroSweep(
  rowsViewportRef,
  contentHeight,
  { duration = 0.75 } = {},
  onEnd
) {
  const [introActive, setIntroActive] = useState(true);
  const introY = useMotionValue(0);

  // token to ignore late resolves if effect re-runs for any reason
  const runTokenRef = useRef(0);

  useEffect(() => {
    // Run only while intro is active.
    if (!introActive) return;

    const viewportEl = rowsViewportRef?.current;
    if (!viewportEl) return; // nothing to animate yet

    const viewportH = viewportEl.getBoundingClientRect().height || 0;
    const travel = Math.max(0, (Number(contentHeight) || 0) - viewportH);

    // If there's nothing to scroll, complete immediately.
    if (travel === 0) {
      setIntroActive(false);
      if (typeof onEnd === "function") onEnd();
      return;
    }

    // Bump token & start from 0
    const myToken = ++runTokenRef.current;
    introY.set(0);

    const controls = animate(introY, -travel, {
      duration,
      ease: [0.22, 1, 0.36, 1],
    });

    const finalize = () => {
      if (runTokenRef.current !== myToken) return; // stale resolve
      setIntroActive(false);
      if (typeof onEnd === "function") onEnd();
    };

    controls.then(finalize).catch(finalize);

    // Cleanup: stop animation if deps change/unmount while running.
    return () => {
      controls?.stop?.();
    };
  }, [introActive, rowsViewportRef, contentHeight, duration, onEnd, introY]);

  return { introActive, introY };
}
