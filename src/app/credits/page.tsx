"use client";

import { Suspense, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Skeleton } from "@aleph-front/ds/ui/skeleton";
import { useCreditExpenses } from "@/hooks/use-credit-expenses";
import { useNodeState } from "@/hooks/use-node-state";
import { computeDistributionSummary } from "@/lib/credit-distribution";
import { CreditSummaryBar } from "@/components/credit-summary-bar";
import { CreditFlowDiagram } from "@/components/credit-flow-diagram";
import { CreditRecipientTable } from "@/components/credit-recipient-table";

type Range = "24h" | "7d" | "30d";

const RANGE_SECONDS: Record<Range, number> = {
  "24h": 86400,
  "7d": 7 * 86400,
  "30d": 30 * 86400,
};

function CreditsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const range = (searchParams.get("range") as Range) ?? "7d";

  // Stable timestamps — only recompute when range changes, not every render
  const [endDate] = useState(() => Math.floor(Date.now() / 1000));
  const startDate = endDate - (RANGE_SECONDS[range] ?? RANGE_SECONDS["7d"]);

  const { data: expenses, isLoading: expensesLoading } = useCreditExpenses(
    startDate,
    endDate,
  );
  const { data: nodeState, isLoading: nodeStateLoading } = useNodeState();

  const isLoading = expensesLoading || nodeStateLoading;

  const summary = useMemo(() => {
    if (!expenses || !nodeState) return undefined;
    return computeDistributionSummary(expenses, nodeState);
  }, [expenses, nodeState]);

  function setRange(r: Range) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("range", r);
    router.replace(`/credits?${params.toString()}`);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-heading text-3xl font-extrabold tracking-tight">
          Credit Flow
        </h1>
        <p className="mt-1 text-sm text-muted-foreground/60">
          How ALEPH from credit usage flows to CRNs, CCNs, and stakers
        </p>
      </div>

      {/* Date range tabs */}
      <div className="flex gap-1 rounded-lg bg-foreground/[0.04] p-1 w-fit">
        {(["24h", "7d", "30d"] as const).map((r) => (
          <button
            key={r}
            onClick={() => setRange(r)}
            className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              range === r
                ? "bg-primary-600/15 text-primary-400"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {r}
          </button>
        ))}
      </div>

      {/* Summary cards */}
      <CreditSummaryBar summary={summary} isLoading={isLoading} />

      {/* Flow diagram */}
      {isLoading ? (
        <Skeleton className="h-[420px] w-full rounded-lg" />
      ) : summary ? (
        <CreditFlowDiagram summary={summary} />
      ) : null}

      {/* Recipient table */}
      {isLoading ? (
        <Skeleton className="h-64 w-full rounded-lg" />
      ) : summary ? (
        <div>
          <h2 className="mb-4 font-heading text-xl font-bold tracking-tight">
            Recipients
          </h2>
          <CreditRecipientTable summary={summary} />
        </div>
      ) : null}
    </div>
  );
}

export default function CreditsPage() {
  return (
    <Suspense fallback={<Skeleton className="h-96 w-full" />}>
      <CreditsContent />
    </Suspense>
  );
}
