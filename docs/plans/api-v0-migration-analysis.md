# API Migration Analysis: v1 → v0

> **Resolution (2026-03-09):** The original analysis assumed v0 would have our expected schema. Probing the live server revealed v0 uses the old Python schema (different field names). We stayed on v1 and handled pagination instead. See `docs/plans/2026-03-09-api-pagination-migration.md`.

**Date:** 2026-03-07
**Context:** Olivier shared the new scheduler API reference (`api-reference.md`). This document compares the new API against the current dashboard implementation and identifies all changes needed.

---

## 1. Endpoint Path Change: `/api/v1/` → `/api/v0/`

**Impact: Low**

Every API call in the dashboard currently targets `/api/v1/`. All paths need updating:

| Current | New |
|---|---|
| `/api/v1/nodes` | `/api/v0/nodes` |
| `/api/v1/nodes/{hash}` | `/api/v0/nodes/{node_hash}` |
| `/api/v1/nodes/{hash}/history` | `/api/v0/nodes/{node_hash}/history` |
| `/api/v1/vms` | `/api/v0/vms` |
| `/api/v1/vms/{hash}` | `/api/v0/vms/{vm_hash}` |
| `/api/v1/vms/{hash}/history` | `/api/v0/vms/{vm_hash}/history` |
| `/api/v1/stats` | `/api/v0/stats` |

This is a simple find-and-replace in `src/api/client.ts`. No type changes, no component changes.

---

## 2. Wire Types — Already Aligned

**Impact: None**

The field names, types, and nullability of `VmRow`, `NodeRow`, `HistoryRow`, and `Stats` in the new reference match our existing wire types (`ApiVmRow`, `ApiNodeRow`, `ApiHistoryRow`, `ApiStats`) exactly. No structural changes needed.

The one exception is `VmType` casing — covered in section 3.

---

## 3. VmType Casing Change

**Impact: Medium**

The new API returns PascalCase VM types, while the dashboard uses lowercase internally:

| Current (dashboard) | New API wire format |
|---|---|
| `"microvm"` | `"MicroVm"` |
| `"persistent_program"` | `"PersistentProgram"` |
| `"instance"` | `"Instance"` |

**Plan:** Add a `transformVmType()` function in the API client layer (like we already do for `NodeStatus` with `transformNodeStatus()`). This keeps the internal type convention stable and limits changes to one file. Every component that references `VmType` values continues working unchanged.

---

## 4. New `/health` Endpoint

**Impact: Low**

The new API adds `GET /health` → `{"status": "ok"}`. The dashboard's API status page currently checks all 7 scheduler endpoints individually. We can add this as a primary health check endpoint on that page.

---

## 5. `payment_receiver` on Nodes

**Impact: None (already handled)**

The new API includes `payment_receiver` on `NodeRow`. Our wire type `ApiNodeRow` already has this field, but it's intentionally dropped during transformation — we don't surface it in the UI. No change needed unless we want to display it later.

---

## 6. Response Wrapping (Arrays vs Objects)

**Impact: Low (potential simplification)**

The current live server wraps list responses in objects like `{"nodes": [...]}`, so the dashboard has an `unwrapArray()` helper to handle both bare arrays and wrapped objects. The new API reference documents bare arrays only.

If the new server returns bare arrays consistently, we can remove `unwrapArray()` and simplify all list-fetching code. We'll keep it as a safe fallback during the initial migration and remove it once confirmed.

---

## 7. Overview Stats — Redundant Triple-Fetch

**Impact: Currently fine, but blocks pagination**

The dashboard's `getOverviewStats()` function currently fetches three endpoints in parallel:

1. `GET /stats` — gives `total_vms`, `total_nodes`, `healthy_nodes`, `total_vcpus_allocated`, `total_vcpus_capacity`
2. `GET /vms` — fetches ALL VMs, counts by status client-side (scheduled, orphaned, missing, unschedulable)
3. `GET /nodes` — fetches ALL nodes, counts by status client-side (unreachable, unknown, removed)

This works today because list endpoints return everything. **Once pagination is added, this approach breaks** — we'd only get the first page, so the counts would be wrong.

**Suggestion:** Expand the `/stats` endpoint to include per-status breakdowns:

```json
{
  "total_vms": 45,
  "scheduled_vms": 38,
  "unscheduled_vms": 2,
  "unschedulable_vms": 3,
  "missing_vms": 1,
  "orphaned_vms": 1,
  "total_nodes": 8,
  "healthy_nodes": 7,
  "unreachable_nodes": 1,
  "unknown_nodes": 0,
  "removed_nodes": 0,
  "total_vcpus_allocated": 156,
  "total_vcpus_capacity": 384
}
```

This would let the dashboard get all overview numbers in a single request and removes the dependency on fetching full lists.

---

## 8. Features Mentioned But Not Yet in the Reference

Olivier mentioned several features in his message that don't appear in the API reference yet. Here's what each would require on the dashboard side:

### 8a. Pagination on List Endpoints

**Impact: High**

This is the biggest change. Currently the dashboard fetches all nodes/VMs in a single request and does all filtering, sorting, and searching client-side. Pagination would require:

- **API client:** Add page/cursor parameters to `getNodes()` and `getVMs()`, handle paginated response shape (total count, next cursor, etc.)
- **React Query hooks:** Switch from `useQuery` to `useInfiniteQuery` (for infinite scroll) or add page state management (for page-based navigation)
- **Components:** Add pagination controls (page numbers, next/prev, or infinite scroll trigger)
- **Stats endpoint:** Must provide per-status counts (see section 7) since we can't count by fetching all records
- **History endpoints:** If paginated, detail panels need to handle loading more history entries

### 8b. Server-Side Search (Name and Hash)

**Impact: Medium**

Currently, text search on the Nodes and VMs pages is done entirely client-side — a `useMemo` filter over the full list. Server-side search would:

- **Simplify components:** Remove client-side search filtering logic
- **Improve performance:** No need to hold all records in memory for filtering
- **API client:** Add `search` or `q` query parameter to list endpoints
- **Debounce:** Already have a `useDebounce` hook — would wire it to the API query params instead of in-memory filtering
- **Interaction with pagination:** Search results would come pre-paginated from the server

Note: VM names currently come from a separate API (`api2.aleph.im`), not from the scheduler. If the scheduler now has VM names, we might be able to drop the `api2.aleph.im` dependency for name lookup (see question below).

### 8c. GPU Fields

**Impact: Medium**

New fields on `NodeRow` and/or `VmRow` for GPU information. Would require:

- **Types:** New fields on wire types and public types
- **Node table:** New column(s) for GPU model/count
- **VM table:** New column for GPU requirements
- **Filters:** GPU-related filter options (has GPU, GPU model, etc.)
- **Stats:** Possibly new GPU utilization stats on overview page

### 8d. Confidential VM Fields

**Impact: Low-Medium**

Likely a boolean or enum field on `VmRow`. Would require:

- **Types:** New field on `ApiVmRow` and `VM`
- **UI:** Badge or indicator on VM rows/detail
- **Filters:** Checkbox filter for confidential VMs

---

## 9. Migration Plan

### Phase 1: Immediate (when new server is deployed)

These changes can be done in a single PR, low risk:

1. Change `/api/v1/` → `/api/v0/` in `client.ts`
2. Add `transformVmType()` for PascalCase → lowercase mapping
3. Add `/health` to the API status page
4. Test against new server, confirm array wrapping behavior
5. Verify all VM types render correctly (holder tier, PAYG, credits as Olivier mentioned)

### Phase 2: When new features land in the API

Each of these can be a separate PR:

6. **GPU + Confidential fields** — add new type fields, columns, and filters
7. **Server-side search** — replace client-side filtering with API query params
8. **Pagination** — requires expanded `/stats` endpoint first, then API client + hooks + UI controls

---

## Questions for Olivier

1. **Response wrapping:** Will list endpoints (`/vms`, `/nodes`, history) return bare arrays `[...]` or wrapped objects `{"vms": [...]}`? We handle both today, just want to know what to expect.

2. **Stats expansion:** Can `/stats` include per-status breakdowns (unreachable/unknown/removed nodes, scheduled/orphaned/missing/unschedulable VMs)? We currently fetch all VMs and all nodes just to count by status, and this will break once pagination lands.

3. **Pagination format:** What will the pagination parameters look like? Options:
   - Offset-based: `?page=2&per_page=50`
   - Cursor-based: `?cursor=abc123&limit=50`
   - What does the response look like? (total count, next cursor, etc.)

4. **Search parameters:** What will the search/filter query params be? Something like `?search=myvm` or `?name=myvm&hash=abc`?

5. **VM names:** Will the scheduler API include VM names directly (from the Aleph message metadata)? Currently we fetch names from `api2.aleph.im` as a separate call — if the scheduler provides names, we can drop that dependency.

6. **GPU fields:** What are the field names and types? On nodes only, VMs only, or both? (e.g., `gpu_model: string | null`, `gpu_count: number | null`, `requirements_gpu: boolean`)

7. **Confidential fields:** What's the field shape? A boolean `is_confidential` on VMs? On nodes (supports confidential)?

8. **VmType values:** The reference shows `"MicroVm" | "PersistentProgram" | "Instance"`. Are there new VM types coming (e.g., for PAYG, credits, holder tier)? Or are those payment types that use the existing `payment_type` field?

9. **New endpoint base URL:** Will the new version be on the same host (`rust-scheduler.aleph.im`) or a different one? Do we need to support running both versions in parallel during migration?
