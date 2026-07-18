import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHeader } from '@/components/shared/page-header';
import { QueryBoundary } from '@/components/shared/query-boundary';
import { CustomerType } from '@/types';
import { ROUTES } from '@/routes/paths';
import { CustomerAddressBook } from '../components/CustomerAddressBook';
import { CustomerB2bCard } from '../components/CustomerB2bCard';
import { CustomerProfileCard } from '../components/CustomerProfileCard';
import { CustomerStatusCard } from '../components/CustomerStatusCard';
import { EditCustomerDialog } from '../components/EditCustomerDialog';
import { useCustomer } from '../hooks/use-customers';
import { customerDisplayName } from '../lib/labels';
import type { Customer } from '../types';

export function CustomerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const query = useCustomer(id);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(ROUTES.customers)}
        >
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
  const [editOpen, setEditOpen] = useState(false);

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="space-y-6 lg:col-span-2">
        <CustomerProfileCard customer={customer} onEdit={() => setEditOpen(true)} />
        {customer.type === CustomerType.B2B && customer.b2bProfile && (
          <CustomerB2bCard profile={customer.b2bProfile} />
        )}
        <CustomerAddressBook addresses={customer.addresses} />
      </div>

      <div className="space-y-6">
        <CustomerStatusCard customer={customer} />
      </div>

      <EditCustomerDialog
        customer={customer}
        open={editOpen}
        onOpenChange={setEditOpen}
      />
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
