import { useEffect, useState } from "react";
import { Activity, AlertTriangle, BrainCircuit, PackageCheck, Timer, TrendingUp } from "lucide-react";
import { GlassCard, Metric, Pill, Row, SectionTitle, clockTime, timeAgo } from "./primitives";
import { inrCompact } from "@/lib/wms/actions";
import type { WmsState } from "@/lib/wms/types";

function SlaTimer({ deadline }: { deadline: number }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const left = deadline - now;
  const breached = left <= 0;
  const abs = Math.abs(left);
  const hh = String(Math.floor(abs / 3600000)).padStart(2, "0");
  const mm = String(Math.floor((abs % 3600000) / 60000)).padStart(2, "0");
  const ss = String(Math.floor((abs % 60000) / 1000)).padStart(2, "0");
  return (
    <span
      className={`font-mono text-sm font-semibold ${breached ? "text-neon-rose" : left < 1800000 ? "text-neon-amber" : "text-neon-cyan"}`}
    >
      {breached ? "-" : ""}
      {hh}:{mm}:{ss}
    </span>
  );
}

export function OperationsTab({ state }: { state: WmsState }) {
  const active = state.orders.filter((o) => o.status !== "delivered" && o.status !== "returned");
  const prime = active.filter((o) => o.priority === "prime");
  const revenueToday = state.series[state.series.length - 1]?.revenue ?? 0;
  const outSkus = state.skus.filter((s) => s.status === "out");

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="Active Orders" value={String(active.length)} delta={`${prime.length} prime express lanes`} icon={<PackageCheck className="size-4" />} />
        <Metric label="Revenue Today" value={inrCompact(revenueToday)} delta="GMV across all channels" tone="cyan" icon={<TrendingUp className="size-4" />} />
        <Metric label="Open Exceptions" value={String(state.alerts.length)} delta={`${outSkus.length} stock-out SKUs`} tone="amber" icon={<AlertTriangle className="size-4" />} />
        <Metric label="AI Decisions" value={String(state.logs.filter((l) => l.actor === "autonomous-ai").length)} delta="Autonomous engine actions" tone="violet" icon={<BrainCircuit className="size-4" />} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <GlassCard>
          <SectionTitle
            title="Live Operations Status Board"
            subtitle="Streaming from paired terminals over the event bus"
            right={<Pill tone="emerald"><Activity className="size-3" /> Live</Pill>}
          />
          <div className="space-y-2">
            {active.length === 0 ? (
              <p className="text-sm text-muted-foreground">No active orders. Trigger one from the mobile terminal.</p>
            ) : null}
            {active.map((o) => (
              <Row key={o.id} className="animate-rise">
                <div className="min-w-40">
                  <p className="font-mono text-sm font-semibold">{o.id}</p>
                  <p className="text-xs text-muted-foreground">
                    {o.customer} · {o.city}
                  </p>
                </div>
                <div className="min-w-44 text-xs text-muted-foreground">
                  {o.lines[0]?.name} × {o.lines[0]?.qty}
                </div>
                <Pill tone={o.priority === "prime" ? "cyan" : "muted"}>{o.priority}</Pill>
                <Pill tone={o.status === "dispatched" ? "violet" : "emerald"}>{o.status}</Pill>
                <div className="flex items-center gap-2">
                  <Timer className="size-3.5 text-muted-foreground" />
                  {o.slaDeadline ? <SlaTimer deadline={o.slaDeadline} /> : <span className="text-xs text-muted-foreground">Standard SLA</span>}
                </div>
                <p className="font-mono text-sm">{inrCompact(o.total)}</p>
              </Row>
            ))}
          </div>
        </GlassCard>

        <div className="space-y-6">
          <GlassCard>
            <SectionTitle title="Active System Alerts" subtitle="Exception queue" />
            <div className="space-y-2">
              {state.alerts.slice(0, 6).map((a) => (
                <Row key={a.id} className="animate-rise">
                  <div>
                    <p className="text-sm font-semibold">{a.title}</p>
                    <p className="text-xs text-muted-foreground">{a.detail}</p>
                  </div>
                  <Pill tone={a.tone === "rose" ? "rose" : a.tone === "amber" ? "amber" : a.tone === "cyan" ? "cyan" : "emerald"}>
                    {timeAgo(a.at)}
                  </Pill>
                </Row>
              ))}
            </div>
          </GlassCard>

          <GlassCard glow>
            <SectionTitle title="Autonomous Decision Log" subtitle="Zero-touch engine output" right={<Pill tone="violet"><BrainCircuit className="size-3" /> AI</Pill>} />
            <div className="max-h-72 space-y-3 overflow-y-auto pr-1">
              {state.logs
                .filter((l) => l.actor === "autonomous-ai")
                .slice(0, 12)
                .map((l) => (
                  <div key={l.id} className="border-l-2 border-neon-violet/50 pl-3">
                    <p className="font-mono text-[11px] text-muted-foreground">{clockTime(l.at)}</p>
                    <p className="text-xs leading-relaxed">{l.message}</p>
                  </div>
                ))}
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}
