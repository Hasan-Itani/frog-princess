import ImgLily from "./ImgLily";

export default function FunctionRow({ title, desc }) {
  return (
    <div className="w-full max-w-[520px] mx-auto p-3 rounded-xl border border-sky-400/25 bg-white/5">
      <div className="grid grid-cols-[20%_1fr] items-center gap-3">
        <ImgLily size={48} className="justify-self-start" />
        <div className="text-left">
          <div className="font-bold text-sky-300">{title}</div>
          <div className="text-sm opacity-90">{desc}</div>
        </div>
      </div>
    </div>
  );
}
