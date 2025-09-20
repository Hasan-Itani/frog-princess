"use client";

/** Map a char to its sprite asset + dims (gray/yellow variants). */
export function symbolToImage(char, color = "gray") {
  if (char === "x" || char === "X")
    return { src: `/multi_${color}.png`, w: 14, h: 18, dy: 3 };
  if (char === ".") return { src: `/dot_${color}.png`, w: 6, h: 6, dy: 6 };
  return { src: `/digits_${color}/${char}.png`, w: 14, h: 18, dy: 0 };
}

/** Render a number string (e.g., "x1.20") as digit images. */
export default function NumberGlyphs({
  text,
  color = "gray",
  className = "",
  scaleOn = false,
}) {
  return (
    <div
      className={`absolute inset-0 flex items-center justify-center gap-0.5 z-[20] ${className}`}
    >
      {text.split("").map((ch, i) => {
        const { src, w, h, dy } = symbolToImage(ch, color);
        return (
          <img
            key={`${ch}-${i}`}
            src={src}
            alt={ch}
            className="object-contain transition-all duration-500 ease-in-out"
            style={{
              width: w,
              height: h,
              transform: `translateY(${dy}px) ${scaleOn ? "scale(1.2)" : ""}`,
            }}
          />
        );
      })}
    </div>
  );
}
