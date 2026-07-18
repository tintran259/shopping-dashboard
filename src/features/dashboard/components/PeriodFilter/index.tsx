import { CalendarDays } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { BranchSwitcher } from '@/components/shared/branch-switcher';
import {
  formatDM,
  formatDMY,
  parseDateInput,
  toDateInputValue,
  type PeriodKind,
  type PeriodValue,
} from '../../lib/period';

const KIND_LABEL: Record<PeriodKind, string> = {
  year: 'Theo năm',
  quarter: 'Theo quý',
  day: 'Theo ngày',
};
const KIND_OPTIONS = Object.keys(KIND_LABEL) as PeriodKind[];
const QUARTERS = [1, 2, 3, 4];

/** Last 6 years incl. the current one, newest first. */
function yearOptions(): number[] {
  const y = new Date().getFullYear();
  return Array.from({ length: 6 }, (_, i) => y - i);
}

interface PeriodFilterProps {
  value: PeriodValue;
  onChange: (value: PeriodValue) => void;
  branchId: string | null;
  onBranchChange: (branchId: string | null) => void;
}

/**
 * Dashboard filter bar: branch scope (local to this page) + time-range
 * granularity + the value picker for that granularity. Every granularity
 * always ships with the branch select alongside it.
 */
export function PeriodFilter({
  value,
  onChange,
  branchId,
  onBranchChange,
}: PeriodFilterProps) {
  const years = yearOptions();

  return (
    <div className="flex flex-wrap items-center gap-2">
      <BranchSwitcher value={branchId} onChange={onBranchChange} />

      <Select
        value={value.kind}
        onValueChange={(kind) => onChange({ ...value, kind: kind as PeriodKind })}
      >
        <SelectTrigger className="w-36">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {KIND_OPTIONS.map((k) => (
            <SelectItem key={k} value={k}>
              {KIND_LABEL[k]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {value.kind === 'year' && (
        <Select
          value={String(value.year)}
          onValueChange={(y) => onChange({ ...value, year: Number(y) })}
        >
          <SelectTrigger className="w-24">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {years.map((y) => (
              <SelectItem key={y} value={String(y)}>
                {y}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {value.kind === 'quarter' && (
        <>
          <Select
            value={String(value.quarter)}
            onValueChange={(q) => onChange({ ...value, quarter: Number(q) })}
          >
            <SelectTrigger className="w-24">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {QUARTERS.map((q) => (
                <SelectItem key={q} value={String(q)}>
                  {`Quý ${q}`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={String(value.year)}
            onValueChange={(y) => onChange({ ...value, year: Number(y) })}
          >
            <SelectTrigger className="w-24">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {years.map((y) => (
                <SelectItem key={y} value={String(y)}>
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </>
      )}

      {value.kind === 'day' && (
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-56 justify-start gap-2 font-normal">
              <CalendarDays className="size-4 text-muted-foreground" />
              {(() => {
                const from = parseDateInput(value.dateFrom);
                const to = parseDateInput(value.dateTo);
                return value.dateFrom === value.dateTo
                  ? formatDMY(from)
                  : `${formatDM(from)} – ${formatDMY(to)}`;
              })()}
            </Button>
          </PopoverTrigger>
          <PopoverContent align="start">
            <Calendar
              mode="range"
              selected={{
                from: parseDateInput(value.dateFrom),
                to: parseDateInput(value.dateTo),
              }}
              onSelect={(range) => {
                if (!range?.from) return;
                const dateFrom = toDateInputValue(range.from);
                const dateTo = toDateInputValue(range.to ?? range.from);
                onChange({ ...value, dateFrom, dateTo });
              }}
            />
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
}
