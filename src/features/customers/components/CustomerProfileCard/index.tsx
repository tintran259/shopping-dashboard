import { Calendar, Mail, Pencil, Phone } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { StatusBadge } from '@/components/shared/status-badge';
import { CustomerType } from '@/types';
import { formatDateTime } from '@/lib/format';
import {
  CUSTOMER_TYPE_LABEL,
  customerDisplayName,
  customerInitials,
} from '../../lib/labels';
import type { Customer } from '../../types';

export function CustomerProfileCard({
  customer,
  onEdit,
}: {
  customer: Customer;
  onEdit: () => void;
}) {
  return (
    <Card>
      <CardContent className="py-5">
        <div className="flex items-start gap-4">
          <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-linear-to-br from-primary/20 to-primary/5 text-lg font-semibold text-primary ring-1 ring-inset ring-primary/15">
            {customerInitials(customer)}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="truncate text-lg font-semibold tracking-tight">
                {customerDisplayName(customer)}
              </h2>
              <StatusBadge kind="customer" value={customer.status} />
            </div>
            <Badge
              variant={customer.type === CustomerType.B2B ? 'info' : 'muted'}
              className="mt-1"
            >
              {CUSTOMER_TYPE_LABEL[customer.type]}
            </Badge>
          </div>

          <Button variant="outline" size="sm" onClick={onEdit}>
            <Pencil className="size-4" />
            Sửa
          </Button>
        </div>

        <div className="mt-5 grid gap-3 border-t pt-4 sm:grid-cols-2">
          <ContactRow icon={Mail} label="Email" value={customer.email} />
          <ContactRow icon={Phone} label="Điện thoại" value={customer.phone} />
          <ContactRow
            icon={Calendar}
            label="Ngày tạo"
            value={formatDateTime(customer.createdAt)}
          />
        </div>
      </CardContent>
    </Card>
  );
}

function ContactRow({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value?: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
        <Icon className="size-4" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="truncate text-sm font-medium">{value || '—'}</p>
      </div>
    </div>
  );
}
