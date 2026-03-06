import { describe, expect, it } from "vitest";
import {
  textSearch,
  countByStatus,
  applyNodeAdvancedFilters,
  applyVmAdvancedFilters,
} from "@/lib/filters";
import type { Node, VM } from "@/api/types";

const makeNode = (overrides: Partial<Node> = {}): Node => ({
  hash: "abc123def456",
  name: null,
  address: null,
  status: "healthy",
  staked: false,
  resources: null,
  vmCount: 0,
  updatedAt: "2026-01-01T00:00:00Z",
  owner: null,
  supportsIpv6: null,
  discoveredAt: null,
  ...overrides,
});

const makeVm = (overrides: Partial<VM> = {}): VM => ({
  hash: "vm_hash_001",
  type: "MicroVm",
  allocatedNode: null,
  observedNodes: [],
  status: "scheduled",
  requirements: { vcpus: 2, memoryMb: 1024, diskMb: 10000 },
  paymentStatus: null,
  updatedAt: "2026-01-01T00:00:00Z",
  allocatedAt: null,
  lastObservedAt: null,
  paymentType: null,
  ...overrides,
});

describe("textSearch", () => {
  const nodes = [
    makeNode({ hash: "aaaa1111", name: "alpha-node", owner: "0xOwnerA" }),
    makeNode({ hash: "bbbb2222", name: null, owner: "0xOwnerB" }),
    makeNode({ hash: "cccc3333", name: "gamma-node", owner: null }),
  ];

  it("returns all rows when query is empty", () => {
    const fields = (n: Node) => [n.hash, n.owner, n.name];
    expect(textSearch(nodes, "", fields)).toHaveLength(3);
  });

  it("matches hash substring case-insensitively", () => {
    const fields = (n: Node) => [n.hash, n.owner, n.name];
    expect(textSearch(nodes, "AAAA", fields)).toEqual([nodes[0]]);
  });

  it("matches owner field", () => {
    const fields = (n: Node) => [n.hash, n.owner, n.name];
    expect(textSearch(nodes, "ownerb", fields)).toEqual([nodes[1]]);
  });

  it("matches name field", () => {
    const fields = (n: Node) => [n.hash, n.owner, n.name];
    expect(textSearch(nodes, "gamma", fields)).toEqual([nodes[2]]);
  });

  it("skips null fields without error", () => {
    const fields = (n: Node) => [n.hash, n.owner, n.name];
    expect(textSearch(nodes, "null", fields)).toEqual([]);
  });
});

describe("countByStatus", () => {
  it("counts items grouped by status", () => {
    const items = [
      makeNode({ status: "healthy" }),
      makeNode({ status: "healthy" }),
      makeNode({ status: "unreachable" }),
    ];
    const counts = countByStatus(items, (n) => n.status);
    expect(counts).toEqual({
      healthy: 2,
      unreachable: 1,
    });
  });

  it("returns empty object for empty array", () => {
    expect(countByStatus([], (n: Node) => n.status)).toEqual({});
  });
});

describe("applyNodeAdvancedFilters", () => {
  it("filters by hasVms", () => {
    const nodes = [makeNode({ vmCount: 3 }), makeNode({ vmCount: 0 })];
    const result = applyNodeAdvancedFilters(nodes, { hasVms: true });
    expect(result).toHaveLength(1);
    expect(result[0]?.vmCount).toBe(3);
  });

  it("filters by staked", () => {
    const nodes = [
      makeNode({ staked: true }),
      makeNode({ staked: false }),
    ];
    const result = applyNodeAdvancedFilters(nodes, { staked: true });
    expect(result).toHaveLength(1);
  });

  it("filters by supportsIpv6", () => {
    const nodes = [
      makeNode({ supportsIpv6: true }),
      makeNode({ supportsIpv6: false }),
      makeNode({ supportsIpv6: null }),
    ];
    const result = applyNodeAdvancedFilters(nodes, {
      supportsIpv6: true,
    });
    expect(result).toHaveLength(1);
  });

  it("filters by minCpu", () => {
    const nodes = [
      makeNode({
        resources: {
          cpuUsagePct: 80,
          memoryUsagePct: 0,
          diskUsagePct: 0,
          vcpusTotal: 8,
          memoryTotalMb: 0,
          diskTotalMb: 0,
          vcpusAvailable: 2,
          memoryAvailableMb: 0,
          diskAvailableMb: 0,
        },
      }),
      makeNode({
        resources: {
          cpuUsagePct: 20,
          memoryUsagePct: 0,
          diskUsagePct: 0,
          vcpusTotal: 8,
          memoryTotalMb: 0,
          diskTotalMb: 0,
          vcpusAvailable: 6,
          memoryAvailableMb: 0,
          diskAvailableMb: 0,
        },
      }),
      makeNode({ resources: null }),
    ];
    const result = applyNodeAdvancedFilters(nodes, { minCpu: 50 });
    expect(result).toHaveLength(1);
    expect(result[0]?.resources?.cpuUsagePct).toBe(80);
  });

  it("combines multiple filters with AND logic", () => {
    const nodes = [
      makeNode({ vmCount: 3, staked: true }),
      makeNode({ vmCount: 3, staked: false }),
      makeNode({ vmCount: 0, staked: true }),
    ];
    const result = applyNodeAdvancedFilters(nodes, {
      hasVms: true,
      staked: true,
    });
    expect(result).toHaveLength(1);
  });

  it("returns all when no filters active", () => {
    const nodes = [makeNode(), makeNode()];
    expect(applyNodeAdvancedFilters(nodes, {})).toHaveLength(2);
  });
});

describe("applyVmAdvancedFilters", () => {
  it("filters by vmTypes", () => {
    const vms = [
      makeVm({ type: "MicroVm" }),
      makeVm({ type: "PersistentProgram" }),
      makeVm({ type: "Instance" }),
    ];
    const result = applyVmAdvancedFilters(vms, {
      vmTypes: new Set(["MicroVm", "Instance"]),
    });
    expect(result).toHaveLength(2);
  });

  it("does not filter when vmTypes includes all types", () => {
    const vms = [makeVm({ type: "MicroVm" })];
    const result = applyVmAdvancedFilters(vms, {
      vmTypes: new Set(["MicroVm", "PersistentProgram", "Instance"]),
    });
    expect(result).toHaveLength(1);
  });

  it("filters by paymentStatuses", () => {
    const vms = [
      makeVm({ paymentStatus: "validated" }),
      makeVm({ paymentStatus: "invalidated" }),
      makeVm({ paymentStatus: null }),
    ];
    const result = applyVmAdvancedFilters(vms, {
      paymentStatuses: new Set(["validated"]),
    });
    expect(result).toHaveLength(1);
  });

  it("filters by hasAllocatedNode", () => {
    const vms = [
      makeVm({ allocatedNode: "node_abc" }),
      makeVm({ allocatedNode: null }),
    ];
    const result = applyVmAdvancedFilters(vms, {
      hasAllocatedNode: true,
    });
    expect(result).toHaveLength(1);
  });

  it("filters by minVcpus", () => {
    const vms = [
      makeVm({ requirements: { vcpus: 4, memoryMb: 1024, diskMb: 0 } }),
      makeVm({ requirements: { vcpus: 1, memoryMb: 1024, diskMb: 0 } }),
      makeVm({
        requirements: { vcpus: null, memoryMb: null, diskMb: null },
      }),
    ];
    const result = applyVmAdvancedFilters(vms, { minVcpus: 2 });
    expect(result).toHaveLength(1);
    expect(result[0]?.requirements.vcpus).toBe(4);
  });

  it("filters by minMemoryMb", () => {
    const vms = [
      makeVm({ requirements: { vcpus: 2, memoryMb: 2048, diskMb: 0 } }),
      makeVm({ requirements: { vcpus: 2, memoryMb: 512, diskMb: 0 } }),
    ];
    const result = applyVmAdvancedFilters(vms, { minMemoryMb: 1024 });
    expect(result).toHaveLength(1);
  });

  it("returns all when no filters active", () => {
    const vms = [makeVm(), makeVm()];
    expect(applyVmAdvancedFilters(vms, {})).toHaveLength(2);
  });
});
