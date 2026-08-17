import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { GlassCard, SectionTitle } from "./primitives";
import { inrCompact } from "@/lib/wms/actions";
import type { WmsState } from "@/lib/wms/types";

const axis = { stroke: "var(--muted-foreground)", fontSize: 11 };

const tooltipStyle = {
  background: "var(--popover)",
  border: "1px solid var(--border)",
  borderRadius: 12,
  fontSize: 12,
  color: "var(--foreground)",
} as const;

export function AnalyticsTab({ state }: { state: WmsState }) {
  const data = state.series;
  const skuData = state.skus.map((s) => ({ name: s.sku.slice(-7), stock: s.stock, price: s.price }));

  return (
    <div className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-2">
        <GlassCard>
          <SectionTitle title="Order Volume vs Revenue Growth (₹)" subtitle="Rolling 7-day enterprise performance" />
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={data}>
              <defs>
                <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.6} />
                  <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="var(--border)" vertical={false} />
              <XAxis dataKey="label" {...axis} />
              <YAxis yAxisId="l" {...axis} tickFormatter={(v: number) => inrCompact(v)} />
              <YAxis yAxisId="r" orientation="right" {...axis} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v: number, n) => (n === "revenue" ? inrCompact(v) : v)} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Area yAxisId="l" type="monotone" dataKey="revenue" stroke="var(--chart-1)" fill="url(#rev)" strokeWidth={2} />
              <Line yAxisId="r" type="monotone" dataKey="orders" stroke="var(--chart-2)" strokeWidth={2} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </GlassCard>

        <GlassCard>
          <SectionTitle title="Stock Depletion vs Return Spikes" subtitle="Units depleted against reverse-logistics volume" />
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={data}>
              <CartesianGrid stroke="var(--border)" vertical={false} />
              <XAxis dataKey="label" {...axis} />
              <YAxis {...axis} />
              <Tooltip contentStyle={tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Line type="monotone" dataKey="depletion" stroke="var(--chart-3)" strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="returns" stroke="var(--chart-5)" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </GlassCard>
      </div>

      <GlassCard>
        <SectionTitle title="On-Hand Inventory by SKU" subtitle="Live stock positions across the matrix" />
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={skuData}>
            <CartesianGrid stroke="var(--border)" vertical={false} />
            <XAxis dataKey="name" {...axis} />
            <YAxis {...axis} />
            <Tooltip contentStyle={tooltipStyle} />
            <Bar dataKey="stock" fill="var(--chart-2)" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </GlassCard>
    </div>
  );
}
