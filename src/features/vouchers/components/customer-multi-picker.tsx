import { useEffect, useState } from 'react';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Skeleton } from '@/components/ui/skeleton';
import { useCustomers } from '@/features/customers';
import { customerRefDisplayName } from '../lib/labels';
import type { VoucherCustomerRef } from '../types';

interface CustomerMultiPickerProps {
  value: VoucherCustomerRef[];
  onChange: (value: VoucherCustomerRef[]) => void;
}

/** Search-and-add customer picker — empty selection = no customer
 *  restriction. Adding 1 = specific to that user; several = the "group" case. */
export function CustomerMultiPicker({ value, onChange }: CustomerMultiPickerProps) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [q, setQ] = useState('');

  useEffect(() => {
    const t = setTimeout(() => setQ(input.trim()), 350);
    return () => clearTimeout(t);
  }, [input]);

  const query = useCustomers({ q, limit: 8, page: 1 });
  const results = (query.data?.data ?? []).filter(
    (c) => q.length >= 2 && !value.some((v) => v.id === c.id),
  );

  const add = (c: VoucherCustomerRef) => {
    onChange([...value, c]);
    setInput('');
    setQ('');
    setOpen(false);
  };
  const remove = (id: string) => onChange(value.filter((v) => v.id !== id));

  return (
    <div className="space-y-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                setOpen(true);
              }}
              onFocus={() => input.trim().length >= 2 && setOpen(true)}
              placeholder="Tìm khách hàng theo tên, email, sđt…"
              className="pl-8"
            />
          </div>
        </PopoverTrigger>
        <PopoverContent
          align="start"
          className="w-[28rem] max-h-72 overflow-y-auto p-0"
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          {q.length < 2 ? (
            <p className="p-3 text-sm text-muted-foreground">
              Nhập ít nhất 2 ký tự để tìm khách hàng…
            </p>
          ) : query.isLoading ? (
            <div className="space-y-2 p-3">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          ) : results.length === 0 ? (
            <p className="p-3 text-sm text-muted-foreground">
              Không tìm thấy khách hàng phù hợp.
            </p>
          ) : (
            <ul className="divide-y">
              {results.map((c) => (
                <li key={c.id}>
                  <button
                    type="button"
                    className="block w-full truncate px-3 py-2 text-left text-sm hover:bg-accent"
                    onClick={() =>
                      add({
                        id: c.id,
                        email: c.email,
                        phone: c.phone,
                        firstName: c.firstName,
                        lastName: c.lastName,
                      })
                    }
                  >
                    {customerRefDisplayName({
                      id: c.id,
                      email: c.email,
                      phone: c.phone,
                      firstName: c.firstName,
                      lastName: c.lastName,
                    })}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </PopoverContent>
      </Popover>

      {value.length > 0 && (
        <ul className="space-y-1.5">
          {value.map((c) => (
            <li
              key={c.id}
              className="flex items-center justify-between rounded-md border bg-muted/40 px-3 py-1.5 text-sm"
            >
              <span className="truncate">{customerRefDisplayName(c)}</span>
              <button
                type="button"
                onClick={() => remove(c.id)}
                aria-label="Bỏ khách hàng"
                className="shrink-0 text-muted-foreground hover:text-foreground"
              >
                <X className="size-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
