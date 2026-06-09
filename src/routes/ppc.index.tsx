import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { motion } from "framer-motion";
import { ORDERS, KPIS, type Order } from "@/lib/ppc-data";
import {
  AlertTriangle, CheckCircle2, Clock, FileText, Inbox, Layers, PlayCircle, ChevronRight, X, Calendar, Truck, MessageSquare,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/ppc/")({
  component: PpcDashboard,
});

const KPI_TILES = [
  { key: "total", label: "Total Orders", icon: Layers, value: KPIS.total, tone: "ink" },
  { key: "pending", label: "Pending Acceptance", icon: Inbox, value: KPIS.pending, tone: "brand" },
  { key: "running", label: "Running", icon: PlayCircle, value: KPIS.running, tone: "info" },
  { key: "dueToday", label: "Due Today", icon: Clock, value: KPIS.dueToday, tone: "warning" },
  { key: "onTime", label: "On Time", icon: CheckCircle2, value: KPIS.onTime, tone: "success" },
  { key: "delayed", label: "Delayed", icon: AlertTriangle, value: KPIS.delayed, tone: "danger" },
] as const;

const toneClasses: Record<string, string> = {
  ink: "bg-[var(--surface-2)] text-[var(--ink-700)]",
  brand: "bg-[var(--brand-50)] text-[var(--brand-700)] border-[var(--brand-200)]",
  info: "bg-blue-50 text-blue-700 border-blue-200",
  warning: "bg-amber-50 text-amber-700 border-amber-200",
  success: "bg-emerald-50 text-emerald-700 border-emerald-200",
  danger: "bg-rose-50 text-rose-700 border-rose-200",
};

function PpcDashboard() {
  const pending = ORDERS.filter((o) => o.status === "pending_acceptance");
  const [acceptTarget, setAcceptTarget] = useState<Order | null>(null);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Good morning, Rohan</h1>
        <p className="text-sm text-[var(--ink-500)] mt-1">
          You have <strong className="text-[var(--brand-600)]">{pending.length} orders</strong> waiting for your acceptance.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {KPI_TILES.map((t, i) => (
          <motion.div
            key={t.key}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            className={`rounded-2xl border bg-white px-4 py-3.5 shadow-soft border-black/[0.04] hover:border-[var(--brand-200)] transition`}
          >
            <div className="flex items-center justify-between">
              <div className={`w-8 h-8 rounded-lg inline-flex items-center justify-center border ${toneClasses[t.tone]}`}>
                <t.icon className="w-4 h-4" />
              </div>
              <span className="text-[10px] uppercase tracking-wider text-[var(--ink-500)]">{t.label.split(" ").pop()}</span>
            </div>
            <div className="mt-2.5 text-2xl font-semibold tracking-tight">{t.value}</div>
            <div className="text-[11px] text-[var(--ink-500)] mt-0.5">{t.label}</div>
          </motion.div>
        ))}
      </div>

      <section>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">Pending Acceptance</h2>
            <p className="text-xs text-[var(--ink-500)]">PIC has assigned timelines — confirm your commitment to start the clock.</p>
          </div>
          <span className="text-xs px-2.5 py-1 rounded-full bg-[var(--brand-50)] text-[var(--brand-700)] border border-[var(--brand-200)] font-medium">
            {pending.length} waiting
          </span>
        </div>

        <div className="bg-white rounded-2xl border border-black/[0.04] shadow-soft overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-[var(--surface-1)] text-[10px] uppercase tracking-wider text-[var(--ink-500)]">
              <tr>
                {["Order #", "PO #", "Date", "Distributor", "Parts", "Days (PIC)", ""].map((h) => (
                  <th key={h} className="text-left px-4 py-2.5 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pending.map((o) => (
                <tr key={o.id} className="border-t border-black/5 hover:bg-[var(--brand-50)]/40 transition">
                  <td className="px-4 py-3 font-mono font-semibold text-[var(--brand-600)]">{o.orderNo}</td>
                  <td className="px-4 py-3 font-mono text-[var(--ink-700)]">{o.poNo}</td>
                  <td className="px-4 py-3 text-[var(--ink-700)]">{o.date}</td>
                  <td className="px-4 py-3 text-[var(--ink-700)]">{o.distributor}</td>
                  <td className="px-4 py-3 text-[var(--ink-900)] font-medium">{o.totalParts.toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-xs font-medium">
                      <Calendar className="w-3 h-3" /> {o.picDays} days
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => setAcceptTarget(o)}
                      className="text-xs px-3 py-1.5 rounded-full bg-gradient-brand text-white font-medium shadow-soft hover:opacity-95"
                    >
                      Review & Accept
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold tracking-tight">Running Orders</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {ORDERS.filter((o) => o.status !== "pending_acceptance").map((o) => {
            const arranged = o.parts.reduce((a, p) => a + p.arranged, 0);
            const pct = Math.round((arranged / o.totalQty) * 100);
            const delayed = o.status === "delayed";
            return (
              <Link
                key={o.id}
                to="/ppc/orders/$orderId"
                params={{ orderId: o.id }}
                className="block bg-white rounded-2xl border border-black/[0.04] shadow-soft p-4 hover:border-[var(--brand-200)] transition group"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-mono font-semibold text-[var(--brand-600)]">{o.orderNo}</div>
                    <div className="text-xs text-[var(--ink-500)] mt-0.5">{o.distributor}</div>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium border inline-flex items-center gap-1 ${
                    delayed
                      ? "bg-rose-50 text-rose-700 border-rose-200"
                      : "bg-blue-50 text-blue-700 border-blue-200"
                  }`}>
                    {delayed ? <AlertTriangle className="w-3 h-3" /> : <Truck className="w-3 h-3" />} {o.dueLabel}
                  </span>
                </div>
                <div className="mt-3">
                  <div className="flex items-center justify-between text-xs text-[var(--ink-500)] mb-1">
                    <span>{arranged.toLocaleString()} / {o.totalQty.toLocaleString()} arranged</span>
                    <span className="font-semibold text-[var(--ink-900)]">{pct}%</span>
                  </div>
                  <div className="h-1.5 bg-[var(--surface-2)] rounded-full overflow-hidden">
                    <div
                      className={`h-full ${delayed ? "bg-rose-500" : "bg-gradient-brand"}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between text-xs">
                  <span className="text-[var(--ink-500)]">{o.plant} · {o.ppcDays}d committed</span>
                  <span className="text-[var(--brand-600)] font-medium inline-flex items-center gap-0.5 group-hover:gap-1.5 transition-all">
                    Open <ChevronRight className="w-3 h-3" />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {acceptTarget && (
        <AcceptModal order={acceptTarget} onClose={() => setAcceptTarget(null)} />
      )}
    </div>
  );
}

function AcceptModal({ order, onClose }: { order: Order; onClose: () => void }) {
  const [days, setDays] = useState(order.picDays);
  const [remark, setRemark] = useState("");
  const submit = () => {
    toast.success(`Accepted ${order.orderNo} — committed ${days} days`);
    onClose();
  };
  return (
    <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center p-6" onClick={onClose}>
      <motion.div
        initial={{ scale: 0.96, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-soft-lg relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-[var(--surface-2)]">
          <X className="w-4 h-4" />
        </button>
        <div className="flex items-center gap-2.5 mb-1">
          <div className="w-8 h-8 rounded-lg bg-[var(--brand-50)] border border-[var(--brand-200)] flex items-center justify-center">
            <FileText className="w-4 h-4 text-[var(--brand-600)]" />
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-widest text-[var(--ink-500)]">Accept Order</div>
            <div className="font-mono font-semibold text-[var(--brand-600)]">{order.orderNo}</div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mt-4 p-3 rounded-2xl bg-[var(--surface-1)] border border-black/5">
          <Stat label="Date" value={order.date} />
          <Stat label="Distributor" value={order.distributor} />
          <Stat label="Total Parts" value={order.totalParts.toLocaleString()} />
          <Stat label="Days Assigned by PIC" value={`${order.picDays} days`} />
        </div>

        <div className="mt-4 space-y-3">
          <div>
            <label className="text-xs font-medium text-[var(--ink-700)]">Days you commit to</label>
            <div className="mt-1.5 flex items-center gap-2">
              <input
                type="number"
                min={1}
                value={days}
                onChange={(e) => setDays(Number(e.target.value))}
                className="w-24 px-3 py-2 rounded-xl border border-black/10 focus:border-[var(--brand-500)] focus:ring-2 focus:ring-[var(--brand-200)] outline-none text-sm font-medium"
              />
              <span className="text-xs text-[var(--ink-500)]">days from acceptance</span>
              {days !== order.picDays && (
                <span className={`text-xs px-2 py-0.5 rounded-full border ${
                  days > order.picDays
                    ? "bg-rose-50 text-rose-700 border-rose-200"
                    : "bg-emerald-50 text-emerald-700 border-emerald-200"
                }`}>
                  {days > order.picDays ? `+${days - order.picDays}` : days - order.picDays} vs PIC
                </span>
              )}
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-[var(--ink-700)] inline-flex items-center gap-1">
              <MessageSquare className="w-3 h-3" /> Remark (optional)
            </label>
            <textarea
              value={remark}
              onChange={(e) => setRemark(e.target.value)}
              rows={2}
              placeholder="Flag any shortage, dependency, or note for PIC…"
              className="mt-1.5 w-full px-3 py-2 rounded-xl border border-black/10 focus:border-[var(--brand-500)] focus:ring-2 focus:ring-[var(--brand-200)] outline-none text-sm resize-none"
            />
          </div>
        </div>

        <div className="mt-5 flex items-center justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 rounded-xl text-sm font-medium text-[var(--ink-700)] hover:bg-[var(--surface-2)]">
            Cancel
          </button>
          <button onClick={submit} className="px-4 py-2 rounded-xl text-sm font-semibold text-white bg-gradient-brand shadow-soft hover:opacity-95">
            Accept & Start Clock
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider text-[var(--ink-500)]">{label}</div>
      <div className="text-sm font-medium text-[var(--ink-900)] mt-0.5">{value}</div>
    </div>
  );
}
