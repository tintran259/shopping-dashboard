import { forwardRef } from 'react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

/** Digits only (no decimals — VND has no practical sub-unit in this app). */
function toDigits(raw: string): string {
  return raw.replace(/\D/g, '');
}

function formatVnd(digits: string): string {
  if (!digits) return '';
  return new Intl.NumberFormat('vi-VN').format(Number(digits));
}

interface MoneyInputProps {
  /** Raw digit string stored in form state, e.g. "199000" ('' = empty). */
  value: string;
  onChange: (digits: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  className?: string;
  name?: string;
}

/** VND money field — shows thousand separators live as the admin types, while
 *  the underlying form value stays a plain digit string (what the BE expects). */
export const MoneyInput = forwardRef<HTMLInputElement, MoneyInputProps>(
  ({ value, onChange, className, ...props }, ref) => {
    return (
      <div className="relative">
        <Input
          {...props}
          ref={ref}
          inputMode="decimal"
          value={formatVnd(value)}
          onChange={(e) => onChange(toDigits(e.target.value))}
          className={cn('pr-8 text-right tabular-nums', className)}
        />
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
          ₫
        </span>
      </div>
    );
  },
);
MoneyInput.displayName = 'MoneyInput';
