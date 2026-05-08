export type ChatMessage =
  | { id: string; role: "user" | "bot"; type: "text"; text: string }
  | { id: string; role: "bot"; type: "typing" }
  | { id: string; role: "bot"; type: "priority" }
  | { id: string; role: "bot"; type: "ticket"; ticketId: string }
  | { id: string; role: "bot"; type: "tracking"; orderId: string }
  | { id: string; role: "bot"; type: "part" };

export type FlowStep = {
  delay?: number;
  message: ChatMessage;
};

const uid = () => Math.random().toString(36).slice(2, 10);

export const suggestions = [
  "Find a part by number",
  "Track my order",
  "Report an order issue",
  "Create a service ticket",
];

export const quickActions = [
  { label: "Order Part", icon: "Package" },
  { label: "Find Alternate Part", icon: "Replace" },
  { label: "Create Ticket", icon: "Ticket" },
  { label: "Check Availability", icon: "CheckCircle" },
];

export type FlowKey =
  | "part-search"
  | "create-ticket"
  | "wrong-part"
  | "missing-part"
  | "track-eta"
  | "eta-fallback";

export const flowTriggers: { match: RegExp; flow: FlowKey; userText: string }[] = [
  { match: /part\s*(no|number)|s0601d010111n|find a part/i, flow: "part-search", userText: "I am looking for Part Number 'S0601D010111N'" },
  { match: /service ticket|create.*ticket/i, flow: "create-ticket", userText: "I want to create a service ticket for Part No. 19042759000, 1038767000 & 19468753000" },
  { match: /wrong part|received.*instead|brk-rr/i, flow: "wrong-part", userText: "I want to report an issue with my order 111005277. I ordered part BRK-FRT-4421, but I received BRK-RR-5561 instead." },
  { match: /missing|3 parts instead/i, flow: "missing-part", userText: "I want to report an issue with my order 111005279. Received 3 parts instead of 4, but invoiced for all 4." },
  { match: /eta|track.*order|111005278/i, flow: "track-eta", userText: "What's the ETA for my order No. 111005278?" },
  { match: /report.*issue|order issue/i, flow: "wrong-part", userText: "I want to report an issue with my order 111005277. I ordered part BRK-FRT-4421, but I received BRK-RR-5561 instead." },
];

export function buildFlow(flow: FlowKey): FlowStep[] {
  switch (flow) {
    case "part-search":
      return [
        { delay: 400, message: { id: uid(), role: "bot", type: "text", text: "Got it! Searching our catalog for Part Number **S0601D010111N**…" } },
        { delay: 1200, message: { id: uid(), role: "bot", type: "typing" } },
        { delay: 1400, message: { id: uid(), role: "bot", type: "text", text: "Found it! Here is the matching part for your **XEV 9E THREE SELECT**:" } },
        { delay: 300, message: { id: uid(), role: "bot", type: "part" } },
      ];
    case "create-ticket":
      return [
        { delay: 500, message: { id: uid(), role: "bot", type: "text", text: "Thank you for contacting support. I'll create a ticket right away. Can you describe the issue you're facing?" } },
        { delay: 1400, message: { id: uid(), role: "user", type: "text", text: "I couldn't find the parts" } },
        { delay: 800, message: { id: uid(), role: "bot", type: "text", text: "Understood. I've logged this as a **High Priority** issue. Please confirm or change priority." } },
        { delay: 200, message: { id: uid(), role: "bot", type: "priority" } },
      ];
    case "wrong-part":
      return [
        { delay: 600, message: { id: uid(), role: "bot", type: "text", text: "Thank you for contacting support. Let me quickly check the details. I understand you ordered **BRK-FRT-4421** (Front Brake Pad) but received **BRK-RR-5561** (Rear Brake Pad) instead. I apologize for the inconvenience." } },
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
        { delay: 500, message: { id: uid(), role: "bot", type: "text", text: "Thank you for contacting support. Let me check the status of your order (**Order ID: 111005278**)…" } },
        { delay: 1400, message: { id: uid(), role: "bot", type: "typing" } },
        { delay: 1500, message: { id: uid(), role: "bot", type: "text", text: "Your order has been shipped. Fetching the latest tracking info from FedEx…" } },
        { delay: 1200, message: { id: uid(), role: "bot", type: "typing" } },
        { delay: 1300, message: { id: uid(), role: "bot", type: "tracking", orderId: "111005278" } },
      ];
    case "eta-fallback":
      return [
        { delay: 500, message: { id: uid(), role: "bot", type: "text", text: "I've checked your order (**Order ID: 111005278**). The estimated delivery time is currently not available in the system." } },
        { delay: 800, message: { id: uid(), role: "bot", type: "text", text: "I'm creating a request with the concerned team to obtain the ETA." } },
        { delay: 800, message: { id: uid(), role: "bot", type: "text", text: "I've logged this as a **High Priority** issue. Please confirm or change priority." } },
        { delay: 200, message: { id: uid(), role: "bot", type: "priority" } },
      ];
  }
}

export const newId = uid;
