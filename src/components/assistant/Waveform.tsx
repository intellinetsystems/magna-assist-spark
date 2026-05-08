import { useEffect, useState } from "react";

export function Waveform({ bars = 22, active = true, className = "" }: { bars?: number; active?: boolean; className?: string }) {
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
            const base = Math.sin((t / 220) + i * 0.6) * 0.5 + 0.5;
            return 3 + base * 16 + Math.random() * 4;
          })
        );
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [active]);

  return (
    <div className={`flex items-center gap-[3px] h-6 ${className}`}>
      {heights.map((h, i) => (
        <span
          key={i}
          className="w-[3px] rounded-full bg-[var(--waveform-green)] transition-all duration-100"
          style={{ height: `${h}px`, opacity: active ? 0.95 : 0.4 }}
        />
      ))}
    </div>
  );
}
