"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Badge } from "@aleph-front/ds/badge";
import { usePagination } from "@/hooks/use-pagination";
import { formatAleph, truncateHash } from "@/lib/format";
import type { RecipientTotal, DistributionSummary } from "@/api/credit-types";

const ROLE_VARIANTS: Record<string, "success" | "info" | "warning"> = {
  crn: "success",
  ccn: "info",
  staker: "warning",
};

const ROLE_LABELS: Record<string, string> = {
  crn: "CRN",
  ccn: "CCN",
  staker: "Staker",
};

type RoleFilter = "all" | "crn" | "ccn" | "staker";

type Props = {
  summary: DistributionSummary;
};

export function CreditRecipientTable({ summary }: Props) {
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    let items = summary.recipients;
    if (roleFilter !== "all") {
      items = items.filter((r) => r.roles.includes(roleFilter));
    }
    if (search) {
      const q = search.toLowerCase();
      items = items.filter(
        (r) =>
          r.address.toLowerCase().includes(q) ||
          (r.nodeHash?.toLowerCase().includes(q) ?? false) ||
          (r.nodeName?.toLowerCase().includes(q) ?? false),
      );
    }
    return items;
  }, [summary.recipients, roleFilter, search]);

  const { page, pageSize, setPage, setPageSize, totalPages, pageItems } =
    usePagination(filtered);

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex gap-1 rounded-lg bg-foreground/[0.04] p-1">
          {(["all", "crn", "ccn", "staker"] as const).map((r) => (
            <button
              key={r}
              onClick={() => { setRoleFilter(r); setPage(1); }}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                roleFilter === r
                  ? "bg-primary-600/15 text-primary-400"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {r === "all" ? "All" : ROLE_LABELS[r]}
            </button>
          ))}
        </div>
        <input
          type="text"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder="Search address, node..."
          className="rounded-lg border border-foreground/[0.08] bg-foreground/[0.03] px-3 py-1.5 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-primary-500/30"
        />
        <span className="ml-auto text-xs text-muted-foreground/50">
          {filtered.length} recipients
        </span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-foreground/[0.06]">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-foreground/[0.06] text-left text-xs font-semibold uppercase tracking-widest text-muted-foreground/50">
              <th className="px-4 py-3">Address</th>
              <th className="px-4 py-3">Roles</th>
              <th className="px-4 py-3">Node</th>
              <th className="px-4 py-3 text-right">CRN</th>
              <th className="px-4 py-3 text-right">CCN</th>
              <th className="px-4 py-3 text-right">Staking</th>
              <th className="px-4 py-3 text-right">Total</th>
              <th className="px-4 py-3 text-right">%</th>
            </tr>
          </thead>
          <tbody>
            {pageItems.map((r: RecipientTotal) => (
              <tr
                key={r.address}
                className="border-b border-foreground/[0.04] hover:bg-foreground/[0.02]"
              >
                <td className="px-4 py-3">
                  <Link
                    href={`/wallet?address=${r.address}`}
                    className="text-primary-400 hover:underline"
                  >
                    {truncateHash(r.address)}
                  </Link>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-1">
                    {r.roles.map((role) => (
                      <Badge key={role} variant={ROLE_VARIANTS[role]}>
                        {ROLE_LABELS[role]}
                      </Badge>
                    ))}
                  </div>
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {r.nodeName ?? (r.nodeHash ? truncateHash(r.nodeHash) : "—")}
                </td>
                <td className="px-4 py-3 text-right font-mono tabular-nums text-muted-foreground/60">
                  {r.crnAleph > 0 ? formatAleph(r.crnAleph) : "—"}
                </td>
                <td className="px-4 py-3 text-right font-mono tabular-nums text-muted-foreground/60">
                  {r.ccnAleph > 0 ? formatAleph(r.ccnAleph) : "—"}
                </td>
                <td className="px-4 py-3 text-right font-mono tabular-nums text-muted-foreground/60">
                  {r.stakerAleph > 0 ? formatAleph(r.stakerAleph) : "—"}
                </td>
                <td className="px-4 py-3 text-right font-mono tabular-nums font-bold">
                  {formatAleph(r.totalAleph)}
                </td>
                <td className="px-4 py-3 text-right font-mono tabular-nums text-muted-foreground">
                  {summary.distributedAleph > 0
                    ? `${((r.totalAleph / summary.distributedAleph) * 100).toFixed(1)}%`
                    : "—"}
                </td>
              </tr>
            ))}
            {pageItems.length === 0 && (
              <tr>
                <td
                  colSpan={8}
                  className="px-4 py-8 text-center text-muted-foreground/50"
                >
                  No recipients found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-xs text-muted-foreground/60">
          <div className="flex items-center gap-2">
            <span>Rows:</span>
            <select
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
              className="rounded border border-foreground/[0.08] bg-transparent px-1 py-0.5"
            >
              {[25, 50, 100].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(page - 1)}
              disabled={page <= 1}
              className="rounded px-2 py-1 hover:bg-foreground/[0.05] disabled:opacity-30"
            >
              Prev
            </button>
            <span>
              {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage(page + 1)}
              disabled={page >= totalPages}
              className="rounded px-2 py-1 hover:bg-foreground/[0.05] disabled:opacity-30"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
