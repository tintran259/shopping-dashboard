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
import { formatNumber } from '@/lib/format';
import { useBranches, useUpsertInventory } from '../hooks/use-branches';
import type { BranchStock } from '../types';

interface StockEditorProps {
  variantId: string;
  rows: BranchStock[];
}

/**
 * Per-branch stock table for a variant. Only `quantity` is editable — `reserved`
 * is BE-managed (reserve→commit) and `available` is derived by the BE.
 */
export function StockEditor({ variantId, rows }: StockEditorProps) {
  const { data: branches } = useBranches();
  const upsert = useUpsertInventory();
  const [drafts, setDrafts] = useState<Record<string, string>>({});

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
          {rows.map((row) => {
            const draft = drafts[row.branchId] ?? String(row.quantity);
            const changed = draft !== String(row.quantity);
            return (
              <TableRow key={row.branchId} className="hover:bg-transparent">
                <TableCell className="font-medium">
                  {branchName(row.branchId)}
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
                      onChange={(e) =>
                        setDrafts((d) => ({ ...d, [row.branchId]: e.target.value }))
                      }
                    />
                    <Button
                      size="icon"
                      variant="outline"
                      className="size-8"
                      disabled={!changed || upsert.isPending}
                      aria-label="Lưu tồn kho"
                      onClick={() =>
                        upsert.mutate({
                          branchId: row.branchId,
                          variantId,
                          quantity: Math.max(0, Number(draft) || 0),
                          status: row.status,
                        })
                      }
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
