import { createFileRoute } from "@tanstack/react-router";
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
    </div>
  );
}
