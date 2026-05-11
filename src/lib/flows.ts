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
  figure: string;          // e.g. "1526B - FIG 008"
  refNo: number;           // callout number on illustration
  qty: number;
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
  | { id: string; role: "bot"; type: "attachment-picker" }
  | { id: string; role: "bot"; type: "model-picker"; attachment: string }
  | { id: string; role: "bot"; type: "variant-picker"; attachment: string; model: string }
  | { id: string; role: "bot"; type: "assembly-picker"; attachment: string; model: string; variant: string }
  | { id: string; role: "bot"; type: "part-query"; model: string; variant: string }
  | { id: string; role: "bot"; type: "result-list"; query: string; model: string; variant: string; items: PartItem[] }
  | { id: string; role: "bot"; type: "part-detail"; part: PartItem }
  | { id: string; role: "bot"; type: "accessory-picker"; kind: "Filter" | "Key" }
  | { id: string; role: "bot"; type: "accessory-list"; kind: "Filter" | "Key"; series: string; items: PartItem[] };

export type FlowStep = { delay?: number; message: ChatMessage };

const uid = () => Math.random().toString(36).slice(2, 10);
export const newId = uid;

export const suggestions = [
  "Find a part",
  "Find a filter or key",
  "Track my last order",
  "Create a service ticket",
];

export const quickActions = [
  { label: "Order Part", icon: "Package" },
  { label: "Find Alternate Part", icon: "Replace" },
  { label: "Create Ticket", icon: "Ticket" },
  { label: "Check Availability", icon: "CheckCircle" },
];

// Mahindra Tractors USA - popular models
export const popularModels = [
  "1526 Backhoe", "2638 HST", "4540 4WD", "6075 PST", "eMax 20S HST", "Max 26XLT", "9125 S", "Retriever 1000",
];
export const moreModels = [
  "1533 HST", "1635 Shuttle", "3640 PST", "5145 4WD", "7095 S Cab", "8090 PST Cab", "Roxor", "eMax 22L",
];

export const variantsByModel: Record<string, string[]> = {
  "1526 Backhoe": ["1526B", "1526L", "1526 HST 4WD"],
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

// --- Parts hierarchy: Attachment → Model → Variant → Assembly (Figure) → Parts ---
export const attachmentCategories = [
  "Backhoe", "Hay Tools & Equipment", "Implements", "Loader", "Mower", "New Implements",
];

export const modelsByAttachment: Record<string, string[]> = {
  "Backhoe": ["1526 Backhoe", "Max 26XLT", "2638 HST"],
  "Loader": ["1526 Backhoe", "4540 4WD", "6075 PST", "eMax 20S HST"],
  "Mower": ["eMax 20S HST", "Max 26XLT"],
  "Implements": ["4540 4WD", "6075 PST", "9125 S"],
  "Hay Tools & Equipment": ["6075 PST", "9125 S"],
  "New Implements": ["1526 Backhoe", "Max 26XLT", "4540 4WD"],
};

// Available assembly figures per (model + variant). Default keyed by variant.
export const assembliesByVariant: Record<string, { figure: string; label: string }[]> = {
  "1526B": [
    { figure: "1526B - FIG 008", label: "Backhoe Valve, Fittings & Hardware (FIG 008)" },
    { figure: "1526B - FIG 009", label: "Boom & Dipper Cylinder (FIG 009)" },
    { figure: "1526B - FIG 010", label: "Swing Frame & Stabilizers (FIG 010)" },
  ],
  "1526L": [
    { figure: "1526L - FIG 002", label: "Loader Frame & Hardware (FIG 002)" },
    { figure: "1526L - FIG 003", label: "Loader Hydraulic Lines (FIG 003)" },
  ],
};
export const defaultAssemblies: { figure: string; label: string }[] = [
  { figure: "1526B - FIG 008", label: "Backhoe Valve, Fittings & Hardware (FIG 008)" },
];

// --- Accessories (Filters / Keys) hierarchy by Series ---
export const accessorySeries = [
  "00 Series", "05 Series", "05 Series Old Tractors", "10 Series", "15 Series",
  "1500 Series", "16 Series", "1600 Series", "20 Series", "25 Series", "2500 Series",
];

// Backhoe Valve, Fittings & Hardware (1526B - FIG 008) - matches the user's reference illustration
const backhoeValveParts: PartItem[] = [
  { partNo: "KMW05806448", description: "BACKHOE Valve", category: "Hydraulics", vehicle: "Backhoe", model: "1526 Backhoe", variant: "1526B", aggregate: "Backhoe", groupNo: "G-008", assembly: "Backhoe Valve, Fittings & Hardware", figure: "1526B - FIG 008", refNo: 1, qty: 1, cost: 1280.00, mrp: 1750.00, inStock: 4 },
  { partNo: "KMW05861106406", description: 'HYDRAULIC Adapter Straight Qc To V Orbm 3/4" x Jicm 9/16"', category: "Hydraulics", vehicle: "Backhoe", model: "1526 Backhoe", variant: "1526B", aggregate: "Backhoe", groupNo: "G-008", assembly: "Backhoe Valve, Fittings & Hardware", figure: "1526B - FIG 008", refNo: 2, qty: 6, cost: 14.20, mrp: 21.50, inStock: 88 },
  { partNo: "KMW05452031", description: "HEX Head Cap Screw 5/16-18 x 2.25", category: "Hardware", vehicle: "Backhoe", model: "1526 Backhoe", variant: "1526B", aggregate: "Backhoe", groupNo: "G-008", assembly: "Backhoe Valve, Fittings & Hardware", figure: "1526B - FIG 008", refNo: 3, qty: 2, cost: 1.10, mrp: 2.40, inStock: 312 },
  { partNo: "KMW05552001", description: 'HEX Nut 5/16"-18NC', category: "Hardware", vehicle: "Backhoe", model: "1526 Backhoe", variant: "1526B", aggregate: "Backhoe", groupNo: "G-008", assembly: "Backhoe Valve, Fittings & Hardware", figure: "1526B - FIG 008", refNo: 5, qty: 2, cost: 0.55, mrp: 1.20, inStock: 540 },
  { partNo: "KMW05863108408", description: "HYDRAULIC Adapter, 90°", category: "Hydraulics", vehicle: "Backhoe", model: "1526 Backhoe", variant: "1526B", aggregate: "Backhoe", groupNo: "G-008", assembly: "Backhoe Valve, Fittings & Hardware", figure: "1526B - FIG 008", refNo: 6, qty: 3, cost: 18.40, mrp: 27.95, inStock: 56 },
  { partNo: "KMW05863106406", description: "Fitting", category: "Hydraulics", vehicle: "Backhoe", model: "1526 Backhoe", variant: "1526B", aggregate: "Backhoe", groupNo: "G-008", assembly: "Backhoe Valve, Fittings & Hardware", figure: "1526B - FIG 008", refNo: 7, qty: 6, cost: 9.80, mrp: 15.40, inStock: 122 },
  { partNo: "KMW05862408508", description: "HYDRAULIC Adapter, 45°", category: "Hydraulics", vehicle: "Backhoe", model: "1526 Backhoe", variant: "1526B", aggregate: "Backhoe", groupNo: "G-008", assembly: "Backhoe Valve, Fittings & Hardware", figure: "1526B - FIG 008", refNo: 8, qty: 1, cost: 17.20, mrp: 25.50, inStock: 33 },
  { partNo: "KMW05863406506", description: "HYDRAULIC Adapter 90°", category: "Hydraulics", vehicle: "Backhoe", model: "1526 Backhoe", variant: "1526B", aggregate: "Backhoe", groupNo: "G-008", assembly: "Backhoe Valve, Fittings & Hardware", figure: "1526B - FIG 008", refNo: 9, qty: 6, cost: 19.40, mrp: 28.95, inStock: 47 },
  { partNo: "KMW05442009", description: "LOCKWASHER 5/16 (Note 2)", category: "Hardware", vehicle: "Backhoe", model: "1526 Backhoe", variant: "1526B", aggregate: "Backhoe", groupNo: "G-008", assembly: "Backhoe Valve, Fittings & Hardware", figure: "1526B - FIG 008", refNo: 10, qty: 2, cost: 0.35, mrp: 0.95, inStock: 880 },
];

const sampleParts: PartItem[] = backhoeValveParts;

// Filter accessories grouped by series
export function buildFilters(series: string): PartItem[] {
  const seed = series.replace(/\D/g, "") || "0";
  return [
    { partNo: `KMW${seed}71172000`, description: `Engine Oil Filter — ${series}`, category: "Filters", vehicle: "Tractor", model: series, variant: "All", aggregate: "Engine", groupNo: "G-2031", assembly: "Lube System", figure: `FILTER LIST - ${series}`, refNo: 1, qty: 1, cost: 12.40, mrp: 18.95, inStock: 142 },
    { partNo: `KMW${seed}16465D1`, description: `Hydraulic Oil Filter — ${series}`, category: "Filters", vehicle: "Tractor", model: series, variant: "All", aggregate: "Hydraulics", groupNo: "G-2032", assembly: "Hydraulic Tank", figure: `FILTER LIST - ${series}`, refNo: 2, qty: 1, cost: 28.90, mrp: 42.00, inStock: 88 },
    { partNo: `KMW${seed}71160000`, description: `Fuel Filter Element — ${series}`, category: "Filters", vehicle: "Tractor", model: series, variant: "All", aggregate: "Fuel System", groupNo: "G-2033", assembly: "Fuel Filter Housing", figure: `FILTER LIST - ${series}`, refNo: 3, qty: 1, cost: 16.75, mrp: 24.50, inStock: 64 },
    { partNo: `KMW${seed}43560`, description: `Outer Air Filter — ${series}`, category: "Filters", vehicle: "Tractor", model: series, variant: "All", aggregate: "Air Intake", groupNo: "G-2034", assembly: "Air Cleaner", figure: `FILTER LIST - ${series}`, refNo: 4, qty: 1, cost: 22.10, mrp: 31.99, inStock: 47 },
  ];
}

// Keys grouped by series
export function buildKeys(series: string): PartItem[] {
  const seed = series.replace(/\D/g, "") || "0";
  return [
    { partNo: `KMW${seed}KEY001`, description: `Ignition Key — ${series} (All Models)`, category: "Keys", vehicle: "Tractor", model: series, variant: "All", aggregate: "Electrical", groupNo: "G-KEY", assembly: "Ignition Switch", figure: `KEY LIST - ${series}`, refNo: 1, qty: 2, cost: 3.20, mrp: 6.95, inStock: 220 },
    { partNo: `KMW${seed}KEY002`, description: `Cab Door Key — ${series}`, category: "Keys", vehicle: "Tractor", model: series, variant: "Cab", aggregate: "Cab", groupNo: "G-KEY", assembly: "Door Lock", figure: `KEY LIST - ${series}`, refNo: 2, qty: 2, cost: 3.40, mrp: 7.25, inStock: 180 },
  ];
}

export function searchParts(query: string, model: string, variant: string): PartItem[] {
  const q = query.trim().toLowerCase();
  // Exact part-no match returns 1
  const exact = sampleParts.find((p) => p.partNo.toLowerCase() === q);
  if (exact) return [exact];
  // Description / category contains
  const matches = sampleParts.filter(
    (p) => p.description.toLowerCase().includes(q) || p.category.toLowerCase().includes(q) || p.partNo.toLowerCase().includes(q)
  );
  if (matches.length) return matches;
  return sampleParts.map((p) => ({ ...p, model: model || p.model, variant: variant || p.variant }));
}

export type FlowKey =
  | "part-search"
  | "accessory-search"
  | "create-ticket"
  | "wrong-part"
  | "missing-part"
  | "track-eta"
  | "eta-fallback";

export const flowTriggers: { match: RegExp; flow: FlowKey; userText: string }[] = [
  { match: /filter|key list|accessor/i, flow: "accessory-search", userText: "I want to find a filter or key" },
  { match: /find.*part|search.*part|part\s*(no|number)|i need a part|kmw\d+/i, flow: "part-search", userText: "I need to find a part" },
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
        { delay: 400, message: { id: uid(), role: "bot", type: "text", text: "Sure — let's find the right part. Which **attachment category** is this for?" } },
        { delay: 250, message: { id: uid(), role: "bot", type: "attachment-picker" } },
      ];
    case "accessory-search":
      return [
        { delay: 400, message: { id: uid(), role: "bot", type: "text", text: "Got it — accessories are organised under **Filter List** and **Key List**, then by **Series**. Pick one to start:" } },
        { delay: 250, message: { id: uid(), role: "bot", type: "accessory-picker", kind: "Filter" } },
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
        { delay: 600, message: { id: uid(), role: "bot", type: "text", text: "Thanks for reaching out. I see you ordered **KMW05863406506** (HYDRAULIC Adapter 90° for the 1526 Backhoe) but received **KMW05863106406** (Fitting) instead. I apologize for the mix-up." } },
        { delay: 900, message: { id: uid(), role: "bot", type: "text", text: "I've logged this as a **High Priority** issue. Please confirm or change priority." } },
        { delay: 200, message: { id: uid(), role: "bot", type: "priority" } },
      ];
    case "missing-part":
      return [
        { delay: 600, message: { id: uid(), role: "bot", type: "text", text: "Thanks for reaching out. I'm sorry about the missing part in order **111005279**." } },
        { delay: 900, message: { id: uid(), role: "bot", type: "text", text: "Could you please confirm the missing part number and description so I can proceed with the ticket?" } },
        { delay: 1500, message: { id: uid(), role: "user", type: "text", text: "The missing part is KMW05861106406 (Hydraulic Adapter Straight)" } },
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
