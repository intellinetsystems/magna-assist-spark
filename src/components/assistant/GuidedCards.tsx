import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mic, ChevronDown, ChevronRight, ChevronLeft, Search, Clock, Truck, MapPin, Bell, ExternalLink,
  AlertTriangle, Ticket as TicketIcon, RefreshCw, Play, FileText, Box, Image as ImageIcon,
  Download, CheckCircle2, Share2, Plus, ArrowRight, X, ZoomIn, Maximize2, Copy as CopyIcon, Mail, Printer, Camera, Paperclip,
} from "lucide-react";
import { BotShell } from "./MessageBubbles";
import { popularModels, moreModels, variantsByModel, partCategories, accessorySeries, attachmentCategories, modelsByAttachment, assembliesByVariant, defaultAssemblies, quickRefCategories, quickRefSubmodels, buildFilters, buildKeys, findSeries, findModelsBySeries, findAggregates, findAssembliesByAggregate, type PartItem } from "@/lib/flows";
import { toast } from "sonner";
import filterImg from "@/assets/accessory-filter.jpg";
import keyImg from "@/assets/accessory-key.jpg";
import backhoeValveFig from "@/assets/backhoe-valve-fig008.png";
import drawbarFig from "@/assets/swinging-drawbar-fig.png";

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

export function AttachmentPickerCard({ onSubmit }: { onSubmit: (attachment: string) => void }) {
  return (
    <BotShell>
      <div className="bg-white border border-black/[0.04] rounded-3xl rounded-tl-md p-4 shadow-soft w-full max-w-md">
        <div className="text-xs uppercase tracking-wider text-[var(--ink-500)] font-semibold mb-3">Attachment Category</div>
        <div className="grid grid-cols-2 gap-1.5">
          {attachmentCategories.map((a) => (
            <button
              key={a}
              onClick={() => onSubmit(a)}
              className="text-left text-xs px-3 py-2.5 rounded-xl border border-black/5 hover:bg-[var(--brand-50)] hover:border-[var(--brand-200)] hover:text-[var(--brand-700)] transition flex items-center justify-between"
            >
              <span className="truncate font-medium">{a}</span>
              <ChevronRight className="w-3 h-3 text-[var(--ink-500)] shrink-0" />
            </button>
          ))}
        </div>
      </div>
    </BotShell>
  );
}

export function ModelPickerCard({ attachment, onSubmit }: { attachment?: string; onSubmit: (model: string) => void }) {
  const [value, setValue] = useState("");
  const [showMore, setShowMore] = useState(false);
  const filtered = attachment ? (modelsByAttachment[attachment] ?? popularModels) : popularModels;
  const submit = (m: string) => onSubmit(m.trim());
  return (
    <BotShell>
      <div className="bg-white border border-black/[0.04] rounded-3xl rounded-tl-md p-4 shadow-soft w-full max-w-md">
        <div className="text-xs uppercase tracking-wider text-[var(--ink-500)] font-semibold mb-2">
          {attachment ? `${attachment} — Vehicle Model` : "Vehicle Model"}
        </div>
        <VoiceInput value={value} onChange={setValue} placeholder="Search model or speak…" onSubmit={() => value && submit(value)} />
        <div className="flex flex-wrap gap-2 mt-3">
          {filtered.map((m) => <Chip key={m} label={m} onClick={() => submit(m)} />)}
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

export function AssemblyPickerCard({ model, variant, onSubmit }: { model: string; variant: string; onSubmit: (figure: string, label: string) => void }) {
  const list = assembliesByVariant[variant] ?? defaultAssemblies;
  return (
    <BotShell>
      <div className="bg-white border border-black/[0.04] rounded-3xl rounded-tl-md p-4 shadow-soft w-full max-w-md">
        <div className="text-xs uppercase tracking-wider text-[var(--ink-500)] font-semibold mb-1">Assembly / Figure</div>
        <div className="text-[11px] text-[var(--ink-500)] mb-3">{model} <span className="text-[var(--ink-300)]">/</span> {variant}</div>
        <div className="space-y-1.5">
          {list.map((a) => (
            <button
              key={a.figure}
              onClick={() => onSubmit(a.figure, a.label)}
              className="w-full text-left text-xs px-3 py-2.5 rounded-xl border border-black/5 hover:bg-[var(--brand-50)] hover:border-[var(--brand-200)] hover:text-[var(--brand-700)] transition flex items-center justify-between gap-2"
            >
              <span className="truncate font-medium">{a.label}</span>
              <ChevronRight className="w-3 h-3 text-[var(--ink-500)] shrink-0" />
            </button>
          ))}
        </div>
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
  const [headerOpen, setHeaderOpen] = useState(true);
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);
  const [lightbox, setLightbox] = useState<number | null>(null);
  void query; void model; void variant;

  // Pad/limit to 7 rows for the demo visual
  const rows = (items.length >= 1 ? items : items).slice(0, 7);
  while (rows.length < 5 && items.length > 0) rows.push(items[0]);

  const actions = [
    { Icon: Maximize2, label: "Fullscreen" },
    { Icon: CopyIcon, label: "Copy" },
    { Icon: Download, label: "Download" },
    { Icon: Mail, label: "Email" },
    { Icon: Share2, label: "Share" },
    { Icon: Printer, label: "Print" },
  ];

  return (
    <BotShell>
      <div
        className="bg-white rounded-[10px] w-full max-w-3xl overflow-hidden"
        style={{ border: "1px solid #F4C6CB", boxShadow: "0px 2px 8px rgba(0,0,0,0.05)" }}
      >
        {/* Pink header */}
        <button
          onClick={() => setHeaderOpen((v) => !v)}
          className="w-full flex items-center justify-between px-4 py-3 text-left"
          style={{ background: "#FDEBEC" }}
        >
          <span className="font-semibold text-[14px] text-[var(--ink-900)]">Part Details</span>
          <ChevronDown className={`w-4 h-4 text-[var(--ink-700)] transition-transform ${headerOpen ? "" : "-rotate-90"}`} />
        </button>

        {headerOpen && (
          <div className="p-4">
            <p className="text-[13px] text-[var(--ink-700)] leading-relaxed">
              I found all the below parts. Can you please select the one you want to proceed ahead?
            </p>

            <div className="flex items-center justify-between mt-4 mb-2">
              <div className="text-[13px] font-semibold tracking-wide text-[var(--ink-900)]">
                {rows.length} PARTS FOUND
              </div>
              <button className="text-[12px] text-[var(--ink-700)] inline-flex items-center gap-1 hover:text-[var(--brand-600)]">
                Sort : <span className="font-medium">Relevance</span>
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Rows */}
            <div className="rounded-[10px] overflow-hidden" style={{ border: "1px solid #F4C6CB" }}>
              {rows.map((p, i) => {
                const isExpanded = expandedIdx === i;
                return (
                  <div key={i} className={i > 0 ? "border-t" : ""} style={i > 0 ? { borderColor: "#F4C6CB" } : undefined}>
                    <button
                      onClick={() => setExpandedIdx(isExpanded ? null : i)}
                      className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 transition"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="text-[14px]">
                          <span className="font-mono font-semibold" style={{ color: "#E31837" }}>{p.partNo}</span>
                          <span className="text-[var(--ink-700)]"> - {p.description.toUpperCase()}</span>
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-[12px] text-[var(--ink-700)]">
                          <span className="uppercase tracking-wide">{p.model || "05 Series"}</span>
                          <span className="inline-flex items-center gap-1" style={{ color: "#28A745" }}>
                            <CheckCircle2 className="w-3 h-3" /> In stock
                          </span>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-[10px] text-[var(--ink-500)] uppercase tracking-wide">MRP</div>
                        <div className="text-[13px] font-semibold text-[var(--ink-900)]">{p.mrp.toFixed(2)}</div>
                      </div>
                      <ChevronRight className={`w-4 h-4 shrink-0 transition-transform ${isExpanded ? "rotate-90" : ""}`} style={{ color: "#E31837" }} />
                    </button>

                    {isExpanded && (
                      <div className="px-4 pb-4 pt-1 bg-white">
                        {/* Metadata: 3 columns */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-4 gap-y-3 mt-2">
                          <MetaItem label="CATEGORY" value={p.category || "Quick Reference"} />
                          <MetaItem label="VEHICLE" value={p.vehicle || "Filter List"} />
                          <MetaItem label="AGGREGATE" value={p.aggregate || "3505"} />
                          <MetaItem label="GROUP NO." value={p.groupNo || "QRF-05 Series 3505-fig 101"} />
                          <MetaItem label="ASSEMBLY" value={p.assembly || "Filter List - 3505"} />
                        </div>

                        {/* EPC + Images */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
                          {/* EPC */}
                          <div className="rounded-[10px] p-2 relative bg-white" style={{ border: "1px solid #F4C6CB" }}>
                            <button
                              onClick={() => setLightbox(0)}
                              className="absolute top-2 right-2 z-10 p-1 rounded bg-white/90 hover:bg-white"
                              style={{ border: "1px solid #F4C6CB", color: "#E31837" }}
                              aria-label="Expand diagram"
                            >
                              <Maximize2 className="w-3.5 h-3.5" />
                            </button>
                            <div className="aspect-[4/3] bg-white flex items-center justify-center overflow-hidden">
                              <img src={backhoeValveFig} alt="EPC exploded view" className="w-full h-full object-contain" />
                            </div>
                          </div>

                          {/* Images gallery */}
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <div className="text-[12px] font-semibold text-[var(--ink-700)] inline-flex items-center gap-1.5">
                                <Camera className="w-3.5 h-3.5" style={{ color: "#E31837" }} /> Images
                              </div>
                            </div>
                            <ImageStrip onOpen={(idx) => setLightbox(idx + 1)} />
                          </div>
                        </div>

                        {/* Attachments */}
                        <div className="mt-4">
                          <div className="flex items-center justify-between mb-2">
                            <div className="text-[12px] font-semibold text-[var(--ink-700)] inline-flex items-center gap-1.5">
                              <Paperclip className="w-3.5 h-3.5" style={{ color: "#E31837" }} /> Attachments
                            </div>
                          </div>
                          <AttachmentStrip />
                        </div>

                        <div className="mt-4">
                          <button
                            onClick={() => onSelect(p)}
                            className="text-[12px] font-semibold inline-flex items-center gap-1 hover:underline"
                            style={{ color: "#E31837" }}
                          >
                            Proceed with this part <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Bottom action toolbar */}
            <div className="flex items-center gap-1 mt-3">
              {actions.map((a) => (
                <button
                  key={a.label}
                  title={a.label}
                  onClick={() => toast(a.label)}
                  className="p-1.5 rounded hover:bg-[#FDEBEC] transition"
                  aria-label={a.label}
                >
                  <a.Icon className="w-4 h-4" style={{ color: "#E31837" }} />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {lightbox !== null && (
          <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-6" onClick={() => setLightbox(null)}>
            <motion.div
              initial={{ scale: 0.96, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.96, opacity: 0 }}
              className="bg-white rounded-2xl p-4 max-w-4xl w-full relative"
              onClick={(e) => e.stopPropagation()}
            >
              <button onClick={() => setLightbox(null)} className="absolute top-3 right-3 p-1.5 rounded-full hover:bg-gray-100">
                <X className="w-4 h-4" />
              </button>
              <div className="aspect-video flex items-center justify-center">
                <img src={backhoeValveFig} alt="Preview" className="max-w-full max-h-full object-contain" />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </BotShell>
  );
}

function MetaItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <div className="text-[10px] uppercase tracking-wider text-[var(--ink-500)] font-medium">{label}</div>
      <div className="text-[13px] text-[var(--ink-900)] font-semibold uppercase mt-0.5 break-words">{value}</div>
    </div>
  );
}

function ImageStrip({ onOpen }: { onOpen: (i: number) => void }) {
  const [idx, setIdx] = useState(0);
  const count = 4;
  return (
    <div className="relative">
      <div className="grid grid-cols-4 gap-2">
        {Array.from({ length: count }).map((_, i) => (
          <button
            key={i}
            onClick={() => onOpen(i)}
            className="aspect-square rounded-[10px] overflow-hidden bg-white hover:opacity-90 transition"
            style={{ border: "1px solid #F4C6CB" }}
          >
            <img src={backhoeValveFig} alt={`Part image ${i + 1}`} className="w-full h-full object-contain p-1" />
          </button>
        ))}
      </div>
      <button
        onClick={() => setIdx((v) => Math.max(0, v - 1))}
        className="absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-white shadow flex items-center justify-center"
        style={{ border: "1px solid #F4C6CB", color: "#E31837" }}
        aria-label="Previous"
      >
        <ChevronLeft className="w-3.5 h-3.5" />
      </button>
      <button
        onClick={() => setIdx((v) => Math.min(count - 1, v + 1))}
        className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-white shadow flex items-center justify-center"
        style={{ border: "1px solid #F4C6CB", color: "#E31837" }}
        aria-label="Next"
      >
        <ChevronRight className="w-3.5 h-3.5" />
      </button>
      <div className="sr-only">Showing image {idx + 1}</div>
    </div>
  );
}

function AttachmentStrip() {
  const items = [
    { Icon: FileText, label: "PDF", color: "#D32F2F" },
    { Icon: Box, label: "3D", color: "#3F51B5" },
    { Icon: FileText, label: "DOC", color: "#1976D2" },
    { Icon: FileText, label: "XLS", color: "#2E7D32" },
    { Icon: FileText, label: "PPT", color: "#E64A19" },
  ];
  return (
    <div className="relative">
      <div className="grid grid-cols-4 gap-2">
        {items.slice(0, 4).map((a) => (
          <button
            key={a.label}
            onClick={() => toast(`Opening ${a.label}`)}
            className="aspect-square rounded-[10px] bg-white flex flex-col items-center justify-center gap-1 hover:bg-[#FDEBEC] transition"
            style={{ border: "1px solid #F4C6CB" }}
          >
            <a.Icon className="w-7 h-7" style={{ color: a.color }} />
            <span className="text-[10px] font-semibold text-[var(--ink-700)]">{a.label}</span>
          </button>
        ))}
      </div>
      <button
        className="absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-white shadow flex items-center justify-center"
        style={{ border: "1px solid #F4C6CB", color: "#E31837" }}
        aria-label="Previous"
      >
        <ChevronLeft className="w-3.5 h-3.5" />
      </button>
      <button
        className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-white shadow flex items-center justify-center"
        style={{ border: "1px solid #F4C6CB", color: "#E31837" }}
        aria-label="Next"
      >
        <ChevronRight className="w-3.5 h-3.5" />
      </button>
    </div>
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
  // Note: the illustration image itself highlights the relevant part in red,
  // so we don't draw an additional CSS overlay ring on top.
  void callouts; void highlightId;
  return (
    <div className="relative w-full h-full">
      <img
        src={backhoeValveFig}
        alt="Backhoe Valve, Fittings & Hardware (1526B - FIG 008) illustration"
        className="w-full h-full object-contain select-none"
        draggable={false}
      />
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

export function PartDetailCard({ part, onCreateTicket }: { part: PartItem; onCreateTicket?: (part: PartItem) => void }) {
  const outOfStock = part.inStock <= 0;
  const [exploded, setExploded] = useState(false);
  const [video, setVideo] = useState(false);
  const isDrawbar = /DRAWBAR/i.test(part.figure);
  const pillColor = part.highlight === "purple" || isDrawbar ? "bg-purple-600" : "bg-[var(--brand-600)]";
  const attachments = [
    { type: "video", icon: Play, name: "Install_Guide.mp4", size: "12.4 MB", color: "text-[var(--brand-600)] bg-[var(--brand-50)]", action: "Watch" },
    { type: "pdf", icon: FileText, name: "Spec_Sheet.pdf", size: "840 KB", color: "text-rose-600 bg-rose-50", action: "Open" },
    { type: "doc", icon: FileText, name: "Service_Notes.docx", size: "120 KB", color: "text-blue-600 bg-blue-50", action: "Download" },
    { type: "xlsx", icon: FileText, name: "Compatibility.xlsx", size: "64 KB", color: "text-emerald-600 bg-emerald-50", action: "Download" },
    { type: "3d", icon: Box, name: "Model.glb", size: "3.2 MB", color: "text-indigo-600 bg-indigo-50", action: "View 3D" },
    { type: "image", icon: ImageIcon, name: "Hi-res_Photos", size: "4 images", color: "text-amber-600 bg-amber-50", action: "Preview" },
  ];

  return (
    <BotShell>
      <div className="@container bg-white border border-black/[0.04] rounded-3xl rounded-tl-md p-5 shadow-soft w-full max-w-3xl">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-lg font-bold text-[var(--brand-600)]">{part.partNo}</span>
              {outOfStock ? (
                <span className="px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 text-[11px] font-medium inline-flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" /> Out of Stock
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-medium inline-flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> In Stock — {part.inStock} units
                </span>
              )}
            </div>
            <div className="text-[15px] font-semibold text-[var(--ink-900)] mt-0.5">{part.description}</div>
          </div>
          <div className="flex items-center gap-2">
            {outOfStock ? (
              <button
                onClick={() => onCreateTicket?.(part)}
                className="bg-rose-600 text-white text-sm font-semibold rounded-full px-4 py-2 inline-flex items-center gap-2 shadow-soft hover:bg-rose-700 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-2"
              >
                <TicketIcon className="w-4 h-4" /> Create Ticket
              </button>
            ) : (
              <button onClick={() => toast.success("Added to order")} className="bg-gradient-brand text-white text-sm font-semibold rounded-full px-4 py-2 inline-flex items-center gap-2 shadow-soft hover:opacity-95 focus:outline-none focus:ring-2 focus:ring-[var(--brand-500)] focus:ring-offset-2">
                <Plus className="w-4 h-4" /> Add to Order
              </button>
            )}
          </div>
        </div>

        {/* AI tags removed per spec */}

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
        <div className="grid grid-cols-1 @[520px]:grid-cols-5 gap-3 mt-4">
          <div className="@[520px]:col-span-3 rounded-2xl border border-black/5 bg-[var(--surface-1)] p-3 relative">
            <div className="flex items-center justify-between mb-1">
              <div className="text-xs font-semibold text-[var(--ink-700)]">
                {part.isQuickRef || part.category === "Filters" || part.category === "Keys" ? "Product Image" : "Assembly Illustration"}
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
            <div className="aspect-[4/3] @[520px]:aspect-[16/10] bg-white rounded-xl border border-black/5 relative overflow-hidden flex items-center justify-center">
              {part.isQuickRef ? (
                <img
                  src={/key/i.test(part.category) || /key/i.test(part.description) ? keyImg : filterImg}
                  alt={`${part.description} product image`}
                  loading="lazy" width={768} height={512}
                  className="w-full h-full object-contain p-3"
                />
              ) : part.category === "Filters" ? (
                <img src={filterImg} alt={`${part.description} product image`} loading="lazy" width={768} height={512} className="w-full h-full object-contain p-3" />
              ) : part.category === "Keys" ? (
                <img src={keyImg} alt={`${part.description} product image`} loading="lazy" width={768} height={512} className="w-full h-full object-contain p-3" />
              ) : isDrawbar ? (
                <img src={drawbarFig} alt="Swinging Drawbar Attachment illustration (00 Series, 4500 2WD)" loading="lazy" className="w-full h-full object-contain p-2 select-none" draggable={false} />
              ) : (
                <AssemblyDiagram highlightId={part.refNo} />
              )}
              {!part.isQuickRef && (
                <div className={`absolute bottom-2 left-2 px-2 py-1 rounded-full ${pillColor} text-white text-[10px] font-mono font-semibold shadow-soft`}>
                  #{part.refNo} — {part.partNo}
                </div>
              )}
            </div>
          </div>

          <div className="@[520px]:col-span-2 rounded-2xl border border-black/5 bg-[var(--surface-1)] p-3">
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
                ) : isDrawbar ? (
                  <img src={drawbarFig} alt={part.assembly} className="max-h-full max-w-full object-contain" />
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
  orderId: string; onCreateTicket: () => void; onCheckLater: () => void; partNos?: string[];
}) {
  return (
    <BotShell>
      <div className="bg-white border border-amber-200 rounded-3xl rounded-tl-md p-4 shadow-soft w-full max-w-md">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5 text-amber-600" />
          </div>
          <div className="flex-1">
            <div className="font-semibold text-[var(--ink-900)] text-sm">ETA not available</div>
            <p className="text-xs text-[var(--ink-500)] mt-1">Order <span className="font-mono text-[var(--brand-600)]">#{orderId}</span> — would you like to raise a ticket for the same?</p>
            <div className="flex flex-wrap gap-2 mt-3">
              <button onClick={onCreateTicket} className="bg-emerald-600 text-white text-xs font-semibold px-4 py-2 rounded-full hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2">
                Yes
              </button>
              <button onClick={onCheckLater} className="bg-white text-[var(--ink-700)] border border-black/10 text-xs font-semibold px-4 py-2 rounded-full hover:bg-[var(--surface-2)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-500)] focus:ring-offset-2">
                No
              </button>
            </div>
          </div>
        </div>
      </div>
    </BotShell>
  );
}

export function OrderConfirmCard({ orderId, placed, parts, onYes, onNo }: {
  orderId: string; placed: string; parts: number; onYes: () => void; onNo: () => void;
}) {
  return (
    <BotShell>
      <div className="bg-white border border-black/[0.04] rounded-3xl rounded-tl-md p-4 shadow-soft w-full max-w-md">
        <div className="text-[10px] uppercase tracking-wider text-[var(--ink-500)] font-semibold">Last Order</div>
        <div className="font-mono font-bold text-[var(--brand-600)] text-base mt-0.5">#{orderId}</div>
        <div className="text-xs text-[var(--ink-700)] mt-1">Placed on <strong>{placed}</strong> · <strong>{parts}</strong> parts</div>
        <div className="text-[12px] text-[var(--ink-700)] mt-3 font-medium">Is this the order you are referring to?</div>
        <div className="flex gap-2 mt-2">
          <button onClick={onYes} className="bg-emerald-600 text-white text-xs font-semibold px-4 py-2 rounded-full hover:bg-emerald-700">Yes</button>
          <button onClick={onNo} className="bg-white text-[var(--ink-700)] border border-black/10 text-xs font-semibold px-4 py-2 rounded-full hover:bg-[var(--surface-2)]">No</button>
        </div>
      </div>
    </BotShell>
  );
}

export function TrackingCardEx({ orderId, eta, carrier = "FedEx", status, partNos }: {
  orderId: string; eta: string; carrier?: string; status?: string; partNos?: string[];
}) {
  const isInTransit = status === "In Transit";
  const steps = [
    { label: "Order Placed", time: "Mon, 12 May · 10:14 AM", state: "done" as const },
    { label: "Warehouse Picked", time: "Mon, 12 May · 4:32 PM", state: "done" as const },
    { label: "In Transit", time: "Tue, 13 May · 9:08 AM", state: isInTransit ? "current" as const : "done" as const },
    { label: "Out for Delivery", time: isInTransit ? "Pending" : "Today · 7:45 AM", state: isInTransit ? "pending" as const : "current" as const },
    { label: "Delivered", time: "Pending", state: "pending" as const },
  ];
  
  return (
    <BotShell>
      <div className="bg-white border border-black/[0.04] rounded-3xl rounded-tl-md p-4 shadow-soft w-full max-w-md">
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <div>
            <div className="text-[10px] uppercase tracking-wider text-[var(--ink-500)] font-semibold">Order · {carrier}</div>
            <div className="font-mono font-semibold text-[var(--brand-600)]">#{orderId}</div>
          </div>
          <span className="px-2.5 py-1 rounded-full bg-[var(--brand-50)] text-[var(--brand-700)] border border-[var(--brand-200)] text-xs font-semibold inline-flex items-center gap-1">
            <Truck className="w-3 h-3" /> ETA: {eta}
          </span>
        </div>
        {partNos && partNos.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-1">
            {partNos.map((p) => (
              <span key={p} className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-[var(--surface-2)] text-[var(--ink-700)] border border-black/5">{p}</span>
            ))}
          </div>
        )}
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
        <div className="mt-3 pt-3 border-t border-black/5">
          <a className="text-xs text-[var(--brand-600)] font-medium inline-flex items-center gap-1 hover:underline" href="#">
            <MapPin className="w-3 h-3" /> Track on {carrier}
          </a>
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

// ---------- Quick Reference (top-level catalogue browsing) ----------
export function QuickRefPickerCard({ onPick }: { onPick: (category: string) => void }) {
  const [search, setSearch] = useState("");
  const list = quickRefCategories.filter((c) => c.toLowerCase().includes(search.toLowerCase()));
  return (
    <BotShell>
      <div className="bg-white border border-black/[0.04] rounded-3xl rounded-tl-md p-4 shadow-soft w-full max-w-md">
        <div className="text-xs uppercase tracking-wider text-[var(--ink-500)] font-semibold mb-2">Quick Reference — Category</div>
        <div className="flex items-center gap-1.5 bg-[var(--surface-1)] border border-black/5 rounded-full px-3 py-1.5 mb-2">
          <Search className="w-3.5 h-3.5 text-[var(--ink-500)]" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search categories…" className="bg-transparent text-xs outline-none flex-1" />
        </div>
        <div className="grid grid-cols-1 gap-1 max-h-72 overflow-y-auto scrollbar-thin pr-1">
          {list.map((c) => (
            <button
              key={c}
              onClick={() => onPick(c)}
              className="text-left text-xs px-3 py-2 rounded-xl border border-black/5 hover:bg-[var(--brand-50)] hover:border-[var(--brand-200)] hover:text-[var(--brand-700)] transition flex items-center justify-between"
            >
              <span className="truncate font-medium">{c}</span>
              <ChevronRight className="w-3 h-3 text-[var(--ink-500)] shrink-0" />
            </button>
          ))}
        </div>
      </div>
    </BotShell>
  );
}

export function QuickRefSeriesCard({ category, onPick }: { category: string; onPick: (series: string) => void }) {
  return (
    <BotShell>
      <div className="bg-white border border-black/[0.04] rounded-3xl rounded-tl-md p-4 shadow-soft w-full max-w-md">
        <div className="text-xs uppercase tracking-wider text-[var(--ink-500)] font-semibold mb-1">{category}</div>
        <div className="text-[11px] text-[var(--ink-500)] mb-3">Choose a Series</div>
        <div className="grid grid-cols-2 gap-1.5 max-h-56 overflow-y-auto scrollbar-thin pr-1">
          {accessorySeries.map((s) => (
            <button
              key={s}
              onClick={() => onPick(s)}
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

export function QuickRefSubmodelCard({ category, series, onPick }: { category: string; series: string; onPick: (submodel: string) => void }) {
  const list = quickRefSubmodels[series] ?? [];
  return (
    <BotShell>
      <div className="bg-white border border-black/[0.04] rounded-3xl rounded-tl-md p-4 shadow-soft w-full max-w-md">
        <div className="text-xs uppercase tracking-wider text-[var(--ink-500)] font-semibold mb-1">{category} → {series}</div>
        <div className="text-[11px] text-[var(--ink-500)] mb-3">Choose a sub-model</div>
        <div className="grid grid-cols-2 gap-1.5 max-h-56 overflow-y-auto scrollbar-thin pr-1">
          {list.map((m) => (
            <button
              key={m}
              onClick={() => onPick(m)}
              className="text-left text-xs px-3 py-2 rounded-xl border border-black/5 hover:bg-[var(--brand-50)] hover:border-[var(--brand-200)] hover:text-[var(--brand-700)] transition flex items-center justify-between"
            >
              <span className="truncate font-medium">{m}</span>
              <ChevronRight className="w-3 h-3 text-[var(--ink-500)] shrink-0" />
            </button>
          ))}
        </div>
      </div>
    </BotShell>
  );
}

export function QuickRefListCard({ category, series, submodel, items, onSelect }: {
  category: string; series: string; submodel?: string; items: PartItem[]; onSelect: (p: PartItem) => void;
}) {
  return (
    <BotShell>
      <div className="bg-white border border-black/[0.04] rounded-3xl rounded-tl-md p-4 shadow-soft w-full max-w-2xl">
        <div className="text-sm text-[var(--ink-700)] mb-3">
          {category} → <strong className="text-[var(--ink-900)]">{series}{submodel ? ` → ${submodel}` : ""}</strong> · {items.length} items
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
                <div className="text-[11px] mt-0.5 truncate">
                  {p.inStock <= 0 ? <span className="text-rose-600 font-medium">Out of stock</span> : <span className="text-emerald-700">In stock — {p.inStock}</span>}
                </div>
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

export function NoResultsCard({ query, onCreateTicket }: { query: string; onCreateTicket: () => void }) {
  return (
    <BotShell>
      <div className="bg-white border border-rose-200 rounded-3xl rounded-tl-md p-4 shadow-soft w-full max-w-md">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-full bg-rose-50 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-4 h-4 text-rose-600" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold text-[var(--ink-900)]">No matches for "{query}"</div>
            <div className="text-xs text-[var(--ink-500)] mt-1">I couldn't find this part in the catalogue. Want me to raise a ticket so the parts team can confirm availability or suggest an alternate?</div>
            <button
              onClick={onCreateTicket}
              className="mt-3 bg-rose-600 text-white text-xs font-semibold rounded-full px-3 py-1.5 inline-flex items-center gap-1.5 shadow-soft hover:bg-rose-700"
            >
              <TicketIcon className="w-3.5 h-3.5" /> Create Ticket
            </button>
          </div>
        </div>
      </div>
    </BotShell>
  );
}

export function FindSeriesCard({ onPick }: { onPick: (series: string) => void }) {
  return (
    <BotShell>
      <div className="bg-white border border-black/[0.04] rounded-3xl rounded-tl-md p-4 shadow-soft w-full max-w-md">
        <div className="text-xs uppercase tracking-wider text-[var(--ink-500)] font-semibold mb-1">Find a Part</div>
        <div className="text-[11px] text-[var(--ink-500)] mb-3">Step 1 · Choose a Series</div>
        <div className="grid grid-cols-2 gap-1.5 max-h-56 overflow-y-auto scrollbar-thin pr-1">
          {findSeries.map((s) => (
            <button key={s} onClick={() => onPick(s)} className="text-left text-xs px-3 py-2 rounded-xl border border-black/5 hover:bg-[var(--brand-50)] hover:border-[var(--brand-200)] hover:text-[var(--brand-700)] transition flex items-center justify-between">
              <span className="truncate font-medium">{s}</span>
              <ChevronRight className="w-3 h-3 text-[var(--ink-500)] shrink-0" />
            </button>
          ))}
        </div>
      </div>
    </BotShell>
  );
}

export function FindModelCard({ series, onPick }: { series: string; onPick: (model: string) => void }) {
  const list = findModelsBySeries[series] ?? ["4500 2WD"];
  return (
    <BotShell>
      <div className="bg-white border border-black/[0.04] rounded-3xl rounded-tl-md p-4 shadow-soft w-full max-w-md">
        <div className="text-xs uppercase tracking-wider text-[var(--ink-500)] font-semibold mb-1">Find a Part → {series}</div>
        <div className="text-[11px] text-[var(--ink-500)] mb-3">Step 2 · Choose a Model</div>
        <div className="grid grid-cols-2 gap-1.5 max-h-56 overflow-y-auto scrollbar-thin pr-1">
          {list.map((m) => (
            <button key={m} onClick={() => onPick(m)} className="text-left text-xs px-3 py-2 rounded-xl border border-black/5 hover:bg-[var(--brand-50)] hover:border-[var(--brand-200)] hover:text-[var(--brand-700)] transition flex items-center justify-between">
              <span className="truncate font-medium">{m}</span>
              <ChevronRight className="w-3 h-3 text-[var(--ink-500)] shrink-0" />
            </button>
          ))}
        </div>
      </div>
    </BotShell>
  );
}

export function FindAggregateCard({ series, model, onPick }: { series: string; model: string; onPick: (aggregate: string) => void }) {
  return (
    <BotShell>
      <div className="bg-white border border-black/[0.04] rounded-3xl rounded-tl-md p-4 shadow-soft w-full max-w-md">
        <div className="text-xs uppercase tracking-wider text-[var(--ink-500)] font-semibold mb-1">{series} → {model}</div>
        <div className="text-[11px] text-[var(--ink-500)] mb-3">Step 3 · Choose an Aggregate</div>
        <div className="grid grid-cols-2 gap-1.5 max-h-64 overflow-y-auto scrollbar-thin pr-1">
          {findAggregates.map((a) => (
            <button key={a} onClick={() => onPick(a)} className="text-left text-xs px-3 py-2 rounded-xl border border-black/5 hover:bg-[var(--brand-50)] hover:border-[var(--brand-200)] hover:text-[var(--brand-700)] transition flex items-center justify-between">
              <span className="truncate font-medium">{a}</span>
              <ChevronRight className="w-3 h-3 text-[var(--ink-500)] shrink-0" />
            </button>
          ))}
        </div>
      </div>
    </BotShell>
  );
}

export function FindAssemblyCard({ series, model, aggregate, onPick }: { series: string; model: string; aggregate: string; onPick: (assembly: string) => void }) {
  const list = findAssembliesByAggregate[aggregate] ?? ["Main Assembly"];
  return (
    <BotShell>
      <div className="bg-white border border-black/[0.04] rounded-3xl rounded-tl-md p-4 shadow-soft w-full max-w-md">
        <div className="text-xs uppercase tracking-wider text-[var(--ink-500)] font-semibold mb-1">{series} → {model} → {aggregate}</div>
        <div className="text-[11px] text-[var(--ink-500)] mb-3">Step 4 · Choose an Assembly (Illustration)</div>
        <div className="space-y-1.5 max-h-64 overflow-y-auto scrollbar-thin pr-1">
          {list.map((a) => (
            <button key={a} onClick={() => onPick(a)} className="w-full text-left text-xs px-3 py-2 rounded-xl border border-black/5 hover:bg-[var(--brand-50)] hover:border-[var(--brand-200)] hover:text-[var(--brand-700)] transition flex items-center justify-between">
              <span className="truncate font-medium">{a}</span>
              <ChevronRight className="w-3 h-3 text-[var(--ink-500)] shrink-0" />
            </button>
          ))}
        </div>
      </div>
    </BotShell>
  );
}
