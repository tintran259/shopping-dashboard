import { Building2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/lib/format';
import type { B2bProfile } from '../../types';

export function CustomerB2bCard({ profile }: { profile: B2bProfile }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Building2 className="size-4 text-muted-foreground" />
          Hồ sơ doanh nghiệp (B2B)
        </CardTitle>
      </CardHeader>
      <CardContent className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
        <Field label="Tên công ty" value={profile.companyName} />
        <Field label="Mã số thuế" value={profile.taxCode} />
        <Field label="Địa chỉ công ty" value={profile.companyAddress} />
        <Field label="Hạn mức công nợ" value={formatCurrency(profile.creditLimit)} />
        <Field label="Điều khoản thanh toán" value={profile.paymentTerms} />
      </CardContent>
    </Card>
  );
}

function Field({ label, value }: { label: string; value?: string }) {
  return (
    <div className="min-w-0">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="truncate text-sm font-medium">{value || '—'}</p>
    </div>
  );
}
