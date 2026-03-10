import { useQuery } from "@tanstack/react-query";
import { checkHealth } from "@/api/client";

export function useHealth() {
  return useQuery({
    queryKey: ["health"],
    queryFn: checkHealth,
    refetchInterval: 30_000,
  });
}
