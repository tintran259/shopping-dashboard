import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type TooltipProps,
} from 'recharts';
import { formatNumber } from '@/lib/format';
import type { OrderStatus } from '@/types';
import { ORDER_STATUS_LABEL } from '@/features/orders';

export interface StatusBar {
  status: OrderStatus;
  value: number;
}

interface Row {
  status: OrderStatus;
  label: string;
  value: number;
}

/**
 * Orders-by-status as single-hue horizontal bars (Recharts, magnitude form).
 * Identity is carried by the category axis label, not bar color (no rainbow);
 * counts are direct-labeled at the end of each bar.
 */
export function OrdersBarChart({ data }: { data: StatusBar[] }) {
  const rows: Row[] = data.map((d) => ({
    status: d.status,
    label: ORDER_STATUS_LABEL[d.status],
    value: d.value,
  }));

  return (
    <ResponsiveContainer width="100%" height={Math.max(180, rows.length * 40)}>
      <BarChart
        data={rows}
        layout="vertical"
        margin={{ top: 4, right: 28, bottom: 4, left: 8 }}
        barCategoryGap="28%"
      >
        <CartesianGrid horizontal={false} stroke="var(--chart-grid)" strokeWidth={1} />
        <XAxis type="number" hide />
        <YAxis
          type="category"
          dataKey="label"
          width={92}
          tickLine={false}
          axisLine={false}
          tick={{ fontSize: 12, fill: 'var(--foreground)' }}
        />
        <Tooltip
          cursor={{ fill: 'var(--muted)', fillOpacity: 0.4 }}
          content={<OrdersTooltip />}
        />
        <Bar dataKey="value" radius={[4, 4, 4, 4]} fill="var(--chart-orders)">
          {rows.map((r) => (
            <Cell key={r.status} fill="var(--chart-orders)" />
          ))}
          <LabelList
            dataKey="value"
            position="right"
            className="fill-foreground"
            style={{ fontSize: 12, fontWeight: 600 }}
            formatter={(v: number) => formatNumber(v)}
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

function OrdersTooltip({ active, payload }: TooltipProps<number, string>) {
  if (!active || !payload?.length) return null;
  const row = payload[0]?.payload as Row | undefined;
  if (!row) return null;
  return (
    <div className="rounded-md border bg-popover px-2.5 py-1.5 text-xs shadow-md">
      <p className="font-medium text-popover-foreground">{row.label}</p>
      <p className="tabular-nums text-muted-foreground">
        {formatNumber(row.value)} đơn
      </p>
    </div>
  );
}
