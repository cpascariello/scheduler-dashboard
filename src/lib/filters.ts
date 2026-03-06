import type { Node, VM, VmType } from "@/api/types";

/** Generic text search: matches if any field contains the query. */
export function textSearch<T>(
  items: T[],
  query: string,
  fields: (item: T) => (string | null | undefined)[],
): T[] {
  const q = query.trim().toLowerCase();
  if (!q) return items;
  return items.filter((item) =>
    fields(item).some((f) => f?.toLowerCase().includes(q)),
  );
}

/** Count items grouped by a key extractor. */
export function countByStatus<T>(
  items: T[],
  getStatus: (item: T) => string,
): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const item of items) {
    const s = getStatus(item);
    counts[s] = (counts[s] ?? 0) + 1;
  }
  return counts;
}

// --- Node advanced filters ---

export type NodeAdvancedFilters = {
  hasVms?: boolean;
  staked?: boolean;
  supportsIpv6?: boolean;
  minCpu?: number;
  minMemory?: number;
  minDisk?: number;
};

export function applyNodeAdvancedFilters(
  nodes: Node[],
  filters: NodeAdvancedFilters,
): Node[] {
  let result = nodes;
  if (filters.hasVms) {
    result = result.filter((n) => n.vmCount > 0);
  }
  if (filters.staked) {
    result = result.filter((n) => n.staked);
  }
  if (filters.supportsIpv6) {
    result = result.filter((n) => n.supportsIpv6 === true);
  }
  if (filters.minCpu != null) {
    result = result.filter(
      (n) => (n.resources?.cpuUsagePct ?? 0) >= filters.minCpu!,
    );
  }
  if (filters.minMemory != null) {
    result = result.filter(
      (n) => (n.resources?.memoryUsagePct ?? 0) >= filters.minMemory!,
    );
  }
  if (filters.minDisk != null) {
    result = result.filter(
      (n) => (n.resources?.diskUsagePct ?? 0) >= filters.minDisk!,
    );
  }
  return result;
}

// --- VM advanced filters ---

export type VmAdvancedFilters = {
  vmTypes?: Set<VmType>;
  paymentStatuses?: Set<string>;
  hasAllocatedNode?: boolean;
  minVcpus?: number;
  minMemoryMb?: number;
};

const ALL_VM_TYPES: Set<VmType> = new Set([
  "MicroVm",
  "PersistentProgram",
  "Instance",
]);

export function applyVmAdvancedFilters(
  vms: VM[],
  filters: VmAdvancedFilters,
): VM[] {
  let result = vms;
  if (filters.vmTypes && filters.vmTypes.size < ALL_VM_TYPES.size) {
    result = result.filter((v) => filters.vmTypes!.has(v.type));
  }
  if (filters.paymentStatuses) {
    result = result.filter(
      (v) =>
        v.paymentStatus != null &&
        filters.paymentStatuses!.has(v.paymentStatus),
    );
  }
  if (filters.hasAllocatedNode) {
    result = result.filter((v) => v.allocatedNode != null);
  }
  if (filters.minVcpus != null) {
    result = result.filter(
      (v) => (v.requirements.vcpus ?? 0) >= filters.minVcpus!,
    );
  }
  if (filters.minMemoryMb != null) {
    result = result.filter(
      (v) => (v.requirements.memoryMb ?? 0) >= filters.minMemoryMb!,
    );
  }
  return result;
}
