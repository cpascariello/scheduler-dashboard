# VM Status Expansion — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Support 10 VM statuses from the scheduler API update across the entire dashboard — types, colors, filters, overview cards, and issues page.

**Architecture:** Pure frontend change. The API client already passes `status` through untransformed. We expand the `VmStatus` union type, then update every downstream consumer: status-to-color mapping, filter pill arrays, URL validation sets, overview stats counting, and issues derivation logic.

**Tech Stack:** TypeScript, Next.js App Router, React, Tailwind CSS, `@aleph-front/ds`

**Spec:** `docs/plans/2026-03-19-vm-status-expansion-design.md`

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `src/api/types.ts` | Modify | Expand `VmStatus` union (lines 58-64), update `OverviewStats` (lines 118-131) |
| `src/lib/status-map.ts` | Modify | Add new entries to `VM_STATUS_VARIANT` (lines 30-37) |
| `src/lib/filters.test.ts` | Modify | Update `makeVm` default status (line 35), add new status test cases |
| `src/components/vm-table.tsx` | Modify | Update `STATUS_PILLS` (lines 35-43), default tab (line 232) |
| `src/app/vms/page.tsx` | Modify | Update `VALID_VM_STATUSES` (lines 11-18) |
| `src/api/client.ts` | Modify | Update `getOverviewStats()` counting (lines 268-275) |
| `src/components/stats-bar.tsx` | Modify | Replace Orphaned card with Dispatched (lines 200-267) |
| `src/hooks/use-issues.ts` | Modify | Expand `DiscrepancyStatus`, `IssueNode`, counting logic (full file) |
| `src/components/issues-vm-table.tsx` | Modify | Add filter pills (lines 23-28) |
| `src/components/issues-node-table.tsx` | Modify | Add columns, filters, detail panel cards (lines 25-35, 86-111, 227-244, 311-338) |
| `src/app/issues/page.tsx` | Modify | Update `VALID_DISCREPANCY_STATUSES` (lines 13-17) |

---

### Task 1: Expand VmStatus type and status color mapping

**Files:**
- Modify: `src/api/types.ts:58-64` (VmStatus union)
- Modify: `src/lib/status-map.ts:30-37` (VM_STATUS_VARIANT)

- [ ] **Step 1: Expand VmStatus union**

In `src/api/types.ts`, replace lines 58-64:

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

- [ ] **Step 2: Update VM_STATUS_VARIANT**

In `src/lib/status-map.ts`, replace lines 30-37:

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

- [ ] **Step 3: Run typecheck to verify Record completeness**

Run: `pnpm typecheck`
Expected: PASS — the `Record<VmStatus, BadgeVariant>` type enforces that every status has a variant. If any status is missing, TypeScript will error.

- [ ] **Step 4: Commit**

```bash
git add src/api/types.ts src/lib/status-map.ts
git commit -m "feat: expand VmStatus to 10 statuses with color mapping"
```

---

### Task 2: Update VMs page filters and URL validation

**Files:**
- Modify: `src/components/vm-table.tsx:35-43,232` (STATUS_PILLS, default tab)
- Modify: `src/app/vms/page.tsx:11-18` (VALID_VM_STATUSES)

- [ ] **Step 1: Update STATUS_PILLS in vm-table.tsx**

Replace the `STATUS_PILLS` array (lines 35-43):

```typescript
const STATUS_PILLS: { value: VmStatus | undefined; label: string; tooltip?: string }[] = [
  { value: undefined, label: "All" },
  { value: "dispatched", label: "Dispatched", tooltip: "Running on the correct node" },
  { value: "orphaned", label: "Orphaned", tooltip: "Running without active scheduling intent" },
  { value: "missing", label: "Missing", tooltip: "Scheduled but not found on any node" },
  { value: "misplaced", label: "Misplaced", tooltip: "Running on wrong node(s), not on assigned node" },
  { value: "duplicated", label: "Duplicated", tooltip: "Running on correct node plus extra copies" },
  { value: "scheduled", label: "Scheduled", tooltip: "Assigned to a node but not yet observed" },
  { value: "unscheduled", label: "Unscheduled", tooltip: "Deliberately unscheduled" },
  { value: "unschedulable", label: "Unschedulable", tooltip: "No node meets this VM's requirements" },
  { value: "unknown", label: "Unknown", tooltip: "Status could not be determined" },
];
```

- [ ] **Step 2: Change default tab to "All"**

In `vm-table.tsx` line 232, change:
```typescript
>(initialStatus ?? "scheduled");
```
to:
```typescript
>(initialStatus);
```

- [ ] **Step 3: Update VALID_VM_STATUSES in vms/page.tsx**

Replace lines 11-18:

```typescript
const VALID_VM_STATUSES = new Set<string>([
  "scheduled",
  "dispatched",
  "duplicated",
  "misplaced",
  "unscheduled",
  "orphaned",
  "missing",
  "unschedulable",
  "unknown",
]);
```

- [ ] **Step 4: Run typecheck**

Run: `pnpm typecheck`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/vm-table.tsx src/app/vms/page.tsx
git commit -m "feat: update VM filter tabs with new statuses, default to All"
```

---

### Task 3: Update overview stats and hero cards

**Files:**
- Modify: `src/api/types.ts:118-131` (OverviewStats)
- Modify: `src/api/client.ts:268-275` (getOverviewStats counting)
- Modify: `src/components/stats-bar.tsx:200-267` (hero cards)

- [ ] **Step 1: Update OverviewStats type**

In `src/api/types.ts`, replace `OverviewStats` (lines 118-131):

```typescript
export type OverviewStats = {
  totalNodes: number;
  healthyNodes: number;
  unreachableNodes: number;
  unknownNodes: number;
  removedNodes: number;
  totalVMs: number;
  dispatchedVMs: number;
  missingVMs: number;
  unschedulableVMs: number;
  totalVcpusAllocated: number;
  totalVcpusCapacity: number;
};
```

Note: `scheduledVMs` and `orphanedVMs` are removed. `dispatchedVMs` is added.

- [ ] **Step 2: Update getOverviewStats() counting**

In `src/api/client.ts`, replace the VM counting block (lines 268-275):

```typescript
    totalVMs: vms.length,
    dispatchedVMs: vms.filter((v) => v.status === "dispatched")
      .length,
    missingVMs: vms.filter((v) => v.status === "missing").length,
    unschedulableVMs: vms.filter(
      (v) => v.status === "unschedulable",
    ).length,
```

- [ ] **Step 3: Update stats-bar.tsx — replace Orphaned with Dispatched**

In `src/components/stats-bar.tsx`:

Replace `hasOrphaned` (line 205):
```typescript
  const hasDispatched = (stats?.dispatchedVMs ?? 0) > 0;
```

Replace the Orphaned `<Stat>` card (lines 253-267) with:
```typescript
      <Stat
        label="Dispatched"
        value={stats?.dispatchedVMs}
        total={stats?.totalVMs}
        subtitle="VMs running on their correct assigned node"
        isLoading={isLoading}
        icon={iconCheck}
        href="/vms?status=dispatched"
        {...(hasDispatched
          ? {
              color: "var(--color-success-500)",
              tint: "var(--color-success-500)",
            }
          : {})}
      />
```

- [ ] **Step 4: Run typecheck**

Run: `pnpm typecheck`
Expected: PASS — TypeScript will catch any remaining references to `orphanedVMs` or `scheduledVMs` on `OverviewStats`.

- [ ] **Step 5: Commit**

```bash
git add src/api/types.ts src/api/client.ts src/components/stats-bar.tsx
git commit -m "feat: replace Orphaned overview card with Dispatched"
```

---

### Task 4: Expand Issues page — VM perspective

**Files:**
- Modify: `src/hooks/use-issues.ts` (full file — types, descriptions, counting)
- Modify: `src/components/issues-vm-table.tsx:23-28` (filter pills)
- Modify: `src/app/issues/page.tsx:13-17` (URL validation)

- [ ] **Step 1: Expand DiscrepancyStatus and descriptions in use-issues.ts**

Replace line 6:
```typescript
export type DiscrepancyStatus = "orphaned" | "missing" | "unschedulable" | "duplicated" | "misplaced";
```

Replace lines 8-12:
```typescript
const DISCREPANCY_STATUSES = new Set<VmStatus>([
  "orphaned",
  "missing",
  "unschedulable",
  "duplicated",
  "misplaced",
]);
```

Replace `ISSUE_DESCRIPTIONS` (lines 27-34):
```typescript
const ISSUE_DESCRIPTIONS: Record<DiscrepancyStatus, string> = {
  orphaned:
    "Running without schedule. Possible causes: failed migration cleanup, scheduler bug, or unauthorized execution.",
  missing:
    "Scheduled but not running. The VM should be active on its allocated node but cannot be found.",
  unschedulable:
    "Cannot be placed. No available node meets the resource requirements for this VM.",
  duplicated:
    "Running on the correct node but also observed on additional nodes. May indicate failed migration cleanup or scheduler inconsistency.",
  misplaced:
    "Running on wrong node(s), not found on its assigned node. The VM is active but not where the scheduler expects it.",
};
```

Replace `ISSUE_SHORT` (lines 36-40):
```typescript
const ISSUE_SHORT: Record<DiscrepancyStatus, string> = {
  orphaned: "Running without schedule",
  missing: "Scheduled but not running",
  unschedulable: "Cannot be placed",
  duplicated: "Extra copies running",
  misplaced: "Running on wrong node",
};
```

- [ ] **Step 2: Expand IssueNode type and counting logic**

Replace `IssueNode` type (lines 18-25):
```typescript
export type IssueNode = {
  node: Node;
  orphanedCount: number;
  missingCount: number;
  duplicatedCount: number;
  misplacedCount: number;
  totalVmCount: number;
  lastUpdated: string;
  discrepancyVMs: IssueVM[];
};
```

In `getOrCreateIssueNode` (lines 83-92), add the new fields to the initializer:
```typescript
      const entry: IssueNode = {
        node,
        orphanedCount: 0,
        missingCount: 0,
        duplicatedCount: 0,
        misplacedCount: 0,
        totalVmCount: node.vmCount,
        lastUpdated: "",
        discrepancyVMs: [],
      };
```

Replace the counting loop (lines 95-117):
```typescript
    for (const vm of issueVMs) {
      if (vm.status === "orphaned") {
        for (const nodeHash of vm.observedNodes) {
          const entry = getOrCreateIssueNode(nodeHash);
          if (entry) {
            entry.orphanedCount++;
            entry.discrepancyVMs.push(vm);
            if (!entry.lastUpdated || vm.updatedAt > entry.lastUpdated) {
              entry.lastUpdated = vm.updatedAt;
            }
          }
        }
      } else if (vm.status === "missing" && vm.allocatedNode) {
        const entry = getOrCreateIssueNode(vm.allocatedNode);
        if (entry) {
          entry.missingCount++;
          entry.discrepancyVMs.push(vm);
          if (!entry.lastUpdated || vm.updatedAt > entry.lastUpdated) {
            entry.lastUpdated = vm.updatedAt;
          }
        }
      } else if (vm.status === "duplicated") {
        // Count only extra nodes — exclude the allocated (correct) node
        for (const nodeHash of vm.observedNodes) {
          if (nodeHash === vm.allocatedNode) continue;
          const entry = getOrCreateIssueNode(nodeHash);
          if (entry) {
            entry.duplicatedCount++;
            entry.discrepancyVMs.push(vm);
            if (!entry.lastUpdated || vm.updatedAt > entry.lastUpdated) {
              entry.lastUpdated = vm.updatedAt;
            }
          }
        }
      } else if (vm.status === "misplaced") {
        // All observed nodes are wrong — count each one
        for (const nodeHash of vm.observedNodes) {
          const entry = getOrCreateIssueNode(nodeHash);
          if (entry) {
            entry.misplacedCount++;
            entry.discrepancyVMs.push(vm);
            if (!entry.lastUpdated || vm.updatedAt > entry.lastUpdated) {
              entry.lastUpdated = vm.updatedAt;
            }
          }
        }
      }
    }
```

Replace the counts object (lines 121-125):
```typescript
    const counts = {
      orphaned: 0,
      missing: 0,
      unschedulable: 0,
      duplicated: 0,
      misplaced: 0,
    };
```

- [ ] **Step 3: Add filter pills in issues-vm-table.tsx**

Replace `STATUS_PILLS` (lines 23-28):
```typescript
const STATUS_PILLS: { value: StatusFilter; label: string; tooltip?: string }[] = [
  { value: undefined, label: "All" },
  { value: "orphaned", label: "Orphaned", tooltip: "Running without active scheduling intent" },
  { value: "missing", label: "Missing", tooltip: "Scheduled but not found on any node" },
  { value: "duplicated", label: "Duplicated", tooltip: "Running on correct node plus extra copies" },
  { value: "misplaced", label: "Misplaced", tooltip: "Running on wrong node(s), not on assigned node" },
  { value: "unschedulable", label: "Unschedulable", tooltip: "No node meets this VM's requirements" },
];
```

- [ ] **Step 4: Update VALID_DISCREPANCY_STATUSES in issues/page.tsx**

Replace lines 13-17:
```typescript
const VALID_DISCREPANCY_STATUSES = new Set<string>([
  "orphaned",
  "missing",
  "unschedulable",
  "duplicated",
  "misplaced",
]);
```

- [ ] **Step 5: Run typecheck**

Run: `pnpm typecheck`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/hooks/use-issues.ts src/components/issues-vm-table.tsx src/app/issues/page.tsx
git commit -m "feat: expand Issues VM perspective with duplicated/misplaced"
```

---

### Task 5: Expand Issues page — Node perspective

**Files:**
- Modify: `src/components/issues-node-table.tsx:25,27-35,86-111,227-244,311-338`

- [ ] **Step 1: Expand NodeIssueFilter type and filter pills**

Replace line 25:
```typescript
type NodeIssueFilter = "hasOrphaned" | "hasMissing" | "hasDuplicated" | "hasMisplaced" | undefined;
```

Replace `STATUS_PILLS` (lines 27-35):
```typescript
const STATUS_PILLS: {
  value: NodeIssueFilter;
  label: string;
  tooltip?: string;
}[] = [
  { value: undefined, label: "All" },
  { value: "hasOrphaned", label: "Has Orphaned", tooltip: "Nodes running VMs not in the schedule" },
  { value: "hasMissing", label: "Has Missing", tooltip: "Nodes with scheduled VMs not found on them" },
  { value: "hasDuplicated", label: "Has Duplicated", tooltip: "Nodes running extra copies of VMs" },
  { value: "hasMisplaced", label: "Has Misplaced", tooltip: "Nodes running VMs assigned elsewhere" },
];
```

- [ ] **Step 2: Add table columns for Duplicated and Misplaced**

After the existing "Missing" column (after line 111), add two new columns:

```typescript
  {
    header: "Duplicated",
    accessor: (r) => (
      <span
        className={`text-xs tabular-nums ${r.duplicatedCount > 0 ? "text-warning-400 font-bold" : "text-muted-foreground"}`}
      >
        {r.duplicatedCount}
      </span>
    ),
    sortable: true,
    sortValue: (r) => r.duplicatedCount,
    align: "right",
  },
  {
    header: "Misplaced",
    accessor: (r) => (
      <span
        className={`text-xs tabular-nums ${r.misplacedCount > 0 ? "text-warning-400 font-bold" : "text-muted-foreground"}`}
      >
        {r.misplacedCount}
      </span>
    ),
    sortable: true,
    sortValue: (r) => r.misplacedCount,
    align: "right",
  },
```

Also add `"Duplicated"` and `"Misplaced"` to `COMPACT_HIDDEN_HEADERS` (line 43):
```typescript
const COMPACT_HIDDEN_HEADERS = new Set(["Total VMs", "Last Updated", "Duplicated", "Misplaced"]);
```

- [ ] **Step 3: Add detail panel summary cards**

In `IssuesNodeDetailPanel`, after the existing missingCount card (after line 243), add:

```typescript
        {issueNode.duplicatedCount > 0 && (
          <div className="flex-1 rounded-lg border border-warning-400/20 bg-warning-400/5 p-2.5 text-center">
            <p className="text-lg font-bold text-warning-400 tabular-nums">
              {issueNode.duplicatedCount}
            </p>
            <p className="text-xs text-muted-foreground">Duplicated</p>
          </div>
        )}
        {issueNode.misplacedCount > 0 && (
          <div className="flex-1 rounded-lg border border-warning-400/20 bg-warning-400/5 p-2.5 text-center">
            <p className="text-lg font-bold text-warning-400 tabular-nums">
              {issueNode.misplacedCount}
            </p>
            <p className="text-xs text-muted-foreground">Misplaced</p>
          </div>
        )}
```

- [ ] **Step 4: Update counting and filtering logic in useMemo**

In the `useMemo` block (lines 311-338), update the unfiltered and filtered counts:

```typescript
      const uCounts: Record<string, number> = {
        all: issueNodes.length,
        hasOrphaned: issueNodes.filter((n) => n.orphanedCount > 0).length,
        hasMissing: issueNodes.filter((n) => n.missingCount > 0).length,
        hasDuplicated: issueNodes.filter((n) => n.duplicatedCount > 0).length,
        hasMisplaced: issueNodes.filter((n) => n.misplacedCount > 0).length,
      };

      const afterSearch = textSearch(issueNodes, debouncedQuery, SEARCH_FIELDS);
      const fCounts: Record<string, number> = {
        all: afterSearch.length,
        hasOrphaned: afterSearch.filter((n) => n.orphanedCount > 0).length,
        hasMissing: afterSearch.filter((n) => n.missingCount > 0).length,
        hasDuplicated: afterSearch.filter((n) => n.duplicatedCount > 0).length,
        hasMisplaced: afterSearch.filter((n) => n.misplacedCount > 0).length,
      };
```

Update the status filter branches (lines 333-338):

```typescript
      let afterStatus = afterSearch;
      if (statusFilter === "hasOrphaned") {
        afterStatus = afterSearch.filter((n) => n.orphanedCount > 0);
      } else if (statusFilter === "hasMissing") {
        afterStatus = afterSearch.filter((n) => n.missingCount > 0);
      } else if (statusFilter === "hasDuplicated") {
        afterStatus = afterSearch.filter((n) => n.duplicatedCount > 0);
      } else if (statusFilter === "hasMisplaced") {
        afterStatus = afterSearch.filter((n) => n.misplacedCount > 0);
      }
```

- [ ] **Step 5: Run typecheck**

Run: `pnpm typecheck`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/components/issues-node-table.tsx
git commit -m "feat: expand Issues Node perspective with duplicated/misplaced"
```

---

### Task 6: Update test fixtures

**Files:**
- Modify: `src/lib/filters.test.ts:35`

- [ ] **Step 1: Update makeVm default status**

In `src/lib/filters.test.ts` line 35, change:
```typescript
  status: "scheduled",
```
to:
```typescript
  status: "dispatched",
```

- [ ] **Step 2: Run tests**

Run: `pnpm test`
Expected: All tests PASS

- [ ] **Step 3: Run full check**

Run: `pnpm check`
Expected: Lint + typecheck + tests all PASS

- [ ] **Step 4: Commit**

```bash
git add src/lib/filters.test.ts
git commit -m "test: update VM fixture default to dispatched"
```

---

### Task 7: Update docs

- [ ] **Step 1: Update ARCHITECTURE.md** — document the 10-status set, the status color mapping, the issues page expansion (5 discrepancy statuses), and the overview card swap.

- [ ] **Step 2: Update DECISIONS.md** — log key decisions: status color assignments (misplaced=warning, unschedulable=error, migrating=info), overview card swap (Orphaned→Dispatched), node counting logic (duplicated excludes allocatedNode), flat tab ordering, default tab change to All.

- [ ] **Step 3: Update BACKLOG.md** — this item was identified during brainstorming, not from an existing backlog entry. No item to move to completed.

- [ ] **Step 4: Update CLAUDE.md Current Features** — update VM status references throughout: new status list, filter tab count (10), default tab "All", Issues page now tracks 5 discrepancy types, overview shows Dispatched instead of Orphaned.

- [ ] **Step 5: Commit**

```bash
git add docs/ARCHITECTURE.md docs/DECISIONS.md docs/BACKLOG.md CLAUDE.md
git commit -m "docs: update project docs for VM status expansion"
```
