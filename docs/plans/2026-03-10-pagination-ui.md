# Client-Side Pagination UI — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add paginated display with page-size selector to both Nodes and VMs table pages using the DS `Pagination` component.

**Architecture:** Both tables already fetch all data and filter client-side. Pagination is the final step in the pipeline: `allData → search → advancedFilters → statusFilter → sort → paginate → Table`. A shared `usePagination` hook owns page/pageSize state and exposes a slice helper. A `TablePagination` wrapper composes the DS `Pagination` with a page-size dropdown and a "Showing X–Y of Z" label. Changing any filter resets to page 1.

**Tech Stack:** React, `@aleph-front/ds/pagination` (0.6.0), Tailwind CSS

---

### Task 1: Create `usePagination` hook

**Files:**
- Create: `src/hooks/use-pagination.ts`
- Create: `src/hooks/use-pagination.test.ts`

- [ ] **Step 1: Write the test**

```ts
// src/hooks/use-pagination.test.ts
import { renderHook, act } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { usePagination } from "@/hooks/use-pagination";

describe("usePagination", () => {
  const items = Array.from({ length: 120 }, (_, i) => i);

  it("returns first page of items with default pageSize", () => {
    const { result } = renderHook(() => usePagination(items));
    expect(result.current.page).toBe(1);
    expect(result.current.pageSize).toBe(50);
    expect(result.current.totalPages).toBe(3);
    expect(result.current.pageItems).toEqual(items.slice(0, 50));
    expect(result.current.startItem).toBe(1);
    expect(result.current.endItem).toBe(50);
    expect(result.current.totalItems).toBe(120);
  });

  it("navigates to page 2", () => {
    const { result } = renderHook(() => usePagination(items));
    act(() => result.current.setPage(2));
    expect(result.current.page).toBe(2);
    expect(result.current.pageItems).toEqual(items.slice(50, 100));
    expect(result.current.startItem).toBe(51);
    expect(result.current.endItem).toBe(100);
  });

  it("last page has correct partial slice", () => {
    const { result } = renderHook(() => usePagination(items));
    act(() => result.current.setPage(3));
    expect(result.current.pageItems).toEqual(items.slice(100, 120));
    expect(result.current.endItem).toBe(120);
  });

  it("changes page size and resets to page 1", () => {
    const { result } = renderHook(() => usePagination(items));
    act(() => result.current.setPage(2));
    act(() => result.current.setPageSize(25));
    expect(result.current.page).toBe(1);
    expect(result.current.pageSize).toBe(25);
    expect(result.current.totalPages).toBe(5);
    expect(result.current.pageItems).toEqual(items.slice(0, 25));
  });

  it("clamps page when items shrink", () => {
    const { result, rerender } = renderHook(
      ({ data }) => usePagination(data),
      { initialProps: { data: items } },
    );
    act(() => result.current.setPage(3));
    expect(result.current.page).toBe(3);
    // Shrink to 60 items — page 3 no longer exists
    rerender({ data: items.slice(0, 60) });
    expect(result.current.page).toBe(2);
    expect(result.current.totalPages).toBe(2);
  });

  it("returns all items when total <= pageSize", () => {
    const small = items.slice(0, 10);
    const { result } = renderHook(() => usePagination(small));
    expect(result.current.totalPages).toBe(1);
    expect(result.current.pageItems).toEqual(small);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test -- src/hooks/use-pagination.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Write the hook**

```ts
// src/hooks/use-pagination.ts
import { useState, useMemo } from "react";

const DEFAULT_PAGE_SIZE = 50;
const PAGE_SIZE_OPTIONS = [25, 50, 100] as const;

type UsePaginationResult<T> = {
  page: number;
  pageSize: number;
  totalPages: number;
  totalItems: number;
  startItem: number;
  endItem: number;
  pageItems: T[];
  setPage: (page: number) => void;
  setPageSize: (size: number) => void;
  pageSizeOptions: readonly number[];
};

export function usePagination<T>(
  items: T[],
  initialPageSize = DEFAULT_PAGE_SIZE,
): UsePaginationResult<T> {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSizeRaw] = useState(initialPageSize);

  const totalItems = items.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  // Clamp page if items shrink
  const clampedPage = Math.min(page, totalPages);
  if (clampedPage !== page) {
    setPage(clampedPage);
  }

  const pageItems = useMemo(() => {
    const start = (clampedPage - 1) * pageSize;
    return items.slice(start, start + pageSize);
  }, [items, clampedPage, pageSize]);

  const startItem =
    totalItems === 0 ? 0 : (clampedPage - 1) * pageSize + 1;
  const endItem = Math.min(clampedPage * pageSize, totalItems);

  function setPageSize(size: number) {
    setPageSizeRaw(size);
    setPage(1);
  }

  return {
    page: clampedPage,
    pageSize,
    totalPages,
    totalItems,
    startItem,
    endItem,
    pageItems,
    setPage,
    setPageSize,
    pageSizeOptions: PAGE_SIZE_OPTIONS,
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test -- src/hooks/use-pagination.test.ts`
Expected: all 6 tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/hooks/use-pagination.ts src/hooks/use-pagination.test.ts
git commit -m "feat: add usePagination hook with tests"
```

---

### Task 2: Create `TablePagination` component

**Files:**
- Create: `src/components/table-pagination.tsx`

- [ ] **Step 1: Create the component**

Composes DS `Pagination` + page-size dropdown + "Showing X–Y of Z" label.

```tsx
// src/components/table-pagination.tsx
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
```

- [ ] **Step 2: Verify it compiles**

Run: `pnpm typecheck`
Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add src/components/table-pagination.tsx
git commit -m "feat: add TablePagination component"
```

---

### Task 3: Wire pagination into `NodeTable`

**Files:**
- Modify: `src/components/node-table.tsx`

- [ ] **Step 1: Add imports and hook**

At the top of `node-table.tsx`, add:

```ts
import { usePagination } from "@/hooks/use-pagination";
import { TablePagination } from "@/components/table-pagination";
```

Inside `NodeTable`, after the `sortedRows` computation (~line 269), add:

```ts
const {
  page, pageSize, totalPages, startItem, endItem,
  totalItems, pageItems, setPage, setPageSize, pageSizeOptions,
} = usePagination(sortedRows);
```

- [ ] **Step 2: Reset page on filter changes**

Add a `useEffect` that resets the page when filters change. Add `useEffect` to the React import, then add after the `usePagination` call:

```ts
useEffect(() => {
  setPage(1);
}, [debouncedQuery, advanced, statusFilter, setPage]);
```

Note: `setPage` is stable (from `useState`), so it's safe in deps.

- [ ] **Step 3: Use pageItems for the table and add pagination bar**

Change the `<Table>` `data` prop from `sortedRows` to `pageItems`:

```tsx
<Table
  columns={columns}
  data={pageItems}
  keyExtractor={(r) => r.hash}
  onRowClick={(r) => onSelectNode(r.hash)}
  activeKey={selectedKey}
/>

<TablePagination
  page={page}
  totalPages={totalPages}
  pageSize={pageSize}
  startItem={startItem}
  endItem={endItem}
  totalItems={totalItems}
  pageSizeOptions={pageSizeOptions}
  onPageChange={setPage}
  onPageSizeChange={setPageSize}
/>
```

- [ ] **Step 4: Verify it compiles and lint passes**

Run: `pnpm check`
Expected: all pass

- [ ] **Step 5: Commit**

```bash
git add src/components/node-table.tsx
git commit -m "feat: add pagination to nodes table"
```

---

### Task 4: Wire pagination into `VMTable`

**Files:**
- Modify: `src/components/vm-table.tsx`

- [ ] **Step 1: Add imports and hook**

At the top of `vm-table.tsx`, add:

```ts
import { usePagination } from "@/hooks/use-pagination";
import { TablePagination } from "@/components/table-pagination";
```

Inside `VMTable`, after the `displayedRows` computation, add:

```ts
const {
  page, pageSize, totalPages, startItem, endItem,
  totalItems, pageItems, setPage, setPageSize, pageSizeOptions,
} = usePagination(displayedRows);
```

- [ ] **Step 2: Reset page on filter changes**

Add `useEffect` to the React import, then add after the `usePagination` call:

```ts
useEffect(() => {
  setPage(1);
}, [debouncedQuery, advanced, statusFilter, setPage]);
```

- [ ] **Step 3: Use pageItems for the table and add pagination bar**

Change the `<Table>` `data` prop from `displayedRows` to `pageItems`:

```tsx
<Table
  columns={buildColumns(messageInfo)}
  data={pageItems}
  keyExtractor={(r) => r.hash}
  onRowClick={(r) => onSelectVM(r.hash)}
  activeKey={selectedKey}
/>

<TablePagination
  page={page}
  totalPages={totalPages}
  pageSize={pageSize}
  startItem={startItem}
  endItem={endItem}
  totalItems={totalItems}
  pageSizeOptions={pageSizeOptions}
  onPageChange={setPage}
  onPageSizeChange={setPageSize}
/>
```

- [ ] **Step 4: Verify it compiles and lint passes**

Run: `pnpm check`
Expected: all pass

- [ ] **Step 5: Commit**

```bash
git add src/components/vm-table.tsx
git commit -m "feat: add pagination to VMs table"
```

---

### Task 5: Update docs

- [ ] ARCHITECTURE.md — add pagination pattern (usePagination hook, TablePagination component, pipeline position)
- [ ] DECISIONS.md — log decision: client-side pagination with DS Pagination, page-size dropdown, in-memory state
- [ ] BACKLOG.md — move "Pagination UI for large datasets" to Completed
- [ ] CLAUDE.md — update Current Features list to mention table pagination
