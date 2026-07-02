import { useState } from 'react';
import { Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { EmptyState } from '@/components/shared/empty-state';
import { ErrorState } from '@/components/shared/error-state';
import { PageHeader } from '@/components/shared/page-header';
import { Skeleton } from '@/components/ui/skeleton';
import { StockEditor } from '../components/stock-editor';
import { useVariantStock } from '../hooks/use-branches';

/**
 * Stock is keyed by (variant × branch). BE exposes reads per-variant only, so
 * you look up a variant by its ID (copy from the product editor) to view/adjust
 * its stock across branches.
 */
export function InventoryPage() {
  const [input, setInput] = useState('');
  const [variantId, setVariantId] = useState<string | undefined>();
  const query = useVariantStock(variantId);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tồn kho"
        description="Xem và điều chỉnh tồn kho theo từng biến thể × chi nhánh."
      />

      <Card>
        <CardContent className="pt-6">
          <form
            className="flex flex-col gap-2 sm:flex-row"
            onSubmit={(e) => {
              e.preventDefault();
              setVariantId(input.trim() || undefined);
            }}
          >
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Nhập Variant ID (UUID) để tra cứu tồn kho…"
                className="pl-8"
              />
            </div>
            <Button type="submit">Tra cứu</Button>
          </form>
        </CardContent>
      </Card>

      {!variantId ? (
        <EmptyState
          title="Chưa chọn biến thể"
          description="Dán Variant ID để xem tồn kho theo chi nhánh."
        />
      ) : query.isLoading ? (
        <Skeleton className="h-48 w-full rounded-lg" />
      ) : query.isError ? (
        <ErrorState error={query.error} onRetry={() => query.refetch()} />
      ) : !query.data || query.data.length === 0 ? (
        <EmptyState
          title="Không có dữ liệu tồn kho"
          description="Biến thể này chưa được thiết lập tồn tại chi nhánh nào."
        />
      ) : (
        <StockEditor variantId={variantId} rows={query.data} />
      )}
    </div>
  );
}
