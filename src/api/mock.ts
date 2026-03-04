import type {
  HistoryRow,
  Node,
  NodeDetail,
  OverviewStats,
  VM,
  VmDetail,
  VmType,
} from "@/api/types";

// --- Nodes (15 total: 9 healthy, 3 unreachable, 2 unknown, 1 removed) ---

export const mockNodes: Node[] = [
  {
    hash: "a1b2c3d4e5f6",
    name: "crn-01",
    address: "https://node-01.aleph.cloud",
    status: "healthy",
    staked: true,
    resources: {
      vcpusTotal: 32,
      memoryTotalMb: 131072,
      diskTotalMb: 2000000,
      vcpusAvailable: 18,
      memoryAvailableMb: 49807,
      diskAvailableMb: 1240000,
      cpuUsagePct: 44,
      memoryUsagePct: 62,
      diskUsagePct: 38,
    },
    vmCount: 5,
    updatedAt: "2026-03-01T14:30:00Z",
  },
  {
    hash: "b2c3d4e5f6a7",
    name: "crn-02",
    address: "https://node-02.aleph.cloud",
    status: "healthy",
    staked: true,
    resources: {
      vcpusTotal: 64,
      memoryTotalMb: 262144,
      diskTotalMb: 4000000,
      vcpusAvailable: 46,
      memoryAvailableMb: 154665,
      diskAvailableMb: 3120000,
      cpuUsagePct: 28,
      memoryUsagePct: 41,
      diskUsagePct: 22,
    },
    vmCount: 8,
    updatedAt: "2026-03-01T14:29:55Z",
  },
  {
    hash: "c3d4e5f6a7b8",
    name: "crn-03",
    address: "https://node-03.aleph.cloud",
    status: "healthy",
    staked: true,
    resources: {
      vcpusTotal: 16,
      memoryTotalMb: 65536,
      diskTotalMb: 1000000,
      vcpusAvailable: 4,
      memoryAvailableMb: 9830,
      diskAvailableMb: 450000,
      cpuUsagePct: 75,
      memoryUsagePct: 85,
      diskUsagePct: 55,
    },
    vmCount: 3,
    updatedAt: "2026-03-01T14:30:02Z",
  },
  {
    hash: "d4e5f6a7b8c9",
    name: "crn-04",
    address: "https://node-04.aleph.cloud",
    status: "healthy",
    staked: true,
    resources: {
      vcpusTotal: 32,
      memoryTotalMb: 131072,
      diskTotalMb: 2000000,
      vcpusAvailable: 27,
      memoryAvailableMb: 102196,
      diskAvailableMb: 1640000,
      cpuUsagePct: 16,
      memoryUsagePct: 22,
      diskUsagePct: 18,
    },
    vmCount: 2,
    updatedAt: "2026-03-01T14:29:58Z",
  },
  {
    hash: "e5f6a7b8c9d0",
    name: "crn-05",
    address: "https://node-05.aleph.cloud",
    status: "healthy",
    staked: true,
    resources: {
      vcpusTotal: 48,
      memoryTotalMb: 196608,
      diskTotalMb: 3000000,
      vcpusAvailable: 22,
      memoryAvailableMb: 102236,
      diskAvailableMb: 1740000,
      cpuUsagePct: 54,
      memoryUsagePct: 48,
      diskUsagePct: 42,
    },
    vmCount: 6,
    updatedAt: "2026-03-01T14:30:01Z",
  },
  {
    hash: "f6a7b8c9d0e1",
    name: "crn-06",
    address: "https://node-06.aleph.cloud",
    status: "healthy",
    staked: true,
    resources: {
      vcpusTotal: 32,
      memoryTotalMb: 131072,
      diskTotalMb: 2000000,
      vcpusAvailable: 20,
      memoryAvailableMb: 58982,
      diskAvailableMb: 1400000,
      cpuUsagePct: 38,
      memoryUsagePct: 55,
      diskUsagePct: 30,
    },
    vmCount: 4,
    updatedAt: "2026-03-01T14:29:50Z",
  },
  {
    hash: "a7b8c9d0e1f2",
    name: "crn-07",
    address: "https://node-07.aleph.cloud",
    status: "healthy",
    staked: true,
    resources: {
      vcpusTotal: 64,
      memoryTotalMb: 262144,
      diskTotalMb: 4000000,
      vcpusAvailable: 51,
      memoryAvailableMb: 170394,
      diskAvailableMb: 3400000,
      cpuUsagePct: 20,
      memoryUsagePct: 35,
      diskUsagePct: 15,
    },
    vmCount: 3,
    updatedAt: "2026-03-01T14:30:00Z",
  },
  {
    hash: "b8c9d0e1f2a3",
    name: "crn-08",
    address: "https://node-08.aleph.cloud",
    status: "healthy",
    staked: true,
    resources: {
      vcpusTotal: 16,
      memoryTotalMb: 65536,
      diskTotalMb: 1000000,
      vcpusAvailable: 2,
      memoryAvailableMb: 5243,
      diskAvailableMb: 300000,
      cpuUsagePct: 88,
      memoryUsagePct: 92,
      diskUsagePct: 70,
    },
    vmCount: 4,
    updatedAt: "2026-03-01T14:29:45Z",
  },
  {
    hash: "c9d0e1f2a3b4",
    name: "crn-09",
    address: "https://node-09.aleph.cloud",
    status: "healthy",
    staked: true,
    resources: {
      vcpusTotal: 32,
      memoryTotalMb: 131072,
      diskTotalMb: 2000000,
      vcpusAvailable: 13,
      memoryAvailableMb: 39322,
      diskAvailableMb: 1100000,
      cpuUsagePct: 59,
      memoryUsagePct: 70,
      diskUsagePct: 45,
    },
    vmCount: 5,
    updatedAt: "2026-03-01T14:30:03Z",
  },
  {
    hash: "d0e1f2a3b4c5",
    name: "crn-10",
    address: "https://node-10.aleph.cloud",
    status: "unreachable",
    staked: true,
    resources: {
      vcpusTotal: 32,
      memoryTotalMb: 131072,
      diskTotalMb: 2000000,
      vcpusAvailable: 2,
      memoryAvailableMb: 15729,
      diskAvailableMb: 360000,
      cpuUsagePct: 94,
      memoryUsagePct: 88,
      diskUsagePct: 82,
    },
    vmCount: 3,
    updatedAt: "2026-03-01T14:28:30Z",
  },
  {
    hash: "e1f2a3b4c5d6",
    name: "crn-11",
    address: "https://node-11.aleph.cloud",
    status: "unreachable",
    staked: true,
    resources: {
      vcpusTotal: 16,
      memoryTotalMb: 65536,
      diskTotalMb: 1000000,
      vcpusAvailable: 4,
      memoryAvailableMb: 3277,
      diskAvailableMb: 100000,
      cpuUsagePct: 75,
      memoryUsagePct: 95,
      diskUsagePct: 90,
    },
    vmCount: 2,
    updatedAt: "2026-03-01T14:27:00Z",
  },
  {
    hash: "f2a3b4c5d6e7",
    name: "crn-12",
    address: "https://node-12.aleph.cloud",
    status: "unreachable",
    staked: true,
    resources: {
      vcpusTotal: 48,
      memoryTotalMb: 196608,
      diskTotalMb: 3000000,
      vcpusAvailable: 4,
      memoryAvailableMb: 29491,
      diskAvailableMb: 660000,
      cpuUsagePct: 92,
      memoryUsagePct: 85,
      diskUsagePct: 78,
    },
    vmCount: 1,
    updatedAt: "2026-03-01T14:25:00Z",
  },
  {
    hash: "a3b4c5d6e7f8",
    name: "crn-13",
    address: "https://node-13.aleph.cloud",
    status: "unknown",
    staked: true,
    resources: null,
    vmCount: 0,
    updatedAt: "2026-03-01T12:00:00Z",
  },
  {
    hash: "b4c5d6e7f8a9",
    name: "crn-14",
    address: "https://node-14.aleph.cloud",
    status: "unknown",
    staked: false,
    resources: null,
    vmCount: 0,
    updatedAt: "2026-02-28T22:15:00Z",
  },
  {
    hash: "c5d6e7f8a9b0",
    name: null,
    address: null,
    status: "removed",
    staked: false,
    resources: null,
    vmCount: 0,
    updatedAt: "2026-02-28T18:00:00Z",
  },
];

// --- VMs (43 total) ---
// 25 scheduled, 2 unscheduled, 3 orphaned, 4 missing,
// 3 unschedulable, 3 unknown, 3 extra for variety

function makeVm(
  hash: string,
  node: string | null,
  type: VmType,
  status: VM["status"],
  vcpus: number,
  memMb: number,
  diskMb: number,
): VM {
  return {
    hash,
    type,
    allocatedNode: node,
    observedNodes: node ? [node] : [],
    status,
    requirements: { vcpus, memoryMb: memMb, diskMb },
    paymentStatus: node ? "validated" : null,
    updatedAt: "2026-03-01T14:30:00Z",
  };
}

export const mockVMs: VM[] = [
  // 25 scheduled (allocated + observed)
  makeVm("vm01a2b3c4d5e6", "a1b2c3d4e5f6", "Instance", "scheduled", 4, 8192, 100000),
  makeVm("vm02b3c4d5e6f7", "a1b2c3d4e5f6", "Instance", "scheduled", 4, 8192, 100000),
  makeVm("vm03c4d5e6f7a8", "a1b2c3d4e5f6", "PersistentProgram", "scheduled", 2, 4096, 50000),
  makeVm("vm04d5e6f7a8b9", "a1b2c3d4e5f6", "Instance", "scheduled", 4, 8192, 100000),
  makeVm("vm05e6f7a8b9c0", "a1b2c3d4e5f6", "PersistentProgram", "scheduled", 2, 4096, 50000),
  makeVm("vm06f7a8b9c0d1", "b2c3d4e5f6a7", "Instance", "scheduled", 4, 8192, 100000),
  makeVm("vm07a8b9c0d1e2", "b2c3d4e5f6a7", "Instance", "scheduled", 4, 8192, 100000),
  makeVm("vm08b9c0d1e2f3", "b2c3d4e5f6a7", "PersistentProgram", "scheduled", 2, 4096, 50000),
  makeVm("vm09c0d1e2f3a4", "b2c3d4e5f6a7", "Instance", "scheduled", 4, 8192, 100000),
  makeVm("vm10d1e2f3a4b5", "b2c3d4e5f6a7", "Instance", "scheduled", 4, 8192, 100000),
  makeVm("vm11e2f3a4b5c6", "b2c3d4e5f6a7", "PersistentProgram", "scheduled", 2, 4096, 50000),
  makeVm("vm12f3a4b5c6d7", "b2c3d4e5f6a7", "Instance", "scheduled", 4, 8192, 100000),
  makeVm("vm13a4b5c6d7e8", "b2c3d4e5f6a7", "MicroVm", "scheduled", 1, 2048, 20000),
  makeVm("vm14b5c6d7e8f9", "c3d4e5f6a7b8", "Instance", "scheduled", 4, 8192, 100000),
  makeVm("vm15c6d7e8f9a0", "c3d4e5f6a7b8", "Instance", "scheduled", 4, 8192, 100000),
  makeVm("vm16d7e8f9a0b1", "c3d4e5f6a7b8", "PersistentProgram", "scheduled", 2, 4096, 50000),
  makeVm("vm17e8f9a0b1c2", "d4e5f6a7b8c9", "Instance", "scheduled", 4, 8192, 100000),
  makeVm("vm18f9a0b1c2d3", "d4e5f6a7b8c9", "Instance", "scheduled", 4, 8192, 100000),
  makeVm("vm19a0b1c2d3e4", "e5f6a7b8c9d0", "Instance", "scheduled", 4, 8192, 100000),
  makeVm("vm20b1c2d3e4f5", "e5f6a7b8c9d0", "PersistentProgram", "scheduled", 2, 4096, 50000),
  makeVm("vm21c2d3e4f5a6", "e5f6a7b8c9d0", "Instance", "scheduled", 4, 8192, 100000),
  makeVm("vm22d3e4f5a6b7", "e5f6a7b8c9d0", "Instance", "scheduled", 4, 8192, 100000),
  makeVm("vm23e4f5a6b7c8", "e5f6a7b8c9d0", "MicroVm", "scheduled", 1, 2048, 20000),
  makeVm("vm24f5a6b7c8d9", "e5f6a7b8c9d0", "Instance", "scheduled", 4, 8192, 100000),
  makeVm("vm25a6b7c8d9e0", "f6a7b8c9d0e1", "Instance", "scheduled", 4, 8192, 100000),

  // 2 unscheduled (were running, now deallocated)
  makeVm("vm26b7c8d9e0f1", null, "Instance", "unscheduled", 4, 8192, 100000),
  makeVm("vm27c8d9e0f1a2", null, "PersistentProgram", "unscheduled", 2, 4096, 50000),

  // 3 orphaned (observed on node but not in schedule)
  makeVm("vm31a2b3c4d5e6", "d0e1f2a3b4c5", "Instance", "orphaned", 4, 8192, 100000),
  makeVm("vm32b3c4d5e6f7", "d0e1f2a3b4c5", "PersistentProgram", "orphaned", 2, 4096, 50000),
  makeVm("vm33c4d5e6f7a8", "e1f2a3b4c5d6", "Instance", "orphaned", 4, 8192, 100000),

  // 4 missing (scheduled but not observed)
  makeVm("vm34d5e6f7a8b9", "a3b4c5d6e7f8", "Instance", "missing", 4, 8192, 100000),
  makeVm("vm35e6f7a8b9c0", "a3b4c5d6e7f8", "PersistentProgram", "missing", 2, 4096, 50000),
  makeVm("vm36f7a8b9c0d1", "b4c5d6e7f8a9", "Instance", "missing", 4, 8192, 100000),
  makeVm("vm37a8b9c0d1e2", "e1f2a3b4c5d6", "Instance", "missing", 4, 8192, 100000),

  // 3 unschedulable (no suitable node)
  makeVm("vm38b9c0d1e2f3", null, "Instance", "unschedulable", 128, 524288, 10000000),
  makeVm("vm39c0d1e2f3a4", null, "Instance", "unschedulable", 128, 524288, 10000000),
  makeVm("vm40d1e2f3a4b5", null, "PersistentProgram", "unschedulable", 64, 262144, 10000000),

  // 3 unknown
  makeVm("vm41e2f3a4b5c6", null, "MicroVm", "unknown", 1, 2048, 20000),
  makeVm("vm42f3a4b5c6d7", null, "Instance", "unknown", 4, 8192, 100000),
  makeVm("vm43a4b5c6d7e8", null, "PersistentProgram", "unknown", 2, 4096, 50000),
];

// --- History (40 entries) ---

export const mockHistory: HistoryRow[] = [
  { id: 1, vmHash: "vm01a2b3c4d5e6", nodeHash: "a1b2c3d4e5f6", action: "scheduled", reason: null, timestamp: "2026-03-01T14:30:00Z" },
  { id: 2, vmHash: "vm06f7a8b9c0d1", nodeHash: "b2c3d4e5f6a7", action: "scheduled", reason: null, timestamp: "2026-03-01T14:29:30Z" },
  { id: 3, vmHash: "vm14b5c6d7e8f9", nodeHash: "d0e1f2a3b4c5", action: "migrated_from", reason: "NodeUnhealthy", timestamp: "2026-03-01T14:29:00Z" },
  { id: 4, vmHash: "vm14b5c6d7e8f9", nodeHash: "c3d4e5f6a7b8", action: "migrated_to", reason: "NodeUnhealthy", timestamp: "2026-03-01T14:29:00Z" },
  { id: 5, vmHash: "vm31a2b3c4d5e6", nodeHash: "d0e1f2a3b4c5", action: "scheduled", reason: null, timestamp: "2026-03-01T14:28:45Z" },
  { id: 6, vmHash: "vm34d5e6f7a8b9", nodeHash: "a3b4c5d6e7f8", action: "scheduled", reason: null, timestamp: "2026-03-01T14:28:15Z" },
  { id: 7, vmHash: "vm26b7c8d9e0f1", nodeHash: "f6a7b8c9d0e1", action: "unscheduled", reason: "PaymentFailed", timestamp: "2026-03-01T14:27:30Z" },
  { id: 8, vmHash: "vm27c8d9e0f1a2", nodeHash: "a7b8c9d0e1f2", action: "unscheduled", reason: "Deleted", timestamp: "2026-03-01T14:27:00Z" },
  { id: 9, vmHash: "vm02b3c4d5e6f7", nodeHash: "a1b2c3d4e5f6", action: "scheduled", reason: null, timestamp: "2026-03-01T14:26:30Z" },
  { id: 10, vmHash: "vm07a8b9c0d1e2", nodeHash: "b2c3d4e5f6a7", action: "scheduled", reason: null, timestamp: "2026-03-01T14:26:00Z" },
  { id: 11, vmHash: "vm25a6b7c8d9e0", nodeHash: "e1f2a3b4c5d6", action: "migrated_from", reason: "rebalance", timestamp: "2026-03-01T14:25:30Z" },
  { id: 12, vmHash: "vm25a6b7c8d9e0", nodeHash: "f6a7b8c9d0e1", action: "migrated_to", reason: "rebalance", timestamp: "2026-03-01T14:25:30Z" },
  { id: 13, vmHash: "vm35e6f7a8b9c0", nodeHash: "a3b4c5d6e7f8", action: "scheduled", reason: null, timestamp: "2026-03-01T14:25:00Z" },
  { id: 14, vmHash: "vm32b3c4d5e6f7", nodeHash: "d0e1f2a3b4c5", action: "scheduled", reason: null, timestamp: "2026-03-01T14:24:30Z" },
  { id: 15, vmHash: "vm03c4d5e6f7a8", nodeHash: "a1b2c3d4e5f6", action: "scheduled", reason: null, timestamp: "2026-03-01T14:24:00Z" },
  { id: 16, vmHash: "vm08b9c0d1e2f3", nodeHash: "d0e1f2a3b4c5", action: "migrated_from", reason: "NodeUnhealthy", timestamp: "2026-03-01T14:23:30Z" },
  { id: 17, vmHash: "vm08b9c0d1e2f3", nodeHash: "b2c3d4e5f6a7", action: "migrated_to", reason: "NodeUnhealthy", timestamp: "2026-03-01T14:23:30Z" },
  { id: 18, vmHash: "vm19a0b1c2d3e4", nodeHash: "e5f6a7b8c9d0", action: "scheduled", reason: null, timestamp: "2026-03-01T14:23:00Z" },
  { id: 19, vmHash: "vm33c4d5e6f7a8", nodeHash: "e1f2a3b4c5d6", action: "scheduled", reason: null, timestamp: "2026-03-01T14:22:30Z" },
  { id: 20, vmHash: "vm36f7a8b9c0d1", nodeHash: "b4c5d6e7f8a9", action: "scheduled", reason: null, timestamp: "2026-03-01T14:22:00Z" },
  { id: 21, vmHash: "vm04d5e6f7a8b9", nodeHash: "a1b2c3d4e5f6", action: "scheduled", reason: null, timestamp: "2026-03-01T14:21:30Z" },
  { id: 22, vmHash: "vm09c0d1e2f3a4", nodeHash: "b2c3d4e5f6a7", action: "scheduled", reason: null, timestamp: "2026-03-01T14:21:00Z" },
  { id: 23, vmHash: "vm15c6d7e8f9a0", nodeHash: "c3d4e5f6a7b8", action: "scheduled", reason: null, timestamp: "2026-03-01T14:20:30Z" },
  { id: 24, vmHash: "vm17e8f9a0b1c2", nodeHash: "d4e5f6a7b8c9", action: "scheduled", reason: null, timestamp: "2026-03-01T14:20:00Z" },
  { id: 25, vmHash: "vm37a8b9c0d1e2", nodeHash: "e1f2a3b4c5d6", action: "scheduled", reason: null, timestamp: "2026-03-01T14:19:30Z" },
  { id: 26, vmHash: "vm20b1c2d3e4f5", nodeHash: "e5f6a7b8c9d0", action: "scheduled", reason: null, timestamp: "2026-03-01T14:19:00Z" },
  { id: 27, vmHash: "vm10d1e2f3a4b5", nodeHash: "b2c3d4e5f6a7", action: "scheduled", reason: null, timestamp: "2026-03-01T14:18:30Z" },
  { id: 28, vmHash: "vm11e2f3a4b5c6", nodeHash: "b2c3d4e5f6a7", action: "scheduled", reason: null, timestamp: "2026-03-01T14:18:00Z" },
  { id: 29, vmHash: "vm21c2d3e4f5a6", nodeHash: "e5f6a7b8c9d0", action: "scheduled", reason: null, timestamp: "2026-03-01T14:17:30Z" },
  { id: 30, vmHash: "vm05e6f7a8b9c0", nodeHash: "a1b2c3d4e5f6", action: "scheduled", reason: null, timestamp: "2026-03-01T14:17:00Z" },
  { id: 31, vmHash: "vm16d7e8f9a0b1", nodeHash: "c3d4e5f6a7b8", action: "scheduled", reason: null, timestamp: "2026-03-01T14:16:30Z" },
  { id: 32, vmHash: "vm18f9a0b1c2d3", nodeHash: "d4e5f6a7b8c9", action: "scheduled", reason: null, timestamp: "2026-03-01T14:16:00Z" },
  { id: 33, vmHash: "vm22d3e4f5a6b7", nodeHash: "e5f6a7b8c9d0", action: "scheduled", reason: null, timestamp: "2026-03-01T14:15:30Z" },
  { id: 34, vmHash: "vm12f3a4b5c6d7", nodeHash: "b2c3d4e5f6a7", action: "scheduled", reason: null, timestamp: "2026-03-01T14:15:00Z" },
  { id: 35, vmHash: "vm23e4f5a6b7c8", nodeHash: "e5f6a7b8c9d0", action: "scheduled", reason: null, timestamp: "2026-03-01T14:14:30Z" },
  { id: 36, vmHash: "vm13a4b5c6d7e8", nodeHash: "b2c3d4e5f6a7", action: "scheduled", reason: null, timestamp: "2026-03-01T14:14:00Z" },
  { id: 37, vmHash: "vm24f5a6b7c8d9", nodeHash: "e5f6a7b8c9d0", action: "scheduled", reason: null, timestamp: "2026-03-01T14:13:30Z" },
  { id: 38, vmHash: "vm26b7c8d9e0f1", nodeHash: "f6a7b8c9d0e1", action: "scheduled", reason: null, timestamp: "2026-03-01T14:13:00Z" },
  { id: 39, vmHash: "vm27c8d9e0f1a2", nodeHash: "a7b8c9d0e1f2", action: "scheduled", reason: null, timestamp: "2026-03-01T14:12:30Z" },
  { id: 40, vmHash: "vm41e2f3a4b5c6", nodeHash: "c9d0e1f2a3b4", action: "unscheduled", reason: "NodeDeleted", timestamp: "2026-03-01T14:12:00Z" },
];

// --- Overview Stats (computed from arrays) ---

export const mockOverviewStats: OverviewStats = {
  totalNodes: mockNodes.length,
  healthyNodes: mockNodes.filter((n) => n.status === "healthy")
    .length,
  unreachableNodes: mockNodes.filter(
    (n) => n.status === "unreachable",
  ).length,
  unknownNodes: mockNodes.filter((n) => n.status === "unknown")
    .length,
  totalVMs: mockVMs.length,
  scheduledVMs: mockVMs.filter((v) => v.status === "scheduled")
    .length,
  orphanedVMs: mockVMs.filter((v) => v.status === "orphaned")
    .length,
  missingVMs: mockVMs.filter((v) => v.status === "missing").length,
  unschedulableVMs: mockVMs.filter(
    (v) => v.status === "unschedulable",
  ).length,
  totalVcpusAllocated: mockVMs
    .filter((v) => v.status === "scheduled")
    .reduce((sum, v) => sum + (v.requirements.vcpus ?? 0), 0),
  totalVcpusCapacity: mockNodes
    .filter((n) => n.status === "healthy")
    .reduce((sum, n) => sum + (n.resources?.vcpusTotal ?? 0), 0),
};

// --- Detail helpers ---

export function getMockNodeDetail(hash: string): NodeDetail {
  const node = mockNodes.find((n) => n.hash === hash);
  if (!node) {
    throw new Error(`Mock node not found: ${hash}`);
  }
  const vms = mockVMs.filter((v) => v.allocatedNode === hash);
  const history = mockHistory.filter(
    (h) => h.nodeHash === hash,
  );
  return { ...node, vms, history };
}

export function getMockVMDetail(hash: string): VmDetail {
  const vm = mockVMs.find((v) => v.hash === hash);
  if (!vm) {
    throw new Error(`Mock VM not found: ${hash}`);
  }
  const history = mockHistory.filter(
    (h) => h.vmHash === hash,
  );
  return { ...vm, history };
}

// --- VM Creation Times (mock api2 data) ---

export const mockVMCreationTimes: Map<string, number> = new Map(
  mockVMs.map((vm, i) => [
    vm.hash,
    // Stagger by 1 hour each, most recent first
    Math.floor(Date.now() / 1000) - i * 3600,
  ]),
);
