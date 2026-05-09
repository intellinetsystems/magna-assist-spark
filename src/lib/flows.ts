export type PartItem = {
  partNo: string;
  description: string;
  category: string;
  vehicle: string;
  model: string;
  variant: string;
  aggregate: string;
  groupNo: string;
  assembly: string;
  cost: number;
  mrp: number;
  inStock: number;
};

export type ChatMessage =
  | { id: string; role: "user" | "bot"; type: "text"; text: string }
  | { id: string; role: "bot"; type: "typing" }
  | { id: string; role: "bot"; type: "priority" }
  | { id: string; role: "bot"; type: "ticket"; ticketId: string }
  | { id: string; role: "bot"; type: "tracking"; orderId: string; eta: string }
  | { id: string; role: "bot"; type: "order-header"; orderId: string; placed: string; items: number; total: string }
  | { id: string; role: "bot"; type: "eta-pending"; orderId: string }
  | { id: string; role: "bot"; type: "model-picker" }
  | { id: string; role: "bot"; type: "variant-picker"; model: string }
  | { id: string; role: "bot"; type: "part-query"; model: string; variant: string }
  | { id: string; role: "bot"; type: "result-list"; query: string; model: string; variant: string; items: PartItem[] }
  | { id: string; role: "bot"; type: "part-detail"; part: PartItem };

export type FlowStep = { delay?: number; message: ChatMessage };

const uid = () => Math.random().toString(36).slice(2, 10);
export const newId = uid;

export const suggestions = [
  "Find a part",
  "Track my last order",
  "Report an order issue",
  "Create a service ticket",
];

export const quickActions = [
  { label: "Order Part", icon: "Package" },
  { label: "Find Alternate Part", icon: "Replace" },
  { label: "Create Ticket", icon: "Ticket" },
  { label: "Check Availability", icon: "CheckCircle" },
];

export const popularModels = [
  "1626 HST", "2638 HST", "4540 4WD", "6075 PST", "eMax 20S HST", "Max 26XLT", "9125 S", "Retriever 1000",
];
export const moreModels = [
  "1533 HST", "1635 Shuttle", "3640 PST", "5145 4WD", "7095 S Cab", "8090 PST Cab", "Roxor", "eMax 22L",
];

export const variantsByModel: Record<string, string[]> = {
  "1626 HST": ["Open Station ROPS", "Cab", "HST 4WD with Loader"],
  "2638 HST": ["Open Station ROPS", "Cab", "HST 4WD with Loader & Backhoe"],
  "4540 4WD": ["2WD ROPS", "4WD ROPS", "4WD Cab"],
  "6075 PST": ["PST Cab", "PST ROPS", "Power Shuttle 4WD"],
  "eMax 20S HST": ["Open Station", "with Loader", "with Mid-Mount Mower"],
  "Max 26XLT": ["HST 4WD ROPS", "HST 4WD with Loader", "HST 4WD with Backhoe"],
  "9125 S": ["S Cab 4WD", "P Cab 4WD", "S ROPS 4WD"],
  "Retriever 1000": ["Standard 4x4", "Crew 4x4 LE", "Flexhauler"],
};

export const partCategories = [
  "Engine", "Hydraulics", "Transmission / PTO", "Electrical", "Filters", "Front Axle / Loader", "Cab & Seat", "Tires & Wheels",
];

const sampleParts: PartItem[] = [
  { partNo: "11471172000", description: "Engine Oil Filter", category: "Filters", vehicle: "Compact Tractor", model: "2638 HST", variant: "Cab", aggregate: "Engine", groupNo: "G-2031", assembly: "Lube System", cost: 12.40, mrp: 18.95, inStock: 142 },
  { partNo: "006016465D1", description: "Hydraulic Oil Filter", category: "Filters", vehicle: "Compact Tractor", model: "2638 HST", variant: "Cab", aggregate: "Hydraulics", groupNo: "G-2032", assembly: "Hydraulic Tank", cost: 28.90, mrp: 42.00, inStock: 88 },
  { partNo: "11471160000", description: "Fuel Filter Element", category: "Filters", vehicle: "Compact Tractor", model: "2638 HST", variant: "Cab", aggregate: "Fuel System", groupNo: "G-2033", assembly: "Fuel Filter Housing", cost: 16.75, mrp: 24.50, inStock: 64 },
  { partNo: "15861-43560", description: "Outer Air Filter", category: "Filters", vehicle: "Compact Tractor", model: "2638 HST", variant: "Cab", aggregate: "Air Intake", groupNo: "G-2034", assembly: "Air Cleaner", cost: 22.10, mrp: 31.99, inStock: 47 },
  { partNo: "006014983B91", description: "PTO Clutch Plate", category: "Transmission / PTO", vehicle: "Compact Tractor", model: "2638 HST", variant: "Cab", aggregate: "PTO", groupNo: "G-2041", assembly: "Rear PTO", cost: 184.00, mrp: 248.00, inStock: 9 },
];

export function searchParts(query: string, model: string, variant: string): PartItem[] {
  const q = query.toLowerCase();
  // Exact part-no match returns 1
  const exact = sampleParts.find((p) => p.partNo.toLowerCase() === q);
  if (exact) return [exact];
  return sampleParts.map((p) => ({ ...p, model: model || p.model, variant: variant || p.variant }));
}

export type FlowKey =
  | "part-search"
  | "create-ticket"
  | "wrong-part"
  | "missing-part"
  | "track-eta"
  | "eta-fallback";

export const flowTriggers: { match: RegExp; flow: FlowKey; userText: string }[] = [
  { match: /find.*part|search.*part|part\s*(no|number)|i need a part/i, flow: "part-search", userText: "I need to find a part" },
  { match: /service ticket|create.*ticket/i, flow: "create-ticket", userText: "I want to create a service ticket" },
  { match: /wrong part|received.*instead|brk-rr/i, flow: "wrong-part", userText: "I want to report a wrong part on order 111005277" },
  { match: /missing|3 parts instead/i, flow: "missing-part", userText: "Missing part on order 111005279" },
  { match: /eta|track.*order|last order|recent order/i, flow: "track-eta", userText: "Tell me the order status of my last order" },
  { match: /report.*issue|order issue/i, flow: "wrong-part", userText: "I want to report an issue with my order 111005277" },
];

export function buildFlow(flow: FlowKey): FlowStep[] {
  switch (flow) {
    case "part-search":
      return [
        { delay: 400, message: { id: uid(), role: "bot", type: "text", text: "Sure — let's find the right part. Which **vehicle model** is this for?" } },
        { delay: 250, message: { id: uid(), role: "bot", type: "model-picker" } },
      ];
    case "create-ticket":
      return [
        { delay: 500, message: { id: uid(), role: "bot", type: "text", text: "Thank you for contacting support. I'll create a ticket right away. Can you describe the issue?" } },
        { delay: 1400, message: { id: uid(), role: "user", type: "text", text: "I couldn't find the parts" } },
        { delay: 800, message: { id: uid(), role: "bot", type: "text", text: "Understood. I've logged this as a **High Priority** issue. Please confirm or change priority." } },
        { delay: 200, message: { id: uid(), role: "bot", type: "priority" } },
      ];
    case "wrong-part":
      return [
        { delay: 600, message: { id: uid(), role: "bot", type: "text", text: "Thanks for reaching out. I see you ordered **11471172000** (Engine Oil Filter for the 2638 HST) but received **11471160000** (Fuel Filter Element) instead. I apologize for the mix-up." } },
        { delay: 900, message: { id: uid(), role: "bot", type: "text", text: "I've logged this as a **High Priority** issue. Please confirm or change priority." } },
        { delay: 200, message: { id: uid(), role: "bot", type: "priority" } },
      ];
    case "missing-part":
      return [
        { delay: 600, message: { id: uid(), role: "bot", type: "text", text: "Thanks for reaching out. I'm sorry about the missing part in order **111005279**." } },
        { delay: 900, message: { id: uid(), role: "bot", type: "text", text: "Could you please confirm the missing part number and description so I can proceed with the ticket?" } },
        { delay: 1500, message: { id: uid(), role: "user", type: "text", text: "The missing part is 006016465D1 (Hydraulic Oil Filter)" } },
        { delay: 700, message: { id: uid(), role: "bot", type: "text", text: "Thank you for the confirmation. Your ticket has been created successfully." } },
        { delay: 250, message: { id: uid(), role: "bot", type: "ticket", ticketId: "EPC-61484" } },
      ];
    case "track-eta":
      return [
        { delay: 500, message: { id: uid(), role: "bot", type: "text", text: "Sure — pulling up your most recent order…" } },
        { delay: 1100, message: { id: uid(), role: "bot", type: "typing" } },
        { delay: 1100, message: { id: uid(), role: "bot", type: "text", text: "Your most recent order is **#111005278**, placed on Apr 4, 2026 for 3 line items ($248.60)." } },
        { delay: 250, message: { id: uid(), role: "bot", type: "order-header", orderId: "111005278", placed: "Apr 4, 2026", items: 3, total: "$248.60" } },
      ];
    case "eta-fallback":
      return [
        { delay: 500, message: { id: uid(), role: "bot", type: "text", text: "I've checked your order **#111005278** — but the ETA isn't reflected in the system yet." } },
        { delay: 250, message: { id: uid(), role: "bot", type: "eta-pending", orderId: "111005278" } },
      ];
  }
}

export function buildEtaAvailable(): FlowStep[] {
  return [
    { delay: 700, message: { id: uid(), role: "bot", type: "text", text: "Good news — your shipment is being tracked via FedEx. Here's the latest:" } },
    { delay: 250, message: { id: uid(), role: "bot", type: "tracking", orderId: "111005278", eta: "12 May 2026, by 6 PM" } },
  ];
}

export function buildCreateTicketFromEta(): FlowStep[] {
  return [
    { delay: 400, message: { id: uid(), role: "bot", type: "text", text: "Got it. I'll log this as a **High Priority** request to fetch the ETA from the carrier. Please confirm or change priority:" } },
    { delay: 200, message: { id: uid(), role: "bot", type: "priority" } },
  ];
}
