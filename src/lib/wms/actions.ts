import { mutate, readState } from "./store";
import { pushOrder, pushOrderStatus, pushPoBill, pushPoStatus } from "./cloud";
import type { BusEvent, LogEntry, Sku, SystemAlert, WmsState } from "./types";

export const inr = (n: number) =>
  "₹" + n.toLocaleString("en-IN", { maximumFractionDigits: 0 });

export const inrCompact = (n: number) => {
  if (n >= 1_00_00_000) return `₹${(n / 1_00_00_000).toFixed(2)} Cr`;
  if (n >= 1_00_000) return `₹${(n / 1_00_000).toFixed(2)} L`;
  return inr(n);
};

function randomChars(len: number) {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  const buf = new Uint8Array(len);
  crypto.getRandomValues(buf);
  for (let i = 0; i < len; i++) out += alphabet[buf[i]! % alphabet.length];
  return out;
}

function log(d: WmsState, actor: LogEntry["actor"], severity: LogEntry["severity"], message: string) {
  d.counters.log += 1;
  d.logs.unshift({ id: `LOG-${d.counters.log}`, at: Date.now(), actor, severity, message });
  d.logs = d.logs.slice(0, 250);
}

function alert(d: WmsState, title: string, detail: string, tone: SystemAlert["tone"]) {
  d.counters.alert += 1;
  d.alerts.unshift({ id: `ALT-${d.counters.alert}`, at: Date.now(), title, detail, tone });
  d.alerts = d.alerts.slice(0, 40);
}

function bumpToday(d: WmsState, patch: Partial<{ orders: number; revenue: number; depletion: number; returns: number }>) {
  const today = d.series[d.series.length - 1];
  if (!today) return;
  today.orders += patch.orders ?? 0;
  today.revenue += patch.revenue ?? 0;
  today.depletion += patch.depletion ?? 0;
  today.returns += patch.returns ?? 0;
}

function pickAgent(d: WmsState, courier: string) {
  return d.agents.find((a) => a.courier === courier) ?? d.agents[0]!;
}

/* ── Pairing ─────────────────────────────────────────────── */

export function ensureSessionCode(): string {
  const existing = readState().session.code;
  if (existing) return existing;
  const code = `HX-${randomChars(4)}`;
  mutate((d) => {
    d.session.code = code;
    log(d, "mobile", "info", `Mobile operations terminal generated pairing session ${code}.`);
  });
  return code;
}

export function connectRemoteDevice(input: string): boolean {
  const code = input.trim().toUpperCase().replace(/^HX-?/, "");
  const target = readState().session.code;
  if (!target || target.replace("HX-", "") !== code) return false;
  mutate(
    (d) => {
      d.session.connected = true;
      d.session.pairedAt = Date.now();
      log(d, "desktop", "info", `Bi-directional event bus established with remote device ${target}.`);
    },
    [{ kind: "toast", target: "all", title: `Synced: ${target}`, detail: "Live bi-directional event bus active.", tone: "emerald" }],
  );
  return true;
}

export function unpairDevice() {
  mutate((d) => {
    d.session.connected = false;
    d.session.pairedAt = null;
    log(d, "desktop", "warn", "Remote device unpaired — event bus link closed.");
  });
}

/* ── Customer commerce actions ────────────────────────────── */

const CUSTOMERS = [
  { name: "Ananya Iyer", city: "Hyderabad" },
  { name: "Karthik Menon", city: "Kochi" },
  { name: "Priya Sethi", city: "New Delhi" },
  { name: "Arjun Bhatia", city: "Bengaluru" },
  { name: "Neha Kulkarni", city: "Pune" },
];

export function placeOrder(skuId: string, priority: "standard" | "prime", qty = 1) {
  let orderId = "";
  const events: BusEvent[] = [];
  mutate(
    (d) => {
      const sku = d.skus.find((s) => s.id === skuId);
      if (!sku) return;
      d.counters.order += 1;
      orderId = `ORD-${d.counters.order}`;
      const customer = CUSTOMERS[d.counters.order % CUSTOMERS.length]!;
      const total = sku.price * qty;

      // Autonomous decision engine: courier selection by lead time / priority.
      const courier = priority === "prime" ? "Delhivery Enterprise" : "Mahindra Logistics Hub";
      const agent = pickAgent(d, courier);

      d.orders.unshift({
        id: orderId,
        customer: customer.name,
        city: customer.city,
        lines: [{ sku: sku.sku, name: sku.name, qty, price: sku.price }],
        total,
        priority,
        status: priority === "prime" ? "dispatched" : "packed",
        courier,
        agentId: agent.id,
        createdAt: Date.now(),
        slaDeadline: priority === "prime" ? Date.now() + 2 * 60 * 60 * 1000 : null,
        pod: null,
      });

      sku.stock = Math.max(0, sku.stock - qty);
      sku.status = sku.stock === 0 ? "out" : sku.stock < 60 ? "low" : sku.status === "quarantine" ? "quarantine" : "ok";
      if (!d.pickPath.includes(sku.bin)) d.pickPath = [sku.bin, ...d.pickPath].slice(0, 4);

      bumpToday(d, { orders: 1, revenue: total, depletion: qty });
      d.co2Saved = Math.round((d.co2Saved + (priority === "prime" ? 0.4 : 0.9)) * 10) / 10;

      log(d, "mobile", "info", `Customer placed ${priority === "prime" ? "PRIME URGENT" : "standard"} order ${orderId} — ${sku.name} × ${qty} (${inr(total)}).`);
      log(d, "autonomous-ai", "ai", `Auto-pack executed at ${sku.bin}; courier ${courier} selected on lead-time score; agent ${agent.name} (${agent.id}) assigned to vehicle ${agent.vehicle}.`);
      if (priority === "prime") {
        alert(d, `PRIME SLA armed — ${orderId}`, `2-hour SLA countdown active. Route escalated via ${courier}.`, "cyan");
        log(d, "autonomous-ai", "ai", `Standard flow overridden for ${orderId}: express lane locked, dynamic route highlighted, SLA timer < 2h engaged.`);
      }
      if (sku.stock < 60) alert(d, "Reorder point breached", `${sku.sku} at ${sku.stock} units — replenishment recommended.`, "amber");
    },
    events,
  );
  const created = readState().orders.find((o) => o.id === orderId);
  if (created) pushOrder(created);
  const title = priority === "prime" ? `⚡ PRIME URGENT ORDER: #${orderId}` : `🔔 NEW ORDER RECEIVED: #${orderId}`;
  broadcastToast(title, priority === "prime" ? "Delhivery Enterprise auto-assigned · SLA < 2h armed" : "Auto-packed and queued for dispatch", priority === "prime" ? "cyan" : "emerald");
  return orderId;
}

export function requestReturn(orderId: string, reason: string) {
  mutate((d) => {
    const order = d.orders.find((o) => o.id === orderId) ?? d.orders[0];
    if (!order) return;
    d.counters.ret += 1;
    const item = order.lines[0]!;
    d.returns.unshift({ id: `RET-${d.counters.ret}`, orderId: order.id, item: item.name, reason, createdAt: Date.now() });
    order.status = "returned";
    const sku = d.skus.find((s) => s.sku === item.sku);
    if (sku) sku.stock += item.qty;
    bumpToday(d, { returns: 1, revenue: -order.total });
    log(d, "mobile", "warn", `Return requested for ${order.id} — ${item.name}. Reason: ${reason}.`);
    log(d, "autonomous-ai", "ai", `Inventory ledger flagged for reverse logistics; RTO pickup scheduled with ${order.courier}.`);
    alert(d, `Return logged — ${order.id}`, `${item.name} · ${reason}`, "amber");
  });
  pushOrderStatus(orderId, "returned", { return_reason: reason });
  broadcastToast(`↩️ RETURN REQUESTED: #${orderId}`, `Reason: ${reason} · ledger flagged`, "amber");
}

export function confirmDelivery(orderId: string, signature: string) {
  mutate((d) => {
    const order = d.orders.find((o) => o.id === orderId);
    if (!order) return;
    order.status = "delivered";
    order.slaDeadline = null;
    order.pod = { signedAt: Date.now(), signature };
    log(d, "mobile", "info", `e-POD captured for ${order.id} — digital signature "${signature}" verified.`);
    alert(d, `Delivered — ${order.id}`, `e-POD signed by ${signature}.`, "emerald");
  });
  pushOrderStatus(orderId, "delivered", { pod_signature: signature, sla_deadline: null });
  broadcastToast(`📦 DELIVERED: #${orderId}`, `e-POD signature captured · ${signature}`, "emerald");
}

/* ── Warehouse executive actions ──────────────────────────── */

export function triggerStockOut(skuId: string) {
  let poId = "";
  let vendorName = "";
  mutate((d) => {
    const sku = d.skus.find((s) => s.id === skuId);
    if (!sku) return;
    sku.stock = 0;
    sku.status = "out";

    // Autonomous vendor selection: best lead time × rating.
    const vendor = [...d.vendors].sort((a, b) => a.leadTimeHrs / b.rating - b.leadTimeHrs / a.rating)[0]!;
    vendorName = vendor.name;
    const units = 120;
    const unitPrice = Math.round(sku.price * 0.8);
    const subtotal = units * unitPrice;
    const gst = Math.round(subtotal * 0.18);
    d.counters.po += 1;
    poId = `PO-${d.counters.po}`;
    d.pos.unshift({
      id: poId,
      vendorId: vendor.id,
      vendorName: vendor.name,
      gstin: vendor.gstin,
      sku: sku.sku,
      item: sku.name,
      units,
      unitPrice,
      subtotal,
      gst,
      total: subtotal + gst,
      createdAt: Date.now(),
      status: "issued",
    });
    vendor.unitsPurchased += units;
    vendor.lifetimeSpend += subtotal + gst;

    log(d, "mobile", "critical", `Warehouse executive reported STOCK OUT on ${sku.sku} at bin ${sku.bin}.`);
    log(d, "autonomous-ai", "ai", `Zero-stock detected → vendor ${vendor.name} selected (${vendor.leadTimeHrs}h lead, ${vendor.rating}★) → ${poId} auto-generated for ${units} units, ${inr(subtotal + gst)} incl. GST.`);
    alert(d, `Stock out — ${sku.sku}`, `${poId} auto-issued to ${vendor.name} · ${inr(subtotal + gst)}`, "rose");
  });
  const issued = readState().pos.find((p) => p.id === poId);
  if (issued) pushPoBill(issued);
  broadcastToast(`❌ STOCK OUT DETECTED`, `${poId} auto-issued to ${vendorName}`, "rose");
  return poId;
}

export function inboundStock(skuId: string, units: number) {
  let bin = "";
  let receivedPo = "";
  mutate((d) => {
    const sku = d.skus.find((s) => s.id === skuId || s.sku.toUpperCase() === skuId.toUpperCase());
    if (!sku) return;
    sku.stock += units;
    sku.status = sku.stock > 60 ? "ok" : "low";
    bin = sku.bin;
    d.pickPath = [sku.bin, ...d.pickPath.filter((b) => b !== sku.bin)].slice(0, 4);
    const po = d.pos.find((p) => p.sku === sku.sku && p.status === "issued");
    if (po) {
      po.status = "received";
      receivedPo = po.id;
    }
    log(d, "mobile", "info", `Inbound GRN posted: ${units} units of ${sku.sku} received into ${sku.bin}.`);
    log(d, "autonomous-ai", "ai", `Putaway slot ${sku.bin} confirmed optimal by slotting engine; 3D matrix highlighted.`);
    alert(d, "Inbound complete", `${units} units · ${sku.sku} → ${sku.bin}`, "emerald");
  });
  if (receivedPo) pushPoStatus(receivedPo, "received");
  broadcastToast(`📥 INBOUND RECEIVED`, `${units} units putaway at ${bin}`, "emerald");
}

export function flagDamaged(skuId: string) {
  let sku = "";
  mutate((d) => {
    const item = d.skus.find((s) => s.id === skuId);
    if (!item) return;
    sku = item.sku;
    item.status = "quarantine";
    d.pickPath = d.pickPath.filter((b) => b !== item.bin);
    log(d, "mobile", "warn", `Damaged stock flagged on ${item.sku} — isolated from sellable inventory.`);
    log(d, "autonomous-ai", "ai", `SKU ${item.sku} moved to Quarantine Zone Q-1; pick routes auto-rerouted around ${item.bin}.`);
    alert(d, `Quarantine — ${item.sku}`, `Bin ${item.bin} isolated; pick paths rerouted.`, "amber");
  });
  broadcastToast(`🚨 DAMAGED STOCK QUARANTINED`, `${sku} isolated · pick routes rerouted`, "amber");
}

/* ── Bus helper ───────────────────────────────────────────── */

function broadcastToast(title: string, detail: string, tone: BusEvent["tone"]) {
  mutate(() => {}, [{ kind: "toast", target: "desktop", title, detail, tone }]);
}

export function skuStatusTone(status: Sku["status"]) {
  switch (status) {
    case "out":
      return "text-rose-400 border-rose-400/40 bg-rose-400/10";
    case "low":
      return "text-amber-300 border-amber-300/40 bg-amber-300/10";
    case "quarantine":
      return "text-yellow-200 border-yellow-200/40 bg-yellow-200/10";
    default:
      return "text-emerald-300 border-emerald-300/40 bg-emerald-300/10";
  }
}
