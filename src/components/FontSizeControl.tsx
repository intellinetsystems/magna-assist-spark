import { useEffect, useState, useCallback } from "react";
import { Minus, Plus, Type } from "lucide-react";

const LEVELS = [
  { id: 1, label: "Small", scale: 1.0 },
  { id: 2, label: "Medium", scale: 1.15 },
  { id: 3, label: "Large", scale: 1.3 },
] as const;

const STORAGE_KEY = "app:font-size-level";

function applyLevel(level: number) {
  const found = LEVELS.find((l) => l.id === level) ?? LEVELS[0];
  // Scale root font-size so rem-based sizes resize globally.
  document.documentElement.style.fontSize = `${found.scale * 100}%`;
  document.documentElement.setAttribute("data-font-level", String(found.id));
}

export function initFontSize() {
  if (typeof window === "undefined") return;
  const stored = Number(localStorage.getItem(STORAGE_KEY) || "1");
  applyLevel(Number.isFinite(stored) && stored >= 1 && stored <= 3 ? stored : 1);
}

export function FontSizeControl({ className = "" }: { className?: string }) {
  const [level, setLevel] = useState<number>(1);

  useEffect(() => {
    const stored = Number(localStorage.getItem(STORAGE_KEY) || "1");
    const lvl = Number.isFinite(stored) && stored >= 1 && stored <= 3 ? stored : 1;
    setLevel(lvl);
    applyLevel(lvl);
  }, []);

  const update = useCallback((lvl: number) => {
    const clamped = Math.max(1, Math.min(3, lvl));
    setLevel(clamped);
    localStorage.setItem(STORAGE_KEY, String(clamped));
    applyLevel(clamped);
  }, []);

  return (
    <div
      role="group"
      aria-label="Font size"
      className={`fixed bottom-4 right-4 z-[200] flex items-center gap-1 rounded-full bg-white/95 backdrop-blur border border-black/10 shadow-soft px-1.5 py-1 ${className}`}
    >
      <Type className="w-3.5 h-3.5 text-[var(--ink-500)] ml-1.5" aria-hidden />
      <button
        type="button"
        onClick={() => update(level - 1)}
        disabled={level === 1}
        aria-label="Decrease font size"
        className="w-8 h-8 rounded-full inline-flex items-center justify-center text-[var(--ink-700)] hover:bg-[var(--surface-2)] disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <Minus className="w-3.5 h-3.5" />
      </button>
      {LEVELS.map((l) => {
        const active = level === l.id;
        const size = l.id === 1 ? "text-[11px]" : l.id === 2 ? "text-[13px]" : "text-[15px]";
        return (
          <button
            key={l.id}
            type="button"
            onClick={() => update(l.id)}
            aria-label={`${l.label} font size`}
            aria-pressed={active}
            className={`w-8 h-8 rounded-full inline-flex items-center justify-center font-semibold transition ${size} ${
              active
                ? "bg-gradient-brand text-white shadow-soft"
                : "text-[var(--ink-700)] hover:bg-[var(--surface-2)]"
            }`}
          >
            A
          </button>
        );
      })}
      <button
        type="button"
        onClick={() => update(level + 1)}
        disabled={level === 3}
        aria-label="Increase font size"
        className="w-8 h-8 rounded-full inline-flex items-center justify-center text-[var(--ink-700)] hover:bg-[var(--surface-2)] disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <Plus className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
