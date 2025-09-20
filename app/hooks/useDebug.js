"use client";

import { createContext, useContext, useMemo, useState } from "react";

const DebugContext = createContext(null);

/**
 * DebugProvider
 *
 * Simple context for development/debugging flags.
 * Currently supports toggling "showDrops" to reveal all hidden traps.
 */
export function DebugProvider({ children }) {
  const [showDrops, setShowDrops] = useState(false);

  // Memoize context value so consumers don't re-render unnecessarily
  const value = useMemo(
    () => ({
      showDrops, // boolean: when true, all drops/traps are visible
      setShowDrops,
      toggleDrops: () => setShowDrops((prev) => !prev),
    }),
    [showDrops]
  );

  return (
    <DebugContext.Provider value={value}>{children}</DebugContext.Provider>
  );
}

/**
 * Hook to consume the debug context.
 * Must be called inside <DebugProvider>.
 */
export function useDebug() {
  const ctx = useContext(DebugContext);
  if (!ctx) throw new Error("useDebug must be used inside <DebugProvider>");
  return ctx;
}
