"use client";
import { useState } from "react";

/**
 * IconButton
 * - `px`: explicit pixel size (e.g., 40 → 40px)
 * - `size`: backwards-compat for Tailwind spacing tokens (10,12,14,16 → 40/48/56/64px)
 */
export default function IconButton({
  icon,
  hoverIcon,
  activeIcon,
  disabledIcon,     // ✅ новое свойство
  isActive,
  disabled = false, // ✅ новое свойство
  onClick,
  alt,
  size = 14,
  px,
  className = "",
}) {
  const [hover, setHover] = useState(false);
  const [press, setPress] = useState(false);

  const sizeToPx = (s) => {
    const map = { 10: 40, 12: 48, 14: 56, 16: 64, 20: 80 };
    const n = Number(s);
    if (!Number.isNaN(n) && map[n]) return map[n];
    return 56;
  };
  const dim = typeof px === "number" ? px : sizeToPx(size);

  const getIcon = () => {
    if (disabled && disabledIcon) return disabledIcon; // ✅ при disabled
    if (press) return activeIcon;
    if (isActive) return activeIcon;
    if (hover) return hoverIcon;
    return icon;
  };

  return (
    <button
      onClick={disabled ? undefined : onClick} // ✅ отключаем клик
      disabled={disabled}
      onMouseEnter={() => !disabled && setHover(true)} // ✅ ховер игнорим если disabled
      onMouseLeave={() => {
        setHover(false);
        setPress(false);
      }}
      onMouseDown={() => !disabled && setPress(true)}
      onMouseUp={() => setPress(false)}
      className={`inline-flex items-center justify-center ${className}`}
      style={{ width: dim, height: dim }}
      aria-label={alt}
    >
      <img
        src={getIcon()}
        alt={alt}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "contain",
          opacity: disabled && !disabledIcon ? 0.5 : 1, // ✅ fallback для disabled
        }}
      />
    </button>
  );
}
