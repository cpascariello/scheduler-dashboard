"use client";

import { Suspense, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Tabs, TabsList, TabsTrigger } from "@aleph-front/ds/tabs";
import { Skeleton } from "@aleph-front/ds/ui/skeleton";
import { useCreditExpenses } from "@/hooks/use-credit-expenses";
import { useNodeState } from "@/hooks/use-node-state";
import { computeDistributionSummary } from "@/lib/credit-distribution";
import { CreditSummaryBar } from "@/components/credit-summary-bar";
import { CreditFlowDiagram } from "@/components/credit-flow-diagram";
import { CreditRecipientTable } from "@/components/credit-recipient-table";
import { SlotRollNumber } from "@/components/slot-roll-number";

type Range = "24h" | "7d" | "30d";

const RANGE_SECONDS: Record<Range, number> = {
  "24h": 86400,
  "7d": 7 * 86400,
  "30d": 30 * 86400,
};

const RANGE_LABELS: Record<Range, string> = {
  "24h": "in the last 24 hours",
  "7d": "in the last 7 days",
  "30d": "in the last 30 days",
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
    <div>
      {/* Header */}
      <div className="mb-10">
        <h1 className="text-4xl">
          Credit Flow
        </h1>
        <p className="mt-2 text-base text-muted-foreground">
          How ALEPH from credit usage flows to CRNs, CCNs, and stakers
        </p>
      </div>

      {/* Date range tabs */}
      <Tabs value={range} onValueChange={(v) => setRange(v as Range)}>
        <TabsList variant="pill" size="sm">
          {(["24h", "7d", "30d"] as const).map((r) => (
            <TabsTrigger key={r} value={r}>
              {r}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* Summary cards */}
      <div className="mt-8">
        <CreditSummaryBar summary={summary} isLoading={isLoading} />
      </div>

      {/* Total ALEPH counter */}
      {!isLoading && summary && summary.totalAleph > 0 && (
        <div className="mt-12 text-center">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground/60">
            Total ALEPH Distributed
          </p>
          <p className="mt-2 font-heading text-5xl font-extrabold tracking-tight">
            <SlotRollNumber
              value={summary.totalAleph}
              decimals={2}
              className="font-mono tabular-nums"
              prefix={
                <span className="mr-1 text-3xl text-muted-foreground/50">
                  ℵ
                </span>
              }
              decimalClassName="text-3xl text-muted-foreground/50"
            />
          </p>
          <p className="mt-1 text-xs text-muted-foreground/50">
            {RANGE_LABELS[range]}
          </p>
        </div>
      )}

      {/* Flow diagram */}
      <div className="mt-8">
        {isLoading ? (
          <Skeleton className="h-[420px] w-full rounded-lg" />
        ) : summary ? (
          <CreditFlowDiagram summary={summary} />
        ) : null}
      </div>

      {/* Watermark */}
      {!isLoading && summary && (
        <p className="mt-4 text-center text-[10px] uppercase tracking-[0.3em] text-foreground/10">
          Powered by Aleph Cloud
        </p>
      )}

      {/* Recipient table */}
      <div className="mt-12">
        {isLoading ? (
          <Skeleton className="h-64 w-full rounded-lg" />
        ) : summary ? (
          <>
            <h2 className="mb-4 font-heading text-xl font-bold tracking-tight">
              Recipients
            </h2>
            <CreditRecipientTable summary={summary} />
          </>
        ) : null}
      </div>
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
