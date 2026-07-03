import { ChevronLeft, ChevronRight } from 'lucide-react';
import { DayPicker, type DayPickerProps } from 'react-day-picker';
import { cn } from '@/lib/utils';

export type CalendarProps = DayPickerProps;

const VN_WEEKDAY = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
const VN_MONTH = Array.from({ length: 12 }, (_, i) => `Tháng ${i + 1}`);

/** Styled react-day-picker wrapper — no default stylesheet; every slot is
 *  Tailwind so it always matches the app's tokens (incl. dark mode). Native
 *  `<button>`/`<select>` chrome is explicitly reset since nothing here relies
 *  on the library's own stylesheet. */
export function Calendar({ className, classNames, ...props }: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays
      className={cn('p-3', className)}
      classNames={{
        months: 'flex flex-col gap-4',
        month: 'relative space-y-3',
        month_caption: 'flex items-center justify-center pt-1',
        caption_label: 'text-sm font-medium text-foreground',
        // z-10: keeps the nav buttons above the caption row wherever their
        // hit areas overlap.
        nav: 'absolute inset-x-0 top-0 z-10 flex items-center justify-between',
        button_previous:
          'inline-flex size-9 appearance-none items-center justify-center rounded-md border-0 bg-transparent p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground disabled:pointer-events-none disabled:opacity-40',
        button_next:
          'inline-flex size-9 appearance-none items-center justify-center rounded-md border-0 bg-transparent p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground disabled:pointer-events-none disabled:opacity-40',
        month_grid: 'w-full border-collapse',
        weekdays: '',
        weekday: 'w-9 pb-1 text-[0.75rem] font-normal text-muted-foreground',
        week: '',
        day: 'p-0.5 text-center align-middle',
        day_button:
          'inline-flex size-9 appearance-none items-center justify-center rounded-md border-0 bg-transparent text-sm font-normal text-foreground transition-colors hover:bg-accent hover:text-accent-foreground',
        today: '[&>button]:font-semibold [&>button]:text-primary',
        selected:
          '[&>button]:bg-primary [&>button]:text-primary-foreground [&>button]:hover:bg-primary [&>button]:hover:text-primary-foreground',
        range_start:
          '[&>button]:rounded-r-none [&>button]:bg-primary [&>button]:text-primary-foreground [&>button]:hover:bg-primary [&>button]:hover:text-primary-foreground',
        range_middle:
          '[&>button]:rounded-none [&>button]:bg-primary/20 [&>button]:text-foreground [&>button]:hover:bg-primary/30',
        range_end:
          '[&>button]:rounded-l-none [&>button]:bg-primary [&>button]:text-primary-foreground [&>button]:hover:bg-primary [&>button]:hover:text-primary-foreground',
        outside: '[&>button]:text-muted-foreground/40',
        disabled: '[&>button]:pointer-events-none [&>button]:opacity-30',
        hidden: 'invisible',
        ...classNames,
      }}
      formatters={{
        formatWeekdayName: (d) => VN_WEEKDAY[d.getDay()] ?? '',
        formatCaption: (d) => `${VN_MONTH[d.getMonth()]}/${d.getFullYear()}`,
      }}
      components={{
        Chevron: ({ orientation, className: chevronClassName, ...rest }) =>
          orientation === 'left' ? (
            <ChevronLeft className={cn('size-4', chevronClassName)} {...rest} />
          ) : (
            <ChevronRight className={cn('size-4', chevronClassName)} {...rest} />
          ),
      }}
      {...props}
    />
  );
}
