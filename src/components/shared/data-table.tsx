import { type ReactNode } from 'react';
import { ArrowDown, ArrowUp, ChevronsUpDown } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { EmptyState } from './empty-state';
import { ErrorState } from './error-state';

export type SortDirection = 'ASC' | 'DESC';

export interface ColumnDef<TRow> {
  /** Stable key; also used as the server sort field when `sortable`. */
  id: string;
  header: ReactNode;
  cell: (row: TRow) => ReactNode;
  sortable?: boolean;
  className?: string;
  headerClassName?: string;
}

export interface DataTableSort {
  field: string;
  direction: SortDirection;
}

interface DataTableProps<TRow> {
  columns: ColumnDef<TRow>[];
  data: TRow[] | undefined;
  rowKey: (row: TRow) => string;
  isLoading?: boolean;
  isError?: boolean;
  error?: unknown;
  onRetry?: () => void;
  onRowClick?: (row: TRow) => void;
  /** Server-side sorting state (controlled). */
  sort?: DataTableSort;
  onSortChange?: (sort: DataTableSort) => void;
  emptyTitle?: string;
  emptyDescription?: string;
  /** Skeleton row count while loading. */
  skeletonRows?: number;
}

/**
 * Generic, server-driven table: handles loading (skeleton), error and empty
 * states internally so feature pages stay declarative. Sorting is controlled
 * by the parent (server-side).
 */
export function DataTable<TRow>({
  columns,
  data,
  rowKey,
  isLoading,
  isError,
  error,
  onRetry,
  onRowClick,
  sort,
  onSortChange,
  emptyTitle = 'Không có dữ liệu',
  emptyDescription,
  skeletonRows = 8,
}: DataTableProps<TRow>) {
  const handleSort = (col: ColumnDef<TRow>) => {
    if (!col.sortable || !onSortChange) return;
    const nextDir: SortDirection =
      sort?.field === col.id && sort.direction === 'ASC' ? 'DESC' : 'ASC';
    onSortChange({ field: col.id, direction: nextDir });
  };

  if (isError) {
    return <ErrorState error={error} onRetry={onRetry} />;
  }

  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            {columns.map((col) => {
              const isSorted = sort?.field === col.id;
              return (
                <TableHead
                  key={col.id}
                  className={cn(
                    col.sortable && 'cursor-pointer select-none',
                    col.headerClassName,
                  )}
                  onClick={() => handleSort(col)}
                >
                  <span className="inline-flex items-center gap-1">
                    {col.header}
                    {col.sortable &&
                      (isSorted ? (
                        sort.direction === 'ASC' ? (
                          <ArrowUp className="size-3.5" />
                        ) : (
                          <ArrowDown className="size-3.5" />
                        )
                      ) : (
                        <ChevronsUpDown className="size-3.5 opacity-40" />
                      ))}
                  </span>
                </TableHead>
              );
            })}
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            Array.from({ length: skeletonRows }).map((_, i) => (
              <TableRow key={`sk-${i}`} className="hover:bg-transparent">
                {columns.map((col) => (
                  <TableCell key={col.id} className={col.className}>
                    <Skeleton className="h-4 w-full max-w-[160px]" />
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : !data || data.length === 0 ? (
            <TableRow className="hover:bg-transparent">
              <TableCell colSpan={columns.length} className="h-48">
                <EmptyState title={emptyTitle} description={emptyDescription} />
              </TableCell>
            </TableRow>
          ) : (
            data.map((row) => (
              <TableRow
                key={rowKey(row)}
                className={cn(onRowClick && 'cursor-pointer')}
                onClick={() => onRowClick?.(row)}
              >
                {columns.map((col) => (
                  <TableCell key={col.id} className={col.className}>
                    {col.cell(row)}
                  </TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
