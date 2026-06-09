import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { Factory, LayoutDashboard, ListChecks, ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/ppc")({
  head: () => ({
    meta: [
      { title: "PPC Console — Intelli Catalog" },
      { name: "description", content: "Production Planning & Control workspace: accept orders, arrange parts, send batches to QC, and track delays in real time." },
    ],
  }),
  component: PpcLayout,
});

function PpcLayout() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const onDash = path === "/ppc" || path === "/ppc/";
  return (
    <div className="min-h-screen bg-[var(--surface-1)] text-[var(--ink-900)]">
      <header className="sticky top-0 z-40 border-b border-black/5 bg-white/80 backdrop-blur">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-brand flex items-center justify-center shadow-soft">
              <Factory className="w-4 h-4 text-white" strokeWidth={2.2} />
            </div>
            <div className="leading-tight">
              <div className="text-[13px] font-semibold tracking-tight">PPC Console</div>
              <div className="text-[10px] text-[var(--ink-500)] uppercase tracking-widest">Intelli Catalog</div>
            </div>
          </div>
          <nav className="ml-6 flex items-center gap-1 text-[13px]">
            <Link
              to="/ppc"
              className={`px-3 py-1.5 rounded-full inline-flex items-center gap-1.5 transition ${
                onDash ? "bg-[var(--brand-50)] text-[var(--brand-700)] border border-[var(--brand-200)]" : "text-[var(--ink-700)] hover:bg-[var(--surface-2)]"
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5" /> Dashboard
            </Link>
            <span className="px-3 py-1.5 rounded-full text-[var(--ink-500)] inline-flex items-center gap-1.5">
              <ListChecks className="w-3.5 h-3.5" /> Orders
            </span>
          </nav>
          <div className="ml-auto flex items-center gap-3">
            <Link to="/" className="text-xs text-[var(--ink-500)] hover:text-[var(--brand-600)] inline-flex items-center gap-1">
              <ArrowLeft className="w-3 h-3" /> Back to Assistant
            </Link>
            <div className="w-8 h-8 rounded-full bg-[var(--brand-100)] border border-[var(--brand-200)] text-[var(--brand-700)] font-semibold text-xs flex items-center justify-center">
              RA
            </div>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-6 py-6">
        <Outlet />
      </main>
    </div>
  );
}
