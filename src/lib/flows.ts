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
  "Bolero", "Scorpio", "XUV 700", "XEV 9E", "Thar", "1626 HST", "Treo", "Bolero Maxx",
];
export const moreModels = [
  "XUV 300", "XUV 400 EV", "Marazzo", "Alturas G4", "Pik Up", "Jeeto", "Supro", "Blazo X",
];

export const variantsByModel: Record<string, string[]> = {
  "XEV 9E": ["XEV 9E THREE SELECT", "XEV 9E PACK ONE", "XEV 9E PACK TWO", "XEV 9E PACK THREE"],
  "Bolero": ["Bolero B4", "Bolero B6", "Bolero B6 (O)"],
  "Scorpio": ["Scorpio-N Z2", "Scorpio-N Z4", "Scorpio-N Z8", "Scorpio Classic S5"],
  "XUV 700": ["MX", "AX3", "AX5", "AX7", "AX7 L"],
  "Thar": ["Thar AX (O)", "Thar LX 4WD", "Thar Roxx MX1"],
  "1626 HST": ["Standard", "Cab", "ROPS"],
  "Treo": ["HRT", "SFT", "ZOR Grand"],
  "Bolero Maxx": ["City", "HD", "Pik Up"],
};

export const partCategories = [
  "Brakes", "Engine", "Transmission", "Electrical", "Body", "Suspension", "Filters", "Lubricants",
];

const sampleParts: PartItem[] = [
  { partNo: "S0601D010111N", description: "Front Brake Pad Set", category: "Brakes", vehicle: "SUV", model: "XEV 9E", variant: "XEV 9E THREE SELECT", aggregate: "Front Axle", groupNo: "G-1041", assembly: "Disc Pad", cost: 42.10, mrp: 58.00, inStock: 142 },
  { partNo: "S0601D010112N", description: "Rear Brake Pad Set", category: "Brakes", vehicle: "SUV", model: "XEV 9E", variant: "XEV 9E THREE SELECT", aggregate: "Rear Axle", groupNo: "G-1042", assembly: "Disc Pad", cost: 38.40, mrp: 52.00, inStock: 88 },
  { partNo: "S0601R020045N", description: "Front Brake Disc Rotor", category: "Brakes", vehicle: "SUV", model: "XEV 9E", variant: "XEV 9E THREE SELECT", aggregate: "Front Axle", groupNo: "G-1043", assembly: "Disc", cost: 96.00, mrp: 128.00, inStock: 34 },
  { partNo: "S0601C030210N", description: "Brake Caliper LH", category: "Brakes", vehicle: "SUV", model: "XEV 9E", variant: "XEV 9E THREE SELECT", aggregate: "Front Axle", groupNo: "G-1044", assembly: "Caliper", cost: 142.00, mrp: 188.00, inStock: 12 },
  { partNo: "S0601H040118N", description: "Brake Hose Front RH", category: "Brakes", vehicle: "SUV", model: "XEV 9E", variant: "XEV 9E THREE SELECT", aggregate: "Front Axle", groupNo: "G-1045", assembly: "Hose", cost: 18.20, mrp: 26.00, inStock: 60 },
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
        { delay: 600, message: { id: uid(), role: "bot", type: "text", text: "Thank you for contacting support. I understand you ordered **BRK-FRT-4421** (Front Brake Pad) but received **BRK-RR-5561** (Rear Brake Pad) instead. I apologize for the inconvenience." } },
        { delay: 900, message: { id: uid(), role: "bot", type: "text", text: "I've logged this as a **High Priority** issue. Please confirm or change priority." } },
        { delay: 200, message: { id: uid(), role: "bot", type: "priority" } },
      ];
    case "missing-part":
      return [
        { delay: 600, message: { id: uid(), role: "bot", type: "text", text: "Thank you for reaching out. I'm sorry about the missing part in order **111005279**." } },
        { delay: 900, message: { id: uid(), role: "bot", type: "text", text: "Could you please confirm the missing part number and description so I can proceed with the ticket?" } },
        { delay: 1500, message: { id: uid(), role: "user", type: "text", text: "The missing part is BRK-FRT-4421 (Front Brake Pad)" } },
        { delay: 700, message: { id: uid(), role: "bot", type: "text", text: "Thank you for the confirmation. Your ticket has been created successfully." } },
        { delay: 250, message: { id: uid(), role: "bot", type: "ticket", ticketId: "EPC-61484" } },
      ];
    case "track-eta":
      return [
        { delay: 500, message: { id: uid(), role: "bot", type: "text", text: "Sure — pulling up your most recent order…" } },
        { delay: 1100, message: { id: uid(), role: "bot", type: "typing" } },
        { delay: 1100, message: { id: uid(), role: "bot", type: "text", text: "Your most recent order is **#111005278**, placed on Apr 4, 2026 for 3 line items (₹ 12,480)." } },
        { delay: 250, message: { id: uid(), role: "bot", type: "order-header", orderId: "111005278", placed: "Apr 4, 2026", items: 3, total: "₹ 12,480" } },
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
