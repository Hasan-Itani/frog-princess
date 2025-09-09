import { MULTIPLIERS } from "../hooks/useGame";

export default function AwardsGrid() {
  return (
    <div className="w-full max-w-[420px] mx-auto grid grid-cols-3 gap-2 place-items-center">
      {[...MULTIPLIERS]
        .slice()
        .reverse()
        .map((m, i) => (
          <div
            key={i}
            className="w-full rounded-lg px-3 py-2 text-center font-extrabold bg-sky-500/15 border border-sky-400/30"
          >
            x{m}
          </div>
        ))}
    </div>
  );
}
