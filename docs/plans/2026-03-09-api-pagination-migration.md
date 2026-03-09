# API v1 Pagination Migration

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix the dashboard to handle the new paginated v1 API responses from the Rust scheduler server.

**Architecture:** The new server's v1 wraps list responses in `{"items": [...], "pagination": {...}}` with max page_size=200. Add a `fetchAllPages()` helper that fetches all pages in parallel and returns the full array. Detail endpoints (single node/VM) are unchanged. History endpoints are also paginated.

**Tech Stack:** Next.js, TypeScript, React Query

---

## Context

Olivier deployed a new Rust scheduler server. Probing the live server revealed:
- `/api/v0/` = old Python format (different field names: `node_id`, `url`) — NOT compatible with our dashboard
- `/api/v1/` = our expected schema (`node_hash`, `address`) but now **paginated**
- The API reference doc (`~/Downloads/api-reference.md`) had incorrect URL paths — it showed v0 paths but described v1's schema
- Our `unwrapArray()` is broken — returns `[]` because response has 2 keys (`items` + `pagination`), not 1
- **The dashboard is currently broken** — all list pages show empty

**v1 pagination response format:**
```json
{
  "items": [...],
  "pagination": { "page": 1, "page_size": 200, "total_items": 543, "total_pages": 3 }
}
```

**Live server data (as of 2026-03-09):**
- 543 nodes (3 pages at 200/page)
- 462 VMs (3 pages at 200/page)
- `page_size` param accepted, capped at 200
- `/health` endpoint returns `{"status": "ok"}`

**What stayed the same:** VmType (lowercase: `"instance"`, `"microvm"`, `"persistent_program"`), NodeStatus (PascalCase: `"Healthy"`, `"Unreachable"`), all existing field names, detail endpoint shapes (bare objects), `/api/v1/` path prefix.

**New fields we can safely ignore for now** (TypeScript won't complain — extra fields in JSON are harmless):
- Nodes: `confidential_computing_enabled`, `cpu_architecture`, `cpu_vendor`, `cpu_features`, `gpus: {used: [], available: []}`
- VMs: `requires_confidential`, `gpu_requirements`, `cpu_architecture`, `cpu_vendor`, `cpu_features`

**Current API client structure (all in `src/api/client.ts`):**
- `getBaseUrl()` — reads `?api=` URL param or `NEXT_PUBLIC_API_URL` env var, defaults to `http://localhost:8081`
- `fetchApi<T>(path)` — generic fetch wrapper with error handling
- `unwrapArray<T>(data)` — **BROKEN** — handles `T[] | Record<string, T[]>`, returns `[]` when response has 2+ keys
- `transformNode/Vm/History()` — snake_case → camelCase converters
- `getNodes(filters?)`, `getVMs(filters?)`, `getNode(hash)`, `getVM(hash)`, `getOverviewStats()` — public API functions

---

## Task 1: Create branch, add pagination types and helper

**Files:**
- Modify: `src/api/types.ts` (add after `ApiStats` type, ~line 173)
- Modify: `src/api/client.ts` (replace `unwrapArray`, update 5 public functions)

**Step 1: Create feature branch**

```bash
git checkout main && git pull --ff-only origin main
git checkout -b fix/api-pagination
```

**Step 2: Add pagination types to types.ts**

Add after the `ApiStats` type (line ~173):

```ts
export type PaginationInfo = {
  page: number;
  page_size: number;
  total_items: number;
  total_pages: number;
};

export type PaginatedResponse<T> = {
  items: T[];
  pagination: PaginationInfo;
};
```

**Step 3: Add `fetchAllPages()` to client.ts**

Replace the `unwrapArray()` function (lines 44-52) with:

```ts
const MAX_PAGE_SIZE = 200;

async function fetchAllPages<T>(path: string): Promise<T[]> {
  const separator = path.includes("?") ? "&" : "?";
  const firstPage = await fetchApi<PaginatedResponse<T>>(
    `${path}${separator}page=1&page_size=${MAX_PAGE_SIZE}`,
  );
  if (firstPage.pagination.total_pages <= 1) {
    return firstPage.items;
  }
  const remaining = Array.from(
    { length: firstPage.pagination.total_pages - 1 },
    (_, i) =>
      fetchApi<PaginatedResponse<T>>(
        `${path}${separator}page=${i + 2}&page_size=${MAX_PAGE_SIZE}`,
      ),
  );
  const pages = await Promise.all(remaining);
  return [firstPage, ...pages].flatMap((p) => p.items);
}
```

Add `PaginatedResponse` to the imports from `@/api/types`.

**Step 4: Update all list-fetching functions**

`getNodes()` — replace `unwrapArray` with `fetchAllPages`:
```ts
export async function getNodes(filters?: NodeFilters): Promise<Node[]> {
  const raw = await fetchAllPages<ApiNodeRow>("/api/v1/nodes");
  const nodes = raw.map(transformNode);
  return applyNodeFilters(nodes, filters);
}
```

`getVMs()` — replace `unwrapArray` with `fetchAllPages`:
```ts
export async function getVMs(filters?: VmFilters): Promise<VM[]> {
  const params = new URLSearchParams();
  if (filters?.status) params.set("status", filters.status);
  if (filters?.node) params.set("node", filters.node);
  const qs = params.toString();
  const raw = await fetchAllPages<ApiVmRow>(
    `/api/v1/vms${qs ? `?${qs}` : ""}`,
  );
  return raw.map(transformVm);
}
```

`getNode()` — detail fetch stays as `fetchApi` (bare object), VMs and history use `fetchAllPages`:
```ts
export async function getNode(hash: string): Promise<NodeDetail> {
  const [rawNode, rawVms, rawHistory] = await Promise.all([
    fetchApi<ApiNodeRow>(`/api/v1/nodes/${hash}`),
    fetchAllPages<ApiVmRow>(`/api/v1/vms?node=${hash}`),
    fetchAllPages<ApiHistoryRow>(`/api/v1/nodes/${hash}/history`),
  ]);
  return {
    ...transformNode(rawNode),
    vms: rawVms.map(transformVm),
    history: rawHistory.map(transformHistory),
  };
}
```

`getVM()` — detail stays as `fetchApi`, history uses `fetchAllPages`:
```ts
export async function getVM(hash: string): Promise<VmDetail> {
  const [rawVm, rawHistory] = await Promise.all([
    fetchApi<ApiVmRow>(`/api/v1/vms/${hash}`),
    fetchAllPages<ApiHistoryRow>(`/api/v1/vms/${hash}/history`),
  ]);
  return {
    ...transformVm(rawVm),
    history: rawHistory.map(transformHistory),
  };
}
```

`getOverviewStats()` — replace `unwrapArray` with `fetchAllPages`:
```ts
export async function getOverviewStats(): Promise<OverviewStats> {
  const [stats, rawVms, rawNodes] = await Promise.all([
    fetchApi<ApiStats>("/api/v1/stats"),
    fetchAllPages<ApiVmRow>("/api/v1/vms"),
    fetchAllPages<ApiNodeRow>("/api/v1/nodes"),
  ]);
  const nodes = rawNodes.map(transformNode);
  const vms = rawVms.map(transformVm);
  return {
    totalNodes: stats.total_nodes,
    healthyNodes: stats.healthy_nodes,
    unreachableNodes: nodes.filter((n) => n.status === "unreachable").length,
    unknownNodes: nodes.filter((n) => n.status === "unknown").length,
    removedNodes: nodes.filter((n) => n.status === "removed").length,
    totalVMs: vms.length,
    scheduledVMs: vms.filter((v) => v.status === "scheduled").length,
    orphanedVMs: vms.filter((v) => v.status === "orphaned").length,
    missingVMs: vms.filter((v) => v.status === "missing").length,
    unschedulableVMs: vms.filter((v) => v.status === "unschedulable").length,
    totalVcpusAllocated: stats.total_vcpus_allocated,
    totalVcpusCapacity: stats.total_vcpus_capacity,
  };
}
```

**Step 5: Run checks**

```bash
pnpm check
```

**Step 6: Commit**

```bash
git add src/api/types.ts src/api/client.ts
git commit -m "fix: handle paginated v1 API responses"
```

---

## Task 2: Update status page

**Files:**
- Modify: `src/app/status/page.tsx`

The status page has its own URL construction and response handling. Two changes needed:
1. Fix `unwrapFirstHash()` to handle `{"items": [...]}` response shape
2. Add `/health` endpoint check (root-level, not under `/api/v1/`)

**Step 1: Fix `unwrapFirstHash` to handle `{"items": [...]}`**

Replace the current `unwrapFirstHash()` function (lines 58-80) with:

```ts
function unwrapFirstHash(
  data: unknown,
  key: "nodes" | "vms",
): string | null {
  const hashField = key === "nodes" ? "node_hash" : "vm_hash";
  let arr: unknown[];
  if (Array.isArray(data)) {
    arr = data;
  } else if (data && typeof data === "object") {
    const obj = data as Record<string, unknown>;
    if ("items" in obj && Array.isArray(obj["items"])) {
      arr = obj["items"];
    } else if (key in obj) {
      arr = (obj as Record<string, unknown[]>)[key]!;
    } else {
      return null;
    }
  } else {
    return null;
  }
  const first = arr[0];
  if (first && typeof first === "object" && hashField in first) {
    return (first as Record<string, string>)[hashField]!;
  }
  return null;
}
```

**Step 2: Add `/health` endpoint check**

The `/health` endpoint is at root level (not under `API_PREFIX`). Add it as a standalone check at the top of the `runChecks()` callback, before the ENDPOINTS loop.

Inside `runChecks()`, after `const newResults: EndpointStatus[] = [];`:

```ts
// Health check (root-level, not under API_PREFIX)
let healthResult: EndpointStatus;
try {
  const res = await fetch(`${baseUrl}/health`);
  healthResult = {
    path: "/health",
    label: "Health",
    status: res.ok ? "healthy" : "error",
    httpCode: res.status,
  };
} catch {
  healthResult = {
    path: "/health",
    label: "Health",
    status: "error",
    httpCode: null,
  };
}
```

After all other checks complete, prepend `healthResult` to `newResults`:
```ts
setResults([healthResult, ...newResults]);
```

Also update the initial `useState` to include the health entry:
```ts
const [results, setResults] = useState<EndpointStatus[]>([
  { path: "/health", label: "Health", status: "pending", httpCode: null },
  ...ENDPOINTS.map((e) => ({
    path: `${API_PREFIX}${e.path}`,
    label: e.label,
    status: "pending" as const,
    httpCode: null,
  })),
]);
```

**Step 3: Run checks and commit**

```bash
pnpm check
git add src/app/status/page.tsx
git commit -m "fix: update status page for paginated responses and add /health"
```

---

## Task 3: Update integration tests

**Files:**
- Modify: `src/api/client.test.ts`

**Step 1: Update the `unwrap()` helper**

Replace the test file's `unwrap()` function (lines 22-29) with:

```ts
function unwrap<T>(data: T[] | Record<string, T[]>): T[] {
  if (Array.isArray(data)) return data;
  if ("items" in data && Array.isArray(data["items"])) {
    return data["items"] as T[];
  }
  const values = Object.values(data);
  if (values.length === 1 && Array.isArray(values[0])) {
    return values[0];
  }
  return [];
}
```

**Step 2: Add `/health` test**

Add as the first test in the describe block:

```ts
it("GET /health is reachable", async () => {
  const res = await apiFetch("/health");
  expect(res.ok, `/health returned ${res.status}`).toBe(true);
  const data = await res.json();
  expect(data).toMatchObject({ status: "ok" });
});
```

**Step 3: Run checks and commit**

```bash
pnpm check
git add src/api/client.test.ts
git commit -m "test: update integration tests for paginated responses"
```

---

## Task 4: Verify end-to-end

**Step 1: Run integration tests against live API**

```bash
RUN_API_TESTS=true pnpm test src/api/client.test.ts
```

**Step 2: Manual browser verification**

Run `pnpm dev` and check:
- Overview page: stat cards show correct numbers (compare: `curl -s https://rust-scheduler.aleph.im/api/v1/stats`)
- Nodes page: shows all ~543 nodes (not just 50 or 200), search works, filters work
- VMs page: shows all ~462 VMs (not just 50 or 200), search works, VM type filter works
- Node detail: side panel shows VMs and history
- VM detail: side panel shows allocated node name, history
- Status page: all endpoints healthy (green), including `/health`

**Step 3: Push**

```bash
git push -u origin fix/api-pagination
```

---

## Task 5: Update docs

**Files:**
- Modify: `docs/ARCHITECTURE.md` — update API client section to mention `fetchAllPages()` and paginated responses
- Modify: `docs/DECISIONS.md` — add decision for pagination handling
- Modify: `docs/BACKLOG.md` — add pagination UI and new fields items
- Modify: `CLAUDE.md` — update Current Features API description
- Modify: `docs/plans/api-v0-migration-analysis.md` — add Resolution section

**Step 1: Update all docs**

DECISIONS.md entry:
```
## Decision #N - 2026-03-09
**Context:** New Rust scheduler v1 API now returns paginated responses (max 200 items/page). v0 is incompatible (different schema with `node_id`/`url` instead of `node_hash`/`address`). API reference doc had incorrect paths (showed v0 paths with v1 schema).
**Decision:** Stay on /api/v1/, add fetchAllPages() helper to fetch all pages in parallel and return full arrays.
**Rationale:** Minimal change to existing code — list consumers still get full arrays. Detail endpoints unchanged. Avoids rewriting all components for pagination UI. fetchAllPages makes at most 3 parallel requests for current data sizes.
**Alternatives considered:** Switch to v0 (incompatible schema), implement proper pagination UI (deferred — much larger scope), request Olivier to increase page_size cap (fragile)
```

BACKLOG.md items:
```
### 2026-03-09 - Pagination UI for large datasets
**Source:** API pagination migration (fix/api-pagination)
**Description:** Currently fetching all pages to return full arrays. For scalability, implement proper pagination UI (page controls or infinite scroll) so we don't fetch all 500+ nodes/VMs every time. Also add server-side search once Olivier adds those query params to v1.
**Priority:** Medium

### 2026-03-09 - Surface new API fields (GPU, confidential, CPU)
**Source:** API pagination migration (fix/api-pagination)
**Description:** New server provides: nodes — confidential_computing_enabled, cpu_architecture, cpu_vendor, cpu_features, gpus {used, available}; VMs — requires_confidential, gpu_requirements, cpu_architecture, cpu_vendor, cpu_features. Add columns/filters/detail fields for these.
**Priority:** Low
```

api-v0-migration-analysis.md: Add a "Resolution" section at the top:
```
> **Resolution (2026-03-09):** The original analysis assumed v0 would have our expected schema. Probing the live server revealed v0 uses the old Python schema (different field names). We stayed on v1 and handled pagination instead. See `docs/plans/2026-03-09-api-pagination-migration.md`.
```

**Step 2: Commit and finish branch**

```bash
pnpm check
git add -A
git commit -m "docs: update for v1 pagination migration"
```

Then finish branch per CLAUDE.md workflow:
1. `git push` (if not already pushed)
2. `gh pr create --title "fix: handle paginated v1 API responses (#N)" --body "..."`
3. `gh pr merge --squash --delete-branch`
4. `git checkout main && git pull --ff-only origin main`
5. `git branch -D fix/api-pagination`

---

## Key files

| File | Change |
|------|--------|
| `src/api/types.ts` | Add `PaginationInfo`, `PaginatedResponse<T>` |
| `src/api/client.ts` | Replace `unwrapArray()` with `fetchAllPages()`, update all 5 public functions |
| `src/app/status/page.tsx` | Fix `unwrapFirstHash`, add `/health` check |
| `src/api/client.test.ts` | Fix `unwrap()`, add `/health` test |
| `docs/ARCHITECTURE.md` | Update API client section |
| `docs/DECISIONS.md` | Log pagination decision |
| `docs/BACKLOG.md` | Add pagination UI + new fields items |
| `CLAUDE.md` | Update Current Features |
| `docs/plans/api-v0-migration-analysis.md` | Add resolution note |

## What does NOT change

- **No hook changes** — they call client functions, pagination is encapsulated
- **No component changes** — they still receive full arrays from hooks
- **No public type changes** (Node, VM, HistoryRow, etc.) — new API fields are ignored
- **VmType stays lowercase**, NodeStatus stays PascalCase — no transforms needed
- **API paths stay `/api/v1/`** — no path change needed
- **Aleph Message API** (`api2.aleph.im`) — completely unaffected
