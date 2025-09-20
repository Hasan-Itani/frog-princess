import { MULTIPLIERS } from "../hooks/useGame";

/**
 * AwardsGrid
 * Displays the multiplier payouts for each level (reversed so highest is first).
 */
export default function AwardsGrid() {
  return (
    <div
      className="w-full max-w-[420px] mx-auto grid grid-cols-3 gap-2 place-items-center"
      role="list"
      aria-label="Award multipliers by level"
    >
      {MULTIPLIERS.slice() // shallow copy
        .reverse()
        .map((multiplier, idx) => (
          <div
            key={`award-${idx}-${multiplier}`}
            role="listitem"
            className="w-full rounded-lg px-3 py-2 text-center font-extrabold bg-sky-500/15 border border-sky-400/30"
          >
            x{multiplier}
          </div>
        ))}
    </div>
  );
}
