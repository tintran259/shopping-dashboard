import { useState } from 'react';
import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api-client';
import { ApiError } from '@/lib/api-error';
import { Button } from '@/components/ui/button';
import { DataTable, type ColumnDef } from '@/components/shared/data-table';
import { PageHeader } from '@/components/shared/page-header';

export interface Province {
  code: number;
  name: string;
}
export interface Ward {
  code: number;
  name: string;
  provinceCode: number;
}

const locationsApi = {
  provinces: () => apiClient.get<Province[]>('/locations/provinces'),
  wards: (code: number) =>
    apiClient.get<Ward[]>(`/locations/provinces/${code}/wards`),
  sync: () =>
    apiClient.post<{ provinces: number; wards: number }>('/locations/sync'),
};

const keys = {
  provinces: ['locations', 'provinces'] as const,
  wards: (code: number) => ['locations', 'wards', code] as const,
};

export function useProvinces() {
  return useQuery({
    queryKey: keys.provinces,
    queryFn: () => locationsApi.provinces(),
    staleTime: Infinity,
  });
}

export function useWards(provinceCode: number | undefined) {
  return useQuery({
    queryKey: keys.wards(provinceCode ?? 0),
    queryFn: () => locationsApi.wards(provinceCode as number),
    enabled: !!provinceCode,
  });
}

export function LocationsPage() {
  const qc = useQueryClient();
  const provinces = useProvinces();
  const [selected, setSelected] = useState<Province | null>(null);
  const wards = useWards(selected?.code);

  const sync = useMutation({
    mutationFn: () => locationsApi.sync(),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['locations'] });
      toast.success(
        `Đã đồng bộ ${res.provinces} tỉnh/thành và ${res.wards} phường/xã`,
      );
    },
    onError: (e) =>
      toast.error(e instanceof ApiError ? e.message : 'Đồng bộ thất bại'),
  });

  const provinceCols: ColumnDef<Province>[] = [
    { id: 'code', header: 'Mã', className: 'w-24', cell: (p) => p.code },
    { id: 'name', header: 'Tỉnh/Thành', cell: (p) => p.name },
  ];
  const wardCols: ColumnDef<Ward>[] = [
    { id: 'code', header: 'Mã', className: 'w-24', cell: (w) => w.code },
    { id: 'name', header: 'Phường/Xã', cell: (w) => w.name },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Địa chỉ (Tỉnh/Phường)"
        description="Dữ liệu hành chính dùng cho địa chỉ giao hàng."
        actions={
          <Button
            variant="outline"
            loading={sync.isPending}
            onClick={() => sync.mutate()}
          >
            <RefreshCw className="size-4" />
            Đồng bộ dữ liệu
          </Button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-2">
          <p className="text-sm font-medium">Tỉnh/Thành</p>
          <DataTable
            columns={provinceCols}
            data={provinces.data}
            rowKey={(p) => String(p.code)}
            isLoading={provinces.isLoading}
            isError={provinces.isError}
            error={provinces.error}
            onRetry={() => provinces.refetch()}
            onRowClick={(p) => setSelected(p)}
            emptyTitle="Chưa có dữ liệu — hãy nhấn Đồng bộ"
          />
        </div>
        <div className="space-y-2">
          <p className="text-sm font-medium">
            Phường/Xã{selected ? ` · ${selected.name}` : ''}
          </p>
          {selected ? (
            <DataTable
              columns={wardCols}
              data={wards.data}
              rowKey={(w) => String(w.code)}
              isLoading={wards.isLoading}
              isError={wards.isError}
              error={wards.error}
              onRetry={() => wards.refetch()}
              emptyTitle="Không có phường/xã"
            />
          ) : (
            <div className="flex h-48 items-center justify-center rounded-lg border text-sm text-muted-foreground">
              Chọn một tỉnh/thành để xem phường/xã
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
