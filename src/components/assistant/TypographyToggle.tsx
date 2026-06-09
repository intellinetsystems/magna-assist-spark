import { useEffect, useState, useCallback } from "react";
import { Minus, Plus, Type, RotateCcw } from "lucide-react";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";

const LEVELS = [
  { id: 1, label: "Small", scale: 1.0 },
  { id: 2, label: "Medium", scale: 1.15 },
  { id: 3, label: "Large", scale: 1.3 },
] as const;

const STORAGE_KEY = "app:font-size-level";

function applyLevel(level: number) {
  const found = LEVELS.find((l) => l.id === level) ?? LEVELS[0];
  document.documentElement.style.fontSize = `${found.scale * 100}%`;
  document.documentElement.setAttribute("data-font-level", String(found.id));
}

export function initFontSize() {
  if (typeof window === "undefined") return;
  const stored = Number(localStorage.getItem(STORAGE_KEY) || "1");
  applyLevel(Number.isFinite(stored) && stored >= 1 && stored <= 3 ? stored : 1);
}

export function TypographyToggle() {
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
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label="Text size"
          title="Text size"
          className="p-1.5 rounded-lg text-[var(--ink-700)] hover:text-[var(--brand-600)] hover:bg-[var(--brand-50)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-500)]"
        >
          <Type className="w-4 h-4" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" sideOffset={6} className="w-56 p-3">
        <div className="text-xs font-semibold text-[var(--ink-900)] mb-2">Text Size</div>

        <div className="flex items-center justify-between gap-1 mb-3">
          <button
            type="button"
            onClick={() => update(level - 1)}
            disabled={level === 1}
            aria-label="Decrease font size"
            className="w-8 h-8 rounded-lg inline-flex items-center justify-center text-[var(--ink-700)] hover:bg-[var(--surface-2)] disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => update(1)}
            aria-label="Reset font size"
            title="Reset to default"
            className="w-8 h-8 rounded-lg inline-flex items-center justify-center text-[var(--ink-700)] hover:bg-[var(--surface-2)]"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => update(level + 1)}
            disabled={level === 3}
            aria-label="Increase font size"
            className="w-8 h-8 rounded-lg inline-flex items-center justify-center text-[var(--ink-700)] hover:bg-[var(--surface-2)] disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>

        <div role="radiogroup" aria-label="Font size level" className="flex flex-col gap-1">
          {LEVELS.map((l) => {
            const active = level === l.id;
            const size = l.id === 1 ? "text-xs" : l.id === 2 ? "text-sm" : "text-base";
            return (
              <button
                key={l.id}
                role="radio"
                aria-checked={active}
                onClick={() => update(l.id)}
                className={`flex items-center gap-2 px-2 py-1.5 rounded-lg transition ${
                  active
                    ? "bg-[var(--brand-50)] text-[var(--brand-700)]"
                    : "text-[var(--ink-700)] hover:bg-[var(--surface-2)]"
                }`}
              >
                <span
                  className={`w-3.5 h-3.5 rounded-full border ${
                    active ? "border-[var(--brand-600)] bg-[var(--brand-600)]" : "border-black/30"
                  } inline-flex items-center justify-center`}
                  aria-hidden
                >
                  {active && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                </span>
                <span className={`flex-1 text-left font-medium ${size}`}>{l.label}</span>
                <span className="text-[10px] text-[var(--ink-500)]">
                  {Math.round(l.scale * 100)}%
                </span>
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}
