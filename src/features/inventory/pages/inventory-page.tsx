import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { EmptyState } from '@/components/shared/empty-state';
import { ErrorState } from '@/components/shared/error-state';
import { PageHeader } from '@/components/shared/page-header';
import { Skeleton } from '@/components/ui/skeleton';
import { StockEditor } from '../components/stock-editor';
import { VariantPicker, type PickedInventoryVariant } from '../components/variant-picker';
import { useVariantStock } from '../hooks/use-branches';

/**
 * Stock is keyed by (variant × branch). BE exposes reads per-variant only, so
 * you search for a product/variant here (server-side, by name or SKU) rather
 * than needing to paste a variant UUID copied from the product editor.
 */
export function InventoryPage() {
  const [selected, setSelected] = useState<PickedInventoryVariant | undefined>();
  const query = useVariantStock(selected?.variantId);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tồn kho"
        description="Xem và điều chỉnh tồn kho theo từng biến thể × chi nhánh."
      />

      <Card>
        <CardContent className="space-y-3 pt-6">
          <VariantPicker onPick={setSelected} />
          {selected && (
            <div className="flex items-center justify-between rounded-md border bg-muted/40 px-3 py-2 text-sm">
              <div className="min-w-0">
                <p className="truncate font-medium">{selected.productName}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {selected.variantTitle ? `${selected.variantTitle} · ` : ''}
                  SKU: {selected.sku}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="shrink-0"
                onClick={() => setSelected(undefined)}
              >
                Đổi biến thể
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {!selected ? (
        <EmptyState
          title="Chưa chọn biến thể"
          description="Tìm sản phẩm ở trên để xem hoặc gán tồn kho theo chi nhánh."
        />
      ) : query.isLoading ? (
        <Skeleton className="h-48 w-full rounded-lg" />
      ) : query.isError ? (
        <ErrorState error={query.error} onRetry={() => query.refetch()} />
      ) : (
        // Sản phẩm mới chưa có dòng tồn kho ở chi nhánh nào (mảng rỗng) vẫn
        // hiển thị đủ danh sách chi nhánh — đây chính là chỗ "gán" sản phẩm
        // vào chi nhánh lần đầu, xem StockEditor.
        <StockEditor variantId={selected.variantId} rows={query.data ?? []} />
      )}
    </div>
  );
}
