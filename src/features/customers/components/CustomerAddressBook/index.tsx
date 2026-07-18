import { MapPin } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Address } from '../../types';

export function CustomerAddressBook({ addresses }: { addresses?: Address[] }) {
  const list = addresses ?? [];
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          Sổ địa chỉ
          <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-normal text-muted-foreground">
            {list.length}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {list.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-6 text-center">
            <div className="flex size-11 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <MapPin className="size-5" />
            </div>
            <p className="text-sm text-muted-foreground">
              Khách hàng chưa lưu địa chỉ nào.
            </p>
          </div>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2">
            {list.map((a) => (
              <li
                key={a.id}
                className="flex gap-3 rounded-xl border p-3 transition-colors hover:bg-accent/40"
              >
                <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <MapPin className="size-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-medium">
                      {a.recipientName}
                    </p>
                    {a.isDefault && (
                      <Badge variant="success" className="shrink-0">
                        Mặc định
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">{a.phone}</p>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    {[a.street, a.wardName, a.provinceName]
                      .filter(Boolean)
                      .join(', ')}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
