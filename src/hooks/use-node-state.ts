"use client";

import { useQuery } from "@tanstack/react-query";
import { getNodeState } from "@/api/client";

export function useNodeState() {
  return useQuery({
    queryKey: ["node-state"],
    queryFn: () => getNodeState(),
    staleTime: 60_000,
    refetchInterval: 60_000,
  });
}
