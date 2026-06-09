// Mock data for PPC (Production Planning & Control) module

export type OrderStatus = "pending_acceptance" | "running" | "completed" | "delayed";

export type Part = {
  partNo: string;
  description: string;
  category: string;
  ordered: number;
  arranged: number;
  sentToQc: number;
  pendingDays: number;
};

export type ActivityEvent = {
  id: string;
  at: string; // pretty timestamp
  label: string;
  detail?: string;
  delayedDays?: number;
  kind: "info" | "success" | "warning" | "delay";
};

export type Order = {
  id: string;
  orderNo: string;
  poNo: string;
  date: string;
  distributor: string;
  totalParts: number;
  picDays: number;
  ppcDays?: number;
  status: OrderStatus;
  daysPending: number;
  orderType: string;
  paymentTerms: string;
  plant: string;
  totalQty: number;
  dueLabel: string;
  parts: Part[];
  activity: ActivityEvent[];
  remark?: string;
};

const mkActivity = (): ActivityEvent[] => [
  { id: "a1", at: "Mon, 05 May · 09:12", label: "Order Received", kind: "info" },
  { id: "a2", at: "Mon, 05 May · 11:40", label: "PIC Acknowledged", kind: "success" },
  { id: "a3", at: "Mon, 05 May · 03:24 PM", label: "Delivery Date Confirmed", detail: "ETA: Fri, 16 May", kind: "info" },
  { id: "a4", at: "Tue, 06 May · 10:02", label: "Customer Confirmed Date", kind: "success" },
];

export const ORDERS: Order[] = [
  {
    id: "o1",
    orderNo: "ORD-44218",
    poNo: "PO-918214",
    date: "05 May 2026",
    distributor: "Sundaram Auto Spares, Chennai",
    totalParts: 800,
    picDays: 7,
    status: "pending_acceptance",
    daysPending: 1,
    orderType: "Regular",
    paymentTerms: "Net 30",
    plant: "Chakan Plant 2",
    totalQty: 800,
    dueLabel: "Due Fri, 16 May",
    parts: [
      { partNo: "S0601D010111N", description: "Front Brake Pad Set", category: "Brakes", ordered: 200, arranged: 0, sentToQc: 0, pendingDays: 0 },
      { partNo: "S0701T020225N", description: "Clutch Plate Assy", category: "Transmission", ordered: 150, arranged: 0, sentToQc: 0, pendingDays: 0 },
      { partNo: "S0901E031145N", description: "Air Filter Element", category: "Engine", ordered: 250, arranged: 0, sentToQc: 0, pendingDays: 0 },
      { partNo: "S1101S042210N", description: "Shock Absorber Rear", category: "Suspension", ordered: 200, arranged: 0, sentToQc: 0, pendingDays: 0 },
    ],
    activity: mkActivity(),
  },
  {
    id: "o2",
    orderNo: "ORD-44219",
    poNo: "PO-918221",
    date: "05 May 2026",
    distributor: "Krishna Motors, Hyderabad",
    totalParts: 420,
    picDays: 5,
    status: "pending_acceptance",
    daysPending: 1,
    orderType: "Express",
    paymentTerms: "Net 15",
    plant: "Nashik Plant 1",
    totalQty: 420,
    dueLabel: "Due Wed, 14 May",
    parts: [
      { partNo: "S0602D010222N", description: "Rear Brake Shoe", category: "Brakes", ordered: 120, arranged: 0, sentToQc: 0, pendingDays: 0 },
      { partNo: "S0902E031288N", description: "Oil Filter", category: "Engine", ordered: 300, arranged: 0, sentToQc: 0, pendingDays: 0 },
    ],
    activity: mkActivity(),
  },
  {
    id: "o3",
    orderNo: "ORD-44210",
    poNo: "PO-917998",
    date: "02 May 2026",
    distributor: "Patel Auto Hub, Ahmedabad",
    totalParts: 1000,
    picDays: 8,
    ppcDays: 9,
    status: "running",
    daysPending: 4,
    orderType: "Regular",
    paymentTerms: "Net 30",
    plant: "Chakan Plant 2",
    totalQty: 1000,
    dueLabel: "Due Mon, 12 May",
    parts: [
      { partNo: "S0601D010111N", description: "Front Brake Pad Set", category: "Brakes", ordered: 400, arranged: 400, sentToQc: 400, pendingDays: 0 },
      { partNo: "S0701T020225N", description: "Clutch Plate Assy", category: "Transmission", ordered: 200, arranged: 200, sentToQc: 0, pendingDays: 0 },
      { partNo: "S1101S042210N", description: "Shock Absorber Rear", category: "Suspension", ordered: 200, arranged: 80, sentToQc: 0, pendingDays: 2 },
      { partNo: "S1501W050390N", description: "Wheel Hub Bearing", category: "Wheel", ordered: 200, arranged: 0, sentToQc: 0, pendingDays: 3 },
    ],
    activity: [
      ...mkActivity(),
      { id: "a5", at: "Wed, 07 May · 08:15", label: "PPC Accepted", detail: "Committed 9 days", kind: "success" },
      { id: "a6", at: "Thu, 08 May · 04:48 PM", label: "Batch Sent to QC", detail: "400 parts · Front Brake Pad Set", kind: "info" },
      { id: "a7", at: "Sat, 10 May · 11:20", label: "Pending Parts", detail: "200 units · Wheel Hub Bearing", delayedDays: 3, kind: "delay" },
    ],
  },
  {
    id: "o4",
    orderNo: "ORD-44205",
    poNo: "PO-917742",
    date: "29 Apr 2026",
    distributor: "Verma Spares, Lucknow",
    totalParts: 650,
    picDays: 6,
    ppcDays: 6,
    status: "delayed",
    daysPending: 8,
    orderType: "Regular",
    paymentTerms: "Net 30",
    plant: "Nashik Plant 1",
    totalQty: 650,
    dueLabel: "Overdue · 2 days",
    parts: [
      { partNo: "S0901E031145N", description: "Air Filter Element", category: "Engine", ordered: 250, arranged: 250, sentToQc: 250, pendingDays: 0 },
      { partNo: "S1801B060455N", description: "Battery 12V 75Ah", category: "Electrical", ordered: 200, arranged: 120, sentToQc: 120, pendingDays: 2 },
      { partNo: "S2101L070512N", description: "Headlamp Assy LH", category: "Lighting", ordered: 200, arranged: 60, sentToQc: 0, pendingDays: 5 },
    ],
    activity: [
      ...mkActivity(),
      { id: "a5", at: "Wed, 30 Apr · 09:40", label: "PPC Accepted", detail: "Committed 6 days", kind: "success" },
      { id: "a6", at: "Fri, 02 May · 02:10 PM", label: "Batch Sent to QC", detail: "250 parts · Air Filter Element", kind: "info" },
      { id: "a7", at: "Tue, 06 May · 11:00", label: "Batch Sent to QC", detail: "120 parts · Battery 12V 75Ah", kind: "info" },
      { id: "a8", at: "Today · 09:00", label: "Pending Parts", detail: "140 units · Headlamp Assy LH", delayedDays: 5, kind: "delay" },
    ],
  },
];

export const KPIS = {
  total: 24,
  pending: 2,
  running: 12,
  dueToday: 5,
  onTime: 17,
  delayed: 4,
};

export function getOrder(id: string) {
  return ORDERS.find((o) => o.id === id);
}
