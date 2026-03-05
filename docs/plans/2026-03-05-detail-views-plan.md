# Detail Views Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add dedicated full-width detail views for nodes and VMs, accessible via `?view=hash` search params, with full history timelines and previously hidden API fields.

**Architecture:** Search-param-based view switching in existing page components. When `?view=hash` is present, the page renders a full-width detail view instead of the table+panel layout. The existing side panels remain as quick-peek with a "View details" link. New API fields are surfaced by extending the transform layer.

**Tech Stack:** Next.js App Router, React Query, TypeScript, Tailwind CSS, @aleph-front/ds components

**Design doc:** `docs/plans/2026-03-05-detail-views-design.md`

---

### Task 1: Extend API types and transforms

**Files:**
- Modify: `src/api/types.ts:21-30` (Node type)
- Modify: `src/api/types.ts:60-69` (VM type)
- Modify: `src/api/client.ts:103-114` (transformNode)
- Modify: `src/api/client.ts:116-131` (transformVm)

**Step 1: Add new fields to Node type**

In `src/api/types.ts`, extend the `Node` type (line 21-30):

```typescript
export type Node = {
  hash: string;
  name: string | null;
  address: string | null;
  status: NodeStatus;
  staked: boolean;
  resources: NodeResources | null;
  vmCount: number;
  updatedAt: string;
  owner: string | null;
  supportsIpv6: boolean | null;
  discoveredAt: string | null;
};
```

**Step 2: Add new fields to VM type**

In `src/api/types.ts`, extend the `VM` type (line 60-69):

```typescript
export type VM = {
  hash: string;
  type: VmType;
  allocatedNode: string | null;
  observedNodes: string[];
  status: VmStatus;
  requirements: VmRequirements;
  paymentStatus: "validated" | "invalidated" | null;
  updatedAt: string;
  allocatedAt: string | null;
  lastObservedAt: string | null;
  paymentType: string | null;
};
```

**Step 3: Update transformNode**

In `src/api/client.ts`, update `transformNode` (line 103-114):

```typescript
function transformNode(raw: ApiNodeRow): Node {
  return {
    hash: raw.node_hash,
    name: raw.name,
    address: raw.address,
    status: transformNodeStatus(raw.status),
    staked: raw.staked,
    resources: transformNodeResources(raw),
    vmCount: raw.vm_count,
    updatedAt: raw.updated_at,
    owner: raw.owner,
    supportsIpv6: raw.supports_ipv6,
    discoveredAt: raw.discovered_at,
  };
}
```

**Step 4: Update transformVm**

In `src/api/client.ts`, update `transformVm` (line 116-131):

```typescript
function transformVm(raw: ApiVmRow): VM {
  return {
    hash: raw.vm_hash,
    type: raw.vm_type,
    allocatedNode: raw.allocated_node,
    observedNodes: raw.observed_nodes,
    status: raw.status,
    requirements: {
      vcpus: raw.requirements_vcpus,
      memoryMb: raw.requirements_memory_mb,
      diskMb: raw.requirements_disk_mb,
    },
    paymentStatus: raw.payment_status,
    updatedAt: raw.updated_at,
    allocatedAt: raw.allocated_at,
    lastObservedAt: raw.last_observed_at,
    paymentType: raw.payment_type,
  };
}
```

**Step 5: Verify types compile**

Run: `pnpm typecheck`
Expected: PASS (new fields are all nullable, no downstream breakage)

**Step 6: Commit**

```bash
git add src/api/types.ts src/api/client.ts
git commit -m "feat: surface hidden API fields (owner, ipv6, discoveredAt, allocatedAt, etc.)"
```

---

### Task 2: Add a `formatDateTime` helper

**Files:**
- Modify: `src/lib/format.ts`

The detail views need to display absolute timestamps (for discoveredAt, allocatedAt, etc.), not just relative times.

**Step 1: Add formatDateTime function**

Append to `src/lib/format.ts`:

```typescript
export function formatDateTime(isoDate: string): string {
  const date = new Date(isoDate);
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
```

**Step 2: Verify types compile**

Run: `pnpm typecheck`
Expected: PASS

**Step 3: Commit**

```bash
git add src/lib/format.ts
git commit -m "feat: add formatDateTime helper for absolute timestamps"
```

---

### Task 3: Build NodeDetailView component

**Files:**
- Create: `src/components/node-detail-view.tsx`

This is the full-width detail view rendered when `/nodes?view=hash` is active.

**Step 1: Create the component**

Create `src/components/node-detail-view.tsx`:

```tsx
"use client";

import Link from "next/link";
import { Card } from "@aleph-front/ds/card";
import { Badge } from "@aleph-front/ds/badge";
import { StatusDot } from "@aleph-front/ds/status-dot";
import {
  TooltipProvider,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@aleph-front/ds/tooltip";
import { Skeleton } from "@aleph-front/ds/ui/skeleton";
import { useNode } from "@/hooks/use-nodes";
import { ResourceBar } from "@/components/resource-bar";
import {
  relativeTime,
  truncateHash,
  formatDateTime,
} from "@/lib/format";
import {
  nodeStatusToDot,
  NODE_STATUS_VARIANT,
  VM_STATUS_VARIANT,
} from "@/lib/status-map";

type NodeDetailViewProps = {
  hash: string;
};

function MetaItem({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex justify-between gap-4 py-1">
      <dt className="text-muted-foreground shrink-0">{label}</dt>
      <dd className="min-w-0 truncate text-right">{children}</dd>
    </div>
  );
}

export function NodeDetailView({ hash }: NodeDetailViewProps) {
  const { data: node, isLoading } = useNode(hash);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (!node) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/nodes"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Nodes
        </Link>
      </div>
      <div className="flex items-center gap-3">
        <StatusDot status={nodeStatusToDot(node.status)} />
        <h2 className="text-xl font-bold">
          {node.name ?? truncateHash(node.hash, 16)}
        </h2>
        <Badge
          variant={NODE_STATUS_VARIANT[node.status]}
          size="sm"
          className="capitalize"
        >
          {node.status}
        </Badge>
        <Badge
          variant={node.staked ? "success" : "default"}
          size="sm"
        >
          {node.staked ? "Staked" : "Not staked"}
        </Badge>
      </div>

      {/* Metadata */}
      <Card padding="md">
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Details
        </h3>
        <dl className="grid gap-x-8 gap-y-1 text-sm sm:grid-cols-2">
          <MetaItem label="Hash">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="cursor-help font-mono text-xs">
                    {node.hash}
                  </span>
                </TooltipTrigger>
                <TooltipContent>{node.hash}</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </MetaItem>
          {node.address && (
            <MetaItem label="Address">
              <span className="text-xs">{node.address}</span>
            </MetaItem>
          )}
          {node.owner && (
            <MetaItem label="Owner">
              <span className="font-mono text-xs">
                {truncateHash(node.owner, 16)}
              </span>
            </MetaItem>
          )}
          {node.supportsIpv6 != null && (
            <MetaItem label="IPv6">
              {node.supportsIpv6 ? "Yes" : "No"}
            </MetaItem>
          )}
          {node.discoveredAt && (
            <MetaItem label="Discovered">
              {formatDateTime(node.discoveredAt)}
            </MetaItem>
          )}
          <MetaItem label="Last updated">
            {relativeTime(node.updatedAt)}
          </MetaItem>
        </dl>
      </Card>

      {/* Resources */}
      {node.resources && (
        <Card padding="md">
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Resources
          </h3>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">CPU</span>
                <span className="text-xs tabular-nums">
                  {node.resources.vcpusTotal} vCPUs
                </span>
              </div>
              <ResourceBar
                value={node.resources.cpuUsagePct}
                label="CPU"
              />
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Memory</span>
                <span className="text-xs tabular-nums">
                  {Math.round(node.resources.memoryTotalMb / 1024)} GB
                </span>
              </div>
              <ResourceBar
                value={node.resources.memoryUsagePct}
                label="Memory"
              />
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Disk</span>
                <span className="text-xs tabular-nums">
                  {Math.round(node.resources.diskTotalMb / 1024)} GB
                </span>
              </div>
              <ResourceBar
                value={node.resources.diskUsagePct}
                label="Disk"
              />
            </div>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            Resource history charts coming soon.
          </p>
        </Card>
      )}

      {/* VMs */}
      {node.vms.length > 0 && (
        <Card padding="md">
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Virtual Machines ({node.vms.length})
          </h3>
          <ul className="space-y-1.5">
            {node.vms.map((vm) => (
              <li
                key={vm.hash}
                className="flex items-center justify-between text-sm"
              >
                <Link
                  href={`/vms?view=${vm.hash}`}
                  className="group/link inline-flex items-center gap-1 font-mono text-xs font-bold text-primary-300 hover:underline"
                >
                  {truncateHash(vm.hash)}
                  <svg
                    className="size-3 transition-transform duration-150 group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M7 17L17 7M7 7h10v10"
                    />
                  </svg>
                </Link>
                <Badge
                  variant={VM_STATUS_VARIANT[vm.status]}
                  size="sm"
                  className="capitalize"
                >
                  {vm.status}
                </Badge>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {/* History */}
      <Card padding="md">
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          History ({node.history.length})
        </h3>
        {node.history.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No history events recorded.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-edge text-left text-xs text-muted-foreground">
                  <th className="pb-2 pr-4 font-medium">Action</th>
                  <th className="pb-2 pr-4 font-medium">VM</th>
                  <th className="pb-2 pr-4 font-medium">Reason</th>
                  <th className="pb-2 font-medium text-right">
                    Time
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-edge">
                {node.history.map((row) => (
                  <tr key={row.id}>
                    <td className="py-1.5 pr-4 capitalize">
                      {row.action.replace(/_/g, " ")}
                    </td>
                    <td className="py-1.5 pr-4">
                      <Link
                        href={`/vms?view=${row.vmHash}`}
                        className="font-mono text-xs text-primary-300 hover:underline"
                      >
                        {truncateHash(row.vmHash)}
                      </Link>
                    </td>
                    <td className="py-1.5 pr-4 text-muted-foreground">
                      {row.reason ?? "—"}
                    </td>
                    <td className="py-1.5 text-right text-xs text-muted-foreground tabular-nums">
                      {relativeTime(row.timestamp)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
```

**Step 2: Verify types compile**

Run: `pnpm typecheck`
Expected: PASS

**Step 3: Commit**

```bash
git add src/components/node-detail-view.tsx
git commit -m "feat: add NodeDetailView component with full history and metadata"
```

---

### Task 4: Build VMDetailView component

**Files:**
- Create: `src/components/vm-detail-view.tsx`

**Step 1: Create the component**

Create `src/components/vm-detail-view.tsx`:

```tsx
"use client";

import Link from "next/link";
import { Card } from "@aleph-front/ds/card";
import { Badge } from "@aleph-front/ds/badge";
import {
  TooltipProvider,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@aleph-front/ds/tooltip";
import { Skeleton } from "@aleph-front/ds/ui/skeleton";
import { useVM } from "@/hooks/use-vms";
import {
  relativeTime,
  truncateHash,
  formatDateTime,
} from "@/lib/format";
import { VM_STATUS_VARIANT } from "@/lib/status-map";

type VMDetailViewProps = {
  hash: string;
};

function MetaItem({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex justify-between gap-4 py-1">
      <dt className="text-muted-foreground shrink-0">{label}</dt>
      <dd className="min-w-0 truncate text-right">{children}</dd>
    </div>
  );
}

export function VMDetailView({ hash }: VMDetailViewProps) {
  const { data: vm, isLoading } = useVM(hash);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (!vm) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/vms"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Virtual Machines
        </Link>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="font-mono text-xl font-bold">
          {truncateHash(hash, 16)}
        </h2>
        <Badge variant="default" size="sm">
          {vm.type}
        </Badge>
        <Badge
          variant={VM_STATUS_VARIANT[vm.status]}
          size="sm"
          className="capitalize"
        >
          {vm.status}
        </Badge>
        {vm.paymentStatus && (
          <Badge
            variant={
              vm.paymentStatus === "validated" ? "success" : "error"
            }
            size="sm"
            className="capitalize"
          >
            {vm.paymentStatus}
          </Badge>
        )}
      </div>

      {/* Metadata */}
      <Card padding="md">
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Details
        </h3>
        <dl className="grid gap-x-8 gap-y-1 text-sm sm:grid-cols-2">
          <MetaItem label="Hash">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="cursor-help font-mono text-xs">
                    {vm.hash}
                  </span>
                </TooltipTrigger>
                <TooltipContent>{vm.hash}</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </MetaItem>
          <MetaItem label="Type">{vm.type}</MetaItem>
          {vm.paymentType && (
            <MetaItem label="Payment type">
              {vm.paymentType}
            </MetaItem>
          )}
          {vm.allocatedAt && (
            <MetaItem label="Allocated at">
              {formatDateTime(vm.allocatedAt)}
            </MetaItem>
          )}
          {vm.lastObservedAt && (
            <MetaItem label="Last observed">
              {formatDateTime(vm.lastObservedAt)}
            </MetaItem>
          )}
          <MetaItem label="Last updated">
            {relativeTime(vm.updatedAt)}
          </MetaItem>
        </dl>
      </Card>

      {/* Allocated Node */}
      <Card padding="md">
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Allocated Node
        </h3>
        {vm.allocatedNode ? (
          <Link
            href={`/nodes?view=${vm.allocatedNode}`}
            className="group/link inline-flex items-center gap-1 font-mono text-sm font-bold text-primary-300 hover:underline"
          >
            {truncateHash(vm.allocatedNode, 12)}
            <svg
              className="size-3 transition-transform duration-150 group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M7 17L17 7M7 7h10v10"
              />
            </svg>
          </Link>
        ) : (
          <p className="text-sm text-muted-foreground">
            Not allocated
          </p>
        )}
      </Card>

      {/* Observed Nodes */}
      {vm.observedNodes.length > 0 && (
        <Card padding="md">
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Observed Nodes ({vm.observedNodes.length})
          </h3>
          <ul className="space-y-1.5">
            {vm.observedNodes.map((nodeHash) => (
              <li key={nodeHash}>
                <Link
                  href={`/nodes?view=${nodeHash}`}
                  className="group/link inline-flex items-center gap-1 font-mono text-xs font-bold text-primary-300 hover:underline"
                >
                  {truncateHash(nodeHash)}
                  <svg
                    className="size-3 transition-transform duration-150 group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M7 17L17 7M7 7h10v10"
                    />
                  </svg>
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {/* Requirements */}
      <Card padding="md">
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Requirements
        </h3>
        <dl className="grid gap-x-8 gap-y-1 text-sm sm:grid-cols-3">
          <MetaItem label="vCPUs">
            <span className="tabular-nums">
              {vm.requirements.vcpus ?? "None"}
            </span>
          </MetaItem>
          <MetaItem label="Memory">
            <span className="tabular-nums">
              {vm.requirements.memoryMb != null
                ? `${vm.requirements.memoryMb} MB`
                : "None"}
            </span>
          </MetaItem>
          <MetaItem label="Disk">
            <span className="tabular-nums">
              {vm.requirements.diskMb != null
                ? `${vm.requirements.diskMb} MB`
                : "None"}
            </span>
          </MetaItem>
        </dl>
      </Card>

      {/* History */}
      <Card padding="md">
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          History ({vm.history.length})
        </h3>
        {vm.history.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No history events recorded.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-edge text-left text-xs text-muted-foreground">
                  <th className="pb-2 pr-4 font-medium">Action</th>
                  <th className="pb-2 pr-4 font-medium">Node</th>
                  <th className="pb-2 pr-4 font-medium">Reason</th>
                  <th className="pb-2 font-medium text-right">
                    Time
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-edge">
                {vm.history.map((row) => (
                  <tr key={row.id}>
                    <td className="py-1.5 pr-4 capitalize">
                      {row.action.replace(/_/g, " ")}
                    </td>
                    <td className="py-1.5 pr-4">
                      <Link
                        href={`/nodes?view=${row.nodeHash}`}
                        className="font-mono text-xs text-primary-300 hover:underline"
                      >
                        {truncateHash(row.nodeHash)}
                      </Link>
                    </td>
                    <td className="py-1.5 pr-4 text-muted-foreground">
                      {row.reason ?? "—"}
                    </td>
                    <td className="py-1.5 text-right text-xs text-muted-foreground tabular-nums">
                      {relativeTime(row.timestamp)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
```

**Step 2: Verify types compile**

Run: `pnpm typecheck`
Expected: PASS

**Step 3: Commit**

```bash
git add src/components/vm-detail-view.tsx
git commit -m "feat: add VMDetailView component with full history and metadata"
```

---

### Task 5: Wire detail views into page components

**Files:**
- Modify: `src/app/nodes/page.tsx`
- Modify: `src/app/vms/page.tsx`

**Step 1: Update Nodes page**

Replace `src/app/nodes/page.tsx` with:

```tsx
"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { NodeTable } from "@/components/node-table";
import { NodeDetailPanel } from "@/components/node-detail-panel";
import { NodeDetailView } from "@/components/node-detail-view";
import type { NodeStatus } from "@/api/types";

const VALID_NODE_STATUSES = new Set<string>([
  "healthy",
  "unreachable",
  "unknown",
  "removed",
]);

function NodesContent() {
  const searchParams = useSearchParams();
  const viewHash = searchParams.get("view");

  if (viewHash) {
    return <NodeDetailView hash={viewHash} />;
  }

  const statusParam = searchParams.get("status");
  const initialStatus =
    statusParam && VALID_NODE_STATUSES.has(statusParam)
      ? (statusParam as NodeStatus)
      : undefined;

  const hasVms = searchParams.get("hasVms") === "true";

  const sortParam = searchParams.get("sort");
  const orderParam = searchParams.get("order");
  const sortDirection = orderParam === "asc" ? "asc" : "desc";
  const initialSort =
    sortParam === "vms"
      ? { field: "vms" as const, direction: sortDirection as "asc" | "desc" }
      : undefined;

  const selectedParam = searchParams.get("selected");
  const [selectedNode, setSelectedNode] = useState<string | null>(
    selectedParam,
  );

  return (
    <div className="flex gap-6">
      <div className="flex-1 min-w-0">
        <NodeTable
          onSelectNode={setSelectedNode}
          initialStatus={initialStatus}
          initialHasVms={hasVms}
          initialSort={initialSort}
          selectedKey={selectedNode ?? undefined}
        />
      </div>
      {selectedNode && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/50 lg:hidden"
            onClick={() => setSelectedNode(null)}
            aria-hidden="true"
          />
          <div className="fixed inset-y-0 right-0 z-50 w-full max-w-sm overflow-y-auto bg-surface p-4 shadow-lg lg:static lg:z-auto lg:w-auto lg:max-w-none lg:overflow-visible lg:bg-transparent lg:p-0 lg:shadow-none">
            <NodeDetailPanel
              hash={selectedNode}
              onClose={() => setSelectedNode(null)}
            />
          </div>
        </>
      )}
    </div>
  );
}

export default function NodesPage() {
  return (
    <Suspense>
      <NodesContent />
    </Suspense>
  );
}
```

**Step 2: Update VMs page**

Replace `src/app/vms/page.tsx` with:

```tsx
"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { VMTable } from "@/components/vm-table";
import { VMDetailPanel } from "@/components/vm-detail-panel";
import { VMDetailView } from "@/components/vm-detail-view";
import type { VmStatus } from "@/api/types";

const VALID_VM_STATUSES = new Set<string>([
  "scheduled",
  "unscheduled",
  "orphaned",
  "missing",
  "unschedulable",
  "unknown",
]);

function VMsContent() {
  const searchParams = useSearchParams();
  const viewHash = searchParams.get("view");

  if (viewHash) {
    return <VMDetailView hash={viewHash} />;
  }

  const statusParam = searchParams.get("status");
  const initialStatus =
    statusParam && VALID_VM_STATUSES.has(statusParam)
      ? (statusParam as VmStatus)
      : undefined;

  const selectedParam = searchParams.get("selected");
  const [selectedVM, setSelectedVM] = useState<string | null>(selectedParam);

  return (
    <div className="flex gap-6">
      <div className="flex-1 min-w-0">
        <VMTable
          onSelectVM={setSelectedVM}
          initialStatus={initialStatus}
          selectedKey={selectedVM ?? undefined}
        />
      </div>
      {selectedVM && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/50 lg:hidden"
            onClick={() => setSelectedVM(null)}
            aria-hidden="true"
          />
          <div className="fixed inset-y-0 right-0 z-50 w-full max-w-sm overflow-y-auto bg-surface p-4 shadow-lg lg:static lg:z-auto lg:w-auto lg:max-w-none lg:overflow-visible lg:bg-transparent lg:p-0 lg:shadow-none">
            <VMDetailPanel
              hash={selectedVM}
              onClose={() => setSelectedVM(null)}
            />
          </div>
        </>
      )}
    </div>
  );
}

export default function VMsPage() {
  return (
    <Suspense>
      <VMsContent />
    </Suspense>
  );
}
```

**Step 3: Verify types compile**

Run: `pnpm typecheck`
Expected: PASS

**Step 4: Commit**

```bash
git add src/app/nodes/page.tsx src/app/vms/page.tsx
git commit -m "feat: wire detail views into nodes and VMs pages via ?view= param"
```

---

### Task 6: Add "View details" link to side panels

**Files:**
- Modify: `src/components/node-detail-panel.tsx`
- Modify: `src/components/vm-detail-panel.tsx`

**Step 1: Add link to NodeDetailPanel**

In `src/components/node-detail-panel.tsx`, add a `Link` import (already exists) and add a "View details" link at the bottom of the card, just before the closing `</Card>` tag (line 185):

After the history section (line 184, after the closing `})`), add:

```tsx
      <div className="mt-4 border-t border-edge pt-3">
        <Link
          href={`/nodes?view=${node.hash}`}
          className="text-sm font-medium text-primary-300 hover:underline"
        >
          View full details →
        </Link>
      </div>
```

**Step 2: Add link to VMDetailPanel**

In `src/components/vm-detail-panel.tsx`, add the same pattern before the closing `</Card>` tag (line 195):

After the history section (line 194, after the closing `})`), add:

```tsx
      <div className="mt-4 border-t border-edge pt-3">
        <Link
          href={`/vms?view=${vm.hash}`}
          className="text-sm font-medium text-primary-300 hover:underline"
        >
          View full details →
        </Link>
      </div>
```

**Step 3: Verify types compile**

Run: `pnpm typecheck`
Expected: PASS

**Step 4: Commit**

```bash
git add src/components/node-detail-panel.tsx src/components/vm-detail-panel.tsx
git commit -m "feat: add 'View full details' link to side panels"
```

---

### Task 7: Update AppHeader for dynamic detail view titles

**Files:**
- Modify: `src/components/app-header.tsx`

**Step 1: Add search params awareness**

The header needs to read `?view=` to show entity-specific titles. Update `src/components/app-header.tsx`:

```tsx
"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { ThemeToggle } from "@/components/theme-toggle";
import { truncateHash } from "@/lib/format";

const ROUTE_TITLES: Record<string, string> = {
  "/": "Overview",
  "/nodes": "Nodes",
  "/vms": "Virtual Machines",
  "/status": "API Status",
};

function usePageTitle(): string {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const normalized = pathname.replace(/\/$/, "") || "/";
  const viewHash = searchParams.get("view");

  if (viewHash) {
    if (normalized === "/nodes") {
      return `Node: ${truncateHash(viewHash, 12)}`;
    }
    if (normalized === "/vms") {
      return `VM: ${truncateHash(viewHash, 12)}`;
    }
  }

  return ROUTE_TITLES[normalized] ?? "Dashboard";
}

type AppHeaderProps = {
  onMenuClick: () => void;
};

export function AppHeader({ onMenuClick }: AppHeaderProps) {
  const title = usePageTitle();

  return (
    <header className="flex h-14 items-center justify-between border-b border-edge bg-surface px-4 md:px-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onMenuClick}
          className="text-muted-foreground hover:text-foreground md:hidden"
          aria-label="Open menu"
        >
          <svg
            className="size-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </button>
        <h1 className="text-lg font-bold">{title}</h1>
      </div>
      <div className="flex items-center gap-3">
        <ThemeToggle />
      </div>
    </header>
  );
}
```

Note: `AppHeader` is inside a `<Suspense>` boundary in the layout (check `src/app/layout.tsx`). If not, it needs to be wrapped since `useSearchParams()` requires Suspense in Next.js App Router. If the layout doesn't already wrap it, add a Suspense boundary.

**Step 2: Verify types compile**

Run: `pnpm typecheck`
Expected: PASS

**Step 3: Commit**

```bash
git add src/components/app-header.tsx
git commit -m "feat: show entity-specific titles in header for detail views"
```

---

### Task 8: Update cross-links in existing panels to use ?view=

**Files:**
- Modify: `src/components/node-detail-panel.tsx`
- Modify: `src/components/vm-detail-panel.tsx`

The side panels currently link to `?selected=` for cross-entity navigation. Update them to link to `?view=` instead, since clicking from a panel should open the full detail view of the linked entity.

**Step 1: Update NodeDetailPanel cross-links**

In `src/components/node-detail-panel.tsx`, change the VM links (line 145):

From: `href={`/vms?selected=${vm.hash}`}`
To: `href={`/vms?view=${vm.hash}`}`

**Step 2: Update VMDetailPanel cross-links**

In `src/components/vm-detail-panel.tsx`:

- Allocated node link (line 106): change `?selected=` to `?view=`
- Observed nodes links (line 128): change `?selected=` to `?view=`

**Step 3: Verify types compile**

Run: `pnpm typecheck`
Expected: PASS

**Step 4: Commit**

```bash
git add src/components/node-detail-panel.tsx src/components/vm-detail-panel.tsx
git commit -m "feat: update panel cross-links to navigate to detail views"
```

---

### Task 9: Verify full build and manual testing

**Step 1: Run full check suite**

Run: `pnpm check`
Expected: All lint, typecheck, and tests pass.

**Step 2: Run dev server and manual verification**

Run: `pnpm dev`

Manual test checklist:
- [ ] `/nodes` — table renders as before
- [ ] Click a node row — side panel opens with "View full details →" link
- [ ] Click "View full details →" — full detail view renders with all sections
- [ ] Header shows "Node: abc12..." for the detail view
- [ ] "← Nodes" back link returns to `/nodes`
- [ ] History table shows all events (no 10-row cap), with cross-linked VM hashes
- [ ] New fields (owner, IPv6, discovered at) appear when data is available
- [ ] `/vms` — table renders as before
- [ ] Click a VM row — side panel opens with "View full details →" link
- [ ] Click "View full details →" — full detail view renders
- [ ] Header shows "VM: abc12..." for the detail view
- [ ] "← Virtual Machines" back link returns to `/vms`
- [ ] History table shows all events with cross-linked node hashes
- [ ] New fields (payment type, allocated at, last observed) appear when data is available
- [ ] Cross-links between node and VM detail views work correctly
- [ ] Mobile: detail view is usable on small screens

**Step 3: Run static export**

Run: `pnpm build`
Expected: Static export succeeds without errors.

**Step 4: Commit any fixes**

If any fixes were needed, commit them.

---

### Task 10: Update docs

- [ ] `docs/ARCHITECTURE.md` — document `?view=` param pattern, new detail view components, updated API transform fields
- [ ] `docs/DECISIONS.md` — log decision to use search params over dynamic routes for IPFS compatibility
- [ ] `docs/BACKLOG.md` — add completed item for detail views, note resource charts placeholder
- [ ] `CLAUDE.md` — update Current Features list with detail view feature
