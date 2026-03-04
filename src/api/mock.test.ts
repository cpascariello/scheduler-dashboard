import { describe, expect, it } from "vitest";
import {
  mockHistory,
  mockNodes,
  mockOverviewStats,
  mockVMs,
} from "@/api/mock";

describe("mock data integrity", () => {
  it("every VM allocatedNode references an existing node", () => {
    const nodeHashes = new Set(mockNodes.map((n) => n.hash));
    for (const vm of mockVMs) {
      if (vm.allocatedNode) {
        expect(
          nodeHashes.has(vm.allocatedNode),
          `VM ${vm.hash} references unknown node ${vm.allocatedNode}`,
        ).toBe(true);
      }
    }
  });

  it("every history row references a valid VM hash", () => {
    const vmHashes = new Set(mockVMs.map((v) => v.hash));
    for (const row of mockHistory) {
      expect(
        vmHashes.has(row.vmHash),
        `History row ${row.id} references unknown VM ${row.vmHash}`,
      ).toBe(true);
    }
  });

  it("every history row references a valid node hash", () => {
    const nodeHashes = new Set(mockNodes.map((n) => n.hash));
    for (const row of mockHistory) {
      expect(
        nodeHashes.has(row.nodeHash),
        `History row ${row.id} references unknown node ${row.nodeHash}`,
      ).toBe(true);
    }
  });

  it("overview stats match computed values from arrays", () => {
    expect(mockOverviewStats.totalNodes).toBe(mockNodes.length);
    expect(mockOverviewStats.healthyNodes).toBe(
      mockNodes.filter((n) => n.status === "healthy").length,
    );
    expect(mockOverviewStats.unreachableNodes).toBe(
      mockNodes.filter((n) => n.status === "unreachable").length,
    );
    expect(mockOverviewStats.totalVMs).toBe(mockVMs.length);
    expect(mockOverviewStats.scheduledVMs).toBe(
      mockVMs.filter((v) => v.status === "scheduled").length,
    );
    expect(mockOverviewStats.orphanedVMs).toBe(
      mockVMs.filter((v) => v.status === "orphaned").length,
    );
    expect(mockOverviewStats.missingVMs).toBe(
      mockVMs.filter((v) => v.status === "missing").length,
    );
    expect(mockOverviewStats.unschedulableVMs).toBe(
      mockVMs.filter((v) => v.status === "unschedulable").length,
    );
  });
});
