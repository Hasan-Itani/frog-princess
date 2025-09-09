"use client";
import { useState } from "react";

export default function IconButton({
  icon,
  hoverIcon,
  activeIcon,
  isActive,
  onClick,
  alt,
  size = 14,
  className = "",
}) {
  const [hover, setHover] = useState(false);
  const [press, setPress] = useState(false);

  const getIcon = () => {
    if (press) return activeIcon;
    if (isActive) return activeIcon;
    if (hover) return hoverIcon;
    return icon;
  };

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => {
        setHover(false);
        setPress(false);
      }}
      onMouseDown={() => setPress(true)}
      onMouseUp={() => setPress(false)}
      className={`w-${size} h-${size} flex items-center justify-center ${className}`}
    >
      <img src={getIcon()} alt={alt} className="w-full h-full object-contain" />
    </button>
  );
}
