# Issues Page Design

Date: 2026-03-11

## Problem

The dashboard fetches `observedNodes` and discrepancy statuses (orphaned, missing, unschedulable) but barely surfaces the relationship between what the scheduler planned and what's actually running on the network. DevOps and engineers investigating discrepancies have no dedicated view — they must mentally piece together information from the VM table, detail panels, and overview stats.

### Concepts

Every VM has two dimensions:

- **Scheduled** (the plan): `allocatedNode` — where the scheduler wants it to run
- **Observed** (reality): `observedNodes` — where it's actually running

Discrepancies between these reveal problems:

| Status | Scheduled | Observed | Meaning | Discrepancy? |
|--------|-----------|----------|---------|:---:|
| scheduled | Node A | Node A | Everything is fine | No |
| missing | Node A | nowhere | Should be running but isn't | Yes |
| orphaned | nowhere | Node B | Running but shouldn't be (failed migration cleanup, bug, malicious scheduler) | Yes |
| unschedulable | nowhere | nowhere | Can't be placed due to resource constraints | Yes |
| unscheduled | nowhere | nowhere | Intentionally not scheduled (normal state) | No |
| unknown | varies | varies | Status not yet determined | No |

**Discrepancy statuses** (shown on the issues page): `orphaned`, `missing`, `unschedulable`. All other statuses are excluded.

## Design

### New page: `/issues`

A dedicated page for investigating scheduling discrepancies. Uses the same table + detail panel layout as `/vms` and `/nodes`.

**Perspective toggle**: Segmented pill control (VMs | Nodes) next to the page title. Built locally in the page component (simple enough to not warrant a DS component). Controlled via `?perspective=vms|nodes` search param, defaults to `vms`. Pre-selected when arriving from overview stat cards.

**Data source**: No new API calls. A new `useIssues()` hook combines `useVMs()` and `useNodes()` to derive discrepancy sets and per-node counts. Client-side filtering only.

#### VM perspective

**Table columns:**

| Column | Content |
|--------|---------|
| VM Hash | Truncated hash (CopyableText) |
| Status | Badge (orphaned/missing/unschedulable) |
| Issue | Human-readable explanation ("Running without schedule", "Scheduled but not running", "Cannot be placed") |
| Scheduled On | `allocatedNode` hash or dash if none |
| Observed On | `observedNodes` hashes or dash if none |
| Last Updated | Relative time from `updatedAt` |

**Status pills**: All / Orphaned / Missing / Unschedulable — with count badges, same pattern as existing pages.

**Filtering**: Reuses `FilterToolbar` with status pills and text search. Advanced filters deferred — the data set is small enough that status + search suffices.

**Detail panel** (when a VM is selected):

1. **VM hash** (full, copyable)
2. **Status badge**
3. **"Schedule vs Reality" card** — comparison showing scheduled node vs observed node(s) with status dots. The key insight at a glance.
4. **Issue explanation box** — amber-tinted card explaining what this status means and possible causes (e.g., "This VM is running on a node but has no active schedule. Possible causes: failed migration cleanup, scheduler bug, or unauthorized execution.")
5. **Quick facts** — type, last observed, vCPUs, memory
6. **Recent history** — last 5 entries from the VM's history
7. **"View full details"** link to `/vms?view=hash`

#### Node perspective

**Table columns:**

| Column | Content |
|--------|---------|
| Node | Name (if available) + truncated hash |
| Status | StatusDot (healthy/unreachable/etc.) |
| Orphaned | Count of orphaned VMs on this node |
| Missing | Count of missing VMs scheduled on this node |
| Total VMs | Total VM count on this node |
| Last Updated | `max(updatedAt)` across all discrepancy VMs associated with this node |

**Status pills**: All / Has Orphaned / Has Missing — with count badges.

**Data derivation** (in `useIssues()` hook): Cross-reference discrepancy VMs against nodes:
- A node appears in the "Has Orphaned" list if any orphaned VM has it in `observedNodes`
- A node appears in the "Has Missing" list if any missing VM has it as `allocatedNode`
- Per-node orphaned/missing counts computed from the VM list
- A node can appear in both categories

**Detail panel** (when a node is selected):
- Node info (name, hash, status, resources)
- List of discrepancy VMs on this node with their statuses and issue descriptions
- Link to `/nodes?view=hash`

### Overview page changes

**Clickable stat cards**: All existing stat cards become clickable links. The `Stat` component currently wraps cards in `TooltipTrigger asChild` — refactor to nest a `<Link>` inside, keeping tooltip on hover and navigation on click.

| Card | Destination |
|------|-------------|
| Nodes → Total | `/nodes` (unfiltered) |
| Nodes → Healthy | `/nodes?status=healthy` |
| Nodes → Unreachable | `/nodes?status=unreachable` |
| Nodes → Removed | `/nodes?status=removed` |
| VMs → Total | `/vms` (unfiltered) |
| VMs → Scheduled | `/vms?status=scheduled` |
| VMs → Orphaned | `/vms?status=orphaned` |
| VMs → Missing | `/vms?status=missing` |
| VMs → Unschedulable | `/vms?status=unschedulable` |

This also resolves the existing "Clickable stat cards" backlog item.

**New "Issues" section**: A third section below "Nodes" and "Virtual Machines" with two stat cards:

- **Affected VMs** — aggregate count of VMs with discrepancy statuses (orphaned + missing + unschedulable). Subtitle shows per-status breakdown ("12 orphaned · 8 missing · 4 unschedulable"). Links to `/issues?perspective=vms`. Amber-tinted border.
- **Affected Nodes** — count of unique nodes involved in any discrepancy (a node appearing in both orphaned and missing lists is counted once). Subtitle shows per-type breakdown ("4 with orphaned · 3 with missing" — these can overlap). Links to `/issues?perspective=nodes`. Amber-tinted border.

### Sidebar reorganization

Categorized navigation with small uppercase section titles:

- **Dashboard**: Overview
- **Resources**: Nodes, VMs
- **Operations**: Issues (with amber count badge showing total discrepancy VM count from `useOverviewStats()`, updates with 30s polling)
- Bottom (border-separated): API Status (with existing health dot + poll ring)

Category labels are visual grouping only — not clickable, no collapse behavior.

### Minor: display `diskMb` in VM detail views

The types and transform layer already capture `requirements_disk_mb` → `diskMb`. It just isn't displayed. Show it in VM detail views and panels alongside vCPUs and memory.

## Navigation flow

```
Overview "Affected VMs: 24"     → /issues?perspective=vms
Overview "Affected Nodes: 6"    → /issues?perspective=nodes
Overview "Orphaned: 12"         → /vms?status=orphaned
Overview "Missing: 8"           → /vms?status=missing
Overview "Unschedulable: 4"     → /vms?status=unschedulable
Overview "Total Nodes: 543"     → /nodes
Overview "Healthy: 390"         → /nodes?status=healthy
Overview "Unreachable: 54"      → /nodes?status=unreachable
Overview "Removed: 12"          → /nodes?status=removed
Overview "Total VMs: 181"       → /vms
Overview "Scheduled: 142"       → /vms?status=scheduled
Sidebar "Issues"                → /issues (defaults to vms perspective)
Issues detail panel "View full" → /vms?view=hash or /nodes?view=hash
```

## What this does NOT include

- No new API calls — everything derived from existing data
- No changes to existing `/vms` or `/nodes` page behavior
- No derived "misplaced" status — stick with API statuses (Decision: trust the API's categorization)
- No advanced filters on the issues page (deferred — data set is small)
- No mobile-specific adaptations beyond existing responsive patterns

## Files to create or modify

### New files
- `src/app/issues/page.tsx` — Issues page with perspective toggle
- `src/hooks/use-issues.ts` — Combines `useVMs()` + `useNodes()`, derives discrepancy VM list, per-node issue counts, and aggregate stats
- `src/components/issues-vm-table.tsx` — VM perspective table + detail panel
- `src/components/issues-node-table.tsx` — Node perspective table + detail panel

### Modified files
- `src/components/app-sidebar.tsx` — categorized nav with Issues link + count badge (uses `useOverviewStats()`)
- `src/components/stats-bar.tsx` — refactor `Stat` to support `href` prop (Link inside TooltipTrigger), add Issues section with Affected VMs/Nodes cards
- `src/hooks/use-overview-stats.ts` — add `affectedNodes` count to `OverviewStats` (derived from cross-referencing VMs and nodes)
- `src/api/types.ts` — add `affectedNodes` to `OverviewStats`
- `src/components/vm-detail-view.tsx` — show disk requirement
- `src/components/vm-detail-panel.tsx` — show disk requirement

## Doc updates

- ARCHITECTURE.md — new page, sidebar categories pattern, issues data derivation, `useIssues` hook
- DECISIONS.md — design decisions from this feature
- BACKLOG.md — move "Clickable stat cards" to completed, add any deferred ideas
- CLAUDE.md — update Current Features list
