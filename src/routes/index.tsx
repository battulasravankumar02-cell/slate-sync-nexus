import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Activity,
  BarChart3,
  Building2,
  Leaf,
  Link2,
  ScrollText,
  Smartphone,
  Sparkles,
  Truck,
  Warehouse,
  Zap,
} from "lucide-react";
import { useWmsState, subscribeEvents } from "@/lib/wms/store";
import { useCloudRealtime } from "@/lib/wms/cloud";
import { unpairDevice } from "@/lib/wms/actions";
import { OperationsTab } from "@/components/wms/OperationsTab";
import { LogisticsTab } from "@/components/wms/LogisticsTab";
import { WarehouseMatrix } from "@/components/wms/WarehouseMatrix";
import { SupplierTab } from "@/components/wms/SupplierTab";
import { AnalyticsTab } from "@/components/wms/AnalyticsTab";
import { AuditTab } from "@/components/wms/AuditTab";
import { Copilot } from "@/components/wms/Copilot";
import { ConnectDeviceModal } from "@/components/wms/ConnectDeviceModal";
import { Pill } from "@/components/wms/primitives";

const TITLE = "Helix WMS v5.0 — Enterprise AI Warehouse Command Center";
const DESCRIPTION =
  "Autonomous Indian enterprise warehouse management: live SLA tracking, 3D warehouse matrix, AI procurement, courier orchestration and immutable audit trails.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
    ],
  }),
  component: CommandCenter,
});

const TABS = [
  { key: "ops", label: "Operations Command", icon: Zap },
  { key: "logistics", label: "Delivery & Logistics", icon: Truck },
  { key: "matrix", label: "3D Warehouse Matrix", icon: Warehouse },
  { key: "supplier", label: "Supplier & Replenishment", icon: Building2 },
  { key: "analytics", label: "Analytics & Performance", icon: BarChart3 },
  { key: "audit", label: "Audit & Exceptions", icon: ScrollText },
] as const;

type TabKey = (typeof TABS)[number]["key"];

function CommandCenter() {
  const state = useWmsState();
  const [tab, setTab] = useState<TabKey>("ops");
  const [connectOpen, setConnectOpen] = useState(false);
  const [copilotOpen, setCopilotOpen] = useState(false);

  useEffect(() => {
    return subscribeEvents((e) => {
      if (e.target === "mobile") return;
      const fn = e.tone === "rose" ? toast.error : e.tone === "amber" ? toast.warning : toast.success;
      fn(e.title, { description: e.detail, duration: 5200 });
    });
  }, []);

  const connected = state.session.connected && state.session.code;

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 glass border-b border-border">
        <div className="flex flex-wrap items-center gap-3 px-5 py-3">
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-xl bg-neon/15 text-neon neon-ring">
              <Warehouse className="size-5" />
            </span>
            <div>
              <p className="font-display text-sm font-semibold tracking-tight">
                HELIX <span className="text-gradient-neon">WMS v5.0</span>
              </p>
              <p className="text-[11px] text-muted-foreground">Enterprise AI Logistics · Bharat Operations Grid</p>
            </div>
          </div>

          <div className="ml-auto flex flex-wrap items-center gap-2">
            <Pill tone="emerald">
              <Leaf className="size-3" /> CO₂ Saved Today: {state.co2Saved} kg
            </Pill>
            {connected ? (
              <button
                onClick={unpairDevice}
                title="Unpair device"
                className="inline-flex items-center gap-2 rounded-full border border-neon/50 bg-neon/15 px-3 py-1.5 text-[11px] font-semibold text-neon neon-ring"
              >
                <span className="size-2 rounded-full bg-neon animate-pulse-node" />
                Synced: {state.session.code}
              </button>
            ) : (
              <button
                onClick={() => setConnectOpen(true)}
                className="inline-flex items-center gap-2 rounded-full border border-border bg-secondary/50 px-3 py-1.5 text-[11px] font-semibold text-muted-foreground hover:text-foreground"
              >
                <Link2 className="size-3.5" /> Connect Remote Device
              </button>
            )}
            <Link
              to="/mobile"
              className="inline-flex items-center gap-2 rounded-full border border-border px-3 py-1.5 text-[11px] font-semibold text-muted-foreground hover:text-foreground"
            >
              <Smartphone className="size-3.5" /> Mobile Terminal
            </Link>
            <button
              onClick={() => setCopilotOpen(true)}
              className="inline-flex items-center gap-2 rounded-full bg-neon-violet/20 px-3 py-1.5 text-[11px] font-semibold text-neon-violet"
            >
              <Sparkles className="size-3.5" /> AI Copilot
            </button>
          </div>
        </div>
      </header>

      <div className="flex">
        <nav className="sticky top-[68px] hidden h-[calc(100vh-68px)] w-64 shrink-0 flex-col gap-1 border-r border-border p-4 lg:flex">
          {TABS.map((t) => {
            const Icon = t.icon;
            const active = tab === t.key;
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition-colors ${
                  active
                    ? "bg-neon/15 font-semibold text-neon neon-ring"
                    : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
                }`}
              >
                <Icon className="size-4 shrink-0" />
                {t.label}
              </button>
            );
          })}
          <div className="mt-auto glass-2 rounded-xl p-3 text-[11px] text-muted-foreground">
            <p className="inline-flex items-center gap-1.5 font-semibold text-neon">
              <Activity className="size-3.5" /> Event bus healthy
            </p>
            <p className="mt-1">{state.logs.length} audit records sealed</p>
            <p>{state.orders.length} orders in graph</p>
          </div>
        </nav>

        <div className="min-w-0 flex-1">
          <div className="flex gap-2 overflow-x-auto border-b border-border px-4 py-2 lg:hidden">
            {TABS.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`shrink-0 rounded-full px-3 py-1.5 text-[11px] font-semibold ${
                  tab === t.key ? "bg-neon/15 text-neon" : "text-muted-foreground"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <main className="space-y-6 p-5">
            <div>
              <h1 className="font-display text-2xl font-semibold tracking-tight">
                {TABS.find((t) => t.key === tab)?.label}
              </h1>
              <p className="text-xs text-muted-foreground">
                Autonomous decision engine active · every mobile trigger is executed without human touch
              </p>
            </div>

            {tab === "ops" ? <OperationsTab state={state} /> : null}
            {tab === "logistics" ? <LogisticsTab state={state} /> : null}
            {tab === "matrix" ? <WarehouseMatrix state={state} /> : null}
            {tab === "supplier" ? <SupplierTab state={state} /> : null}
            {tab === "analytics" ? <AnalyticsTab state={state} /> : null}
            {tab === "audit" ? <AuditTab state={state} /> : null}
          </main>
        </div>
      </div>

      <ConnectDeviceModal open={connectOpen} onOpenChange={setConnectOpen} />
      <Copilot state={state} open={copilotOpen} onOpenChange={setCopilotOpen} />
    </div>
  );
}
