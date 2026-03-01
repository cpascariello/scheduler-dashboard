"use client";

import Link from "next/link";
import { Card } from "@aleph-front/ds/card";
import { Badge } from "@aleph-front/ds/badge";
import { Skeleton } from "@aleph-front/ds/ui/skeleton";
import { useOverviewStats } from "@/hooks/use-overview-stats";
import type { VMStatus } from "@/api/types";

type VMStatusRow = {
  label: string;
  status: VMStatus;
  count: number;
  variant: "default" | "success" | "warning" | "error" | "info";
};

export function VMAllocationSummary() {
  const { data: stats, isLoading } = useOverviewStats();

  if (isLoading) {
    return (
      <Card title="VM Allocation" padding="md" className="flex-1">
        <div className="space-y-2">
          {Array.from({ length: 5 }, (_, i) => (
            <Skeleton key={i} className="h-5 w-full" />
          ))}
        </div>
      </Card>
    );
  }

  if (!stats) return null;

  const rows: VMStatusRow[] = [
    { label: "Scheduled", status: "scheduled", count: stats.scheduledVMs, variant: "info" },
    { label: "Observed", status: "observed", count: stats.observedVMs, variant: "success" },
    { label: "Orphaned", status: "orphaned", count: stats.orphanedVMs, variant: "warning" },
    { label: "Missing", status: "missing", count: stats.missingVMs, variant: "error" },
    { label: "Unschedulable", status: "unschedulable", count: stats.unschedulableVMs, variant: "error" },
  ];

  return (
    <Card title="VM Allocation" padding="md" className="flex-1">
      <ul className="space-y-2">
        {rows.map((row) => (
          <li key={row.label}>
            <Link
              href={`/vms?status=${row.status}`}
              className="flex items-center justify-between rounded-md px-1.5 py-1 text-sm transition-colors hover:bg-muted"
              style={{ transitionDuration: "var(--duration-fast)" }}
            >
              <div className="flex items-center gap-2">
                <Badge variant={row.variant} size="sm">
                  {row.label}
                </Badge>
              </div>
              <span className="font-medium tabular-nums">{row.count}</span>
            </Link>
          </li>
        ))}
      </ul>

      <div className="mt-3 border-t border-edge pt-2">
        <div className="flex items-center justify-between text-sm font-medium">
          <span>Total</span>
          <span className="tabular-nums">{stats.totalVMs}</span>
        </div>
      </div>
    </Card>
  );
}
