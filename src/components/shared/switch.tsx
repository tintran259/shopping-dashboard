import { cn } from '@/lib/utils';

/** Minimal on/off switch — no Radix primitive for this in the design system,
 *  so it's a plain button styled to look/behave like one. */
export function Switch({
  checked,
  onCheckedChange,
}: {
  checked: boolean;
  onCheckedChange: (value: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onCheckedChange(!checked)}
      className={cn(
        'relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors',
        checked ? 'bg-primary' : 'bg-input',
      )}
    >
      <span
        className={cn(
          'inline-block size-4 translate-x-0.5 transform rounded-full bg-white shadow transition-transform',
          checked && 'translate-x-4',
        )}
      />
    </button>
  );
}
