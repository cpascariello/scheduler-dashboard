"use client";

import { useMemo } from "react";
import { useCreditExpenses } from "@/hooks/use-credit-expenses";
import { useNodeState } from "@/hooks/use-node-state";
import { computeWalletRewards } from "@/lib/credit-distribution";

/** Round to nearest 5 minutes so the query key stays stable across mounts. */
function stable24hRange() {
  const now = Math.floor(Date.now() / 1000);
  const end = Math.floor(now / 300) * 300;
  return { start: end - 86400, end };
}

export function useWalletRewards(address: string) {
  const { start, end } = useMemo(stable24hRange, []);
  const { data: expenses, isLoading: expensesLoading } = useCreditExpenses(
    start,
    end,
  );
  const { data: nodeState, isLoading: nodeStateLoading } = useNodeState();

  const rewards = useMemo(() => {
    if (!expenses || !nodeState || !address) return undefined;
    return computeWalletRewards(address, expenses, nodeState);
  }, [address, expenses, nodeState]);

  return {
    rewards,
    isLoading: expensesLoading || nodeStateLoading,
  };
}
