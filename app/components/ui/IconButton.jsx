"use client";
import { useMemo, useState, useCallback } from "react";

/**
 * IconButton
 * Props
 * - icon, hoverIcon, activeIcon, disabledIcon: image URLs
 * - isActive: boolean — visual/aria toggle state
 * - disabled: boolean
 * - onClick: () => void
 * - alt: string — accessible label
 * - size: 10|12|14|16|20 (legacy tailwind tokens → px)
 * - px: number — explicit pixel size (overrides size)
 * - className: string
 * - title: string — optional native tooltip
 */
export default function IconButton({
  icon,
  hoverIcon,
  activeIcon,
  disabledIcon,
  isActive = false,
  disabled = false,
  onClick,
  alt,
  size = 14,
  px,
  className = "",
  title,
}) {
  const [hover, setHover] = useState(false);
  const [press, setPress] = useState(false);

  // Map tailwind-ish token -> px (fallback 56)
  const dim = useMemo(() => {
    if (typeof px === "number") return px;
    const map = { 10: 40, 12: 48, 14: 56, 16: 64, 20: 80 };
    const n = Number(size);
    return map[n] || 56;
  }, [px, size]);

  const currentIcon = useMemo(() => {
    if (disabled && disabledIcon) return disabledIcon;
    if (press && activeIcon) return activeIcon;
    if (isActive && activeIcon) return activeIcon;
    if (hover && hoverIcon) return hoverIcon;
    return icon;
  }, [
    disabled,
    disabledIcon,
    press,
    isActive,
    activeIcon,
    hover,
    hoverIcon,
    icon,
  ]);

  const handleActivate = useCallback(() => {
    if (!disabled && typeof onClick === "function") onClick();
  }, [disabled, onClick]);

  return (
    <button
      type="button"
      title={title}
      onClick={handleActivate}
      disabled={disabled}
      onMouseEnter={() => !disabled && setHover(true)}
      onMouseLeave={() => {
        setHover(false);
        setPress(false);
      }}
      onMouseDown={() => !disabled && setPress(true)}
      onMouseUp={() => setPress(false)}
      onTouchStart={() => !disabled && setPress(true)}
      onTouchEnd={() => setPress(false)}
      onKeyDown={(e) => {
        if (disabled) return;
        if (e.key === " " || e.key === "Enter") {
          e.preventDefault();
          setPress(true);
        }
      }}
      onKeyUp={(e) => {
        if (disabled) return;
        if (e.key === " " || e.key === "Enter") {
          e.preventDefault();
          setPress(false);
          handleActivate();
        }
      }}
      aria-label={alt}
      aria-pressed={isActive || undefined}
      className={[
        "inline-flex items-center justify-center rounded-lg outline-none",
        "focus-visible:ring-2 focus-visible:ring-sky-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent",
        disabled ? "cursor-not-allowed" : "cursor-pointer",
        className,
      ].join(" ")}
      style={{ width: dim, height: dim }}
    >
      <img
        src={currentIcon}
        alt=""
        aria-hidden="true"
        draggable={false}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "contain",
          opacity: disabled && !disabledIcon ? 0.5 : 1,
          userSelect: "none",
          pointerEvents: "none",
        }}
      />
      {/* Off-screen label for SR if you want visible text-less buttons; using aria-label already */}
      {/* <span className="sr-only">{alt}</span> */}
    </button>
  );
}
