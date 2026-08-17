import { useState } from "react";
import { ShieldCheck } from "lucide-react";
import { GlassCard, Pill, SectionTitle, clockTime } from "./primitives";
import type { LogEntry, WmsState } from "@/lib/wms/types";

const FILTERS: { key: "all" | LogEntry["actor"]; label: string }[] = [
  { key: "all", label: "All streams" },
  { key: "mobile", label: "Mobile triggers" },
  { key: "desktop", label: "Desktop actions" },
  { key: "autonomous-ai", label: "AI decisions" },
];

const toneFor = (s: LogEntry["severity"]) =>
  s === "critical" ? "rose" : s === "warn" ? "amber" : s === "ai" ? "violet" : "emerald";

export function AuditTab({ state }: { state: WmsState }) {
  const [filter, setFilter] = useState<"all" | LogEntry["actor"]>("all");
  const logs = state.logs.filter((l) => filter === "all" || l.actor === filter);

  return (
    <GlassCard>
      <SectionTitle
        title="Immutable Audit & Exception Stream"
        subtitle={`${state.logs.length} sealed records · hash-chained ledger`}
        right={
          <div className="flex flex-wrap gap-2">
            {FILTERS.map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`rounded-full border px-3 py-1 text-[11px] font-semibold transition-colors ${
                  filter === f.key
                    ? "border-neon/50 bg-neon/15 text-neon"
                    : "border-border text-muted-foreground hover:bg-secondary/50"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        }
      />
      <div className="max-h-[560px] space-y-2 overflow-y-auto pr-1">
        {logs.map((l, i) => (
          <div key={l.id} className="glass-2 flex items-start gap-3 rounded-xl px-4 py-3 animate-rise">
            <ShieldCheck className="mt-0.5 size-4 shrink-0 text-neon/70" />
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-[11px] text-muted-foreground">{clockTime(l.at)}</span>
                <Pill tone={toneFor(l.severity)}>{l.actor}</Pill>
                <span className="font-mono text-[10px] text-muted-foreground">
                  #{String(logs.length - i).padStart(5, "0")}
                </span>
              </div>
              <p className="mt-1 text-sm leading-relaxed">{l.message}</p>
            </div>
          </div>
        ))}
      </div>
    </GlassCard>
  );
}
