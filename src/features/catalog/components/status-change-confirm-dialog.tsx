import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { formatNumber } from '@/lib/format';
import { ProductStatus } from '@/types';
import { useProductInventorySummary } from '../hooks/use-products';
import { PRODUCT_STATUS_LABEL } from '../lib/labels';

interface StatusChangeConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productId: string;
  targetStatus: ProductStatus;
  loading?: boolean;
  onConfirm: () => void;
}

/**
 * Gate for switching a product to out_of_stock/discontinued — both force
 * every branch's stock to 0 BE-side (see `ProductsService.update`), so this
 * shows today's per-branch quantity before the admin commits to losing it.
 */
export function StatusChangeConfirmDialog({
  open,
  onOpenChange,
  productId,
  targetStatus,
  loading,
  onConfirm,
}: StatusChangeConfirmDialogProps) {
  const summary = useProductInventorySummary(open ? productId : undefined);
  const rowsWithStock = (summary.data ?? []).filter((r) => r.quantity > 0);
  const label = PRODUCT_STATUS_LABEL[targetStatus];

  return (
    <Dialog open={open} onOpenChange={(o) => !loading && onOpenChange(o)}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Chuyển sản phẩm sang &quot;{label}&quot;?</DialogTitle>
          <DialogDescription>
            Toàn bộ tồn kho ở mọi chi nhánh sẽ bị đưa về 0 và trạng thái tồn
            kho chuyển thành &quot;Hết hàng&quot; — không thể chỉnh lại số
            lượng cho tới khi đổi trạng thái sản phẩm về khác &quot;Hết
            hàng&quot;/&quot;Ngừng bán&quot;.
          </DialogDescription>
        </DialogHeader>

        {summary.isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        ) : rowsWithStock.length === 0 ? (
          <p className="rounded-md border border-dashed p-3 text-sm text-muted-foreground">
            Sản phẩm này hiện chưa có tồn kho ở chi nhánh nào — đổi trạng thái
            sẽ không mất số lượng nào.
          </p>
        ) : (
          <div className="rounded-md border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="px-3 py-2 font-medium">Chi nhánh</th>
                  <th className="px-3 py-2 text-right font-medium">
                    Tồn hiện tại → sẽ về
                  </th>
                </tr>
              </thead>
              <tbody>
                {rowsWithStock.map((r) => (
                  <tr key={r.branchId} className="border-b last:border-0">
                    <td className="px-3 py-2">{r.branchName}</td>
                    <td className="px-3 py-2 text-right tabular-nums">
                      {formatNumber(r.quantity)} → 0
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Hủy
          </Button>
          <Button variant="destructive" onClick={onConfirm} loading={loading}>
            Xác nhận chuyển sang &quot;{label}&quot;
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
