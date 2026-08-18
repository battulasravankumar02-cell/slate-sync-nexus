import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function GlassCard({
  children,
  className,
  glow,
}: {
  children: ReactNode;
  className?: string;
  glow?: boolean;
}) {
  return (
    <div className={cn("glass rounded-2xl p-5", glow && "neon-ring", className)}>{children}</div>
  );
}

export function SectionTitle({
  title,
  subtitle,
  right,
}: {
  title: string;
  subtitle?: string;
  right?: ReactNode;
}) {
  return (
    <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
        {subtitle ? <p className="text-xs text-muted-foreground">{subtitle}</p> : null}
      </div>
      {right}
    </div>
  );
}

const toneMap = {
  emerald: "text-neon border-neon/35 bg-neon/10",
  amber: "text-neon-amber border-neon-amber/35 bg-neon-amber/10",
  cyan: "text-neon-cyan border-neon-cyan/35 bg-neon-cyan/10",
  rose: "text-neon-rose border-neon-rose/35 bg-neon-rose/10",
  violet: "text-neon-violet border-neon-violet/35 bg-neon-violet/10",
  muted: "text-muted-foreground border-border bg-secondary/40",
} as const;

export type Tone = keyof typeof toneMap;

export function Pill({
  children,
  tone = "muted",
  className,
}: {
  children: ReactNode;
  tone?: Tone;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold tracking-wide uppercase",
        toneMap[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function Metric({
  label,
  value,
  delta,
  tone = "emerald",
  icon,
}: {
  label: string;
  value: string;
  delta?: string;
  tone?: Tone;
  icon?: ReactNode;
}) {
  return (
    <GlassCard className="relative overflow-hidden">
      <div className="flex items-start justify-between">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          {label}
        </p>
        <span className={cn("rounded-lg border p-1.5", toneMap[tone])}>{icon}</span>
      </div>
      <p className="mt-3 font-display text-2xl font-semibold">{value}</p>
      {delta ? <p className="mt-1 text-xs text-muted-foreground">{delta}</p> : null}
      <div className="pointer-events-none absolute -bottom-14 -right-10 h-28 w-28 rounded-full bg-neon/10 blur-2xl" />
    </GlassCard>
  );
}

export function Row({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "glass-2 flex flex-wrap items-center justify-between gap-3 rounded-xl px-4 py-3",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function timeAgo(at: number) {
  const diff = Math.max(0, Date.now() - at);
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export function clockTime(at: number) {
  return new Date(at).toLocaleTimeString("en-IN", { hour12: false, timeZone: "Asia/Kolkata" });
}
