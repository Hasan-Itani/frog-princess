"use client";
import { useEffect, useState } from "react";

export default function SakuraFall() {
  const [petals, setPetals] = useState([]);

  useEffect(() => {
    const interval = setInterval(() => {
      const id = Date.now();
      setPetals((prev) => [
        ...prev,
        {
          id,
          left: Math.random() * 100,
          duration: 5 + Math.random() * 3,
          delay: Math.random() * 1.2,
          size: 20 + Math.random() * 20,
        },
      ]);

      setPetals((prev) => prev.filter((p) => Date.now() - p.id < 9000));
    }, 1100);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-40">
      {petals.map((p) => (
        <span
          key={p.id}
          className="absolute animate-sakura"
          style={{
            left: `${p.left}%`,
            width: `${p.size}px`,
            height: `${p.size}px`,
            animationDuration: `${p.duration}s`,
            animationDelay: `${p.delay}s`,
          }}
        >
          <img src="/sakura.png" alt="sakura" className="w-full h-full object-contain opacity-80" />
        </span>
      ))}

      <style jsx global>{`
        @keyframes fall {
          0% {
            transform: translateY(-10%) rotate(0deg);
            opacity: 1;
          }
          50% {
            transform: translateY(50vh) rotate(90deg);
            opacity: 0.6;
          }
          100% {
            transform: translateY(60vh) rotate(180deg);
            opacity: 0;
          }
        }
        .animate-sakura {
          position: absolute;
          top: -10%;
          animation-name: fall;
          animation-timing-function: linear;
          animation-iteration-count: 1;
        }
      `}</style>
    </div>
  );
}
