import { motion } from "framer-motion";
import { Sparkles, CheckCircle2, Copy, Truck, Package as PackageIcon, MapPin, Clock, ChevronRight, Image as ImageIcon, Paperclip, FileText, Box, BarChart3, ChevronDown, X, ChevronLeft, Eye } from "lucide-react";
import { useState } from "react";
import { FeedbackActions } from "./FeedbackActions";

function formatText(text: string) {
  // bold **x** and mono for codes (alphanumeric with dashes 6+ chars uppercase or part-no patterns)
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((p, i) => {
    if (p.startsWith("**") && p.endsWith("**")) {
      const inner = p.slice(2, -2);
      const isCode = /^[A-Z0-9-]{6,}$/.test(inner);
      return (
        <strong key={i} className={isCode ? "font-mono text-[var(--brand-600)]" : "font-semibold text-[var(--ink-900)]"}>
          {inner}
        </strong>
      );
    }
    return <span key={i}>{p}</span>;
  });
}

export function UserBubble({ text }: { text: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 24 }}
      className="flex justify-end mb-3"
    >
      <div className="max-w-[78%] bg-[var(--brand-100)] border border-[var(--brand-200)] text-[var(--ink-900)] rounded-3xl rounded-tr-md px-4 py-2.5 shadow-soft text-[14px] leading-relaxed">
        {formatText(text)}
      </div>
    </motion.div>
  );
}

export function BotShell({ children, showFeedback = true }: { children: React.ReactNode; showFeedback?: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 24 }}
      className="flex items-start gap-2 mb-3 pl-1"
    >
      <div className="w-7 h-7 rounded-full bg-gradient-brand flex items-center justify-center shadow-soft shrink-0 mt-1">
        <Sparkles className="w-4 h-4 text-white" strokeWidth={2} />
      </div>
      <div className="flex-1 min-w-0">
        {children}
        {showFeedback && <FeedbackActions />}
      </div>
    </motion.div>
  );
}

export function BotText({ text }: { text: string }) {
  return (
    <BotShell>
      <div className="inline-block max-w-full bg-white border border-black/[0.04] rounded-3xl rounded-tl-md px-4 py-2.5 shadow-soft text-[14px] leading-relaxed text-[var(--ink-700)] whitespace-pre-line">
        {formatText(text)}
      </div>
    </BotShell>
  );
}

export function TypingBubble() {
  return (
    <BotShell>
      <div className="inline-flex bg-white border border-black/[0.04] rounded-3xl rounded-tl-md px-4 py-3 shadow-soft items-center gap-1.5">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-[var(--brand-500)] animate-typing"
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </div>
    </BotShell>
  );
}

export function PriorityCard({ onSelect }: { onSelect: (p: string) => void }) {
  const [selected, setSelected] = useState<string | null>("High");
  const opts = ["Low", "Medium", "High", "Critical"];
  return (
    <BotShell>
      <div className="bg-white border border-black/[0.04] rounded-3xl rounded-tl-md px-4 py-3 shadow-soft inline-block">
        <div className="text-xs text-[var(--ink-500)] mb-2 uppercase tracking-wider">Select priority</div>
        <div className="flex flex-wrap gap-2">
          {opts.map((o) => {
            const active = selected === o;
            return (
              <button
                key={o}
                onClick={() => {
                  setSelected(o);
                  onSelect(o);
                }}
                className={`px-3.5 py-1.5 rounded-full text-xs font-medium border transition ${
                  active
                    ? "bg-[var(--brand-600)] text-white border-[var(--brand-600)] shadow-soft"
                    : "bg-white text-[var(--ink-700)] border-black/10 hover:bg-[var(--brand-50)] hover:border-[var(--brand-200)]"
                }`}
              >
                {o}
              </button>
            );
          })}
        </div>
      </div>
    </BotShell>
  );
}

export function TicketCard({ ticketId }: { ticketId: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <BotShell>
      <div className="bg-white border border-black/[0.04] rounded-3xl rounded-tl-md p-4 shadow-soft max-w-md">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          </div>
          <div className="flex-1">
            <div className="font-semibold text-[var(--ink-900)] text-[15px]">Ticket Created Successfully!</div>
            <div className="mt-1.5 flex items-center gap-2 text-sm">
              <span className="text-[var(--ink-500)]">Ticket ID:</span>
              <span className="font-mono font-semibold text-[var(--brand-600)]">{ticketId}</span>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(ticketId);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 1400);
                }}
                className="p-1 rounded-md hover:bg-[var(--brand-50)] text-[var(--ink-500)] hover:text-[var(--brand-600)] transition"
              >
                <Copy className="w-3.5 h-3.5" />
              </button>
              {copied && <span className="text-xs text-emerald-600">Copied</span>}
            </div>
            <p className="text-sm text-[var(--ink-500)] mt-2">Our team will review and update you shortly.</p>
          </div>
        </div>
      </div>
    </BotShell>
  );
}

export function TrackingCard({ orderId }: { orderId: string }) {
  const steps = [
    { label: "Order Placed", time: "Mon, 12 May · 10:14 AM", state: "done" },
    { label: "Warehouse Picked", time: "Mon, 12 May · 4:32 PM", state: "done" },
    { label: "In Transit", time: "Tue, 13 May · 9:08 AM", state: "done" },
    { label: "Out for Delivery", time: "Today · 7:45 AM", state: "current" },
    { label: "Delivered", time: "Pending", state: "pending" },
  ] as const;
  return (
    <BotShell>
      <div className="bg-white border border-black/[0.04] rounded-3xl rounded-tl-md p-4 shadow-soft w-full max-w-md">
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="text-xs text-[var(--ink-500)] uppercase tracking-wider">Order</div>
            <div className="font-mono font-semibold text-[var(--brand-600)]">#{orderId}</div>
          </div>
          <span className="px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-xs font-medium inline-flex items-center gap-1">
            <Truck className="w-3 h-3" /> Out for Delivery
          </span>
        </div>
        <ol className="space-y-3">
          {steps.map((s, i) => {
            const isCurrent = s.state === "current";
            const isDone = s.state === "done";
            return (
              <li key={i} className="flex gap-3">
                <div className="relative flex flex-col items-center">
                  <span
                    className={`w-3 h-3 rounded-full ring-4 ${
                      isDone
                        ? "bg-emerald-500 ring-emerald-100"
                        : isCurrent
                        ? "bg-[var(--info-500)] ring-blue-100 animate-pulse"
                        : "bg-gray-300 ring-gray-100"
                    }`}
                  />
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
        <div className="mt-3 pt-3 border-t border-black/5 grid grid-cols-2 gap-2 text-xs">
          <div>
            <div className="text-[var(--ink-500)]">Method</div>
            <div className="text-[var(--ink-900)] font-medium flex items-center gap-1">
              <PackageIcon className="w-3 h-3" /> M011 FedEx Ground
            </div>
          </div>
          <div>
            <div className="text-[var(--ink-500)]">Tracking</div>
            <div className="font-mono text-[var(--brand-600)] font-semibold flex items-center gap-1">
              <MapPin className="w-3 h-3" /> BD9984621
            </div>
          </div>
        </div>
      </div>
    </BotShell>
  );
}

const partImages = [
  "KMW67091023.JPG",
  "KMW67091024.JPG",
  "KMW67091025.JPG",
  "KMW67091026.JPG",
];

export function PartCard() {
  const [lightbox, setLightbox] = useState<number | null>(null);
  return (
    <BotShell>
      <div className="bg-white border border-black/[0.04] rounded-3xl rounded-tl-md p-4 shadow-soft w-full max-w-3xl">
        <div className="flex items-center justify-between mb-3">
          <div className="text-sm text-[var(--ink-700)]">
            I found <strong className="text-[var(--ink-900)]">1/8 results</strong>
          </div>
          <button className="text-xs px-3 py-1.5 rounded-full border border-black/10 inline-flex items-center gap-1 hover:bg-[var(--brand-50)] hover:border-[var(--brand-200)]">
            XEV 9E THREE SELECT <ChevronDown className="w-3 h-3" />
          </button>
        </div>

        <div className="overflow-x-auto rounded-xl border border-black/5">
          <table className="w-full text-xs">
            <thead className="bg-[var(--surface-1)] text-[var(--ink-500)] uppercase tracking-wider">
              <tr>
                {["Category", "Vehicle", "Model", "Aggregate", "Group No.", "Assembly", "Part No.", "Description", "Cost (USD)", "MRP (USD)"].map((h) => (
                  <th key={h} className="text-left px-3 py-2 font-medium whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr className="border-t border-black/5 hover:bg-[var(--brand-50)]/30">
                <td className="px-3 py-2.5 text-[var(--ink-700)]">Brakes</td>
                <td className="px-3 py-2.5 text-[var(--ink-700)]">SUV</td>
                <td className="px-3 py-2.5 text-[var(--ink-700)]">XEV 9E</td>
                <td className="px-3 py-2.5 text-[var(--ink-700)]">Front Axle</td>
                <td className="px-3 py-2.5 font-mono text-[var(--ink-700)]">G-1041</td>
                <td className="px-3 py-2.5 text-[var(--ink-700)]">Disc Pad</td>
                <td className="px-3 py-2.5 font-mono text-[var(--brand-600)] font-semibold whitespace-nowrap">S0601D010111N</td>
                <td className="px-3 py-2.5 text-[var(--ink-700)]">Front Brake Pad Set</td>
                <td className="px-3 py-2.5 text-[var(--ink-900)] font-medium">$ 42.10</td>
                <td className="px-3 py-2.5 text-[var(--ink-900)] font-medium">$ 58.00</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
          {/* Images */}
          <div className="rounded-xl border border-black/5 p-3 bg-[var(--surface-1)]">
            <div className="text-xs font-semibold text-[var(--ink-700)] mb-2 flex items-center gap-1.5">
              <ImageIcon className="w-3.5 h-3.5" /> Images
            </div>
            <div className="grid grid-cols-4 gap-2">
              {partImages.map((name, i) => (
                <button
                  key={name}
                  onClick={() => setLightbox(i)}
                  className="aspect-square rounded-lg overflow-hidden border border-black/5 bg-white hover:ring-2 hover:ring-[var(--brand-500)] transition relative"
                >
                  <PartThumb seed={i} />
                </button>
              ))}
            </div>
          </div>
          {/* Attachments */}
          <div className="rounded-xl border border-black/5 p-3 bg-[var(--surface-1)]">
            <div className="flex items-center justify-between mb-2">
              <div className="text-xs font-semibold text-[var(--ink-700)] flex items-center gap-1.5">
                <Paperclip className="w-3.5 h-3.5" /> Attachments
              </div>
              <button
                onClick={() => setLightbox(0)}
                className="text-[10px] font-medium px-2 py-1 rounded-full border border-[var(--brand-200)] bg-white text-[var(--brand-600)] hover:bg-[var(--brand-50)] inline-flex items-center gap-1 transition"
              >
                <Eye className="w-3 h-3" /> Preview Images
              </button>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {[
                { Icon: FileText, label: "Spec.pdf", color: "text-rose-600 bg-rose-50" },
                { Icon: Box, label: "Model.glb", color: "text-indigo-600 bg-indigo-50" },
                { Icon: FileText, label: "Notes.docx", color: "text-blue-600 bg-blue-50" },
                { Icon: BarChart3, label: "Stats.xlsx", color: "text-emerald-600 bg-emerald-50" },
              ].map((a) => (
                <button key={a.label} className="aspect-square rounded-lg border border-black/5 bg-white p-2 flex flex-col items-center justify-center gap-1 hover:border-[var(--brand-200)]">
                  <div className={`w-8 h-8 rounded-md flex items-center justify-center ${a.color}`}>
                    <a.Icon className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] text-[var(--ink-500)] truncate w-full text-center">{a.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <button className="mt-4 w-full bg-gradient-brand text-white text-sm font-semibold rounded-xl py-2.5 hover:opacity-95 transition flex items-center justify-center gap-2 shadow-soft">
          Add to Order <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {lightbox !== null && (
        <Lightbox
          index={lightbox}
          onClose={() => setLightbox(null)}
          onPrev={() => setLightbox((i) => (i! - 1 + partImages.length) % partImages.length)}
          onNext={() => setLightbox((i) => (i! + 1) % partImages.length)}
        />
      )}
    </BotShell>
  );
}

function PartThumb({ seed }: { seed: number }) {
  const rotate = seed * 18;
  return (
    <svg viewBox="0 0 80 80" className="w-full h-full" style={{ transform: `rotate(${rotate}deg)` }}>
      <defs>
        <linearGradient id={`g${seed}`} x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stopColor="#F3F4F6" />
          <stop offset="100%" stopColor="#9CA3AF" />
        </linearGradient>
      </defs>
      <rect x="14" y="28" width="52" height="24" rx="6" fill={`url(#g${seed})`} stroke="#6B7280" />
      <circle cx="22" cy="40" r="4" fill="#fff" stroke="#6B7280" />
      <circle cx="58" cy="40" r="4" fill="#fff" stroke="#6B7280" />
    </svg>
  );
}

function Lightbox({ index, onClose, onPrev, onNext }: { index: number; onClose: () => void; onPrev: () => void; onNext: () => void }) {
  return (
    <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-6" onClick={onClose}>
      <motion.div
        initial={{ scale: 0.96, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-2xl p-6 max-w-3xl w-full shadow-soft-lg relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute top-3 right-3 p-1.5 rounded-full hover:bg-[var(--surface-2)]">
          <X className="w-4 h-4" />
        </button>
        <div className="flex items-center gap-3">
          <button onClick={onPrev} className="p-2 rounded-full hover:bg-[var(--surface-2)]"><ChevronLeft className="w-5 h-5" /></button>
          <div className="flex-1 aspect-video rounded-xl bg-[var(--surface-1)] flex items-center justify-center relative overflow-hidden">
            <div className="w-2/3 h-2/3"><PartThumb seed={index} /></div>
            <span className="absolute bottom-3 left-3 px-2.5 py-1 rounded-full bg-black/70 text-white text-xs font-mono">{partImages[index]}</span>
          </div>
          <button onClick={onNext} className="p-2 rounded-full hover:bg-[var(--surface-2)]"><ChevronRight className="w-5 h-5" /></button>
        </div>
        <div className="grid grid-cols-4 gap-2 mt-3">
          {partImages.map((n, i) => (
            <div key={n} className={`aspect-square rounded-lg border ${i === index ? "border-[var(--brand-500)] ring-2 ring-[var(--brand-200)]" : "border-black/5"} bg-[var(--surface-1)] overflow-hidden`}>
              <PartThumb seed={i} />
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
