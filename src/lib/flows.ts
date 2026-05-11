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
  isQuickRef?: boolean;
  searchTags?: string[];   // AI tag chips shown above illustration
  highlight?: "red" | "purple"; // pill / overlay color
};

export type ChatMessage =
  | { id: string; role: "user" | "bot"; type: "text"; text: string }
  | { id: string; role: "bot"; type: "typing" }
  | { id: string; role: "bot"; type: "priority" }
  | { id: string; role: "bot"; type: "ticket"; ticketId: string }
  | { id: string; role: "bot"; type: "tracking"; orderId: string; eta: string; carrier?: string; status?: string; partNos?: string[] }
  | { id: string; role: "bot"; type: "order-header"; orderId: string; placed: string; items: number; total: string; partNos?: string[] }
  | { id: string; role: "bot"; type: "eta-pending"; orderId: string; ticketId?: string; partNos?: string[] }
  | { id: string; role: "bot"; type: "attachment-picker" }
  | { id: string; role: "bot"; type: "model-picker"; attachment: string }
  | { id: string; role: "bot"; type: "variant-picker"; attachment: string; model: string }
  | { id: string; role: "bot"; type: "assembly-picker"; attachment: string; model: string; variant: string }
  | { id: string; role: "bot"; type: "part-query"; model: string; variant: string }
  | { id: string; role: "bot"; type: "result-list"; query: string; model: string; variant: string; items: PartItem[] }
  | { id: string; role: "bot"; type: "part-detail"; part: PartItem }
  | { id: string; role: "bot"; type: "accessory-picker"; kind: "Filter" | "Key" }
  | { id: string; role: "bot"; type: "accessory-list"; kind: "Filter" | "Key"; series: string; items: PartItem[] }
  | { id: string; role: "bot"; type: "quick-ref-picker" }
  | { id: string; role: "bot"; type: "quick-ref-series"; category: string }
  | { id: string; role: "bot"; type: "quick-ref-submodel"; category: string; series: string }
  | { id: string; role: "bot"; type: "quick-ref-list"; category: string; series: string; submodel?: string; items: PartItem[] }
  | { id: string; role: "bot"; type: "no-results"; query: string };

export type FlowStep = { delay?: number; message: ChatMessage };

const uid = () => Math.random().toString(36).slice(2, 10);
export const newId = uid;

export const suggestions = [
  "Find a part",
  "Browse Quick Reference",
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
  "1526 Backhoe", "2638 HST", "4500 2WD", "4540 4WD", "6075 PST", "eMax 20S HST", "Max 26XLT", "9125 S",
];
export const moreModels = [
  "1533 HST", "1635 Shuttle", "3640 PST", "5145 4WD", "7095 S Cab", "8090 PST Cab", "Roxor", "eMax 22L", "Retriever 1000",
];

export const variantsByModel: Record<string, string[]> = {
  "1526 Backhoe": ["1526B", "1526L", "1526 HST 4WD"],
  "2638 HST": ["Open Station ROPS", "Cab", "HST 4WD with Loader & Backhoe"],
  "4500 2WD": ["4500 2WD"],
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
  "Implements": ["4500 2WD", "4540 4WD", "6075 PST", "9125 S"],
  "Hay Tools & Equipment": ["6075 PST", "9125 S"],
  "New Implements": ["1526 Backhoe", "Max 26XLT", "4540 4WD"],
  "Swinging Drawbar": ["4500 2WD"],
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
  "4500 2WD": [
    { figure: "4500-2WD - DRAWBAR", label: "Swinging Drawbar Attachment (00 Series)" },
  ],
};
export const defaultAssemblies: { figure: string; label: string }[] = [
  { figure: "1526B - FIG 008", label: "Backhoe Valve, Fittings & Hardware (FIG 008)" },
];

// --- Quick Reference: full top-level catalogue (mirrors the QUICK REFERENCE panel) ---
export const quickRefCategories = [
  "3RD FUNCTION KIT", "AUXILIARY VALVE KIT", "BATTERY CHARGERS & JUMP STARTERS",
  "BATTERY SERVICE PRODUCTS", "BLOCK HEATER", "CABIN", "CAMERAS", "ELECTRICALS",
  "ENGINE", "FILTER LIST", "GLOPOWER COLOR RESTORER", "HITCH PARTS",
  "HITCH PARTS DISPLAY", "HYDRAULICS", "KEY LIST", "MAINTENANCE ITEMS",
  "MANUAL LIST", "LUBRICANTS",
];

// Series shared by Quick Reference categories.
export const accessorySeries = [
  "00 Series", "05 Series", "05 Series Old Tractors", "10 Series", "15 Series",
  "1500 Series", "16 Series", "1600 Series", "20 Series", "25 Series", "2500 Series",
];

// Sub-models (e.g. "10 Series → 4010 GEAR / 4010 HST / 5010 GEAR 4WD …")
export const quickRefSubmodels: Record<string, string[]> = {
  "10 Series": ["4010 GEAR", "4010 HST", "5010 GEAR 4WD", "5010 GEAR CABIN", "5010 HST CABIN", "6010 HST CABIN", "6110 GEAR CABIN", "KEY LIST - ALL MODELS"],
  "15 Series": ["1525", "1526", "1533", "1538"],
  "1500 Series": ["1526 GEAR", "1526 HST", "1533 SHUTTLE"],
  "16 Series": ["2516", "2615", "2638"],
  "1600 Series": ["1640", "1665"],
  "20 Series": ["2540", "2545", "2638"],
  "25 Series": ["2555", "2565"],
  "2500 Series": ["2538", "2540", "2545"],
  "00 Series": ["3540", "4540", "5540"],
  "05 Series": ["6075", "8090"],
  "05 Series Old Tractors": ["7095", "8590"],
};

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

// SWINGING DRAWBAR ATTACHMENT — 00 Series, Variant 4500 2WD (uploaded illustration)
const drawbarParts: PartItem[] = [
  { partNo: "E007900403C12", description: "ASSLY PLATE DRAWBAR SUPPORT LH", category: "Implements", vehicle: "Tractor", model: "4500 2WD", variant: "4500 2WD", aggregate: "Drawbar", groupNo: "G-DBR", assembly: "Swinging Drawbar Attachment", figure: "4500-2WD - DRAWBAR", refNo: 2, qty: 1, cost: 32.50, mrp: 48.95, inStock: 14 },
  { partNo: "E007900403C11", description: "ASSLY PLATE DRAWBAR SUPPORT RH", category: "Implements", vehicle: "Tractor", model: "4500 2WD", variant: "4500 2WD", aggregate: "Drawbar", groupNo: "G-DBR", assembly: "Swinging Drawbar Attachment", figure: "4500-2WD - DRAWBAR", refNo: 4, qty: 1, cost: 32.50, mrp: 48.95, inStock: 11, highlight: "purple" },
  { partNo: "E0079DBR005", description: "DRAWBAR PIN", category: "Implements", vehicle: "Tractor", model: "4500 2WD", variant: "4500 2WD", aggregate: "Drawbar", groupNo: "G-DBR", assembly: "Swinging Drawbar Attachment", figure: "4500-2WD - DRAWBAR", refNo: 5, qty: 1, cost: 9.10, mrp: 14.20, inStock: 38 },
  { partNo: "E0079DBR009A", description: "DRAWBAR LOCK CLIP (Pair)", category: "Implements", vehicle: "Tractor", model: "4500 2WD", variant: "4500 2WD", aggregate: "Drawbar", groupNo: "G-DBR", assembly: "Swinging Drawbar Attachment", figure: "4500-2WD - DRAWBAR", refNo: 9, qty: 2, cost: 6.20, mrp: 9.95, inStock: 60 },
  { partNo: "E0079DBR012", description: "HEX BOLT M12 x 60", category: "Hardware", vehicle: "Tractor", model: "4500 2WD", variant: "4500 2WD", aggregate: "Drawbar", groupNo: "G-DBR", assembly: "Swinging Drawbar Attachment", figure: "4500-2WD - DRAWBAR", refNo: 12, qty: 4, cost: 0.85, mrp: 1.65, inStock: 420 },
];

const allCatalogParts: PartItem[] = [...backhoeValveParts, ...drawbarParts];
const sampleParts: PartItem[] = backhoeValveParts;

// Generic Quick Reference item builder. One demo SKU per category is intentionally
// out-of-stock so the "create a ticket for restock" branch is reachable.
export function buildQuickRefItems(category: string, series: string, submodel?: string): PartItem[] {
  const seed = (series + (submodel ?? "")).replace(/\D/g, "").slice(0, 6) || "0";
  const ctx = submodel ? `${series} → ${submodel}` : series;
  const qr = (p: PartItem): PartItem => ({ ...p, isQuickRef: true });
  if (category === "KEY LIST") {
    return [
      qr({ partNo: `KMW${seed}078720`, description: `KEY Assy — ${ctx}`, category, vehicle: "Tractor", model: submodel ?? series, variant: "All", aggregate: category, groupNo: "G-KEY", assembly: `KEY LIST ${ctx}`, figure: `KEY LIST ${ctx}`, refNo: 1, qty: 1, cost: 7.50, mrp: 10.80, inStock: 14 }),
      qr({ partNo: `KMW${seed}KEY02`, description: `Cab Door Key — ${ctx}`, category, vehicle: "Tractor", model: submodel ?? series, variant: "Cab", aggregate: category, groupNo: "G-KEY", assembly: `KEY LIST ${ctx}`, figure: `KEY LIST ${ctx}`, refNo: 2, qty: 2, cost: 3.40, mrp: 7.25, inStock: 0 }),
    ];
  }
  if (category === "FILTER LIST") {
    return [
      qr({ partNo: `KMW${seed}71172`, description: `Engine Oil Filter — ${ctx}`, category, vehicle: "Tractor", model: submodel ?? series, variant: "All", aggregate: "Engine", groupNo: "G-2031", assembly: `FILTER LIST ${ctx}`, figure: `FILTER LIST ${ctx}`, refNo: 1, qty: 1, cost: 12.40, mrp: 18.95, inStock: 142 }),
      qr({ partNo: `KMW${seed}16465`, description: `Hydraulic Oil Filter — ${ctx}`, category, vehicle: "Tractor", model: submodel ?? series, variant: "All", aggregate: "Hydraulics", groupNo: "G-2032", assembly: `FILTER LIST ${ctx}`, figure: `FILTER LIST ${ctx}`, refNo: 2, qty: 1, cost: 28.90, mrp: 42.00, inStock: 0 }),
      qr({ partNo: `KMW${seed}71160`, description: `Fuel Filter Element — ${ctx}`, category, vehicle: "Tractor", model: submodel ?? series, variant: "All", aggregate: "Fuel System", groupNo: "G-2033", assembly: `FILTER LIST ${ctx}`, figure: `FILTER LIST ${ctx}`, refNo: 3, qty: 1, cost: 16.75, mrp: 24.50, inStock: 64 }),
    ];
  }
  return [
    qr({ partNo: `KMW${seed}A001`, description: `${category} primary item — ${ctx}`, category, vehicle: "Tractor", model: submodel ?? series, variant: "All", aggregate: category, groupNo: "G-QR", assembly: `${category} ${ctx}`, figure: `${category} ${ctx}`, refNo: 1, qty: 1, cost: 24.00, mrp: 39.95, inStock: 22 }),
    qr({ partNo: `KMW${seed}A002`, description: `${category} accessory — ${ctx}`, category, vehicle: "Tractor", model: submodel ?? series, variant: "All", aggregate: category, groupNo: "G-QR", assembly: `${category} ${ctx}`, figure: `${category} ${ctx}`, refNo: 2, qty: 1, cost: 11.00, mrp: 17.50, inStock: 0 }),
  ];
}

// Backwards-compat helpers used by older suggestions / triggers.
export const buildFilters = (series: string) => buildQuickRefItems("FILTER LIST", series);
export const buildKeys = (series: string) => buildQuickRefItems("KEY LIST", series);

export function partsByFigure(figure: string): PartItem[] {
  const items = sampleParts.filter((p) => p.figure === figure);
  return items.length ? items : sampleParts;
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
  | "quick-reference"
  | "create-ticket"
  | "wrong-part"
  | "missing-part"
  | "track-eta"
  | "eta-fallback";

export const flowTriggers: { match: RegExp; flow: FlowKey; userText: string }[] = [
  { match: /quick reference|filter list|key list|battery|hitch|cabin|cameras|electrical|maintenance|manual list|lubricant|3rd function|auxiliary valve|block heater|glopower|browse/i, flow: "quick-reference", userText: "Browse Quick Reference" },
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
    case "quick-reference":
      return [
        { delay: 400, message: { id: uid(), role: "bot", type: "text", text: "Sure — Quick Reference covers everything from filters and keys to hitch parts, batteries, hydraulics and more. Which **category** would you like to browse?" } },
        { delay: 250, message: { id: uid(), role: "bot", type: "quick-ref-picker" } },
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
