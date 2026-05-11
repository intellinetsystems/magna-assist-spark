import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mic, ChevronDown, ChevronRight, Search, Clock, Truck, MapPin, Bell, ExternalLink,
  AlertTriangle, Ticket as TicketIcon, RefreshCw, Play, FileText, Box, Image as ImageIcon,
  Download, CheckCircle2, Share2, Plus, ArrowRight, X, ZoomIn,
} from "lucide-react";
import { BotShell } from "./MessageBubbles";
import { popularModels, moreModels, variantsByModel, partCategories, accessorySeries, buildFilters, buildKeys, type PartItem } from "@/lib/flows";
import { toast } from "sonner";
import filterImg from "@/assets/accessory-filter.jpg";
import keyImg from "@/assets/accessory-key.jpg";
import backhoeValveFig from "@/assets/backhoe-valve-fig008.png";

function VoiceInput({ value, onChange, placeholder, onSubmit }: {
  value: string; onChange: (v: string) => void; placeholder: string; onSubmit: () => void;
}) {
  const [listening, setListening] = useState(false);
  return (
    <div className="relative">
      <div className={`flex items-center gap-2 bg-white border rounded-2xl px-3 py-2.5 transition ${listening ? "border-[var(--brand-500)] ring-4 ring-[var(--brand-100)]" : "border-black/10 focus-within:border-[var(--brand-300)] focus-within:ring-2 focus-within:ring-[var(--brand-100)]"}`}>
        <Search className="w-4 h-4 text-[var(--ink-500)]" />
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && onSubmit()}
          placeholder={placeholder}
          className="flex-1 bg-transparent text-sm outline-none placeholder:text-[var(--ink-500)]"
        />
        <button
          onClick={() => setListening((v) => !v)}
          aria-label={listening ? "Stop listening" : "Start voice input"}
          className={`w-8 h-8 rounded-full flex items-center justify-center transition focus:outline-none focus:ring-2 focus:ring-[var(--brand-500)] focus:ring-offset-2 ${
            listening ? "bg-[var(--brand-600)] text-white animate-pulse" : "bg-[var(--surface-2)] text-[var(--ink-700)] hover:bg-[var(--brand-50)]"
          }`}
        >
          <Mic className="w-4 h-4" />
        </button>
      </div>
      {listening && (
        <div className="absolute -top-7 left-3 px-2 py-0.5 rounded-full bg-[var(--brand-600)] text-white text-[10px] font-medium inline-flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" /> Listening…
          <button onClick={() => setListening(false)} className="ml-1"><X className="w-2.5 h-2.5" /></button>
        </div>
      )}
    </div>
  );
}

function Chip({ label, onClick, active }: { label: string; onClick: () => void; active?: boolean }) {
  return (
    <button
      onClick={onClick}
      className={`px-3.5 py-1.5 rounded-full text-xs font-medium border transition focus:outline-none focus:ring-2 focus:ring-[var(--brand-500)] focus:ring-offset-2 ${
        active
          ? "bg-[var(--brand-600)] text-white border-[var(--brand-600)] shadow-soft"
          : "bg-white text-[var(--ink-700)] border-black/10 hover:bg-[var(--brand-50)] hover:border-[var(--brand-200)] hover:text-[var(--brand-700)]"
      }`}
    >
      {label}
    </button>
  );
}

export function ModelPickerCard({ onSubmit }: { onSubmit: (model: string) => void }) {
  const [value, setValue] = useState("");
  const [showMore, setShowMore] = useState(false);
  const submit = (m: string) => onSubmit(m.trim());
  return (
    <BotShell>
      <div className="bg-white border border-black/[0.04] rounded-3xl rounded-tl-md p-4 shadow-soft w-full max-w-md">
        <div className="text-xs uppercase tracking-wider text-[var(--ink-500)] font-semibold mb-2">Vehicle Model</div>
        <VoiceInput value={value} onChange={setValue} placeholder="Search model or speak…" onSubmit={() => value && submit(value)} />
        <div className="flex flex-wrap gap-2 mt-3">
          {popularModels.map((m) => <Chip key={m} label={m} onClick={() => submit(m)} />)}
        </div>
        <button onClick={() => setShowMore((v) => !v)} className="text-xs text-[var(--brand-600)] font-medium mt-3 inline-flex items-center gap-1 hover:underline">
          {showMore ? "Hide" : "More models…"} <ChevronDown className={`w-3 h-3 transition ${showMore ? "rotate-180" : ""}`} />
        </button>
        <AnimatePresence>
          {showMore && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
              <div className="flex flex-wrap gap-2 mt-2 max-h-40 overflow-y-auto scrollbar-thin pr-1">
                {moreModels.map((m) => <Chip key={m} label={m} onClick={() => submit(m)} />)}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </BotShell>
  );
}

export function VariantPickerCard({ model, onSubmit }: { model: string; onSubmit: (variant: string) => void }) {
  const [value, setValue] = useState("");
  const variants = variantsByModel[model] ?? [`${model} Standard`, `${model} Premium`];
  return (
    <BotShell>
      <div className="bg-white border border-black/[0.04] rounded-3xl rounded-tl-md p-4 shadow-soft w-full max-w-md">
        <div className="text-xs uppercase tracking-wider text-[var(--ink-500)] font-semibold mb-2">Variant of {model}</div>
        <VoiceInput value={value} onChange={setValue} placeholder="Search variant or speak…" onSubmit={() => value && onSubmit(value)} />
        <div className="flex flex-wrap gap-2 mt-3">
          {variants.map((v) => <Chip key={v} label={v} onClick={() => onSubmit(v)} />)}
        </div>
        <button onClick={() => onSubmit("All variants")} className="text-xs text-[var(--brand-600)] font-medium mt-3 hover:underline">
          Skip — search across all variants
        </button>
      </div>
    </BotShell>
  );
}

export function PartQueryCard({ model, variant, onSubmit }: { model: string; variant: string; onSubmit: (q: string) => void }) {
  const [value, setValue] = useState("");
  return (
    <BotShell>
      <div className="bg-white border border-black/[0.04] rounded-3xl rounded-tl-md p-4 shadow-soft w-full max-w-md">
        <div className="text-xs uppercase tracking-wider text-[var(--ink-500)] font-semibold mb-2">
          {model} <span className="text-[var(--ink-300)]">/</span> {variant}
        </div>
        <VoiceInput value={value} onChange={setValue} placeholder="Part number, name, or description…" onSubmit={() => value && onSubmit(value)} />
        <div className="flex flex-wrap gap-2 mt-3">
          {partCategories.map((c) => <Chip key={c} label={c} onClick={() => onSubmit(c)} />)}
        </div>
        <p className="text-[11px] text-[var(--ink-500)] mt-3 leading-relaxed">
          Tip: paste a Part No. like <span className="font-mono text-[var(--brand-600)]">KMW05863406506</span>, or describe it like "hydraulic adapter 90".
        </p>
      </div>
    </BotShell>
  );
}

function PartThumb({ seed }: { seed: number }) {
  const rotate = seed * 18;
  return (
    <svg viewBox="0 0 80 80" className="w-full h-full" style={{ transform: `rotate(${rotate}deg)` }}>
      <defs>
        <linearGradient id={`pt${seed}`} x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stopColor="#F3F4F6" /><stop offset="100%" stopColor="#9CA3AF" />
        </linearGradient>
      </defs>
      <rect x="14" y="28" width="52" height="24" rx="6" fill={`url(#pt${seed})`} stroke="#6B7280" />
      <circle cx="22" cy="40" r="4" fill="#fff" stroke="#6B7280" />
      <circle cx="58" cy="40" r="4" fill="#fff" stroke="#6B7280" />
    </svg>
  );
}

export function ResultListCard({ items, query, model, variant, onSelect }: {
  items: PartItem[]; query: string; model: string; variant: string; onSelect: (p: PartItem) => void;
}) {
  const [search, setSearch] = useState("");
  const filtered = items.filter((p) =>
    !search || p.partNo.toLowerCase().includes(search.toLowerCase()) || p.description.toLowerCase().includes(search.toLowerCase())
  );
  return (
    <BotShell>
      <div className="bg-white border border-black/[0.04] rounded-3xl rounded-tl-md p-4 shadow-soft w-full max-w-2xl">
        <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
          <div className="text-sm text-[var(--ink-700)]">
            Found <strong className="text-[var(--ink-900)]">{items.length}</strong> matches for <span className="font-medium text-[var(--brand-600)]">"{query}"</span> in {model} — {variant}
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 bg-[var(--surface-1)] border border-black/5 rounded-full px-2.5 py-1">
              <Search className="w-3 h-3 text-[var(--ink-500)]" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search results" className="bg-transparent text-xs outline-none w-28" />
            </div>
            <button className="text-xs px-3 py-1 rounded-full border border-black/10 hover:bg-[var(--brand-50)] inline-flex items-center gap-1">
              Sort: Relevance <ChevronDown className="w-3 h-3" />
            </button>
          </div>
        </div>
        <div className="space-y-2">
          {filtered.map((p) => (
            <motion.button
              key={p.partNo}
              whileHover={{ scale: 1.005 }}
              onClick={() => onSelect(p)}
              className="w-full flex items-center gap-3 p-3 rounded-2xl border border-black/5 hover:bg-[var(--brand-50)]/40 hover:border-[var(--brand-200)] hover:shadow-soft transition text-left"
            >
              <div className="w-14 h-14 rounded-xl bg-[var(--surface-1)] border border-black/5 shrink-0 overflow-hidden">
                <PartThumb seed={p.partNo.length} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-[13px] font-semibold text-[var(--brand-600)]">{p.partNo}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[var(--surface-2)] text-[var(--ink-700)]">{p.category}</span>
                </div>
                <div className="text-sm text-[var(--ink-900)] mt-0.5 truncate">{p.description}</div>
                <div className="text-[11px] text-[var(--ink-500)] mt-0.5">{p.assembly} · {p.aggregate}</div>
              </div>
              <div className="text-right shrink-0">
                <div className="text-[10px] text-[var(--ink-500)] uppercase">MRP</div>
                <div className="text-sm font-semibold text-[var(--ink-900)]">${p.mrp.toFixed(2)}</div>
              </div>
              <ChevronRight className="w-4 h-4 text-[var(--ink-500)] shrink-0" />
            </motion.button>
          ))}
        </div>
      </div>
    </BotShell>
  );
}

function AssemblyDiagram({ highlightId = 9 }: { highlightId?: number }) {
  // Real reference illustration: Backhoe Valve, Fittings & Hardware (1526B - FIG 008)
  // Highlight rings positioned over each callout box (% of image width/height).
  const callouts: Record<number, { x: number; y: number }[]> = {
    1:  [{ x: 66, y: 23 }],
    2:  [{ x: 25, y: 50 }],
    3:  [{ x: 60, y: 10 }],
    5:  [{ x: 29, y: 13 }],
    6:  [{ x: 18, y: 24 }, { x: 84, y: 55 }, { x: 58, y: 79 }],
    7:  [{ x: 51, y: 91 }],
    8:  [{ x: 86, y: 81 }],
    9:  [{ x: 15, y: 60 }],
    10: [{ x: 34, y: 8 }],
  };
  const points = callouts[highlightId] ?? [];
  return (
    <div className="relative w-full h-full">
      <img
        src={backhoeValveFig}
        alt="Backhoe Valve, Fittings & Hardware (1526B - FIG 008) illustration"
        className="w-full h-full object-contain select-none"
        draggable={false}
      />
      {points.map((p, i) => (
        <span
          key={i}
          className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none"
          style={{ left: `${p.x}%`, top: `${p.y}%` }}
          aria-hidden
        >
          <span className="block w-9 h-9 rounded-md ring-[3px] ring-[#E11D2E] animate-pulse shadow-[0_0_0_4px_rgba(225,29,46,0.18)]" />
        </span>
      ))}
    </div>
  );
}

function _LegacyAssemblyDiagramSVG({ highlightId = 9 }: { highlightId?: number }) {
  const callouts: Record<number, { x: number; y: number }> = {
    1: { x: 280, y: 70 }, 2: { x: 158, y: 138 }, 3: { x: 320, y: 38 },
    5: { x: 88, y: 52 }, 6: { x: 110, y: 100 }, 7: { x: 250, y: 268 },
    8: { x: 410, y: 252 }, 9: { x: 70, y: 188 }, 10: { x: 65, y: 30 },
  };
  const Box = ({ id }: { id: number }) => {
    const c = callouts[id];
    if (!c) return null;
    const active = id === highlightId;
    return (
      <g>
        <rect x={c.x - 14} y={c.y - 12} width="28" height="24" rx="2"
          fill={active ? "#FFE4E6" : "#fff"} stroke={active ? "#E11D2E" : "#111827"}
          strokeWidth={active ? 2.4 : 1.5} />
        <text x={c.x} y={c.y + 4} textAnchor="middle" fontSize="11" fontWeight="700" fill={active ? "#E11D2E" : "#111827"}>{id}</text>
      </g>
    );
  };

  return (
    <svg viewBox="0 0 500 320" className="w-full h-full" role="img" aria-label="Backhoe valve assembly illustration">
      <defs>
        <linearGradient id="metalGrad" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#F3F4F6" />
          <stop offset="100%" stopColor="#D1D5DB" />
        </linearGradient>
      </defs>

      {/* Manifold body */}
      <rect x="170" y="95" width="220" height="90" rx="4" fill="url(#metalGrad)" stroke="#374151" strokeWidth="1.4" />
      {/* Top spool ports */}
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <rect key={`t${i}`} x={185 + i * 33} y="80" width="20" height="20" rx="2" fill="#E5E7EB" stroke="#374151" />
      ))}
      {/* Front bores (×6) */}
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <circle key={`b${i}`} cx={195 + i * 33} cy="140" r="9" fill="#fff" stroke="#374151" />
      ))}
      {/* Bottom bores (×6) */}
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <circle key={`bb${i}`} cx={195 + i * 33} cy="168" r="6" fill="#fff" stroke="#374151" />
      ))}

      {/* Highlighted #9 — red 90° adapter at lower-left */}
      <g>
        <path d="M125 175 L 125 205 L 95 205 L 95 195 L 75 195 L 75 230" fill="none" stroke="#E11D2E" strokeWidth="6" strokeLinejoin="round">
          <animate attributeName="stroke-opacity" values="1;0.4;1" dur="1.6s" repeatCount="indefinite" />
        </path>
        <circle cx="75" cy="232" r="6" fill="#E11D2E" />
      </g>

      {/* Other adapters (left 90°, right 90°, bottom adapters) */}
      <path d="M170 130 L 140 130 L 140 110 L 120 110 L 120 90" fill="none" stroke="#6B7280" strokeWidth="5" strokeLinejoin="round" />
      <path d="M390 140 L 420 140 L 420 165 L 440 165 L 440 220" fill="none" stroke="#6B7280" strokeWidth="5" strokeLinejoin="round" />
      <path d="M250 185 L 250 240 L 270 240 L 270 270" fill="none" stroke="#6B7280" strokeWidth="5" strokeLinejoin="round" />
      <path d="M390 220 L 410 220 L 410 250" fill="none" stroke="#6B7280" strokeWidth="5" strokeLinejoin="round" />

      {/* Cap screws / nuts on top */}
      <line x1="320" y1="40" x2="320" y2="80" stroke="#6B7280" strokeWidth="2" />
      <circle cx="90" cy="55" r="5" fill="#9CA3AF" stroke="#374151" />

      {/* Leader lines from callouts to features */}
      <line x1="280" y1="82" x2="280" y2="100" stroke="#9CA3AF" strokeDasharray="3 2" />
      <line x1="172" y1="138" x2="195" y2="140" stroke="#9CA3AF" strokeDasharray="3 2" />
      <line x1="124" y1="100" x2="140" y2="110" stroke="#9CA3AF" strokeDasharray="3 2" />
      <line x1="84" y1="190" x2="78" y2="220" stroke="#E11D2E" strokeWidth="1.5" />

      {/* Callout boxes */}
      {Object.keys(callouts).map((k) => <Box key={k} id={Number(k)} />)}

      <text x="492" y="312" textAnchor="end" fontSize="8" fill="#9CA3AF" fontStyle="italic">COPYRIGHT PROTECTED</text>
    </svg>
  );
}

export function PartDetailCard({ part }: { part: PartItem }) {
  const [exploded, setExploded] = useState(false);
  const [video, setVideo] = useState(false);
  const attachments = [
    { type: "video", icon: Play, name: "Install_Guide.mp4", size: "12.4 MB", color: "text-[var(--brand-600)] bg-[var(--brand-50)]", action: "Watch" },
    { type: "pdf", icon: FileText, name: "Spec_Sheet.pdf", size: "840 KB", color: "text-rose-600 bg-rose-50", action: "Open" },
    { type: "doc", icon: FileText, name: "Service_Notes.docx", size: "120 KB", color: "text-blue-600 bg-blue-50", action: "Download" },
    { type: "xlsx", icon: FileText, name: "Compatibility.xlsx", size: "64 KB", color: "text-emerald-600 bg-emerald-50", action: "Download" },
    { type: "3d", icon: Box, name: "Model.glb", size: "3.2 MB", color: "text-indigo-600 bg-indigo-50", action: "View 3D" },
    { type: "image", icon: ImageIcon, name: "Hi-res_Photos", size: "4 images", color: "text-amber-600 bg-amber-50", action: "Preview" },
  ];
  const alternates = [
    { partNo: "KMW05863108408", mrp: 27.95 }, { partNo: "KMW05862408508", mrp: 25.50 },
    { partNo: "KMW05863106406", mrp: 15.40 }, { partNo: "KMW05861106406", mrp: 21.50 },
  ];

  return (
    <BotShell>
      <div className="bg-white border border-black/[0.04] rounded-3xl rounded-tl-md p-5 shadow-soft w-full max-w-3xl">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-lg font-bold text-[var(--brand-600)]">{part.partNo}</span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-medium inline-flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> In Stock — {part.inStock} units
              </span>
            </div>
            <div className="text-[15px] font-semibold text-[var(--ink-900)] mt-0.5">{part.description}</div>
          </div>
          <div className="flex items-center gap-2">
            <button aria-label="Share" className="p-2 rounded-full border border-black/10 hover:bg-[var(--surface-2)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-500)] focus:ring-offset-2">
              <Share2 className="w-4 h-4 text-[var(--ink-700)]" />
            </button>
            <button onClick={() => toast.success("Added to order")} className="bg-gradient-brand text-white text-sm font-semibold rounded-full px-4 py-2 inline-flex items-center gap-2 shadow-soft hover:opacity-95 focus:outline-none focus:ring-2 focus:ring-[var(--brand-500)] focus:ring-offset-2">
              <Plus className="w-4 h-4" /> Add to Order
            </button>
          </div>
        </div>

        {/* Specs */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-2 mt-4 text-xs">
          {[
            ["Ref No.", `#${part.refNo}`], ["Qty", `${part.qty}`], ["Figure", part.figure],
            ["Category", part.category], ["Vehicle", part.vehicle], ["Model", part.model],
            ["Variant", part.variant], ["Aggregate", part.aggregate], ["Group No.", part.groupNo],
            ["Assembly", part.assembly], ["Cost (USD)", `$ ${part.cost.toFixed(2)}`], ["MRP (USD)", `$ ${part.mrp.toFixed(2)}`],
          ].map(([k, v]) => (
            <div key={k} className="min-w-0">
              <div className="text-[10px] uppercase tracking-wider text-[var(--ink-500)]">{k}</div>
              <div className="text-[var(--ink-900)] font-medium break-words">{v}</div>
            </div>
          ))}
        </div>

        {/* Assembly + Attachments */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 mt-4">
          <div className="md:col-span-3 rounded-2xl border border-black/5 bg-[var(--surface-1)] p-3 relative">
            <div className="flex items-center justify-between mb-1">
              <div className="text-xs font-semibold text-[var(--ink-700)]">
                {part.category === "Filters" ? "Product Image" : part.category === "Keys" ? "Product Image" : "Assembly Illustration"}
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => setExploded(true)} aria-label="Zoom" className="p-1.5 rounded-lg hover:bg-white border border-transparent hover:border-black/5">
                  <ZoomIn className="w-3.5 h-3.5 text-[var(--ink-700)]" />
                </button>
                <button aria-label="Reset view" className="p-1.5 rounded-lg hover:bg-white border border-transparent hover:border-black/5">
                  <RefreshCw className="w-3.5 h-3.5 text-[var(--ink-700)]" />
                </button>
              </div>
            </div>
            <div className="aspect-[16/10] bg-white rounded-xl border border-black/5 relative overflow-hidden flex items-center justify-center">
              {part.category === "Filters" ? (
                <img src={filterImg} alt={`${part.description} product image`} loading="lazy" width={768} height={512} className="w-full h-full object-contain p-3" />
              ) : part.category === "Keys" ? (
                <img src={keyImg} alt={`${part.description} product image`} loading="lazy" width={768} height={512} className="w-full h-full object-contain p-3" />
              ) : (
                <AssemblyDiagram highlightId={part.refNo} />
              )}
              <div className="absolute bottom-2 left-2 px-2 py-1 rounded-full bg-[var(--brand-600)] text-white text-[10px] font-mono font-semibold shadow-soft">
                #{part.refNo} — {part.partNo}
              </div>
            </div>
          </div>

          <div className="md:col-span-2 rounded-2xl border border-black/5 bg-[var(--surface-1)] p-3">
            <div className="text-xs font-semibold text-[var(--ink-700)] mb-2">Attachments</div>
            <div className="space-y-1.5 max-h-[260px] overflow-y-auto scrollbar-thin pr-1">
              {attachments.map((a) => (
                <div key={a.name} className="flex items-center gap-2.5 p-2 rounded-xl bg-white border border-black/5 hover:border-[var(--brand-200)] transition">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${a.color}`}>
                    <a.icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[12px] font-medium text-[var(--ink-900)] truncate">{a.name}</div>
                    <div className="text-[10px] text-[var(--ink-500)]">{a.size}</div>
                  </div>
                  <button
                    onClick={() => {
                      if (a.type === "video") setVideo(true);
                      else if (a.type === "pdf") toast("Opening PDF preview…");
                      else if (a.type === "3d") toast("3D viewer coming soon");
                      else if (a.type === "image") toast("Opening image preview…");
                      else toast.success(`Downloading ${a.name}`);
                    }}
                    className="text-[11px] font-semibold text-[var(--brand-600)] hover:text-[var(--brand-700)] px-2 py-1 rounded-md hover:bg-[var(--brand-50)] inline-flex items-center gap-1 focus:outline-none focus:ring-2 focus:ring-[var(--brand-500)]"
                  >
                    {a.type === "doc" || a.type === "xlsx" ? <Download className="w-3 h-3" /> : a.type === "video" ? <Play className="w-3 h-3" /> : <ExternalLink className="w-3 h-3" />}
                    {a.action}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Alternates */}
        <div className="mt-4">
          <div className="text-xs font-semibold text-[var(--ink-700)] mb-2">Alternate parts customers also ordered</div>
          <div className="flex gap-2 overflow-x-auto scrollbar-thin pb-1">
            {alternates.map((a, i) => (
              <div key={a.partNo} className="shrink-0 w-40 rounded-xl border border-black/5 bg-white p-2 hover:border-[var(--brand-200)] transition">
                <div className="aspect-square rounded-lg bg-[var(--surface-1)] border border-black/5 mb-1.5 overflow-hidden"><PartThumb seed={i + 3} /></div>
                <div className="font-mono text-[11px] font-semibold text-[var(--brand-600)] truncate">{a.partNo}</div>
                <div className="mt-0.5">
                  <span className="text-[11px] text-[var(--ink-900)] font-semibold">${a.mrp.toFixed(2)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Exploded modal */}
      <AnimatePresence>
        {exploded && (
          <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-6" onClick={() => setExploded(false)}>
            <motion.div initial={{ scale: 0.96, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.96, opacity: 0 }}
              className="bg-white rounded-3xl p-6 max-w-4xl w-full shadow-soft-lg relative" onClick={(e) => e.stopPropagation()}>
              <button onClick={() => setExploded(false)} aria-label="Close" className="absolute top-3 right-3 p-2 rounded-full hover:bg-[var(--surface-2)]"><X className="w-4 h-4" /></button>
              <div className="text-sm font-semibold text-[var(--ink-900)] mb-3">
                {part.category === "Filters" || part.category === "Keys" ? `Product Image — ${part.description}` : `Exploded View — ${part.assembly}`}
              </div>
              <div className="aspect-video bg-[var(--surface-1)] rounded-2xl border border-black/5 flex items-center justify-center overflow-hidden">
                {part.category === "Filters" ? (
                  <img src={filterImg} alt={part.description} className="max-h-full max-w-full object-contain" />
                ) : part.category === "Keys" ? (
                  <img src={keyImg} alt={part.description} className="max-h-full max-w-full object-contain" />
                ) : (
                  <AssemblyDiagram highlightId={part.refNo} />
                )}
              </div>
              <p className="text-xs text-[var(--ink-500)] mt-3">
                {part.category === "Filters" || part.category === "Keys" ? "Reference image — actual product may vary slightly." : "Click any callout to navigate · Pinch / scroll to zoom"}
              </p>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Video modal */}
      <AnimatePresence>
        {video && (
          <div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-center justify-center p-6" onClick={() => setVideo(false)}>
            <motion.div initial={{ scale: 0.96, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.96, opacity: 0 }}
              className="bg-black rounded-2xl overflow-hidden max-w-3xl w-full shadow-soft-lg relative" onClick={(e) => e.stopPropagation()}>
              <button onClick={() => setVideo(false)} aria-label="Close" className="absolute top-3 right-3 z-10 p-2 rounded-full bg-black/50 text-white hover:bg-black/70"><X className="w-4 h-4" /></button>
              <video controls autoPlay className="w-full aspect-video bg-black" src="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4" />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </BotShell>
  );
}

export function OrderHeaderCard({ orderId, placed, items, total }: {
  orderId: string; placed: string; items: number; total: string;
}) {
  return (
    <BotShell>
      <div className="bg-white border border-black/[0.04] rounded-3xl rounded-tl-md p-4 shadow-soft w-full max-w-md">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-[10px] uppercase tracking-wider text-[var(--ink-500)] font-semibold">Most Recent Order</div>
            <div className="font-mono font-bold text-[var(--brand-600)] text-base">#{orderId}</div>
            <div className="text-xs text-[var(--ink-500)] mt-0.5">Placed {placed} · {items} line items</div>
          </div>
          <div className="text-right">
            <div className="text-sm font-semibold text-[var(--ink-900)]">{total}</div>
            <button className="text-[11px] text-[var(--brand-600)] hover:underline inline-flex items-center gap-1 mt-0.5">
              View order details <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    </BotShell>
  );
}

export function EtaPendingCard({ orderId, onCreateTicket, onCheckLater }: {
  orderId: string; onCreateTicket: () => void; onCheckLater: () => void;
}) {
  return (
    <BotShell>
      <div className="bg-white border border-amber-200 rounded-3xl rounded-tl-md p-4 shadow-soft w-full max-w-md">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5 text-amber-600" />
          </div>
          <div className="flex-1">
            <div className="font-semibold text-[var(--ink-900)] text-sm flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600" /> ETA not available yet
            </div>
            <p className="text-xs text-[var(--ink-500)] mt-1 leading-relaxed">
              This usually happens when the shipment was just dispatched and the carrier hasn't synced tracking info for order <span className="font-mono text-[var(--brand-600)]">#{orderId}</span>.
            </p>
            <div className="flex flex-wrap gap-2 mt-3">
              <button onClick={onCreateTicket} className="bg-gradient-brand text-white text-xs font-semibold px-3.5 py-2 rounded-full inline-flex items-center gap-1.5 shadow-soft focus:outline-none focus:ring-2 focus:ring-[var(--brand-500)] focus:ring-offset-2">
                <TicketIcon className="w-3.5 h-3.5" /> Create a Ticket
              </button>
              <button onClick={onCheckLater} className="bg-white text-[var(--ink-700)] border border-black/10 text-xs font-semibold px-3.5 py-2 rounded-full inline-flex items-center gap-1.5 hover:bg-[var(--surface-2)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-500)] focus:ring-offset-2">
                <RefreshCw className="w-3.5 h-3.5" /> Check again in 1 hour
              </button>
            </div>
          </div>
        </div>
      </div>
    </BotShell>
  );
}

export function TrackingCardEx({ orderId, eta }: { orderId: string; eta: string }) {
  const steps = [
    { label: "Order Placed", time: "Mon, 12 May · 10:14 AM", state: "done" },
    { label: "Warehouse Picked", time: "Mon, 12 May · 4:32 PM", state: "done" },
    { label: "In Transit", time: "Tue, 13 May · 9:08 AM", state: "done" },
    { label: "Out for Delivery", time: "Today · 7:45 AM", state: "current" },
    { label: "Delivered", time: "Pending", state: "pending" },
  ] as const;
  const [notify, setNotify] = useState(false);
  return (
    <BotShell>
      <div className="bg-white border border-black/[0.04] rounded-3xl rounded-tl-md p-4 shadow-soft w-full max-w-md">
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <div>
            <div className="text-[10px] uppercase tracking-wider text-[var(--ink-500)] font-semibold">Order</div>
            <div className="font-mono font-semibold text-[var(--brand-600)]">#{orderId}</div>
          </div>
          <span className="px-2.5 py-1 rounded-full bg-[var(--brand-50)] text-[var(--brand-700)] border border-[var(--brand-200)] text-xs font-semibold inline-flex items-center gap-1">
            <Truck className="w-3 h-3" /> ETA: {eta}
          </span>
        </div>
        <ol className="space-y-3">
          {steps.map((s, i) => {
            const isCurrent = s.state === "current";
            const isDone = s.state === "done";
            return (
              <li key={i} className="flex gap-3">
                <div className="relative flex flex-col items-center">
                  <span className={`w-3 h-3 rounded-full ${
                    isDone ? "bg-emerald-500" : isCurrent ? "bg-[var(--info-500)] ring-4 ring-blue-100 animate-pulse" : "border-2 border-[var(--ink-300)] bg-white"
                  }`} />
                  {i < steps.length - 1 && <span className={`w-px flex-1 ${isDone ? "bg-emerald-200" : "bg-gray-200"} mt-1`} />}
                </div>
                <div className="pb-2 flex-1">
                  <div className={`text-sm font-medium ${isCurrent ? "text-[var(--info-500)]" : "text-[var(--ink-900)]"}`}>{s.label}</div>
                  <div className="text-xs text-[var(--ink-500)] flex items-center gap-1 mt-0.5">
                    <Clock className="w-3 h-3" /> {s.time}
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
        <div className="mt-3 pt-3 border-t border-black/5 flex items-center justify-between gap-2 flex-wrap">
          <a className="text-xs text-[var(--brand-600)] font-medium inline-flex items-center gap-1 hover:underline" href="#">
            <MapPin className="w-3 h-3" /> Track on FedEx
          </a>
          <label className="text-xs text-[var(--ink-700)] inline-flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={notify} onChange={(e) => { setNotify(e.target.checked); if (e.target.checked) toast.success("We'll notify you on delivery"); }} className="accent-[var(--brand-600)]" />
            <Bell className="w-3 h-3" /> Notify me on delivery
          </label>
        </div>
      </div>
    </BotShell>
  );
}

// ---------- Accessories (Filter / Key) hierarchy ----------
export function AccessoryPickerCard({
  kind: initialKind,
  onPick,
}: {
  kind: "Filter" | "Key";
  onPick: (kind: "Filter" | "Key", series: string) => void;
}) {
  const [kind, setKind] = useState<"Filter" | "Key">(initialKind);
  const [search, setSearch] = useState("");
  const list = accessorySeries.filter((s) => s.toLowerCase().includes(search.toLowerCase()));
  return (
    <BotShell>
      <div className="bg-white border border-black/[0.04] rounded-3xl rounded-tl-md p-4 shadow-soft w-full max-w-md">
        <div className="flex items-center gap-2 mb-3">
          {(["Filter", "Key"] as const).map((k) => (
            <button
              key={k}
              onClick={() => setKind(k)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold border transition ${
                kind === k
                  ? "bg-[var(--brand-600)] text-white border-[var(--brand-600)] shadow-soft"
                  : "bg-white text-[var(--ink-700)] border-black/10 hover:bg-[var(--brand-50)]"
              }`}
            >
              {k} List
            </button>
          ))}
        </div>
        <div className="text-[11px] uppercase tracking-wider text-[var(--ink-500)] font-semibold mb-2">
          Choose Series
        </div>
        <div className="flex items-center gap-1.5 bg-[var(--surface-1)] border border-black/5 rounded-full px-3 py-1.5 mb-2">
          <Search className="w-3.5 h-3.5 text-[var(--ink-500)]" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search series…"
            className="bg-transparent text-xs outline-none flex-1"
          />
        </div>
        <div className="grid grid-cols-2 gap-1.5 max-h-56 overflow-y-auto scrollbar-thin pr-1">
          {list.map((s) => (
            <button
              key={s}
              onClick={() => onPick(kind, s)}
              className="text-left text-xs px-3 py-2 rounded-xl border border-black/5 hover:bg-[var(--brand-50)] hover:border-[var(--brand-200)] hover:text-[var(--brand-700)] transition flex items-center justify-between"
            >
              <span className="truncate">{s}</span>
              <ChevronRight className="w-3 h-3 text-[var(--ink-500)] shrink-0" />
            </button>
          ))}
        </div>
      </div>
    </BotShell>
  );
}

export function AccessoryListCard({
  kind,
  series,
  items,
  onSelect,
}: {
  kind: "Filter" | "Key";
  series: string;
  items: PartItem[];
  onSelect: (p: PartItem) => void;
}) {
  return (
    <BotShell>
      <div className="bg-white border border-black/[0.04] rounded-3xl rounded-tl-md p-4 shadow-soft w-full max-w-2xl">
        <div className="text-sm text-[var(--ink-700)] mb-3">
          {kind} List → <strong className="text-[var(--ink-900)]">{series}</strong> · {items.length} items
        </div>
        <div className="space-y-2">
          {items.map((p) => (
            <button
              key={p.partNo}
              onClick={() => onSelect(p)}
              className="w-full flex items-center gap-3 p-3 rounded-2xl border border-black/5 hover:bg-[var(--brand-50)]/40 hover:border-[var(--brand-200)] hover:shadow-soft transition text-left"
            >
              <div className="w-12 h-12 rounded-xl bg-[var(--surface-1)] border border-black/5 shrink-0 flex items-center justify-center text-[10px] text-[var(--ink-500)] font-mono">
                #{p.refNo}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-mono text-[13px] font-semibold text-[var(--brand-600)] truncate">{p.partNo}</div>
                <div className="text-sm text-[var(--ink-900)] mt-0.5 truncate">{p.description}</div>
                <div className="text-[11px] text-[var(--ink-500)] mt-0.5 truncate">{p.aggregate} · {p.assembly}</div>
              </div>
              <div className="text-right shrink-0">
                <div className="text-[10px] text-[var(--ink-500)] uppercase">MRP</div>
                <div className="text-sm font-semibold text-[var(--ink-900)]">${p.mrp.toFixed(2)}</div>
              </div>
              <ChevronRight className="w-4 h-4 text-[var(--ink-500)] shrink-0" />
            </button>
          ))}
        </div>
      </div>
    </BotShell>
  );
}
