import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { getOrder, type Part, type ActivityEvent } from "@/lib/ppc-data";
import {
  ArrowLeft, CheckCircle2, AlertTriangle, Truck, Package, Send, X, Clock, Factory, FileText, Building2, Wallet, Hash,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/ppc/orders/$orderId")({
  loader: ({ params }) => {
    const order = getOrder(params.orderId);
    if (!order) throw notFound();
    return order;
  },
  component: OrderDetail,
  notFoundComponent: () => (
    <div className="text-center py-20">
      <h2 className="text-lg font-semibold">Order not found</h2>
      <Link to="/ppc" className="text-sm text-[var(--brand-600)] mt-2 inline-block">Back to dashboard</Link>
    </div>
  ),
});

function OrderDetail() {
  const initial = Route.useLoaderData();
  const [parts, setParts] = useState<Part[]>(initial.parts);
  const [activity, setActivity] = useState<ActivityEvent[]>(initial.activity);
  const [sendOpen, setSendOpen] = useState(false);

  const totals = useMemo(() => {
    const ordered = parts.reduce((a, p) => a + p.ordered, 0);
    const arranged = parts.reduce((a, p) => a + p.arranged, 0);
    const sent = parts.reduce((a, p) => a + p.sentToQc, 0);
    const pending = ordered - arranged;
    return { ordered, arranged, sent, pending };
  }, [parts]);

  const updateArranged = (partNo: string, val: number) => {
    setParts((ps) =>
      ps.map((p) =>
        p.partNo === partNo
          ? { ...p, arranged: Math.max(0, Math.min(p.ordered, val)) }
          : p,
      ),
    );
  };

  const confirmSend = () => {
    const batch = parts.filter((p) => p.arranged > p.sentToQc);
    const sent = batch.reduce((a, p) => a + (p.arranged - p.sentToQc), 0);
    setParts((ps) => ps.map((p) => ({ ...p, sentToQc: p.arranged })));
    setActivity((a) => [
      ...a,
      {
        id: `a${a.length + 1}`,
        at: "Just now",
        label: "Batch Sent to QC",
        detail: `${sent} parts · ${batch.length} SKU${batch.length > 1 ? "s" : ""}`,
        kind: "info",
      },
    ]);
    toast.success(`${sent} parts handed over to QC`);
    setSendOpen(false);
  };

  const status = initial.status;
  const delayed = status === "delayed";

  return (
    <div className="space-y-5">
      <div>
        <Link to="/ppc" className="text-xs text-[var(--ink-500)] hover:text-[var(--brand-600)] inline-flex items-center gap-1">
          <ArrowLeft className="w-3 h-3" /> Dashboard
        </Link>
      </div>

      {/* Order header */}
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl border border-black/[0.04] shadow-soft p-5"
      >
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <div className="text-[10px] uppercase tracking-widest text-[var(--ink-500)]">Order</div>
            <div className="flex items-center gap-2 mt-0.5">
              <h1 className="font-mono text-xl font-semibold text-[var(--brand-600)]">{initial.orderNo}</h1>
              <span className="text-xs text-[var(--ink-500)]">PO {initial.poNo}</span>
            </div>
            <div className="text-sm text-[var(--ink-700)] mt-1">{initial.distributor}</div>
          </div>
          <div className="flex items-center gap-2">
            <span className={`px-2.5 py-1 rounded-full text-xs font-medium border inline-flex items-center gap-1 ${
              delayed
                ? "bg-rose-50 text-rose-700 border-rose-200"
                : "bg-blue-50 text-blue-700 border-blue-200"
            }`}>
              {delayed ? <AlertTriangle className="w-3 h-3" /> : <Truck className="w-3 h-3" />} {initial.dueLabel}
            </span>
            <span className="px-2.5 py-1 rounded-full text-xs font-medium border bg-[var(--surface-2)] text-[var(--ink-700)] border-black/5 inline-flex items-center gap-1">
              <Clock className="w-3 h-3" /> {initial.daysPending}d pending
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mt-5">
          <HeaderStat icon={FileText} label="Order Type" value={initial.orderType} />
          <HeaderStat icon={Building2} label="Distributor" value={initial.distributor.split(",")[0]} />
          <HeaderStat icon={Wallet} label="Payment" value={initial.paymentTerms} />
          <HeaderStat icon={Factory} label="Plant" value={initial.plant} />
          <HeaderStat icon={Hash} label="Total Qty" value={initial.totalQty.toLocaleString()} />
          <HeaderStat icon={Clock} label="Committed" value={`${initial.ppcDays ?? initial.picDays} days`} />
        </div>
      </motion.div>

      {/* Totals strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Tally label="Ordered" value={totals.ordered} tone="ink" icon={Package} />
        <Tally label="Arranged" value={totals.arranged} tone="brand" icon={CheckCircle2} sub={`${Math.round((totals.arranged / totals.ordered) * 100)}%`} />
        <Tally label="Sent to QC" value={totals.sent} tone="info" icon={Send} />
        <Tally label="Pending" value={totals.pending} tone={totals.pending > 0 ? "warning" : "success"} icon={Clock} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Parts table */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-black/[0.04] shadow-soft overflow-hidden">
          <div className="px-5 py-3.5 flex items-center justify-between border-b border-black/5">
            <div>
              <div className="text-sm font-semibold">Parts</div>
              <div className="text-xs text-[var(--ink-500)]">Update arranged quantity as you locate each part.</div>
            </div>
            <button
              onClick={() => setSendOpen(true)}
              disabled={totals.arranged <= totals.sent}
              className="text-xs px-3 py-2 rounded-full bg-gradient-brand text-white font-semibold shadow-soft inline-flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-95"
            >
              <Send className="w-3.5 h-3.5" /> Send to QC
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[var(--surface-1)] text-[10px] uppercase tracking-wider text-[var(--ink-500)]">
                <tr>
                  {["Part No.", "Description", "Ordered", "Arranged", "Sent QC", "Pending", "Status"].map((h) => (
                    <th key={h} className="text-left px-4 py-2.5 font-medium whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {parts.map((p) => {
                  const pending = p.ordered - p.arranged;
                  const full = pending === 0;
                  const late = p.pendingDays > 0;
                  return (
                    <tr key={p.partNo} className="border-t border-black/5">
                      <td className="px-4 py-3 font-mono text-[var(--brand-600)] font-semibold whitespace-nowrap">{p.partNo}</td>
                      <td className="px-4 py-3 text-[var(--ink-700)]">
                        <div className="font-medium text-[var(--ink-900)]">{p.description}</div>
                        <div className="text-[11px] text-[var(--ink-500)]">{p.category}</div>
                      </td>
                      <td className="px-4 py-3 text-[var(--ink-900)] font-medium">{p.ordered}</td>
                      <td className="px-4 py-3">
                        <input
                          type="number"
                          min={0}
                          max={p.ordered}
                          value={p.arranged}
                          onChange={(e) => updateArranged(p.partNo, Number(e.target.value))}
                          className="w-20 px-2 py-1 rounded-lg border border-black/10 focus:border-[var(--brand-500)] focus:ring-2 focus:ring-[var(--brand-200)] outline-none text-sm font-medium"
                        />
                      </td>
                      <td className="px-4 py-3 text-[var(--ink-700)]">{p.sentToQc}</td>
                      <td className="px-4 py-3">
                        <div className={`font-medium ${late ? "text-rose-600" : "text-[var(--ink-700)]"}`}>{pending}</div>
                        {late && (
                          <div className="text-[10px] text-rose-600">Delayed {p.pendingDays}d</div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {full ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-medium">
                            <CheckCircle2 className="w-3 h-3" /> Arranged
                          </span>
                        ) : late ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 text-[11px] font-medium">
                            <AlertTriangle className="w-3 h-3" /> Delayed
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-[11px] font-medium">
                            <Clock className="w-3 h-3" /> In progress
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Activity trail */}
        <div className="bg-white rounded-2xl border border-black/[0.04] shadow-soft p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-sm font-semibold">Activity Trail</div>
              <div className="text-xs text-[var(--ink-500)]">Live audit log for this order.</div>
            </div>
          </div>
          <ol className="relative">
            {activity.map((e, i) => {
              const color =
                e.kind === "delay"
                  ? "bg-rose-500 ring-rose-100"
                  : e.kind === "success"
                  ? "bg-emerald-500 ring-emerald-100"
                  : e.kind === "warning"
                  ? "bg-amber-500 ring-amber-100"
                  : "bg-[var(--info-500)] ring-blue-100";
              return (
                <li key={e.id} className="flex gap-3 pb-4 last:pb-0">
                  <div className="relative flex flex-col items-center">
                    <span className={`w-2.5 h-2.5 rounded-full ring-4 ${color} mt-1`} />
                    {i < activity.length - 1 && <span className="w-px flex-1 bg-[var(--ink-300)]/40 mt-1" />}
                  </div>
                  <div className="pb-1 flex-1">
                    <div className="text-sm font-medium text-[var(--ink-900)] flex items-center gap-2 flex-wrap">
                      {e.label}
                      {e.delayedDays != null && (
                        <span className="px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                          Delayed by {e.delayedDays}d
                        </span>
                      )}
                    </div>
                    {e.detail && <div className="text-xs text-[var(--ink-700)] mt-0.5">{e.detail}</div>}
                    <div className="text-[11px] text-[var(--ink-500)] mt-0.5">{e.at}</div>
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
      </div>

      {sendOpen && (
        <SendToQcModal
          parts={parts}
          orderNo={initial.orderNo}
          date={initial.date}
          totalOrdered={totals.ordered}
          totalArranged={totals.arranged}
          onClose={() => setSendOpen(false)}
          onConfirm={confirmSend}
        />
      )}
    </div>
  );
}

function HeaderStat({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2.5">
      <div className="w-7 h-7 rounded-lg bg-[var(--surface-1)] border border-black/5 flex items-center justify-center shrink-0">
        <Icon className="w-3.5 h-3.5 text-[var(--ink-500)]" />
      </div>
      <div className="min-w-0">
        <div className="text-[10px] uppercase tracking-wider text-[var(--ink-500)]">{label}</div>
        <div className="text-sm font-medium text-[var(--ink-900)] truncate">{value}</div>
      </div>
    </div>
  );
}

function Tally({
  label, value, tone, icon: Icon, sub,
}: {
  label: string; value: number; tone: "ink" | "brand" | "info" | "warning" | "success"; icon: React.ComponentType<{ className?: string }>; sub?: string;
}) {
  const tones: Record<string, string> = {
    ink: "bg-[var(--surface-2)] text-[var(--ink-700)] border-black/5",
    brand: "bg-[var(--brand-50)] text-[var(--brand-700)] border-[var(--brand-200)]",
    info: "bg-blue-50 text-blue-700 border-blue-200",
    warning: "bg-amber-50 text-amber-700 border-amber-200",
    success: "bg-emerald-50 text-emerald-700 border-emerald-200",
  };
  return (
    <div className="bg-white rounded-2xl border border-black/[0.04] shadow-soft p-4">
      <div className="flex items-center justify-between">
        <div className={`w-8 h-8 rounded-lg border inline-flex items-center justify-center ${tones[tone]}`}>
          <Icon className="w-4 h-4" />
        </div>
        {sub && <span className="text-[10px] font-medium text-[var(--ink-500)]">{sub}</span>}
      </div>
      <div className="mt-2.5 text-2xl font-semibold tracking-tight">{value.toLocaleString()}</div>
      <div className="text-[11px] text-[var(--ink-500)] mt-0.5">{label}</div>
    </div>
  );
}

function SendToQcModal({
  parts, orderNo, date, totalOrdered, totalArranged, onClose, onConfirm,
}: {
  parts: Part[]; orderNo: string; date: string; totalOrdered: number; totalArranged: number; onClose: () => void; onConfirm: () => void;
}) {
  const batch = parts.filter((p) => p.arranged > p.sentToQc);
  const batchTotal = batch.reduce((a, p) => a + (p.arranged - p.sentToQc), 0);
  return (
    <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center p-6" onClick={onClose}>
      <motion.div
        initial={{ scale: 0.96, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-3xl p-6 max-w-xl w-full shadow-soft-lg relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-[var(--surface-2)]">
          <X className="w-4 h-4" />
        </button>
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[var(--brand-50)] border border-[var(--brand-200)] flex items-center justify-center">
            <Send className="w-4 h-4 text-[var(--brand-600)]" />
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-widest text-[var(--ink-500)]">Send to Quality Check</div>
            <div className="font-mono font-semibold text-[var(--brand-600)]">{orderNo}</div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 mt-4 p-3 rounded-2xl bg-[var(--surface-1)] border border-black/5 text-center">
          <Mini label="Date" value={date} />
          <Mini label="Ordered" value={totalOrdered.toLocaleString()} />
          <Mini label="Arranged" value={totalArranged.toLocaleString()} />
        </div>

        <div className="mt-4">
          <div className="text-xs font-medium text-[var(--ink-700)] mb-2">Being handed over · {batchTotal} parts</div>
          <div className="rounded-xl border border-black/5 overflow-hidden">
            <table className="w-full text-xs">
              <thead className="bg-[var(--surface-1)] text-[10px] uppercase tracking-wider text-[var(--ink-500)]">
                <tr>
                  <th className="text-left px-3 py-2 font-medium">Part No.</th>
                  <th className="text-left px-3 py-2 font-medium">Category</th>
                  <th className="text-right px-3 py-2 font-medium">Arranged</th>
                  <th className="text-right px-3 py-2 font-medium">To QC</th>
                </tr>
              </thead>
              <tbody>
                {batch.map((p) => (
                  <tr key={p.partNo} className="border-t border-black/5">
                    <td className="px-3 py-2 font-mono text-[var(--brand-600)] font-semibold">{p.partNo}</td>
                    <td className="px-3 py-2 text-[var(--ink-700)]">{p.category}</td>
                    <td className="px-3 py-2 text-right text-[var(--ink-700)]">{p.arranged}</td>
                    <td className="px-3 py-2 text-right text-[var(--ink-900)] font-semibold">{p.arranged - p.sentToQc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-5 flex items-center justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 rounded-xl text-sm font-medium text-[var(--ink-700)] hover:bg-[var(--surface-2)]">
            Cancel
          </button>
          <button onClick={onConfirm} className="px-4 py-2 rounded-xl text-sm font-semibold text-white bg-gradient-brand shadow-soft hover:opacity-95 inline-flex items-center gap-1.5">
            <Send className="w-3.5 h-3.5" /> Confirm Handover
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider text-[var(--ink-500)]">{label}</div>
      <div className="text-sm font-semibold text-[var(--ink-900)] mt-0.5">{value}</div>
    </div>
  );
}
