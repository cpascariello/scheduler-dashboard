"use client";

import { useQuery } from "@tanstack/react-query";
import { getCreditExpenses } from "@/api/client";

export function useCreditExpenses(startDate: number, endDate: number) {
  return useQuery({
    queryKey: ["credit-expenses", startDate, endDate],
    queryFn: () => getCreditExpenses(startDate, endDate),
    staleTime: 5 * 60_000,
    refetchInterval: false,
    enabled: startDate > 0 && endDate > startDate,
  });
}
