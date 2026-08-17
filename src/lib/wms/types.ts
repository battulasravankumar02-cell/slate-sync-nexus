export type OperatorMode = "customer" | "executive";

export interface Sku {
  id: string;
  name: string;
  sku: string;
  price: number;
  stock: number;
  bin: string;
  aisle: number;
  bay: number;
  tier: number;
  status: "ok" | "low" | "out" | "quarantine";
}

export interface OrderLine {
  sku: string;
  name: string;
  qty: number;
  price: number;
}

export interface Order {
  id: string;
  customer: string;
  city: string;
  lines: OrderLine[];
  total: number;
  priority: "standard" | "prime";
  status: "queued" | "picking" | "packed" | "dispatched" | "delivered" | "returned";
  courier: string;
  agentId: string;
  createdAt: number;
  slaDeadline: number | null;
  pod: { signedAt: number; signature: string } | null;
}

export interface Agent {
  id: string;
  name: string;
  vehicle: string;
  hub: string;
  phone: string;
  courier: string;
}

export interface Vendor {
  id: string;
  name: string;
  gstin: string;
  leadTimeHrs: number;
  sla: string;
  rating: number;
  unitsPurchased: number;
  lifetimeSpend: number;
  city: string;
}

export interface PurchaseOrder {
  id: string;
  vendorId: string;
  vendorName: string;
  gstin: string;
  sku: string;
  item: string;
  units: number;
  unitPrice: number;
  subtotal: number;
  gst: number;
  total: number;
  createdAt: number;
  status: "draft" | "issued" | "received";
}

export interface ReturnRecord {
  id: string;
  orderId: string;
  item: string;
  reason: string;
  createdAt: number;
}

export interface LogEntry {
  id: string;
  at: number;
  actor: "mobile" | "desktop" | "autonomous-ai";
  severity: "info" | "warn" | "critical" | "ai";
  message: string;
}

export interface SystemAlert {
  id: string;
  at: number;
  title: string;
  detail: string;
  tone: "emerald" | "amber" | "rose" | "cyan";
}

export interface SeriesPoint {
  label: string;
  orders: number;
  revenue: number;
  depletion: number;
  returns: number;
}

export interface WmsState {
  session: { code: string | null; connected: boolean; pairedAt: number | null };
  skus: Sku[];
  orders: Order[];
  agents: Agent[];
  vendors: Vendor[];
  pos: PurchaseOrder[];
  returns: ReturnRecord[];
  logs: LogEntry[];
  alerts: SystemAlert[];
  series: SeriesPoint[];
  pickPath: string[];
  co2Saved: number;
  counters: { order: number; po: number; ret: number; log: number; alert: number };
}

export interface BusEvent {
  kind: "toast";
  target: "desktop" | "mobile" | "all";
  title: string;
  detail: string;
  tone: "emerald" | "amber" | "rose" | "cyan";
}
