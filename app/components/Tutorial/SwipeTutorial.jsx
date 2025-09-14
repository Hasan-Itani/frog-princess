"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";

/**
 * props:
 * - show: boolean — показывать/нет
 * - routes: Array<Array<{row:number,col:number}>>
 * - getTileCenter: (row,col)=>{x:number,y:number}|undefined  – центр тайла в координатах GameBoard
 * - tileRadius: число (px) – радиус подсветки (обычно LILY_BTN/2)
 * - onAnyUserAction?: ()=>void – чтобы закрывать туториал при клике
 */
export default function SwipeTutorial({
  show,
  routes,
  getTileCenter,
  tileRadius = 48,
  onAnyUserAction,
}) {
  const [routeIdx, setRouteIdx] = useState(0);
  const [stepIdx, setStepIdx] = useState(0);

  // Собираем точки текущего маршрута (координаты центров тайлов)
  const points = useMemo(() => {
    const r = routes?.[routeIdx] || [];
    const pts = r
      .map(({ row, col }) => getTileCenter?.(row, col))
      .filter(Boolean);
    return pts;
  }, [routes, routeIdx, getTileCenter]);

  // Координаты руки
  const hand = points[stepIdx] || points[0];

  // Автопрогон шагов
  useEffect(() => {
    if (!show || points.length < 2) return;

    let stop = false;
    const run = async () => {
      // Проходим от 0 до последней точки
      for (let i = 1; i < points.length && !stop; i++) {
        setStepIdx(i);
        await new Promise((r) => setTimeout(r, 650)); // скорость свайпа
      }
      if (stop) return;
      await new Promise((r) => setTimeout(r, 800)); // пауза в конце
      // Следующий маршрут по кругу
      setRouteIdx((i) => (i + 1) % routes.length);
      setStepIdx(0);
    };
    run();
    return () => {
      stop = true;
    };
  }, [show, points.length, routes.length]);

  // Локальный обработчик пользовательского действия
  useEffect(() => {
    if (!show) return;
    const handler = () => onAnyUserAction?.();
    window.addEventListener("pointerdown", handler, { passive: true });
    window.addEventListener("keydown", handler);
    window.addEventListener("touchstart", handler, { passive: true });
    return () => {
      window.removeEventListener("pointerdown", handler);
      window.removeEventListener("keydown", handler);
      window.removeEventListener("touchstart", handler);
    };
  }, [show, onAnyUserAction]);

  if (!show) return null;

  return (
    <>
      {/* Затемнение под тайлами (останется над фоном, но под тайлами/лягушкой/контролами) */}
      <div className="absolute inset-0 bottom-[-200px] bg-black/55 z-[5] pointer-events-none" />

      {/* Подсветки тайлов маршрута */}
      <div className="absolute inset-0 z-[30] pointer-events-none">
        {points.map((p, i) => {
          if (!p) return null;
          const active = i <= stepIdx; // уже “пройдённые” и текущий
          return (
            <motion.div
              key={i}
              className="absolute rounded-full"
              initial={{ scale: 0.6, opacity: 0.0 }}
              animate={{
                left: p.x - tileRadius,
                top: p.y - tileRadius,
                width: tileRadius * 2,
                height: tileRadius * 2,
                scale: active ? 1 : 0.85,
                opacity: active ? 0.9 : 0.4,
              }}
              transition={{ type: "tween", duration: 0.4, ease: "easeInOut" }}
              style={{
                boxShadow:
                  "0 0 0 6px rgba(255,255,255,0.55), 0 0 24px 12px rgba(102,237,255,0.35), inset 0 0 24px rgba(255,255,255,0.55)",
                background:
                  "radial-gradient(closest-side, rgba(255,255,255,0.55), rgba(255,255,255,0.06) 70%, rgba(255,255,255,0.0) 80%)",
              }}
            />
          );
        })}
      </div>

      {/* “Рука” + луч */}
      {hand && (
        <div className="absolute inset-0 z-[40] pointer-events-none">
          {/* Луч от предыдущей точки к текущей */}
          {stepIdx > 0 && (() => {
            const a = points[stepIdx - 1];
            const b = hand;
            const dx = b.x - a.x;
            const dy = b.y - a.y;
            const len = Math.sqrt(dx * dx + dy * dy);
            const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
            return (
              <motion.div
                className="absolute origin-left"
                animate={{
                  left: a.x,
                  top: a.y - 4,
                  width: len,
                  rotate: angle,
                }}
                transition={{ type: "tween", duration: 0.35, ease: "easeInOut" }}
                style={{
                  height: 8,
                  background:
                    "linear-gradient(90deg, rgba(255,255,255,0.0), rgba(255,255,255,0.55) 25%, rgba(255,255,255,0.0))",
                  filter: "drop-shadow(0 0 8px rgba(102,237,255,0.6))",
                  borderRadius: 9999,
                }}
              />
            );
          })()}

          {/* Рука */}
          <motion.img
            src="/cursor.png" // добавь картинку руки в /public/hand.png
            alt=""
            className="absolute"
            animate={{
              left: hand.x - 16,
              top: hand.y - 16,
              scale: [1, 1.08, 1],
            }}
            transition={{
              left: { type: "tween", duration: 0.45, ease: "easeInOut" },
              top: { type: "tween", duration: 0.45, ease: "easeInOut" },
              scale: { repeat: Infinity, duration: 1.2, ease: "easeInOut" },
            }}
            style={{ width: 32, height: 32, filter: "drop-shadow(0 2px 8px rgba(0,0,0,0.6))" }}
          />
        </div>
      )}

      {/* Титр “SWIPE” (опционально) */}
      <div className="absolute left-1/2 -translate-x-1/2 bottom-[94px] z-[45] pointer-events-none">
        <div className="text-white font-extrabold text-3xl drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
          SWIPE
        </div>
      </div>
    </>
  );
}
