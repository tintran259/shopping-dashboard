import type { OrderRevenuePoint } from '@/features/orders';
import type { AreaPoint } from '../components/RevenueAreaChart';

export type PeriodKind = 'year' | 'quarter' | 'day';

export interface PeriodValue {
  kind: PeriodKind;
  year: number;
  /** 1-4, meaningful when kind === 'quarter'. */
  quarter: number;
  /** 'YYYY-MM-DD', range start (inclusive) — meaningful when kind === 'day'. */
  dateFrom: string;
  /** 'YYYY-MM-DD', range end (inclusive) — meaningful when kind === 'day'. */
  dateTo: string;
}

export interface PeriodRange {
  from: Date;
  /** Exclusive. */
  to: Date;
  label: string;
}

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

/** "dd/MM" — shared by the period labels and the filter's trigger buttons. */
export function formatDM(d: Date): string {
  return `${pad2(d.getDate())}/${pad2(d.getMonth() + 1)}`;
}

/** "dd/MM/yyyy" — shared by the period labels and the filter's trigger buttons. */
export function formatDMY(d: Date): string {
  return `${pad2(d.getDate())}/${pad2(d.getMonth() + 1)}/${d.getFullYear()}`;
}

export function toDateInputValue(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

/** Parse a 'YYYY-MM-DD' string as a local-midnight Date (a bare `new Date(str)`
 *  parses date-only ISO strings as UTC, which can shift the calendar day). */
export function parseDateInput(value: string): Date {
  const [yStr, mStr, dStr] = value.split('-');
  return new Date(Number(yStr), Number(mStr) - 1, Number(dStr));
}

/** Default filter state: current quarter, with the day-range picker preset to today. */
export function defaultPeriod(): PeriodValue {
  const now = new Date();
  const today = toDateInputValue(now);
  return {
    kind: 'quarter',
    year: now.getFullYear(),
    quarter: Math.floor(now.getMonth() / 3) + 1,
    dateFrom: today,
    dateTo: today,
  };
}

/** Resolve a [from, to) date range + display label for the selected period. */
export function periodRange(p: PeriodValue): PeriodRange {
  switch (p.kind) {
    case 'year': {
      const from = new Date(p.year, 0, 1);
      const to = new Date(p.year + 1, 0, 1);
      return { from, to, label: `Năm ${p.year}` };
    }
    case 'day': {
      const from = parseDateInput(p.dateFrom);
      const lastInclusive = parseDateInput(p.dateTo);
      const to = new Date(lastInclusive);
      to.setDate(to.getDate() + 1);
      const label =
        p.dateFrom === p.dateTo
          ? formatDMY(from)
          : `${formatDM(from)} – ${formatDMY(lastInclusive)}`;
      return { from, to, label };
    }
    case 'quarter':
    default: {
      const startMonth = (p.quarter - 1) * 3;
      const from = new Date(p.year, startMonth, 1);
      const to = new Date(p.year, startMonth + 3, 1);
      return { from, to, label: `Quý ${p.quarter}/${p.year}` };
    }
  }
}

/**
 * Turn the BE's daily PAID-revenue series into chart points, bucketed to match
 * the period's granularity (year → by month, quarter → by week, day → by day)
 * and zero-filled for days/weeks/months with no PAID revenue — the BE only
 * returns rows that have at least one PAID order, so gaps must be filled here
 * or the trend line would misleadingly skip straight over them.
 */
export function buildAreaSeries(
  series: OrderRevenuePoint[],
  range: PeriodRange,
  kind: PeriodKind,
): AreaPoint[] {
  const revenueByDay = new Map<string, number>();
  for (const p of series) revenueByDay.set(p.date, Number(p.revenue));

  if (kind === 'year') return monthBuckets(range, revenueByDay);
  if (kind === 'quarter') return weekBuckets(range, revenueByDay);
  return dayBuckets(range, revenueByDay);
}

function sumDays(from: Date, to: Date, revenueByDay: Map<string, number>): number {
  let sum = 0;
  const cur = new Date(from);
  while (cur < to) {
    sum += revenueByDay.get(toDateInputValue(cur)) ?? 0;
    cur.setDate(cur.getDate() + 1);
  }
  return sum;
}

function dayBuckets(
  range: PeriodRange,
  revenueByDay: Map<string, number>,
): AreaPoint[] {
  const points: AreaPoint[] = [];
  const cur = new Date(range.from);
  while (cur < range.to) {
    points.push({
      label: `${pad2(cur.getDate())}/${pad2(cur.getMonth() + 1)}`,
      fullLabel: `${pad2(cur.getDate())}/${pad2(cur.getMonth() + 1)}/${cur.getFullYear()}`,
      value: revenueByDay.get(toDateInputValue(cur)) ?? 0,
    });
    cur.setDate(cur.getDate() + 1);
  }
  return points;
}

function weekBuckets(
  range: PeriodRange,
  revenueByDay: Map<string, number>,
): AreaPoint[] {
  const points: AreaPoint[] = [];
  const cur = new Date(range.from);
  let weekIdx = 1;
  while (cur < range.to) {
    const weekEnd = new Date(cur);
    weekEnd.setDate(weekEnd.getDate() + 7);
    const boundedEnd = weekEnd < range.to ? weekEnd : range.to;
    points.push({
      label: `Tuần ${weekIdx}`,
      fullLabel: `Tuần ${weekIdx} (${pad2(cur.getDate())}/${pad2(cur.getMonth() + 1)} – ${pad2(boundedEnd.getDate())}/${pad2(boundedEnd.getMonth() + 1)})`,
      value: sumDays(cur, boundedEnd, revenueByDay),
    });
    cur.setDate(cur.getDate() + 7);
    weekIdx += 1;
  }
  return points;
}

function monthBuckets(
  range: PeriodRange,
  revenueByDay: Map<string, number>,
): AreaPoint[] {
  const points: AreaPoint[] = [];
  const cur = new Date(range.from.getFullYear(), range.from.getMonth(), 1);
  while (cur < range.to) {
    const monthEnd = new Date(cur.getFullYear(), cur.getMonth() + 1, 1);
    points.push({
      label: `Th.${cur.getMonth() + 1}`,
      fullLabel: `Tháng ${cur.getMonth() + 1}/${cur.getFullYear()}`,
      value: sumDays(cur, monthEnd, revenueByDay),
    });
    cur.setMonth(cur.getMonth() + 1);
  }
  return points;
}
