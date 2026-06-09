import { createFileRoute, Link } from "@tanstack/react-router";
import { Factory } from "lucide-react";
import { MockHostPage } from "@/components/assistant/MockHostPage";
import { Assistant } from "@/components/assistant/Assistant";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "MAgNA AI Assistance — Intelli Catalog" },
      { name: "description", content: "Premium AI voice and chat assistant for the Mahindra Rise Intelli Catalog OEM aftermarket parts portal." },
      { property: "og:title", content: "MAgNA AI Assistance — Intelli Catalog" },
      { property: "og:description", content: "OEM-grade AI voice and chat assistant embedded in the Mahindra Intelli Catalog." },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <div className="relative h-screen w-screen overflow-hidden">
      <MockHostPage />
      <Assistant />
      <Link
        to="/ppc"
        className="fixed top-3 right-3 z-30 inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full bg-white/90 backdrop-blur border border-black/5 shadow-soft text-[var(--ink-700)] hover:text-[var(--brand-600)] hover:border-[var(--brand-200)]"
      >
        <Factory className="w-3.5 h-3.5" /> PPC Console
      </Link>
    </div>
  );
}
