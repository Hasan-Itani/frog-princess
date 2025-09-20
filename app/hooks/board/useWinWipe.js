"use client";
import { useEffect, useState } from "react";

/** Increments a key whenever the win overlay appears to force wipe flipbooks. */
export default function useWinWipe(showWinOverlay) {
  const [winWipeKey, setWinWipeKey] = useState(0);
  useEffect(() => {
    if (showWinOverlay) setWinWipeKey((k) => k + 1);
  }, [showWinOverlay]);
  return winWipeKey;
}
