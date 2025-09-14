"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

export default function Swipe({ active, routes = [], getTileCenter, onDone }) {
  const [routeIndex, setRouteIndex] = useState(0);
  const [step, setStep] = useState(0);
  const [trails, setTrails] = useState([]);

  useEffect(() => {
    if (!active) return;
    if (!routes || routes.length === 0) return;

    const route = routes[routeIndex % routes.length];
    if (!route) return;

    setStep(0);
    setTrails([]);

    const id = setInterval(() => {
      setStep((s) => {
        if (s < route.length - 1) {
          const prev = route[s];
          const next = route[s + 1];
          const prevCenter = getTileCenter(prev.row, prev.col);
          const nextCenter = getTileCenter(next.row, next.col);

          if (prevCenter && nextCenter) {
            setTrails((old) => [
              ...old,
              { from: prevCenter, to: nextCenter, key: `${routeIndex}-${s}` },
            ]);
          }

          return s + 1;
        }

        clearInterval(id);
        setTimeout(() => {
          setRouteIndex((i) => (i + 1) % routes.length);
          onDone?.();
        }, 1000);
        return s;
      });
    }, 1000);

    return () => clearInterval(id);
  }, [active, routeIndex, routes, onDone, getTileCenter]);

  if (!active) return null;

  const route = routes[routeIndex % routes.length] || [];
  const currentTile = route[step];
  const currentCenter = currentTile ? getTileCenter(currentTile.row, currentTile.col) : null;

  return (
    <>
      {/* затемнение на весь экран */}
      <div className="absolute bottom-[-200px] inset-0 bg-black/70 z-[20] pointer-events-none" />

      {/* подсветка тайлов маршрута */}
      {route.map((tile, idx) => {
        const center = getTileCenter(tile.row, tile.col);
        if (!center) return null;
        return (
          <motion.img
            key={idx}
            src="/tile.png"
            alt="tile"
            className="absolute z-[110] w-[60px] h-[60px] pointer-events-none"
            initial={{ scale: 0 }}
            animate={{ scale: 1, opacity: idx <= step ? 1 : 0.4 }}
            transition={{ duration: 0.3 }}
            style={{
              left: center.x - 30,
              top: center.y - 30,
            }}
          />
        );
      })}

      {/* курсор */}
      {currentCenter && (
        <motion.img
          src="/cursor.png"
          alt="cursor"
          className="absolute z-[120] w-8 h-8"
          animate={{
            x: currentCenter.x - 16,
            y: currentCenter.y - 16,
            opacity: 1,
          }}
          transition={{
            duration: 0.8,
            ease: "easeInOut",
          }}
        />
      )}
    </>
  );
}
