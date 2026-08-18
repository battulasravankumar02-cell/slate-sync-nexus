import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { mutate, readState } from "./store";
import type { Order, PurchaseOrder, WmsState } from "./types";

/* ── Row shapes ───────────────────────────────────────────── */

interface OrderRow {
  order_ref: string;
  customer: string;
  city: string;
  sku: string;
  item_name: string;
  qty: number;
  total: number;
  priority: string;
  status: string;
  courier: string | null;
  agent_id: string | null;
  sla_deadline: string | null;
  pod_signature: string | null;
  return_reason: string | null;
  created_at?: string;
}

interface PoRow {
  po_ref: string;
  vendor_name: string;
  gstin: string | null;
  sku: string;
  item_name: string;
  units: number;
  unit_price: number;
  subtotal: number;
  gst: number;
  total: number;
  status: string;
  created_at?: string;
}

const isBrowser = () => typeof window !== "undefined";

/* ── Outbound writes (mobile terminal → cloud) ─────────────── */

export function pushOrder(order: Order) {
  if (!isBrowser()) return;
  const line = order.lines[0];
  const row: OrderRow = {
    order_ref: order.id,
    customer: order.customer,
    city: order.city,
    sku: line?.sku ?? "—",
    item_name: line?.name ?? "—",
    qty: line?.qty ?? 1,
    total: order.total,
    priority: order.priority,
    status: order.status,
    courier: order.courier,
    agent_id: order.agentId,
    sla_deadline: order.slaDeadline ? new Date(order.slaDeadline).toISOString() : null,
    pod_signature: order.pod?.signature ?? null,
    return_reason: null,
  };
  void supabase.from("orders").upsert(row, { onConflict: "order_ref" });
}

export function pushOrderStatus(
  orderRef: string,
  status: Order["status"],
  patch: { pod_signature?: string | null; return_reason?: string | null; sla_deadline?: string | null } = {},
) {
  if (!isBrowser()) return;
  void supabase.from("orders").update({ status, ...patch }).eq("order_ref", orderRef);
}

export function pushPoBill(po: PurchaseOrder) {
  if (!isBrowser()) return;
  const row: PoRow = {
    po_ref: po.id,
    vendor_name: po.vendorName,
    gstin: po.gstin,
    sku: po.sku,
    item_name: po.item,
    units: po.units,
    unit_price: po.unitPrice,
    subtotal: po.subtotal,
    gst: po.gst,
    total: po.total,
    status: po.status,
  };
  void supabase.from("po_bills").upsert(row, { onConflict: "po_ref" });
}

/* ── Inbound merge (cloud → any surface) ──────────────────── */

function mergeOrder(d: WmsState, row: OrderRow) {
  const existing = d.orders.find((o) => o.id === row.order_ref);
  const priority = row.priority === "prime" ? "prime" : "standard";
  const status = row.status as Order["status"];
  if (existing) {
    existing.status = status;
    existing.courier = row.courier ?? existing.courier;
    existing.agentId = row.agent_id ?? existing.agentId;
    existing.slaDeadline = row.sla_deadline ? new Date(row.sla_deadline).getTime() : null;
    existing.pod = row.pod_signature
      ? { signedAt: existing.pod?.signedAt ?? Date.now(), signature: row.pod_signature }
      : existing.pod;
    return false;
  }
  d.orders.unshift({
    id: row.order_ref,
    customer: row.customer,
    city: row.city,
    lines: [{ sku: row.sku, name: row.item_name, qty: row.qty, price: Number(row.total) / (row.qty || 1) }],
    total: Number(row.total),
    priority,
    status,
    courier: row.courier ?? "Mahindra Logistics Hub",
    agentId: row.agent_id ?? d.agents[0]?.id ?? "AGT-1",
    createdAt: row.created_at ? new Date(row.created_at).getTime() : Date.now(),
    slaDeadline: row.sla_deadline ? new Date(row.sla_deadline).getTime() : null,
    pod: row.pod_signature ? { signedAt: Date.now(), signature: row.pod_signature } : null,
  });
  d.orders = d.orders.slice(0, 120);
  return true;
}

function mergePo(d: WmsState, row: PoRow) {
  const existing = d.pos.find((p) => p.id === row.po_ref);
  if (existing) {
    existing.status = row.status as PurchaseOrder["status"];
    return false;
  }
  d.pos.unshift({
    id: row.po_ref,
    vendorId: d.vendors.find((v) => v.name === row.vendor_name)?.id ?? "VEN-1",
    vendorName: row.vendor_name,
    gstin: row.gstin ?? "—",
    sku: row.sku,
    item: row.item_name,
    units: row.units,
    unitPrice: Number(row.unit_price),
    subtotal: Number(row.subtotal),
    gst: Number(row.gst),
    total: Number(row.total),
    createdAt: row.created_at ? new Date(row.created_at).getTime() : Date.now(),
    status: row.status as PurchaseOrder["status"],
  });
  d.pos = d.pos.slice(0, 80);
  return true;
}

/** Pull the persisted cloud ledger, then stream every future change in real time. */
export function useCloudRealtime(onRemoteOrder?: (row: OrderRow, isNew: boolean) => void) {
  useEffect(() => {
    let active = true;

    void (async () => {
      const [orders, pos] = await Promise.all([
        supabase.from("orders").select("*").order("created_at", { ascending: false }).limit(60),
        supabase.from("po_bills").select("*").order("created_at", { ascending: false }).limit(40),
      ]);
      if (!active) return;
      mutate((d) => {
        for (const row of [...((orders.data ?? []) as OrderRow[])].reverse()) mergeOrder(d, row);
        for (const row of [...((pos.data ?? []) as PoRow[])].reverse()) mergePo(d, row);
      });
    })();

    const channel = supabase
      .channel("wms-live-ledger")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, (payload) => {
        const row = payload.new as OrderRow;
        if (!row?.order_ref) return;
        const known = readState().orders.some((o) => o.id === row.order_ref);
        mutate((d) => {
          mergeOrder(d, row);
        });
        onRemoteOrder?.(row, !known);
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "po_bills" }, (payload) => {
        const row = payload.new as PoRow;
        if (!row?.po_ref) return;
        mutate((d) => {
          mergePo(d, row);
        });
      })
      .subscribe();

    return () => {
      active = false;
      void supabase.removeChannel(channel);
    };
  }, [onRemoteOrder]);
}
