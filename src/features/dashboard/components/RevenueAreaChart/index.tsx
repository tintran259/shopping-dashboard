import { useId } from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type TooltipProps,
} from 'recharts';
import { formatCurrency } from '@/lib/format';

export interface AreaPoint {
  /** Short axis label, e.g. "02/07". */
  label: string;
  /** Full label for tooltip, e.g. "02/07/2026". */
  fullLabel: string;
  value: number;
}

interface RevenueAreaChartProps {
  data: AreaPoint[];
  height?: number;
}

/**
 * Single-series revenue area chart (Recharts). Change-over-time → area form.
 * Recessive gridlines, 2px line, gradient wash, crosshair + tooltip on hover.
 * One series → no legend (the panel title names it).
 */
export function RevenueAreaChart({ data, height = 220 }: RevenueAreaChartProps) {
  const gradientId = useId();

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--chart-revenue)" stopOpacity={0.28} />
            <stop offset="100%" stopColor="var(--chart-revenue)" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} stroke="var(--chart-grid)" strokeWidth={1} />
        <XAxis
          dataKey="label"
          tickLine={false}
          axisLine={false}
          minTickGap={24}
          tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }}
        />
        <YAxis
          width={44}
          tickLine={false}
          axisLine={false}
          tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }}
          tickFormatter={compact}
        />
        <Tooltip
          cursor={{ stroke: 'var(--chart-revenue)', strokeDasharray: '3 3', strokeOpacity: 0.6 }}
          content={<RevenueTooltip />}
        />
        <Area
          type="monotone"
          dataKey="value"
          stroke="var(--chart-revenue)"
          strokeWidth={2}
          fill={`url(#${gradientId})`}
          activeDot={{ r: 4.5, stroke: 'var(--card)', strokeWidth: 2 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

function RevenueTooltip({ active, payload }: TooltipProps<number, string>) {
  if (!active || !payload?.length) return null;
  const point = payload[0]?.payload as AreaPoint | undefined;
  if (!point) return null;
  return (
    <div className="rounded-md border bg-popover px-2.5 py-1.5 text-xs shadow-md">
      <p className="font-medium text-popover-foreground">{point.fullLabel}</p>
      <p className="tabular-nums text-muted-foreground">
        {formatCurrency(point.value)}
      </p>
    </div>
  );
}

/** Compact VND for axis ticks: 1.2tr, 950k, … */
function compact(v: number): string {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}tr`;
  if (v >= 1_000) return `${Math.round(v / 1_000)}k`;
  return String(Math.round(v));
}
