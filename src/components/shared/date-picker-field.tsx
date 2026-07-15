import { CalendarDays, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { formatDate } from '@/lib/format';
import { cn } from '@/lib/utils';

/** 'YYYY-MM-DD' → Date theo giờ ĐỊA PHƯƠNG (không dùng `new Date(iso)` vì chuỗi
 *  chỉ-ngày bị hiểu là UTC → lệch 1 ngày ở múi giờ VN). */
function parseLocalDate(value?: string): Date | undefined {
  if (!value) return undefined;
  const [y, m, d] = value.slice(0, 10).split('-').map(Number);
  if (!y || !m || !d) return undefined;
  return new Date(y, m - 1, d);
}

/** Date → 'YYYY-MM-DD' theo giờ địa phương (không `toISOString()` để tránh lệch
 *  ngày qua múi giờ). */
function toLocalIsoDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

interface DatePickerFieldProps {
  /** 'YYYY-MM-DD' hoặc '' khi chưa chọn. */
  value?: string;
  /** Trả 'YYYY-MM-DD' khi chọn, '' khi bỏ chọn. */
  onChange: (value: string) => void;
  placeholder?: string;
  /** Nhãn nút bỏ chọn (vd "Bỏ chọn (vô thời hạn)"). */
  clearLabel?: string;
  disabled?: boolean;
  className?: string;
}

/**
 * Ô chọn ngày dùng chung (lịch pop-over) cho các field chỉ-ngày ('YYYY-MM-DD').
 * Bọc `Calendar` (react-day-picker) — cùng UI/dark-mode với toàn hệ thống, thay
 * cho `<input type="date">` thô. Chuyển đổi ngày theo giờ địa phương nên không
 * bị lệch 1 ngày như khi dùng ISO/UTC.
 */
export function DatePickerField({
  value,
  onChange,
  placeholder = 'Chọn ngày…',
  clearLabel = 'Bỏ chọn',
  disabled,
  className,
}: DatePickerFieldProps) {
  const date = parseLocalDate(value);

  return (
    <div className={cn('flex items-center gap-1', className)}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            disabled={disabled}
            className="min-w-0 flex-1 justify-start font-normal"
          >
            <CalendarDays className="size-4 shrink-0 text-muted-foreground" />
            {date ? (
              formatDate(date)
            ) : (
              <span className="text-muted-foreground">{placeholder}</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={date}
            onSelect={(d) => onChange(d ? toLocalIsoDate(d) : '')}
          />
          {date && (
            <div className="border-t p-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="w-full"
                onClick={() => onChange('')}
              >
                {clearLabel}
              </Button>
            </div>
          )}
        </PopoverContent>
      </Popover>
      {/* Nút xóa nhanh ngay cạnh ô — trả về vô thời hạn mà không cần mở lịch. */}
      {date && !disabled && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-9 shrink-0 text-muted-foreground"
          onClick={() => onChange('')}
          aria-label={clearLabel}
          title={clearLabel}
        >
          <X className="size-4" />
        </Button>
      )}
    </div>
  );
}
