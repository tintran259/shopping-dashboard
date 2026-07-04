import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Lock, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { PageHeader } from '@/components/shared/page-header';
import { QueryBoundary } from '@/components/shared/query-boundary';
import { StatusBadge } from '@/components/shared/status-badge';
import { CustomerStatus, CustomerType } from '@/types';
import { formatCurrency, formatDateTime } from '@/lib/format';
import { ROUTES } from '@/app/routes';
import { useUpdateCustomerStatus } from '../hooks/use-customer-mutations';
import { useCustomer } from '../hooks/use-customers';
import {
  CUSTOMER_TYPE_LABEL,
  customerDisplayName,
} from '../lib/labels';
import type { Customer } from '../types';

export function CustomerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const query = useCustomer(id);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={() => navigate(ROUTES.customers)}>
          <ArrowLeft className="size-4" />
        </Button>
        <PageHeader
          title={query.data ? customerDisplayName(query.data) : 'Chi tiết khách hàng'}
        />
      </div>

      <QueryBoundary
        isLoading={query.isLoading}
        isError={query.isError}
        error={query.error}
        onRetry={() => query.refetch()}
        fallback={<CustomerDetailSkeleton />}
      >
        {query.data && <CustomerDetailContent customer={query.data} />}
      </QueryBoundary>
    </div>
  );
}

function CustomerDetailContent({ customer }: { customer: Customer }) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const updateStatus = useUpdateCustomerStatus(customer.id);
  const isActive = customer.status === CustomerStatus.ACTIVE;

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="space-y-6 lg:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle>Thông tin khách hàng</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <InfoRow label="Họ tên" value={customerDisplayName(customer)} />
            <InfoRow label="Email" value={customer.email ?? '—'} />
            <InfoRow label="Điện thoại" value={customer.phone ?? '—'} />
            <InfoRow label="Loại khách" value={CUSTOMER_TYPE_LABEL[customer.type]} />
            <InfoRow label="Ngày tạo" value={formatDateTime(customer.createdAt)} />
          </CardContent>
        </Card>

        {customer.type === CustomerType.B2B && customer.b2bProfile && (
          <Card>
            <CardHeader>
              <CardTitle>Hồ sơ doanh nghiệp (B2B)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <InfoRow label="Tên công ty" value={customer.b2bProfile.companyName} />
              <InfoRow label="Mã số thuế" value={customer.b2bProfile.taxCode} />
              <InfoRow
                label="Địa chỉ công ty"
                value={customer.b2bProfile.companyAddress ?? '—'}
              />
              <InfoRow
                label="Hạn mức công nợ"
                value={formatCurrency(customer.b2bProfile.creditLimit)}
              />
              <InfoRow
                label="Điều khoản thanh toán"
                value={customer.b2bProfile.paymentTerms ?? '—'}
              />
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Sổ địa chỉ ({customer.addresses?.length ?? 0})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {!customer.addresses?.length ? (
              <p className="text-sm text-muted-foreground">Chưa có địa chỉ nào.</p>
            ) : (
              customer.addresses.map((a) => (
                <div key={a.id} className="rounded-lg border p-3 text-sm">
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{a.recipientName}</p>
                    {a.isDefault && (
                      <span className="rounded bg-primary/10 px-1.5 py-0.5 text-xs text-primary">
                        Mặc định
                      </span>
                    )}
                  </div>
                  <p className="text-muted-foreground">{a.phone}</p>
                  <p className="text-muted-foreground">
                    {a.street}, {a.wardName}, {a.provinceName}
                  </p>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Trạng thái tài khoản</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <StatusBadge kind="customer" value={customer.status} />
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
        </Card>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        destructive={isActive}
        title={
          isActive
            ? `Khóa tài khoản của ${customerDisplayName(customer)}?`
            : `Mở khóa tài khoản của ${customerDisplayName(customer)}?`
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
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right">{value}</span>
    </div>
  );
}

function CustomerDetailSkeleton() {
  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="space-y-6 lg:col-span-2">
        <Skeleton className="h-48 w-full rounded-xl" />
        <Skeleton className="h-40 w-full rounded-xl" />
      </div>
      <div className="space-y-6">
        <Skeleton className="h-48 w-full rounded-xl" />
      </div>
    </div>
  );
}
