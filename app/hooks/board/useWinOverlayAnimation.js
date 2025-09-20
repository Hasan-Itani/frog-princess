"use client";
import { useEffect, useState } from "react";
import { useAnimationControls } from "framer-motion";
import useAudio from "../audio/useAudio";

/** Drives the win overlay animation & auto-dismiss lifecycle. */
export default function useWinOverlayAnimation(showWinOverlay) {
  const overlayCtrl = useAnimationControls();
  const [winDismissed, setWinDismissed] = useState(false);
  const { playSfx } = useAudio();

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!showWinOverlay) return;
      playSfx?.("popup_win");
      setWinDismissed(false);

      overlayCtrl.set({ scale: 1, opacity: 0 });
      await overlayCtrl.start({
        opacity: 1,
        transition: { duration: 0.18, ease: [0.22, 1, 0.36, 1] },
      });
      await overlayCtrl.start({
        scale: [1.0, 1.03, 1.0, 1.03, 1.0],
        transition: {
          duration: 3.0,
          ease: "easeInOut",
          times: [0, 0.25, 0.5, 0.75, 1],
        },
      });
      await overlayCtrl.start({
        opacity: 0,
        transition: { duration: 0.6, ease: "easeOut" },
      });

      if (mounted) setWinDismissed(true);
    })();
    return () => {
      mounted = false;
    };
  }, [showWinOverlay, overlayCtrl, playSfx]);

  return { overlayCtrl, winDismissed };
}
