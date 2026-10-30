"use client";

import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
  type OnChangeFn,
  type SortingState,
} from "@tanstack/react-table";
import { ArrowDown, ArrowUp, ChevronLeft, ChevronRight } from "lucide-react";

import { EmptyState, ErrorState, LoadingRows } from "@/components/states";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";

declare module "@tanstack/react-table" {
  // Per-column classes, e.g. `meta: { className: "hidden lg:table-cell" }` to drop a column on phones.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface ColumnMeta<TData, TValue> {
    className?: string;
    headerClassName?: string;
  }
}

/**
 * Server-driven table: sorting and paging are done by the API, so it works the same for 50 rows or 5 million.
 * Pass `sorting` + `onSortingChange` to enable sortable headers (columns with `enableSorting: true`).
 */
export function DataTable<T>({
  columns,
  data,
  total,
  page,
  pageSize,
  onPageChange,
  sorting,
  onSortingChange,
  onRowClick,
  isLoading,
  error,
  onRetry,
  emptyTitle = "Nothing here yet",
  emptyDescription,
  bare,
}: {
  columns: ColumnDef<T, any>[]; // eslint-disable-line @typescript-eslint/no-explicit-any
  data: T[] | undefined;
  total?: number;
  page?: number;
  pageSize?: number;
  onPageChange?: (page: number) => void;
  sorting?: SortingState;
  onSortingChange?: OnChangeFn<SortingState>;
  onRowClick?: (row: T) => void;
  isLoading?: boolean;
  error?: Error | null;
  onRetry?: () => void;
  emptyTitle?: string;
  emptyDescription?: string;
  /** Drop the outer border when the table already sits inside a Panel. */
  bare?: boolean;
}) {
  "use no memo"; // TanStack Table v8 is not React Compiler safe
  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data: data ?? [],
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualSorting: true,
    manualPagination: true,
    enableSortingRemoval: false,
    state: { sorting: sorting ?? [] },
    onSortingChange,
  });

  if (error) return <ErrorState error={error} onRetry={onRetry} />;
  if (isLoading && !data) return <LoadingRows />;

  const pages = total && pageSize ? Math.max(1, Math.ceil(total / pageSize)) : 1;

  return (
    <div className="space-y-3">
      <div className={cn(!bare && "bg-card shadow-card overflow-hidden rounded-2xl border")}>
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id}>
                {hg.headers.map((h) => {
                  const sort = h.column.getIsSorted();
                  const canSort = h.column.getCanSort() && !!onSortingChange;
                  return (
                    <TableHead
                      key={h.id}
                      style={{ width: h.column.columnDef.size }}
                      className={cn(h.column.columnDef.meta?.className, h.column.columnDef.meta?.headerClassName)}
                    >
                      {canSort ? (
                        <button
                          className="hover:text-foreground inline-flex items-center gap-1"
                          onClick={h.column.getToggleSortingHandler()}
                        >
                          {flexRender(h.column.columnDef.header, h.getContext())}
                          {sort === "asc" && <ArrowUp className="size-3" />}
                          {sort === "desc" && <ArrowDown className="size-3" />}
                        </button>
                      ) : (
                        flexRender(h.column.columnDef.header, h.getContext())
                      )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody className={cn(isLoading && "opacity-60")}>
            {table.getRowModel().rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length}>
                  <EmptyState title={emptyTitle} description={emptyDescription} />
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  onClick={onRowClick ? () => onRowClick(row.original) : undefined}
                  className={cn(onRowClick && "cursor-pointer")}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className={cell.column.columnDef.meta?.className}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {onPageChange && page !== undefined && total !== undefined && (
        <div className="text-muted-foreground flex items-center justify-between text-sm">
          <span>
            {total === 0
              ? "0 results"
              : `${page * pageSize! + 1}–${Math.min(total, (page + 1) * pageSize!)} of ${total}`}
          </span>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="icon-sm" disabled={page === 0} onClick={() => onPageChange(page - 1)}>
              <ChevronLeft />
            </Button>
            <Button
              variant="outline"
              size="icon-sm"
              disabled={page + 1 >= pages}
              onClick={() => onPageChange(page + 1)}
            >
              <ChevronRight />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
