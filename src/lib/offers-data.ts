// Mock data + helpers for OEM Offers, Bulk Upload, and Multi-part Voice Ordering.
// Pure presentation — no backend.

export type Campaign = {
  id: string;
  name: string;
  type: "Service" | "Volume" | "Seasonal" | "Festive" | "Clearance";
  discountPct: number;
  eligiblePartsCount: number;
  validTill: string;          // human readable
  daysLeft: number;
  estSavings: number;          // INR
  status: "active" | "expiring";
  eligibleParts: string[];     // part numbers (mock)
  modelTags?: string[];
};

export const campaigns: Campaign[] = [
  {
    id: "CMP-SVC-24",
    name: "Service Campaign Discount",
    type: "Service",
    discountPct: 12,
    eligiblePartsCount: 48,
    validTill: "30 Jun 2026",
    daysLeft: 15,
    estSavings: 4250,
    status: "active",
    eligibleParts: ["ABC-123", "OIL-001", "FLT-220", "BRK-301"],
    modelTags: ["XEV 9E", "Scorpio N", "Thar"],
  },
  {
    id: "CMP-VOL-Q2",
    name: "Volume Incentive Program",
    type: "Volume",
    discountPct: 5,
    eligiblePartsCount: 120,
    validTill: "30 Jun 2026",
    daysLeft: 15,
    estSavings: 3250,
    status: "active",
    eligibleParts: ["ABC-123", "XYZ-123", "DEF-456", "GHI-789"],
  },
  {
    id: "CMP-MON-EXP",
    name: "Monsoon Filter Bonanza",
    type: "Seasonal",
    discountPct: 18,
    eligiblePartsCount: 24,
    validTill: "17 Jun 2026",
    daysLeft: 2,
    estSavings: 12000,
    status: "expiring",
    eligibleParts: ["FLT-220", "FLT-221", "FLT-300"],
  },
  {
    id: "CMP-FEST-OEM",
    name: "Festive OEM Mega Saver",
    type: "Festive",
    discountPct: 10,
    eligiblePartsCount: 200,
    validTill: "25 Jul 2026",
    daysLeft: 40,
    estSavings: 7500,
    status: "active",
    eligibleParts: ["BRK-301", "BRK-302", "CLT-110"],
  },
];

export type CartLine = { partNo: string; description: string; qty: number; mrp: number };

// Demo dealer cart used by "Check offers on my cart" / "Review my cart"
export const demoCart: CartLine[] = [
  { partNo: "ABC-123", description: "Oil Filter", qty: 10, mrp: 480 },
  { partNo: "XYZ-123", description: "Air Filter", qty: 5, mrp: 620 },
  { partNo: "BRK-301", description: "Front Brake Pad Set", qty: 4, mrp: 2450 },
];

export type Supersession = { oldPart: string; newPart: string; reason: string };
export const supersessionMap: Supersession[] = [
  { oldPart: "DEF-123", newPart: "DEF-456", reason: "Improved gasket material" },
  { oldPart: "OLD-001", newPart: "NEW-001", reason: "Updated bracket design" },
];

// Known parts catalogue for voice/bulk validation
export type CatalogPart = { partNo: string; description: string; mrp: number };
export const partsCatalog: CatalogPart[] = [
  { partNo: "ABC-123", description: "Oil Filter", mrp: 480 },
  { partNo: "XYZ-123", description: "Air Filter", mrp: 620 },
  { partNo: "DEF-456", description: "Fuel Filter", mrp: 890 },
  { partNo: "GHI-789", description: "Brake Pad", mrp: 2450 },
  { partNo: "BRK-301", description: "Front Brake Pad Set", mrp: 2450 },
  { partNo: "FLT-220", description: "Cabin Filter", mrp: 720 },
  { partNo: "OIL-001", description: "Engine Oil 5W30 (1L)", mrp: 540 },
  { partNo: "CLT-110", description: "Clutch Plate", mrp: 3200 },
];

const descriptionAlias: Record<string, string> = {
  "oil filter": "ABC-123",
  "oil filters": "ABC-123",
  "air filter": "XYZ-123",
  "air filters": "XYZ-123",
  "fuel filter": "DEF-456",
  "fuel filters": "DEF-456",
  "brake pad": "GHI-789",
  "brake pads": "GHI-789",
  "front brake pad": "BRK-301",
  "engine oil": "OIL-001",
  "engine oil filter": "ABC-123",
  "engine oil filters": "ABC-123",
  "cabin filter": "FLT-220",
  "clutch plate": "CLT-110",
};

// Number words → integer
const numberWords: Record<string, number> = {
  zero: 0, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
  eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15, sixteen: 16, seventeen: 17,
  eighteen: 18, nineteen: 19, twenty: 20, thirty: 30, forty: 40, fifty: 50, sixty: 60, seventy: 70,
  eighty: 80, ninety: 90, hundred: 100,
};

function wordsToNumber(phrase: string): number | null {
  const tokens = phrase.toLowerCase().trim().split(/[\s-]+/).filter(Boolean);
  if (!tokens.length) return null;
  let total = 0;
  let current = 0;
  for (const tok of tokens) {
    if (numberWords[tok] === undefined) return null;
    const n = numberWords[tok];
    if (n === 100) {
      current = (current || 1) * 100;
    } else if (n >= 20) {
      current += n;
    } else {
      current += n;
    }
  }
  total += current;
  return total > 0 ? total : null;
}

export type ParsedOrderItem = {
  partNo?: string;
  description: string;
  qty: number;
  status: "valid" | "invalid" | "superseded";
  supersededBy?: string;
  mrp?: number;
};

/**
 * Parse a multi-item voice/text order command.
 * Supports:
 *  - "Add 10 Oil Filters, part number ABC-123 and 5 Air Filters, part number XYZ-123"
 *  - "Order 20 Brake Pads and 10 Air Filters"
 *  - "Add 5 ABC-123, 10 DEF-456 and 15 GHI-789"
 *  - Number words: "ten", "twenty five"
 */
export function parseVoiceOrder(text: string): ParsedOrderItem[] {
  const cleaned = text.replace(/^\s*(add|order|i\s+need|i\s+want|please\s+add|book)\s+/i, "");
  // Split on " and ", commas (but keep "part number XXX" attached)
  const chunks = cleaned
    .split(/\s+and\s+|,\s*(?!part\s+number)/i)
    .map((c) => c.trim())
    .filter(Boolean);

  const out: ParsedOrderItem[] = [];

  for (const chunk of chunks) {
    // Try: <qty> <desc?>(, part number <PN>)?
    // Qty can be digits or words at the start.
    const qtyMatch = chunk.match(/^([0-9]+|[a-z\s-]+?)\s+(.*)$/i);
    if (!qtyMatch) continue;
    const qtyRaw = qtyMatch[1].trim();
    let qty: number | null = /^[0-9]+$/.test(qtyRaw) ? parseInt(qtyRaw, 10) : wordsToNumber(qtyRaw);
    let rest = qtyMatch[2].trim();

    // If qty wasn't a number word, try first token only
    if (qty === null) {
      const firstWord = qtyRaw.split(/\s+/)[0];
      qty = numberWords[firstWord.toLowerCase()] ?? null;
      if (qty !== null) {
        rest = (qtyRaw.split(/\s+/).slice(1).join(" ") + " " + rest).trim();
      }
    }
    if (!qty || qty <= 0) continue;

    // Look for explicit part number
    let partNo: string | undefined;
    const pnMatch = rest.match(/part\s*(?:number|no\.?|#)?\s*[:\-]?\s*([A-Z]{2,}[-\s]?[A-Z0-9]+)/i);
    if (pnMatch) {
      partNo = pnMatch[1].replace(/\s+/g, "-").toUpperCase();
      rest = rest.replace(pnMatch[0], "").replace(/,\s*$/, "").trim();
    } else {
      // Maybe the chunk is "5 ABC-123"
      const bareMatch = rest.match(/^([A-Z]{2,}-[A-Z0-9]+)$/i);
      if (bareMatch) {
        partNo = bareMatch[1].toUpperCase();
        rest = "";
      }
    }

    // Resolve description / part lookup
    let description = rest.replace(/\bpart\s*number\b/gi, "").trim();
    let resolved: CatalogPart | undefined;
    if (partNo) {
      resolved = partsCatalog.find((p) => p.partNo.toUpperCase() === partNo);
      if (!resolved && !description) description = partNo;
    }
    if (!resolved && description) {
      const key = description.toLowerCase().replace(/\.+$/, "").trim();
      const aliasPn = descriptionAlias[key] ?? descriptionAlias[key.replace(/s$/, "")];
      if (aliasPn) resolved = partsCatalog.find((p) => p.partNo === aliasPn);
    }

    // Supersession?
    const sup = partNo ? supersessionMap.find((s) => s.oldPart === partNo) : undefined;

    if (sup) {
      out.push({
        partNo,
        description: description || sup.oldPart,
        qty,
        status: "superseded",
        supersededBy: sup.newPart,
      });
    } else if (resolved) {
      out.push({
        partNo: resolved.partNo,
        description: resolved.description,
        qty,
        status: "valid",
        mrp: resolved.mrp,
      });
    } else {
      out.push({
        partNo: partNo,
        description: description || partNo || "Unknown part",
        qty,
        status: "invalid",
      });
    }
  }

  return out;
}

/** Consolidate duplicate part numbers. */
export function consolidate(items: ParsedOrderItem[]): { items: ParsedOrderItem[]; duplicates: string[] } {
  const map = new Map<string, ParsedOrderItem>();
  const dupes: string[] = [];
  for (const it of items) {
    const key = it.partNo ?? it.description.toLowerCase();
    if (map.has(key)) {
      const existing = map.get(key)!;
      existing.qty += it.qty;
      if (!dupes.includes(key)) dupes.push(key);
    } else {
      map.set(key, { ...it });
    }
  }
  return { items: Array.from(map.values()), duplicates: dupes };
}

// ============= Bulk Upload =============
export type BulkRow = { partNo: string; qty: number; remarks?: string };
export type BulkValidatedRow = BulkRow & {
  status: "valid" | "invalid" | "superseded" | "duplicate" | "missing-qty";
  note?: string;
  resolved?: CatalogPart;
};
export type BulkValidationResult = {
  total: number;
  valid: number;
  invalid: number;
  superseded: number;
  duplicates: number;
  rows: BulkValidatedRow[];
};

export function validateBulkRows(rows: BulkRow[]): BulkValidationResult {
  const seen = new Set<string>();
  const validated: BulkValidatedRow[] = rows.map((r) => {
    const pn = (r.partNo || "").toString().trim().toUpperCase();
    if (!pn) return { ...r, status: "invalid", note: "Missing part number" };
    if (!r.qty || r.qty <= 0) return { ...r, status: "missing-qty", note: "Quantity must be greater than 0" };
    if (seen.has(pn)) return { ...r, partNo: pn, status: "duplicate", note: "Duplicate row" };
    seen.add(pn);
    const sup = supersessionMap.find((s) => s.oldPart === pn);
    if (sup) return { ...r, partNo: pn, status: "superseded", note: `Replaced by ${sup.newPart}` };
    const found = partsCatalog.find((p) => p.partNo === pn);
    if (!found) return { ...r, partNo: pn, status: "invalid", note: "Part number not found in catalogue" };
    return { ...r, partNo: pn, status: "valid", resolved: found };
  });
  return {
    total: rows.length,
    valid: validated.filter((r) => r.status === "valid").length,
    invalid: validated.filter((r) => r.status === "invalid" || r.status === "missing-qty").length,
    superseded: validated.filter((r) => r.status === "superseded").length,
    duplicates: validated.filter((r) => r.status === "duplicate").length,
    rows: validated,
  };
}

/** Returns campaigns whose eligibleParts intersect the given cart/lines. */
export function matchCampaignsForParts(partNumbers: string[]): Campaign[] {
  const set = new Set(partNumbers.map((p) => p.toUpperCase()));
  return campaigns.filter((c) => c.eligibleParts.some((p) => set.has(p.toUpperCase())));
}

export function totalSavings(matched: Campaign[]): number {
  return matched.reduce((a, c) => a + c.estSavings, 0);
}

export function formatINR(n: number): string {
  return `₹${n.toLocaleString("en-IN")}`;
}
