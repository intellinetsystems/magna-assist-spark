import { Home, Search, Layers, Package, Star, Droplet, BookOpen, Zap, FileText, Award } from "lucide-react";

const navIcons = [
  { Icon: Home, label: "Home" },
  { Icon: Search, label: "Model" },
  { Icon: Layers, label: "Figure" },
  { Icon: Package, label: "Part" },
  { Icon: Star, label: "Favorites" },
  { Icon: Droplet, label: "Lubricants" },
  { Icon: BookOpen, label: "Literature" },
  { Icon: Zap, label: "Quick Ref" },
  { Icon: FileText, label: "F.R.M." },
  { Icon: Award, label: "Programs" },
];

const partsRows = Array.from({ length: 14 }, (_, i) => ({
  ref: i + 1,
  pn: ["19042759000", "1038767000", "19468753000", "S0601D010111N", "BRK-FRT-4421"][i % 5],
  desc: ["Brake Pad Assembly", "Oil Filter Cartridge", "Hub Bearing Kit", "Clutch Plate", "Wiper Blade"][i % 5],
}));

export function MockHostPage() {
  return (
    <div className="absolute inset-0 bg-[var(--surface-1)] overflow-hidden">
      {/* Top bar */}
      <header className="h-14 bg-gradient-brand text-white flex items-center px-6 gap-6 shadow-soft">
        <div className="font-bold text-lg tracking-tight">Mahindra <span className="font-light">Rise.</span></div>
        <div className="flex-1 max-w-xl">
          <div className="bg-white/15 backdrop-blur rounded-full h-9 px-4 flex items-center text-sm text-white/80">
            <Search className="w-4 h-4 mr-2" /> Search by part number, model, or keyword…
          </div>
        </div>
        <div className="text-sm opacity-90">Intelli Catalog</div>
      </header>

      <div className="flex h-[calc(100%-3.5rem)]">
        {/* Left rail */}
        <aside className="w-16 bg-white border-r border-black/5 flex flex-col items-center py-4 gap-2">
          {navIcons.map(({ Icon, label }, i) => (
            <button
              key={label}
              className={`w-11 h-11 rounded-xl flex items-center justify-center text-[var(--ink-500)] hover:bg-[var(--brand-50)] hover:text-[var(--brand-600)] transition ${i === 3 ? "bg-[var(--brand-50)] text-[var(--brand-600)]" : ""}`}
              title={label}
            >
              <Icon className="w-5 h-5" strokeWidth={1.75} />
            </button>
          ))}
        </aside>

        {/* Canvas */}
        <main className="flex-1 grid grid-cols-5 gap-4 p-6 overflow-hidden">
          <div className="col-span-3 bg-white rounded-2xl border border-black/5 shadow-soft p-6 relative overflow-hidden">
            <div className="text-xs uppercase tracking-wider text-[var(--ink-500)] mb-2">Exploded Diagram</div>
            <div className="text-lg font-semibold text-[var(--ink-900)] mb-4">Front Axle Assembly — XEV 9E</div>
            <ExplodedSVG />
          </div>
          <div className="col-span-2 bg-white rounded-2xl border border-black/5 shadow-soft overflow-hidden">
            <div className="px-5 py-3 border-b border-black/5 flex items-center justify-between">
              <div className="text-sm font-semibold text-[var(--ink-900)]">Parts List</div>
              <div className="text-xs text-[var(--ink-500)]">14 items</div>
            </div>
            <div className="overflow-auto h-full">
              <table className="w-full text-xs">
                <thead className="bg-[var(--surface-1)] text-[var(--ink-500)] uppercase tracking-wider">
                  <tr>
                    <th className="text-left px-4 py-2 font-medium">Ref</th>
                    <th className="text-left px-4 py-2 font-medium">Part No.</th>
                    <th className="text-left px-4 py-2 font-medium">Description</th>
                  </tr>
                </thead>
                <tbody>
                  {partsRows.map((r) => (
                    <tr key={r.ref} className="border-t border-black/5 hover:bg-[var(--brand-50)]/40">
                      <td className="px-4 py-2 text-[var(--ink-700)]">{r.ref}</td>
                      <td className="px-4 py-2 font-mono text-[var(--brand-600)] font-semibold">{r.pn}</td>
                      <td className="px-4 py-2 text-[var(--ink-700)]">{r.desc}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

function ExplodedSVG() {
  return (
    <svg viewBox="0 0 600 360" className="w-full h-full">
      <defs>
        <linearGradient id="metal" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stopColor="#E5E7EB" />
          <stop offset="100%" stopColor="#9CA3AF" />
        </linearGradient>
      </defs>
      <line x1="60" y1="180" x2="540" y2="180" stroke="#D1D5DB" strokeDasharray="4 4" />
      <circle cx="120" cy="180" r="50" fill="url(#metal)" stroke="#6B7280" />
      <circle cx="120" cy="180" r="18" fill="#fff" stroke="#6B7280" />
      <rect x="200" y="160" width="120" height="40" rx="8" fill="url(#metal)" stroke="#6B7280" />
      <rect x="340" y="150" width="60" height="60" rx="10" fill="url(#metal)" stroke="#6B7280" />
      <circle cx="480" cy="180" r="50" fill="url(#metal)" stroke="#6B7280" />
      <circle cx="480" cy="180" r="18" fill="#fff" stroke="#6B7280" />
      {[
        [120, 100, "1"],
        [260, 130, "2"],
        [370, 110, "3"],
        [480, 100, "4"],
        [200, 260, "5"],
        [400, 260, "6"],
      ].map(([x, y, n]) => (
        <g key={n as string}>
          <circle cx={x as number} cy={y as number} r="14" fill="#E11D2E" />
          <text x={x as number} y={(y as number) + 4} textAnchor="middle" fill="#fff" fontSize="11" fontWeight="700">
            {n}
          </text>
        </g>
      ))}
    </svg>
  );
}
