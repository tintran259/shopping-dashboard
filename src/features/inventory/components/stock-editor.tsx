import { useState } from 'react';
import { Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { StatusBadge } from '@/components/shared/status-badge';
import { InventoryStatus } from '@/types';
import { formatNumber } from '@/lib/format';
import { useBranches, useUpsertInventory } from '../hooks/use-branches';
import type { BranchStock } from '../types';

interface StockEditorProps {
  variantId: string;
  rows: BranchStock[];
  /** Product is out_of_stock/discontinued — BE already rejects any edit, this
   *  just disables the controls upfront instead of making the admin hit the
   *  error first (see `InventoryPage`'s banner above this table). */
  locked?: boolean;
}

/** One row per branch, whether or not it has a stock record yet — a variant
 *  isn't "in" a branch until the first `PUT /branches/inventory` for that
 *  pair, so a brand-new product must still show every branch here (with
 *  quantity 0) or there'd be no way to assign it to one at all. */
interface MergedRow {
  branchId: string;
  quantity: number;
  reserved: number;
  status: InventoryStatus;
  /** Not yet saved for this branch — first save creates the row. */
  isNew: boolean;
}

/**
 * Per-branch stock table for a variant. Only `quantity` is editable — `reserved`
 * is BE-managed (reserve→commit) and `available` is derived by the BE.
 */
export function StockEditor({ variantId, rows, locked }: StockEditorProps) {
  const { data: branches } = useBranches();
  const upsert = useUpsertInventory();
  const [drafts, setDrafts] = useState<Record<string, string>>({});

  const rowByBranch = new Map(rows.map((r) => [r.branchId, r]));
  const merged: MergedRow[] = (branches ?? []).map((b) => {
    const existing = rowByBranch.get(b.id);
    return existing
      ? { ...existing, isNew: false }
      : {
          branchId: b.id,
          quantity: 0,
          reserved: 0,
          status: InventoryStatus.OUT_OF_STOCK,
          isNew: true,
        };
  });

  const branchName = (id: string) =>
    branches?.find((b) => b.id === id)?.name ?? id;

  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead>Chi nhánh</TableHead>
            <TableHead className="text-right">Tồn (quantity)</TableHead>
            <TableHead className="text-right">Đang giữ (reserved)</TableHead>
            <TableHead className="text-right">Khả dụng (available)</TableHead>
            <TableHead>Trạng thái</TableHead>
            <TableHead className="w-52">Điều chỉnh tồn</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {merged.map((row) => {
            const draft = drafts[row.branchId] ?? String(row.quantity);
            const changed = row.isNew || draft !== String(row.quantity);
            const save = () => {
              if (locked || !changed || upsert.isPending) return;
              const quantity = Math.max(0, Number(draft) || 0);
              // Không gửi `status` — BE tự suy ra từ quantity (giữ nguyên
              // preorder nếu có), để trạng thái luôn khớp với số lượng bất
              // kể client nào gọi API này.
              upsert.mutate({ branchId: row.branchId, variantId, quantity });
            };
            return (
              <TableRow key={row.branchId} className="hover:bg-transparent">
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    {branchName(row.branchId)}
                    {row.isNew && (
                      <span className="rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
                        Chưa gán
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatNumber(row.quantity)}
                </TableCell>
                <TableCell className="text-right tabular-nums text-muted-foreground">
                  {formatNumber(row.reserved)}
                </TableCell>
                <TableCell className="text-right font-medium tabular-nums">
                  {formatNumber(Math.max(0, row.quantity - row.reserved))}
                </TableCell>
                <TableCell>
                  <StatusBadge kind="inventory" value={row.status} />
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min={0}
                      value={draft}
                      className="h-8 w-24"
                      disabled={locked}
                      onChange={(e) =>
                        setDrafts((d) => ({ ...d, [row.branchId]: e.target.value }))
                      }
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') save();
                      }}
                    />
                    <Button
                      size="icon"
                      variant="outline"
                      className="size-8"
                      disabled={locked || !changed || upsert.isPending}
                      aria-label={row.isNew ? 'Gán vào chi nhánh' : 'Lưu tồn kho'}
                      onClick={save}
                    >
                      <Check className="size-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
