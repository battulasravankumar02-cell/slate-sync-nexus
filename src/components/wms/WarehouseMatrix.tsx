import { useMemo, useState } from "react";
import { Boxes, Sparkles } from "lucide-react";
import { GlassCard, Pill, SectionTitle } from "./primitives";
import type { WmsState } from "@/lib/wms/types";

const AISLES = ["A", "B", "C", "D"];
const BAYS = 6;
const CELL = 74;
const GAP = 16;

export function WarehouseMatrix({ state }: { state: WmsState }) {
  const [view, setView] = useState<"iso" | "grid">("iso");
  const [yaw, setYaw] = useState(-42);
  const [pitch, setPitch] = useState(56);

  const binMap = useMemo(() => {
    const m = new Map<string, (typeof state.skus)[number]>();
    for (const s of state.skus) m.set(s.bin, s);
    return m;
  }, [state.skus]);

  const width = BAYS * (CELL + GAP);
  const height = AISLES.length * (CELL + GAP);

  const center = (bin: string) => {
    const sku = binMap.get(bin);
    if (!sku) return null;
    return { x: sku.bay * (CELL + GAP) + CELL / 2, y: sku.aisle * (CELL + GAP) + CELL / 2 };
  };

  const pathPoints = state.pickPath
    .map(center)
    .filter((p): p is { x: number; y: number } => Boolean(p));

  const transform =
    view === "iso"
      ? `rotateX(${pitch}deg) rotateZ(${yaw}deg) scale(0.92)`
      : "rotateX(0deg) rotateZ(0deg) scale(1)";

  return (
    <div className="space-y-6">
      <GlassCard>
        <SectionTitle
          title="3D Warehouse Matrix Visualizer"
          subtitle="Multi-tier racking · AI slotting optimizer · live pick-path telemetry"
          right={
            <div className="flex flex-wrap items-center gap-3">
              <div className="glass-2 flex rounded-full p-1">
                {(["grid", "iso"] as const).map((v) => (
                  <button
                    key={v}
                    onClick={() => setView(v)}
                    className={`rounded-full px-3 py-1 text-[11px] font-semibold transition-colors ${
                      view === v ? "bg-neon/20 text-neon" : "text-muted-foreground"
                    }`}
                  >
                    {v === "grid" ? "2D Grid" : "3D Isometric"}
                  </button>
                ))}
              </div>
              {view === "iso" ? (
                <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                  <label className="flex items-center gap-2">
                    Yaw
                    <input type="range" min={-90} max={0} value={yaw} onChange={(e) => setYaw(Number(e.target.value))} className="w-24 accent-[var(--neon)]" />
                  </label>
                  <label className="flex items-center gap-2">
                    Pitch
                    <input type="range" min={20} max={72} value={pitch} onChange={(e) => setPitch(Number(e.target.value))} className="w-24 accent-[var(--neon-cyan)]" />
                  </label>
                </div>
              ) : null}
            </div>
          }
        />

        <div className="flex flex-wrap gap-2 pb-4">
          <Pill tone="emerald">Optimal slot</Pill>
          <Pill tone="amber">Quarantine zone</Pill>
          <Pill tone="rose">Stock-out</Pill>
          <Pill tone="cyan">Active pick path</Pill>
          <Pill tone="violet"><Sparkles className="size-3" /> AI slotting</Pill>
        </div>

        <div
          className="grid-plane relative overflow-hidden rounded-2xl border border-border"
          style={{ height: 520, perspective: "1400px" }}
        >
          <div
            className="absolute left-1/2 top-1/2 transition-transform duration-500 ease-out"
            style={{
              width,
              height,
              transform: `translate(-50%, -50%) ${transform}`,
              transformStyle: "preserve-3d",
            }}
          >
            <svg width={width} height={height} className="pointer-events-none absolute inset-0" style={{ transform: "translateZ(2px)" }}>
              {pathPoints.length > 1 ? (
                <polyline
                  points={pathPoints.map((p) => `${p.x},${p.y}`).join(" ")}
                  fill="none"
                  stroke="var(--neon-cyan)"
                  strokeWidth={4}
                  strokeLinecap="round"
                  className="animate-dash"
                  style={{ filter: "drop-shadow(0 0 8px var(--neon-cyan))" }}
                />
              ) : null}
              {pathPoints.map((p, i) => (
                <circle key={i} cx={p.x} cy={p.y} r={7} fill="var(--neon-cyan)" opacity={0.75} className="animate-pulse-node" />
              ))}
            </svg>

            {AISLES.map((aisle, ai) =>
              Array.from({ length: BAYS }).map((_, bay) => {
                const bin = `${aisle}-0${bay + 1}`;
                const sku = state.skus.find((s) => s.aisle === ai && s.bay === bay);
                const status = sku?.status;
                const onPath = sku ? state.pickPath.includes(sku.bin) : false;
                const tone =
                  status === "out"
                    ? "border-neon-rose/70 bg-neon-rose/25"
                    : status === "quarantine"
                      ? "border-neon-amber/70 bg-neon-amber/25"
                      : status === "low"
                        ? "border-neon-amber/40 bg-neon-amber/10"
                        : sku
                          ? "border-neon/60 bg-neon/15"
                          : "border-border bg-secondary/25";
                return (
                  <div
                    key={bin}
                    className={`absolute rounded-lg border ${tone} ${onPath ? "neon-ring" : ""}`}
                    style={{
                      width: CELL,
                      height: CELL,
                      left: bay * (CELL + GAP),
                      top: ai * (CELL + GAP),
                      transform: `translateZ(${sku ? sku.tier * 16 : 4}px)`,
                      transformStyle: "preserve-3d",
                      boxShadow: sku ? "0 18px 30px -18px oklch(0 0 0 / 80%)" : undefined,
                    }}
                  >
                    <div className="flex h-full flex-col items-center justify-center gap-1 p-1 text-center">
                      <span className="font-mono text-[10px] text-muted-foreground">{sku ? sku.bin : bin}</span>
                      {sku ? (
                        <>
                          <span className="font-display text-sm font-semibold">{sku.stock}</span>
                          <span className="text-[9px] uppercase tracking-wide text-muted-foreground">T{sku.tier}</span>
                        </>
                      ) : (
                        <span className="text-[9px] text-muted-foreground">empty</span>
                      )}
                    </div>
                    {status === "out" ? (
                      <span className="absolute -right-1.5 -top-1.5 size-3 rounded-full bg-neon-rose animate-pulse-node" />
                    ) : null}
                  </div>
                );
              }),
            )}
          </div>

          <div className="glass-2 absolute bottom-4 left-4 rounded-xl px-3 py-2 text-[11px]">
            <p className="font-semibold">Quarantine Zone Q-1</p>
            <p className="text-muted-foreground">
              {state.skus.filter((s) => s.status === "quarantine").length} SKU isolated · routes rerouted
            </p>
          </div>
        </div>
      </GlassCard>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {state.skus.map((s) => (
          <GlassCard key={s.id} className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-semibold">{s.name}</p>
              <Pill tone={s.status === "out" ? "rose" : s.status === "ok" ? "emerald" : "amber"}>{s.status}</Pill>
            </div>
            <p className="font-mono text-xs text-muted-foreground">{s.sku}</p>
            <div className="flex items-center justify-between text-xs">
              <span className="inline-flex items-center gap-1.5">
                <Boxes className="size-3.5 text-neon" /> {s.stock} units
              </span>
              <span className="font-mono">{s.bin}</span>
            </div>
            <Pill tone="violet"><Sparkles className="size-3" /> Slot score {(92 - s.tier * 4).toFixed(0)}</Pill>
          </GlassCard>
        ))}
      </div>
    </div>
  );
}
