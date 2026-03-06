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

/** Check if a range filter is active (not spanning the full 0–100). */
export function isRangeActive(range: [number, number]): boolean {
  return range[0] > 0 || range[1] < 100;
}

// --- Node advanced filters ---

export type NodeAdvancedFilters = {
  hasVms?: boolean;
  staked?: boolean;
  supportsIpv6?: boolean;
  cpuRange?: [number, number];
  memoryRange?: [number, number];
  diskRange?: [number, number];
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
  if (filters.cpuRange && isRangeActive(filters.cpuRange)) {
    const [min, max] = filters.cpuRange;
    result = result.filter((n) => {
      const v = n.resources?.cpuUsagePct ?? 0;
      return v >= min && v <= max;
    });
  }
  if (filters.memoryRange && isRangeActive(filters.memoryRange)) {
    const [min, max] = filters.memoryRange;
    result = result.filter((n) => {
      const v = n.resources?.memoryUsagePct ?? 0;
      return v >= min && v <= max;
    });
  }
  if (filters.diskRange && isRangeActive(filters.diskRange)) {
    const [min, max] = filters.diskRange;
    result = result.filter((n) => {
      const v = n.resources?.diskUsagePct ?? 0;
      return v >= min && v <= max;
    });
  }
  return result;
}

// --- VM advanced filters ---

export type VmAdvancedFilters = {
  vmTypes?: Set<VmType>;
  paymentStatuses?: Set<string>;
  hasAllocatedNode?: boolean;
  vcpusRange?: [number, number];
  memoryMbRange?: [number, number];
};

export const VM_VCPUS_MAX = 32;
export const VM_MEMORY_MB_MAX = 65536;

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
  if (filters.vcpusRange) {
    const [min, max] = filters.vcpusRange;
    if (min > 0 || max < VM_VCPUS_MAX) {
      result = result.filter((v) => {
        const val = v.requirements.vcpus ?? 0;
        return val >= min && val <= max;
      });
    }
  }
  if (filters.memoryMbRange) {
    const [min, max] = filters.memoryMbRange;
    if (min > 0 || max < VM_MEMORY_MB_MAX) {
      result = result.filter((v) => {
        const val = v.requirements.memoryMb ?? 0;
        return val >= min && val <= max;
      });
    }
  }
  return result;
}
