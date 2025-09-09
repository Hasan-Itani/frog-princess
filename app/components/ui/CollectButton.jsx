"use client";
import { useEffect, useState } from "react";

export default function CollectButton({
  show,
  amount,
  format,
  label = "COLLECT",
  onCollect,
  className = "",
}) {
  const [visible, setVisible] = useState(false);
  const [phase, setPhase] = useState("hidden");
  const [locked, setLocked] = useState(false);

  useEffect(() => {
    if (show) {
      setVisible(true);
      const t1 = setTimeout(() => setPhase("in"), 10);
      const t2 = setTimeout(() => setPhase("idle"), 220);
      setLocked(false);
      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
      };
    } else if (visible) {
      setPhase("out");
      const t = setTimeout(() => {
        setVisible(false);
        setPhase("hidden");
        setLocked(false);
      }, 200);
      return () => clearTimeout(t);
    }
  }, [show, visible]);

  function handleClick() {
    if (locked || phase === "out") return;
    setLocked(true);
    setPhase("out");
    onCollect?.();
  }

  if (!visible) return null;

  const amountText =
    typeof format === "function" ? format(amount) : String(amount);

  return (
    <div
      onClick={handleClick}
      className={[
        "relative select-none",
        locked || phase === "out" ? "pointer-events-none" : "cursor-pointer",
        phase === "in"
          ? "animate-scaleUp"
          : "transition-transform transition-opacity duration-200 ease-out",
        phase === "out" ? "opacity-0 scale-90" : "opacity-100 scale-100",
        className,
      ].join(" ")}
      title="Collect your current winnings"
    >
      <img
        src="/green_button.png"
        alt={label}
        className="w-56 h-16 object-contain drop-shadow-lg"
      />
      <div className="absolute inset-0 flex flex-col items-center justify-center text-black font-extrabold">
        <span className="text-lg leading-tight">{label}</span>
        <span className="text-sm">{amountText}</span>
      </div>
    </div>
  );
}
