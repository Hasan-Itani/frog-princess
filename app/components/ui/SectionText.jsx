export function PartTitle({ children }) {
  return (
    <h2 className="text-sky-300 font-extrabold tracking-wide text-sm text-center">
      {children}
    </h2>
  );
}

export function TinyMuted({ children }) {
  return (
    <p className="text-xs leading-relaxed opacity-90 text-center">{children}</p>
  );
}
