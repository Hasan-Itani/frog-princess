export default function ImgLily({ size = 56, className = "" }) {
  return (
    <img
      src="/tile.png"
      alt="Lily"
      width={size}
      height={size}
      className={`object-contain ${className}`}
    />
  );
}
