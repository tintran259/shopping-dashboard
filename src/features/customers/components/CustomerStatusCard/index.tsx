import { useState } from 'react';
import { Lock, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { StatusBadge } from '@/components/shared/status-badge';
import { CustomerStatus } from '@/types';
import { useUpdateCustomerStatus } from '../../hooks/use-customer-mutations';
import { customerDisplayName } from '../../lib/labels';
import type { Customer } from '../../types';

export function CustomerStatusCard({ customer }: { customer: Customer }) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const updateStatus = useUpdateCustomerStatus(customer.id);
  const isActive = customer.status === CustomerStatus.ACTIVE;
  const name = customerDisplayName(customer);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Trạng thái tài khoản</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Hiện tại</span>
          <StatusBadge kind="customer" value={customer.status} />
        </div>
        <p className="text-xs text-muted-foreground">
          {isActive
            ? 'Tài khoản đang hoạt động — khách có thể đăng nhập và đặt hàng.'
            : 'Tài khoản đang bị khóa — khách không thể đăng nhập.'}
        </p>
        <Button
          className="w-full"
          variant={isActive ? 'destructive' : 'outline'}
          onClick={() => setConfirmOpen(true)}
        >
          {isActive ? (
            <>
              <Lock className="size-4" />
              Khóa tài khoản
            </>
          ) : (
            <>
              <ShieldCheck className="size-4" />
              Mở khóa tài khoản
            </>
          )}
        </Button>
      </CardContent>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        destructive={isActive}
        title={
          isActive ? `Khóa tài khoản của ${name}?` : `Mở khóa tài khoản của ${name}?`
        }
        description={
          isActive
            ? 'Khách hàng sẽ không thể đăng nhập cho đến khi được mở khóa lại.'
            : 'Khách hàng sẽ có thể đăng nhập và đặt hàng trở lại.'
        }
        confirmLabel={isActive ? 'Khóa tài khoản' : 'Mở khóa'}
        cancelLabel="Không"
        loading={updateStatus.isPending}
        onConfirm={() =>
          updateStatus.mutate(
            isActive ? CustomerStatus.DISABLED : CustomerStatus.ACTIVE,
            { onSuccess: () => setConfirmOpen(false) },
          )
        }
      />
    </Card>
  );
}
