import { useEffect, useState } from "react";

export function Waveform({ bars = 22, active = true, listening = false, className = "" }: { bars?: number; active?: boolean; listening?: boolean; className?: string }) {
  const [heights, setHeights] = useState<number[]>(() => Array.from({ length: bars }, () => 4));

  useEffect(() => {
    let raf = 0;
    let last = 0;
    const tick = (t: number) => {
      if (t - last > 90) {
        last = t;
        setHeights((h) =>
          h.map((_, i) => {
            if (!active) return 3;
            const amp = listening ? 22 : 16;
            const base = Math.sin((t / 220) + i * 0.6) * 0.5 + 0.5;
            return 3 + base * amp + Math.random() * (listening ? 7 : 4);
          })
        );
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [active, listening]);

  const color = listening ? "var(--brand-600)" : "var(--waveform-green)";
  return (
    <div className={`flex items-center gap-[3px] h-6 ${className}`}>
      {heights.map((h, i) => (
        <span
          key={i}
          className="w-[3px] rounded-full transition-all duration-100"
          style={{ height: `${h}px`, opacity: active ? 0.95 : 0.4, backgroundColor: color }}
        />
      ))}
    </div>
  );
}
