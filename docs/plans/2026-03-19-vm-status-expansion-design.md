# VM Status Expansion — Design Spec

**Date:** 2026-03-19
**Branch:** `feature/vm-status-expansion`
**Context:** Olivier is deploying a scheduler update that splits the coarse `scheduled` status into precise observation-based statuses. This design covers all dashboard changes needed to support them.

## Background

The scheduler API is adding more precise VM statuses. Instead of just "scheduled" for any VM assigned to a node, the API now distinguishes based on where the VM is actually observed running.

### New Status Set (10 total)

| Status | Meaning | Severity |
|--------|---------|----------|
| `dispatched` | Running on the correct node | Healthy |
| `scheduled` | Assigned but not yet observed (never polled) | Neutral |
| `duplicated` | Running on correct node + extra copies elsewhere | Warning |
| `misplaced` | Running on wrong node(s), not on assigned node | Warning |
| `missing` | Should be running but not found anywhere | Error |
| `orphaned` | Running somewhere but no active scheduling intent | Warning |
| `unscheduled` | Deliberately unscheduled, not running | Neutral |
| `unschedulable` | Can't be scheduled, not running | Error |
| `unknown` | No decision made, not running | Neutral |
| `migrating` (future) | Actively moving between nodes | Info |

### Breaking API Changes

- `scheduled` now means never-polled only (confirmed running = `dispatched`)
- `misplaced` split out from `orphaned`
- Observed unscheduled/unschedulable VMs are now `orphaned`
- New `?scheduling_status=` filter for raw intent (backlogged for UI, not in this feature)

### Semantic URL change

Existing `?status=scheduled` deeplinks will still resolve but now show a different (smaller) set — only never-polled VMs, not all healthy ones. Users who bookmarked `?status=scheduled` expecting healthy VMs should use `?status=dispatched` instead. No redirect needed — this is a backend semantic change, not a dashboard bug.

## Design

### 1. Type Changes

**`src/api/types.ts`** — expand `VmStatus` union:

```typescript
export type VmStatus =
  | "scheduled"
  | "dispatched"
  | "duplicated"
  | "misplaced"
  | "missing"
  | "orphaned"
  | "unscheduled"
  | "unschedulable"
  | "unknown";
```

No API client transform changes — `raw.status` passes through directly.

`migrating` will be added in a follow-up when Olivier deploys it.

### 2. Status Color Mapping

**`src/lib/status-map.ts`** — update `VM_STATUS_VARIANT`:

```typescript
export const VM_STATUS_VARIANT: Record<VmStatus, BadgeVariant> = {
  dispatched: "success",
  scheduled: "default",
  duplicated: "warning",
  misplaced: "warning",
  missing: "error",
  orphaned: "warning",
  unscheduled: "default",
  unschedulable: "error",
  unknown: "default",
};
```

All components using this mapping (vm-table, vm-detail-panel, vm-detail-view, issues-vm-table, latest-vms-card, node-detail-view, node-detail-panel, issues-node-table) need no code changes — they already use it as a lookup.

### 3. VMs Page Filters

**Tab order** (priority-ordered, DS Tabs `overflow="collapse"` handles the rest):

```
All → Dispatched → Orphaned → Missing → Misplaced → Duplicated → Scheduled → Unscheduled → Unschedulable → Unknown
```

**Default tab:** "All" (changed from "Scheduled"). In `vm-table.tsx`, change `initialStatus ?? "scheduled"` to just `initialStatus` so the fallback is `undefined` (= "All").

**Tooltips** updated to match Olivier's definitions:
- Dispatched: "Running on the correct node"
- Scheduled: "Assigned to a node but not yet observed"
- Duplicated: "Running on correct node plus extra copies"
- Misplaced: "Running on wrong node(s), not on assigned node"
- Missing: "Scheduled but not found on any node"
- Orphaned: "Running without active scheduling intent"
- Unscheduled: "Deliberately unscheduled"
- Unschedulable: "No node meets this VM's requirements"
- Unknown: "Status could not be determined"

**URL validation** — `VALID_VM_STATUSES` in `app/vms/page.tsx` updated with all 10 values.

### 4. Overview Page

**Replace "Orphaned" card with "Dispatched"** (green, success variant) — the primary "healthy VMs" indicator, mirroring "Healthy" on the Nodes side. This keeps the 4-card layout: **Total | Dispatched | Missing | Unschedulable**.

Orphaned VMs remain accessible via the Issues page (which already has dedicated Orphaned tracking). The overview should highlight the healthy baseline and the two hardest problems (missing = can't find it, unschedulable = can't place it).

**`OverviewStats` type** — add `dispatchedVMs: number`, remove `orphanedVMs`.

**`getOverviewStats()`** — add counting for `status === "dispatched"`, remove orphaned counting.

**`stats-bar.tsx`** — replace the Orphaned `<Stat>` card with Dispatched. Grid layout stays `grid-cols-2 lg:grid-cols-4` with the same 2x2 interleaved structure (Nodes cols 1-2, VMs cols 3-4). Update the `hasOrphaned` boolean to `hasDispatched`.

### 5. Issues Page

#### 5a. VM Perspective

**`DiscrepancyStatus` expands** from 3 to 5:

```typescript
type DiscrepancyStatus = "orphaned" | "missing" | "unschedulable" | "duplicated" | "misplaced";
```

**New issue descriptions:**
- `duplicated`: "Running on the correct node but also observed on additional nodes. May indicate failed migration cleanup or scheduler inconsistency."
- `misplaced`: "Running on wrong node(s), not found on its assigned node. The VM is active but not where the scheduler expects it."

**New issue short labels:**
- `duplicated`: "Extra copies running"
- `misplaced`: "Running on wrong node"

**`counts` object** — add `duplicated: 0` and `misplaced: 0` to the initializer.

**Issues VM filter pills** (`issues-vm-table.tsx`) — add Duplicated and Misplaced entries.
**URL validation** (`app/issues/page.tsx`) — add to `VALID_DISCREPANCY_STATUSES`.

#### 5b. Node Perspective

**`IssueNode` type** — add `duplicatedCount: number` and `misplacedCount: number` fields. Initialize to 0 in `getOrCreateIssueNode`.

**Node counting logic** in the `useIssues()` loop:

- **`duplicated`** — the VM is running on its allocated node AND extra nodes. We count only the *extra* nodes (exclude `allocatedNode` from the `observedNodes` iteration). The allocated node is correct — the problem is the copies elsewhere.
- **`misplaced`** — the VM is running on wrong nodes, NOT on the allocated node. Count each `observedNodes` entry (they're all wrong). The allocated node has nothing running on it, so it doesn't get a misplaced count.

**`issues-node-table.tsx`** changes:

- **`NodeIssueFilter` type** — add `"hasDuplicated" | "hasMisplaced"`.
- **Filter pills** — add "Has Duplicated" and "Has Misplaced" entries.
- **Table columns** — add "Duplicated" and "Misplaced" count columns (amber/warning color, matching the orphaned column pattern).
- **Detail panel** — add summary cards for duplicated and misplaced counts (amber border, matching orphaned card style).
- **`useMemo` counts** — add `hasDuplicated` and `hasMisplaced` counting in both `uCounts` and `fCounts`.
- **Status filter logic** — add `hasDuplicated`/`hasMisplaced` branches.

### 6. What We're NOT Doing

- **No `?scheduling_status=` UI filter** — backlogged for future consideration
- **No `migrating` status** — will be added in a follow-up when the backend deploys it
- **No two-tier filter UI** — flat tabs with overflow, keeping it simple
- **No changes to node statuses** — this is VM-only

## Files Changed

| File | Change |
|------|--------|
| `src/api/types.ts` | Expand `VmStatus` union, add `dispatchedVMs` / remove `orphanedVMs` in `OverviewStats` |
| `src/lib/status-map.ts` | Add new entries to `VM_STATUS_VARIANT` |
| `src/components/vm-table.tsx` | Update `STATUS_PILLS` order/tooltips, change default tab to "All" |
| `src/app/vms/page.tsx` | Update `VALID_VM_STATUSES` |
| `src/components/stats-bar.tsx` | Replace "Orphaned" hero card with "Dispatched" |
| `src/api/client.ts` | Update `getOverviewStats()`: add dispatched count, remove orphaned count |
| `src/hooks/use-issues.ts` | Expand `DiscrepancyStatus`, `DISCREPANCY_STATUSES`, descriptions, `IssueNode` type, counting logic, `counts` object |
| `src/components/issues-vm-table.tsx` | Add filter pills for duplicated/misplaced |
| `src/components/issues-node-table.tsx` | Add `NodeIssueFilter` values, filter pills, table columns, detail panel cards, counting logic for duplicated/misplaced |
| `src/app/issues/page.tsx` | Update `VALID_DISCREPANCY_STATUSES` |
| `src/lib/filters.test.ts` | Update test fixture default to `"dispatched"`, add test VMs with new statuses |

## Doc Updates

Final implementation step:
- [ ] ARCHITECTURE.md — document new status set, updated issue classification
- [ ] DECISIONS.md — log status color mapping, overview card swap, node counting logic decisions
- [ ] BACKLOG.md — completed items moved, deferred ideas added
- [ ] CLAUDE.md — update Current Features list with new statuses, default tab change
