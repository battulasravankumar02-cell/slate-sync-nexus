import { BadgeCheck, MapPin, Truck } from "lucide-react";
import { GlassCard, Pill, SectionTitle, timeAgo } from "./primitives";
import { QrLabel } from "./QrLabel";
import { inrCompact } from "@/lib/wms/actions";
import type { WmsState } from "@/lib/wms/types";

export function LogisticsTab({ state }: { state: WmsState }) {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {state.agents.map((a) => (
          <GlassCard key={a.id} className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="font-semibold">{a.name}</p>
              <Pill tone="cyan">{a.courier.split(" ")[0]}</Pill>
            </div>
            <p className="font-mono text-xs text-muted-foreground">{a.id}</p>
            <div className="flex items-center gap-2 text-xs">
              <Truck className="size-3.5 text-neon" />
              <span className="font-mono">{a.vehicle}</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <MapPin className="size-3.5" /> {a.hub}
            </div>
            <p className="font-mono text-[11px] text-muted-foreground">{a.phone}</p>
          </GlassCard>
        ))}
      </div>

      <GlassCard>
        <SectionTitle title="Active Dispatches & e-POD Ledger" subtitle="Scannable shipping labels generated per consignment" />
        <div className="space-y-3">
          {state.orders.map((o) => {
            const agent = state.agents.find((a) => a.id === o.agentId);
            return (
              <div key={o.id} className="glass-2 flex flex-wrap items-center gap-5 rounded-xl p-4 animate-rise">
                <QrLabel value={`${o.id}|${o.agentId}`} />
                <div className="min-w-44">
                  <p className="font-mono text-sm font-semibold">{o.id}</p>
                  <p className="text-xs text-muted-foreground">
                    {o.customer} · {o.city}
                  </p>
                  <p className="mt-1 text-xs">{o.lines[0]?.name}</p>
                </div>
                <div className="min-w-52 text-xs">
                  <p className="text-muted-foreground">Assigned agent</p>
                  <p className="font-semibold">{agent?.name ?? "Unassigned"}</p>
                  <p className="font-mono text-[11px] text-muted-foreground">
                    {o.agentId} · {agent?.vehicle}
                  </p>
                </div>
                <div className="min-w-40 text-xs">
                  <p className="text-muted-foreground">Courier</p>
                  <p className="font-semibold">{o.courier}</p>
                </div>
                <div className="flex flex-col items-start gap-1">
                  <Pill tone={o.status === "delivered" ? "emerald" : o.status === "returned" ? "rose" : "violet"}>{o.status}</Pill>
                  {o.pod ? (
                    <span className="inline-flex items-center gap-1 text-[11px] text-neon">
                      <BadgeCheck className="size-3.5" /> e-POD · {o.pod.signature}
                    </span>
                  ) : (
                    <span className="text-[11px] text-muted-foreground">Awaiting e-POD</span>
                  )}
                </div>
                <div className="ml-auto text-right">
                  <p className="font-mono text-sm">{inrCompact(o.total)}</p>
                  <p className="text-[11px] text-muted-foreground">{timeAgo(o.createdAt)}</p>
                </div>
              </div>
            );
          })}
        </div>
      </GlassCard>
    </div>
  );
}
