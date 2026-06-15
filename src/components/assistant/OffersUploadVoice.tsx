import { useRef, useState, useCallback } from "react";
import {
  Tag, Clock, ChevronRight, Check, AlertTriangle, Upload, Download, FileSpreadsheet,
  CheckCircle2, XCircle, Repeat, ShoppingCart, Trash2, Edit3, Sparkles, ArrowRight, Mic, X, Info,
} from "lucide-react";
import * as XLSX from "xlsx";
import { BotShell } from "./MessageBubbles";
import {
  Campaign, ParsedOrderItem, BulkValidationResult, formatINR, campaigns as allCampaigns,
  demoCart, matchCampaignsForParts, totalSavings,
} from "@/lib/offers-data";

/* ============================================================
   CAMPAIGN / OFFERS CARDS
   ============================================================ */

export function CampaignListCard({
  campaigns, title = "Active OEM Campaigns", onApply, onViewParts,
}: {
  campaigns: Campaign[];
  title?: string;
  onApply?: (c: Campaign) => void;
  onViewParts?: (c: Campaign) => void;
}) {
  return (
    <BotShell>
      <div className="bg-white border border-black/[0.04] rounded-3xl rounded-tl-md p-4 shadow-soft w-full max-w-2xl">
        <div className="flex items-center justify-between mb-3">
          <div className="text-sm font-semibold text-[var(--ink-900)] flex items-center gap-2">
            <Tag className="w-4 h-4 text-[var(--brand-600)]" />
            {title}
          </div>
          <span className="text-[10px] text-[var(--ink-500)] uppercase tracking-wider">
            {campaigns.length} found
          </span>
        </div>
        <div className="space-y-2.5">
          {campaigns.map((c) => (
            <div
              key={c.id}
              className="border border-black/5 rounded-2xl p-3 hover:border-[var(--brand-200)] transition bg-[var(--surface-1)]"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-[var(--ink-900)] text-sm">{c.name}</span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                        c.status === "expiring"
                          ? "bg-amber-50 text-amber-700 border border-amber-200"
                          : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      }`}
                    >
                      {c.status === "expiring" ? `Expiring · ${c.daysLeft}d` : "Active"}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--brand-50)] text-[var(--brand-700)] border border-[var(--brand-200)]">
                      {c.type}
                    </span>
                  </div>
                  <div className="text-xs text-[var(--ink-500)] mt-1 flex items-center gap-3 flex-wrap">
                    <span className="inline-flex items-center gap-1"><Clock className="w-3 h-3" /> {c.validTill}</span>
                    <span>· {c.eligiblePartsCount} eligible parts</span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-lg font-bold text-[var(--brand-600)] leading-tight">{c.discountPct}%</div>
                  <div className="text-[10px] text-[var(--ink-500)] uppercase tracking-wider">off</div>
                </div>
              </div>
              <div className="flex items-center justify-between mt-3 pt-2 border-t border-black/5">
                <div className="text-xs text-[var(--ink-700)]">
                  Est. savings <span className="font-semibold text-emerald-600">{formatINR(c.estSavings)}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => onViewParts?.(c)}
                    className="text-[11px] px-2.5 py-1 rounded-full border border-black/10 hover:bg-white text-[var(--ink-700)]"
                  >
                    View Parts
                  </button>
                  <button
                    onClick={() => onApply?.(c)}
                    className="text-[11px] px-2.5 py-1 rounded-full bg-gradient-brand text-white font-medium inline-flex items-center gap-1"
                  >
                    Apply <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </BotShell>
  );
}

export function CartOfferAnalysisCard({
  matched, savings, missedHint,
}: { matched: Campaign[]; savings: number; missedHint?: string }) {
  return (
    <BotShell>
      <div className="bg-white border border-black/[0.04] rounded-3xl rounded-tl-md p-4 shadow-soft w-full max-w-lg">
        <div className="text-sm font-semibold text-[var(--ink-900)] mb-2 flex items-center gap-2">
          <ShoppingCart className="w-4 h-4 text-[var(--brand-600)]" /> Your cart qualifies for:
        </div>
        <ul className="space-y-1.5 mb-3">
          {matched.map((c) => (
            <li key={c.id} className="flex items-center gap-2 text-sm text-[var(--ink-700)]">
              <Check className="w-4 h-4 text-emerald-600" /> {c.name}
              <span className="text-[10px] text-[var(--ink-500)]">({c.discountPct}%)</span>
            </li>
          ))}
          {!matched.length && (
            <li className="text-sm text-[var(--ink-500)] italic">No active campaigns matched your current cart.</li>
          )}
        </ul>
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2 text-sm flex items-center justify-between">
          <span className="text-emerald-700 font-medium">Potential Savings</span>
          <span className="text-emerald-700 font-bold">{formatINR(savings)}</span>
        </div>
        {missedHint && (
          <div className="text-xs text-[var(--ink-500)] mt-2 flex items-start gap-1.5">
            <Info className="w-3.5 h-3.5 mt-0.5 text-[var(--brand-600)] shrink-0" />
            <span>{missedHint}</span>
          </div>
        )}
      </div>
    </BotShell>
  );
}

export function RecommendationBanner({
  campaigns, savings, onApply, onView,
}: { campaigns: Campaign[]; savings: number; onApply?: () => void; onView?: () => void }) {
  return (
    <BotShell>
      <div className="bg-gradient-to-br from-[var(--brand-50)] to-white border border-[var(--brand-200)] rounded-3xl rounded-tl-md p-4 shadow-soft w-full max-w-lg">
        <div className="flex items-center gap-2 text-[var(--brand-700)] text-sm font-semibold">
          <Sparkles className="w-4 h-4" /> Recommended OEM Campaigns
        </div>
        <div className="text-xs text-[var(--ink-500)] mt-1">
          {campaigns.length} promotions match your recent activity.
        </div>
        <div className="mt-3 text-sm text-[var(--ink-700)]">
          Potential Savings <span className="font-bold text-emerald-600">{formatINR(savings)}</span>
        </div>
        <div className="flex items-center gap-2 mt-3">
          <button
            onClick={onApply}
            className="text-xs px-3 py-1.5 rounded-full bg-gradient-brand text-white font-medium inline-flex items-center gap-1"
          >
            Apply Offer <ArrowRight className="w-3 h-3" />
          </button>
          <button
            onClick={onView}
            className="text-xs px-3 py-1.5 rounded-full border border-black/10 text-[var(--ink-700)] hover:bg-white"
          >
            View Campaign
          </button>
        </div>
      </div>
    </BotShell>
  );
}

export function AlertCard({
  kind, title, body, action,
}: {
  kind: "expiring" | "volume" | "supersession" | "stock";
  title: string;
  body: string;
  action?: { label: string; onClick: () => void };
}) {
  const tone = {
    expiring: { bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-800", icon: <Clock className="w-4 h-4" /> },
    volume: { bg: "bg-indigo-50", border: "border-indigo-200", text: "text-indigo-800", icon: <Sparkles className="w-4 h-4" /> },
    supersession: { bg: "bg-sky-50", border: "border-sky-200", text: "text-sky-800", icon: <Repeat className="w-4 h-4" /> },
    stock: { bg: "bg-emerald-50", border: "border-emerald-200", text: "text-emerald-800", icon: <Tag className="w-4 h-4" /> },
  }[kind];
  return (
    <BotShell>
      <div className={`${tone.bg} ${tone.border} border rounded-3xl rounded-tl-md p-4 shadow-soft max-w-lg`}>
        <div className={`text-sm font-semibold ${tone.text} flex items-center gap-2`}>{tone.icon} {title}</div>
        <p className="text-sm text-[var(--ink-700)] mt-1">{body}</p>
        {action && (
          <button onClick={action.onClick} className="mt-3 text-xs px-3 py-1.5 rounded-full bg-white border border-black/10 hover:bg-[var(--surface-1)] text-[var(--ink-700)] font-medium">
            {action.label}
          </button>
        )}
      </div>
    </BotShell>
  );
}

export function CartReviewCard({ onCheckOffers }: { onCheckOffers?: () => void }) {
  const totalParts = demoCart.length;
  const totalQty = demoCart.reduce((a, c) => a + c.qty, 0);
  const matched = matchCampaignsForParts(demoCart.map((c) => c.partNo));
  const savings = totalSavings(matched);
  const expiring = matched.find((m) => m.status === "expiring");
  return (
    <BotShell>
      <div className="bg-white border border-black/[0.04] rounded-3xl rounded-tl-md p-4 shadow-soft w-full max-w-xl">
        <div className="text-sm font-semibold text-[var(--ink-900)] mb-3 flex items-center gap-2">
          <ShoppingCart className="w-4 h-4 text-[var(--brand-600)]" /> Cart Review
        </div>
        <div className="grid grid-cols-2 gap-2 mb-3">
          <Stat label="Total Parts" value={totalParts.toString()} />
          <Stat label="Total Quantity" value={totalQty.toString()} />
        </div>
        <div className="rounded-xl border border-black/5 overflow-hidden">
          <table className="w-full text-xs">
            <thead className="bg-[var(--surface-1)] text-[var(--ink-500)] uppercase tracking-wider">
              <tr><th className="text-left px-3 py-2 font-medium">Part</th><th className="text-left px-3 py-2 font-medium">Description</th><th className="text-right px-3 py-2 font-medium">Qty</th><th className="text-right px-3 py-2 font-medium">MRP</th></tr>
            </thead>
            <tbody>
              {demoCart.map((l) => (
                <tr key={l.partNo} className="border-t border-black/5">
                  <td className="px-3 py-2 font-mono text-[var(--brand-600)] font-semibold">{l.partNo}</td>
                  <td className="px-3 py-2 text-[var(--ink-700)]">{l.description}</td>
                  <td className="px-3 py-2 text-right text-[var(--ink-700)]">{l.qty}</td>
                  <td className="px-3 py-2 text-right text-[var(--ink-900)] font-medium">{formatINR(l.mrp)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-3 space-y-1.5 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-[var(--ink-700)]">Applicable Campaigns</span>
            <span className="font-semibold text-[var(--ink-900)]">{matched.length}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[var(--ink-700)]">Savings Available</span>
            <span className="font-semibold text-emerald-600">{formatINR(savings)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[var(--ink-700)]">Next Slab</span>
            <span className="text-[var(--ink-500)]">+3 eligible parts → +5% volume incentive</span>
          </div>
          {expiring && (
            <div className="flex items-center justify-between text-amber-700">
              <span className="inline-flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Expiring alert</span>
              <span className="font-medium">{expiring.name} · {expiring.daysLeft}d</span>
            </div>
          )}
        </div>
        <button
          onClick={onCheckOffers}
          className="mt-3 w-full bg-gradient-brand text-white text-sm font-semibold rounded-xl py-2.5 inline-flex items-center justify-center gap-1.5"
        >
          Apply Offers <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </BotShell>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-[var(--surface-1)] rounded-xl px-3 py-2 border border-black/5">
      <div className="text-[10px] text-[var(--ink-500)] uppercase tracking-wider">{label}</div>
      <div className="text-base font-semibold text-[var(--ink-900)]">{value}</div>
    </div>
  );
}

/* ============================================================
   BULK UPLOAD
   ============================================================ */

const TEMPLATE_HEADERS = ["Part Number*", "Quantity*", "Remarks"];

function downloadTemplate() {
  const wb = XLSX.utils.book_new();
  const ws1 = XLSX.utils.aoa_to_sheet([
    TEMPLATE_HEADERS,
    ["ABC-123", 10, "Urgent"],
    ["XYZ-456", 5, "Stock"],
  ]);
  ws1["!cols"] = [{ wch: 18 }, { wch: 12 }, { wch: 20 }];
  XLSX.utils.book_append_sheet(wb, ws1, "Bulk Order Upload");

  const ws2 = XLSX.utils.aoa_to_sheet([
    ["Instructions"],
    [""],
    ["1. Part Number is mandatory."],
    ["2. Quantity is mandatory and must be greater than 0."],
    ["3. Do not modify column headers."],
    ["4. Supported formats: XLSX, XLS, CSV."],
    ["5. Maximum upload limit: 500 rows per file."],
    ["6. Remarks column is optional."],
  ]);
  ws2["!cols"] = [{ wch: 70 }];
  XLSX.utils.book_append_sheet(wb, ws2, "Instructions");

  XLSX.writeFile(wb, "OEM_Bulk_Order_Template.xlsx");
}

export function BulkUploadCard({ onParsed }: { onParsed: (rows: { partNo: string; qty: number; remarks?: string }[]) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = useCallback(async (file: File) => {
    setError(null);
    try {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: "array" });
      const sheet = wb.Sheets[wb.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });
      const rows = json.map((r) => {
        const partKey = Object.keys(r).find((k) => /part\s*(no|number)/i.test(k)) ?? "Part Number*";
        const qtyKey = Object.keys(r).find((k) => /quantity|qty/i.test(k)) ?? "Quantity*";
        const remKey = Object.keys(r).find((k) => /remarks?/i.test(k));
        return {
          partNo: String(r[partKey] ?? "").trim(),
          qty: Number(r[qtyKey] ?? 0),
          remarks: remKey ? String(r[remKey] ?? "") : undefined,
        };
      }).filter((r) => r.partNo);
      if (!rows.length) {
        setError("No rows found. Make sure the file uses the OEM template format.");
        return;
      }
      onParsed(rows);
    } catch {
      setError("Could not read the file. Please use XLSX, XLS, or CSV.");
    }
  }, [onParsed]);

  return (
    <BotShell>
      <div className="bg-white border border-black/[0.04] rounded-3xl rounded-tl-md p-4 shadow-soft w-full max-w-lg">
        <div className="text-sm font-semibold text-[var(--ink-900)] mb-1 flex items-center gap-2">
          <FileSpreadsheet className="w-4 h-4 text-[var(--brand-600)]" /> Bulk Order Upload
        </div>
        <p className="text-xs text-[var(--ink-500)] mb-3">
          Upload an Excel/CSV file using the official OEM template. We'll validate parts, quantities, supersessions and eligibility before adding to the cart.
        </p>

        <button
          onClick={downloadTemplate}
          className="w-full mb-3 text-xs px-3 py-2 rounded-xl border border-[var(--brand-200)] bg-[var(--brand-50)] text-[var(--brand-700)] font-medium inline-flex items-center justify-center gap-1.5 hover:bg-white"
        >
          <Download className="w-3.5 h-3.5" /> Download Template
        </button>

        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            const f = e.dataTransfer.files?.[0];
            if (f) handleFile(f);
          }}
          className={`border-2 border-dashed rounded-2xl px-4 py-6 text-center transition ${
            dragOver ? "border-[var(--brand-500)] bg-[var(--brand-50)]" : "border-black/10 bg-[var(--surface-1)]"
          }`}
        >
          <Upload className="w-6 h-6 mx-auto text-[var(--brand-600)] mb-1.5" />
          <div className="text-xs text-[var(--ink-700)]">Drag & drop your file here</div>
          <div className="text-[10px] text-[var(--ink-500)] mt-0.5">XLSX · XLS · CSV (max 500 rows)</div>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="mt-3 text-xs px-3 py-1.5 rounded-full border border-black/10 bg-white hover:bg-[var(--brand-50)] text-[var(--ink-700)] font-medium"
          >
            Browse File
          </button>
          <input
            ref={inputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFile(f);
              e.currentTarget.value = "";
            }}
          />
        </div>
        {error && (
          <div className="mt-2 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2 inline-flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5" /> {error}
          </div>
        )}
      </div>
    </BotShell>
  );
}

export function UploadSummaryCard({
  result, onContinue,
}: { result: BulkValidationResult; onContinue?: () => void }) {
  const [showErrors, setShowErrors] = useState(false);
  const errorRows = result.rows.filter((r) => r.status !== "valid");

  function downloadReport() {
    const wb = XLSX.utils.book_new();
    const data = [
      ["Part Number", "Quantity", "Remarks", "Status", "Note"],
      ...result.rows.map((r) => [r.partNo, r.qty, r.remarks ?? "", r.status, r.note ?? ""]),
    ];
    const ws = XLSX.utils.aoa_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, "Validation Report");
    XLSX.writeFile(wb, "Bulk_Upload_Validation_Report.xlsx");
  }

  return (
    <BotShell>
      <div className="bg-white border border-black/[0.04] rounded-3xl rounded-tl-md p-4 shadow-soft w-full max-w-xl">
        <div className="text-sm font-semibold text-[var(--ink-900)] mb-3 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Upload Summary
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <Stat label="Total Rows" value={result.total.toString()} />
          <Stat label="Valid" value={result.valid.toString()} />
          <Stat label="Invalid" value={result.invalid.toString()} />
          <Stat label="Superseded" value={result.superseded.toString()} />
        </div>

        {showErrors && errorRows.length > 0 && (
          <div className="mt-3 rounded-xl border border-rose-200 overflow-hidden">
            <table className="w-full text-xs">
              <thead className="bg-rose-50 text-rose-700">
                <tr><th className="text-left px-3 py-1.5">Part</th><th className="text-left px-3 py-1.5">Qty</th><th className="text-left px-3 py-1.5">Issue</th></tr>
              </thead>
              <tbody>
                {errorRows.slice(0, 8).map((r, i) => (
                  <tr key={i} className="border-t border-rose-100">
                    <td className="px-3 py-1.5 font-mono">{r.partNo || "—"}</td>
                    <td className="px-3 py-1.5">{r.qty}</td>
                    <td className="px-3 py-1.5 text-rose-700">{r.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex flex-wrap gap-2 mt-3">
          {errorRows.length > 0 && (
            <button onClick={() => setShowErrors((v) => !v)} className="text-xs px-3 py-1.5 rounded-full border border-black/10 text-[var(--ink-700)] hover:bg-[var(--surface-1)]">
              {showErrors ? "Hide" : "Review"} Errors
            </button>
          )}
          <button onClick={downloadReport} className="text-xs px-3 py-1.5 rounded-full border border-black/10 text-[var(--ink-700)] hover:bg-[var(--surface-1)] inline-flex items-center gap-1">
            <Download className="w-3 h-3" /> Validation Report
          </button>
          <button
            onClick={onContinue}
            className="text-xs px-3 py-1.5 rounded-full bg-gradient-brand text-white font-medium inline-flex items-center gap-1 ml-auto"
          >
            Add {result.valid} Valid to Cart <ChevronRight className="w-3 h-3" />
          </button>
        </div>
      </div>
    </BotShell>
  );
}

export function BulkInsightsCard({
  eligibleCount, supersededCount, volumeGap, savings, onApply,
}: { eligibleCount: number; supersededCount: number; volumeGap: number; savings: number; onApply?: () => void }) {
  return (
    <BotShell>
      <div className="bg-gradient-to-br from-[var(--brand-50)] to-white border border-[var(--brand-200)] rounded-3xl rounded-tl-md p-4 shadow-soft max-w-lg">
        <div className="text-sm font-semibold text-[var(--brand-700)] flex items-center gap-2">
          <Sparkles className="w-4 h-4" /> Order Insights
        </div>
        <ul className="mt-2 space-y-1.5 text-sm text-[var(--ink-700)]">
          <li className="flex items-start gap-2"><Check className="w-4 h-4 text-emerald-600 mt-0.5" /> <span><b>{eligibleCount}</b> parts are eligible for OEM campaigns.</span></li>
          <li className="flex items-start gap-2"><Repeat className="w-4 h-4 text-sky-600 mt-0.5" /> <span><b>{supersededCount}</b> parts have superseded versions.</span></li>
          <li className="flex items-start gap-2"><AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5" /> <span>You are <b>{volumeGap}</b> units away from unlocking a Volume Incentive Program.</span></li>
        </ul>
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl mt-3 px-3 py-2 text-sm flex items-center justify-between">
          <span className="text-emerald-700 font-medium">Potential Savings</span>
          <span className="text-emerald-700 font-bold">{formatINR(savings)}</span>
        </div>
        <div className="flex items-center gap-2 mt-3">
          <button onClick={onApply} className="text-xs px-3 py-1.5 rounded-full bg-gradient-brand text-white font-medium inline-flex items-center gap-1">
            Apply Offers <ArrowRight className="w-3 h-3" />
          </button>
          <button className="text-xs px-3 py-1.5 rounded-full border border-black/10 text-[var(--ink-700)] hover:bg-white">View Campaigns</button>
          <button className="text-xs px-3 py-1.5 rounded-full border border-black/10 text-[var(--ink-700)] hover:bg-white ml-auto">Proceed to Checkout</button>
        </div>
      </div>
    </BotShell>
  );
}

/* ============================================================
   VOICE / MULTI-PART ORDERING
   ============================================================ */

export function VoiceOrderConfirmCard({
  items, onConfirm, onCancel, onRemove,
}: {
  items: ParsedOrderItem[];
  onConfirm: (items: ParsedOrderItem[]) => void;
  onCancel: () => void;
  onRemove: (idx: number) => void;
}) {
  const valid = items.filter((i) => i.status === "valid");
  return (
    <BotShell>
      <div className="bg-white border border-black/[0.04] rounded-3xl rounded-tl-md p-4 shadow-soft w-full max-w-xl">
        <div className="text-sm font-semibold text-[var(--ink-900)] mb-2 flex items-center gap-2">
          <Mic className="w-4 h-4 text-[var(--brand-600)]" /> I found {items.length} parts in your request
        </div>
        <div className="rounded-xl border border-black/5 overflow-hidden">
          <table className="w-full text-xs">
            <thead className="bg-[var(--surface-1)] text-[var(--ink-500)] uppercase tracking-wider">
              <tr><th className="text-left px-3 py-2 font-medium">#</th><th className="text-left px-3 py-2 font-medium">Description</th><th className="text-left px-3 py-2 font-medium">Part No.</th><th className="text-right px-3 py-2 font-medium">Qty</th><th className="text-right px-3 py-2 font-medium">Status</th><th /></tr>
            </thead>
            <tbody>
              {items.map((it, i) => (
                <tr key={i} className="border-t border-black/5">
                  <td className="px-3 py-2 text-[var(--ink-500)]">{i + 1}</td>
                  <td className="px-3 py-2 text-[var(--ink-700)]">{it.description}</td>
                  <td className="px-3 py-2 font-mono text-[var(--brand-600)]">{it.partNo ?? "—"}</td>
                  <td className="px-3 py-2 text-right text-[var(--ink-900)] font-medium">{it.qty}</td>
                  <td className="px-3 py-2 text-right">
                    <StatusBadge status={it.status} note={it.supersededBy} />
                  </td>
                  <td className="px-2 py-2 text-right">
                    <button onClick={() => onRemove(i)} aria-label="Remove" className="p-1 rounded-md hover:bg-rose-50 text-rose-600">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="text-xs text-[var(--ink-500)] mt-2">Would you like me to add these items to your cart?</div>
        <div className="flex items-center gap-2 mt-3">
          <button onClick={() => onConfirm(valid)} disabled={!valid.length} className="text-xs px-3 py-1.5 rounded-full bg-gradient-brand text-white font-medium inline-flex items-center gap-1 disabled:opacity-40">
            Confirm ({valid.length}) <Check className="w-3 h-3" />
          </button>
          <button className="text-xs px-3 py-1.5 rounded-full border border-black/10 text-[var(--ink-700)] hover:bg-[var(--surface-1)] inline-flex items-center gap-1">
            <Edit3 className="w-3 h-3" /> Modify
          </button>
          <button onClick={onCancel} className="text-xs px-3 py-1.5 rounded-full border border-black/10 text-[var(--ink-700)] hover:bg-[var(--surface-1)] inline-flex items-center gap-1 ml-auto">
            <X className="w-3 h-3" /> Cancel
          </button>
        </div>
      </div>
    </BotShell>
  );
}

function StatusBadge({ status, note }: { status: ParsedOrderItem["status"]; note?: string }) {
  if (status === "valid") {
    return <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">Valid</span>;
  }
  if (status === "superseded") {
    return <span className="text-[10px] px-2 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-200">→ {note}</span>;
  }
  return <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">Invalid</span>;
}

export function VoiceOrderSuccessCard({
  totalParts, totalQty, onViewCart, onContinue, onCheckout,
}: { totalParts: number; totalQty: number; onViewCart: () => void; onContinue: () => void; onCheckout: () => void }) {
  return (
    <BotShell>
      <div className="bg-white border border-emerald-200 rounded-3xl rounded-tl-md p-4 shadow-soft max-w-md">
        <div className="text-sm font-semibold text-emerald-700 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" /> Items Added Successfully
        </div>
        <div className="grid grid-cols-2 gap-2 mt-3">
          <Stat label="Total Parts" value={totalParts.toString()} />
          <Stat label="Total Quantity" value={totalQty.toString()} />
        </div>
        <div className="flex items-center gap-2 mt-3">
          <button onClick={onViewCart} className="text-xs px-3 py-1.5 rounded-full border border-black/10 text-[var(--ink-700)] hover:bg-[var(--surface-1)]">View Cart</button>
          <button onClick={onContinue} className="text-xs px-3 py-1.5 rounded-full border border-black/10 text-[var(--ink-700)] hover:bg-[var(--surface-1)]">Continue Ordering</button>
          <button onClick={onCheckout} className="text-xs px-3 py-1.5 rounded-full bg-gradient-brand text-white font-medium ml-auto">Checkout</button>
        </div>
      </div>
    </BotShell>
  );
}

export function SupersededPartPrompt({
  oldPart, newPart, qty, onAccept, onKeep,
}: { oldPart: string; newPart: string; qty: number; onAccept: () => void; onKeep: () => void }) {
  return (
    <BotShell>
      <div className="bg-sky-50 border border-sky-200 rounded-3xl rounded-tl-md p-4 shadow-soft max-w-md">
        <div className="text-sm font-semibold text-sky-800 flex items-center gap-2">
          <Repeat className="w-4 h-4" /> Superseded Part
        </div>
        <p className="text-sm text-[var(--ink-700)] mt-1">
          Part <b className="font-mono">{oldPart}</b> has been superseded by <b className="font-mono">{newPart}</b>.
          Would you like to use the latest part for the requested <b>{qty}</b> units?
        </p>
        <div className="flex items-center gap-2 mt-3">
          <button onClick={onAccept} className="text-xs px-3 py-1.5 rounded-full bg-gradient-brand text-white font-medium">Use {newPart}</button>
          <button onClick={onKeep} className="text-xs px-3 py-1.5 rounded-full border border-black/10 text-[var(--ink-700)] hover:bg-white">Keep {oldPart}</button>
        </div>
      </div>
    </BotShell>
  );
}

export function DuplicateConsolidationCard({
  partNo, totalQty, onProceed,
}: { partNo: string; totalQty: number; onProceed: () => void }) {
  return (
    <BotShell>
      <div className="bg-white border border-amber-200 rounded-3xl rounded-tl-md p-4 shadow-soft max-w-md">
        <div className="text-sm font-semibold text-amber-700 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" /> Duplicate part detected
        </div>
        <p className="text-sm text-[var(--ink-700)] mt-1">
          <b className="font-mono">{partNo}</b> appears more than once. Consolidated total quantity: <b>{totalQty}</b>. Proceed?
        </p>
        <div className="flex items-center gap-2 mt-3">
          <button onClick={onProceed} className="text-xs px-3 py-1.5 rounded-full bg-gradient-brand text-white font-medium">Proceed</button>
          <button className="text-xs px-3 py-1.5 rounded-full border border-black/10 text-[var(--ink-700)] hover:bg-[var(--surface-1)]">Edit</button>
        </div>
      </div>
    </BotShell>
  );
}

export function InvalidPartCard({ partNo, onRetry }: { partNo: string; onRetry: () => void }) {
  return (
    <BotShell>
      <div className="bg-white border border-rose-200 rounded-3xl rounded-tl-md p-4 shadow-soft max-w-md">
        <div className="text-sm font-semibold text-rose-700 flex items-center gap-2">
          <XCircle className="w-4 h-4" /> Part number not found
        </div>
        <p className="text-sm text-[var(--ink-700)] mt-1">
          Part Number <b className="font-mono">{partNo}</b> could not be found in the catalogue.
        </p>
        <div className="flex items-center gap-2 mt-3">
          <button className="text-xs px-3 py-1.5 rounded-full border border-black/10 text-[var(--ink-700)] hover:bg-[var(--surface-1)]">Search Similar Parts</button>
          <button onClick={onRetry} className="text-xs px-3 py-1.5 rounded-full bg-gradient-brand text-white font-medium">Retry</button>
        </div>
      </div>
    </BotShell>
  );
}

/* eslint-disable @typescript-eslint/no-unused-vars */
// Re-export campaigns just so consumers don't double-import.
export { allCampaigns };

/* ============================================================
   DESCRIPTION-ONLY MULTI-PART ORDERING
   ============================================================ */
import type { DescOrderItem, DescriptionPart } from "@/lib/offers-data";

export function DescriptionOrderCard({
  items, contextModel, onConfirm, onCancel, onSearchVin, onSearchModel,
}: {
  items: DescOrderItem[];
  contextModel?: string | null;
  onConfirm: (picked: { partNo: string; description: string; qty: number; model: string; mrp: number }[]) => void;
  onCancel: () => void;
  onSearchVin: () => void;
  onSearchModel: () => void;
}) {
  // selection map: itemIdx -> Set<partNo>
  const [sel, setSel] = useState<Record<number, Set<string>>>(() => {
    const init: Record<number, Set<string>> = {};
    items.forEach((it, i) => {
      const set = new Set<string>();
      if (contextModel) {
        const m = it.matches.find((p) => p.model.toLowerCase() === contextModel.toLowerCase());
        if (m) set.add(m.partNo);
      } else if (it.matches.length === 1) {
        set.add(it.matches[0].partNo);
      }
      init[i] = set;
    });
    return init;
  });
  const [showMore, setShowMore] = useState<Record<number, boolean>>({});

  function toggle(idx: number, partNo: string) {
    setSel((prev) => {
      const next = { ...prev };
      const set = new Set(next[idx]);
      if (set.has(partNo)) set.delete(partNo);
      else set.add(partNo);
      next[idx] = set;
      return next;
    });
  }

  function handleConfirm() {
    const picked: { partNo: string; description: string; qty: number; model: string; mrp: number }[] = [];
    items.forEach((it, i) => {
      const set = sel[i] ?? new Set();
      set.forEach((pn) => {
        const p = it.matches.find((x) => x.partNo === pn);
        if (p) picked.push({ partNo: p.partNo, description: p.description, qty: it.qty, model: p.model, mrp: p.mrp });
      });
    });
    onConfirm(picked);
  }

  const totalSelected = Object.values(sel).reduce((a, s) => a + s.size, 0);
  const smartContext = !!contextModel && items.every((it, i) => (sel[i]?.size ?? 0) > 0);

  return (
    <BotShell>
      <div className="bg-white border border-black/[0.04] rounded-3xl rounded-tl-md p-4 shadow-soft w-full max-w-2xl space-y-4">
        <div className="text-sm font-semibold text-[var(--ink-900)] flex items-center gap-2">
          <Mic className="w-4 h-4 text-[var(--brand-600)]" />
          {contextModel
            ? `Based on the selected vehicle (${contextModel}), I found these parts:`
            : `I found multiple parts matching your request.`}
        </div>

        {items.map((it, idx) => {
          const isTooMany = it.oversaturated;
          const isSingle = !isTooMany && it.matches.length === 1;
          const visibleMatches = showMore[idx] ? it.matches : it.matches.slice(0, 10);
          return (
            <div key={idx} className="border border-black/5 rounded-2xl overflow-hidden">
              <div className="flex items-center justify-between bg-[var(--brand-50)] px-3 py-2">
                <div className="text-sm font-semibold text-[var(--ink-900)]">{it.description} Options</div>
                <span className="text-[10px] uppercase tracking-wider text-[var(--ink-500)]">
                  Requested Qty: <b className="text-[var(--brand-700)]">{it.qty}</b>
                </span>
              </div>

              {isTooMany ? (
                <div className="px-3 py-3 text-sm text-[var(--ink-700)] space-y-2">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                    <span>
                      I found <b>{it.totalMatchCount}</b> {it.description.toLowerCase()}s matching your request.
                      To find the correct part, please provide a <b>VIN</b>, <b>Model Name</b>, or <b>Part Number</b>.
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    <button onClick={onSearchVin} className="text-[11px] px-2.5 py-1 rounded-full border border-black/10 hover:bg-[var(--surface-1)] text-[var(--ink-700)]">Enter VIN</button>
                    <button onClick={onSearchModel} className="text-[11px] px-2.5 py-1 rounded-full border border-black/10 hover:bg-[var(--surface-1)] text-[var(--ink-700)]">Select Model</button>
                    <button className="text-[11px] px-2.5 py-1 rounded-full border border-black/10 hover:bg-[var(--surface-1)] text-[var(--ink-700)]">View All Results</button>
                  </div>
                </div>
              ) : it.matches.length === 0 ? (
                <div className="px-3 py-3 text-sm text-[var(--ink-500)] italic">
                  No parts in catalogue match "{it.description}".
                </div>
              ) : (
                <>
                  <table className="w-full text-xs">
                    <thead className="bg-[var(--surface-1)] text-[var(--ink-500)] uppercase tracking-wider">
                      <tr>
                        <th className="w-8" />
                        <th className="text-left px-3 py-2 font-medium">Part Number</th>
                        <th className="text-left px-3 py-2 font-medium">Description</th>
                        <th className="text-left px-3 py-2 font-medium">Applicable Models</th>
                        <th className="text-right px-3 py-2 font-medium">MRP</th>
                      </tr>
                    </thead>
                    <tbody>
                      {visibleMatches.map((p) => {
                        const checked = sel[idx]?.has(p.partNo) ?? false;
                        const ctxHit = !!contextModel && p.model.toLowerCase() === contextModel.toLowerCase();
                        return (
                          <tr
                            key={p.partNo}
                            onClick={() => toggle(idx, p.partNo)}
                            className={`border-t border-black/5 cursor-pointer hover:bg-[var(--surface-1)] ${ctxHit ? "bg-emerald-50/40" : ""}`}
                          >
                            <td className="px-2 py-2 text-center">
                              <input type="checkbox" readOnly checked={checked} className="accent-[var(--brand-600)]" />
                            </td>
                            <td className="px-3 py-2 font-mono text-[var(--brand-600)] font-semibold">{p.partNo}</td>
                            <td className="px-3 py-2 text-[var(--ink-700)]">{p.description}</td>
                            <td className="px-3 py-2 text-[var(--ink-700)]">{p.model}</td>
                            <td className="px-3 py-2 text-right text-[var(--ink-900)] font-medium">{formatINR(p.mrp)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  {it.matches.length > 10 && (
                    <button
                      onClick={() => setShowMore((p) => ({ ...p, [idx]: !p[idx] }))}
                      className="w-full text-[11px] py-1.5 text-[var(--brand-700)] hover:bg-[var(--brand-50)] border-t border-black/5"
                    >
                      {showMore[idx] ? "Show Less" : `Show More (${it.matches.length - 10} more)`}
                    </button>
                  )}
                  {isSingle && (
                    <div className="px-3 py-2 text-[11px] text-emerald-700 bg-emerald-50 border-t border-emerald-100 inline-flex items-center gap-1">
                      <Check className="w-3 h-3" /> Single matching part auto-selected.
                    </div>
                  )}
                </>
              )}
            </div>
          );
        })}

        {!items.some((i) => i.oversaturated) && (
          <div className="text-xs text-[var(--ink-500)]">
            {smartContext
              ? "Would you like me to add these items to your cart?"
              : "Please select the required part(s), or provide a VIN / Model Name to narrow down the search."}
          </div>
        )}

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleConfirm}
            disabled={totalSelected === 0}
            className="text-xs px-3 py-1.5 rounded-full bg-gradient-brand text-white font-medium inline-flex items-center gap-1 disabled:opacity-40"
          >
            {smartContext ? "Confirm Order" : `Select Parts (${totalSelected})`}
            <Check className="w-3 h-3" />
          </button>
          <button onClick={onSearchVin} className="text-xs px-3 py-1.5 rounded-full border border-black/10 text-[var(--ink-700)] hover:bg-[var(--surface-1)]">Search by VIN</button>
          <button onClick={onSearchModel} className="text-xs px-3 py-1.5 rounded-full border border-black/10 text-[var(--ink-700)] hover:bg-[var(--surface-1)]">Search by Model</button>
          <button onClick={onCancel} className="text-xs px-3 py-1.5 rounded-full border border-black/10 text-[var(--ink-700)] hover:bg-[var(--surface-1)] inline-flex items-center gap-1 ml-auto">
            <X className="w-3 h-3" /> Cancel
          </button>
        </div>
      </div>
    </BotShell>
  );
}
