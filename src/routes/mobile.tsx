import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  ArrowLeftRight,
  CheckCircle2,
  HardHat,
  Monitor,
  PackageCheck,
  PackagePlus,
  ShoppingCart,
  TriangleAlert,
  User,
  XCircle,
  Zap,
} from "lucide-react";
import { subscribeEvents, useWmsState } from "@/lib/wms/store";
import {
  confirmDelivery,
  ensureSessionCode,
  flagDamaged,
  inboundStock,
  inr,
  placeOrder,
  requestReturn,
  triggerStockOut,
} from "@/lib/wms/actions";
import { GlassCard, Pill } from "@/components/wms/primitives";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const TITLE = "Helix Mobile Operations Terminal — Helix WMS v5.0";
const DESCRIPTION =
  "Paired mobile terminal for Helix WMS: customer e-commerce ordering and warehouse executive stock operations streamed live to the command center.";

export const Route = createFileRoute("/mobile")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
    ],
  }),
  component: MobileTerminal,
});

const RETURN_REASONS = ["Damaged in transit", "Wrong item delivered", "Battery drains fast", "Changed my mind"];

function ActionButton({
  label,
  hint,
  icon,
  tone,
  onClick,
}: {
  label: string;
  hint: string;
  icon: React.ReactNode;
  tone: "emerald" | "cyan" | "amber" | "rose" | "violet";
  onClick: () => void;
}) {
  const map = {
    emerald: "border-neon/45 bg-neon/12 text-neon",
    cyan: "border-neon-cyan/45 bg-neon-cyan/12 text-neon-cyan",
    amber: "border-neon-amber/45 bg-neon-amber/12 text-neon-amber",
    rose: "border-neon-rose/45 bg-neon-rose/12 text-neon-rose",
    violet: "border-neon-violet/45 bg-neon-violet/12 text-neon-violet",
  } as const;
  return (
    <button
      onClick={onClick}
      className={`w-full rounded-2xl border px-4 py-3.5 text-left transition-transform active:scale-[0.98] ${map[tone]}`}
    >
      <span className="flex items-center gap-3">
        {icon}
        <span>
          <span className="block text-sm font-semibold">{label}</span>
          <span className="block text-[11px] text-muted-foreground">{hint}</span>
        </span>
      </span>
    </button>
  );
}

function MobileTerminal() {
  const state = useWmsState();
  const [mode, setMode] = useState<"customer" | "executive">("customer");
  const [selected, setSelected] = useState<string>("sku-5g");
  const [podOpen, setPodOpen] = useState(false);
  const [podOrder, setPodOrder] = useState<string | null>(null);
  const [signature, setSignature] = useState("");
  const [inboundSku, setInboundSku] = useState("HX-LAP-GMX-002");
  const [inboundUnits, setInboundUnits] = useState(60);

  useEffect(() => {
    ensureSessionCode();
  }, []);

  useEffect(() => {
    return subscribeEvents((e) => {
      if (e.target === "desktop") return;
      toast.success(e.title, { description: e.detail });
    });
  }, []);

  const sku = state.skus.find((s) => s.id === selected) ?? state.skus[0]!;
  const latestOrder = state.orders.find((o) => o.status !== "delivered" && o.status !== "returned") ?? state.orders[0];

  const openPod = () => {
    if (!latestOrder) {
      toast.error("No live consignment to confirm");
      return;
    }
    setPodOrder(latestOrder.id);
    setSignature("");
    setPodOpen(true);
  };

  return (
    <div className="mx-auto min-h-screen w-full max-w-md pb-16">
      <header className="sticky top-0 z-20 glass border-b border-border px-4 py-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-display text-sm font-semibold">
              HELIX <span className="text-gradient-neon">MOBILE OPS</span>
            </p>
            <p className="text-[11px] text-muted-foreground">Pairing session</p>
          </div>
          <div className="text-right">
            <p className="font-mono text-base font-semibold tracking-[0.18em] text-neon">{state.session.code ?? "…"}</p>
            <Pill tone={state.session.connected ? "emerald" : "muted"}>
              {state.session.connected ? "Linked to desktop" : "Awaiting pairing"}
            </Pill>
          </div>
        </div>

        <div className="mt-3 flex glass-2 rounded-full p-1">
          <button
            onClick={() => setMode("customer")}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-full py-2 text-[11px] font-semibold ${
              mode === "customer" ? "bg-neon/20 text-neon" : "text-muted-foreground"
            }`}
          >
            <User className="size-3.5" /> Customer E-Commerce
          </button>
          <button
            onClick={() => setMode("executive")}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-full py-2 text-[11px] font-semibold ${
              mode === "executive" ? "bg-neon-amber/20 text-neon-amber" : "text-muted-foreground"
            }`}
          >
            <HardHat className="size-3.5" /> Warehouse Executive
          </button>
        </div>
      </header>

      <main className="space-y-4 p-4">
        <GlassCard className="space-y-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            {mode === "customer" ? "Product catalog" : "Select SKU"}
          </p>
          <div className="space-y-2">
            {state.skus.map((s) => (
              <button
                key={s.id}
                onClick={() => setSelected(s.id)}
                className={`w-full rounded-xl border px-3 py-2.5 text-left transition-colors ${
                  selected === s.id ? "border-neon/50 bg-neon/10" : "border-border bg-secondary/30"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-semibold">{s.name}</span>
                  <span className="font-mono text-xs text-neon">{inr(s.price)}</span>
                </div>
                <div className="mt-1 flex items-center justify-between text-[11px] text-muted-foreground">
                  <span className="font-mono">{s.sku}</span>
                  <span>
                    {s.stock} units · {s.bin} ·{" "}
                    <span className={s.status === "out" ? "text-neon-rose" : s.status === "ok" ? "text-neon" : "text-neon-amber"}>
                      {s.status}
                    </span>
                  </span>
                </div>
              </button>
            ))}
          </div>
        </GlassCard>

        {mode === "customer" ? (
          <div className="space-y-3">
            <ActionButton
              label="🛒 Place Standard Order"
              hint="Auto-pack, queue and notify the command center"
              tone="emerald"
              icon={<ShoppingCart className="size-5" />}
              onClick={() => {
                const id = placeOrder(sku.id, "standard");
                toast.success(`Order ${id} placed`, { description: sku.name });
              }}
            />
            <ActionButton
              label="⚡ Place Prime Urgent Order"
              hint="Override standard flow · Delhivery Enterprise · SLA < 2h"
              tone="cyan"
              icon={<Zap className="size-5" />}
              onClick={() => {
                const id = placeOrder(sku.id, "prime");
                toast.success(`Prime order ${id} escalated`, { description: "SLA timer armed" });
              }}
            />
            <GlassCard className="space-y-2">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">↩️ Request item return</p>
              <p className="text-xs text-muted-foreground">
                Latest eligible order: <span className="font-mono">{latestOrder?.id ?? "none"}</span>
              </p>
              <div className="grid grid-cols-2 gap-2">
                {RETURN_REASONS.map((r) => (
                  <button
                    key={r}
                    onClick={() => {
                      if (!latestOrder) {
                        toast.error("No order available to return");
                        return;
                      }
                      requestReturn(latestOrder.id, r);
                      toast.warning("Return logged", { description: r });
                    }}
                    className="rounded-xl border border-neon-amber/40 bg-neon-amber/10 px-2 py-2 text-[11px] font-semibold text-neon-amber"
                  >
                    {r}
                  </button>
                ))}
              </div>
            </GlassCard>
            <ActionButton
              label="📦 Confirm Delivery Received"
              hint="Capture digital e-POD signature"
              tone="violet"
              icon={<CheckCircle2 className="size-5" />}
              onClick={openPod}
            />
          </div>
        ) : (
          <div className="space-y-3">
            <ActionButton
              label="❌ Trigger Stock Out"
              hint="AI auto-selects vendor and issues a GST purchase order"
              tone="rose"
              icon={<XCircle className="size-5" />}
              onClick={() => {
                const po = triggerStockOut(sku.id);
                toast.error(`Stock out on ${sku.sku}`, { description: `${po} auto-issued` });
              }}
            />
            <GlassCard className="space-y-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">📦 Receive & inbound stock</p>
              <input
                value={inboundSku}
                onChange={(e) => setInboundSku(e.target.value.toUpperCase())}
                placeholder="Scan or enter SKU"
                className="w-full rounded-xl border border-input bg-secondary/40 px-3 py-2 font-mono text-xs outline-none focus:ring-2 focus:ring-ring"
              />
              <input
                type="number"
                value={inboundUnits}
                min={1}
                onChange={(e) => setInboundUnits(Number(e.target.value))}
                className="w-full rounded-xl border border-input bg-secondary/40 px-3 py-2 font-mono text-xs outline-none focus:ring-2 focus:ring-ring"
              />
              <button
                onClick={() => {
                  const target = state.skus.find((s) => s.sku.toUpperCase() === inboundSku.trim().toUpperCase());
                  if (!target) {
                    toast.error("Unknown SKU", { description: inboundSku });
                    return;
                  }
                  inboundStock(target.id, inboundUnits);
                  toast.success("GRN posted", { description: `${inboundUnits} units → ${target.bin}` });
                }}
                className="w-full rounded-xl border border-neon/45 bg-neon/12 py-2.5 text-sm font-semibold text-neon"
              >
                <span className="inline-flex items-center gap-2">
                  <PackagePlus className="size-4" /> Post inbound GRN
                </span>
              </button>
            </GlassCard>
            <ActionButton
              label="🚨 Flag Damaged Stock"
              hint="Isolate to Quarantine Zone Q-1 and reroute pick paths"
              tone="amber"
              icon={<TriangleAlert className="size-5" />}
              onClick={() => {
                flagDamaged(sku.id);
                toast.warning("Quarantined", { description: sku.sku });
              }}
            />
            <GlassCard className="space-y-2">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Latest AI decision</p>
              <p className="text-xs leading-relaxed">
                {state.logs.find((l) => l.actor === "autonomous-ai")?.message ?? "Awaiting triggers."}
              </p>
            </GlassCard>
          </div>
        )}

        <Link
          to="/"
          className="flex items-center justify-center gap-2 rounded-2xl border border-border py-3 text-xs font-semibold text-muted-foreground"
        >
          <Monitor className="size-4" /> Open Laptop Command Center
          <ArrowLeftRight className="size-3.5" />
        </Link>
      </main>

      <Dialog open={podOpen} onOpenChange={setPodOpen}>
        <DialogContent className="glass sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-display flex items-center gap-2">
              <PackageCheck className="size-4 text-neon" /> Digital e-POD
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground">
              Consignment <span className="font-mono">{podOrder}</span> — sign below to confirm receipt.
            </p>
            <input
              value={signature}
              onChange={(e) => setSignature(e.target.value)}
              placeholder="Type your signature"
              className="w-full rounded-xl border border-input bg-secondary/40 px-3 py-6 text-center font-display text-lg italic outline-none focus:ring-2 focus:ring-ring"
            />
            <button
              onClick={() => {
                if (!podOrder || !signature.trim()) {
                  toast.error("Signature required");
                  return;
                }
                confirmDelivery(podOrder, signature.trim());
                setPodOpen(false);
                toast.success("Delivery confirmed", { description: `${podOrder} marked DELIVERED` });
              }}
              className="w-full rounded-xl bg-neon/20 py-2.5 text-sm font-semibold text-neon neon-ring"
            >
              Sign & mark delivered
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
