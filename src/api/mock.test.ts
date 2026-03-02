import { describe, expect, it } from "vitest";
import { mockStatsHistory } from "@/api/mock";

describe("mockStatsHistory", () => {
  it("contains 24 hourly data points", () => {
    expect(mockStatsHistory).toHaveLength(24);
  });

  it("has timestamps in chronological order", () => {
    for (let i = 1; i < mockStatsHistory.length; i++) {
      const prev = new Date(mockStatsHistory[i - 1]!.timestamp);
      const curr = new Date(mockStatsHistory[i]!.timestamp);
      expect(curr.getTime()).toBeGreaterThan(prev.getTime());
    }
  });

  it("has internally consistent counts", () => {
    for (const snapshot of mockStatsHistory) {
      expect(snapshot.totalNodes).toBe(
        snapshot.healthyNodes +
          snapshot.degradedNodes +
          snapshot.offlineNodes,
      );
    }
  });
});
