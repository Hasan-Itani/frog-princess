"use client";
import { createContext, useContext, useMemo, useState } from "react";

const DebugContext = createContext(null);

export function DebugProvider({ children }) {
  const [showDrops, setShowDrops] = useState(false);

  const value = useMemo(
    () => ({
      showDrops, // when true, reveal all drops/traps visually
      setShowDrops,
      toggleDrops: () => setShowDrops((v) => !v),
    }),
    [showDrops]
  );

  return (
    <DebugContext.Provider value={value}>{children}</DebugContext.Provider>
  );
}

export function useDebug() {
  const ctx = useContext(DebugContext);
  if (!ctx) throw new Error("useDebug must be used inside <DebugProvider>");
  return ctx;
}
