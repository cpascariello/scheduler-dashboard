"use client";

import { Pagination } from "@aleph-front/ds/pagination";

type TablePaginationProps = {
  page: number;
  totalPages: number;
  pageSize: number;
  startItem: number;
  endItem: number;
  totalItems: number;
  pageSizeOptions: readonly number[];
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
};

export function TablePagination({
  page,
  totalPages,
  pageSize,
  startItem,
  endItem,
  totalItems,
  pageSizeOptions,
  onPageChange,
  onPageSizeChange,
}: TablePaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 pt-4">
      <span className="text-sm text-muted-foreground tabular-nums">
        Showing {startItem}–{endItem} of {totalItems}
      </span>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <label
            htmlFor="page-size"
            className="text-xs text-muted-foreground"
          >
            Rows
          </label>
          <select
            id="page-size"
            value={pageSize}
            onChange={(e) =>
              onPageSizeChange(Number(e.target.value))
            }
            className="h-8 rounded-full border border-white/10 bg-white/5 px-2.5 text-xs text-foreground tabular-nums focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            {pageSizeOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>
        <Pagination
          page={page}
          totalPages={totalPages}
          onPageChange={onPageChange}
        />
      </div>
    </div>
  );
}
