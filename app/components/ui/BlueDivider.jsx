"use client";

export default function BlueDivider({ className = "", maxWidth = 420 }) {
  return (
    <div
      className={[
        "relative my-2 w-full mx-auto",
        className,
        maxWidth ? `max-w-[${maxWidth}px]` : "",
      ].join(" ")}
      aria-hidden="true"
    >
      <div className="h-[2px] mx-4 bg-gradient-to-r from-transparent via-sky-400 to-transparent opacity-90 rounded-full" />
    </div>
  );
}
