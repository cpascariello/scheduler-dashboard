import { useQuery } from "@tanstack/react-query";
import { getMessagesByHashes } from "@/api/client";

export function useVMCreationTimes(hashes: string[]) {
  return useQuery({
    queryKey: ["vm-creation-times", hashes],
    queryFn: () => getMessagesByHashes(hashes),
    enabled: hashes.length > 0,
    staleTime: 5 * 60_000,
    refetchInterval: false,
  });
}
